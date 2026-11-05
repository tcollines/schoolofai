import { supabase } from './supabaseClient';

export const OUTREACH_QUEUE_KEY = 'outreach_pending_registrations';
export const OUTREACH_LOCAL_CACHE_KEY = 'outreach_registrations_local_cache';
export const OUTREACH_CAMPAIGNS_CACHE_KEY = 'welile_outreach_campaigns_v1';

export interface OutreachCampaign {
    id: string;
    name: string;
    date: string;
    location: string;
    category: 'OUTREACH' | 'GENERAL';
    isActive: boolean;
    isDefault?: boolean;
}

export const DEFAULT_OUTREACH_CAMPAIGNS: OutreachCampaign[] = [
    {
        id: 'nkumba-2026-11-06',
        name: 'Nkumba University Outreach (Fri, 6th Nov 2026)',
        date: '2026-11-06',
        location: 'Nkumba University, Entebbe',
        category: 'OUTREACH',
        isActive: true,
        isDefault: true
    },
    {
        id: 'general-website',
        name: 'General / Website Registration',
        date: '2026-11-05',
        location: 'Online / Direct Portal',
        category: 'GENERAL',
        isActive: true,
        isDefault: false
    },
    {
        id: 'katabi-walkin',
        name: 'Katabi Campus Walk-in (Entebbe)',
        date: '2026-11-05',
        location: 'Katabi, Entebbe Campus',
        category: 'GENERAL',
        isActive: true,
        isDefault: false
    },
    {
        id: 'makerere-nov-2026',
        name: 'Makerere Career Fair Nov 2026',
        date: '2026-11-14',
        location: 'Makerere University, Kampala',
        category: 'OUTREACH',
        isActive: true,
        isDefault: false
    }
];

export interface OutreachRegistrationPayload {
    id?: string;
    created_at?: string;
    registration_date?: string;
    student_reg_no?: string;

    // 1. STUDENT INFORMATION
    full_name: string;
    email?: string | null;
    phone: string;
    class_level_year?: string | null;
    age_range?: string | null;
    guardian_name?: string | null;
    guardian_phone?: string | null;
    location?: string | null;

    // 2. COURSE & PROGRAMME INFORMATION
    course_interest: string;
    level?: string | null;
    mode_of_study_text?: string | null;
    mode_preference?: string | null;
    expected_start_date?: string | null;
    expected_completion_date?: string | null;

    // 3. STUDY SCHEDULE
    preferred_study_days?: string[];
    preferred_time_slot?: string | null;
    study_hours_per_session?: string | null;
    sessions_per_week?: string | null;
    alternative_study_time?: string | null;

    // 4. FEES & PAYMENT AGREEMENT
    total_course_fee?: number;
    registration_fee?: string;
    amount_paid?: number;
    outstanding_balance?: number;
    payment_plan?: string;
    agreed_payment_amount?: number;
    next_payment_date?: string | null;
    payment_due_date?: string | null;
    payment_method?: string;
    payment_reference?: string | null;

    // 5, 6, 7. STUDENT COMMITMENT, DECLARATION & GUARDIAN CONSENT
    commitments_accepted?: boolean;
    commitments_list?: string[];
    student_signature?: string | null;
    student_declaration_date?: string | null;
    guardian_signature?: string | null;
    guardian_consent_date?: string | null;
    consent_contact: boolean;

    // ATTRIBUTION
    how_heard?: string | null;
    outreach_event?: string | null;

    // 8. SCHOOL / ADMINISTRATION USE ONLY
    status?: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'NOT_INTERESTED';
    approved_by?: string | null;
    approver_position?: string | null;
    assigned_instructor?: string | null;
    confirmed_schedule?: string | null;
    admin_payment_status?: 'Fully Paid' | 'Partially Paid' | 'Payment Plan' | 'Pending' | string;
    admin_signature_date?: string | null;
    admin_remarks?: string | null;
    admin_notes?: string | null;
    converted_profile_id?: string | null;
    submitted_from?: 'web' | 'offline-sync';
}

export function generateStudentRegNo(seqHint?: number): string {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const num = seqHint
        ? String(seqHint).padStart(3, '0')
        : String(Math.floor(100 + Math.random() * 900));
    return `WSI/${mm}/${yy}/${num}`;
}

