import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { ArrowLeft, Mail, Lock, User, Loader2, X } from 'lucide-react';

interface SignupPageProps {
    onSignup: () => void;
    onNavigateToLogin: () => void;
    onBack: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup, onNavigateToLogin, onBack }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showGoogleChooser, setShowGoogleChooser] = useState(false);

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (signUpError) throw signUpError;

            // If auto-confirm is on, we can proceed. If not, we might check for session.
            if (data.session) {
                onSignup();
            } else {
                // If email confirmation is required, Supabase returns user but no session usually.
                // For now, let's assume we can proceed or show a "Check email" message.
                // But the prop is onSignup(), which implies immediate login. 
                // Let's call it and let the App handle logic, or show a message.
                // Actually, typically we want to auto-login.
                onSignup();
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
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
            onSignup();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            {/* Left Side - Image/Brand */}
            <div className="hidden lg:block w-1/2 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 to-blue-600/30 mix-blend-overlay"></div>
                <img
                    src="/african_students_auth_bg.png"
                    alt="African Students collaborating"
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute bottom-20 left-12 text-white p-8">
                    <h1 className="text-5xl font-bold mb-4">Join the Future</h1>
                    <p className="text-xl text-gray-300 max-w-md">Create your account today and unlock unlimited potential with personalized AI learning.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-8 lg:px-24 relative min-h-screen lg:min-h-0">
                <Link
                    to="/"
                    className="absolute top-8 left-4 sm:left-8 text-gray-500 hover:text-gray-900 flex items-center z-10"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </Link>

                <div className="max-w-md w-full mx-auto lg:bg-transparent lg:shadow-none lg:border-0 lg:p-0 lg:rounded-none bg-white shadow-xl border border-gray-100 rounded-3xl p-6 sm:p-8 mt-20 lg:mt-0">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h2>
                        <p className="text-gray-500">
                            Already have an account?{' '}
                            <button
                                onClick={onNavigateToLogin}
                                className="text-violet-600 font-semibold hover:text-violet-700 hover:underline"
                            >
                                Log in
                            </button>
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailSignup} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                                    minLength={6}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

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
                            <svg className="h-5 w-5 mr-3" aria-hidden="true" viewBox="0 0 48 48">
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
            // Load accounts from the actual database
            supabase.from('profiles').select('*').then(({ data }: any) => {
                if (data && Array.isArray(data)) {
                    setAccounts(data.map((p: any) => ({
                        email: p.email,
                        name: p.full_name || p.email.split('@')[0],
                        avatar: p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.full_name || p.email}`
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
                    {accounts.map((acc) => (
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

export default SignupPage;
