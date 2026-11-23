import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    AlertCircle, ArrowLeft, ArrowRight, BookOpen, Building2, CheckCircle2, ChevronDown, ChevronUp, Crown,
    Loader2, Lock, Minus, PhoneCall, Plus, ShieldCheck, Smartphone, Sparkles, Tag, TrendingUp
} from 'lucide-react';
import { useMarzPayCheckout } from './MarzPayCheckoutModal';
import { Course } from '../../types';

type Plan = 'pro' | 'premium' | 'corporate';

const BENEFITS: Record<Plan | 'course', string[]> = {
    pro: ['All Pro and free courses', 'Live cohorts with feedback', 'Resources and exercises', 'Verified certificates'],
    premium: ['Lifetime access, no renewals', 'All current and future Pro courses', '1-on-1 mentorship and live Q&A', 'Portfolio review and career guidance'],
    corporate: ['Dedicated team seats', 'Company branding and logo', 'Email invitations for your team', 'Live team progress'],
    course: ['Full access to this course', 'Certificate when you finish', 'Ask questions under every lesson', 'Learn at your own pace, on any phone'],
};

const PLAN_TABS: { id: Plan; label: string; sub: string }[] = [
    { id: 'pro', label: 'Pro', sub: '$25 / month' },
    { id: 'premium', label: 'Premium', sub: '$150 once' },
    { id: 'corporate', label: 'Corporate', sub: 'from $15 / seat' },
];

/**
 * Full-page checkout for the web: order summary on the left, payment on the right.
 * Uses the same MarzPay logic as the checkout pop-up, so prices, promo codes and payment confirmation behave identically.
 * Address: /checkout?plan=pro|premium|corporate[&seats=10] or /checkout?course=<course id>
 */
