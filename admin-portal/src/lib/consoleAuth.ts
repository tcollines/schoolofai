import { supabaseClient } from './supabaseClient';

export type ConsoleRoleCheck =
    | { ok: true; email: string; name: string; role: string }
    | { ok: false; reason: 'no-session' | 'wrong-role' | 'error' };

/** Verifies a LIVE Supabase session whose profile has the required role (ADMIN; or INSTRUCTOR/ADMIN for instructor mode). */
export const verifyConsoleSession = async (isInstructor: boolean): Promise<ConsoleRoleCheck> => {
    try {
        const { data: sess } = await supabaseClient.auth.getSession();
        const user = sess?.session?.user;
        if (!user) return { ok: false, reason: 'no-session' };
        const { data: prof, error } = await supabaseClient
            .from('profiles')
            .select('role, full_name, email')
            .eq('id', user.id)
            .maybeSingle();
        if (error) return { ok: false, reason: 'error' };
        const role = String(prof?.role || '').toUpperCase();
        const allowed = isInstructor ? (role === 'INSTRUCTOR' || role === 'ADMIN') : role === 'ADMIN';
        if (!allowed) return { ok: false, reason: 'wrong-role' };
        const email = String(user.email || prof?.email || '').trim().toLowerCase();
        return { ok: true, email, name: prof?.full_name || email.split('@')[0], role };
    } catch {
        return { ok: false, reason: 'error' };
    }
};

export const clearConsoleFlags = () => {
    ['admin-session', 'admin-email', 'instructor-session', 'instructor-email', 'instructor-name'].forEach(k => {
        try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
};

export const RESET_PASSWORD_URL = 'https://www.welileschoolofai.org/reset-password';
