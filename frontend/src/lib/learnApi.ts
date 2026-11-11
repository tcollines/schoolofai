import { supabase } from './supabaseClient';
import { getReferral, claimStoredReferral } from './acquisition';
import { COURSE, REQUIRED_ITEM_IDS, moduleOfItem } from '../content/aiFundamentals';

/**
 * Data layer for the free course.
 * Every write goes to localStorage first (works offline / before the database migration is applied)
 * and is then synced to Supabase on a best-effort basis. Server data wins when both exist.
 */

export interface ItemProgress {
    status: 'in_progress' | 'completed';
    seconds: number;
    last: number;
    completedAt?: string;
}
export type ProgressMap = Record<string, ItemProgress>;

export interface QuizAttempt {
    quizId: string;
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    at: string;
}

export interface Certificate {
    id: string;
    name: string;
    courseTitle: string;
    issuedAt: string;
    status: 'valid' | 'revoked';
    provisional?: boolean; // issued locally because the database was not reachable
}

const SLUG = COURSE.slug;
const k = (uid: string, part: string) => `welile_learn_${SLUG}_${part}_${uid}`;

const readJson = <T,>(key: string, fallback: T): T => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
};
const writeJson = (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
};

/** True when the table/function does not exist yet (migration not applied) or the network is down. */
const isBackendMissing = (err: any): boolean => {
    if (!err) return false;
    const code = String(err.code || '');
    const msg = String(err.message || '').toLowerCase();
    return ['PGRST202', 'PGRST205', '42P01', '42883'].includes(code)
        || msg.includes('could not find') || msg.includes('does not exist')
        || msg.includes('failed to fetch') || msg.includes('network');
};

