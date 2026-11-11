import React, { useState } from 'react';
import { Database, Loader2, ShieldAlert } from 'lucide-react';
import { supabaseClient } from '../../src/lib/supabaseClient';

/**
 * Shown by the new admin pages when the database says "not authorized".
 * Learner and staff data is only visible to a real signed-in administrator account (profile role ADMIN).
 * The existing console login is untouched; this is an extra, optional sign-in used only by these pages.
 */
const AdminAuthPrompt: React.FC<{ onSignedIn: () => void }> = ({ onSignedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const { error: err } = await supabaseClient.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        setBusy(false);
        if (err) { setError(err.message); return; }
        onSignedIn();
    };

    return (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-5 max-w-lg">
            <div className="flex gap-3">
                <ShieldAlert className="text-amber-600 shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold">Administrator sign-in needed for this page</p>
                    <p className="mt-1">Student and staff information is only shown to a signed-in administrator account (a user whose profile role is ADMIN). Sign in with your administrator email and password. Your normal console login is not affected.</p>
                </div>
            </div>
            <form onSubmit={submit} className="mt-4 grid gap-3">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Administrator email" autoComplete="username"
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm" />
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2.5 text-sm disabled:opacity-60">
                    {busy && <Loader2 size={16} className="animate-spin" />} Sign in
                </button>
            </form>
        </div>
    );
};

export const MissingDbNotice: React.FC = () => (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-5 max-w-2xl flex gap-3">
        <Database className="text-amber-600 shrink-0" />
        <div className="text-sm">
            <p className="font-semibold">The free-course database update is not installed yet</p>
            <p className="mt-1">Run these two files in the Supabase SQL Editor, in this order. They only add new tables and functions and do not change existing data:</p>
            <ol className="mt-2 list-decimal list-inside font-mono text-xs space-y-1">
                <li>supabase/migrations/20261111000000_free_course_foundation.sql</li>
                <li>supabase/migrations/20261111010000_staff_portal_live_admin_server_grading.sql</li>
            </ol>
        </div>
    </div>
);

export default AdminAuthPrompt;
