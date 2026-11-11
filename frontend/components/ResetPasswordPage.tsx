import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabaseClient } from '../src/lib/supabaseClient';

/**
 * Landing page of the "reset your password" email link.
 * Supabase signs the visitor in with a short-lived recovery session; they choose a new password here.
 */
const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [ready, setReady] = useState(false);
    const [checked, setChecked] = useState(false);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    useEffect(() => {
        let alive = true;
        const { data: sub } = supabaseClient.auth.onAuthStateChange((event: string, session: any) => {
            if (!alive) return;
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) setReady(true);
        });
        supabaseClient.auth.getSession().then(({ data }: any) => {
            if (!alive) return;
            if (data?.session) setReady(true);
            setChecked(true);
        });
        const timer = setTimeout(() => alive && setChecked(true), 2500);
        return () => {
            alive = false;
            clearTimeout(timer);
            sub?.subscription?.unsubscribe?.();
        };
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password.length < 8) {
            setError('Please choose a password of at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('The two passwords do not match.');
            return;
        }
        setBusy(true);
        const { error: updateError } = await supabaseClient.auth.updateUser({ password });
        setBusy(false);
        if (updateError) {
            setError(updateError.message || 'We could not update your password. Please request a new link.');
            return;
        }
        setDone(true);
        await supabaseClient.auth.signOut();
        setTimeout(() => navigate('/login', { replace: true }), 2500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#faf8f5' }}>
            <div className="w-full max-w-md rounded-2xl bg-white border border-stone-200 shadow-sm p-8">
                <h1 className="text-2xl text-stone-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                    Choose a new password
                </h1>
                <p className="text-sm text-stone-500 mb-6">Welile School of AI</p>

                {done ? (
                    <p className="text-sm text-stone-700">
                        Your password has been changed. Taking you to the login page…
                    </p>
                ) : !ready && checked ? (
                    <div className="space-y-4">
                        <p className="text-sm text-stone-700">
                            This reset link has expired or was already used. Please request a new one from the login page.
                        </p>
                        <Link to="/login" className="inline-block text-sm font-semibold" style={{ color: '#6d28d9' }}>
                            Back to login
                        </Link>
                    </div>
                ) : !ready ? (
                    <p className="text-sm text-stone-500">Checking your link…</p>
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <label className="block">
                            <span className="text-xs font-semibold text-stone-600">New password</span>
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-violet-600"
                                required
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-semibold text-stone-600">Confirm new password</span>
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-violet-600"
                                required
                            />
                        </label>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                            style={{ background: '#6d28d9' }}
                        >
                            {busy ? 'Saving…' : 'Save new password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
