import React, { useState, useEffect } from 'react';
import { Mail, Lock, KeyRound, ShieldAlert, ArrowLeft, Loader2, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { RESET_PASSWORD_URL } from '../../lib/consoleAuth';

interface AdminLoginPageProps {
    onLoginSuccess: () => void;
    onBackToStudentPortal: () => void;
    isInstructor?: boolean;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onBackToStudentPortal, isInstructor }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [notice, setNotice] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDark, setIsDark] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    // Sync with external theme changes (e.g. from SettingsPage)
    useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('theme-change', handleThemeChange);
        return () => window.removeEventListener('theme-change', handleThemeChange);
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
        window.dispatchEvent(new Event('theme-change'));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setNotice(null);
        try {
            const cleanEmail = email.trim().toLowerCase();
            const { data, error: signErr } = await supabaseClient.auth.signInWithPassword({ email: cleanEmail, password });
            if (signErr || !data?.user) {
                setError(signErr?.message || 'Sign-in failed. Check your email and password.');
                return;
            }
            const { data: prof, error: profErr } = await supabaseClient
                .from('profiles')
                .select('role, full_name')
                .eq('id', data.user.id)
                .maybeSingle();
            const role = String(prof?.role || '').toUpperCase();
            const allowed = isInstructor ? (role === 'INSTRUCTOR' || role === 'ADMIN') : role === 'ADMIN';
            if (profErr || !allowed) {
                await supabaseClient.auth.signOut(); // leave no session behind
                setError(isInstructor ? 'This account is not an instructor or administrator' : 'This account is not an administrator');
                return;
            }
            if (isInstructor) {
                localStorage.setItem('instructor-session', 'true');
                localStorage.setItem('instructor-email', cleanEmail);
                localStorage.setItem('instructor-name', prof?.full_name || cleanEmail.split('@')[0]);
            } else {
                localStorage.setItem('admin-session', 'true');
                localStorage.setItem('admin-email', cleanEmail);
            }
            onLoginSuccess();
        } catch (err: any) {
            console.error('Authentication error:', err);
            setError(err?.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setError(null);
        setNotice(null);
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
            setError('Enter your email above first, then click "Forgot password?".');
            return;
        }
        const { error: resetErr } = await supabaseClient.auth.resetPasswordForEmail(cleanEmail, { redirectTo: RESET_PASSWORD_URL });
        if (resetErr) {
            setError(resetErr.message);
            return;
        }
        setNotice('If an account exists for that email, a password reset link has been sent.');
    };

    const field = 'w-full h-[52px] rounded-[14px] border-2 border-transparent bg-panel dark:bg-night-3 pl-11 pr-4 text-[15px] text-ink dark:text-white placeholder-[#9A94AE] outline-none focus:border-brand transition-colors';

    return (
        <div className="min-h-[100dvh] bg-panel dark:bg-night text-ink dark:text-white p-3 sm:p-4 flex font-sans">
            <div className="w-full max-w-[1240px] mx-auto flex flex-col lg:flex-row gap-3 sm:gap-4">
                {/* brand panel */}
                <section className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-night text-white p-7 sm:p-9 lg:w-[52%] flex flex-col min-h-[300px] lg:min-h-0">
                    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
                        <span className="absolute -right-24 -top-28 w-[360px] h-[360px] rounded-full bg-night-3" />
                        <span className="absolute -left-20 -bottom-40 w-[380px] h-[380px] rounded-full bg-night-2" />
                    </div>
                    <div className="relative flex items-center gap-3">
                        <span className="w-11 h-11 rounded-[13px] bg-brand inline-flex items-center justify-center text-[20px] font-extrabold">W</span>
                        <span className="leading-tight"><span className="block text-[17px] font-extrabold">{isInstructor ? 'Welile Instructor' : 'Welile Admin'}</span><span className="block text-[12px] text-[#B9B2CC]">School of AI</span></span>
                    </div>
                    <div className="relative flex-1" />
                    <div className="relative mt-8">
                        <p className="m-0 inline-flex items-center gap-2 h-8 px-3 rounded-full bg-night-3 text-[12px] font-extrabold text-lime-200"><ShieldAlert size={14} />{isInstructor ? 'Instructors only' : 'Staff and instructors only'}</p>
                        <h1 className="mt-4 mb-0 text-[34px] sm:text-[44px] leading-[1.05] font-extrabold tracking-[-0.03em]">{isInstructor ? <>Teach and run<br /><span className="text-lime-200">your classes.</span></> : <>Run the school<br /><span className="text-lime-200">from one place.</span></>}</h1>
                        <p className="mt-3.5 mb-0 max-w-[460px] text-[15px] leading-relaxed text-[#CFC8DC]">
                            {isInstructor ? 'Course Setup, Cohorts, Exam Setup and Ongoing Events.' : 'Students, payments, live classes, agents and courses. Instructors see only Course Setup, Cohorts, Exam Setup and Ongoing Events.'}
                        </p>
                    </div>
                </section>

                {/* form panel */}
                <section className="relative flex-1 rounded-[28px] sm:rounded-[32px] bg-white dark:bg-night-2 p-6 sm:p-9 flex flex-col">
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={onBackToStudentPortal} className="press h-10 px-3.5 rounded-[12px] bg-panel dark:bg-night-3 text-[13px] font-bold inline-flex items-center gap-2">
                            <ArrowLeft size={15} />Student site
                        </button>
                        <button type="button" onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} className="press w-10 h-10 rounded-[12px] bg-panel dark:bg-night-3 inline-flex items-center justify-center text-[#6B6680] dark:text-slate-300">
                            {isDark ? <Sun size={17} /> : <Moon size={17} />}
                        </button>
                    </div>
                    <div className="w-full max-w-[400px] mx-auto my-auto py-8">
                        <h2 className="m-0 text-[30px] font-extrabold tracking-[-0.03em]">{isInstructor ? 'Instructor sign in' : 'Admin sign in'}</h2>
                        <p className="mt-1.5 mb-0 text-[14px] text-[#6B6680] dark:text-slate-400">Use your Welile staff account.</p>

                        {error && (
                            <div role="alert" className="mt-5 rounded-[14px] bg-[#FDECE8] dark:bg-red-950/30 text-[#A3321F] dark:text-red-300 p-3.5 text-[14px] flex gap-2.5 items-start">
                                <ShieldAlert size={16} className="shrink-0 mt-0.5" /><span>{error}</span>
                            </div>
                        )}
                        {notice && (
                            <div role="status" className="mt-5 rounded-[14px] bg-mint-soft dark:bg-emerald-950/30 text-[#0E5A35] dark:text-emerald-300 p-3.5 text-[14px] flex gap-2.5 items-start">
                                <CheckCircle2 size={16} className="shrink-0 mt-0.5" /><span>{notice}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="adm-email" className="block text-[13px] font-bold mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A94AE] pointer-events-none" />
                                    <input id="adm-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@welile.com" className={field} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="adm-pass" className="text-[13px] font-bold">Password</label>
                                    <button type="button" onClick={handleForgotPassword} className="text-[13px] font-bold text-brand dark:text-violet-300 hover:underline">Forgot password?</button>
                                </div>
                                <div className="relative">
                                    <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A94AE] pointer-events-none" />
                                    <input id="adm-pass" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className={field} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="press w-full h-[52px] rounded-[14px] bg-brand hover:bg-brand-mid text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-60 !mt-6">
                                {loading ? <><Loader2 size={17} className="animate-spin" />Checking access…</> : 'Sign in'}
                            </button>
                        </form>
                        <p className="mt-6 mb-0 text-center text-[12px] text-[#6B6680] dark:text-slate-400">Authorised Welile staff only. Every sign-in is checked against your account role.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminLoginPage;
