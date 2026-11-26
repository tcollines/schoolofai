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
import type { LessonsFor } from './physicalAttendance';
import type { CallIndex } from './callLog';

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

export type GroupId = 'all' | 'online' | 'call' | 'invite' | 'account' | 'notStarted' | 'studying' | 'live' | 'completed' | 'paid' | 'hq' | 'hq3' | 'both' | 'notyet';

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
    hq: { label: 'Attended at HQ', definition: 'Attended at least one of the 3 physical lessons at HQ. Marked by staff when they follow someone up.' },
    hq3: { label: 'All 3 HQ lessons', definition: 'Attended all 3 physical lessons at HQ (together they cover Modules 1 to 6).' },
    both: { label: 'Both online and HQ', definition: 'Has started lessons online and has also attended at least one lesson at HQ.' },
    notyet: { label: 'Not started learning', definition: 'Has not started lessons online and has not attended any lesson at HQ yet.' },
};

/** Tab order for the person-by-person list: routes first, then the journey, then paid. */
export const GROUP_ORDER: GroupId[] = ['all', 'online', 'call', 'invite', 'account', 'notStarted', 'studying', 'live', 'completed', 'paid', 'hq', 'hq3', 'both', 'notyet'];

/** Groups that need the HQ attendance marks. Screens without those marks hide these groups. */
export const HQ_GROUPS: GroupId[] = ['hq', 'hq3', 'both', 'notyet'];

// ---------- Row rules (one definition each) ----------

type Lite = Pick<PersonRow, 'email' | 'has_account' | 'stage' | 'followup' | 'live_count' | 'certificate_id' | 'paid_enrolled'> & { key?: string; name?: string; phone?: string | null };

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

/** Has started learning online: an account with at least one lesson done, a live class joined, or finished. */
export const startedOnline = (r: Lite) => { const j = journeyOf(r); return j !== null && j !== 'notStarted'; };

/** True when the person belongs in this group. The tab counts, the list and the tiles all use this.
 *  `physical` finds a person's HQ lessons; without it the HQ groups are empty (and 'notyet' ignores HQ). */
export function inGroup(r: Lite, id: GroupId, physical?: LessonsFor): boolean {
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
        case 'hq': return hqLessons(r, physical).length > 0;
        case 'hq3': return hqLessons(r, physical).length >= 3;
        case 'both': return hqLessons(r, physical).length > 0 && startedOnline(r);
        case 'notyet': return !startedOnline(r) && hqLessons(r, physical).length === 0;
        default: return true;
    }
}

/** The HQ lessons (1 to 3) a person attended, or none when no attendance lookup is given. */
export const hqLessons = (r: Lite, physical?: LessonsFor): number[] => (physical ? physical({ key: r.key, name: r.name, email: r.email, phone: r.phone }) : []);

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
    /** Physical lessons at HQ (all zero when no attendance lookup is given). */
    physicalAny: number;
    physicalLesson1: number;
    physicalLesson2: number;
    physicalLesson3: number;
    physicalAll3: number;
    physicalTwoPlus: number;
    /** How people learn: online only, HQ only, both, or neither yet. These four add up to registered. */
    onlineOnly: number;
    physicalOnly: number;
    both: number;
    notYetAny: number;
    /** Calls (all zero when no call log is given). People are counted once, by their most recent call. */
    calledAny: number;
    /** Needs a call (no email) and never called. */
    notCalledYet: number;
    calledToday: number;
    calledThisWeek: number;
    reached: number;
    noAnswer: number;
    /** Last call has a follow-up date today or earlier and the person has not converted yet. */
    callBackDue: number;
    /** Reached people by what they chose to do next. */
    interestedByNextStep: { online: number; recorded: number; hq: number; paid: number };
    /** People who were called and are now converted, have an account, or attended at HQ. */
    convertedFromCalls: number;
    /** Per person who made calls: calls made, reached, and people who are now converted. */
    perCaller: { name: string; calls: number; reached: number; converted: number }[];
}

export function computePeopleMetrics(rows: Lite[], physical?: LessonsFor, calls?: CallIndex | null): PeopleMetrics {
    const m: PeopleMetrics = {
        registered: rows.length, online: 0, hasEmail: 0, needsCall: 0, noEmail: 0, hasAccount: 0, invitePending: 0,
        notStarted: 0, studying: 0, joinedLive: 0, completed: 0, paid: 0,
        followUpNew: 0, followUpContacted: 0, followUpInterested: 0, followUpConverted: 0, followUpNotInterested: 0,
        physicalAny: 0, physicalLesson1: 0, physicalLesson2: 0, physicalLesson3: 0, physicalAll3: 0, physicalTwoPlus: 0,
        onlineOnly: 0, physicalOnly: 0, both: 0, notYetAny: 0,
        calledAny: 0, notCalledYet: 0, calledToday: 0, calledThisWeek: 0, reached: 0, noAnswer: 0, callBackDue: 0,
        interestedByNextStep: { online: 0, recorded: 0, hq: 0, paid: 0 }, convertedFromCalls: 0, perCaller: [],
    };
    const today = kampalaDay(Date.now());
    const weekCutoff = Date.now() - 7 * 86400000;
    const callers = new Map<string, { name: string; calls: number; reached: number; converted: number }>();
    for (const r of rows) {
        if (r.paid_enrolled) m.paid++;
        const hq = hqLessons(r, physical);
        const online = startedOnline(r);
        if (hq.length > 0) {
            m.physicalAny++;
            if (hq.includes(1)) m.physicalLesson1++;
            if (hq.includes(2)) m.physicalLesson2++;
            if (hq.includes(3)) m.physicalLesson3++;
            if (hq.length >= 2) m.physicalTwoPlus++;
            if (hq.length >= 3) m.physicalAll3++;
            if (online) m.both++; else m.physicalOnly++;
        } else if (online) m.onlineOnly++;
        else m.notYetAny++;
        if (calls) {
            const mine = calls.all({ key: r.key, name: r.name, email: r.email, phone: r.phone });
            if (mine.length > 0) {
                const last = mine[0];
                const converted = r.followup === 'converted' || !!r.has_account || hq.length > 0;
                m.calledAny++;
                if (kampalaDay(last.called_at) === today) m.calledToday++;
                if (new Date(last.called_at).getTime() >= weekCutoff) m.calledThisWeek++;
                if (last.outcome === 'reached') {
                    m.reached++;
                    const n = last.next_step;
                    if (n === 'online' || n === 'recorded' || n === 'hq' || n === 'paid') m.interestedByNextStep[n]++;
                } else if (last.outcome === 'no_answer') m.noAnswer++;
                if (last.follow_up_on && last.follow_up_on <= today && !converted) m.callBackDue++;
                if (converted) m.convertedFromCalls++;
                const seen = new Set<string>();
                for (const c of mine) {
                    const name = (c.caller_name || '').trim() || 'Unknown';
                    const e = callers.get(name) || { name, calls: 0, reached: 0, converted: 0 };
                    e.calls++;
                    if (c.outcome === 'reached') e.reached++;
                    if (converted && !seen.has(name)) { e.converted++; seen.add(name); }
                    callers.set(name, e);
                }
            } else if (!isOnline(r)) m.notCalledYet++;
        }
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
    m.perCaller = [...callers.values()].sort((a, b) => b.calls - a.calls);
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
