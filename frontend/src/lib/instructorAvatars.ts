// Instructor photos are stored inline in the database and add up to about 2.4 MB. Downloading them with every course
// list made each app load expensive. The course list now leaves them out, and this file keeps small copies (about
// 96 px) on the device, refreshed once a week. The stored originals are never touched.
import { supabaseClient } from './supabaseClient';

const KEY = 'welile_instr_thumbs_v1';
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const THUMB_PX = 96;

type Store = { ts: number; map: Record<string, string> };

const readStore = (): Store | null => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const s = JSON.parse(raw) as Store;
        return s && typeof s.ts === 'number' && s.map ? s : null;
    } catch { return null; }
};

/** Thumbnails already on this device, by course id. Empty when none have been saved yet. */
export const cachedInstructorThumbs = (): Record<string, string> => readStore()?.map || {};

export const instructorThumbsAreFresh = (): boolean => {
    const s = readStore();
    return !!s && Date.now() - s.ts < MAX_AGE_MS;
};

const shrink = (src: string): Promise<string> =>
    new Promise(resolve => {
        // Links, initials and emoji are already tiny: keep them as they are.
        if (!src.startsWith('data:image')) return resolve(src.length < 400 ? src : '');
        const img = new Image();
        img.onload = () => {
            try {
                const side = Math.min(img.naturalWidth, img.naturalHeight) || THUMB_PX;
                const c = document.createElement('canvas');
                c.width = THUMB_PX; c.height = THUMB_PX;
                const ctx = c.getContext('2d');
                if (!ctx) return resolve('');
                // centre square crop, like the round avatar on screen
                const sx = (img.naturalWidth - side) / 2;
                const sy = (img.naturalHeight - side) / 2;
                ctx.drawImage(img, sx, sy, side, side, 0, 0, THUMB_PX, THUMB_PX);
                resolve(c.toDataURL('image/jpeg', 0.75));
            } catch { resolve(''); }
        };
        img.onerror = () => resolve('');
        img.src = src;
    });

let inFlight: Promise<Record<string, string>> | null = null;

/** Downloads the photos once, saves small copies on this device and returns them. Never throws. */
export function refreshInstructorThumbs(): Promise<Record<string, string>> {
    if (inFlight) return inFlight;
    inFlight = (async () => {
        try {
            const { data, error } = await supabaseClient.from('courses').select('id,instructor_avatar');
            if (error || !data) return cachedInstructorThumbs();
            const map: Record<string, string> = {};
            for (const row of data as { id: string; instructor_avatar: string | null }[]) {
                if (row.instructor_avatar) {
                    const t = await shrink(row.instructor_avatar);
                    if (t) map[row.id] = t;
                }
            }
            try { localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), map } satisfies Store)); } catch { /* storage full or blocked: still return them */ }
            return map;
        } catch { return cachedInstructorThumbs(); }
        finally { inFlight = null; }
    })();
    return inFlight;
}
