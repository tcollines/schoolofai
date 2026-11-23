import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';

/**
 * Runs for every signed-in person:
 *  - accounts opened by a sales agent start with a temporary password: the person must choose their own first;
 *  - accounts created from an agent link (or by an agent) are enrolled in the course they chose, once.
 */
const AccountSetupGate: React.FC<{ session: any }> = ({ session }) => {
    const user = session?.user;
    const meta = user?.user_metadata || {};
    const [mustChange, setMustChange] = useState(false);
    const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
    const [show, setShow] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { setMustChange(!!user && meta.must_change_password === true); }, [user?.id, meta.must_change_password]);

    // Make sure every account has a profile with its name (Google sign-ups and email sign-ups alike), so no extra step is needed.
    useEffect(() => {
        if (!user?.id) return;
        const key = `welile_profile_ready_${user.id}`;
        try { if (localStorage.getItem(key)) return; } catch { /* ignore */ }
        const name = String(meta.full_name || meta.name || [meta.given_name, meta.family_name].filter(Boolean).join(' ') || '').trim();
        (async () => {
            try {
                const { data: row } = await supabase.from('profiles').select('id, full_name, location, onboarding_complete').eq('id', user.id).maybeSingle();
                if (!row) {
                    const { error: e } = await supabase.from('profiles').upsert({ id: user.id, email: user.email, full_name: name || (user.email || '').split('@')[0], onboarding_complete: true, ...(meta.location ? { location: String(meta.location) } : {}) });
                    if (e) return;
                } else {
                    const patch: Record<string, unknown> = {};
                    if ((!row.full_name || row.full_name === 'Student') && name) patch.full_name = name;
                    if (!row.location && meta.location) patch.location = String(meta.location);
                    if (!row.onboarding_complete) patch.onboarding_complete = true;
                    if (Object.keys(patch).length) { const { error: e } = await supabase.from('profiles').update(patch).eq('id', user.id); if (e) return; }
                }
                try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
            } catch { /* try again next visit */ }
        })();
    }, [user?.id]);

    // Apply the email choice made at sign-up, once.
    useEffect(() => {
        if (!user?.id || meta.email_opt_in !== false) return;
        const key = `welile_optout_applied_${user.id}`;
        try { if (localStorage.getItem(key)) return; } catch { /* ignore */ }
        supabase.from('live_reminder_prefs').upsert({ user_id: user.id, email: user.email || null, email_opt_in: false }, { onConflict: 'user_id' })
            .then(({ error: e }) => { if (!e) { try { localStorage.setItem(key, '1'); } catch { /* ignore */ } } });
    }, [user?.id, meta.email_opt_in]);

    // Enrol once in the chosen course (safe to repeat: the database ignores duplicates).
    useEffect(() => {
        const course = meta.enroll_course;
        if (!user?.id || !course || mustChange) return;
        const key = `welile_enrolled_${user.id}_${course}`;
        try { if (localStorage.getItem(key)) return; } catch { /* ignore */ }
        supabase.rpc('learn_enroll', { p_course: course, p_ref: meta.ref_code || null, p_source: meta.signup_source || null })
            .then(({ error: e }) => { if (!e) { try { localStorage.setItem(key, '1'); } catch { /* ignore */ } } });
    }, [user?.id, meta.enroll_course, mustChange]);

    if (!user || !mustChange) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (pw.length < 8) return setError('Your new password needs at least 8 characters.');
        if (pw !== pw2) return setError('The two passwords do not match.');
        setBusy(true);
        const { error: err } = await supabase.auth.updateUser({ password: pw, data: { must_change_password: false } });
        setBusy(false);
        if (err) return setError(err.message);
        setMustChange(false);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Choose your password">
            <form onSubmit={submit} className="bg-white dark:bg-slate-900 text-ink dark:text-slate-100 rounded-[22px] shadow-2xl p-6 max-w-sm w-full space-y-4">
                <div className="w-12 h-12 rounded-[14px] bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 flex items-center justify-center"><ShieldCheck size={24} /></div>
                <div><p className="text-lg font-semibold">Choose your own password</p><p className="mt-1 text-[15px] text-stone-600 dark:text-slate-300">Your account was opened for you with a temporary password. Pick a new one that only you know.</p></div>
                <div className="relative">
                    <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" placeholder="New password" aria-label="New password" className="w-full rounded-[14px] bg-white dark:bg-slate-950 px-4 py-3 pr-12 text-base" />
                    <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-500">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <input type={show ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" placeholder="Repeat new password" aria-label="Repeat new password" className="w-full rounded-[14px] bg-white dark:bg-slate-950 px-4 py-3 text-base" />
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={busy} className="w-full min-h-[48px] rounded-[14px] bg-violet-700 hover:bg-brand-mid text-white font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2">{busy && <Loader2 size={16} className="animate-spin" />} Save password</button>
            </form>
        </div>
    );
};
export default AccountSetupGate;
