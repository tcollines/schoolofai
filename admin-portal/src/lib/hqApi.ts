// HQ (front desk) courses, enrolments, class attendance, exams, graduation and consult-only visitors.
// Every wrapper is non-throwing and returns { ok, error, data }, so a screen can always show a friendly message instead of going blank.
// Every write clears the shared people copy (invalidatePeople) so the numbers on every admin page pick the change up.
import { supabaseClient } from './supabaseClient';
import { invalidatePeople } from './peopleCache';
import { PersonRef, lastDigits, normEmail } from './physicalAttendance';

export interface Res<T> { ok: boolean; error: string | null; data: T | null }

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<Res<T>> {
    try {
        const { data, error } = await supabaseClient.rpc(fn, args);
        if (error) return { ok: false, error: error.message, data: null };
        return { ok: true, error: null, data: data as T };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong. Please try again.', data: null };
    }
}

/** A write: on success the shared people copy is cleared so every page shows fresh numbers. */
async function write<T>(fn: string, args?: Record<string, unknown>): Promise<Res<T>> {
    const r = await call<T>(fn, args);
    if (r.ok) invalidatePeople();
    return r;
}

// ---------- Types ----------

export interface HqCourse { slug: string; title: string; lessons_count: number; has_exam: boolean; fee_ugx: number; active: boolean; sort_order: number }

export type EnrolStatus = 'active' | 'paused' | 'withdrawn' | 'graduated';
export type ExamResult = 'passed' | 'failed' | 'absent';

export interface HqEnrolment {
    id: string; course_slug: string; person_key: string; person_name: string | null; email: string | null; phone: string | null;
    status: EnrolStatus; start_on: string | null; intake: string | null; fee_ugx: number; paid_ugx: number;
    exam_result: ExamResult | null; exam_score: number | null; exam_on: string | null; exam_attempts: number;
    graduated_on: string | null; source: string | null; notes: string | null; enrolled_at: string;
}

export type SheetStatus = 'present' | 'absent' | 'excused';
export interface SheetRow { person_key: string; person_name: string | null; email: string | null; phone: string | null; lesson_no: number; status: SheetStatus; attended_on: string; note: string | null; course_slug: string }

export type EnquiryChannel = 'walk_in' | 'phone' | 'whatsapp' | 'other';
export type EnquiryTopic = 'course_info' | 'fees' | 'schedule' | 'for_someone_else' | 'corporate' | 'partnership' | 'job_internship' | 'certificate' | 'complaint' | 'other';
export type EnquiryOutcome = 'answered' | 'thinking' | 'follow_up' | 'registered' | 'not_interested';
export interface Enquiry {
    id: string; visited_at: string; visitor_name: string | null; phone: string | null; email: string | null; channel: EnquiryChannel; topic: EnquiryTopic;
    course_slug: string | null; course_text: string | null; outcome: EnquiryOutcome; follow_up_on: string | null; notes: string | null; converted_key: string | null; handler_name: string | null;
}

export const CHANNELS: { id: EnquiryChannel; label: string }[] = [
    { id: 'walk_in', label: 'Walk-in' }, { id: 'phone', label: 'Phone' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'other', label: 'Other' },
];
export const TOPICS: { id: EnquiryTopic; label: string }[] = [
    { id: 'course_info', label: 'Course info' }, { id: 'fees', label: 'Fees' }, { id: 'schedule', label: 'Schedule' },
    { id: 'for_someone_else', label: 'For someone else' }, { id: 'corporate', label: 'Company training' }, { id: 'partnership', label: 'Partnership' },
    { id: 'job_internship', label: 'Job or internship' }, { id: 'certificate', label: 'Certificate' }, { id: 'complaint', label: 'Complaint' }, { id: 'other', label: 'Other' },
];
export const OUTCOMES: { id: EnquiryOutcome; label: string }[] = [
    { id: 'answered', label: 'Answered' }, { id: 'thinking', label: 'Thinking about it' }, { id: 'follow_up', label: 'Needs follow-up' },
    { id: 'registered', label: 'Registered' }, { id: 'not_interested', label: 'Not interested' },
];
export const topicLabel = (t?: string | null) => TOPICS.find(x => x.id === t)?.label || (t || '');
export const outcomeLabel = (o?: string | null) => OUTCOMES.find(x => x.id === o)?.label || (o || '');
export const channelLabel = (c?: string | null) => CHANNELS.find(x => x.id === c)?.label || (c || '');
export const SOURCE_LABELS: Record<string, string> = { walk_in: 'Walk-in', agent: 'Agent', paper: 'Paper form', online: 'Online', hq: 'At HQ', manual: 'Added by staff' };
export const sourceLabel = (s?: string | null) => (s ? SOURCE_LABELS[s] || s.replace(/_/g, ' ') : 'Not recorded');
export const STATUS_LABELS: Record<EnrolStatus, string> = { active: 'Active', paused: 'Paused', withdrawn: 'Withdrawn', graduated: 'Graduated' };

