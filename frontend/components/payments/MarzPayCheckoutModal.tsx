import React, { useState, useEffect } from 'react';
import {
    X, Smartphone, CreditCard, ShieldCheck, CheckCircle2, AlertCircle,
    Loader2, Sparkles, ArrowRight, TrendingUp, Tag, Lock, BookOpen,
    Building2, Crown, ChevronDown, ChevronUp, PhoneCall
} from 'lucide-react';
import { formatAmount, getExchangeRate, getBaseExchangeRate, getMarkup, fetchLiveExchangeRate } from '../../src/lib/currency';
import { supabaseClient } from '../../src/lib/supabaseClient';

interface MarzPayCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: 'pro' | 'premium' | 'corporate';
    seats?: number;
    course?: {
        id: string;
        title: string;
        price?: number;
    };
    user?: any;
    onSuccess?: () => void;
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const MarzPayCheckoutModal: React.FC<MarzPayCheckoutModalProps> = ({
    isOpen,
    onClose,
    plan,
    seats = 10,
    course,
    user,
    onSuccess
}) => {
    const [method, setMethod] = useState<'mobile_money' | 'card'>('mobile_money');
    const [country, setCountry] = useState('UG');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [premiumOption, setPremiumOption] = useState<'full' | 'installment'>('full');
    const [showPromoBox, setShowPromoBox] = useState(false);

    // Live exchange rate state (Base rate + 300 UGX increase)
    const [effectiveRate, setEffectiveRate] = useState<number>(getExchangeRate);
    const [baseRate, setBaseRate] = useState<number>(getBaseExchangeRate);

    // Payment process states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'prompted' | 'polling' | 'success' | 'failed'>('idle');
    const [transactionData, setTransactionData] = useState<any>(null);
    const [countdown, setCountdown] = useState(120);

    // Promo Code state
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

    const isCoursePurchase = Boolean(course);
    const isPro = plan === 'pro' || isCoursePurchase;
    const isCorp = plan === 'corporate' && !isCoursePurchase;
    const numSeats = seats || 10;
    const corpUnitPrice = numSeats >= 50 ? 15 : 20;

    const planTitle = isCoursePurchase
        ? course?.title || 'Premium Course'
        : isCorp
            ? `Corporate Plan (${numSeats} Seats)`
            : (isPro ? 'Pro Monthly Subscription' : 'Premium Lifetime Access');

    const planBadgeLabel = isCoursePurchase
        ? 'Single Course Unlock'
        : isCorp
            ? 'Enterprise License'
            : (isPro ? 'Pro Membership' : 'Lifetime Membership');

    const usdPrice = isCoursePurchase
        ? (course?.price && course.price > 0 ? course.price : 25)
        : isCorp
            ? (numSeats * corpUnitPrice)
            : (isPro ? 25 : 150);

    // Calculate live amount: USD * (live dollar rate + 300 UGX)
    const baseUgxAmount = isCorp
        ? Math.round(usdPrice * effectiveRate)
        : (isPro
            ? Math.round(usdPrice * effectiveRate)
            : (premiumOption === 'installment' ? Math.round((usdPrice * effectiveRate) / 3) : Math.round(usdPrice * effectiveRate)));

    // Promo discount calculations: TEST1000 reduces pro plan / course to 1000 UGX
    const isPromoApplied = appliedPromo?.toUpperCase() === 'TEST1000' && isPro;
    const finalPayableUgx = isPromoApplied ? 1000 : baseUgxAmount;
    const discountUgx = isPromoApplied ? Math.max(0, baseUgxAmount - 1000) : 0;

    useEffect(() => {
        fetchLiveExchangeRate().then((r) => {
            setEffectiveRate(r);
            setBaseRate(getBaseExchangeRate());
        });

        const handleRateChange = () => {
            setEffectiveRate(getExchangeRate());
            setBaseRate(getBaseExchangeRate());
        };
        window.addEventListener('currency-change', handleRateChange);
        return () => window.removeEventListener('currency-change', handleRateChange);
    }, []);

    const getCountryDialCode = (c: string) => {
        switch (c) {
            case 'KE': return '+254';
            case 'RW': return '+250';
            case 'UG':
            default:
                return '+256';
        }
    };

    const formatFullInternationalPhone = (rawPhone: string, c: string = 'UG') => {
        if (!rawPhone) return '';
        let cleaned = rawPhone.replace(/[^\d+]/g, '').trim();
        if (cleaned.startsWith('+')) return cleaned;

        const dialCode = getCountryDialCode(c);
        const dialDigits = dialCode.replace('+', '');

        if (cleaned.startsWith(dialDigits)) {
            return `+${cleaned}`;
        }
        if (cleaned.startsWith('0')) {
            return `${dialCode}${cleaned.slice(1)}`;
        }
        return `${dialCode}${cleaned}`;
    };

    // Auto-detect provider based on Uganda prefix
    const getUgandaProvider = (number: string) => {
        const clean = number.replace(/\D/g, '');
        if (
            clean.startsWith('25677') || clean.startsWith('25678') || clean.startsWith('25676') ||
            clean.startsWith('077') || clean.startsWith('078') || clean.startsWith('076') ||
            clean.startsWith('77') || clean.startsWith('78') || clean.startsWith('76')
        ) {
            return { name: 'MTN MoMo', color: 'bg-amber-400 text-slate-950 border-amber-500' };
        }
        if (
            clean.startsWith('25670') || clean.startsWith('25675') || clean.startsWith('25674') ||
            clean.startsWith('070') || clean.startsWith('075') || clean.startsWith('074') ||
            clean.startsWith('70') || clean.startsWith('75') || clean.startsWith('74')
        ) {
            return { name: 'Airtel Money', color: 'bg-red-500 text-white border-red-600' };
        }
        return null;
    };

    const providerBadge = country === 'UG' ? getUgandaProvider(phoneNumber) : null;

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setPaymentStatus('idle');
            setTransactionData(null);
            setCountdown(120);
            setAppliedPromo(null);
            setPromoCodeInput('');
            setPromoError(null);
            setPromoSuccess(null);
            setShowPromoBox(false);
            if (user?.phone) {
                setPhoneNumber(user.phone);
            }
        }
    }, [isOpen, plan, user]);

    const handleApplyPromo = () => {
        setPromoError(null);
        setPromoSuccess(null);
        const code = promoCodeInput.trim().toUpperCase();
        if (!code) {
            setPromoError('Please enter a promo code.');
            return;
        }

        if (code === 'TEST1000') {
            if (!isPro) {
                setPromoError("Promo code 'TEST1000' is only applicable to Pro or single course purchases.");
                return;
            }
            setAppliedPromo('TEST1000');
            setPromoSuccess("Promo code 'TEST1000' applied: Payable amount reduced to UGX 1,000!");
        } else {
            setPromoError("Invalid promo code. Please check and try again.");
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromoCodeInput('');
        setPromoSuccess(null);
        setPromoError(null);
    };

    const activatePaidRole = async (targetPlan: 'pro' | 'premium' | 'corporate', txRef?: string) => {
        const targetRole = targetPlan === 'corporate' ? 'SPONSORED' : (targetPlan === 'premium' ? 'PREMIUM' : 'PRO');
        try {
            const { data: { user: authUser } } = await supabaseClient.auth.getUser();
            const uid = authUser?.id || user?.id;

            if (authUser) {
                await supabaseClient.auth.updateUser({
                    data: { role: targetRole, plan: targetPlan }
                });
            }

            if (uid) {
                await supabaseClient
                    .from('profiles')
                    .update({
                        role: targetRole,
                        pending_role: null,
                        pending_txid: txRef || null,
                        ...(targetPlan === 'corporate' ? { company_name: user?.company_name || 'Corporate Partner' } : {})
                    })
                    .eq('id', uid);

                // If purchasing a specific course, also enroll the student automatically
                if (course?.id) {
                    await supabaseClient.from('enrollments').insert({
                        user_id: uid,
                        course_id: course.id,
                        status: 'IN_PROGRESS',
                        progress: 0
                    });
                }
            }

            // Add celebration notification
            const userEmail = authUser?.email || user?.email || localStorage.getItem('logged_in_email') || '';
            const notifKey = `portal-notifications-${userEmail}`;
            const stored = localStorage.getItem(notifKey);
            const list = stored ? JSON.parse(stored) : [];
            const newItem = {
                id: 'notif-' + Date.now(),
                title: isCoursePurchase ? `Course Unlocked: ${course?.title}!` : `${targetPlan.toUpperCase()} Plan Activated!`,
                description: `Your MarzPay payment of UGX ${finalPayableUgx.toLocaleString()} was successful. ${isCoursePurchase ? `You are now enrolled in "${course?.title}" with full access.` : targetPlan === 'corporate' ? `${numSeats} Corporate learning seats are now active.` : 'You now have full access.'}`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'payment'
            };
            localStorage.setItem(notifKey, JSON.stringify([newItem, ...list]));
            window.dispatchEvent(new Event('notifications-update'));
        } catch (e) {
            console.warn('Role activation error:', e);
        }
        localStorage.setItem('user_plan', targetPlan);
        window.dispatchEvent(new Event('profile-update'));
    };

    // Polling effect for pending mobile money payments
    useEffect(() => {
        let interval: any = null;
        if (paymentStatus === 'prompted' && transactionData?.uuid) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${API_BASE}/api/payments/marzpay/status/${transactionData.uuid}`);
                    const contentType = res.headers.get('content-type') || '';
                    if (!contentType.includes('application/json')) {
                        console.warn('Status poll non-JSON response:', res.status);
                        return;
                    }
                    const data = await res.json();

                    if (data.isCompleted) {
                        setPaymentStatus('success');
                        clearInterval(interval);
                        await activatePaidRole(plan, transactionData?.reference);
                    } else if (data.isFailed) {
                        setPaymentStatus('failed');
                        setError('Payment was declined or cancelled on mobile phone. Please try again.');
                        clearInterval(interval);
                    }
                } catch (e) {
                    console.warn('Status poll warning:', e);
                }
            }, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [paymentStatus, transactionData]);

    // Countdown timer for STK prompt
    useEffect(() => {
        let timer: any = null;
        if (paymentStatus === 'prompted' && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [paymentStatus, countdown]);

    const handleInitiatePayment = async () => {
        setError(null);

        if (method === 'mobile_money' && !phoneNumber.trim()) {
            setError('Please enter your mobile phone number to receive the payment prompt.');
            return;
        }

        const formattedPhone = method === 'mobile_money'
            ? formatFullInternationalPhone(phoneNumber.trim(), country)
            : '';

        if (formattedPhone) {
            setPhoneNumber(formattedPhone);
        }

        setLoading(true);

        try {
            const bodyPayload = {
                plan,
                courseId: course?.id || undefined,
                courseTitle: course?.title || undefined,
                seats: isCorp ? numSeats : undefined,
                amount: finalPayableUgx,
                usdAmount: isPromoApplied ? Math.max(1, Math.round(1000 / effectiveRate)) : usdPrice,
                currency: 'UGX',
                country,
                method,
                phoneNumber: formattedPhone,
                userId: user?.id || '',
                userEmail: user?.email || '',
                userName: user?.name || user?.full_name || '',
                promoCode: appliedPromo || undefined
            };

            const response = await fetch(`${API_BASE}/api/payments/marzpay/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyPayload)
            });

            let result: any = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || `Server returned HTTP ${response.status} (${response.statusText})`);
            }

            if (!response.ok || !result.success) {
                const msg = result.error || 'Failed to initiate payment.';
                if (msg.includes('limit is UGX 200,000') && !isPro) {
                    setError('The MarzPay single mobile transaction limit is UGX 200,000. Please select "3 Monthly Installments" below to proceed smoothly!');
                    setPremiumOption('installment');
                } else {
                    setError(msg);
                }
                return;
            }

            const data = result.data;
            setTransactionData(data);

            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
                return;
            }

            if (data.status === 'completed' || data.isSandbox) {
                setPaymentStatus('success');
                await activatePaidRole(plan, data.reference);
            } else {
                setPaymentStatus('prompted');
                setCountdown(120);
            }
        } catch (err: any) {
            console.error('Payment initiation error:', err);
            setError(err.message || 'Network error while contacting MarzPay. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinishSuccess = () => {
        onClose();
        if (onSuccess) {
            onSuccess();
        } else {
            window.location.href = '/courses';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container — responsive bottom-sheet on small phones, floating card on tablet/desktop */}
            <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 w-full max-w-[500px] rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white max-h-[94dvh] sm:max-h-[92vh] flex flex-col overflow-hidden">

                {/* Top Gradient Accent Bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-400 shrink-0" />

                {/* Sticky Top Header Bar */}
                <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                            <Lock size={14} />
                        </div>
                        <div className="truncate">
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                                Welile Secure Checkout
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Instant Enrollment & Access
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close checkout"
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-5 flex-1">
                    {/* SUCCESS VIEW */}
                    {paymentStatus === 'success' ? (
                        <div className="text-center py-4 sm:py-6 space-y-5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-950/20">
                                <CheckCircle2 size={40} />
                            </div>

                            <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-black uppercase tracking-wider">
                                    <CheckCircle2 size={12} /> Payment Confirmed
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                    {isCoursePurchase ? 'Course Unlocked!' : `Welcome to ${planTitle}!`}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                                    {isCoursePurchase
                                        ? `Your payment for "${course?.title}" is complete and your enrollment is active.`
                                        : 'Your payment has been verified and full learning access is now active on your account.'}
                                </p>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-left text-xs space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-500 dark:text-slate-400">
                                        {isCoursePurchase ? 'Course' : 'Plan Activated'}
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[220px]">
                                        {isCoursePurchase ? course?.title : `${plan.toUpperCase()} Plan`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-500 dark:text-slate-400">Amount Paid</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        UGX {finalPayableUgx.toLocaleString()}{isPromoApplied ? ' (Promo)' : ` ($${usdPrice} USD)`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                    <span className="text-slate-500 dark:text-slate-400">Reference</span>
                                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                        {transactionData?.reference?.substring(0, 18) || 'VERIFIED'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleFinishSuccess}
                                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                            >
                                Start Learning Now <ArrowRight size={18} />
                            </button>
                        </div>
                    ) : paymentStatus === 'prompted' ? (
                        /* PROMPTED / WAITING ON PHONE STK VIEW */
                        <div className="text-center py-4 sm:py-6 space-y-5">
                            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                                <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping"></div>
                                <div className="w-16 h-16 bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center shadow-lg relative z-10">
                                    <PhoneCall size={30} className="animate-pulse" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="inline-block px-3 py-0.5 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 rounded-full text-[11px] font-bold uppercase tracking-wider">
                                    Action Required on Phone
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                    Approve Payment Prompt
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                                    We've sent a Mobile Money STK push for{' '}
                                    <strong className="text-violet-600 dark:text-violet-400">
                                        UGX {finalPayableUgx.toLocaleString()}
                                    </strong>{' '}
                                    to <strong className="text-gray-900 dark:text-white">{formatFullInternationalPhone(phoneNumber, country)}</strong>.
                                </p>
                            </div>

                            <div className="bg-amber-50/90 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 sm:p-4 text-xs text-amber-900 dark:text-amber-200 text-left space-y-2">
                                <p className="font-bold flex items-center gap-1.5">
                                    <AlertCircle size={14} className="shrink-0 text-amber-600" />
                                    Complete these 3 quick steps on your phone:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">
                                    <li>Unlock your phone screen (MTN MoMo or Airtel Money pop-up).</li>
                                    <li>Confirm merchant <strong>Welile / MarzPay</strong>.</li>
                                    <li>Enter your Mobile Money PIN to authorize.</li>
                                </ol>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 py-2.5 px-4 rounded-xl">
                                <Loader2 size={14} className="animate-spin text-violet-600 shrink-0" />
                                <span>Waiting for confirmation... ({countdown}s)</span>
                            </div>

                            <button
                                onClick={() => setPaymentStatus('idle')}
                                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Change Phone Number or Payment Method
                            </button>
                        </div>
                    ) : (
                        /* INITIAL CHECKOUT SELECTION VIEW */
                        <div className="space-y-4 sm:space-y-5">
                            {/* 1. Order Summary Card (Stripe / Coursera style) */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 shadow-md border border-slate-800">
                                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-violet-500/15 blur-2xl pointer-events-none" />

                                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-1 min-w-0">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-200 border border-violet-400/20">
                                            {isCoursePurchase ? <BookOpen size={11} /> : isCorp ? <Building2 size={11} /> : <Crown size={11} />}
                                            <span>{planBadgeLabel}</span>
                                        </div>
                                        <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug break-words">
                                            {planTitle}
                                        </h3>
                                    </div>

                                    <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 flex sm:flex-col items-baseline sm:items-end justify-between">
                                        <span className="text-[11px] text-slate-400 sm:hidden">Total Price</span>
                                        <div>
                                            {isPromoApplied ? (
                                                <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0">
                                                    <span className="text-xs line-through text-slate-400">
                                                        UGX {baseUgxAmount.toLocaleString()}
                                                    </span>
                                                    <span className="text-lg sm:text-xl font-black text-emerald-400">
                                                        UGX 1,000
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0">
                                                    <span className="text-lg sm:text-xl font-black text-white">
                                                        UGX {baseUgxAmount.toLocaleString()}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-violet-300">
                                                        ${usdPrice} USD
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Live Rate Footer inside Summary Card */}
                                <div className="relative z-10 mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                                    <span className="flex items-center gap-1.5 text-slate-400">
                                        <TrendingUp size={12} className="text-emerald-400 shrink-0" />
                                        <span>Exchange Rate:</span>
                                    </span>
                                    <span className="font-mono font-semibold text-slate-200">
                                        $1 USD = UGX {effectiveRate.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Error Banner */}
                            {error && (
                                <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-in fade-in duration-150">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                                    <div className="leading-relaxed break-words min-w-0 flex-1">{error}</div>
                                </div>
                            )}

                            {/* Premium Billing Schedule Selector (Only for Premium Plan) */}
                            {!isPro && !isCorp && (
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Billing Schedule
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setPremiumOption('full')}
                                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between sm:block ${
                                                premiumOption === 'full'
                                                    ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/25 ring-2 ring-violet-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">Single Payment</div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                UGX {(150 * effectiveRate).toLocaleString()} ($150)
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPremiumOption('installment')}
                                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between sm:block ${
                                                premiumOption === 'installment'
                                                    ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/25 ring-2 ring-violet-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">3 Installments</span>
                                                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-black">
                                                    MoMo Friendly
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                UGX {Math.round((150 * effectiveRate) / 3).toLocaleString()} / mo
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 2. Payment Method Selector Tabs (Flutterwave / Stripe style) */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Select Payment Method
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setMethod('mobile_money')}
                                        className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                                            method === 'mobile_money'
                                                ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/30 ring-2 ring-violet-500/20'
                                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                                method === 'mobile_money'
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                                <Smartphone size={16} />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-950">MTN</span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500 text-white">Airtel</span>
                                            </div>
                                        </div>
                                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                                            Mobile Money
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                            Instant phone PIN prompt
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMethod('card')}
                                        className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                                            method === 'card'
                                                ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/30 ring-2 ring-violet-500/20'
                                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                                method === 'card'
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                                <CreditCard size={16} />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-600 text-white">VISA</span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-orange-500 text-white">MC</span>
                                            </div>
                                        </div>
                                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                                            Bank Card
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                            Debit or Credit Card
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* 3. Method-Specific Input Area */}
                            {method === 'mobile_money' ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Mobile Money Number
                                        </label>
                                        {providerBadge ? (
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${providerBadge.color}`}>
                                                {providerBadge.name} Detected
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                MTN or Airtel supported
                                            </span>
                                        )}
                                    </div>

                                    {/* Unified Composite Phone Input — never overflows on mobile */}
                                    <div className="flex items-stretch rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all overflow-hidden">
                                        <select
                                            value={country}
                                            onChange={(e) => {
                                                const nextC = e.target.value;
                                                setCountry(nextC);
                                                if (phoneNumber.trim()) {
                                                    setPhoneNumber(formatFullInternationalPhone(phoneNumber.trim(), nextC));
                                                }
                                            }}
                                            aria-label="Country code"
                                            className="pl-3 pr-2 py-3 bg-transparent border-r border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer shrink-0"
                                        >
                                            <option value="UG">🇺🇬 +256</option>
                                            <option value="KE">🇰🇪 +254</option>
                                            <option value="RW">🇷🇼 +250</option>
                                        </select>

                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            onBlur={() => {
                                                if (phoneNumber.trim()) {
                                                    setPhoneNumber(formatFullInternationalPhone(phoneNumber.trim(), country));
                                                }
                                            }}
                                            placeholder="772 123 456"
                                            className="flex-1 min-w-0 px-3.5 py-3 bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                                        />
                                    </div>

                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                                        <span>An instant STK push prompt will appear on your phone to confirm with your PIN.</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-2 text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                            <ShieldCheck size={16} className="text-violet-600 shrink-0" />
                                            <span>3D-Secure Bank Card Checkout</span>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                                            PCI-DSS Level 1
                                        </span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                        Clicking pay below will open the encrypted MarzPay card portal to complete payment with your Visa or Mastercard.
                                    </p>
                                </div>
                            )}

                            {/* 4. Collapsible / Clean Promo Code Section */}
                            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 overflow-hidden">
                                {appliedPromo ? (
                                    <div className="p-3 flex items-center justify-between gap-2 bg-emerald-50/90 dark:bg-emerald-950/30">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Sparkles size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 truncate">
                                                    Promo '{appliedPromo}' Applied
                                                </div>
                                                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                                                    Saved UGX {discountUgx.toLocaleString()} — Pay only UGX 1,000
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemovePromo}
                                            className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-bold px-2 py-1 rounded cursor-pointer shrink-0"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowPromoBox(!showPromoBox)}
                                            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <Tag size={13} className="text-violet-600 dark:text-violet-400" />
                                                <span>Have a promo or scholarship code?</span>
                                            </span>
                                            {showPromoBox ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                        </button>

                                        {showPromoBox && (
                                            <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={promoCodeInput}
                                                        onChange={(e) => {
                                                            setPromoCodeInput(e.target.value.toUpperCase());
                                                            if (promoError) setPromoError(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleApplyPromo();
                                                            }
                                                        }}
                                                        placeholder="Enter code"
                                                        className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-500/20"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleApplyPromo}
                                                        className="px-4 py-2 bg-slate-900 dark:bg-violet-600 hover:bg-violet-600 dark:hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>

                                                {promoError && (
                                                    <div className="text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                                        <AlertCircle size={12} className="shrink-0" />
                                                        <span>{promoError}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* 5. Receipt Summary & Primary Submit CTA */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <div className="space-y-1 text-xs">
                                    {isPromoApplied && (
                                        <>
                                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                                <span>Standard Price</span>
                                                <span className="line-through">UGX {baseUgxAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                                                <span>Promo Discount ({appliedPromo})</span>
                                                <span>- UGX {discountUgx.toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                            Total Due Today
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                            UGX {finalPayableUgx.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleInitiatePayment}
                                    disabled={loading}
                                    className="w-full py-3.5 sm:py-4 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-violet-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin shrink-0" />
                                            <span>Processing Secure Payment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={15} className="shrink-0" />
                                            <span className="truncate">
                                                Pay UGX {finalPayableUgx.toLocaleString()} via {method === 'mobile_money' ? 'Mobile Money' : 'Card'}
                                            </span>
                                            <ArrowRight size={16} className="shrink-0" />
                                        </>
                                    )}
                                </button>

                                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-slate-400 dark:text-slate-500 text-center">
                                    <span className="inline-flex items-center gap-1">
                                        <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                                        256-Bit SSL Encrypted
                                    </span>
                                    <span>•</span>
                                    <span>Powered by MarzPay</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarzPayCheckoutModal;
