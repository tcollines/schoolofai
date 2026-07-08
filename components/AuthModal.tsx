import React, { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [isLogin, setIsLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const [step, setStep] = useState<'form' | 'mfa'>('form');
    const [mfaCode, setMfaCode] = useState('');
    const [correctCode, setCorrectCode] = useState('');
    const [showGmailToast, setShowGmailToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        // Simulate a successful login/signup, checking for 2FA
        const has2FA = localStorage.getItem('twoFactor') === 'true';
        setTimeout(() => {
            if (has2FA) {
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                setCorrectCode(code);
                setStep('mfa');
                setShowGmailToast(true);
                setLoading(false);
            } else {
                setLoading(false);
                onLogin();
                onClose();
            }
        }, 800);
    };

    const handleMfaVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (mfaCode === correctCode) {
            setLoading(false);
            setShowGmailToast(false);
            onLogin();
            onClose();
        } else {
            setError('Invalid verification code. Please check the code sent to your Gmail.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            {showGmailToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-55 w-full max-w-sm bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-4 flex gap-3 animate-in slide-in-from-top-10 duration-300">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center shrink-0">
                        <Mail size={20} />
                    </div>
                    <div className="flex-1 text-xs text-left">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-red-500">Gmail • Verified Sender</span>
                            <span className="text-[10px] text-gray-400">Just now</span>
                        </div>
                        <p className="font-semibold text-gray-200">From: auth-service@gmail.com</p>
                        <p className="text-gray-400 mt-1">
                            Your WSAI 2FA verification code is: <span className="font-mono font-bold text-sm text-yellow-400 bg-black/45 px-2 py-0.5 rounded">{correctCode}</span>
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {step === 'mfa' ? '2-Factor Verification' : isLogin ? 'Welcome Back' : 'Create Your Account'}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {step === 'mfa' ? 'Verify your identity to proceed' : isLogin ? 'Enter your details to access your courses' : 'Sign up to maximize your learning journey'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm flex items-center text-left">
                        <span className="mr-2">⚠️</span> {error}
                    </div>
                )}

                {step === 'form' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-welile-purple focus:border-transparent outline-none transition-all"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-welile-purple focus:border-transparent outline-none transition-all"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-welile-purple focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-welile-purple text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 mt-6 flex justify-center items-center gap-2 cursor-pointer"
                        >
                            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleMfaVerify} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                                Verification Code
                            </label>
                            <p className="text-xs text-gray-500 mb-3 text-left">
                                A 2FA code has been sent via verified Gmail to <span className="font-bold text-gray-800">{email}</span>.
                            </p>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-welile-purple focus:border-transparent outline-none transition-all tracking-widest font-mono text-center text-lg"
                                    placeholder="000000"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-welile-purple text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 mt-6 cursor-pointer"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const code = Math.floor(100000 + Math.random() * 900000).toString();
                                setCorrectCode(code);
                                setShowGmailToast(true);
                                alert('A new verification code has been sent to your Gmail.');
                            }}
                            className="w-full text-center text-xs text-violet-600 hover:text-violet-700 font-bold cursor-pointer"
                        >
                            Resend Verification Code
                        </button>
                    </form>
                )}

                {step === 'form' && (
                    <div className="mt-6 text-center text-sm text-gray-500">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-welile-purple font-bold hover:underline"
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
