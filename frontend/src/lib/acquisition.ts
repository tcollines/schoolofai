import { getReturnTo } from './returnTo';
import { supabase } from './supabaseClient';

/**
 * Acquisition helpers: staff referral capture (first touch wins) and "I came here to study the free course" intent.
 *
 * Staff links look like  /r/<staff-slug>  or  /anything?ref=<staff-slug>.
 * The code is stored in a first-party cookie + localStorage, removed from the address bar,
 * written into the account at signup (user metadata), and finally claimed server-side onto the profile.
 */

const REF_KEY = 'welile_ref_v1';
const REF_COOKIE = 'welile_ref';
const REF_WINDOW_DAYS = 90;
const INTENT_KEY = 'welile_free_course_intent_v1';

export interface StoredReferral {
    code: string;
    at: number;
    source: string;
}

const safe = <T,>(fn: () => T, fallback: T): T => {
    try { return fn(); } catch { return fallback; }
};

const normaliseCode = (raw: string | null | undefined): string => {
    const code = (raw || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
    return code;
};

const readCookie = (name: string): string | null =>
    safe(() => {
        const match = document.cookie.split('; ').find(c => c.startsWith(name + '='));
        return match ? decodeURIComponent(match.split('=')[1]) : null;
    }, null);

const writeCookie = (name: string, value: string, days: number) =>
    safe(() => {
        document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${days * 86400}; path=/; SameSite=Lax`;
    }, undefined);

export function getReferral(): StoredReferral | null {
    const raw = safe(() => localStorage.getItem(REF_KEY), null);
    let stored: StoredReferral | null = null;
    if (raw) stored = safe(() => JSON.parse(raw) as StoredReferral, null);
    if (!stored) {
        const fromCookie = normaliseCode(readCookie(REF_COOKIE));
        if (fromCookie) stored = { code: fromCookie, at: Date.now(), source: 'staff_link' };
    }
    if (!stored) return null;
    if (Date.now() - stored.at > REF_WINDOW_DAYS * 86400000) return null;
    return stored;
}

/** First touch wins: an existing, unexpired referral is never overwritten. */
export function setReferral(rawCode: string, source = 'staff_link'): boolean {
    const code = normaliseCode(rawCode);
    if (!code) return false;
    if (getReferral()) return false;
    const record: StoredReferral = { code, at: Date.now(), source };
    safe(() => localStorage.setItem(REF_KEY, JSON.stringify(record)), undefined);
    writeCookie(REF_COOKIE, code, REF_WINDOW_DAYS);
    return true;
}

export function clearReferral() {
    safe(() => localStorage.removeItem(REF_KEY), undefined);
    safe(() => { document.cookie = `${REF_COOKIE}=; max-age=0; path=/`; }, undefined);
}

/** Best-effort anonymous click log (staff stats). Once per code per browser session. */
export async function logReferralClick(code: string, landing: string) {
    const key = `welile_ref_click_${code}`;
    if (safe(() => sessionStorage.getItem(key), null)) return;
    safe(() => sessionStorage.setItem(key, '1'), undefined);
    try {
        await supabase.rpc('log_referral_click', { p_ref: code, p_landing: landing });
    } catch { /* tracking must never break the page */ }
}

/** Read ?ref= from the URL, store it, log the click, and strip it so students never see it. */
export function captureReferralFromUrl() {
    safe(() => {
        const url = new URL(window.location.href);
        const raw = url.searchParams.get('ref');
        if (!raw) return;
        const code = normaliseCode(raw);
        if (code) {
            setReferral(code);
            void logReferralClick(code, url.pathname);
        }
        url.searchParams.delete('ref');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
    }, undefined);
}

/** After sign-in, attach the stored referral to the profile (first touch only, enforced in the database). */
export async function claimStoredReferral(userMetadata?: Record<string, any> | null) {
    const code = getReferral()?.code || normaliseCode(userMetadata?.ref_code);
    if (!code) return;
    try {
        const { error } = await supabase.rpc('claim_referral', { p_ref: code, p_source: 'staff_link' });
        if (!error) clearReferral();
    } catch { /* will retry on next load */ }
}

// ----------------------------------------------------------------------------
// Free-course intent: survives email verification and Google sign-in redirects
// ----------------------------------------------------------------------------
export function setFreeCourseIntent(slug: string) {
    safe(() => localStorage.setItem(INTENT_KEY, slug), undefined);
}
export function getFreeCourseIntent(): string | null {
    return safe(() => localStorage.getItem(INTENT_KEY), null);
}
export function clearFreeCourseIntent() {
    safe(() => localStorage.removeItem(INTENT_KEY), undefined);
}
export const learnHomePath = (slug: string) => `/learn/${slug}`;

/** Where Google (or any redirect-based sign-in) should land: the free course if that is why they came, else the dashboard. */
export const afterSignInUrl = (): string => {
    const back = getReturnTo();
    const intent = getFreeCourseIntent();
    return window.location.origin + (back || (intent ? learnHomePath(intent) : '/dashboard'));
};
