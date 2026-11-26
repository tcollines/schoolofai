// Physical (HQ) attendance for Fundamentals of AI.
// There are 3 physical lessons at HQ. Together they cover the same 6 modules taught online.
// A mark belongs to a person even when they have no email: we match a mark to a person by the roster key,
// or the same email, or the same phone (compared on the last 9 digits).
import { supabaseClient } from './supabaseClient';
import { invalidatePeople } from './peopleCache';

export const LESSONS = [
    { no: 1, modules: 'Modules 1 and 2' },
    { no: 2, modules: 'Modules 3 and 4' },
    { no: 3, modules: 'Modules 5 and 6' },
] as const;

export interface PhysicalRow {
    person_key: string;
    person_name: string | null;
    email: string | null;
    phone: string | null;
    lesson_no: number;
    attended_on: string;
}

/** What we need to know about a person to find their marks. */
export interface PersonRef {
    key?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
}

export type LessonsFor = (p: PersonRef) => number[];

export const lastDigits = (p?: string | null) => {
    const d = (p || '').replace(/\D/g, '');
    return d.length >= 7 ? d.slice(-9) : '';
};
export const normEmail = (e?: string | null) => (e || '').trim().toLowerCase();

/** Today in Kampala (UTC+3) as YYYY-MM-DD. */
export const kampalaToday = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);

/** Loads every HQ mark for a course. Returns an empty list (and the message) when the person may not see them or the call fails. */
export async function fetchPhysicalAttendance(course = 'ai-fundamentals'): Promise<{ rows: PhysicalRow[]; error: string | null }> {
    try {
        const { data, error } = await supabaseClient.rpc('admin_physical_attendance', { p_course: course });
        if (error) return { rows: [], error: error.message };
        return { rows: ((data || []) as PhysicalRow[]).map(r => ({ ...r, lesson_no: Number(r.lesson_no) })), error: null };
    } catch (e) {
        return { rows: [], error: e instanceof Error ? e.message : 'Could not load HQ attendance' };
    }
}

/** Marks (or un-marks) one person for one lesson. Never throws. */
export async function setPhysicalLesson(
    person: PersonRef, lesson: number, attended: boolean, date?: string | null, course = 'ai-fundamentals'
): Promise<{ ok: boolean; error: string | null }> {
    try {
        const { error } = await supabaseClient.rpc('admin_set_physical_lesson', {
            p_person_key: person.key || '',
            p_name: person.name || null,
            p_email: person.email || null,
            p_phone: person.phone || null,
            p_lesson: lesson,
            p_attended: attended,
            p_date: date || null,
            p_course: course,
        });
        invalidatePeople();
        return error ? { ok: false, error: error.message } : { ok: true, error: null };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Could not save attendance' };
    }
}

const matches = (r: PhysicalRow, p: PersonRef) => {
    if (p.key && r.person_key === p.key) return true;
    const e = normEmail(p.email);
    if (e && normEmail(r.email) === e) return true;
    const ph = lastDigits(p.phone);
    return !!ph && lastDigits(r.phone) === ph;
};

/** Builds a fast lookup: lessonsFor(person) returns the lesson numbers (1 to 3) the person attended, sorted. */
export function indexPhysical(rows: PhysicalRow[]): LessonsFor {
    const byKey = new Map<string, Set<number>>();
    const byEmail = new Map<string, Set<number>>();
    const byPhone = new Map<string, Set<number>>();
    const add = (m: Map<string, Set<number>>, k: string, n: number) => {
        if (!k) return;
        const s = m.get(k) || new Set<number>();
        s.add(n);
        m.set(k, s);
    };
    rows.forEach(r => {
        add(byKey, r.person_key, r.lesson_no);
        add(byEmail, normEmail(r.email), r.lesson_no);
        add(byPhone, lastDigits(r.phone), r.lesson_no);
    });
    return (p: PersonRef) => {
        const out = new Set<number>();
        (p.key ? byKey.get(p.key) : undefined)?.forEach(n => out.add(n));
        const e = normEmail(p.email);
        (e ? byEmail.get(e) : undefined)?.forEach(n => out.add(n));
        const ph = lastDigits(p.phone);
        (ph ? byPhone.get(ph) : undefined)?.forEach(n => out.add(n));
        return [...out].sort((a, b) => a - b);
    };
}

/** Applies one mark to the local list straight away, so the screen updates before the server answers. */
export function applyLocalMark(rows: PhysicalRow[], person: PersonRef, lesson: number, attended: boolean, date?: string | null): PhysicalRow[] {
    const without = rows.filter(r => !(r.lesson_no === lesson && matches(r, person)));
    if (!attended) return without;
    return [...without, {
        person_key: person.key || '',
        person_name: person.name || null,
        email: normEmail(person.email) || null,
        phone: person.phone || null,
        lesson_no: lesson,
        attended_on: date || kampalaToday(),
    }];
}

/** Builds a check that says whether a key, email or phone belongs to one of the given people (used to find marks or calls that match nobody). */
export function buildPersonLookup(people: PersonRef[]): (p: PersonRef) => boolean {
    const keys = new Set<string>();
    const emails = new Set<string>();
    const phones = new Set<string>();
    people.forEach(p => {
        if (p.key) keys.add(p.key);
        const e = normEmail(p.email);
        if (e) emails.add(e);
        const ph = lastDigits(p.phone);
        if (ph) phones.add(ph);
    });
    return (p: PersonRef) => {
        if (p.key && keys.has(p.key)) return true;
        const e = normEmail(p.email);
        if (e && emails.has(e)) return true;
        const ph = lastDigits(p.phone);
        return !!ph && phones.has(ph);
    };
}
