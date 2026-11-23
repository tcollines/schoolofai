import React, { useState } from 'react';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';
import { afterSignInUrl } from '../src/lib/acquisition';

/**
 * Shown when someone tries to create an account with an email that already has one.
 * One email is one person: Google and email sign-in lead to the same account, so we point them back to it
 * instead of creating a second one. They can sign in the way they used before, or set / reset a password.
 */
const ExistingAccountNotice: React.FC<{
    email: string;
    onSignIn: () => void;
    onChangeEmail: () => void;
}> = ({ email, onSignIn, onChangeEmail }) => {
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);

    const google = async () => {
        setGoogleError(null);
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: afterSignInUrl() } });
        if (error) setGoogleError(error.message);
    };

    const reset = async () => {
        setBusy(true);
        try {
            // Same answer whether or not the address has a password, so nobody can probe for accounts.
            await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        } catch { /* same message either way */ }
        setSent(true);
        setBusy(false);
    };

    return (
        <div role="alert" className="mt-5 rounded-[18px] bg-[#FFF3D6] dark:bg-amber-950/40 p-4 flex items-start gap-3 text-left">
            <span className="w-10 h-10 rounded-[12px] bg-white/70 dark:bg-amber-900/50 flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5 text-[#9A6B00] dark:text-amber-400" /></span>
            <div className="flex-1 min-w-0">
                <h4 className="m-0 text-[15px] font-extrabold">You already have an account</h4>
                <p className="mt-1 mb-0 text-[13px] text-[#6B4A00] dark:text-slate-300 leading-relaxed">
                    <strong className="break-all">{email}</strong> is already registered. Each email has one account, so sign in the way you did before. Your courses and progress are there.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <button type="button" onClick={onSignIn} className="press h-10 px-4 bg-brand hover:bg-brand-mid text-white rounded-[12px] text-[13px] font-bold inline-flex items-center gap-1.5">
                        <LogIn className="w-4 h-4" />Sign in with email
                    </button>
                    <button type="button" onClick={google} className="press h-10 px-4 bg-white dark:bg-slate-800 text-[#1c1917] dark:text-slate-100 border border-[#E5D9B8] dark:border-slate-600 rounded-[12px] text-[13px] font-bold">
                        Continue with Google
                    </button>
                </div>
                {googleError && <p className="mt-2 mb-0 text-[12px] text-red-600">{googleError}</p>}
                <p className="mt-3 mb-0 text-[12px] text-[#6B4A00] dark:text-slate-300 leading-relaxed">
                    {sent
                        ? <>If this email has an account, we have sent a link to set a new password. Check your inbox and spam folder.</>
                        : <>Forgot your password, or signed up with Google and want a password too?{' '}
                            <button type="button" onClick={reset} disabled={busy} className="font-bold underline">
                                {busy ? <Loader2 className="inline animate-spin" size={12} /> : 'Email me a link'}
                            </button></>}
                </p>
                <button type="button" onClick={onChangeEmail} className="mt-2 h-8 text-[13px] font-bold text-[#6B4A00] dark:text-slate-300 hover:underline">Use a different email</button>
            </div>
        </div>
    );
};

export default ExistingAccountNotice;
