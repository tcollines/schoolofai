import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { mysqlClient } from '../src/lib/mysqlClient';
import { ArrowLeft, Mail, Lock, User, Loader2, X, KeyRound, ShieldCheck, Clock, Eye, EyeOff, Brain, Cpu, Sparkles } from 'lucide-react';

interface LoginPageProps {
    onLogin: () => void;
    onNavigateToSignup: () => void;
    onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToSignup, onBack }) => {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    
    const toggleTheme = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('theme-change'));
    };

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [step, setStep] = useState<'login' | 'mfa' | 'forgot-email' | 'forgot-code' | 'forgot-newpass' | 'google-verify'>('login');
    const [mfaCode, setMfaCode] = useState('');
    const [correctCode, setCorrectCode] = useState('');
    const [showGmailToast, setShowGmailToast] = useState(false);
    const [showGoogleChooser, setShowGoogleChooser] = useState(false);
    
    // Google verification states
    const [pendingGoogleEmail, setPendingGoogleEmail] = useState('');
    const [pendingGoogleName, setPendingGoogleName] = useState('');
    const [googleVerifyInput, setGoogleVerifyInput] = useState('');
    const [pendingUser, setPendingUser] = useState<{ email: string; fullName: string } | null>(null);

    // Forgot password state
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotCode, setForgotCode] = useState('');
    const [forgotResetCode, setForgotResetCode] = useState('');
    const [forgotCodeExpiry, setForgotCodeExpiry] = useState<number>(0);
    const [forgotTimeLeft, setForgotTimeLeft] = useState(0);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Countdown timer for forgot password code
    useEffect(() => {
        if (step === 'forgot-code' && forgotCodeExpiry > 0) {
            timerRef.current = setInterval(() => {
                const remaining = Math.max(0, Math.floor((forgotCodeExpiry - Date.now()) / 1000));
                setForgotTimeLeft(remaining);
                if (remaining <= 0) {
                    if (timerRef.current) clearInterval(timerRef.current);
                }
            }, 1000);
            return () => { if (timerRef.current) clearInterval(timerRef.current); };
        }
    }, [step, forgotCodeExpiry]);

    // Handle Google OAuth redirect parameters/errors
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlError = params.get('error');
        const urlStep = params.get('step');
        const urlEmail = params.get('email');
        const urlName = params.get('name');

        if (urlError) {
            setError(`${urlError}. Please make sure you are signing in with a correct Google email (and ensure it has been added as a Test User in your Google Cloud Console if the app is still in verification/testing mode).`);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlStep === 'google-verify' && urlEmail) {
            setPendingGoogleEmail(urlEmail);
            setPendingGoogleName(urlName || '');
            setStep('google-verify');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleForgotSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Check if user exists
        const { data } = await mysqlClient.from('profiles').select('*');
        const profiles = (data as any[]) || [];
        const userExists = profiles.some((p: any) => p.email === forgotEmail.trim().toLowerCase());

        if (!userExists) {
            setError('No account found with that email address.');
            setLoading(false);
            return;
        }

        // Generate 6-digit code with 3-minute expiry
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setForgotResetCode(code);
        const expiry = Date.now() + 3 * 60 * 1000; // 3 minutes
        setForgotCodeExpiry(expiry);
        setForgotTimeLeft(180);
        setShowGmailToast(true);
        setCorrectCode(code);
        setStep('forgot-code');
        setLoading(false);
    };

    const handleForgotVerifyCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (Date.now() > forgotCodeExpiry) {
            setError('Verification code has expired. Please request a new one.');
            return;
        }

        if (forgotCode !== forgotResetCode) {
            setError('Invalid verification code. Please check the code sent to your email.');
            return;
        }

        setShowGmailToast(false);
        setStep('forgot-newpass');
    };

    const handleForgotResendCode = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setForgotResetCode(code);
        setCorrectCode(code);
        const expiry = Date.now() + 3 * 60 * 1000;
        setForgotCodeExpiry(expiry);
        setForgotTimeLeft(180);
        setForgotCode('');
        setError(null);
        setShowGmailToast(true);
    };

    const handleSetNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        // Update password in mock DB
        const { data } = await mysqlClient.from('profiles').select('*');
        const profiles = (data as any[]) || [];
        const profile = profiles.find((p: any) => p.email === forgotEmail.trim().toLowerCase());
        if (profile) {
            await mysqlClient.from('profiles').update({ password: newPassword }).eq('id', profile.id);
            
            setLoading(false);
            setPasswordChanged(true);

            // Log in the user immediately and direct them to dashboard after a brief delay
            setTimeout(() => {
                localStorage.removeItem('auth_logged_out');
                localStorage.setItem('auth_logged_in_email', profile.email);
                localStorage.setItem('auth_logged_in_name', profile.full_name || profile.email.split('@')[0]);
                localStorage.removeItem('admin-session');
                localStorage.removeItem('admin-email');
                localStorage.removeItem('instructor-session');
                localStorage.removeItem('instructor-email');
                window.dispatchEvent(new Event('profile-update'));

                setPasswordChanged(false);
                setForgotEmail('');
                setForgotCode('');
                setNewPassword('');
                setConfirmPassword('');
                setStep('login');
                onLogin();
            }, 1500);
        } else {
            setError('User profile not found.');
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await mysqlClient.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password: password
            });

            if (error) {
                throw new Error(error.message || 'Invalid email or password');
            }

            setLoading(false);
            onLogin();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/google-otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingUser?.email, code: mfaCode })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Invalid verification code.');
            }

            localStorage.removeItem('auth_logged_out');
            localStorage.setItem('auth_logged_in_email', data.user.email);
            localStorage.setItem('auth_logged_in_name', data.user.fullName);
            localStorage.removeItem('admin-session');
            localStorage.removeItem('admin-email');
            localStorage.removeItem('instructor-session');
            localStorage.removeItem('instructor-email');
            window.dispatchEvent(new Event('profile-update'));

            onLogin();
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please check the code sent to your Gmail inbox.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = '/api/auth/google';
    };

    const handleSelectGoogleAccount = async (selectedEmail: string, name: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/google-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: selectedEmail })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to send verification code.');
            }

            setPendingGoogleEmail(selectedEmail);
            setPendingGoogleName(name);
            setGoogleVerifyInput('');
            setStep('google-verify');
            setShowGoogleChooser(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/google-otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingGoogleEmail, code: googleVerifyInput })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Invalid verification code.');
            }

            localStorage.removeItem('auth_logged_out');
            localStorage.setItem('auth_logged_in_email', data.user.email);
            localStorage.setItem('auth_logged_in_name', data.user.fullName);
            window.dispatchEvent(new Event('profile-update'));

            setStep('login');
            onLogin();
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Orbs */}
            <div className="absolute top-10 left-10 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <Link
                to="/"
                className="absolute top-8 left-8 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 z-20 text-sm font-semibold transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
            </Link>

            {/* Theme Toggle Button */}
            <button
                type="button"
                onClick={toggleTheme}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors z-20"
                aria-label="Toggle Theme"
            >
                <svg className="w-5 h-5 fill-current text-black dark:text-white" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v16z"/>
                </svg>
            </button>

            {/* Main Overhauled Card Layout */}
            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-gray-150 dark:border-slate-800/80 flex flex-col lg:flex-row relative z-10 transition-colors duration-300">
                
                {/* Custom styling inject for active tab curves */}
                <style>{`
                    .active-tab-curve::before {
                        content: '';
                        position: absolute;
                        top: -20px;
                        right: 0;
                        width: 20px;
                        height: 20px;
                        background-color: transparent;
                        border-bottom-right-radius: 20px;
                        box-shadow: 0 10px 0 0 var(--tab-bg);
                    }
                    .active-tab-curve::after {
                        content: '';
                        position: absolute;
                        bottom: -20px;
                        right: 0;
                        width: 20px;
                        height: 20px;
                        background-color: transparent;
                        border-top-right-radius: 20px;
                        box-shadow: 0 -10px 0 0 var(--tab-bg);
                    }
                    :root {
                        --tab-bg: #ffffff;
                    }
                    .dark {
                        --tab-bg: #0f172a;
                    }
                `}</style>

                {/* Left side curved vertical tabs */}
                <div className="hidden lg:flex lg:w-[32%] bg-gradient-to-br from-violet-600 via-violet-750 to-indigo-900 dark:from-violet-950 dark:via-slate-900 dark:to-indigo-950 flex-col justify-center items-end py-16 relative overflow-hidden">
                    {/* Overlapping diagonal geometry bands */}
                    <div className="absolute -top-12 -left-12 w-48 h-96 bg-white/5 rounded-[40px] transform -rotate-45 pointer-events-none"></div>
                    <div className="absolute top-32 -left-20 w-64 h-96 bg-white/5 rounded-[40px] transform -rotate-45 pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-12 w-52 h-96 bg-white/5 rounded-[40px] transform -rotate-45 pointer-events-none"></div>

                    <div className="flex flex-col gap-6 w-full items-end z-10 relative">
                        <button
                            type="button"
                            className="w-[82%] py-4 pl-8 pr-4 bg-white dark:bg-slate-900 text-violet-900 dark:text-violet-400 font-extrabold text-sm uppercase tracking-widest rounded-l-full relative active-tab-curve text-left transition-all duration-300 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]"
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={onNavigateToSignup}
                            className="w-[80%] py-4 pl-8 pr-4 bg-transparent text-white/70 hover:text-white font-extrabold text-sm uppercase tracking-widest text-left cursor-pointer transition-all duration-300"
                        >
                            Sign Up
                        </button>
                    </div>
                </div>

                {/* Right side form */}
                <div className="w-full lg:w-[68%] p-8 sm:p-12 md:px-16 flex flex-col justify-between dark:bg-slate-900">
                    
                    {/* Mobile top tab switcher (visible only < lg) */}
                    <div className="flex lg:hidden justify-center gap-6 mb-8 border-b border-gray-100 dark:border-slate-800 pb-4">
                        <button
                            type="button"
                            className="pb-2 text-sm font-extrabold uppercase tracking-wider border-b-2 border-violet-600 text-violet-600"
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={onNavigateToSignup}
                            className="pb-2 text-sm font-extrabold uppercase tracking-wider border-b-2 border-transparent text-gray-400 hover:text-gray-600"
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="w-full max-w-md mx-auto my-auto">
                        {/* Circular Avatar Header */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-650 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 mb-3 animate-in zoom-in duration-200">
                                <User className="text-white w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-widest uppercase mb-1">
                                {step === 'login' ? 'Login' : step === 'google-verify' || step === 'mfa' ? 'Verify' : 'Reset Password'}
                            </h2>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Welile School of AI</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center border border-red-200 dark:border-red-900/30">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        {step === 'login' && (
                            <form onSubmit={handleEmailLogin} className="space-y-6">
                                {/* Email Line Input */}
                                <div className="relative group border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 transition-all duration-300 py-2 text-left">
                                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-500 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-8 pr-3 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="Email"
                                    />
                                </div>

                                {/* Password Line Input */}
                                <div className="relative group border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 transition-all duration-300 py-2 text-left">
                                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-8 pr-10 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-1 pr-1 flex items-center text-gray-400 hover:text-gray-655 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Action row matching mockup layout */}
                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setForgotEmail(email); setStep('forgot-email'); setError(null); }}
                                        className="text-xs font-bold text-gray-400 hover:text-violet-600 transition-colors cursor-pointer"
                                    >
                                        Forgot Password?
                                    </button>
                                    
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 text-white rounded-full text-xs font-extrabold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? 'Logging in...' : 'Login'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 'mfa' && (
                            <form onSubmit={handleMfaVerify} className="space-y-6">
                                <p className="text-xs text-gray-500 text-center mb-2">
                                    A 2FA verification code has been sent via email to <span className="font-bold text-gray-800 dark:text-slate-200">{email}</span>.
                                </p>
                                
                                <div className="relative group border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 transition-all duration-300 py-2">
                                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        pattern="[0-9]{6}"
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full pl-8 pr-3 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 text-center font-mono tracking-widest text-lg"
                                        placeholder="000000"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const code = Math.floor(100000 + Math.random() * 900000).toString();
                                            setCorrectCode(code);
                                            setShowGmailToast(true);
                                            alert('A new verification code has been sent to your Gmail.');
                                        }}
                                        className="text-xs font-bold text-violet-650 hover:text-violet-755 cursor-pointer"
                                    >
                                        Resend Code
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 text-white rounded-full text-xs font-extrabold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? 'Verifying...' : 'Verify'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 'google-verify' && (
                            <form onSubmit={handleGoogleVerifySubmit} className="space-y-6">
                                <p className="text-xs text-gray-500 text-center mb-2">
                                    A 6-digit verification code has been sent to <span className="font-semibold text-gray-800 dark:text-slate-200">{pendingGoogleEmail}</span>.
                                </p>

                                <div className="relative group border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 transition-all duration-300 py-2">
                                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        pattern="[0-9]{6}"
                                        value={googleVerifyInput}
                                        onChange={(e) => setGoogleVerifyInput(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full pl-8 pr-3 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 text-center font-mono tracking-widest text-lg"
                                        placeholder="000000"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setLoading(true);
                                            setError(null);
                                            try {
                                                const res = await fetch('/api/auth/google-otp', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ email: pendingGoogleEmail })
                                                });
                                                if (!res.ok) throw new Error('Failed to resend code');
                                                alert('Code resent successfully.');
                                            } catch (err: any) {
                                                setError(err.message);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="text-xs font-bold text-violet-650 hover:text-violet-755 cursor-pointer"
                                    >
                                        Resend Code
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 text-white rounded-full text-xs font-extrabold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? 'Verifying...' : 'Verify'}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { setStep('login'); setError(null); }}
                                    className="w-full text-center text-xs text-gray-500 hover:text-gray-900 font-medium cursor-pointer pt-2"
                                >
                                    Cancel
                                </button>
                            </form>
                        )}

                        {step === 'forgot-email' && (
                            <form onSubmit={handleForgotSendCode} className="space-y-6">
                                <p className="text-xs text-gray-500 text-center mb-2">
                                    Enter your registered email address to receive a password reset code.
                                </p>

                                <div className="relative group border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 transition-all duration-300 py-2">
                                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-500 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className="block w-full pl-8 pr-3 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="Email Address"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setStep('login'); setError(null); }}
                                        className="text-xs font-bold text-gray-400 hover:text-violet-650 cursor-pointer"
                                    >
                                        Back to Login
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 text-white rounded-full text-xs font-extrabold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? 'Sending...' : 'Send Code'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 'forgot-code' && (
                            <form onSubmit={handleForgotVerifyCode} className="space-y-6">
                                <p className="text-xs text-gray-500 text-center mb-2">
                                    A 6-digit code has been sent to <span className="font-semibold text-gray-700 dark:text-slate-200">{forgotEmail}</span>.
                                </p>

                                <div className="relative group border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 transition-all duration-300 py-2">
                                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        pattern="[0-9]{6}"
                                        value={forgotCode}
                                        onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full pl-8 pr-3 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 text-center font-mono tracking-widest text-lg"
                                        placeholder="000000"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={handleForgotResendCode}
                                        className="text-xs font-bold text-violet-650 hover:text-violet-755 cursor-pointer"
                                    >
                                        Resend Code
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 text-white rounded-full text-xs font-extrabold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                                    >
                                        Verify
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 'forgot-newpass' && (
                            passwordChanged ? (
                                <div className="text-center py-6">
                                    <h2 className="text-xl font-bold text-green-600 mb-2">Password Changed!</h2>
                                    <p className="text-xs text-gray-500">Your password has been updated. Redirecting to dashboard...</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSetNewPassword} className="space-y-6">
                                    <p className="text-xs text-gray-500 text-center mb-2">Create a secure new password for your account.</p>

                                    <div className="relative group border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 transition-all duration-300 py-2">
                                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-500 transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="block w-full pl-8 pr-10 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                            placeholder="New Password"
                                        />
                                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-1 pr-1 flex items-center text-gray-400 hover:text-gray-655 cursor-pointer">
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <div className="relative group border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 transition-all duration-300 py-2">
                                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-500 transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full pl-8 pr-10 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                            placeholder="Confirm Password"
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-1 pr-1 flex items-center text-gray-400 hover:text-gray-655 cursor-pointer">
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || newPassword !== confirmPassword}
                                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 text-white rounded-full text-xs font-extrabold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? 'Changing...' : 'Change Password'}
                                    </button>
                                </form>
                            )
                        )}

                        {/* Social Footer Bar matching mockup */}
                        {step === 'login' && (
                            <div className="border-t border-gray-100 dark:border-slate-800/80 mt-10 pt-5 flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-extrabold uppercase tracking-widest text-[10px]">Or Login With</span>
                                <button
                                    onClick={handleGoogleLogin}
                                    type="button"
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-full hover:bg-gray-100 dark:hover:bg-slate-850 text-gray-700 dark:text-slate-200 font-bold shadow-sm transition-all cursor-pointer"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                        <path fill="none" d="M0 0h48v48H0z"/>
                                    </svg>
                                    Google
                                </button>
                            </div>
                        )}

                    </div>
                </div>

            </div>

            {/* Google Select Account Modal */}
            <GoogleChooserModal
                isOpen={showGoogleChooser}
                onClose={() => setShowGoogleChooser(false)}
                onSelect={handleSelectGoogleAccount}
            />
        </div>
    );
};

