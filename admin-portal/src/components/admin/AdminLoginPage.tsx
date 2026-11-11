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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden font-sans transition-colors duration-300">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-200/40 dark:bg-violet-900/10 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-emerald-200/30 dark:bg-emerald-900/10 blur-[150px] pointer-events-none"></div>

            {/* Top Bar: Back Button + Theme Toggle */}
            <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
                <button
                    onClick={onBackToStudentPortal}
                    className="flex items-center gap-0 sm:gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 sm:px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                    <ArrowLeft size={14} className="sm:hidden" />
                    <span className="hidden sm:inline">Back to Portal</span>
                </button>

                {/* Light/Dark Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    className="group flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer shadow-sm
                        text-slate-500 dark:text-slate-400 
                        hover:text-amber-600 dark:hover:text-amber-300
                        bg-white/70 dark:bg-slate-900/50 
                        hover:bg-amber-50 dark:hover:bg-slate-800 
                        border-slate-200 dark:border-slate-800
                        transition-colors duration-300"
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? (
                        <>
                            <Sun size={14} className="transition-transform group-hover:rotate-45 duration-500" />
                            Light Mode
                        </>
                    ) : (
                        <>
                            <Moon size={14} className="transition-transform group-hover:-rotate-12 duration-300" />
                            Dark Mode
                        </>
                    )}
                </button>
            </div>

            {/* Card Container */}
            <div className="flex-1 flex items-center justify-center py-12">
                <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800/80 p-8 w-full max-w-md shadow-2xl shadow-slate-200/50 dark:shadow-black/20 relative transition-colors duration-300">
                    <div className="text-center mb-8">
                        {/* Shield Icon Accent */}
                        <div className="mx-auto w-12 h-12 bg-violet-100 dark:bg-violet-950/50 border border-violet-300 dark:border-violet-800/60 text-violet-500 dark:text-violet-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-100 dark:shadow-violet-950/20 transition-colors duration-300">
                            <KeyRound size={22} className="animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">
                            {isInstructor ? 'Instructor Console' : 'Admin Console'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 uppercase tracking-wider font-semibold">
                            {isInstructor ? 'Instructor Access Portal' : 'Administrative Access Portal'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-300 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start transition-colors duration-300">
                            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {notice && (
                        <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start transition-colors duration-300">
                            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                            <span className="font-medium">{notice}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Console Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-2xl outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Console Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-2xl outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="button" onClick={handleForgotPassword} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer">
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-750 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors cursor-pointer shadow-lg shadow-violet-200 dark:shadow-violet-950/20 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Verifying Access
                                </>
                            ) : (isInstructor ? 'Authenticate Instructor' : 'Authenticate Console')}
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-4 text-[10px] text-slate-400 dark:text-slate-600 font-medium transition-colors duration-300">
                {isInstructor 
                    ? 'Welile School Instructor Access Area • Authorized Credentials Only.'
                    : 'Welile School Administrative Access Area • Authorized Credentials Only.'
                }
            </div>
        </div>
    );
};

export default AdminLoginPage;
