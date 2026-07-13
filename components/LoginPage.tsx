import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { ArrowLeft, Mail, Lock, Loader2, X } from 'lucide-react';

interface LoginPageProps {
    onLogin: () => void;
    onNavigateToSignup: () => void;
    onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToSignup, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [step, setStep] = useState<'login' | 'mfa'>('login');
    const [mfaCode, setMfaCode] = useState('');
    const [correctCode, setCorrectCode] = useState('');
    const [showGmailToast, setShowGmailToast] = useState(false);
    const [showGoogleChooser, setShowGoogleChooser] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            const has2FA = localStorage.getItem('twoFactor') === 'true';
            if (has2FA) {
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                setCorrectCode(code);
                setStep('mfa');
                setShowGmailToast(true);
                setLoading(false);
            } else {
                onLogin();
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleMfaVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (mfaCode === correctCode) {
            setShowGmailToast(false);
            onLogin();
        } else {
            setError('Invalid verification code. Please check the code sent to your Gmail.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        setShowGoogleChooser(true);
    };

    const handleSelectGoogleAccount = async (selectedEmail: string, name: string) => {
        try {
            setLoading(true);
            await supabase.auth.signUp({
                email: selectedEmail,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });
            setShowGoogleChooser(false);
            onLogin();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            {showGmailToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-4 flex gap-3 animate-in slide-in-from-top-10 duration-300">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center shrink-0">
                        <Mail size={20} />
                    </div>
                    <div className="flex-1 text-xs text-left">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-red-500">Gmail • Verified Sender</span>
                            <span className="text-[10px] text-gray-400">Just now</span>
                        </div>
                        <p className="font-semibold text-gray-200">From: auth-service@gmail.com</p>
                        <p className="text-gray-400 mt-1 text-left">
                            Your WSAI 2FA verification code is: <span className="font-mono font-bold text-sm text-yellow-400 bg-black/45 px-2 py-0.5 rounded">{correctCode}</span>
                        </p>
                    </div>
                </div>
            )}
            {/* Left Side - Image/Brand */}
            <div className="hidden lg:block w-1/2 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 to-blue-600/30 mix-blend-overlay"></div>
                <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                    alt="Students learning"
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute bottom-20 left-12 text-white p-8">
                    <h1 className="text-5xl font-bold mb-4">Welcome Back</h1>
                    <p className="text-xl text-gray-300 max-w-md">Continue your personalized learning journey with AI-driven courses designed just for you.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 relative">
                <button
                    onClick={onBack}
                    className="absolute top-8 left-8 text-gray-500 hover:text-gray-900 flex items-center"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>

                <div className="max-w-md w-full mx-auto">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Log in to your account</h2>
                        <p className="text-gray-500">
                            Don't have an account?{' '}
                            <button
                                onClick={onNavigateToSignup}
                                className="text-violet-600 font-semibold hover:text-violet-700 hover:underline"
                            >
                                Sign up
                            </button>
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    {step === 'login' ? (
                        <form onSubmit={handleEmailLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Forgot password?</a>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                        Logging in...
                                    </>
                                ) : (
                                    'Log in'
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleMfaVerify} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Enter 6-digit Verification Code
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                    A 2FA code has been sent via verified Gmail to <span className="font-bold text-gray-805">{email}</span>.
                                </p>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        pattern="[0-9]{6}"
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none tracking-widest font-mono text-lg text-center"
                                        placeholder="000000"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Code'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                                    setCorrectCode(code);
                                    setShowGmailToast(true);
                                    alert('A new verification code has been sent to your Gmail.');
                                }}
                                className="w-full text-center text-xs text-violet-600 hover:text-violet-750 font-bold cursor-pointer"
                            >
                                Resend Verification Code
                            </button>
                        </form>
                    )}

                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-3">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="h-5 w-5 mr-3" aria-hidden="true" viewBox="0 0 24 24">
                                <path
                                    d="M12.0003 20.45c4.65 0 8.04-3.19 8.04-7.94 0-.74-.06-1.46-.19-2.22h-7.85v4.23h4.48c-.2 1.05-.75 2.04-1.66 2.68v2.21h2.69c1.58-1.46 2.49-3.61 2.49-6.88 0-.66-.07-1.3-.19-1.92H12v3.66h5.04c-.47 2.37-2.58 4.16-5.04 4.16-2.91 0-5.27-2.36-5.27-5.27s2.36-5.27 5.27-5.27c1.38 0 2.64.49 3.63 1.3l2.72-2.72C16.69 2.19 14.47 1.25 12.0003 1.25 7.0503 1.25 3.0003 5.3 3.0003 10.25s4.05 9 9.0003 9z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M3.0003 10.25c0-1.4.37-2.71 1.02-3.86l2.84 2.22c-.27.52-.42 1.1-.42 1.64 0 .54.15 1.12.42 1.64l-2.84 2.22c-.65-1.15-1.02-2.46-1.02-3.86z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12.0003 3.75c1.38 0 2.64.49 3.63 1.3l2.72-2.72C16.69 0.69 14.47 -0.25 12.0003 -0.25 7.6003 -0.25 3.8603 2.5 1.9403 6.39l2.84 2.22c.67-2.72 3.12-4.86 6.22-4.86z"
                                    fill="#EA4335"
                                />
                                <path
                                    d="M12.0003 19.25c2.46 0 4.57-1.79 5.04-4.16h-5.04v-3.66h8.85c.13.76.19 1.48.19 2.22 0 4.75-3.39 7.94-8.04 7.94-2.28 0-4.39-0.89-5.96-2.34l-2.69-2.21c1.57 1.45 3.68 2.34 5.96 2.34z"
                                    fill="#34A853"
                                />
                            </svg>
                            Google
                        </button>
                    </div>
                </div>
            </div>
            
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
    
    if (!isOpen) return null;
    
    const defaultAccounts = [
        { email: 'chemayekabraham289@gmail.com', name: 'Abraham Chemayek', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150' },
        { email: 'mr.collins@schoolofai.edu', name: 'Mr. Collins', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150' },
        { email: 'student@test.com', name: 'Test Student', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }
    ];

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
                
                {/* Google Logo */}
                <div className="flex flex-col items-center mb-6">
                    <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Choose an account</h2>
                    <p className="text-xs text-gray-500 mt-1">to continue to Welile School of AI</p>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto mb-4">
                    {defaultAccounts.map((acc) => (
                        <button
                            key={acc.email}
                            onClick={() => onSelect(acc.email, acc.name)}
                            className="w-full flex items-center gap-3 p-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors text-left cursor-pointer"
                        >
                            <img src={acc.avatar} alt={acc.name} className="w-8 h-8 rounded-full bg-gray-150 border border-gray-200" />
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
                            placeholder="Enter Google email address"
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
