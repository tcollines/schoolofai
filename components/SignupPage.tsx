import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { ArrowLeft, Mail, Lock, User, Loader2 } from 'lucide-react';

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

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            {/* Left Side - Image/Brand */}
            <div className="hidden lg:block w-1/2 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 to-blue-600/30 mix-blend-overlay"></div>
                <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
                    alt="Student studying with technology"
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute bottom-20 left-12 text-white p-8">
                    <h1 className="text-5xl font-bold mb-4">Join the Future</h1>
                    <p className="text-xl text-gray-300 max-w-md">Create your account today and unlock unlimited potential with personalized AI learning.</p>
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
        </div>
    );
};

export default SignupPage;
