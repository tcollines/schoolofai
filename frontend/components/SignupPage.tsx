import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell, AUTH, GoogleIcon, OrDivider } from './auth/AuthShell';
import { supabase } from '../src/lib/supabaseClient';
import ExistingAccountNotice from './ExistingAccountNotice';
import { getReferral, setFreeCourseIntent, getFreeCourseIntent, learnHomePath, afterSignInUrl } from '../src/lib/acquisition';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, AlertTriangle, AlertCircle, LogIn } from 'lucide-react';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Arriving from the free course page: remember why, so we can send them straight back to it after signup
    useEffect(() => {
        const course = searchParams.get('course');
        if (course) setFreeCourseIntent(course);
    }, [searchParams]);

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

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [emailOptIn, setEmailOptIn] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [existingAccountEmail, setExistingAccountEmail] = useState<string | null>(null);

    const handleEmailSignup = async (e: React.FormEvent) => {
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
        setExistingAccountEmail(null);

        const cleanEmail = email.trim().toLowerCase();

        try {
            const intent = getFreeCourseIntent();
            await supabase.rpc('register_lead', {
                p_name: fullName.trim(), p_email: cleanEmail, p_course_slug: intent || null,
                p_course_title: intent ? 'AI Fundamentals (free)' : 'General sign-up', p_source: getFreeCourseIntent() ? 'free_course_page' : 'website',
                p_ref: getReferral()?.code || null, p_consent: true, p_email_opt_in: emailOptIn
            }).then(() => undefined, () => undefined);
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                    // After confirming, the email link lands on profile setup. (Must be in the Supabase redirect allow-list;
                    // if it is not, Supabase falls back to the Site URL, which also works.)
                    emailRedirectTo: `${window.location.origin}/continue`,
                    data: {
                        full_name: fullName,
                        email_opt_in: emailOptIn,
                        // Attribution travels with the account from the moment it is created, so it survives
                        // email verification on another device or days later.
                        ...(getReferral()?.code ? { ref_code: getReferral()!.code } : {}),
                        signup_source: getFreeCourseIntent() ? 'free_course' : 'website'
                    }
                }
            });

            // Check if user already exists:
            // 1. Supabase returns identities: [] when the user already exists (anti-enumeration mode)
            // 2. Or Supabase throws an error mentioning "already registered" / "already in use"
            const isAlreadyRegistered =
                (signUpData?.user && (!signUpData.user.identities || signUpData.user.identities.length === 0)) ||
                (signUpError && (
                    signUpError.message?.toLowerCase().includes('already registered') ||
                    signUpError.message?.toLowerCase().includes('already exists') ||
                    signUpError.message?.toLowerCase().includes('already in use')
                ));

            if (isAlreadyRegistered) {
                setExistingAccountEmail(cleanEmail);
                return;
            }

            if (signUpError) {
                throw signUpError;
            }

            // If session is already created (e.g. email confirmations disabled)
            if (signUpData?.session) {
                navigate('/continue');
                return;
            }

            // Successfully signed up with new account, go to verify email step
            navigate('/onboarding/verify', { state: { email: cleanEmail } });
        } catch (err: any) {
            setError(err.message || 'An error occurred during signup.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: afterSignInUrl()
            }
        });
        if (error) {
            setError(error.message);
        }
    };

    const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : (password.length >= 10 && /[0-9]/.test(password) && /[A-Za-z]/.test(password)) ? 3 : 2;
    const pwLabel = ['', 'Too short, use at least 6 characters', 'Good password', 'Strong password'][pwStrength];
    const mismatch = confirmPassword.length > 0 && confirmPassword !== password;
    const pwField = (id: string, label: string, value: string, set: (v: string) => void, shown: boolean, toggle: () => void, auto: string) => (
        <div>
            <label htmlFor={id} className={AUTH.label}>{label}</label>
            <div className="relative">
                <Lock className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#9A94AE] pointer-events-none" />
                <input id={id} type={shown ? 'text' : 'password'} required minLength={6} autoComplete={auto} value={value} onChange={(e) => set(e.target.value)} className={`${AUTH.input} pl-11 pr-12`} placeholder={label} />
                <button type="button" onClick={toggle} aria-label={shown ? 'Hide password' : 'Show password'} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-[10px] inline-flex items-center justify-center text-[#6B6680] hover:text-brand">
                    {shown ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
    );

    return (
        <AuthShell isDark={isDark} onToggleTheme={toggleTheme}>
            <p className="m-0 [@media(max-height:700px)]:hidden inline-flex items-center h-8 px-3 rounded-full bg-lime-200 text-night text-[12px] font-extrabold tracking-[0.06em]">FREE · NO CARD NEEDED</p>
            <h2 className="mt-3 [@media(max-height:700px)]:mt-0 mb-0 text-[26px] sm:text-[28px] font-extrabold tracking-[-0.03em]">Create your account</h2>
            <p className="mt-1.5 mb-0 text-[14px] leading-relaxed text-[#6B6680] dark:text-slate-400">Start AI Fundamentals today. It takes under a minute.</p>

            {existingAccountEmail && (
                <ExistingAccountNotice
                    email={existingAccountEmail}
                    onSignIn={() => navigate('/login', { state: { email: existingAccountEmail } })}
                    onChangeEmail={() => setExistingAccountEmail(null)}
                />
            )}

            {error && !existingAccountEmail && (
                <div role="alert" className={`${AUTH.error} mt-5 flex items-start gap-2`}><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span></div>
            )}

            <button onClick={handleGoogleLogin} type="button" className={`${AUTH.secondary} mt-4`}><GoogleIcon />Sign up with Google</button>
            <OrDivider label="or with email" />

            <form onSubmit={handleEmailSignup} className="space-y-2.5">
                <div>
                    <label htmlFor="full-name" className={AUTH.label}>Full name</label>
                    <div className="relative">
                        <User className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#9A94AE] pointer-events-none" />
                        <input id="full-name" type="text" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`${AUTH.input} pl-11`} placeholder="As it should appear on your certificate" />
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className={AUTH.label}>Email</label>
                    <div className="relative">
                        <Mail className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#9A94AE] pointer-events-none" />
                        <input id="email" type="email" required autoComplete="email" value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (existingAccountEmail) setExistingAccountEmail(null);
                                if (error) setError(null);
                            }}
                            className={`${AUTH.input} pl-11`} placeholder="you@example.com" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pwField('password', 'Password', password, setPassword, showPassword, () => setShowPassword(!showPassword), 'new-password')}
                    {pwField('confirm-password', 'Confirm password', confirmPassword, setConfirmPassword, showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword), 'new-password')}
                </div>
                {(password.length > 0 || mismatch) && (
                    <div aria-live="polite">
                        <div className="flex gap-1.5" aria-hidden="true">
                            {[1, 2, 3].map(i => <span key={i} className={`flex-1 h-1.5 rounded-full ${pwStrength >= i ? (pwStrength === 1 ? 'bg-[#F0533A]' : pwStrength === 2 ? 'bg-brand' : 'bg-mint') : 'bg-[#EEEBF6] dark:bg-night-3'}`} />)}
                        </div>
                        <p className={`mt-1.5 mb-0 text-[12px] font-bold ${mismatch ? 'text-[#C23A22]' : 'text-[#6B6680] dark:text-slate-400'}`}>{mismatch ? 'The passwords do not match yet' : pwLabel}</p>
                    </div>
                )}

                <label className="flex items-start gap-3 text-[13px] leading-snug text-[#4A4560] dark:text-slate-300 cursor-pointer pt-1">
                    <input type="checkbox" checked={emailOptIn} onChange={e => setEmailOptIn(e.target.checked)} className="mt-0 w-[18px] h-[18px] accent-[#5B2BC4] shrink-0" />
                    <span>Email me live-class reminders and course updates. You can change this any time.</span>
                </label>

                <button type="submit" disabled={loading} className={`${AUTH.primary} !mt-3.5`}>{loading ? 'Creating your account...' : 'Create free account'}</button>
            </form>

            <p className="mt-3 mb-0 text-center text-[14px] text-[#6B6680] dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-extrabold text-brand dark:text-violet-300 no-underline hover:underline">Sign in</Link>
            </p>
        </AuthShell>
    );
};

export default SignupPage;
