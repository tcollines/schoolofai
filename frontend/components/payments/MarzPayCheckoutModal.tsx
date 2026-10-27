import React, { useState, useEffect } from 'react';
import { X, Smartphone, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowRight, RefreshCw, TrendingUp } from 'lucide-react';
import { formatAmount, getExchangeRate, getBaseExchangeRate, getMarkup, fetchLiveExchangeRate } from '../../src/lib/currency';
import { supabaseClient } from '../../src/lib/supabaseClient';

interface MarzPayCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: 'pro' | 'premium' | 'corporate';
    seats?: number;
    user?: any;
    onSuccess?: () => void;
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const MarzPayCheckoutModal: React.FC<MarzPayCheckoutModalProps> = ({
    isOpen,
    onClose,
    plan,
    seats = 10,
    user,
    onSuccess
}) => {
    const [method, setMethod] = useState<'mobile_money' | 'card'>('mobile_money');
    const [country, setCountry] = useState('UG');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [premiumOption, setPremiumOption] = useState<'full' | 'installment'>('full');
    
    // Live exchange rate state (Base rate + 300 UGX increase)
    const [effectiveRate, setEffectiveRate] = useState<number>(getExchangeRate);
    const [baseRate, setBaseRate] = useState<number>(getBaseExchangeRate);

    // Payment process states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'prompted' | 'polling' | 'success' | 'failed'>('idle');
    const [transactionData, setTransactionData] = useState<any>(null);
    const [countdown, setCountdown] = useState(120);

    const isPro = plan === 'pro';
    const isCorp = plan === 'corporate';
    const numSeats = seats || 10;
    const corpUnitPrice = numSeats >= 50 ? 15 : 20;

    const planTitle = isCorp 
        ? `Corporate Plan (${numSeats} Seats)` 
        : (isPro ? 'Pro Subscription' : 'Premium Lifetime Access');
    
    const usdPrice = isCorp
        ? (numSeats * corpUnitPrice)
        : (isPro ? 25 : 150);
    
    // Calculate live amount: USD * (live dollar rate + 300 UGX)
    const baseUgxAmount = isCorp
        ? Math.round(usdPrice * effectiveRate)
        : (isPro 
            ? Math.round(usdPrice * effectiveRate)
            : (premiumOption === 'installment' ? Math.round((usdPrice * effectiveRate) / 3) : Math.round(usdPrice * effectiveRate)));

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
            return { name: 'MTN MoMo', color: 'bg-yellow-400 text-yellow-950 border-yellow-500' };
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
            if (user?.phone) {
                setPhoneNumber(user.phone);
            }
        }
    }, [isOpen, plan, user]);

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
            }

            // Add celebration notification
            const userEmail = authUser?.email || user?.email || localStorage.getItem('logged_in_email') || '';
            const notifKey = `portal-notifications-${userEmail}`;
            const stored = localStorage.getItem(notifKey);
            const list = stored ? JSON.parse(stored) : [];
            const newItem = {
                id: 'notif-' + Date.now(),
                title: `${targetPlan.toUpperCase()} Plan Activated!`,
                description: `Your MarzPay payment of UGX ${baseUgxAmount.toLocaleString()} was successful. ${targetPlan === 'corporate' ? `${numSeats} Corporate learning seats are now active.` : 'You now have full access.'}`,
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
                seats: isCorp ? numSeats : undefined,
                amount: baseUgxAmount,
                usdAmount: usdPrice,
                currency: 'UGX',
                country,
                method,
                phoneNumber: formattedPhone,
                userId: user?.id || '',
                userEmail: user?.email || '',
                userName: user?.name || user?.full_name || ''
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
                // If limit reached on MarzPay, provide a helpful suggestion for premium
                const msg = result.error || 'Failed to initiate payment.';
                if (msg.includes('limit is UGX 200,000') && !isPro) {
                    setError('The MarzPay single mobile transaction limit is UGX 200,000. Please select "3 Monthly Installments (UGX 185,000/mo)" below to proceed smoothly!');
                    setPremiumOption('installment');
                } else {
                    setError(msg);
                }
                return;
            }

            const data = result.data;
            setTransactionData(data);

            if (data.redirectUrl) {
                // For card payments with redirect url
                window.location.href = data.redirectUrl;
                return;
            }

            if (data.status === 'completed' || data.isSandbox) {
                // Immediate confirmation (Sandbox or verified)
                setPaymentStatus('success');
                await activatePaidRole(plan, data.reference);
            } else {
                // Live STK prompt sent to phone, start polling
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity" onClick={onClose} />
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white max-h-[92vh] overflow-y-auto">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* SUCCESS VIEW */}
                {paymentStatus === 'success' ? (
                    <div className="text-center py-6 space-y-6">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-950/20 animate-bounce">
                            <CheckCircle2 size={44} />
                        </div>
                        
                        <div>
                            <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                                Payment Confirmed
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                                Welcome to {planTitle}!
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                                Your MarzPay transaction has been confirmed. Your account role has been upgraded and all course access is now unlocked.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 text-left text-xs space-y-1.5 font-medium">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Plan Activated</span>
                                <span className="font-bold text-gray-900 dark:text-white uppercase">{plan} Plan</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Amount Paid</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">UGX {baseUgxAmount.toLocaleString()} (${usdPrice} USD)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Transaction Ref</span>
                                <span className="font-mono text-gray-700 dark:text-slate-300">{transactionData?.reference?.substring(0, 18)}...</span>
                            </div>
                        </div>

                        <button
                            onClick={handleFinishSuccess}
                            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            Start Learning Now <ArrowRight size={18} />
                        </button>
                    </div>
                ) : paymentStatus === 'prompted' ? (
                    /* PROMPTED / WAITING ON PHONE STK VIEW */
                    <div className="text-center py-6 space-y-6">
                        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                            <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping"></div>
                            <div className="w-20 h-20 bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center shadow-lg relative z-10">
                                <Smartphone size={36} className="animate-pulse" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                                Check Your Phone
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                                A MarzPay payment prompt of <strong className="text-violet-600 dark:text-violet-400">UGX {baseUgxAmount.toLocaleString()}</strong> has been sent to <strong className="text-gray-900 dark:text-white">{formatFullInternationalPhone(phoneNumber, country)}</strong>.
                            </p>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 text-left space-y-2">
                            <p className="font-bold flex items-center gap-1.5">
                                <AlertCircle size={14} /> Please enter your Mobile Money PIN on your phone:
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
                                <li>Open your phone screen (MTN or Airtel prompt will appear).</li>
                                <li>Verify the merchant name (<strong>Welile / MarzPay</strong>).</li>
                                <li>Enter your PIN to confirm payment.</li>
                            </ol>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-slate-500">
                            <Loader2 size={14} className="animate-spin text-violet-600" />
                            <span>Waiting for mobile network confirmation... ({countdown}s)</span>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setPaymentStatus('idle')}
                                className="w-full py-3 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Cancel / Change Number
                            </button>
                        </div>
                    </div>
                ) : (
                    /* INITIAL CHECKOUT SELECTION VIEW */
                    <div className="space-y-6">
                        {/* Header Plan Summary */}
                        <div className="flex items-start justify-between pb-4 border-b border-gray-150 dark:border-slate-800">
                            <div>
                                <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    isPro 
                                        ? 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300' 
                                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                }`}>
                                    {planTitle}
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
                                    Complete Payment
                                </h3>
                            </div>
                            <div className="text-right">
                                <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                    ${usdPrice}
                                </div>
                                <div className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                                    ≈ UGX {baseUgxAmount.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Live Exchange Rate Indicator (Live Rate + 300 UGX) */}
                        <div className="flex items-center justify-between px-3.5 py-2 bg-violet-50/70 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 rounded-xl text-[11px] text-violet-800 dark:text-violet-300">
                            <div className="flex items-center gap-1.5 font-semibold">
                                <TrendingUp size={13} className="text-violet-600 dark:text-violet-400" />
                                <span>Live Dollar Rate:</span>
                            </div>
                            <div className="font-mono font-bold">
                                $1 USD = {effectiveRate.toLocaleString()} UGX <span className="text-[10px] text-gray-500 dark:text-slate-400 font-normal">({baseRate.toLocaleString()} + 300)</span>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <div className="leading-relaxed">{error}</div>
                            </div>
                        )}

                        {/* Premium Options (Full vs Installment within 200k limit) */}
                        {!isPro && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Payment Option</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPremiumOption('full')}
                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                            premiumOption === 'full'
                                                ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/20 ring-2 ring-violet-500/20'
                                                : 'border-gray-200 dark:border-slate-800 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="text-xs font-bold text-gray-900 dark:text-white">Full Lifetime</div>
                                        <div className="text-[11px] text-gray-500 dark:text-slate-400">UGX {(150 * effectiveRate).toLocaleString()} ($150)</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPremiumOption('installment')}
                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                            premiumOption === 'installment'
                                                ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/20 ring-2 ring-violet-500/20'
                                                : 'border-gray-200 dark:border-slate-800 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-bold text-gray-900 dark:text-white">3 Installments</div>
                                            <span className="text-[9px] bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-black">MoMo Friendly</span>
                                        </div>
                                        <div className="text-[11px] text-gray-500 dark:text-slate-400">UGX {Math.round((150 * effectiveRate) / 3).toLocaleString()} / mo</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Payment Method Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Select Payment Method</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMethod('mobile_money')}
                                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                                        method === 'mobile_money'
                                            ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/20 ring-2 ring-violet-500/20'
                                            : 'border-gray-200 dark:border-slate-800 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                                        <Smartphone size={18} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-gray-900 dark:text-white">Mobile Money</div>
                                        <div className="text-[10px] text-gray-500 dark:text-slate-400">MTN & Airtel</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setMethod('card')}
                                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                                        method === 'card'
                                            ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/20 ring-2 ring-violet-500/20'
                                            : 'border-gray-200 dark:border-slate-800 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                                        <CreditCard size={18} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-gray-900 dark:text-white">Card Payment</div>
                                        <div className="text-[10px] text-gray-500 dark:text-slate-400">Visa / Mastercard</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Mobile Money Details */}
                        {method === 'mobile_money' ? (
                            <div className="space-y-4 pt-1">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                                            Mobile Phone Number
                                        </label>
                                        {providerBadge && (
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${providerBadge.color}`}>
                                                {providerBadge.name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <select
                                            value={country}
                                            onChange={(e) => {
                                                const nextC = e.target.value;
                                                setCountry(nextC);
                                                if (phoneNumber.trim()) {
                                                    setPhoneNumber(formatFullInternationalPhone(phoneNumber.trim(), nextC));
                                                }
                                            }}
                                            className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/20"
                                        >
                                            <option value="UG">🇺🇬 +256 (Uganda)</option>
                                            <option value="KE">🇰🇪 +254 (Kenya)</option>
                                            <option value="RW">🇷🇼 +250 (Rwanda)</option>
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
                                            placeholder="e.g. 786686225 or 0786686225"
                                            className="flex-1 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500/20"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 dark:text-slate-500">
                                        You will receive an instant prompt on this phone to enter your PIN.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                                    <ShieldCheck size={16} className="text-violet-600" />
                                    Secure 3D-Secure Card Checkout
                                </div>
                                <p>
                                    You will be redirected to the MarzPay PCI-compliant payment gateway to enter your Visa or Mastercard details securely.
                                </p>
                            </div>
                        )}

                        {/* Summary & Submit */}
                        <div className="pt-4 border-t border-gray-150 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-slate-400">
                                <span>Total Payable</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white">
                                    UGX {baseUgxAmount.toLocaleString()}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleInitiatePayment}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-violet-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Connecting to MarzPay...
                                    </>
                                ) : (
                                    <>
                                        Pay UGX {baseUgxAmount.toLocaleString()} with {method === 'mobile_money' ? 'Mobile Money' : 'Card'}
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 dark:text-slate-500">
                                <ShieldCheck size={13} className="text-emerald-500" />
                                <span>Secured by MarzPay Payments API</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarzPayCheckoutModal;
