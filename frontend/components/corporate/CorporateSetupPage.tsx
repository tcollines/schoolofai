import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Building2, Users, Minus, Plus, ArrowRight, ShieldCheck, Mail, Phone, 
    Sparkles, Check, CheckCircle2, CreditCard, Smartphone, Upload, Globe, 
    User, Trash2, ArrowLeft, Loader2, Award, ChevronRight
} from 'lucide-react';
import { formatAmount, getExchangeRate } from '../../src/lib/currency';

interface CorporateSetupPageProps {
    user?: any;
}

export const CorporateSetupPage: React.FC<CorporateSetupPageProps> = ({ user }) => {
    const navigate = useNavigate();

    // Wizard Step State (1: Payment, 2: Organization Setup, 3: Add Members)
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    // Step 1: Seat Selection & Payment State
    const [seats, setSeats] = useState<number>(10);
    const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
    const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
    const [isPaying, setIsPaying] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Step 2: Organization Branding State
    const [companyName, setCompanyName] = useState(user?.companyName || user?.company_name || '');
    const [logoUrl, setLogoUrl] = useState('');
    const [contactName, setContactName] = useState(user?.name || user?.full_name || '');
    const [contactEmail, setContactEmail] = useState(user?.email || '');
    const [contactPhone, setContactPhone] = useState(user?.phone || '');
    const [website, setWebsite] = useState('');
    const [isSavingOrg, setIsSavingOrg] = useState(false);

    // Step 3: Member Invites State
    interface InviteItem {
        id: string;
        name: string;
        email: string;
        department: string;
    }
    const [invites, setInvites] = useState<InviteItem[]>([]);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberDept, setNewMemberDept] = useState('Engineering');
    const [bulkEmails, setBulkEmails] = useState('');
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [isSubmittingInvites, setIsSubmittingInvites] = useState(false);

    // Pricing calculations
    const unitPrice = seats >= 50 ? 15 : 20;
    const totalUsd = seats * unitPrice;
    const isDiscounted = seats >= 50;
    const exchangeRate = getExchangeRate();
    const totalUgx = Math.round(totalUsd * exchangeRate);

    // Pre-populate branding if org already exists
    useEffect(() => {
        const fetchExisting = async () => {
            try {
                const userEmail = user?.email || localStorage.getItem('auth_logged_in_email') || '';
                const userId = user?.id || localStorage.getItem('auth_logged_in_id') || '';
                const res = await fetch(`/api/corporate/organization?userId=${userId}&userEmail=${encodeURIComponent(userEmail)}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.data) {
                        if (json.data.name && json.data.name !== 'Corporate Partner') setCompanyName(json.data.name);
                        if (json.data.logoUrl) setLogoUrl(json.data.logoUrl);
                        if (json.data.contactName) setContactName(json.data.contactName);
                        if (json.data.contactEmail) setContactEmail(json.data.contactEmail);
                        if (json.data.contactPhone) setContactPhone(json.data.contactPhone);
                        if (json.data.website) setWebsite(json.data.website);
                    }
                }
            } catch (err) {
                console.warn('Error loading org details:', err);
            }
        };
        fetchExisting();
    }, [user]);

    // Handle File upload for Logo
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Step 1: Submit Payment & Provision Seats
    const handleProcessPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPaying(true);
        setPaymentError(null);

        try {
            const userEmail = user?.email || localStorage.getItem('auth_logged_in_email') || 'student@welile.com';
            const userId = user?.id || localStorage.getItem('auth_logged_in_id') || 'default-owner';

            // 1. Try initiating real payment or provision directly
            const provisionRes = await fetch('/api/corporate/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    userEmail,
                    seats,
                    planTier: seats >= 50 ? 'corporate_tier2' : 'corporate_tier1'
                })
            });

            if (!provisionRes.ok) {
                const errData = await provisionRes.json();
                throw new Error(errData.error || 'Failed to process corporate plan subscription.');
            }

            // Also record a notification
            const notifKey = `portal-notifications-${userEmail}`;
            const stored = localStorage.getItem(notifKey);
            const list = stored ? JSON.parse(stored) : [];
            const newNotif = {
                id: 'notif-' + Date.now(),
                title: "Corporate Plan Activated!",
                description: `Successfully subscribed to ${seats} seats under Corporate Plan.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'payment'
            };
            localStorage.setItem(notifKey, JSON.stringify([newNotif, ...list]));
            window.dispatchEvent(new Event('notifications-update'));

            setPaymentSuccess(true);
            setTimeout(() => {
                setCurrentStep(2);
            }, 800);
        } catch (err: any) {
            console.error(err);
            setPaymentError(err.message || 'Payment processing failed. Please try again.');
        } finally {
            setIsPaying(false);
        }
    };

    // Step 2: Save Organization Branding
    const handleSaveOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) {
            alert('Please enter your Company / Organization name.');
            return;
        }

        setIsSavingOrg(true);
        try {
            const userId = user?.id || localStorage.getItem('auth_logged_in_id') || 'default-owner';
            const res = await fetch('/api/corporate/branding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    name: companyName.trim(),
                    logoUrl: logoUrl.trim(),
                    contactName: contactName.trim(),
                    contactEmail: contactEmail.trim(),
                    contactPhone: contactPhone.trim(),
                    website: website.trim()
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update company branding.');
            }

            setCurrentStep(3);
        } catch (err: any) {
            alert(err.message || 'Error saving organization setup.');
        } finally {
            setIsSavingOrg(false);
        }
    };

    // Step 3: Add Individual Member to Staging List
    const handleAddSingleMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberEmail.trim()) return;

        // Check seat limit
        if (invites.length + 1 >= seats) {
            alert(`You have reached your purchased capacity of ${seats} seats.`);
            return;
        }

        if (invites.some(i => i.email.toLowerCase() === newMemberEmail.trim().toLowerCase())) {
            alert('This email is already in your invite list.');
            return;
        }

        setInvites(prev => [
            ...prev,
            {
                id: 'staging-' + Date.now(),
                name: newMemberName.trim() || newMemberEmail.split('@')[0],
                email: newMemberEmail.trim().toLowerCase(),
                department: newMemberDept
            }
        ]);

        setNewMemberName('');
        setNewMemberEmail('');
    };

    // Step 3: Add Bulk Emails
    const handleAddBulkEmails = () => {
        if (!bulkEmails.trim()) return;

        const emailList = bulkEmails
            .split(/[\n,;]+/)
            .map(e => e.trim().toLowerCase())
            .filter(e => e && e.includes('@'));

        if (emailList.length === 0) {
            alert('No valid emails detected.');
            return;
        }

        const remainingSeats = seats - 1 - invites.length;
        if (emailList.length > remainingSeats) {
            alert(`You only have ${remainingSeats} seat(s) remaining. Found ${emailList.length} emails.`);
            return;
        }

        const newItems: InviteItem[] = [];
        emailList.forEach((email, idx) => {
            if (!invites.some(i => i.email === email) && !newItems.some(i => i.email === email)) {
                newItems.push({
                    id: 'bulk-' + Date.now() + '-' + idx,
                    name: email.split('@')[0],
                    email,
                    department: newMemberDept
                });
            }
        });

        setInvites(prev => [...prev, ...newItems]);
        setBulkEmails('');
        setIsBulkMode(false);
    };

    const handleRemoveInvite = (id: string) => {
        setInvites(prev => prev.filter(i => i.id !== id));
    };

    // Step 3: Complete Setup & Send Invites -> Redirect to Corporate Tab
    const handleFinalizeAndRedirect = async () => {
        setIsSubmittingInvites(true);
        try {
            const userEmail = user?.email || localStorage.getItem('auth_logged_in_email') || '';
            const userId = user?.id || localStorage.getItem('auth_logged_in_id') || '';

            // Send invites if any added
            if (invites.length > 0) {
                await fetch('/api/corporate/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orgId: 'primary',
                        invites: invites.map(i => ({
                            name: i.name,
                            email: i.email,
                            department: i.department
                        })),
                        user: { id: userId, email: userEmail, name: contactName }
                    })
                });
            }

            // Redirect user to the Corporate tab on their account
            navigate('/corporate');
        } catch (err) {
            console.error('Error sending corporate invites:', err);
            // Even if invite network glitch, redirect to corporate dashboard
            navigate('/corporate');
        } finally {
            setIsSubmittingInvites(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/plans')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Plans</span>
                </button>
                <div className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-900/60 flex items-center gap-1.5">
                    <Building2 size={13} />
                    <span>Corporate Onboarding Portal</span>
                </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="mb-10 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                    {/* Step 1 Pill */}
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                            currentStep === 1 
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 ring-4 ring-violet-500/10' 
                                : currentStep > 1 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                        }`}>
                            {currentStep > 1 ? <Check size={18} /> : '1'}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Step 1</p>
                            <p className={`text-sm font-bold ${currentStep === 1 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'}`}>
                                Plan & Payment
                            </p>
                        </div>
                    </div>

                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${currentStep > 1 ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-800'}`} />

                    {/* Step 2 Pill */}
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                            currentStep === 2 
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 ring-4 ring-violet-500/10' 
                                : currentStep > 2 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                        }`}>
                            {currentStep > 2 ? <Check size={18} /> : '2'}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Step 2</p>
                            <p className={`text-sm font-bold ${currentStep === 2 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'}`}>
                                Organization Setup
                            </p>
                        </div>
                    </div>

                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${currentStep > 2 ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-800'}`} />

                    {/* Step 3 Pill */}
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                            currentStep === 3 
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 ring-4 ring-violet-500/10' 
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                        }`}>
                            3
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Step 3</p>
                            <p className={`text-sm font-bold ${currentStep === 3 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'}`}>
                                Invite Members
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* STEP 1: PLAN & PAYMENT */}
            {currentStep === 1 && (
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-fadeIn">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-bold mb-3">
                            <Building2 size={14} /> Step 1: Seat Selection & Payment
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            Select Team Seats & Complete Payment
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            Choose how many seats your team requires. $20/seat for 10–49 seats, or $15/seat for 50+ seats.
                        </p>
                    </div>

                    {paymentError && (
                        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-sm">
                            {paymentError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left: Seat Calculator */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700/80 space-y-5">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                                        <Users size={18} className="text-violet-600" />
                                        Team Seats (Min. 10):
                                    </label>
                                    <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
                                        {seats} Seats
                                    </span>
                                </div>

                                {/* Slider with - / + */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSeats(prev => Math.max(10, prev - 5))}
                                        disabled={seats <= 10}
                                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-gray-700 dark:text-white border border-gray-200 dark:border-slate-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-sm"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="range"
                                        min="10"
                                        max="200"
                                        step="5"
                                        value={seats}
                                        onChange={(e) => setSeats(Number(e.target.value))}
                                        className="flex-1 accent-violet-600 cursor-pointer h-2.5 bg-gray-200 dark:bg-slate-700 rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSeats(prev => prev + 5)}
                                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-gray-700 dark:text-white border border-gray-200 dark:border-slate-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer shadow-sm"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {/* Quick Presets */}
                                <div className="grid grid-cols-4 gap-2">
                                    {[10, 25, 50, 100].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setSeats(s)}
                                            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                                seats === s
                                                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                                                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
                                            }`}
                                        >
                                            {s} Seats {s >= 50 && '⭐'}
                                        </button>
                                    ))}
                                </div>

                                {isDiscounted ? (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                                        <span>🎉 25% Volume Discount ($15/seat) Applied!</span>
                                        <span>Save ${(20 - 15) * seats} USD</span>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center justify-between">
                                        <span>Standard Tier: $20 / seat</span>
                                        <span className="text-violet-600 font-semibold cursor-pointer" onClick={() => setSeats(50)}>
                                            Get 50+ seats for $15/seat →
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Benefits Checklist */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                    Corporate Inclusions:
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 dark:text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-violet-600 shrink-0" />
                                        <span>{seats} Full-Access Member Seats</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-violet-600 shrink-0" />
                                        <span>Custom Logo & Corporate Branding</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-violet-600 shrink-0" />
                                        <span>Live Course Progress Analytics</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-violet-600 shrink-0" />
                                        <span>Dedicated Account Manager & AI Tutor</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Payment Box */}
                        <div className="lg:col-span-5 bg-gradient-to-b from-gray-50 to-white dark:from-slate-800/80 dark:to-slate-900 border border-gray-200 dark:border-slate-700 p-6 rounded-3xl shadow-lg space-y-6">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                    Order Summary
                                </h3>
                                <div className="flex items-baseline justify-between border-b border-gray-200 dark:border-slate-700 pb-4">
                                    <div>
                                        <div className="text-3xl font-black text-gray-900 dark:text-white">
                                            {formatAmount(totalUsd)}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            ${unitPrice}/seat for {seats} team members
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-violet-600 dark:text-violet-400">
                                            USh {totalUgx.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-gray-400">Live Rate</div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                                    Select Payment Method:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('mobile_money')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                            paymentMethod === 'mobile_money'
                                                ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                                        }`}
                                    >
                                        <Smartphone size={20} />
                                        <span className="text-xs">Mobile Money</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                            paymentMethod === 'card'
                                                ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                                        }`}
                                    >
                                        <CreditCard size={20} />
                                        <span className="text-xs">Card / Visa</span>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleProcessPayment} className="space-y-4">
                                {paymentMethod === 'mobile_money' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                            MTN or Airtel Money Number:
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="0770 000 000"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            You will receive a prompt on your phone to approve the transaction.
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                            Cardholder Billing Email:
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={user?.email || 'finance@company.com'}
                                            readOnly
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isPaying}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                                >
                                    {isPaying ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Processing Corporate Payment...</span>
                                        </>
                                    ) : paymentSuccess ? (
                                        <>
                                            <Check size={18} />
                                            <span>Payment Confirmed! Advancing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Complete Payment ({formatAmount(totalUsd)})</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 text-center">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    <span>256-Bit Encrypted MarzPay Secure Checkout</span>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: SETUP OF THE ORGANISATION */}
            {currentStep === 2 && (
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-fadeIn">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-3">
                                <CheckCircle2 size={14} /> Step 1 Completed • {seats} Seats Paid
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                Setup Your Organization Branding
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                Add your company name, logo and representative contacts. This brand identity will appear on learner dashboards and verified certificates.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveOrganization} className="space-y-6 max-w-2xl">
                        {/* Company Name */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                Company / Organization Name *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Acme Technologies Ltd"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>

                        {/* Logo Upload & Preview */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                Company Logo
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <Building2 size={24} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 border border-violet-200 dark:border-violet-900 text-xs font-bold cursor-pointer transition-colors">
                                        <Upload size={14} />
                                        <span>Upload Logo Image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-[11px] text-gray-400">PNG, SVG, or JPG recommended (Square or horizontal)</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Person Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    Lead Contact Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Sarah Jenkins"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    Official Contact Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="admin@company.com"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="+256 700 000 000"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    Website URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://company.com"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>

                        {/* Continue Button */}
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                            >
                                ← Modify Seats
                            </button>
                            <button
                                type="submit"
                                disabled={isSavingOrg}
                                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-violet-500/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                            >
                                {isSavingOrg ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Saving Organization...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Save & Continue to Member Invites</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* STEP 3: ADDING THE MEMBERS */}
            {currentStep === 3 && (
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-fadeIn">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-bold mb-3">
                            <Users size={14} /> Step 3: Add & Invite Team Members
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            Assign Seats to Your Team
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            You have <strong className="text-violet-600 dark:text-violet-400">{seats} corporate seats</strong> available. Add member emails below to send onboarding invites.
                        </p>
                    </div>

                    {/* Seat Allocation Meter */}
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                Seat Utilization
                            </span>
                            <div className="text-lg font-black text-gray-900 dark:text-white">
                                {invites.length + 1} of {seats} Seats Claimed
                            </div>
                        </div>
                        <div className="w-full sm:w-64 space-y-1.5">
                            <div className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-violet-600 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, ((invites.length + 1) / seats) * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                                <span>{seats - (invites.length + 1)} remaining</span>
                                <span>{Math.round(((invites.length + 1) / seats) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Toggle: Single vs Bulk */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-150 dark:border-slate-800 pb-2">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                                {isBulkMode ? 'Bulk Paste Member Emails' : 'Add Single Team Member'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsBulkMode(!isBulkMode)}
                                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                            >
                                {isBulkMode ? 'Switch to Single Add Form' : 'Switch to Bulk Paste'}
                            </button>
                        </div>

                        {!isBulkMode ? (
                            <form onSubmit={handleAddSingleMember} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                <div className="sm:col-span-4">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                        Member Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Alex Mutua"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div className="sm:col-span-4">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                        Work Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="alex@company.com"
                                        value={newMemberEmail}
                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                        Department
                                    </label>
                                    <select
                                        value={newMemberDept}
                                        onChange={(e) => setNewMemberDept(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                                    >
                                        <option value="Engineering">Engineering</option>
                                        <option value="Product">Product</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Operations">Operations</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Design">Design</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <button
                                        type="submit"
                                        className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                                    >
                                        + Add Seat
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <textarea
                                    rows={4}
                                    placeholder="Paste emails separated by commas or newlines (e.g. dev1@company.com, dev2@company.com)..."
                                    value={bulkEmails}
                                    onChange={(e) => setBulkEmails(e.target.value)}
                                    className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleAddBulkEmails}
                                        className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow cursor-pointer"
                                    >
                                        Parse & Add to Roster
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Staging Roster Table */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                Staged Team Invites ({invites.length + 1} learners)
                            </h4>
                        </div>

                        <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-slate-800">
                            {/* Primary Account Owner Row */}
                            <div className="p-3.5 bg-violet-50/60 dark:bg-violet-950/20 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold">
                                        {contactName?.[0] || 'A'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                            {contactName || 'Corporate Admin'}
                                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-200 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 font-bold">OWNER</span>
                                        </p>
                                        <p className="text-gray-500 dark:text-slate-400">{contactEmail || user?.email}</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                    Admin Seat Active
                                </span>
                            </div>

                            {/* Added Invite Members */}
                            {invites.map((member) => (
                                <div key={member.id} className="p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between text-xs hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 flex items-center justify-center font-bold">
                                            {member.name?.[0] || member.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{member.name}</p>
                                            <p className="text-gray-500 dark:text-slate-400">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                                            {member.department}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveInvite(member.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 3 Footer Actions -> Redirects to Corporate Portal Tab */}
                    <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white cursor-pointer order-2 sm:order-1"
                        >
                            ← Edit Organization Details
                        </button>

                        <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                            <button
                                type="button"
                                onClick={handleFinalizeAndRedirect}
                                disabled={isSubmittingInvites}
                                className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                            >
                                {isSubmittingInvites ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Launching Corporate Portal...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Complete Setup & Open Corporate Portal</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CorporateSetupPage;