const device = () => (/Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop');

// ----------------------------------------------------------------------------
// Events (analytics)
// ----------------------------------------------------------------------------
export async function recordEvent(uid: string, eventType: string, itemId?: string, payload?: Record<string, unknown>) {
    try {
        await supabase.from('learn_events').insert({
            user_id: uid, course_slug: SLUG, event_type: eventType, item_id: itemId || null, payload: payload || null, device: device()
        });
    } catch { /* analytics must never break learning */ }
}

// ----------------------------------------------------------------------------
// Enrolment
// ----------------------------------------------------------------------------
export async function ensureEnrolled(uid: string, userMetadata?: Record<string, any> | null) {
    const flag = k(uid, 'enrolled');
    const ref = getReferral()?.code || userMetadata?.ref_code || null;
    const source = ref ? 'staff_link' : (userMetadata?.signup_source || 'website');
    try {
        const { error } = await supabase.rpc('learn_enroll', { p_course: SLUG, p_ref: ref, p_source: source });
        if (!error) {
            if (!localStorage.getItem(flag)) void recordEvent(uid, 'enrolled');
            localStorage.setItem(flag, '1');
            await claimStoredReferral(userMetadata);
            return;
        }
        if (!isBackendMissing(error)) console.warn('learn_enroll failed', error.message);
    } catch { /* offline */ }
    try { localStorage.setItem(flag, '1'); } catch { /* ignore */ }
}

// ----------------------------------------------------------------------------
// Progress
// ----------------------------------------------------------------------------
export async function loadProgress(uid: string): Promise<ProgressMap> {
    const local = readJson<ProgressMap>(k(uid, 'progress'), {});
    try {
        const { data, error } = await supabase
            .from('learn_progress')
            .select('item_id,status,seconds_watched,last_position,completed_at')
            .eq('user_id', uid).eq('course_slug', SLUG);
        if (error) return local;
        const merged: ProgressMap = { ...local };
        const toPush: any[] = [];
        (data || []).forEach((r: any) => {
            const existing = merged[r.item_id];
            // completed beats in_progress; otherwise keep the larger watch time
            if (!existing || (r.status === 'completed' && existing.status !== 'completed') || r.seconds_watched > existing.seconds) {
                merged[r.item_id] = { status: r.status, seconds: r.seconds_watched, last: r.last_position, completedAt: r.completed_at || undefined };
            }
        });
        const serverIds = new Set((data || []).map((r: any) => r.item_id));
        Object.entries(local).forEach(([id, p]) => {
            const serverRow = (data || []).find((r: any) => r.item_id === id);
            if (!serverIds.has(id) || (p.status === 'completed' && serverRow?.status !== 'completed')) {
                toPush.push(toRow(uid, id, p));
            }
        });
        if (toPush.length) await supabase.from('learn_progress').upsert(toPush, { onConflict: 'user_id,course_slug,item_id' });
        writeJson(k(uid, 'progress'), merged);
        return merged;
    } catch { return local; }
}

const toRow = (uid: string, itemId: string, p: ItemProgress) => ({
    user_id: uid,
    course_slug: SLUG,
    item_id: itemId,
    module_id: moduleOfItem(itemId)?.id || itemId.split('-')[0],
    status: p.status,
    seconds_watched: Math.round(p.seconds || 0),
    last_position: Math.round(p.last || 0),
    completed_at: p.status === 'completed' ? (p.completedAt || new Date().toISOString()) : null,
    updated_at: new Date().toISOString()
});

export async function saveItemProgress(uid: string, itemId: string, patch: Partial<ItemProgress>): Promise<ProgressMap> {
    const all = readJson<ProgressMap>(k(uid, 'progress'), {});
    const prev = all[itemId];
    const wasCompleted = prev?.status === 'completed';
    const next: ItemProgress = {
        status: wasCompleted ? 'completed' : (patch.status || prev?.status || 'in_progress'),
        seconds: Math.max(prev?.seconds || 0, patch.seconds || 0),
        last: patch.last ?? prev?.last ?? 0,
        completedAt: prev?.completedAt || (patch.status === 'completed' ? new Date().toISOString() : undefined)
    };
    all[itemId] = next;
    writeJson(k(uid, 'progress'), all);
    try {
        await supabase.from('learn_progress').upsert(toRow(uid, itemId, next), { onConflict: 'user_id,course_slug,item_id' });
    } catch { /* synced on next load */ }
    if (!prev) void recordEvent(uid, 'lesson_started', itemId);
    if (next.status === 'completed' && !wasCompleted) void recordEvent(uid, 'lesson_completed', itemId);
    return all;
}

// ----------------------------------------------------------------------------
// Quiz attempts
// ----------------------------------------------------------------------------
export function loadAttempts(uid: string): QuizAttempt[] {
    return readJson<QuizAttempt[]>(k(uid, 'attempts'), []);
}

export async function submitAttempt(uid: string, quizId: string, score: number, total: number, passMark: number, answers: unknown): Promise<QuizAttempt> {
    const percentage = Math.round((score / total) * 100);
    const attempt: QuizAttempt = { quizId, score, total, percentage, passed: percentage >= passMark, at: new Date().toISOString() };
    const list = loadAttempts(uid);
    list.push(attempt);
    writeJson(k(uid, 'attempts'), list);
    try {
        await supabase.from('learn_quiz_attempts').insert({
            user_id: uid, course_slug: SLUG, quiz_id: quizId, score, total, percentage, passed: attempt.passed, answers
        });
    } catch { /* offline */ }
    void recordEvent(uid, 'quiz_submitted', quizId, { percentage, passed: attempt.passed });
    return attempt;
}

export function finalAttemptsLast24h(uid: string): QuizAttempt[] {
    const since = Date.now() - 24 * 3600 * 1000;
    return loadAttempts(uid).filter(a => a.quizId === 'final' && new Date(a.at).getTime() > since);
}

export function bestScore(uid: string, quizId: string): number | null {
    const scores = loadAttempts(uid).filter(a => a.quizId === quizId).map(a => a.percentage);
    return scores.length ? Math.max(...scores) : null;
}

// ----------------------------------------------------------------------------
// Completion + certificate
// ----------------------------------------------------------------------------
export function completionState(progress: ProgressMap, uid: string) {
    const required = REQUIRED_ITEM_IDS.filter(id => id !== 'final');
    const done = required.filter(id => progress[id]?.status === 'completed').length;
    const finalPassed = loadAttempts(uid).some(a => a.quizId === 'final' && a.passed);
    return { done, total: required.length, allItemsDone: done === required.length, finalPassed, pct: Math.round(((done + (finalPassed ? 1 : 0)) / (required.length + 1)) * 100) };
}

export async function loadCertificate(uid: string): Promise<Certificate | null> {
    try {
        const { data, error } = await supabase
            .from('learn_certificates').select('*').eq('user_id', uid).eq('course_slug', SLUG).maybeSingle();
        if (!error && data) {
            return { id: data.id, name: data.name_on_certificate, courseTitle: data.course_title, issuedAt: data.issued_at, status: data.status };
        }
    } catch { /* fall through */ }
    return readJson<Certificate | null>(k(uid, 'certificate'), null);
}

export async function issueCertificate(uid: string, name: string): Promise<Certificate> {
    try {
        // make sure the server has everything before it verifies completion
        await loadProgress(uid);
        const { data, error } = await supabase.rpc('issue_certificate', { p_course: SLUG, p_name: name });
        if (!error && data) {
            const row: any = Array.isArray(data) ? data[0] : data;
            const cert: Certificate = { id: row.id, name: row.name_on_certificate, courseTitle: row.course_title, issuedAt: row.issued_at, status: row.status };
            writeJson(k(uid, 'certificate'), cert);
            void recordEvent(uid, 'certificate_issued', undefined, { id: cert.id });
            return cert;
        }
        if (error && !isBackendMissing(error)) throw new Error(error.message);
    } catch (e: any) {
        if (!isBackendMissing(e) && e?.message && !/fetch|network/i.test(e.message)) throw e;
    }
    // Provisional certificate (database not reachable yet). It is replaced by the verified one on the next sync.
    const cert: Certificate = {
        id: 'PROVISIONAL-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
        name, courseTitle: COURSE.title, issuedAt: new Date().toISOString(), status: 'valid', provisional: true
    };
    writeJson(k(uid, 'certificate'), cert);
    return cert;
}

export async function saveRating(uid: string, rating: number, comment: string) {
    writeJson(k(uid, 'rating'), { rating, comment });
    try {
        await supabase.from('learn_ratings').upsert({ user_id: uid, course_slug: SLUG, rating, comment: comment || null }, { onConflict: 'user_id,course_slug' });
    } catch { /* offline */ }
}
export const loadRating = (uid: string) => readJson<{ rating: number; comment: string } | null>(k(uid, 'rating'), null);

export async function verifyCertificate(id: string): Promise<{ name: string; courseTitle: string; issuedAt: string; status: string } | null> {
    try {
        const { data, error } = await supabase.rpc('verify_certificate', { p_id: id });
        if (error) return null;
        const row: any = Array.isArray(data) ? data[0] : data;
        if (!row) return null;
        return { name: row.name_on_certificate, courseTitle: row.course_title, issuedAt: row.issued_at, status: row.status };
    } catch { return null; }
}

// ----------------------------------------------------------------------------
// Live sessions
// ----------------------------------------------------------------------------
export interface LiveSession {
    id: string;
    title: string;
    description?: string;
    host_name?: string;
    module_id?: string;
    starts_at: string;
    ends_at: string;
    meet_link?: string;
    recording_url?: string;
}
export async function loadLiveSessions(): Promise<LiveSession[]> {
    try {
        const { data, error } = await supabase
            .from('live_sessions').select('*').eq('course_slug', SLUG).eq('is_published', true)
            .order('starts_at', { ascending: true });
        if (error) return [];
        return (data || []) as LiveSession[];
    } catch { return []; }
}
