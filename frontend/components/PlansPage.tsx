import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Sparkles, X, Loader, Star, Smartphone, Landmark, TrendingUp, Users, Building2, Minus, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';
import { useTranslation } from './translations';
import { supabaseClient } from '../src/lib/supabaseClient';
import { formatAmount, getCurrencyPreference, CurrencyType, getExchangeRate } from '../src/lib/currency';
import MarzPayCheckoutModal from './payments/MarzPayCheckoutModal';

interface PlansPageProps {
    user?: any;
    currentPlan: UserRole;
    onUpgrade: (plan: string) => void;
    onBack?: () => void;
}

const PlansPage: React.FC<PlansPageProps> = ({ user, currentPlan, onUpgrade, onBack }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [currency, setCurrency] = useState<CurrencyType>(getCurrencyPreference);

    useEffect(() => {
        const handleCurrencyChange = () => {
            setCurrency(getCurrencyPreference());
        };
        window.addEventListener('currency-change', handleCurrencyChange);
        return () => {
            window.removeEventListener('currency-change', handleCurrencyChange);
        };
    }, []);

    const [selectedPlanName, setSelectedPlanName] = useState<'PLUS' | 'PRO' | 'PREMIUM' | 'CORPORATE' | null>(null);
    const [corporateSeats, setCorporateSeats] = useState<number>(10);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [rating, setRating] = useState(() => {
        const stored = localStorage.getItem(`schoolofai-rating-${user?.id || 'guest'}`);
        return stored ? Number(stored) : 0;
    });

    const [isSubmittingBusiness, setIsSubmittingBusiness] = useState(false);

    const handleRequestBusinessPlan = async () => {
        if (!user?.id) {
            alert("Please log in to submit a request.");
            return;
        }
        setIsSubmittingBusiness(true);
        try {
            const { error } = await supabaseClient
                .from('profiles')
                .update({
                    pending_role: 'SPONSORED',
                    pending_txid: `Corporate Request`,
                    company_name: 'Sponsored'
                })
                .eq('id', user.id);
            if (error) throw error;

            await supabaseClient
                .from('mails')
                .insert({
                    name: user.name || 'Student',
                    email: user.email || '',
                    message: `Corporate enrollment request submitted by student user ${user.name || 'Student'} (${user.email || ''}).`,
                    type: 'ENROLLMENT'
                });
            
            const userEmail = user?.email || '';
            const notifKey = `portal-notifications-${userEmail}`;
            const stored = localStorage.getItem(notifKey);
            const list = stored ? JSON.parse(stored) : [];
            const newItem = {
                id: 'notif-' + Date.now(),
                title: "Corporate Enrollment Pending",
                description: `Your request to enroll under the Corporate Plan is under administrative review.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'payment'
            };
            localStorage.setItem(notifKey, JSON.stringify([newItem, ...list]));
            window.dispatchEvent(new Event('notifications-update'));
            window.dispatchEvent(new Event('profile-update'));
            
            alert("Your corporate enrollment request has been submitted! Admin will verify and activate your sponsored account shortly.");
        } catch (err) {
            console.error(err);
            alert("Failed to submit request.");
        } finally {
            setIsSubmittingBusiness(false);
        }
    };

    const handleRate = (stars: number) => {
        setRating(stars);
        localStorage.setItem(`schoolofai-rating-${user?.id || 'guest'}`, String(stars));
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('subscription_plans')}</h2>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/50 rounded-full text-xs font-bold text-violet-700 dark:text-violet-300">
                            <TrendingUp size={13} />
                            Live Rate: $1 USD = {getExchangeRate().toLocaleString()} UGX
                        </span>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 mt-2">{t('choose_plan')}</p>
                </div>
                <button
                    onClick={() => navigate('/profile')}
                    className="hidden sm:inline-block text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                    ← {t('back_to_profile')}
                </button>
            </div>

            {(rating > 0 || localStorage.getItem(`schoolofai-rating-${user?.id || 'guest'}`)) ? (
                <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
                    <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto">
                        <Sparkles size={32} />
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank you for your feedback!</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                            {currentPlan === 'SPONSORED'
                                ? `Your learning account is fully sponsored. We're glad to have you here.`
                                : "You now have full, unrestricted access to all learning modules. We're excited to support your education journey!"
                            }
                        </p>
                    </div>

                    <div className="border-t border-gray-100 dark:border-slate-850 pt-6 space-y-3">
                        <h4 className="text-sm font-bold text-gray-800 dark:text-slate-300">Your Rating</h4>
                        <div className="flex justify-center gap-2 py-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRate(star)}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(0)}
                                    className="text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                                >
                                    <span className={
                                        star <= (hoveredStar || rating)
                                            ? "text-yellow-400"
                                            : "text-gray-300 dark:text-slate-700"
                                    }>
                                        <Star className="inline-block w-4 h-4 mr-1 align-middle" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid xl:grid-cols-4 lg:grid-cols-2 grid-cols-1 gap-6 max-w-7xl mx-auto px-4 items-stretch">
                    {/* Basic Plan */}
                    <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    Free
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Basic</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">Free</span>
                                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">/ forever</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 min-h-[32px]">
                                Perfect for exploring introductory courses and getting started.
                            </p>

                            <div className="mb-6">
                                {currentPlan === 'INDIVIDUAL' ? (
                                    <div className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-bold text-xs text-center border border-gray-200 dark:border-slate-700">
                                        {t('current_plan')}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => {}}
                                        className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold text-xs transition-colors cursor-pointer"
                                    >
                                        Downgrade to Free
                                    </button>
                                )}
                            </div>

                            <div className="border-t border-gray-100 dark:border-slate-800/80 pt-5">
                                <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Included Benefits</p>
                                <ul className="space-y-3 text-xs text-gray-600 dark:text-slate-300">
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                        <span>Access to <strong>Introduction modules</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                        <span>Free community forums & discussions</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                        <span>Standard course progress tracking</span>
                                    </li>
                                    <li className="flex items-center gap-2.5 text-gray-400 dark:text-slate-600">
                                        <X size={16} className="text-gray-300 dark:text-slate-700 shrink-0" />
                                        <span>Pro & Premium course library</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Pro Plan ($25 / month) */}
                    <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-violet-500 shadow-xl shadow-violet-500/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-28 h-28 bg-violet-500 blur-3xl opacity-20 -mr-14 -mt-14 pointer-events-none"></div>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm flex items-center gap-1">
                                    <Star size={12} className="fill-current" /> Most Popular
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Pro</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{formatAmount(25)}</span>
                                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">/ month</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 min-h-[32px]">
                                Full monthly access for dedicated self-paced learners.
                            </p>

                            <div className="mb-6">
                                {((currentPlan as string) === 'PRO') ? (
                                    <div className="w-full py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold text-xs text-center border border-violet-200 dark:border-violet-900/60">
                                        Current Plan
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedPlanName('PRO')}
                                        className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <span>Upgrade to Pro</span>
                                        <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="border-t border-gray-100 dark:border-slate-800/80 pt-5">
                                <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Included Benefits</p>
                                <ul className="space-y-3 text-xs text-gray-600 dark:text-slate-300">
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                        <span><strong>All Pro & Free courses</strong> unlocked</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                        <span><strong>24/7 AI Tutor</strong> support</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                        <span>Downloadable resources & exercises</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                        <span>Verified course completion certificates</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Premium Plan ($150 one-time) */}
                    <div className="p-7 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-900 text-white border border-violet-400/40 shadow-xl shadow-indigo-950/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white blur-3xl opacity-15 -mr-16 -mt-16 pointer-events-none"></div>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/25 flex items-center gap-1">
                                    <Sparkles size={12} className="fill-current" /> Lifetime Access
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-1">Premium</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-black text-white">{formatAmount(150)}</span>
                                <span className="text-sm font-medium text-violet-200">one-time</span>
                            </div>
                            <p className="text-xs text-violet-100/90 mb-6 min-h-[32px]">
                                One-time payment • Lifetime access to all Pro & free courses.
                            </p>

                            <div className="mb-6">
                                {((currentPlan as string) === 'PREMIUM' || (currentPlan as string) === 'SPONSORED') ? (
                                    <div className="w-full py-2.5 rounded-xl bg-white/20 text-white font-bold text-xs text-center border border-white/30 backdrop-blur-sm">
                                        Current Plan
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedPlanName('PREMIUM')}
                                        className="w-full py-2.5 rounded-xl bg-white hover:bg-violet-50 text-indigo-900 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <span>Upgrade to Premium</span>
                                        <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="border-t border-white/15 pt-5">
                                <p className="text-[11px] font-bold text-violet-200 uppercase tracking-wider mb-3">Included Benefits</p>
                                <ul className="space-y-3 text-xs text-violet-50">
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-amber-300 shrink-0" />
                                        <span><strong>Lifetime access</strong> — zero renewals</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-amber-300 shrink-0" />
                                        <span>All current & future Pro courses</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-amber-300 shrink-0" />
                                        <span><strong>1-on-1 Mentorship</strong> & Live Q&A</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-amber-300 shrink-0" />
                                        <span>Portfolio review & career guidance</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Corporate Plan - Only Benefits & Straight to the Point */}
                    <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-violet-300/80 dark:border-violet-900/60 shadow-xl hover:shadow-2xl hover:border-violet-500 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-28 h-28 bg-violet-500 blur-3xl opacity-15 -mr-14 -mt-14 pointer-events-none"></div>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 flex items-center gap-1 border border-violet-200 dark:border-violet-900/60">
                                    <Building2 size={12} /> Corporate
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Corporate</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-xs font-semibold text-gray-400">From</span>
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{formatAmount(15)}</span>
                                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">/ seat</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 min-h-[32px]">
                                10–49 seats: $20/seat • 50+ seats: $15/seat.
                            </p>

                            <div className="mb-6 space-y-2">
                                <button
                                    onClick={() => navigate('/corporate/setup')}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>Setup Corporate Plan</span>
                                    <ArrowRight size={14} />
                                </button>
                                <button
                                    onClick={() => navigate('/corporate')}
                                    className="w-full py-1 text-center text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Building2 size={12} />
                                    <span>Open Corporate Dashboard →</span>
                                </button>
                            </div>

                            <div className="border-t border-gray-100 dark:border-slate-800/80 pt-5">
                                <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Corporate Benefits</p>
                                <ul className="space-y-3 text-xs text-gray-600 dark:text-slate-300">
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                        <span><strong>Dedicated team seats</strong> (10+ learners)</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                        <span>Custom <strong>Company branding & logo</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                        <span><strong>Email invitations</strong> & seat management</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                        <span>Live <strong>team progress & analytics</strong></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedPlanName && (
                <MarzPayCheckoutModal 
                    isOpen={!!selectedPlanName}
                    onClose={() => setSelectedPlanName(null)}
                    plan={selectedPlanName === 'PREMIUM' ? 'premium' : 'pro'}
                    user={user}
                    onSuccess={() => {
                        setSelectedPlanName(null);
                        onUpgrade(selectedPlanName);
                    }}
                />
            )}
        </div>
    );
};

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: 'PLUS' | 'PRO' | 'PREMIUM';
    amount: string;
    userId?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, planName, amount, userId }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addPortalNotification = (title: string, description: string, type: 'course' | 'achievement' | 'payment' | 'profile' | 'system' = 'system') => {
        const userEmail = localStorage.getItem('logged_in_email') || '';
        const notifKey = `portal-notifications-${userEmail}`;
        const stored = localStorage.getItem(notifKey);
        const list = stored ? JSON.parse(stored) : [];
        const newItem = {
            id: 'notif-' + Date.now(),
            title,
            description,
            timestamp: new Date().toISOString(),
            read: false,
            type
        };
        localStorage.setItem(notifKey, JSON.stringify([newItem, ...list]));
        window.dispatchEvent(new Event('notifications-update'));
    };

    const handleConfirm = async () => {
        if (!userId) {
            alert("Please log in to proceed with upgrade.");
            return;
        }
        if (!transactionId.trim() && !previewUrl) {
            alert("Please provide either a Transaction ID or upload a screenshot receipt of your payment.");
            return;
        }
        setIsSaving(true);
        try {
            // 1. Update profiles database with the pending upgrade information
            const { error } = await supabaseClient
                .from('profiles')
                .update({
                    pending_role: planName,
                    pending_txid: transactionId || 'Uploaded Screenshot',
                    pending_screenshot: previewUrl || ''
                })
                .eq('id', userId);

            if (error) throw error;

            // 2. Add "pending verification" notification
            addPortalNotification(
                "Payment Under Verification",
                `Your payment proof (ID: ${transactionId || 'Uploaded Screenshot'}) for the ${planName} plan upgrade is currently under administrative verification.`,
                "payment"
            );

            // 3. Notify student that it is pending
            alert("Payment proof submitted! Your transaction is now waiting to be verified from the admin console directory. You will receive a notification once verified.");
            onClose();
            window.location.href = '/profile';
        } catch (err: any) {
            console.error('Error upgrading plan:', err);
            alert('Failed to process upgrade. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white max-h-[90vh] overflow-y-auto">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-center mb-2">Complete Your Upgrade</h3>
                <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-6">
                    You are upgrading to <span className="font-bold text-welile-purple">{planName}</span> with a <span className="font-bold text-gray-800 dark:text-slate-200">one-time payment of {amount}</span>.
                </p>

                <div className="space-y-4">
                    {/* Airtel Money */}
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl">
                        <h4 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2 text-sm">
                            <span className="text-lg"><Smartphone className="inline-block w-4 h-4 mr-1 align-middle" /></span> Airtel Money
                        </h4>
                        <div className="text-xs space-y-1 text-gray-700 dark:text-slate-355">
                            <p><span className="font-semibold text-gray-900 dark:text-white">Dial:</span> <code className="bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded border dark:border-slate-700 font-mono font-bold">185*9#</code></p>
                            <p><span className="font-semibold text-gray-900 dark:text-white">Merchant ID:</span> <code className="bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded border dark:border-slate-700 font-mono font-bold">4380664</code></p>
                        </div>
                    </div>

                    {/* MTN MoMo */}
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-105 dark:border-yellow-900/50 rounded-2xl">
                        <h4 className="font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mb-2 text-sm">
                            <span className="text-lg"><Smartphone className="inline-block w-4 h-4 mr-1 align-middle" /></span> MTN MoMo
                        </h4>
                        <div className="text-xs space-y-1 text-gray-700 dark:text-slate-355">
                            <p><span className="font-semibold text-gray-900 dark:text-white">Instructions:</span> Use MoMo App or dial <code className="bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded border dark:border-slate-700 font-mono font-bold">165*3#</code></p>
                            <p><span className="font-semibold text-gray-900 dark:text-white">MoMo Code:</span> <code className="bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded border dark:border-slate-700 font-mono font-bold">090777</code></p>
                        </div>
                    </div>

                    {/* Bank Transfer */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl">
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2 text-sm">
                            <span className="text-lg"><Landmark className="inline-block w-4 h-4 mr-1 align-middle" /></span> Bank Transfer (Equity Bank)
                        </h4>
                        <div className="text-xs space-y-1 text-gray-700 dark:text-slate-355">
                            <p><span className="font-semibold text-gray-900 dark:text-white">Account Name:</span> Welile Technologies Limited</p>
                            <p><span className="font-semibold text-gray-900 dark:text-white">Account Number:</span> <code className="bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded border dark:border-slate-700 font-mono font-bold">1046203375259</code></p>
                            <p><span className="font-semibold text-gray-900 dark:text-white">Swift Code:</span> <code className="bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded border dark:border-slate-700 font-mono font-bold">EQBLUGKA</code></p>
                        </div>
                    </div>
                </div>

                {/* Proof of Payment Section */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-850 space-y-4">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">Submit Payment Proof</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Transaction ID</label>
                            <input 
                                type="text" 
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="e.g. MP260713.1200.A12345"
                                className="w-full p-2.5 bg-gray-55 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Screenshot / Receipt Image</label>
                            <div className="border border-dashed border-gray-250 dark:border-slate-700 rounded-xl p-3 text-center hover:bg-gray-50 dark:hover:bg-slate-800/40 relative cursor-pointer flex flex-col items-center justify-center min-h-[46px]">
                                <input 
                                    type="file" 
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {previewUrl ? (
                                    <div className="flex items-center gap-2 max-w-full">
                                        <img src={previewUrl} className="w-6 h-6 rounded object-cover shrink-0" />
                                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold truncate">{fileName}</span>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500 dark:text-slate-450">
                                        <span className="font-semibold text-welile-purple">Click to upload</span> receipt
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-6 mt-4 border-t border-gray-100 dark:border-slate-800">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-gray-250 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleConfirm}
                        disabled={isSaving}
                        className="flex-1 bg-welile-purple text-white py-3 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-purple-200 dark:shadow-none"
                    >
                        {isSaving ? (
                            <>
                                <Loader size={14} className="animate-spin text-white" />
                                Upgrading...
                            </>
                        ) : (
                            'I have made the payment'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlansPage;