// ---------- Reads ----------

export const fetchHqCourses = async (): Promise<Res<HqCourse[]>> => {
    const r = await call<HqCourse[]>('admin_hq_courses');
    return r.ok ? { ...r, data: ((r.data || []) as HqCourse[]).map(c => ({ ...c, lessons_count: Number(c.lessons_count) || 0, fee_ugx: Number(c.fee_ugx) || 0 })).sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)) } : r;
};

/** `course` null = every course. */
export const fetchHqEnrolments = async (course: string | null = null): Promise<Res<HqEnrolment[]>> => {
    const r = await call<HqEnrolment[]>('admin_hq_enrolments', { p_course: course });
    return r.ok ? { ...r, data: ((r.data || []) as HqEnrolment[]).map(e => ({ ...e, fee_ugx: Number(e.fee_ugx) || 0, paid_ugx: Number(e.paid_ugx) || 0, exam_attempts: Number(e.exam_attempts) || 0, exam_score: e.exam_score == null ? null : Number(e.exam_score) })) } : r;
};

export const fetchSheet = async (course: string): Promise<Res<SheetRow[]>> => {
    const r = await call<SheetRow[]>('admin_hq_attendance_sheet', { p_course: course });
    return r.ok ? { ...r, data: ((r.data || []) as SheetRow[]).map(x => ({ ...x, lesson_no: Number(x.lesson_no), course_slug: course })) } : r;
};

/** The attendance sheet of every given course, joined into one list. A course that fails is skipped; `error` says so. */
export async function fetchAllSheets(courses: string[]): Promise<{ rows: SheetRow[]; error: string | null }> {
    const parts = await Promise.all(courses.map(c => fetchSheet(c)));
    const bad = parts.find(p => !p.ok);
    return { rows: parts.flatMap(p => p.data || []), error: bad ? bad.error : null };
}

export const fetchEnquiries = async (limit = 500): Promise<Res<Enquiry[]>> => {
    const r = await call<Enquiry[]>('admin_hq_enquiries', { p_limit: limit });
    return r.ok ? { ...r, data: ((r.data || []) as Enquiry[]) } : r;
};

// ---------- Writes ----------

export const saveHqCourse = (c: { slug: string; title: string; lessons: number; has_exam: boolean; fee: number; active: boolean }) =>
    write<unknown>('admin_hq_save_course', { p_slug: c.slug, p_title: c.title.trim(), p_lessons: c.lessons, p_has_exam: c.has_exam, p_fee: c.fee, p_active: c.active });

export const hqEnrol = (p: PersonRef & { course: string; fee?: number | null; paid?: number | null; start?: string | null; intake?: string | null; notes?: string | null; source?: string | null }) =>
    write<unknown>('admin_hq_enrol', { p_key: p.key || '', p_name: p.name || null, p_email: p.email || null, p_phone: p.phone || null, p_course: p.course, p_fee: p.fee ?? null, p_paid: p.paid ?? null, p_start: p.start || null, p_intake: p.intake || null, p_notes: p.notes || null, p_source: p.source || 'manual' });

export const updateEnrolment = (course: string, person: PersonRef, patch: Partial<{ status: EnrolStatus; fee_ugx: number; paid_ugx: number; notes: string; intake: string; start_on: string }>) =>
    write<unknown>('admin_hq_update_enrolment', { p_course: course, p_key: person.key || '', p_email: person.email || null, p_phone: person.phone || null, p_patch: patch });

export const setExam = (course: string, person: PersonRef, result: ExamResult | 'clear', score?: number | null, date?: string | null) =>
    write<unknown>('admin_hq_set_exam', { p_course: course, p_key: person.key || '', p_name: person.name || null, p_email: person.email || null, p_phone: person.phone || null, p_result: result, p_score: score ?? null, p_date: date || null });

export interface GraduateReply { ok: boolean; reason?: string; missing_lessons?: number[] }
export const graduate = (course: string, person: PersonRef, graduated: boolean, date?: string | null, force = false) =>
    write<GraduateReply>('admin_hq_graduate', { p_course: course, p_key: person.key || '', p_name: person.name || null, p_email: person.email || null, p_phone: person.phone || null, p_graduated: graduated, p_date: date || null, p_force: force });

export const setHqAttendance = (course: string, person: PersonRef, lesson: number, status: SheetStatus | 'clear', date?: string | null, note?: string | null) =>
    write<unknown>('admin_set_hq_attendance', { p_key: person.key || '', p_name: person.name || null, p_email: person.email || null, p_phone: person.phone || null, p_lesson: lesson, p_status: status, p_date: date || null, p_course: course, p_note: note || null });

