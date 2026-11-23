import { supabase, createIsolatedClient } from './supabaseClient';

/** Staff portal data layer. Every call goes through a database function that returns only the signed-in staff member's own data. */

export interface StaffProfile {
    id: string;
    display_name: string;
    staff_code: string;
    slug: string;
    role: string | null;
    agent_type?: 'student_agent' | 'field_only';
    can_supervise_agents?: boolean;
}
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
export interface LeaderRow { id: string; display_name: string; registered?: number; signups: number; started?: number; completed: number; points: number; is_me: boolean; }

export interface RegisterInput {
    name: string;
    email: string;
    phone: string;
    courseTitle: string;
    courseSlug: string | null;
    campaign: string;
    notes: string;
    location: string;
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
        p_consent: input.consent,
        p_location: input.location || null
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

/**
 * Send queued registrations. A saved entry is only dropped when the server gives a clear answer about THAT student
 * (registered, or a real duplicate / invalid detail). Anything else (signed out, server error, no signal) keeps the entry
 * on the phone so it is retried, instead of being lost.
 */
export async function flushRegistrationQueue(): Promise<{ sent: number; rejected: { name: string; reason: string }[]; remaining: number }> {
    const q = readQueue();
    if (q.length === 0) return { sent: 0, rejected: [], remaining: 0 };
    const keep: RegisterInput[] = [];
    const rejected: { name: string; reason: string }[] = [];
    let sent = 0;
    for (const item of q) {
        try {
            const r = await callRegister(item);
            if (r.ok) sent++;
            else if (r.code === 'duplicate' || r.code === 'invalid' || r.code === 'has_account') rejected.push({ name: item.name, reason: r.message || 'Could not be added.' });
            else keep.push(item);
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


// ---------------------------------------------------------------------------
// Funnel (registered -> account -> recorded -> live -> completed)
// ---------------------------------------------------------------------------
export interface StaffFunnel {
    clicks: number; registered: number; accounts: number; enrolled: number; recorded: number; live: number; completed: number; active_7d: number;
    by_course: Record<string, number>; by_location: Record<string, number>; daily: number[];
}
export const sinceFor = (days: number | null): string | null => (days ? new Date(Date.now() - days * 86400000).toISOString() : null);
export async function loadMyFunnel(days: number | null = null): Promise<StaffFunnel | null> {
    const { data, error } = await supabase.rpc('staff_my_funnel', { p_since: sinceFor(days) });
    if (error) return null;
    return data as StaffFunnel;
}

/** Quick sign-up page for one agent: /join/<slug> */
export const joinLink = (slug: string) => `${window.location.origin}/join/${slug}`;

// ---------------------------------------------------------------------------
// Create a client's account with a temporary password (client must choose their own on first sign-in)
// ---------------------------------------------------------------------------
export const generateTempPassword = (): string => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
    const word = Array.from({ length: 6 }, () => pick(letters)).join('');
    return `${word}-${Array.from({ length: 4 }, () => pick(digits)).join('')}`;
};

export interface CreateAccountResult { ok: boolean; code?: 'exists' | 'weak' | 'error'; message?: string; }
export async function createClientAccount(input: { email: string; password: string; name: string; phone: string; courseSlug: string | null; staffSlug: string; location?: string }): Promise<CreateAccountResult> {
    if (input.password.length < 8) return { ok: false, code: 'weak', message: 'The temporary password must be at least 8 characters.' };
    const client = createIsolatedClient();
    const email = input.email.trim().toLowerCase();
    const { data, error } = await client.auth.signUp({
        email,
        password: input.password,
        options: {
            emailRedirectTo: `${window.location.origin}/continue`,
            data: {
                full_name: input.name,
                phone: input.phone,
                ...(input.location ? { location: input.location } : {}),
                signup_source: 'agent_created',
                must_change_password: true,
                ref_code: input.staffSlug,
                ...(input.courseSlug ? { enroll_course: input.courseSlug } : {})
            }
        }
    });
    if (error) {
        if (/already|registered|exists/i.test(error.message)) return { ok: false, code: 'exists', message: 'This email already has an account.' };
        return { ok: false, code: 'error', message: error.message };
    }
    if (data?.user && (!data.user.identities || data.user.identities.length === 0)) return { ok: false, code: 'exists', message: 'This email already has an account.' };
    return { ok: true };
}

export const clientCredentialsMessage = (name: string, email: string, tempPassword: string) =>
    `Hello ${name.split(' ')[0]}, your Welile School of AI account is ready.\n\n1. Check your email and tap the confirmation link.\n2. Sign in at ${window.location.origin}/login\nEmail: ${email}\nTemporary password: ${tempPassword}\n\nYou will be asked to choose your own password. Your free AI Fundamentals course opens straight away. Live classes are Monday, Wednesday and Friday at 2:00 pm.`;

// ---------------------------------------------------------------------------
// Supervisor onboarding: Create a Field-Only Agent (not a student)
// ---------------------------------------------------------------------------
export interface CreateFieldAgentInput {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    password: string;
}

export interface CreateFieldAgentResult {
    ok: boolean;
    message?: string;
    id?: string;
    slug?: string;
    staff_code?: string;
    name?: string;
    email?: string;
}

export async function createFieldOnlyAgent(input: CreateFieldAgentInput): Promise<CreateFieldAgentResult> {
    const cleanName = input.name.trim();
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhone = (input.phone || '').trim();
    const cleanRole = (input.role || 'Field Agent').trim() || 'Field Agent';

    if (cleanName.length < 2) return { ok: false, message: 'Please enter the agent\'s full name.' };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) return { ok: false, message: 'Please enter a valid email address.' };
    if (input.password.length < 8) return { ok: false, message: 'Temporary password must be at least 8 characters.' };

    // 1. Create Auth account via isolated client (never signs out the supervisor)
    const isolated = createIsolatedClient();
    const { data: signUpData, error: signUpErr } = await isolated.auth.signUp({
        email: cleanEmail,
        password: input.password,
        options: {
            data: {
                full_name: cleanName,
                ...(cleanPhone ? { phone: cleanPhone } : {}),
                signup_source: 'supervisor_field_agent',
                is_field_only: true,
                must_change_password: true,
            },
        },
    });

    if (signUpErr) {
        if (/already|registered|exists/i.test(signUpErr.message)) {
            return { ok: false, message: 'That email already has an account in the system. Use a fresh email for a non-student field agent, or make them a student-agent in Admin → Staff & Links.' };
        }
        return { ok: false, message: signUpErr.message };
    }
    if (signUpData?.user && (!signUpData.user.identities || signUpData.user.identities.length === 0)) {
        return { ok: false, message: 'That email already has an account in the system. Use a different email for a non-student field agent.' };
    }

    // 2. Confirm email & link as field_only agent via supervisor RPC
    const { data, error } = await supabase.rpc('supervisor_finalize_field_agent', {
        p_email: cleanEmail,
        p_name: cleanName,
        p_phone: cleanPhone || null,
        p_role: cleanRole,
    });
    if (error) return { ok: false, message: error.message };
    const d: any = data || {};
    if (!d.ok) return { ok: false, message: d.message || 'Could not finalize field agent.' };
    return {
        ok: true,
        id: d.id,
        slug: d.slug,
        staff_code: d.staff_code,
        name: d.name || cleanName,
        email: d.email || cleanEmail,
    };
}

export const fieldAgentCredentialsMessage = (name: string, email: string, tempPassword: string, staffCode?: string) =>
    `Hello ${name.split(' ')[0]}, your Welile School of AI Field Agent account is ready.\n\nSign in at: ${window.location.origin}/login\nEmail: ${email}\nTemporary password: ${tempPassword}${staffCode ? `\nAgent Code: ${staffCode}` : ''}\n\nYou will be asked to choose your own password on first sign-in. Once inside, you can start registering students right away (Name, Phone Number, and Location).`;
