// One place that decides what every "people" number on the admin means.
// Today, Dashboard, People and the person-by-person list all read from here, so the same number never differs between pages.
//
// The model (from the school's own way of working):
//   REGISTERED  = everyone we know about, once each (the roster is already de-duplicated by email, or by phone when there is no email).
//   Registered splits by whether we have an EMAIL:
//     ONLINE route    = has an email (or already has an account). They can study online or on recorded lessons.
//         HAS AN ACCOUNT  = already signed up. Their journey is exclusive: Not started, Studying, Joined a live class, Completed.
//         INVITE PENDING  = has an email but no account yet: we email them an invitation.
//     CALL route      = registered WITHOUT an email (an agent registered them by phone). Staff must call them to choose a path:
//                       study online, study recorded lessons, or attend physical lessons at HQ.
//   PAID = people with a paid course enrolment. It is the conversion outcome, counted separately (it is not a stage in the journey).
import { supabaseClient } from './supabaseClient';
import type { StudentRow } from '../components/admin/AdminRegistrationPipeline';

export type PersonRow = StudentRow;

export const FREE_COURSE_TITLE = 'AI Fundamentals (free)';

/** Everyone on the platform as one list: the free-course roster merged with people in other courses and paid enrolments. */
export async function loadPeople(courseSlug = 'ai-fundamentals'): Promise<{ rows: PersonRow[]; error: string | null }> {
    let res = await supabaseClient.rpc('admin_course_stage_students', { p_course: courseSlug });
    if (res.error) res = await supabaseClient.rpc('admin_registration_pipeline', { p_course: courseSlug });
    if (res.error) return { rows: [], error: res.error.message };
    const free = ((res.data || []) as PersonRow[]).map(r => ({ ...r, courses: [FREE_COURSE_TITLE] }));
    const other = await supabaseClient.rpc('admin_other_people');
    const byKey = new Map<string, PersonRow>(free.map(r => [r.key, r] as [string, PersonRow]));
    const merged: PersonRow[] = [...free];
    if (!other.error) {
        ((other.data || []) as PersonRow[]).forEach(o => {
            const hit = byKey.get(o.key);
            if (hit) {
                hit.courses = Array.from(new Set([...(hit.courses || []), ...(o.courses || [])]));
                hit.paid_enrolled = hit.paid_enrolled || o.paid_enrolled;
            } else { merged.push(o); byKey.set(o.key, o); }
        });
    }
    return { rows: merged.sort((a, b) => (a.registered_at < b.registered_at ? 1 : -1)), error: null };
}

// ---------- Plain-English definitions, reused as helper text on every screen ----------

export type GroupId = 'all' | 'online' | 'call' | 'invite' | 'account' | 'notStarted' | 'studying' | 'live' | 'completed' | 'paid';

export const GLOSSARY: Record<GroupId, { label: string; definition: string }> = {
    all: { label: 'Registered', definition: 'Everyone we know about, counted once. Registered = Online + Needs a call.' },
    online: { label: 'Online (has email)', definition: 'We have their email, so they can study online or on recorded lessons.' },
    call: { label: 'Needs a call (no email)', definition: 'Registered by an agent with no email. Staff call them to choose: study online, recorded lessons, or physical lessons at HQ.' },
    invite: { label: 'Invite pending', definition: 'Has an email but no account yet. We email them an invitation to sign up.' },
    account: { label: 'Has an account', definition: 'Already signed up. Online = Has an account + Invite pending.' },
    notStarted: { label: 'Not started', definition: 'Has an account but has not completed a lesson yet.' },
    studying: { label: 'Studying', definition: 'Started lessons and has not yet joined a live class or finished. Each person is in exactly one of: Not started, Studying, Joined a live class, Completed.' },
    live: { label: 'Joined a live class', definition: 'Attended at least one live class and has not completed the course yet.' },
    completed: { label: 'Completed', definition: 'Finished the course and holds a certificate.' },
    paid: { label: 'Paid', definition: 'Has a paid course enrolment. This is the conversion goal, counted on its own.' },
};

/** Tab order for the person-by-person list: routes first, then the journey, then paid. */
export const GROUP_ORDER: GroupId[] = ['all', 'online', 'call', 'invite', 'account', 'notStarted', 'studying', 'live', 'completed', 'paid'];

// ---------- Row rules (one definition each) ----------

type Lite = Pick<PersonRow, 'email' | 'has_account' | 'stage' | 'followup' | 'live_count' | 'certificate_id' | 'paid_enrolled'>;

/** Email present = a non-empty value after trimming spaces. */
export const hasEmail = (r: Pick<PersonRow, 'email'>) => !!(r.email && r.email.trim());

/** Online route: we have an email, or they already have an account. Everyone else needs a call. */
export const isOnline = (r: Lite) => hasEmail(r) || !!r.has_account;

export type Journey = 'notStarted' | 'studying' | 'live' | 'completed';

/** Where an account holder is in the journey. Exclusive: the order of the checks decides, so the four always add up. Null when there is no account. */
export function journeyOf(r: Lite): Journey | null {
    if (!r.has_account) return null;
    if (r.stage === 'Completed' || !!r.certificate_id) return 'completed';
    if ((r.live_count || 0) > 0 || r.stage === 'Joined live') return 'live';
    if (r.stage === 'Studying' || r.stage === 'Passed final') return 'studying';
    return 'notStarted';
}

