import React, { useState, useEffect } from 'react';
import { Mail, ShieldAlert, ArrowLeft, Loader2, KeyRound, Sun, Moon } from 'lucide-react';
import { mysqlClient } from '../../src/lib/mysqlClient';

interface AdminLoginPageProps {
    onLoginSuccess: () => void;
    onBackToStudentPortal: () => void;
    isInstructor?: boolean;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onBackToStudentPortal, isInstructor }) => {
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState<'email' | 'otp' | 'setup-password' | 'password'>('email');
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

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const emailClean = email.trim().toLowerCase();

        if (isInstructor) {
            try {
                // Verify instructor status and whether password setup is needed
                const statusRes = await fetch('/api/auth/instructor/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailClean })
                });
                const statusData = await statusRes.json();
                if (!statusRes.ok) throw new Error(statusData.error || 'Failed to verify instructor status.');

                if (statusData.needsSetup) {
                    // Send Google OTP code for setup
                    const otpRes = await fetch('/api/auth/google-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailClean })
                    });
                    const otpData = await otpRes.json();
                    if (!otpRes.ok) throw new Error(otpData.error || 'Failed to send verification code.');

                    setStep('otp');
                } else {
                    // Password already set once! Go directly to password screen
                    setStep('password');
                }
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Verification failed.');
                setLoading(false);
            }
        } else {
            // Strict check: Only chemayekabraham289@gmail.com is allowed admin access
            if (emailClean !== 'chemayekabraham289@gmail.com') {
                setError("Access Denied: Only chemayekabraham289@gmail.com is allowed to access the admin console. Please seek permissions from chemayekabraham289@gmail.com.");
                setLoading(false);
                return;
            }

            try {
                // Check if admin has set a password yet
                const statusRes = await fetch('/api/auth/admin/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailClean })
                });
                const statusData = await statusRes.json();
                if (!statusRes.ok) throw new Error(statusData.error || 'Failed to verify admin status.');

                if (statusData.needsSetup) {
                    // Send Google OTP code for setup
                    const otpRes = await fetch('/api/auth/google-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailClean })
                    });
                    const otpData = await otpRes.json();
                    if (!otpRes.ok) throw new Error(otpData.error || 'Failed to send verification code.');

                    setStep('otp');
                } else {
                    // Password already set once! Go directly to password screen
                    setStep('password');
                }
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Verification failed.');
                setLoading(false);
            }
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const emailClean = email.trim().toLowerCase();

        try {
            const res = await fetch('/api/auth/google-otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailClean, code: otpCode })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Invalid verification code.');
            }

            // Both admin and instructor go to setup password next
            setStep('setup-password');
            setLoading(false);
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please check the code sent to your Gmail inbox.');
            setLoading(false);
        }
    };

    const handleSetupPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError(null);

        const emailClean = email.trim().toLowerCase();
        try {
            const endpoint = isInstructor ? '/api/auth/instructor/set-password' : '/api/auth/admin/set-password';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailClean, password })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to initialize password.');
            }

            if (isInstructor) {
                const { data: instructorData } = await mysqlClient
                    .from('instructors')
                    .select('*')
                    .eq('email', emailClean);

                const instructor = instructorData?.[0] || {};
                localStorage.setItem('instructor-session', 'true');
                localStorage.setItem('instructor-email', emailClean);
                localStorage.setItem('instructor-name', instructor.name || emailClean.split('@')[0]);
            } else {
                localStorage.setItem('admin-session', 'true');
                localStorage.setItem('admin-email', emailClean);
            }
            
            setLoading(false);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to initialize password.');
            setLoading(false);
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const emailClean = email.trim().toLowerCase();
        try {
            const endpoint = isInstructor ? '/api/auth/instructor-login' : '/api/auth/admin-login';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailClean, password })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Invalid password.');
            }

            if (isInstructor) {
                localStorage.setItem('instructor-session', 'true');
                localStorage.setItem('instructor-email', emailClean);
                localStorage.setItem('instructor-name', data.instructor?.name || emailClean.split('@')[0]);
            } else {
                localStorage.setItem('admin-session', 'true');
                localStorage.setItem('admin-email', emailClean);
            }

            setLoading(false);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Access denied.');
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
                    className="flex items-center gap-0 sm:gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 sm:px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                    <ArrowLeft size={14} className="sm:hidden" />
                    <span className="hidden sm:inline">Back to Portal</span>
                </button>

                {/* Light/Dark Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer shadow-sm"
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>

            {/* Main Form Box */}
            <div className="flex-1 flex items-center justify-center py-10 relative z-10">
                <div className="w-full max-w-md bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-8 transition-colors duration-300">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 mb-4">
                            <KeyRound size={22} />
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

                    {step === 'email' && (
                        <form onSubmit={handleSendCode} className="space-y-4">
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
                                        placeholder={isInstructor ? "instructor@test.com" : "admin@example.com"}
                                        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-2xl outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-750 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors cursor-pointer shadow-lg shadow-violet-200 dark:shadow-violet-950/20 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Verifying...
                                    </>
                                ) : 'Continue'}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            {/* OTP Code Input */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">6-Digit Verification Code</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setStep('email')} 
                                        className="text-xs text-violet-500 hover:text-violet-600 dark:text-violet-400 font-bold"
                                    >
                                        Change Email
                                    </button>
                                </div>
                                <div className="relative">
                                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        pattern="[0-9]{6}"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Enter 6-digit code"
                                        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-2xl outline-none transition-all text-sm tracking-widest placeholder:tracking-normal placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Please enter the 6-digit code sent to your Gmail inbox.</p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-750 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors cursor-pointer shadow-lg shadow-violet-200 dark:shadow-violet-950/20 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Verifying Access...
                                    </>
                                ) : 'Verify Code'}
                            </button>
                        </form>
                    )}

                    {step === 'setup-password' && (
                        <form onSubmit={handleSetupPassword} className="space-y-4">
                            <div className="space-y-1.5 text-center mb-2">
                                <p className="text-xs text-slate-500 dark:text-slate-450">Initialize your secure Admin password. You will only need to set this password once.</p>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 text-slate-900 dark:text-white px-4 py-3 rounded-2xl outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm Password"
                                        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 text-slate-900 dark:text-white px-4 py-3 rounded-2xl outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || password !== confirmPassword}
                                className="w-full bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-750 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors cursor-pointer shadow-lg shadow-violet-200 dark:shadow-violet-950/20 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Saving Password...
                                    </>
                                ) : 'Set Admin Password'}
                            </button>
                        </form>
                    )}

                    {step === 'password' && (
                        <form onSubmit={handlePasswordLogin} className="space-y-4">
                            {/* Password Input */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Password</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setStep('email')} 
                                        className="text-xs text-violet-500 hover:text-violet-600 dark:text-violet-400 font-bold"
                                    >
                                        Change Email
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 text-slate-900 dark:text-white px-4 py-3 rounded-2xl outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-750 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors cursor-pointer shadow-lg shadow-violet-200 dark:shadow-violet-950/20 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Logging in...
                                    </>
                                ) : 'Log in'}
                            </button>
                        </form>
                    )}
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