interface GoogleChooserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (email: string, name: string) => void;
}

const GoogleChooserModal: React.FC<GoogleChooserModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [customEmail, setCustomEmail] = useState('');
    const [accounts, setAccounts] = useState<{email: string; name: string; avatar: string}[]>([]);
    
    useEffect(() => {
        if (isOpen) {
            mysqlClient.from('profiles').select('*').then(({ data }: any) => {
                if (data && Array.isArray(data)) {
                    setAccounts(data.map((p: any) => ({
                        email: p.email,
                        name: p.full_name || p.email.split('@')[0],
                        avatar: p.avatar_url || ''
                    })));
                }
            });
        }
    }, [isOpen]);
    
    if (!isOpen) return null;

    const handleSubmitCustom = (e: React.FormEvent) => {
        e.preventDefault();
        if (customEmail.trim() && customEmail.includes('@')) {
            const derivedName = customEmail.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            onSelect(customEmail.trim(), derivedName);
        } else {
            alert('Please enter a valid Google email address.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl border border-gray-150 w-full max-w-sm p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 cursor-pointer">
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center mb-6">
                    <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Choose an account</h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium">to continue to Welile School of AI</p>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto mb-4">
                    {accounts.map((acc) => (
                        <button
                            key={acc.email}
                            onClick={() => onSelect(acc.email, acc.name)}
                            className="w-full flex items-center gap-3 p-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors text-left cursor-pointer"
                        >
                            {acc.avatar ? (
                                <img src={acc.avatar} alt={acc.name} className="w-8 h-8 rounded-full bg-gray-150 border border-gray-200 object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                    <svg viewBox="0 0 128 128" className="w-5 h-5 text-gray-400 fill-current">
                                        <path d="M64 8a26 26 0 100 52 26 26 0 000-52zm0 60c-29.07 0-52.61 20.62-55.77 48h111.54C116.61 88.62 93.07 68 64 68z" />
                                    </svg>
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 truncate">{acc.name}</p>
                                <p className="text-xs text-gray-500 truncate">{acc.email}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmitCustom} className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-bold text-gray-500 mb-2">Use another account:</p>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            required
                            placeholder="Enter Google email"
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500/25 text-gray-900"
                        />
                        <button
                            type="submit"
                            className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