/** True when the person belongs in this group. The tab counts, the list and the tiles all use this. */
export function inGroup(r: Lite, id: GroupId): boolean {
    switch (id) {
        case 'all': return true;
        case 'online': return isOnline(r);
        case 'call': return !isOnline(r);
        case 'invite': return isOnline(r) && !r.has_account;
        case 'account': return !!r.has_account;
        case 'notStarted': return journeyOf(r) === 'notStarted';
        case 'studying': return journeyOf(r) === 'studying';
        case 'live': return journeyOf(r) === 'live';
        case 'completed': return journeyOf(r) === 'completed';
        case 'paid': return !!r.paid_enrolled;
        default: return true;
    }
}

/** The one status label shown on a person's row. */
export function rowLabel(r: Lite): string {
    const j = journeyOf(r);
    if (j) return GLOSSARY[j].label;
    return isOnline(r) ? GLOSSARY.invite.label : GLOSSARY.call.label;
}

/** Old links used ?stage=Registered, Studying ... and new links use group ids. Returns a group id, or null if unknown. */
export function normalizeGroup(raw: string | null, route?: string | null): GroupId | null {
    const v = (route || raw || '').trim();
    if (!v) return null;
    if ((GROUP_ORDER as string[]).includes(v)) return v as GroupId;
    const legacy: Record<string, GroupId> = {
        'Registered': 'invite', 'Account opened': 'notStarted', 'In course': 'notStarted', 'Studying': 'studying',
        'Joined live': 'live', 'Passed final': 'studying', 'Completed': 'completed',
    };
    return legacy[v] || null;
}

// ---------- The numbers ----------

export interface PeopleMetrics {
    /** Everyone, once each. */
    registered: number;
    /** Online route: has an email (or already an account). Same as `hasEmail`. */
    online: number;
    hasEmail: number;
    /** Needs a call: registered with no email. Same as `noEmail`. */
    needsCall: number;
    noEmail: number;
    /** Has an account. */
    hasAccount: number;
    /** Email but no account yet. */
    invitePending: number;
    /** Account holders by journey (these four add up to hasAccount). */
    notStarted: number;
    studying: number;
    joinedLive: number;
    completed: number;
    /** People with a paid enrolment (conversion outcome, counted on its own). */
    paid: number;
    /** Follow-up status of the people who need a call. */
    followUpNew: number;
    followUpContacted: number;
    followUpInterested: number;
    followUpConverted: number;
    followUpNotInterested: number;
}

export function computePeopleMetrics(rows: Lite[]): PeopleMetrics {
    const m: PeopleMetrics = {
        registered: rows.length, online: 0, hasEmail: 0, needsCall: 0, noEmail: 0, hasAccount: 0, invitePending: 0,
        notStarted: 0, studying: 0, joinedLive: 0, completed: 0, paid: 0,
        followUpNew: 0, followUpContacted: 0, followUpInterested: 0, followUpConverted: 0, followUpNotInterested: 0,
    };
    for (const r of rows) {
        if (r.paid_enrolled) m.paid++;
        if (isOnline(r)) {
            m.online++;
            if (r.has_account) {
                m.hasAccount++;
                const j = journeyOf(r);
                if (j === 'completed') m.completed++;
                else if (j === 'live') m.joinedLive++;
                else if (j === 'studying') m.studying++;
                else m.notStarted++;
            } else m.invitePending++;
        } else {
            m.needsCall++;
            const f = r.followup || 'new';
            if (f === 'new') m.followUpNew++;
            else if (f === 'contacted') m.followUpContacted++;
            else if (f === 'interested') m.followUpInterested++;
            else if (f === 'converted') m.followUpConverted++;
            else if (f === 'not_interested') m.followUpNotInterested++;
        }
    }
    m.hasEmail = m.online;
    m.noEmail = m.needsCall;
    return m;
}

export const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

// ---------- Time windows ----------

/** Calendar day in Kampala (UTC+3) as YYYY-MM-DD. "Today" always means this. */
export const kampalaDay = (iso: string | number | Date) => new Date(new Date(iso).getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);

/** Registered today (Kampala calendar day). */
export const registeredToday = (rows: Pick<PersonRow, 'registered_at'>[]) => {
    const t = kampalaDay(Date.now());
    return rows.filter(r => kampalaDay(r.registered_at) === t).length;
};

/** Registered in the last 7 days (rolling: the last 7 x 24 hours). */
export const registeredLast7 = (rows: Pick<PersonRow, 'registered_at'>[]) => {
    const cutoff = Date.now() - 7 * 86400000;
    return rows.filter(r => new Date(r.registered_at).getTime() >= cutoff).length;
};

/** New registrations per Kampala calendar day for the last `days` days, oldest first. */
export const dailyRegistrations = (rows: Pick<PersonRow, 'registered_at'>[], days = 14) => {
    const c = new Map<string, number>();
    rows.forEach(r => { const d = kampalaDay(r.registered_at); c.set(d, (c.get(d) || 0) + 1); });
    const out: { d: string; n: number }[] = [];
    for (let i = days - 1; i >= 0; i--) { const d = kampalaDay(Date.now() - i * 86400000); out.push({ d, n: c.get(d) || 0 }); }
    return out;
};
