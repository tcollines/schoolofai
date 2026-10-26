import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';

const VerifyEmail: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';
    
    const [status, setStatus] = useState<'waiting' | 'verified'>('waiting');

    useEffect(() => {
        // Listen for auth state changes. When the user clicks the link, 
        // if they open it in the same browser, this tab might get the session 
        // via local storage sync, or they continue in the new tab.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setStatus('verified');
                setTimeout(() => navigate('/onboarding/profile'), 2000);
            }
        });
        
        // Also periodically check if we have a session
        const interval = setInterval(async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setStatus('verified');
                clearInterval(interval);
                setTimeout(() => navigate('/onboarding/profile'), 2000);
            }
        }, 3000);

        return () => {
            subscription.unsubscribe();
            clearInterval(interval);
        };
    }, [navigate]);

    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleResendEmail = async () => {
        if (!email || resendCooldown > 0) return;
        setResending(true);
        setResendMessage(null);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email.trim().toLowerCase(),
            });
            if (error) {
                setResendMessage(error.message);
            } else {
                setResendMessage('Verification email resent! Please check your inbox and spam folder.');
                setResendCooldown(60);
            }
        } catch (err: any) {
            setResendMessage(err.message || 'Failed to resend email');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-slate-800 text-center">
                
                {status === 'waiting' ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Check your email</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                            We've sent a verification link to <br/>
                            <span className="font-semibold text-gray-900 dark:text-white mt-1 block text-base">{email || 'your email address'}</span>
                        </p>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-6 text-left text-xs text-gray-600 dark:text-slate-300 space-y-2">
                            <p>• Click the link in your email to verify and unlock your account.</p>
                            <p>• If you don't see it in 1-2 minutes, check your <strong>Spam / Junk</strong> folder.</p>
                            <p>• If you already created an account previously, you can log in directly.</p>
                        </div>

                        {resendMessage && (
                            <div className="mb-4 p-3 rounded-lg text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                {resendMessage}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={handleResendEmail}
                                disabled={resending || resendCooldown > 0 || !email}
                                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resending ? 'Sending...' : resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend verification email'}
                            </button>

                            <Link
                                to="/login"
                                className="w-full py-2.5 px-4 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl text-sm font-medium transition"
                            >
                                Already verified? Log In
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Email Verified!</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
                            Taking you to the next step...
                        </p>
                    </>
                )}

                <p className="text-xs text-center text-gray-500 mt-6">
                    Wrong email or want to use another account? <Link to="/signup" className="text-violet-600 font-bold hover:underline">Sign up again</Link>
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