export async function fetchOutreachCampaigns(): Promise<OutreachCampaign[]> {
    try {
        // 1. Try `outreach_campaigns` table if present
        const { data: campData, error: campErr } = await supabase
            .from('outreach_campaigns')
            .select('*')
            .order('created_at', { ascending: true });

        if (!campErr && campData && campData.length > 0) {
            const mapped: OutreachCampaign[] = campData.map((c: any) => ({
                id: String(c.id),
                name: c.name,
                date: c.event_date || '2026-11-06',
                location: c.location || 'Entebbe / Kampala',
                category: (c.name || '').toLowerCase().includes('general') || (c.name || '').toLowerCase().includes('walk-in')
                    ? 'GENERAL'
                    : 'OUTREACH',
                isActive: c.is_active !== false,
                isDefault: Boolean(c.is_default)
            }));
            localStorage.setItem(OUTREACH_CAMPAIGNS_CACHE_KEY, JSON.stringify(mapped));
            return mapped;
        }

        // 2. Fallback: check `mails` table for stored OUTREACH_CAMPAIGNS_CONFIG record
        const { data: mailConfig } = await supabase
            .from('mails')
            .select('id, message')
            .eq('email', 'outreach-config@system.welile.com')
            .limit(1);

        if (mailConfig && mailConfig.length > 0 && mailConfig[0].message) {
            const match = mailConfig[0].message.match(/<!--CAMPAIGNS_JSON:([\s\S]+?)-->/);
            if (match && match[1]) {
                const parsed = JSON.parse(match[1]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    localStorage.setItem(OUTREACH_CAMPAIGNS_CACHE_KEY, JSON.stringify(parsed));
                    return parsed;
                }
            }
        }
    } catch {
        // ignore network errors and use local cache / defaults
    }

    try {
        const cached = localStorage.getItem(OUTREACH_CAMPAIGNS_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {
        // ignore
    }

    return DEFAULT_OUTREACH_CAMPAIGNS;
}

export async function saveOutreachCampaigns(campaigns: OutreachCampaign[]): Promise<void> {
    try {
        localStorage.setItem(OUTREACH_CAMPAIGNS_CACHE_KEY, JSON.stringify(campaigns));
    } catch {
        // ignore
    }

    try {
        const jsonStr = JSON.stringify(campaigns);
        const msg = `[System Outreach Campaigns Configuration]\n<!--CAMPAIGNS_JSON:${jsonStr}-->`;
        const { data: existing } = await supabase
            .from('mails')
            .select('id')
            .eq('email', 'outreach-config@system.welile.com');

        if (existing && existing.length > 0) {
            await supabase
                .from('mails')
                .update({ message: msg })
                .eq('id', existing[0].id);
        } else {
            await supabase.from('mails').insert({
                name: 'Outreach Campaigns Config',
                email: 'outreach-config@system.welile.com',
                message: msg,
                type: 'SYSTEM_CONFIG'
            });
        }
    } catch (e) {
        console.warn('Could not persist outreach campaigns to Supabase:', e);
    }
}

export function getQueuedOutreachRegistrations(): OutreachRegistrationPayload[] {
    try {
        const raw = localStorage.getItem(OUTREACH_QUEUE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function setQueuedOutreachRegistrations(items: OutreachRegistrationPayload[]): void {
    try {
        localStorage.setItem(OUTREACH_QUEUE_KEY, JSON.stringify(items));
    } catch (e) {
        console.warn('Could not write outreach queue to localStorage:', e);
    }
}

export function enqueueOutreachRegistration(item: OutreachRegistrationPayload): OutreachRegistrationPayload {
    const queued = getQueuedOutreachRegistrations();
    const record: OutreachRegistrationPayload = {
        ...item,
        id: item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `outreach-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        created_at: item.created_at || new Date().toISOString(),
        status: item.status || 'NEW'
    };
    const filtered = queued.filter(q => q.id !== record.id);
    setQueuedOutreachRegistrations([...filtered, record]);
    return record;
}

export function removeQueuedOutreachRegistration(id: string): void {
    const queued = getQueuedOutreachRegistrations();
    setQueuedOutreachRegistrations(queued.filter(q => q.id !== id));
}

export async function logOutreachToMails(record: OutreachRegistrationPayload): Promise<boolean> {
    try {
        const scheduleSummary = [
            record.mode_preference ? `Mode: ${record.mode_preference}` : null,
            record.preferred_study_days && record.preferred_study_days.length > 0
                ? `Days: ${record.preferred_study_days.join(', ')}`
                : null,
            record.preferred_time_slot ? `Time: ${record.preferred_time_slot}` : null,
            record.study_hours_per_session ? `Session: ${record.study_hours_per_session}` : null
        ].filter(Boolean).join(' | ');

        const paymentSummary = [
            `Total Fee: UGX ${(record.total_course_fee ?? 600000).toLocaleString()}`,
            `Paid: UGX ${(record.amount_paid ?? 0).toLocaleString()}`,
            `Balance: UGX ${(record.outstanding_balance ?? 600000).toLocaleString()}`,
            `Plan: ${record.payment_plan || 'Monthly'} (${record.payment_method || 'Mobile Money'})`
        ].join(' | ');

        const guardianSummary = record.guardian_name
            ? `\nGuardian: ${record.guardian_name} (${record.guardian_phone || 'N/A'})`
            : '';

        const structuredJson = JSON.stringify({
            ...record,
            id: record.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `outreach-${Date.now()}`),
            created_at: record.created_at || new Date().toISOString(),
            status: record.status || 'NEW'
        });

        const message = [
            `[Welile Student Registration & Payment Agreement — ${record.student_reg_no || 'WSI'}]`,
            `Outreach / Channel: ${record.outreach_event || 'Nkumba University Outreach (Fri, 6th Nov 2026)'}`,
            `Name: ${record.full_name} (${record.class_level_year || record.age_range || 'Student'})`,
            `Phone: ${record.phone}${record.email ? ` | Email: ${record.email}` : ''}`,
            `Course: ${record.course_interest} — Level: ${record.level || 'Intermediate'}`,
            scheduleSummary || null,
            paymentSummary,
            `Signed by: ${record.student_signature || record.full_name} on ${record.registration_date || new Date().toISOString().split('T')[0]}`,
            guardianSummary ? guardianSummary.trim() : null,
            `<!--OUTREACH_JSON:${structuredJson}-->`
        ].filter(Boolean).join('\n');

        const { error } = await supabase.from('mails').insert({
            name: record.full_name,
            email: record.email || record.phone,
            message,
            type: 'ENROLLMENT'
        });
        if (error) throw error;
        window.dispatchEvent(new Event('new-mail-notification'));
        return true;
    } catch (e) {
        console.warn('Could not log outreach registration to mails table:', e);
        return false;
    }
}

export async function insertOutreachRegistrationLive(payload: OutreachRegistrationPayload): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Browser is currently offline');
    }

    // Attempt insert with core columns into outreach_registrations
    const coreDbRow: Record<string, any> = {
        full_name: payload.full_name,
        email: payload.email || null,
        phone: payload.phone,
        age_range: payload.age_range || null,
        guardian_name: payload.guardian_name || null,
        guardian_phone: payload.guardian_phone || null,
        location: payload.location || null,
        course_interest: payload.course_interest,
        level: payload.level || 'Intermediate',
        mode_preference: payload.mode_preference || 'Hybrid',
        preferred_study_days: payload.preferred_study_days || [],
        preferred_time_slot: payload.preferred_time_slot || null,
        how_heard: payload.how_heard || 'Outreach Event',
        outreach_event: payload.outreach_event || 'Nkumba University Outreach (Fri, 6th Nov 2026)',
        consent_contact: Boolean(payload.consent_contact),
        status: payload.status || 'NEW',
        admin_notes: payload.admin_notes || null,
        submitted_from: payload.submitted_from || 'web'
    };

    const { error } = await supabase
        .from('outreach_registrations')
        .insert([coreDbRow]);

    // Always log the full structured 8-section registration into `mails` as well
    const loggedToMails = await logOutreachToMails(payload);

    if (!error || loggedToMails) {
        return true;
    }

    throw error;
}

let isFlushing = false;

export async function flushPendingOutreachRegistrations(): Promise<number> {
    if (isFlushing) return 0;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

    const queued = getQueuedOutreachRegistrations();
    if (queued.length === 0) return 0;

    isFlushing = true;
    let syncedCount = 0;

    try {
        for (const item of queued) {
            const payload: OutreachRegistrationPayload = {
                ...item,
                status: item.status || 'NEW',
                submitted_from: 'offline-sync'
            };

            try {
                await insertOutreachRegistrationLive(payload);
                if (item.id) {
                    removeQueuedOutreachRegistration(item.id);
                }
                syncedCount++;
            } catch (err: any) {
                console.warn('Failed to flush queued outreach registration:', err?.message || err);
                break;
            }
        }

        if (syncedCount > 0) {
            window.dispatchEvent(new Event('outreach-registration-update'));
        }
    } catch (err) {
        console.warn('Error flushing offline outreach registrations:', err);
    } finally {
        isFlushing = false;
    }

    return syncedCount;
}
