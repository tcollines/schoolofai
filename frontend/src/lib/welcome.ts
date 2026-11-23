import { supabase } from './supabaseClient';

/**
 * First-login "Get started" screen.
 * Shown once to new accounts (created in the last 14 days) that have not seen it yet.
 * Remembered on this device and on the account, so it does not come back on another phone.
 */
const key = (uid: string) => `welile_welcome_seen_${uid}`;
const NEW_ACCOUNT_DAYS = 14;

export const needsWelcome = (session: any): boolean => {
    const user = session?.user;
    if (!user?.id) return false;
    try { if (localStorage.getItem(key(user.id))) return false; } catch { /* ignore */ }
    if (user.user_metadata?.welcome_seen) return false;
    const created = user.created_at ? new Date(user.created_at).getTime() : 0;
    return !!created && Date.now() - created < NEW_ACCOUNT_DAYS * 86400000;
};

export const markWelcomeSeen = (session: any) => {
    const uid = session?.user?.id;
    if (!uid) return;
    try { localStorage.setItem(key(uid), new Date().toISOString()); } catch { /* ignore */ }
    void supabase.auth.updateUser({ data: { welcome_seen: true } }).catch(() => { /* saved on this device anyway */ });
};

/**
 * "Welcome to your new dashboard" tour.
 * Shown once to students who already used the app before the redesign.
 * New students get the Get started screen instead, so seeing that also counts as seeing the tour.
 */
const tourKey = (uid: string) => `welile_whatsnew_v1_${uid}`;

export const needsWhatsNew = (session: any): boolean => {
    const user = session?.user;
    if (!user?.id) return false;
    if (needsWelcome(session)) return false;
    try {
        if (localStorage.getItem(tourKey(user.id)) || localStorage.getItem(key(user.id))) return false;
    } catch { /* ignore */ }
    const m = user.user_metadata || {};
    return !(m.whats_new_v1_seen || m.welcome_seen);
};

export const markWhatsNewSeen = (session: any) => {
    const uid = session?.user?.id;
    if (!uid) return;
    try { localStorage.setItem(tourKey(uid), new Date().toISOString()); } catch { /* ignore */ }
    void supabase.auth.updateUser({ data: { whats_new_v1_seen: true } }).catch(() => { /* saved on this device anyway */ });
};
