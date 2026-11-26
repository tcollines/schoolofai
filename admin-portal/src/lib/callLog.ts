// The call log: every phone call staff make to follow people up, plus walk-ins registered at the front desk.
// A call belongs to a person even when they have no email: we match a call to a person by the roster key,
// or the same email, or the same phone (compared on the last 9 digits), exactly like HQ attendance.
import { supabaseClient } from './supabaseClient';
import { invalidatePeople } from './peopleCache';
import { PersonRef, lastDigits, normEmail } from './physicalAttendance';

export type CallOutcome = 'reached' | 'no_answer' | 'call_back' | 'wrong_number';
export type NextStep = 'online' | 'recorded' | 'hq' | 'paid' | 'undecided' | 'not_interested';

export const OUTCOMES: { id: CallOutcome; label: string }[] = [
    { id: 'reached', label: 'Reached' },
    { id: 'no_answer', label: 'No answer' },
    { id: 'call_back', label: 'Call back' },
    { id: 'wrong_number', label: 'Wrong number' },
];

export const NEXT_STEPS: { id: NextStep; label: string }[] = [
    { id: 'online', label: 'Online' },
    { id: 'recorded', label: 'Recorded lessons' },
    { id: 'hq', label: 'HQ lessons' },
    { id: 'paid', label: 'Paid course' },
    { id: 'undecided', label: 'Not decided' },
    { id: 'not_interested', label: 'Not interested' },
];

export const outcomeLabel = (o?: string | null) => OUTCOMES.find(x => x.id === o)?.label || (o || '');
export const nextStepLabel = (n?: string | null) => NEXT_STEPS.find(x => x.id === n)?.label || (n || '');

export interface CallRow {
    person_key: string;
    person_name: string | null;
    email: string | null;
    phone: string | null;
    outcome: CallOutcome;
    next_step: NextStep | null;
    note: string | null;
    follow_up_on: string | null;
    called_by: string | null;
    caller_name: string | null;
    called_at: string;
}

/** Finds the calls that belong to a person. `last` is the most recent call, `all` is every call, newest first. */
export interface CallIndex {
    last: (p: PersonRef) => CallRow | undefined;
    all: (p: PersonRef) => CallRow[];
    rows: CallRow[];
}

/** Loads the call log (newest first). Returns an empty list with the message when it fails or the person may not see it. */
export async function fetchCallLog(limit = 3000): Promise<{ rows: CallRow[]; error: string | null }> {
    try {
        const { data, error } = await supabaseClient.rpc('admin_call_log', { p_limit: limit });
        if (error) return { rows: [], error: error.message };
        const rows = ((data || []) as CallRow[]).slice().sort((a, b) => (a.called_at < b.called_at ? 1 : -1));
        return { rows, error: null };
    } catch (e) {
        return { rows: [], error: e instanceof Error ? e.message : 'Could not load the call log' };
    }
}

/** Saves one call. Never throws: the error text is returned so the screen can show it. */
export async function logCall(
    person: PersonRef, outcome: CallOutcome, nextStep?: NextStep | null, note?: string | null, followUpOn?: string | null
): Promise<{ ok: boolean; status: string | null; error: string | null }> {
    try {
        const { data, error } = await supabaseClient.rpc('admin_log_call', {
            p_key: person.key || '',
            p_name: person.name || null,
            p_email: person.email || null,
            p_phone: person.phone || null,
            p_outcome: outcome,
            p_next_step: nextStep || null,
            p_note: note?.trim() || null,
            p_follow_up_on: followUpOn || null,
        });
        invalidatePeople();
        if (error) return { ok: false, status: null, error: error.message };
        const d = (data || {}) as { ok?: boolean; status?: string };
        return { ok: d.ok !== false, status: d.status || null, error: null };
    } catch (e) {
        return { ok: false, status: null, error: e instanceof Error ? e.message : 'Could not save the call' };
    }
}

export interface WalkInInput {
    name: string; phone: string; email?: string | null; location?: string | null; lessons?: number[]; date?: string | null; note?: string | null;
}
export interface WalkInResult { ok: boolean; key: string | null; created: boolean; alreadyRegistered: boolean; error: string | null }

/** Registers someone who walked in to HQ (saved under the caller's own agent profile) and marks the lessons they attended. */
export async function registerWalkIn(w: WalkInInput): Promise<WalkInResult> {
    try {
        const { data, error } = await supabaseClient.rpc('admin_register_walk_in', {
            p_name: w.name.trim(),
            p_phone: w.phone.trim(),
            p_email: w.email?.trim() || null,
            p_location: w.location?.trim() || null,
            p_lessons: w.lessons || [],
            p_date: w.date || null,
            p_note: w.note?.trim() || null,
        });
        invalidatePeople();
        if (error) return { ok: false, key: null, created: false, alreadyRegistered: false, error: error.message };
        const d = (data || {}) as { ok?: boolean; key?: string; created?: boolean; already_registered?: boolean };
        return { ok: d.ok !== false, key: d.key || null, created: !!d.created, alreadyRegistered: !!d.already_registered, error: null };
    } catch (e) {
        return { ok: false, key: null, created: false, alreadyRegistered: false, error: e instanceof Error ? e.message : 'Could not register the walk-in' };
    }
}

/** Builds the lookup: matches a call to a person by key, email, or phone (last 9 digits). */
export function indexCalls(rows: CallRow[]): CallIndex {
    const byKey = new Map<string, CallRow[]>();
    const byEmail = new Map<string, CallRow[]>();
    const byPhone = new Map<string, CallRow[]>();
    const push = (m: Map<string, CallRow[]>, k: string, r: CallRow) => { if (k) { const a = m.get(k); if (a) a.push(r); else m.set(k, [r]); } };
    rows.forEach(r => { push(byKey, r.person_key, r); push(byEmail, normEmail(r.email), r); push(byPhone, lastDigits(r.phone), r); });
    const all = (p: PersonRef): CallRow[] => {
        const seen = new Set<CallRow>();
        const take = (a?: CallRow[]) => a?.forEach(r => seen.add(r));
        take(p.key ? byKey.get(p.key) : undefined);
        const e = normEmail(p.email); take(e ? byEmail.get(e) : undefined);
        const ph = lastDigits(p.phone); take(ph ? byPhone.get(ph) : undefined);
        return [...seen].sort((a, b) => (a.called_at < b.called_at ? 1 : -1));
    };
    return { all, last: p => all(p)[0], rows };
}

/** The most recent call for a person, or undefined if they were never called. */
export const lastCallFor = (calls: CallIndex | null | undefined, person: PersonRef): CallRow | undefined => (calls ? calls.last(person) : undefined);

/** Puts a call at the top of the list straight away, so the screen updates before the server answers. */
export function applyLocalCall(rows: CallRow[], person: PersonRef, outcome: CallOutcome, nextStep: NextStep | null, note: string | null, followUpOn: string | null, callerName: string | null): CallRow[] {
    return [{
        person_key: person.key || '', person_name: person.name || null, email: normEmail(person.email) || null, phone: person.phone || null,
        outcome, next_step: nextStep, note, follow_up_on: followUpOn, called_by: null, caller_name: callerName, called_at: new Date().toISOString(),
    }, ...rows];
}
