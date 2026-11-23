import React, { useState, useEffect, useRef } from 'react';
import { afterSignInUrl } from '../src/lib/acquisition';
import { Link, useLocation } from 'react-router-dom';
import { AuthShell, AUTH, GoogleIcon, OrDivider } from './auth/AuthShell';
import { supabaseClient } from '../src/lib/supabaseClient';
import { ArrowLeft, Mail, Lock, User, Loader2, X, KeyRound, ShieldCheck, Clock, Eye, EyeOff, Brain, Cpu, Sparkles, AlertTriangle } from 'lucide-react';

interface LoginPageProps {
    onLogin: () => void;
    onNavigateToSignup: () => void;
    onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToSignup, onBack }) => {
    const location = useLocation();
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

    const [email, setEmail] = useState(() => (location.state as any)?.email || '');

    useEffect(() => {
        if ((location.state as any)?.email) {
            setEmail((location.state as any).email);
        }
    }, [location.state]);
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

        // A real reset link is emailed by Supabase (branded as Welile School of AI).
        // The answer is the same whether or not the address has an account, so nobody can probe for accounts.
        try {
            await supabaseClient.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
                redirectTo: `${window.location.origin}/reset-password`
            });
        } catch {
            // ignore: same message either way
        }
        setStep('forgot-code');
        setLoading(false);
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
            const cleanEmail = email.trim().toLowerCase();
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: cleanEmail,
                password: password
            });

            if (error) {
                setError(
                    /confirm/i.test(error.message)
                        ? 'Please confirm your email first. Check your inbox for the confirmation link.'
                        : 'Incorrect email or password. Use "Forgot password" if you need to reset it.'
                );
                setLoading(false);
                return;
            }

            localStorage.removeItem('auth_logged_out');
            localStorage.setItem('auth_logged_in_email', cleanEmail);
            localStorage.setItem('auth_logged_in_name', cleanEmail.split('@')[0]);
            localStorage.setItem('logged_in_email', cleanEmail);
            window.dispatchEvent(new Event('profile-update'));
            setLoading(false);
            onLogin();
        } catch (err: any) {
            setError('We could not sign you in right now. Please check your connection and try again.');
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

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: afterSignInUrl()
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Google sign in failed');
            setLoading(false);
        }
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

    const title = step === 'login' ? 'Welcome back' : step === 'google-verify' || step === 'mfa' ? 'Check your email' : step === 'forgot-code' ? 'Check your inbox' : 'Reset your password';
    const subtitle = step === 'login' ? 'Sign in to continue where you left off.'
        : step === 'mfa' ? <>We sent a 6-digit code to <strong className="text-ink dark:text-white">{email}</strong>.</>
        : step === 'google-verify' ? <>We sent a 6-digit code to <strong className="text-ink dark:text-white">{pendingGoogleEmail}</strong>.</>
        : step === 'forgot-email' ? 'Enter your email address and we will send you a link to reset your password.'
        : '';
    const codeInput = (value: string, onChange: (v: string) => void) => (
        <div>
            <label htmlFor="otp" className={AUTH.label}>6-digit code</label>
            <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} pattern="[0-9]{6}" value={value}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
                className={`${AUTH.input} text-center font-mono tracking-[0.5em] text-[22px] font-bold`} placeholder="000000" />
        </div>
    );

    return (
        <AuthShell isDark={isDark} onToggleTheme={toggleTheme}>
            <h2 className="m-0 text-[26px] sm:text-[28px] font-extrabold tracking-[-0.03em]">{title}</h2>
            {subtitle && <p className="mt-2 mb-0 text-[15px] leading-relaxed text-[#6B6680] dark:text-slate-400">{subtitle}</p>}

            {error && (
                <div role="alert" className={`${AUTH.error} mt-5`}>
                    <p className="m-0 flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span></p>
                    {step === 'login' && /Incorrect email or password/.test(error) && (
                        <p className="mt-2 mb-0 pl-6">
                            New here?{' '}
                            <button type="button" onClick={onNavigateToSignup} className="font-bold underline underline-offset-2 cursor-pointer">Create a free account</button>
                        </p>
                    )}
                </div>
            )}

            {step === 'login' && (
                <>
                    <button onClick={handleGoogleLogin} type="button" className={`${AUTH.secondary} mt-5`}><GoogleIcon />Continue with Google</button>
                    <OrDivider label="or with email" />
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className={AUTH.label}>Email</label>
                            <div className="relative">
                                <Mail className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#9A94AE] pointer-events-none" />
                                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${AUTH.input} pl-11`} placeholder="you@example.com" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="text-[13px] font-bold">Password</label>
                                <button type="button" onClick={() => { setForgotEmail(email); setStep('forgot-email'); setError(null); }} className={AUTH.link}>Forgot password?</button>
                            </div>
                            <div className="relative">
                                <Lock className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#9A94AE] pointer-events-none" />
                                <input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${AUTH.input} pl-11 pr-12`} placeholder="Your password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-[10px] inline-flex items-center justify-center text-[#6B6680] hover:text-brand">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className={`${AUTH.primary} !mt-6`}>{loading ? 'Signing in...' : 'Sign in'}</button>
                    </form>
                    <p className="mt-6 mb-0 text-center text-[14px] text-[#6B6680] dark:text-slate-400">
                        New here?{' '}
                        <button type="button" onClick={onNavigateToSignup} className="font-extrabold text-brand dark:text-violet-300 hover:underline">Register for the free course</button>
                    </p>
                </>
            )}

            {step === 'mfa' && (
                <form onSubmit={handleMfaVerify} className="mt-6 space-y-4">
                    {codeInput(mfaCode, setMfaCode)}
                    <button type="submit" disabled={loading} className={AUTH.primary}>{loading ? 'Verifying...' : 'Verify'}</button>
                    <button
                        type="button"
                        onClick={() => {
                            const code = Math.floor(100000 + Math.random() * 900000).toString();
                            setCorrectCode(code);
                            setShowGmailToast(true);
                            alert('A new verification code has been sent to your Gmail.');
                        }}
                        className={`${AUTH.link} block mx-auto`}
                    >Send a new code</button>
                </form>
            )}

            {step === 'google-verify' && (
                <form onSubmit={handleGoogleVerifySubmit} className="mt-6 space-y-4">
                    {codeInput(googleVerifyInput, setGoogleVerifyInput)}
                    <button type="submit" disabled={loading} className={AUTH.primary}>{loading ? 'Verifying...' : 'Verify'}</button>
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={() => { setStep('login'); setError(null); }} className="text-[13px] font-bold text-[#6B6680] hover:text-ink dark:hover:text-white">Cancel</button>
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
                            className={AUTH.link}
                        >Send a new code</button>
                    </div>
                </form>
            )}

            {step === 'forgot-email' && (
                <form onSubmit={handleForgotSendCode} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="forgot-email" className={AUTH.label}>Email</label>
                        <div className="relative">
                            <Mail className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#9A94AE] pointer-events-none" />
                            <input id="forgot-email" type="email" required autoComplete="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className={`${AUTH.input} pl-11`} placeholder="you@example.com" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className={AUTH.primary}>{loading ? 'Sending...' : 'Send reset link'}</button>
                    <button type="button" onClick={() => { setStep('login'); setError(null); }} className={`${AUTH.link} flex items-center gap-1.5 mx-auto`}><ArrowLeft size={14} />Back to sign in</button>
                </form>
            )}

            {step === 'forgot-code' && (
                <div className="mt-6 space-y-5">
                    <div className="rounded-[18px] bg-brand-soft dark:bg-night-3 p-5 flex gap-3">
                        <Mail className="w-5 h-5 text-brand dark:text-violet-300 shrink-0 mt-0.5" />
                        <p className="m-0 text-[14px] leading-relaxed text-brand-ink dark:text-slate-200">
                            If an account exists for <strong>{forgotEmail}</strong>, we have emailed a link to reset your password. It can take a minute to arrive; check your spam folder too.
                        </p>
                    </div>
                    <button type="button" onClick={() => { setStep('login'); setError(null); }} className={AUTH.secondary}><ArrowLeft size={16} />Back to sign in</button>
                </div>
            )}

            {/* Google Select Account Modal */}
            <GoogleChooserModal
                isOpen={showGoogleChooser}
                onClose={() => setShowGoogleChooser(false)}
                onSelect={handleSelectGoogleAccount}
            />
        </AuthShell>
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
            // Accounts are no longer listed: reading every profile from the browser is not allowed.
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
