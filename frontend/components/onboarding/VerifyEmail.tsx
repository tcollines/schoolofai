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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-slate-800 text-center">
                
                {status === 'waiting' ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Check your email</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
                            We've sent a verification link to <br/>
                            <span className="font-semibold text-gray-900 dark:text-white mt-2 block text-base">{email}</span>
                        </p>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-8">
                            <p className="text-sm text-gray-600 dark:text-slate-300">
                                Please click the link in that email to verify your account. Once verified, this page will automatically redirect you, or you can continue in the new tab.
                            </p>
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
                    Already verified or want to use another account? <Link to="/login" className="text-violet-600 font-bold hover:underline">Back to login</Link>
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
