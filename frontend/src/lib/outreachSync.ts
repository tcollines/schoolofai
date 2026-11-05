import { supabase } from './supabaseClient';

export const OUTREACH_QUEUE_KEY = 'outreach_pending_registrations';
export const OUTREACH_LOCAL_CACHE_KEY = 'outreach_registrations_local_cache';

export interface OutreachRegistrationPayload {
    id?: string;
    created_at?: string;
    full_name: string;
    email?: string | null;
    phone: string;
    age_range?: string | null;
    guardian_name?: string | null;
    guardian_phone?: string | null;
    location?: string | null;
    course_interest: string;
    level?: string | null;
    mode_preference?: string | null;
    preferred_study_days?: string[];
    preferred_time_slot?: string | null;
    how_heard?: string | null;
    outreach_event?: string | null;
    consent_contact: boolean;
    status?: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'NOT_INTERESTED';
    admin_notes?: string | null;
    converted_profile_id?: string | null;
    submitted_from?: 'web' | 'offline-sync';
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
            record.preferred_time_slot ? `Time: ${record.preferred_time_slot}` : null
        ].filter(Boolean).join(' | ');

        const guardianSummary = record.age_range === 'Under 18' && record.guardian_name
            ? `\nGuardian: ${record.guardian_name} (${record.guardian_phone || 'N/A'})`
            : '';

        const structuredJson = JSON.stringify({
            ...record,
            id: record.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `outreach-${Date.now()}`),
            created_at: record.created_at || new Date().toISOString(),
            status: record.status || 'NEW'
        });

        const message = [
            `[Outreach Registration Lead]`,
            `Name: ${record.full_name}`,
            `Phone: ${record.phone}`,
            record.email ? `Email: ${record.email}` : null,
            record.age_range ? `Age Range: ${record.age_range}` : null,
            record.location ? `Location: ${record.location}` : null,
            `Course Interest: ${record.course_interest} (${record.level || 'Beginner'})`,
            scheduleSummary || null,
            record.how_heard ? `How Heard: ${record.how_heard}` : null,
            record.outreach_event ? `Outreach Event: ${record.outreach_event}` : null,
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

    const { error } = await supabase
        .from('outreach_registrations')
        .insert([payload]);

    if (!error) {
        await logOutreachToMails(payload);
        return true;
    }

    // If the table has not been created yet in Supabase schema cache, persist via `mails` table so live DB works immediately
    const isTableMissing =
        error.code === 'PGRST205' ||
        error.code === '42P01' ||
        (error.message || '').includes('outreach_registrations');

    if (isTableMissing) {
        const logged = await logOutreachToMails(payload);
        if (logged) return true;
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
                full_name: item.full_name,
                email: item.email || null,
                phone: item.phone,
                age_range: item.age_range || null,
                guardian_name: item.guardian_name || null,
                guardian_phone: item.guardian_phone || null,
                location: item.location || null,
                course_interest: item.course_interest,
                level: item.level || 'Beginner',
                mode_preference: item.mode_preference || 'Hybrid',
                preferred_study_days: item.preferred_study_days || [],
                preferred_time_slot: item.preferred_time_slot || 'Evening',
                how_heard: item.how_heard || null,
                outreach_event: item.outreach_event || null,
                consent_contact: Boolean(item.consent_contact),
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
