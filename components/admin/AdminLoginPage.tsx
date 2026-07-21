import React, { useState, useEffect } from 'react';
import { Mail, Lock, KeyRound, ShieldAlert, ArrowLeft, Loader2, Info, Sun, Moon } from 'lucide-react';
import { supabaseClient } from '../../src/lib/supabaseClient';

interface AdminLoginPageProps {
    onLoginSuccess: () => void;
    onBackToStudentPortal: () => void;
    isInstructor?: boolean;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onBackToStudentPortal, isInstructor }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passcode, setPasscode] = useState('');
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

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Security passcode check (from branch)
        if (isInstructor) {
            const isValidPasscode = passcode === 'instructor123' || passcode === 'WELILE_INSTRUCTOR_2026';
            if (!isValidPasscode) {
                setError('Incorrect Security Passcode. Access denied.');
                setLoading(false);
                return;
            }
        } else {
            const isValidPasscode = passcode === 'admin123' || passcode === 'WELILE_ADMIN_2026';
            if (!isValidPasscode) {
                setError('Incorrect Security Passcode. Access denied.');
                setLoading(false);
                return;
            }
        }

        try {
            // First check if it's the demo credentials
            let isAuthenticated = false;
            if (isInstructor) {
                const isValidEmail = email.trim().toLowerCase() === 'instructor@welile.com' || email.trim().toLowerCase() === 'instructor@test.com' || email.trim().toLowerCase() === 'sarah.jenkins@schoolofai.edu' || email.trim().toLowerCase() === 'kenji.tanaka@schoolofai.edu' || email.trim().toLowerCase() === 'marcus.vance@schoolofai.edu';
                const isValidPassword = password === 'instructorpassword' || password === 'instructor';
                if (isValidEmail && isValidPassword) isAuthenticated = true;
            } else {
                const isValidEmail = email.trim().toLowerCase() === 'admin@welile.com' || email.trim().toLowerCase() === 'admin@test.com';
                const isValidPassword = password === 'adminpassword' || password === 'admin';
                if (isValidEmail && isValidPassword) isAuthenticated = true;
            }

            // Fallback to Supabase if not using valid demo credentials
            if (!isAuthenticated) {
                const { error: signInError } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

                if (signInError) {
                    setError(signInError.message);
                    setLoading(false);
                    return;
                }
            }

            // Success! Store appropriate session token
            if (isInstructor) {
                localStorage.setItem('instructor-session', 'true');
            } else {
                localStorage.setItem('admin-session', 'true');
            }
            setLoading(false);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setLoading(false);
        }
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
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                    <ArrowLeft size={14} /> Back to Portal
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

                    {/* Hint / Demo Credentials Box */}
                    <div className="mb-6 bg-slate-100/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4 space-y-2 transition-colors duration-300">
                        <div className="flex items-center gap-2 text-violet-500 dark:text-violet-400">
                            <Info size={14} />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Demo Credentials</span>
                        </div>
                        {isInstructor ? (
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Inst. Email:</span>
                                <code className="text-violet-600 dark:text-violet-300">instructor@test.com</code>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Password:</span>
                                <code className="text-violet-600 dark:text-violet-300">instructor</code>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Passcode:</span>
                                <code className="text-violet-600 dark:text-violet-300">instructor123</code>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Admin Email:</span>
                                <code className="text-violet-600 dark:text-violet-300">admin@welile.com</code>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Password:</span>
                                <code className="text-violet-600 dark:text-violet-300">adminpassword</code>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Passcode:</span>
                                <code className="text-violet-600 dark:text-violet-300">admin123</code>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-300 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start transition-colors duration-300">
                            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleAdminSubmit} className="space-y-4">
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
                                    placeholder={isInstructor ? "instructor@test.com" : "admin@welile.com"}
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

                        {/* Passcode Input (Distinct Rule check) */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Security Passcode</label>
                                <span className="text-[10px] text-violet-500 dark:text-violet-400 font-bold bg-violet-100 dark:bg-violet-950/40 px-1.5 py-0.5 rounded">REQUIRED</span>
                            </div>
                            <div className="relative">
                                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder={isInstructor ? "Secret Instructor Key" : "Secret Admin Key"}
                                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-2xl outline-none transition-all text-sm font-mono tracking-widest placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-sans placeholder:tracking-normal"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Different from ordinary student login authentication.</p>
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
