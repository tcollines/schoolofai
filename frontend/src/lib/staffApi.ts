import { supabase } from './supabaseClient';

/** Staff portal data layer. Every call goes through a database function that returns only the signed-in staff member's own data. */

export interface StaffProfile { id: string; display_name: string; staff_code: string; slug: string; role: string | null; }
export interface StaffStats {
    clicks: number; registered: number; signups: number; started: number; completed: number; points: number; rank: number; staff_total: number;
}
export interface StaffStudent {
    kind: 'assisted' | 'link';
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    course: string;
    registered_at: string;
    account_linked: boolean;
    items_done: number;
    last_active: string | null;
    completed: boolean;
}
export interface LeaderRow { id: string; display_name: string; signups: number; completed: number; points: number; is_me: boolean; }

export interface RegisterInput {
    name: string;
    email: string;
    phone: string;
    courseTitle: string;
    courseSlug: string | null;
    campaign: string;
    notes: string;
    consent: boolean;
}
export interface RegisterResult { ok: boolean; code?: string; message?: string; id?: string; slug?: string; phone?: string; queued?: boolean; }

export type ProfileState =
    | { status: 'ok'; profile: StaffProfile }
    | { status: 'not_staff' }
    | { status: 'missing' }
    | { status: 'error'; message: string };

const isNetwork = (msg: string) => /fetch|network|offline|failed to load/i.test(msg);
const isMissing = (err: any) => ['PGRST202', '42883', 'PGRST205'].includes(String(err?.code || '')) || /could not find the function/i.test(String(err?.message || ''));

export async function loadStaffProfile(): Promise<ProfileState> {
    const { data, error } = await supabase.rpc('staff_my_profile');
    if (error) {
        if (isMissing(error)) return { status: 'missing' };
        return { status: 'error', message: error.message };
    }
    if (!data) return { status: 'not_staff' };
    return { status: 'ok', profile: data as StaffProfile };
}

export async function loadStaffStats(): Promise<StaffStats> {
    const { data, error } = await supabase.rpc('staff_my_stats');
    if (error) throw new Error(error.message);
    return data as StaffStats;
}
export async function loadStaffStudents(): Promise<StaffStudent[]> {
    const { data, error } = await supabase.rpc('staff_my_students');
    if (error) throw new Error(error.message);
    return (data || []) as StaffStudent[];
}
export async function loadLeaderboard(): Promise<LeaderRow[]> {
    const { data, error } = await supabase.rpc('staff_leaderboard');
    if (error) throw new Error(error.message);
    return (data || []) as LeaderRow[];
}

// ---------------------------------------------------------------------------
// Registering students (works at event booths with a bad connection: entries wait in a queue)
// ---------------------------------------------------------------------------
const QUEUE_KEY = 'welile_staff_reg_queue_v1';
const readQueue = (): RegisterInput[] => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } };
const writeQueue = (q: RegisterInput[]) => { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* ignore */ } };
export const queuedCount = () => readQueue().length;

async function callRegister(input: RegisterInput): Promise<RegisterResult> {
    const { data, error } = await supabase.rpc('staff_register_student', {
        p_name: input.name,
        p_email: input.email || null,
        p_phone: input.phone,
        p_course_title: input.courseTitle,
        p_course_slug: input.courseSlug,
        p_campaign: input.campaign || null,
        p_notes: input.notes || null,
        p_consent: input.consent
    });
    if (error) {
        if (isNetwork(error.message || '')) throw new Error('NETWORK');
        return { ok: false, code: 'error', message: error.message };
    }
    const d: any = data || {};
    return { ok: !!d.ok, code: d.code, message: d.message, id: d.id, slug: d.slug, phone: d.phone };
}

export async function registerStudent(input: RegisterInput): Promise<RegisterResult> {
    try {
        return await callRegister(input);
    } catch (e: any) {
        if (e?.message !== 'NETWORK') throw e;
        const q = readQueue();
        q.push(input);
        writeQueue(q);
        return { ok: true, queued: true, message: 'No connection. Saved on this phone and will be sent automatically when you are online.' };
    }
}

/** Send queued registrations. Returns how many were sent and how many were rejected (duplicates etc). */
export async function flushRegistrationQueue(): Promise<{ sent: number; rejected: number; remaining: number }> {
    const q = readQueue();
    if (q.length === 0) return { sent: 0, rejected: 0, remaining: 0 };
    const keep: RegisterInput[] = [];
    let sent = 0, rejected = 0;
    for (const item of q) {
        try {
            const r = await callRegister(item);
            if (r.ok) sent++; else rejected++;
        } catch {
            keep.push(item);
        }
    }
    writeQueue(keep);
    return { sent, rejected, remaining: keep.length };
}

// ---------------------------------------------------------------------------
// Links and messages
// ---------------------------------------------------------------------------
export const staffLink = (slug: string, to?: string) => {
    const base = `${window.location.origin}/r/${slug}`;
    return to && to !== '/free/ai-fundamentals' ? `${base}?to=${encodeURIComponent(to)}` : base;
};

export const whatsappShare = (text: string, phone?: string | null) =>
    `https://wa.me/${phone ? phone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(text)}`;

export const startMessage = (studentName: string | null, link: string) =>
    `${studentName ? `Hello ${studentName.split(' ')[0]}, ` : 'Hello, '}study AI for free with Welile School of AI. It takes about 6 hours at your own pace, works on any phone, and you get a free certificate. Start here: ${link}`;