const CheckoutPage: React.FC<{ user?: any; courses?: Course[] }> = ({ user, courses = [] }) => {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const courseId = params.get('course');
    const course = useMemo(() => {
        const c = courseId ? courses.find(x => String(x.id) === courseId) : undefined;
        return c ? { id: String(c.id), title: c.title, price: c.price || 49 } : undefined;
    }, [courseId, courses]);
    const rawPlan = params.get('plan');
    const plan: Plan = rawPlan === 'premium' || rawPlan === 'corporate' ? rawPlan : 'pro';
    const seats = Math.max(10, Number(params.get('seats')) || 10);
    const back = params.get('back') || (course ? `/discover/${course.id}` : '/plans');

    useEffect(() => { document.title = 'Checkout | Welile School of AI'; }, []);

    const c = useMarzPayCheckout({
        isOpen: true,
        onClose: () => { /* the page stays; finishing sends the student on */ },
        plan,
        seats,
        course,
        user,
        onSuccess: () => navigate(course ? '/courses' : '/dashboard'),
    });

    const setPlan = (p: Plan) => { const n = new URLSearchParams(params); n.set('plan', p); n.delete('course'); setParams(n, { replace: true }); };
    const setSeats = (v: number) => { const n = new URLSearchParams(params); n.set('seats', String(Math.max(10, Math.min(500, v)))); setParams(n, { replace: true }); };

    const installment = !c.isPro && !c.isCorp && c.premiumOption === 'installment';
    const usdDue = c.isPromoApplied ? (1000 / c.effectiveRate).toFixed(2) : String(installment ? Math.round(c.usdPrice / 3) : c.usdPrice);
    const primaryAmount = c.displayCurrency === 'USD' ? `$${usdDue}` : `UGX ${c.finalPayableUgx.toLocaleString()}`;
    const secondaryAmount = c.displayCurrency === 'USD' ? `≈ UGX ${c.finalPayableUgx.toLocaleString()}` : `≈ $${usdDue} USD`;
    const period = c.isCoursePurchase ? 'one time' : c.isCorp ? `${c.numSeats} seats` : c.isPro ? 'per month' : installment ? 'first of 3 payments' : 'one time';
    const benefits = BENEFITS[c.isCoursePurchase ? 'course' : plan];
    const BadgeIcon = c.isCoursePurchase ? BookOpen : c.isCorp ? Building2 : Crown;

    const field = 'w-full h-12 rounded-[14px] border-2 border-transparent bg-panel dark:bg-night-3 px-4 text-[15px] font-semibold text-ink dark:text-white placeholder-[#9A94AE] outline-none focus:border-brand transition-colors';
    const choice = (on: boolean) => `press text-left rounded-[18px] border-2 p-3.5 transition-colors ${on ? 'border-brand bg-brand-soft/60 dark:bg-night-3' : 'border-transparent bg-panel dark:bg-night-3/60 hover:border-[#D9D0F5]'}`;

    return (
        <div className="min-h-[100dvh] lg:h-[100dvh] lg:flex lg:flex-col bg-panel dark:bg-night text-ink dark:text-white">
            {/* top bar */}
            <header className="frost sticky top-0 z-30 shrink-0">
                <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-[64px] flex items-center gap-3">
                    <button type="button" onClick={() => navigate(back)} className="press h-11 px-3.5 rounded-[14px] bg-white dark:bg-night-2 text-[13px] font-bold inline-flex items-center gap-2">
                        <ArrowLeft size={16} /><span className="hidden sm:inline">Back</span>
                    </button>
                    <Link to="/dashboard" aria-label="Welile School of AI" className="shrink-0"><img src="/schoolofai-logo.png" alt="Welile School of AI" className="h-10 object-contain" /></Link>
                    <div className="flex-1" />
                    <span className="inline-flex items-center gap-2 h-10 px-3.5 rounded-full bg-mint-soft text-[#0E5A35] text-[13px] font-bold"><Lock size={14} />Secure checkout</span>
                </div>
            </header>

            <main className="w-full max-w-[1180px] mx-auto px-3 sm:px-6 pb-3 pt-0.5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] gap-4 lg:gap-5 items-start lg:items-stretch lg:flex-1 lg:min-h-0">
                {/* ---------- order summary: one card, fits the screen ---------- */}
                <section aria-label="Order summary" className="relative overflow-hidden rounded-[28px] bg-night text-white p-6 lg:p-7 [@media(max-height:700px)]:lg:p-5 flex flex-col lg:min-h-0 lg:overflow-y-auto no-scrollbar">
                    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
                        <span className="absolute -right-20 -top-24 w-[300px] h-[300px] rounded-full bg-night-3" />
                        <span className="absolute right-24 -bottom-36 w-[240px] h-[240px] rounded-full bg-night-2" />
                    </div>

                    <div className="relative">
                        <p className="m-0 inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-night-3 text-[11px] font-extrabold tracking-[0.06em] uppercase text-lime-200"><BadgeIcon size={13} />{c.planBadgeLabel}</p>
                        <h1 className="mt-3 mb-0 text-[24px] xl:text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em]">{c.planTitle}</h1>
                        <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                            {c.isPromoApplied && <span className="text-[16px] font-bold text-[#8F88A8] line-through">{c.displayCurrency === 'USD' ? `$${c.usdPrice}` : `UGX ${c.baseUgxAmount.toLocaleString()}`}</span>}
                            <span className="text-[40px] xl:text-[46px] leading-none font-extrabold tracking-[-0.04em]">{primaryAmount}</span>
                            <span className="pb-1 text-[14px] font-semibold text-[#C9C3E6]">{period}</span>
                        </div>
                        <p className="mt-1 mb-0 text-[13px] font-semibold text-[#C9C3E6]">{secondaryAmount}</p>
                    </div>

                    <ul className="relative mt-4 [@media(max-height:700px)]:mt-3 p-0 list-none grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {benefits.map(b => (
                            <li key={b} className="flex items-center gap-2 rounded-[12px] bg-night-2 px-3 py-2.5 [@media(max-height:700px)]:py-2 text-[13px] font-semibold leading-snug">
                                <CheckCircle2 size={16} className="text-lime-200 shrink-0" />{b}
                            </li>
                        ))}
                    </ul>

                    <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#C9C3E6]"><TrendingUp size={14} className="text-lime-200" />Live rate: $1 = UGX {c.effectiveRate.toLocaleString()}</span>
                        <div role="radiogroup" aria-label="Show prices in" className="inline-flex p-1 rounded-[12px] bg-night-3">
                            {(['USD', 'UGX'] as const).map(cur => (
                                <button key={cur} type="button" role="radio" aria-checked={c.displayCurrency === cur} onClick={() => c.handleSwitchCurrency(cur)}
                                    className={`press h-8 px-3 rounded-[9px] text-[12px] font-extrabold ${c.displayCurrency === cur ? 'bg-white text-ink' : 'text-[#C9C3E6]'}`}>{cur === 'USD' ? 'USD $' : 'UGX USh'}</button>
                            ))}
                        </div>
                    </div>

                    {/* switch plan (not for single courses) */}
                    {!c.isCoursePurchase && c.paymentStatus === 'idle' && (
                        <div className="relative mt-auto pt-4">
                            <div className="pt-4 border-t border-white/10">
                                <p className="m-0 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#C9C3E6]">Change plan</p>
                                <div role="radiogroup" aria-label="Plan" className="mt-2.5 grid grid-cols-3 gap-2">
                                    {PLAN_TABS.map(t => (
                                        <button key={t.id} type="button" role="radio" aria-checked={plan === t.id} onClick={() => setPlan(t.id)}
                                            className={`press rounded-[14px] px-3 py-2 text-left ${plan === t.id ? 'bg-lime-200 text-night' : 'bg-night-2 text-white hover:bg-night-3'}`}>
                                            <span className="block text-[14px] font-extrabold">{t.label}</span>
                                            <span className={`block text-[11px] font-semibold ${plan === t.id ? 'text-lime-900' : 'text-[#C9C3E6]'}`}>{t.sub}</span>
                                        </button>
                                    ))}
                                </div>
                                {c.isCorp && (
                                    <div className="mt-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="m-0 text-[14px] font-bold">Team seats</p>
                                            <p className="m-0 text-[11px] text-[#C9C3E6]">10–49 seats $20 each · 50+ seats $15 each</p>
                                        </div>
                                        <div className="inline-flex items-center gap-1 p-1 rounded-[12px] bg-night-3 shrink-0">
                                            <button type="button" aria-label="Fewer seats" onClick={() => setSeats(seats - 5)} disabled={seats <= 10} className="press w-9 h-9 rounded-[9px] bg-night-2 inline-flex items-center justify-center disabled:opacity-40"><Minus size={15} /></button>
                                            <input aria-label="Number of seats" inputMode="numeric" value={seats} onChange={e => setSeats(Number(e.target.value.replace(/\D/g, '')) || 10)} className="w-12 h-9 bg-transparent text-center text-[15px] font-extrabold outline-none text-white" />
                                            <button type="button" aria-label="More seats" onClick={() => setSeats(seats + 5)} className="press w-9 h-9 rounded-[9px] bg-night-2 inline-flex items-center justify-center"><Plus size={15} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* ---------- payment ---------- */}
                <section aria-label="Payment" className="rounded-[28px] bg-white dark:bg-night-2 p-5 sm:p-6 lg:min-h-0 lg:overflow-y-auto no-scrollbar">
                    {c.paymentStatus === 'success' ? (
                        <div className="text-center py-6">
                            <span className="mx-auto w-20 h-20 rounded-[24px] bg-mint-soft text-mint flex items-center justify-center"><CheckCircle2 size={40} /></span>
                            <p className="mt-5 mb-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-mint-soft text-[#0E5A35] text-[12px] font-extrabold uppercase tracking-[0.06em]">Payment confirmed</p>
                            <h2 className="mt-3 mb-0 text-[28px] font-extrabold tracking-[-0.03em]">{c.isCoursePurchase ? 'Course unlocked!' : `Welcome to ${c.planTitle}!`}</h2>
                            <p className="mt-2 mb-0 text-[15px] leading-relaxed text-[#6B6680] dark:text-slate-400">{c.isCoursePurchase ? 'Your payment is complete and your enrolment is active.' : 'Your payment has been verified and your full access is now active.'}</p>
                            <dl className="mt-6 m-0 rounded-[18px] bg-panel dark:bg-night-3/60 p-4 text-left text-[14px] space-y-2.5">
                                <div className="flex justify-between gap-3"><dt className="text-[#6B6680] dark:text-slate-400">{c.isCoursePurchase ? 'Course' : 'Plan'}</dt><dd className="m-0 font-bold text-right truncate">{c.isCoursePurchase ? c.planTitle : `${plan.toUpperCase()} plan`}</dd></div>
                                <div className="flex justify-between gap-3"><dt className="text-[#6B6680] dark:text-slate-400">Amount paid</dt><dd className="m-0 font-bold text-mint">UGX {c.finalPayableUgx.toLocaleString()}</dd></div>
                                <div className="flex justify-between gap-3 pt-2.5 border-t border-[#E6E1F2] dark:border-night-3"><dt className="text-[#6B6680] dark:text-slate-400">Reference</dt><dd className="m-0 font-mono text-[12px] truncate">{c.transactionData?.reference?.substring(0, 18) || 'VERIFIED'}</dd></div>
                            </dl>
                            <button type="button" onClick={c.handleFinishSuccess} className="press mt-6 w-full h-[52px] rounded-[16px] bg-brand hover:bg-brand-mid text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2">Start learning now <ArrowRight size={18} /></button>
                        </div>
                    ) : c.paymentStatus === 'prompted' ? (
                        <div className="text-center py-6">
                            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                                <span aria-hidden="true" className="absolute inset-0 rounded-[24px] bg-brand/20 animate-ping" />
                                <span className="relative w-20 h-20 rounded-[24px] bg-brand text-white flex items-center justify-center"><PhoneCall size={34} /></span>
                            </div>
                            <p className="mt-5 mb-0 inline-flex items-center h-8 px-3 rounded-full bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 text-[12px] font-extrabold uppercase tracking-[0.06em]">Check your phone</p>
                            <h2 className="mt-3 mb-0 text-[28px] font-extrabold tracking-[-0.03em]">Approve the payment</h2>
                            <p className="mt-2 mb-0 text-[15px] leading-relaxed text-[#6B6680] dark:text-slate-400">
                                We sent a Mobile Money prompt for <b className="text-ink dark:text-white">UGX {c.finalPayableUgx.toLocaleString()}</b> to <b className="text-ink dark:text-white">{c.formatFullInternationalPhone(c.phoneNumber, c.country)}</b>.
                            </p>
                            <ol className="mt-6 p-0 list-none text-left flex flex-col gap-2">
                                {['Unlock your phone and open the MTN MoMo or Airtel Money pop-up.', 'Check the merchant is Welile / MarzPay.', 'Enter your Mobile Money PIN to approve.'].map((t, i) => (
                                    <li key={t} className="flex items-center gap-3 rounded-[16px] bg-panel dark:bg-night-3/60 px-4 py-3 text-[14px] font-semibold">
                                        <span className="w-8 h-8 rounded-[10px] bg-white dark:bg-night-2 text-brand dark:text-violet-300 inline-flex items-center justify-center text-[14px] font-extrabold shrink-0">{i + 1}</span>{t}
                                    </li>
                                ))}
                            </ol>
                            <p className="mt-5 mb-0 inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#FFF3D6] text-[#6B4A00] text-[13px] font-bold"><Loader2 size={15} className="animate-spin" />Waiting for confirmation… {c.countdown}s</p>
                            <button type="button" onClick={() => c.setPaymentStatus('idle')} className="press mt-5 w-full h-12 rounded-[14px] bg-panel dark:bg-night-3 text-[14px] font-bold">Change number or payment method</button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3.5 [@media(max-height:700px)]:gap-3">
                            <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">Payment</h2>

                            {c.error && (
                                <div role="alert" className="rounded-[16px] bg-[#FDECE8] dark:bg-red-950/30 text-[#A3321F] dark:text-red-300 p-4 text-[14px] flex items-start gap-2.5">
                                    <AlertCircle size={17} className="shrink-0 mt-0.5" /><span className="min-w-0 break-words">{c.error}</span>
                                </div>
                            )}

                            {!c.isPro && !c.isCorp && (
                                <fieldset className="m-0 p-0 border-0">
                                    <legend className="text-[13px] font-extrabold mb-1.5">How would you like to pay?</legend>
                                    <div role="radiogroup" aria-label="Payment plan" className="grid grid-cols-2 gap-1 p-1 rounded-[14px] bg-panel dark:bg-night-3/60">
                                        <button type="button" role="radio" aria-checked={c.premiumOption === 'full'} onClick={() => c.setPremiumOption('full')} className={`press rounded-[11px] px-3 py-2 text-left ${c.premiumOption === 'full' ? 'bg-brand text-white' : ''}`}>
                                            <span className="block text-[14px] font-extrabold leading-tight">Pay once</span>
                                            <span className={`block text-[11px] font-semibold ${c.premiumOption === 'full' ? 'text-[#E4DAFF]' : 'text-[#6B6680] dark:text-slate-400'}`}>UGX {Math.round(150 * c.effectiveRate).toLocaleString()}</span>
                                        </button>
                                        <button type="button" role="radio" aria-checked={c.premiumOption === 'installment'} onClick={() => c.setPremiumOption('installment')} className={`press rounded-[11px] px-3 py-2 text-left ${c.premiumOption === 'installment' ? 'bg-brand text-white' : ''}`}>
                                            <span className="block text-[14px] font-extrabold leading-tight">3 payments</span>
                                            <span className={`block text-[11px] font-semibold ${c.premiumOption === 'installment' ? 'text-[#E4DAFF]' : 'text-[#6B6680] dark:text-slate-400'}`}>UGX {Math.round((150 * c.effectiveRate) / 3).toLocaleString()} a month</span>
                                        </button>
                                    </div>
                                </fieldset>
                            )}

                            <div className="[@media(max-height:700px)]:hidden">
                                <p className="m-0 mb-1.5 text-[13px] font-extrabold">We accept</p>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {[
                                        { name: 'MTN', label: 'MTN Mobile Money', chip: 'bg-[#FFCC00] text-night' },
                                        { name: 'Airtel', label: 'Airtel Money', chip: 'bg-[#E40000] text-white' },
                                    ].map(n => {
                                        const detected = c.providerBadge?.name?.toLowerCase().includes(n.name.toLowerCase());
                                        return (
                                            <div key={n.name} className={`rounded-[14px] border-2 px-3 py-2 flex items-center gap-2.5 transition-colors ${detected ? 'border-brand bg-brand-soft/60 dark:bg-night-3' : 'border-transparent bg-panel dark:bg-night-3/60'}`}>
                                                <span className={`h-8 min-w-[48px] px-2 rounded-[9px] inline-flex items-center justify-center text-[12px] font-extrabold ${n.chip}`}>{n.name}</span>
                                                <span className="min-w-0">
                                                    <span className="block text-[14px] font-extrabold leading-tight truncate">{n.label}</span>
                                                    <span className={`block text-[11px] font-semibold ${detected ? 'text-brand dark:text-violet-300' : 'text-[#6B6680] dark:text-slate-400'}`}>{detected ? 'Your number' : 'Approve with PIN'}</span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {(
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <label htmlFor="momo" className="text-[13px] font-extrabold">Mobile Money number</label>
                                        {c.providerBadge
                                            ? <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${c.providerBadge.color}`}>{c.providerBadge.name} number</span>
                                            : <span className="hidden [@media(max-height:700px)]:flex gap-1"><span className="px-1.5 py-0.5 rounded-[6px] bg-[#FFCC00] text-night text-[10px] font-extrabold">MTN</span><span className="px-1.5 py-0.5 rounded-[6px] bg-[#E40000] text-white text-[10px] font-extrabold">Airtel</span></span>}
                                    </div>
                                    <div className="flex items-stretch rounded-[14px] bg-panel dark:bg-night-3 border-2 border-transparent focus-within:border-brand transition-colors overflow-hidden">
                                        <select aria-label="Country code" value={c.country} onChange={e => c.setCountry(e.target.value)} className="bg-transparent pl-3.5 pr-2 text-[15px] font-bold outline-none border-r border-[#E6E1F2] dark:border-night-2">
                                            <option value="UG">🇺🇬 +256</option>
                                            <option value="KE">🇰🇪 +254</option>
                                            <option value="RW">🇷🇼 +250</option>
                                        </select>
                                        <input id="momo" type="tel" inputMode="tel" autoComplete="tel" value={c.phoneNumber}
                                            onChange={e => c.setPhoneNumber(e.target.value)}
                                            onBlur={() => { if (c.phoneNumber.trim()) c.setPhoneNumber(c.formatFullInternationalPhone(c.phoneNumber.trim(), c.country)); }}
                                            placeholder="772 123 456" className="flex-1 min-w-0 h-12 px-3.5 bg-transparent text-[16px] font-bold placeholder-[#9A94AE] outline-none" />
                                    </div>
                                    <p className="mt-1.5 mb-0 text-[12px] text-[#6B6680] dark:text-slate-400 flex items-center gap-1.5"><ShieldCheck size={14} className="text-mint shrink-0" />A prompt will appear on your phone. Approve it with your PIN.</p>
                                </div>
                            )}

                            {/* promo */}
                            <div className="rounded-[16px] bg-panel dark:bg-night-3/60 overflow-hidden">
                                {c.appliedPromo ? (
                                    <div className="p-4 flex items-center justify-between gap-3 bg-mint-soft dark:bg-emerald-950/30">
                                        <span className="flex items-center gap-2.5 min-w-0">
                                            <Sparkles size={17} className="text-mint shrink-0" />
                                            <span className="min-w-0"><span className="block text-[14px] font-extrabold text-[#0E5A35] dark:text-emerald-300 truncate">Code {c.appliedPromo} applied</span><span className="block text-[12px] text-mint truncate">You save UGX {c.discountUgx.toLocaleString()}</span></span>
                                        </span>
                                        <button type="button" onClick={c.handleRemovePromo} className="text-[13px] font-bold text-[#C23A22] hover:underline shrink-0">Remove</button>
                                    </div>
                                ) : (
                                    <>
                                        <button type="button" aria-expanded={c.showPromoBox} onClick={() => c.setShowPromoBox(!c.showPromoBox)} className="w-full h-11 px-4 flex items-center justify-between text-[14px] font-bold">
                                            <span className="flex items-center gap-2"><Tag size={15} className="text-brand dark:text-violet-300" />Have a promo or scholarship code?</span>
                                            {c.showPromoBox ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                                        </button>
                                        {c.showPromoBox && (
                                            <div className="px-4 pb-4">
                                                <div className="flex gap-2">
                                                    <input aria-label="Promo code" value={c.promoCodeInput}
                                                        onChange={e => { c.setPromoCodeInput(e.target.value.toUpperCase()); if (c.promoError) c.setPromoError(null); }}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); c.handleApplyPromo(); } }}
                                                        placeholder="Enter code" className={`${field} !bg-white dark:!bg-night-2 uppercase tracking-[0.08em]`} />
                                                    <button type="button" onClick={c.handleApplyPromo} className="press h-12 px-5 rounded-[14px] bg-ink dark:bg-brand text-white text-[14px] font-bold shrink-0">Apply</button>
                                                </div>
                                                {c.promoError && <p role="alert" className="mt-2 mb-0 text-[13px] font-semibold text-[#C23A22] flex items-center gap-1.5"><AlertCircle size={14} />{c.promoError}</p>}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* totals + pay */}
                            <div className="pt-3.5 border-t border-[#EEEBF6] dark:border-night-3">
                                <dl className="m-0 space-y-2 text-[14px]">
                                    {c.isPromoApplied && <div className="flex justify-between gap-3"><dt className="text-[#6B6680] dark:text-slate-400">{c.planTitle}</dt><dd className="m-0 font-semibold">UGX {c.baseUgxAmount.toLocaleString()}</dd></div>}
                                    {c.isPromoApplied && <div className="flex justify-between gap-3 text-mint"><dt>Promo ({c.appliedPromo})</dt><dd className="m-0 font-semibold">− UGX {c.discountUgx.toLocaleString()}</dd></div>}
                                    <div className="flex justify-between items-baseline gap-3">
                                        <dt className="text-[15px] font-extrabold">Total due today</dt>
                                        <dd className="m-0 text-right"><span className="block text-[24px] font-extrabold tracking-[-0.02em]">{primaryAmount}</span><span className="block text-[12px] font-semibold text-[#6B6680] dark:text-slate-400">{secondaryAmount}</span></dd>
                                    </div>
                                </dl>
                                <button type="button" onClick={c.handleInitiatePayment} disabled={c.loading}
                                    className="press mt-3.5 w-full h-[54px] [@media(max-height:700px)]:h-12 rounded-[16px] bg-brand hover:bg-brand-mid text-white text-[16px] font-extrabold inline-flex items-center justify-center gap-2.5 disabled:opacity-60">
                                    {c.loading ? <><Loader2 size={18} className="animate-spin" />Processing secure payment…</> : <><Lock size={17} />Pay {primaryAmount} with Mobile Money<ArrowRight size={18} /></>}
                                </button>
                                <p className="mt-3 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-[#6B6680] dark:text-slate-400">
                                    <span className="inline-flex items-center gap-1"><ShieldCheck size={13} className="text-mint" />Encrypted payment</span><span aria-hidden="true">•</span><span>Powered by MarzPay</span><span aria-hidden="true">•</span><span>Access turns on as soon as you approve</span>
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CheckoutPage;
