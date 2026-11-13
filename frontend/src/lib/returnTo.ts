// "Continue where you stopped": when someone is sent to log in or sign up from a page, remember that page
// and bring them back to it afterwards (email login, sign-up, email verification and Google all included).

const KEY = 'welile_return_to_v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const NEVER = ['/', '/login', '/signup', '/reset-password', '/onboarding', '/admin', '/instructor', '/logout'];

const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn(); } catch { return fallback; } };

const allowed = (path: string) =>
    path.startsWith('/') && !path.startsWith('//') &&
    !NEVER.some(p => (p === '/' ? path === '/' : path === p || path.startsWith(p + '/') || path.startsWith(p + '?')));

export function setReturnTo(path: string) {
    if (!allowed(path)) return;
    safe(() => localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() })), undefined);
}

export function getReturnTo(): string | null {
    return safe(() => {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const v = JSON.parse(raw);
        if (!v?.path || Date.now() - v.at > MAX_AGE_MS || !allowed(v.path)) { localStorage.removeItem(KEY); return null; }
        return v.path as string;
    }, null);
}

export function clearReturnTo() {
    safe(() => localStorage.removeItem(KEY), undefined);
}
