import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../src/lib/supabaseClient';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (signUpError) {
                throw signUpError;
            }

            // Successfully signed up, go to verify email step
            navigate('/onboarding/verify', { state: { email } });
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
                redirectTo: window.location.origin + '/dashboard'
            }
        });
        if (error) {
            setError(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-10 left-10 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <Link
                to="/"
                className="absolute top-8 left-8 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 z-20 text-sm font-semibold transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
            </Link>

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

            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-gray-150 dark:border-slate-800/80 flex flex-col lg:flex-row relative z-10 transition-colors duration-300">
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

                <div className="hidden lg:flex lg:w-[32%] bg-gradient-to-br from-violet-600 via-violet-750 to-indigo-900 dark:from-violet-950 dark:via-slate-900 dark:to-indigo-950 flex-col justify-center items-end py-16 relative overflow-hidden">
                    <div className="absolute -top-12 -left-12 w-48 h-96 bg-white/5 rounded-[40px] transform -rotate-45 pointer-events-none"></div>
                    <div className="absolute top-32 -left-20 w-64 h-96 bg-white/5 rounded-[40px] transform -rotate-45 pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-12 w-52 h-96 bg-white/5 rounded-[40px] transform -rotate-45 pointer-events-none"></div>

                    <div className="flex flex-col gap-6 w-full items-end z-10 relative">
                        <Link
                            to="/login"
                            className="w-[80%] py-4 pl-8 pr-4 bg-transparent text-white/70 hover:text-white font-extrabold text-sm uppercase tracking-widest text-left cursor-pointer transition-all duration-300 block"
                        >
                            Login
                        </Link>
                        <button
                            type="button"
                            className="w-[82%] py-4 pl-8 pr-4 bg-white dark:bg-slate-900 text-violet-900 dark:text-violet-400 font-extrabold text-sm uppercase tracking-widest rounded-l-full relative active-tab-curve text-left transition-all duration-300 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]"
                        >
                            Sign Up
                        </button>
                    </div>
                </div>

                <div className="w-full lg:w-[68%] p-8 sm:p-12 md:px-16 flex flex-col justify-between dark:bg-slate-900">
                    <div className="flex lg:hidden justify-center gap-6 mb-8 border-b border-gray-100 dark:border-slate-800 pb-4">
                        <Link
                            to="/login"
                            className="pb-2 text-sm font-extrabold uppercase tracking-wider border-b-2 border-transparent text-gray-400 hover:text-gray-655"
                        >
                            Login
                        </Link>
                        <button
                            type="button"
                            className="pb-2 text-sm font-extrabold uppercase tracking-wider border-b-2 border-violet-600 text-violet-600"
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="w-full max-w-md mx-auto my-auto">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-650 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 mb-3 animate-in zoom-in duration-200">
                                <User className="text-white w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-widest uppercase mb-1">
                                Sign Up
                            </h2>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Create a new account</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center border border-red-200 dark:border-red-900/30">
                                <span className="mr-2"><AlertTriangle className="inline-block w-4 h-4 mr-1 align-middle" />️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleEmailSignup} className="space-y-6">
                            <div className="relative group border-b border-gray-200 dark:border-slate-855 focus-within:border-violet-500 transition-all duration-300 py-2 text-left">
                                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-500 transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full pl-8 pr-3 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Full Name"
                                />
                            </div>

                            <div className="relative group border-b border-gray-200 dark:border-slate-855 focus-within:border-violet-500 transition-all duration-300 py-2 text-left">
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

                            <div className="relative group border-b border-gray-200 dark:border-slate-855 focus-within:border-violet-500 transition-all duration-300 py-2">
                                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-8 pr-10 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-1 pr-1 flex items-center text-gray-400 hover:text-gray-655 cursor-pointer">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="relative group border-b border-gray-200 dark:border-slate-855 focus-within:border-violet-500 transition-all duration-300 py-2">
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

                            <div className="flex items-center justify-between pt-4">
                                <Link
                                    to="/login"
                                    className="text-xs font-bold text-gray-400 hover:text-violet-600 transition-colors cursor-pointer"
                                >
                                    Already have an account?
                                </Link>
                                
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 text-white rounded-full text-xs font-extrabold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Sign Up'}
                                </button>
                            </div>
                        </form>

                        <div className="border-t border-gray-100 dark:border-slate-800/80 mt-10 pt-5 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-extrabold uppercase tracking-widest text-[10px]">Or Sign Up With</span>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
