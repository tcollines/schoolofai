// Live classes: three a week (Mon, Wed, Fri at 2:00 pm East Africa Time).
// The six modules are shared across the three weekly classes, two modules per class, so a learner who
// comes to every class has seen the whole course once. A learner who attends a class does not need to
// finish that class's videos and readings: they only take its module quizzes.

import { ALL_ITEMS, MODULES } from '../content/aiFundamentals';
import { recordEvent } from './learnApi';
import { supabase } from './supabaseClient';
import { trackSiteEvent } from './analytics';

export interface Lecture {
    id: 'lecture-1' | 'lecture-2' | 'lecture-3';
    label: string;
    /** day of week in East Africa Time, 0 = Sunday */
    day: number;
    dayName: string;
    modules: string[];
    topic: string;
}

export const LECTURES: Lecture[] = [
    { id: 'lecture-1', label: 'Lecture 1', day: 1, dayName: 'Monday', modules: ['m0', 'm1', 'm2'], topic: 'What AI is, and how to talk to it' },
    { id: 'lecture-2', label: 'Lecture 2', day: 3, dayName: 'Wednesday', modules: ['m3', 'm4'], topic: 'Make AI work for you, and when AI gets it wrong' },
    { id: 'lecture-3', label: 'Lecture 3', day: 5, dayName: 'Friday', modules: ['m5', 'm6'], topic: 'Fair and private, and using AI responsibly' }
];

export const lectureById = (id?: string | null) => LECTURES.find(l => l.id === id) || null;

const EAT_OFFSET_MS = 3 * 3600 * 1000;
const eat = (t: number) => new Date(t + EAT_OFFSET_MS); // read with the getUTC* methods

/** Which of the three lectures a session is. A module_id like "m3" (or "m3,m4") wins; otherwise the weekday decides. */
export function lectureForSession(s: { module_id?: string | null; starts_at: string }): Lecture | null {
    const ids = String(s.module_id || '').toLowerCase().split(/[\s,;/+&]+/).filter(Boolean);
    if (ids.length) {
        const hit = LECTURES.find(l => ids.some(id => l.modules.includes(id)));
        if (hit) return hit;
    }
    const day = eat(new Date(s.starts_at).getTime()).getUTCDay();
    // Thursday (4) counts as Lecture 2 when a Wednesday session is rescheduled
    if (day === 4) return LECTURES.find(l => l.id === 'lecture-2') || null;
    return LECTURES.find(l => l.day === day) || null;
}

export const moduleLabel = (l: Lecture) => {
    const nums = l.modules.filter(m => m !== 'm0').map(m => m.slice(1));
    return nums.length === 2 ? `Modules ${nums[0]} and ${nums[1]}` : `Module ${nums.join(', ')}`;
};

/** Today's class, from the weekly timetable, in East Africa Time. Null on days without a class. */
export function todaysClass(now = Date.now()): { lecture: Lecture; startsAt: number; endsAt: number } | null {
    const d = eat(now);
    const day = d.getUTCDay();
    const lecture = day === 4 ? LECTURES.find(l => l.id === 'lecture-2') : LECTURES.find(l => l.day === day);
    if (!lecture) return null;
    const startsAt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 14, 0, 0) - EAT_OFFSET_MS;
    return { lecture, startsAt, endsAt: startsAt + 90 * 60000 };
}

/** The video and reading items a learner no longer has to finish after attending these lectures. Quizzes stay. */
export function exemptItemIds(lectureIds: Iterable<string>): string[] {
    const mods = new Set<string>();
    for (const id of lectureIds) lectureById(id)?.modules.forEach(m => mods.add(m));
    const quizIds = new Set(ALL_ITEMS.filter(i => i.kind === 'quiz').map(i => i.id));
    return MODULES.filter(m => mods.has(m.id)).flatMap(m => m.items).filter(i => !quizIds.has(i.id) && i.kind !== 'quiz').map(i => i.id);
}

// ---- attendance ------------------------------------------------------------------
const joinedKey = (uid: string) => `welile_live_joined_${uid}`;

export async function recordAttendance(uid: string, s: { id: string; title: string; starts_at: string; module_id?: string | null; meet_link?: string | null }, method: 'join_click' | 'self_confirmed') {
    const lecture = lectureForSession(s);
    const payload = {
        lecture: lecture?.id || null,
        method,
        source: method === 'self_confirmed' ? 'self_confirmed' : 'app',
        title: s.title,
        starts_at: s.starts_at
    };
    let first = true;
    try {
        const seen = JSON.parse(localStorage.getItem(joinedKey(uid)) || '[]') as string[];
        first = !seen.includes(s.id);
        if (first) localStorage.setItem(joinedKey(uid), JSON.stringify([...seen, s.id]));
    } catch { /* ignore */ }
    if (method === 'join_click') {
        trackSiteEvent({
            eventType: 'live_join_click',
            path: `/live/join/${s.id}`,
            targetUrl: s.meet_link || undefined,
            label: s.title,
            category: 'live_class',
            source: 'app',
            meta: { session_id: s.id, lecture: lecture?.id || null, identified: true }
        });
    }
    // Always record attendance (even if session day is non-standard)
    if (first || method === 'self_confirmed') await recordEvent(uid, 'live_joined', s.id, payload);
    return lecture;
}

/** The lectures this learner has attended (read from their own events). */
export async function loadAttendedLectures(uid: string): Promise<Set<string>> {
    const out = new Set<string>();
    try {
        const { data } = await supabase.from('learn_events').select('payload').eq('user_id', uid).eq('event_type', 'live_joined').limit(500);
        (data || []).forEach((r: any) => { const id = r?.payload?.lecture; if (id) out.add(String(id)); });
    } catch { /* offline: no exemptions this time */ }
    return out;
}
