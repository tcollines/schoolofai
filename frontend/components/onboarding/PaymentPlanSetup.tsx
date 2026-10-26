import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../src/lib/supabaseClient';
import { Check, ArrowRight, Loader2, Star, AlertTriangle, Sparkles, Zap } from 'lucide-react';
import MarzPayCheckoutModal from '../payments/MarzPayCheckoutModal';

const PaymentPlanSetup: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedPaidPlan, setSelectedPaidPlan] = useState<'pro' | 'premium' | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUser(user);
        });
    }, []);

    const handleSelectPlan = async (planType: string) => {
        if (planType === 'pro' || planType === 'premium') {
            setSelectedPaidPlan(planType);
            return;
        }

        // Handle free plan
        setLoading('free');
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found. Please sign in again.");

            try {
                await supabase.auth.updateUser({
                    data: { plan: 'free', role: 'student' }
                });
            } catch (metaErr) {
                console.warn('Metadata update error:', metaErr);
            }

            try {
                await supabase
                    .from('profiles')
                    .update({ role: 'student' })
                    .eq('id', user.id);
            } catch (dbErr) {
                console.warn('Database update error:', dbErr);
            }

            localStorage.setItem('user_plan', 'free');
            navigate('/onboarding/courses');
        } catch (err: any) {
            setError(err.message || 'Failed to select plan.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-14">
                    <h2 className="text-xs sm:text-sm font-extrabold text-violet-600 dark:text-violet-400 tracking-widest uppercase mb-2">Pricing Plans</h2>
                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Choose your learning path</h1>
                    <p className="text-base sm:text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Unlock your full potential with our flexible learning plans. Upgrade anytime.
                    </p>
                </div>

                {error && (
                    <div className="max-w-2xl mx-auto bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 p-4 rounded-xl mb-8 text-sm text-center">
                        <AlertTriangle className="inline-block w-4 h-4 mr-1 align-middle" />️ {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                    {/* Basic Free Plan */}
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-xl border border-gray-150 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Basic</h3>
                                <p className="text-gray-500 dark:text-slate-400 text-sm">Perfect for getting started</p>
                            </div>
                            <div className="mb-8 flex items-baseline gap-2">
                                <span className="text-5xl font-black text-gray-900 dark:text-white">$0</span>
                                <span className="text-gray-500 dark:text-slate-400 font-semibold">/ forever</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'Access to free courses',
                                    'Basic community support',
                                    'Progress tracking'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300 font-semibold">
                                        <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button
                            onClick={() => handleSelectPlan('free')}
                            disabled={loading !== null}
                            className="w-full py-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-full text-sm font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer mt-6"
                        >
                            {loading === 'free' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Started Free'}
                            {loading !== 'free' && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Pro Plan ($25 / month) - MOST POPULAR */}
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl border-2 border-violet-600 dark:border-violet-500 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 ring-4 ring-violet-500/10">
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-400 to-amber-400 text-white text-[10px] font-black px-4 py-1.5 uppercase tracking-widest rounded-bl-xl shadow-md flex items-center gap-1 z-10">
                            <Star className="w-3 h-3 fill-current" /> Most Popular
                        </div>
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Pro</h3>
                                <p className="text-gray-500 dark:text-slate-400 text-sm">Full monthly access for dedicated learners</p>
                            </div>
                            <div className="mb-8 flex items-baseline gap-2">
                                <span className="text-5xl font-black text-gray-900 dark:text-white">$25</span>
                                <span className="text-gray-500 dark:text-slate-400 font-semibold">/ month</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'Full access to all Pro courses (excl. custom-priced)',
                                    'Full access to all free courses',
                                    'Priority community support',
                                    'Downloadable resources & exercises',
                                    'Certificate of completion',
                                    'Cancel anytime'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300 font-semibold">
                                        <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button
                            onClick={() => handleSelectPlan('pro')}
                            disabled={loading !== null}
                            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-sm font-black uppercase tracking-wider transition-colors shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer mt-6"
                        >
                            {loading === 'pro' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upgrade to Pro'}
                            {loading !== 'pro' && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Premium Plan ($150 one-time) */}
                    <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-900 dark:from-violet-950 dark:via-purple-900 dark:to-slate-900 rounded-[32px] p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 border border-violet-400/30 text-white">
                        <div className="absolute top-0 right-0 bg-white/20 text-white text-[10px] font-black px-4 py-1.5 uppercase tracking-widest rounded-bl-xl shadow-sm backdrop-blur-sm flex items-center gap-1 z-10">
                            <Sparkles className="w-3 h-3 fill-current" /> Lifetime Access
                        </div>
                        <div className="relative z-10">
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-white mb-2">Premium</h3>
                                <p className="text-violet-200 text-sm">One-time payment • Lifetime access</p>
                            </div>
                            <div className="mb-8 flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white">$150</span>
                                <span className="text-violet-200 font-semibold">/ one time</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'One-time access to all Pro & free courses',
                                    'Lifetime access — no monthly renewals',
                                    '1-on-1 mentorship & live Q&A sessions',
                                    'Verified Certificate of Completion',
                                    'Downloadable project source code',
                                    'Portfolio review & career guidance'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white font-semibold">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button
                            onClick={() => handleSelectPlan('premium')}
                            disabled={loading !== null}
                            className="w-full py-4 bg-white hover:bg-gray-50 text-violet-900 rounded-full text-sm font-black uppercase tracking-wider transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 relative z-10 cursor-pointer mt-6"
                        >
                            {loading === 'premium' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upgrade to Premium'}
                            {loading !== 'premium' && <ArrowRight className="w-4 h-4" />}
                        </button>

                        {/* Background Decor */}
                        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    </div>
                </div>
            </div>

            {selectedPaidPlan && (
                <MarzPayCheckoutModal
                    isOpen={!!selectedPaidPlan}
                    onClose={() => setSelectedPaidPlan(null)}
                    plan={selectedPaidPlan}
                    user={currentUser}
                    onSuccess={() => {
                        localStorage.setItem('user_plan', selectedPaidPlan);
                        setSelectedPaidPlan(null);
                        navigate('/onboarding/courses');
                    }}
                />
            )}
        </div>
    );
};

export default PaymentPlanSetup;