export interface StudyInput {
    name: string; phone: string; email?: string | null; location?: string | null; lessons?: number[]; date?: string | null; note?: string | null;
    course?: string | null; fee?: number | null; paid?: number | null; start?: string | null; intake?: string | null; enquiryId?: string | null;
}
export interface StudyReply { ok: boolean; key?: string; created?: boolean; already_registered?: boolean }
/** Registers (or enrols) someone who came to HQ. Saved under the caller's own agent profile. */
export const registerStudy = (w: StudyInput) =>
    write<StudyReply>('admin_register_walk_in', {
        p_name: w.name.trim(), p_phone: w.phone.trim(), p_email: w.email?.trim() || null, p_location: w.location?.trim() || null,
        p_lessons: w.lessons || [], p_date: w.date || null, p_note: w.note?.trim() || null,
        p_course: w.course || null, p_fee: w.fee ?? null, p_paid: w.paid ?? null, p_start: w.start || null, p_intake: w.intake?.trim() || null, p_enquiry_id: w.enquiryId || null,
    });

export interface EnquiryInput {
    name?: string; phone?: string; email?: string; channel: EnquiryChannel; topic: EnquiryTopic; courseSlug?: string | null; courseText?: string | null;
    outcome: EnquiryOutcome; followUpOn?: string | null; notes?: string | null;
}
export const logEnquiry = (e: EnquiryInput) =>
    write<{ ok: boolean; id: string }>('admin_log_enquiry', {
        p_name: e.name?.trim() || null, p_phone: e.phone?.trim() || null, p_email: e.email?.trim() || null, p_channel: e.channel, p_topic: e.topic,
        p_course_slug: e.courseSlug || null, p_course_text: e.courseText || null, p_outcome: e.outcome, p_follow_up_on: e.followUpOn || null, p_notes: e.notes?.trim() || null,
    });

export const updateEnquiry = (id: string, patch: Partial<{ outcome: EnquiryOutcome; follow_up_on: string; notes: string; converted_key: string }>) =>
    write<unknown>('admin_update_enquiry', { p_id: id, p_patch: patch });

// ---------- Helpers ----------

/** Two people references are the same person when the key, the email, or the phone (last 9 digits) is the same. */
export function samePerson(a: PersonRef, b: PersonRef): boolean {
    if (a.key && b.key && a.key === b.key) return true;
    const ea = normEmail(a.email); if (ea && ea === normEmail(b.email)) return true;
    const pa = lastDigits(a.phone); return !!pa && pa === lastDigits(b.phone);
}

export const enrolmentRef = (e: HqEnrolment): PersonRef => ({ key: e.person_key, name: e.person_name, email: e.email, phone: e.phone });

/** The marks for one person on one course, newest date first for each lesson. */
export function marksFor(sheet: SheetRow[], course: string, person: PersonRef): Map<number, SheetRow> {
    const out = new Map<number, SheetRow>();
    sheet.forEach(r => {
        if (r.course_slug !== course || !samePerson(person, { key: r.person_key, email: r.email, phone: r.phone })) return;
        const prev = out.get(r.lesson_no);
        if (!prev || prev.attended_on <= r.attended_on) out.set(r.lesson_no, r);
    });
    return out;
}

export interface Readiness {
    ready: boolean;
    graduated: boolean;
    /** Plain reasons it is not ready, like "Exam not passed" or "Missing lessons 2, 3". */
    reasons: string[];
    missingLessons: number[];
    presentCount: number;
    balance: number;
}

/** Can this person graduate? Exam passed (if the course has one), every lesson attended, and not graduated already. */
export function readiness(e: HqEnrolment, course: HqCourse | undefined, marks: Map<number, SheetRow>): Readiness {
    const n = course?.lessons_count || 0;
    const missing: number[] = [];
    for (let i = 1; i <= n; i++) if (marks.get(i)?.status !== 'present') missing.push(i);
    const reasons: string[] = [];
    if (course?.has_exam && e.exam_result !== 'passed') reasons.push(e.exam_result === 'failed' ? 'Exam failed' : e.exam_result === 'absent' ? 'Missed the exam' : 'Exam not passed');
    if (missing.length > 0) reasons.push(`Missing lesson${missing.length > 1 ? 's' : ''} ${missing.join(', ')}`);
    if (e.status === 'withdrawn') reasons.push('Withdrawn');
    const graduated = e.status === 'graduated';
    return { ready: !graduated && reasons.length === 0, graduated, reasons, missingLessons: missing, presentCount: n - missing.length, balance: Math.max(0, (e.fee_ugx || 0) - (e.paid_ugx || 0)) };
}

export const ugx = (n: number) => `UGX ${Math.round(n || 0).toLocaleString('en-US')}`;
