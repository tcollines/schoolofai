import React, { useState } from 'react';
import { CheckCircle, Sparkles, X, Loader } from 'lucide-react';
import { UserRole } from '../types';
import { useTranslation } from './translations';
import { supabase } from '../src/lib/supabase';

interface PlansPageProps {
    user?: any;
    currentPlan: UserRole;
    onUpgrade: (plan: string) => void;
    onBack?: () => void;
}

const PlansPage: React.FC<PlansPageProps> = ({ user, currentPlan, onUpgrade, onBack }) => {
    const { t } = useTranslation();
    const [selectedPlanName, setSelectedPlanName] = useState<'PLUS' | 'PRO' | null>(null);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [rating, setRating] = useState(() => {
        const stored = localStorage.getItem(`schoolofai-rating-${user?.id || 'guest'}`);
        return stored ? Number(stored) : 0;
    });

    const handleRate = (stars: number) => {
        setRating(stars);
        localStorage.setItem(`schoolofai-rating-${user?.id || 'guest'}`, String(stars));
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('subscription_plans')}</h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-2">{t('choose_plan')}</p>
                </div>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        ← {t('back_to_profile')}
                    </button>
                )}
            </div>

            {(currentPlan === 'PRO' || currentPlan === 'ADMIN') ? (
                <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto">
                        <Sparkles size={32} />
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enjoy Our Services</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                            You now have full, unrestricted access to all learning modules, advanced assignments, certificates, and our 24/7 interactive AI Tutor. We're excited to support your education journey!
                        </p>
                    </div>

                    <div className="border-t border-gray-100 dark:border-slate-850 pt-6 space-y-3">
                        <h4 className="text-sm font-bold text-gray-800 dark:text-slate-300">Rate Our Services</h4>
                        <p className="text-xs text-gray-450 dark:text-slate-500">
                            Your feedback helps us make schoolofai even better.
                        </p>
                        
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
                                        ★
                                    </span>
                                </button>
                            ))}
                        </div>

                        {rating > 0 && (
                            <div className="text-xs text-green-600 dark:text-green-400 font-semibold animate-in fade-in duration-300">
                                Thank you for rating us {rating} out of 5 stars!
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Basic Plan */}
                <div className={`p-8 rounded-2xl bg-white dark:bg-slate-900 border ${currentPlan === 'INDIVIDUAL' ? 'border-gray-200 dark:border-slate-700' : 'border-gray-100 dark:border-slate-805'} shadow-sm relative group hover:border-welile-purple dark:hover:border-purple-600 hover:shadow-lg transition-all`}>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Basic</h3>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Free<span className="text-lg text-gray-500 dark:text-slate-400 font-normal">/forever</span></div>
                    <p className="text-gray-600 dark:text-slate-350 mb-8">Perfect for exploring new topics and getting started.</p>

                    <div className="mb-8">
                        {currentPlan === 'INDIVIDUAL' ? (
                            <div className="w-full py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-bold text-center">
                                {t('current_plan')}
                            </div>
                        ) : (
                            <button className="w-full py-3 rounded-xl border-2 border-gray-200 dark:border-slate-800 font-bold text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-700">
                                Downgrade
                            </button>
                        )}
                    </div>

                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-gray-700 dark:text-slate-300">
                            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                            <span>Access to <strong>Introduction</strong> modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-400 dark:text-slate-500">
                            <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700 flex-shrink-0"></span>
                            <span>Fundamentals modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-400 dark:text-slate-500">
                            <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700 flex-shrink-0"></span>
                            <span>Advanced Application modules</span>
                        </li>
                    </ul>
                </div>

                {/* Pro Plan - Highlighted */}
                <div className="p-8 rounded-2xl bg-gray-900 border border-gray-800 text-white relative overflow-hidden hover:transform hover:-translate-y-1 transition-all duration-300 shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 blur-3xl opacity-20 -mr-16 -mt-16"></div>
                    <div className="absolute top-0 right-0 bg-welile-purple text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                    <div className="text-4xl font-bold text-white mb-6">$100<span className="text-lg text-gray-400 font-normal">/mo</span></div>
                    <p className="text-gray-400 mb-8">Master every subject with unlimited access to everything.</p>

                    <div className="mb-8">
                        {currentPlan === 'SPONSORED' ? (
                            <div className="w-full py-3 rounded-xl bg-gray-800 text-gray-400 font-bold text-center border border-gray-700">
                                Current Plan
                            </div>
                        ) : (
                            <button
                                onClick={() => setSelectedPlanName('PRO')}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold hover:shadow-lg transition-all hover:opacity-90 cursor-pointer"
                            >
                                Upgrade to Pro
                            </button>
                        )}
                    </div>

                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-gray-300">
                            <CheckCircle size={18} className="text-purple-400 flex-shrink-0" />
                            <span>Access to <strong>Introduction</strong> modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-300">
                            <CheckCircle size={18} className="text-purple-400 flex-shrink-0" />
                            <span>Access to <strong>Fundamentals</strong> modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-300">
                            <CheckCircle size={18} className="text-purple-400 flex-shrink-0" />
                            <span>Access to <strong>All</strong> modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-300">
                            <Sparkles size={18} className="text-yellow-400 flex-shrink-0" />
                            <span>Unlimited <strong>AI Tutor</strong> Support</span>
                        </li>
                    </ul>
                </div>
            </div>
            )}

            {selectedPlanName && (
                <PaymentModal 
                    isOpen={!!selectedPlanName}
                    onClose={() => setSelectedPlanName(null)}
                    planName={selectedPlanName}
                    amount={selectedPlanName === 'PLUS' ? '$19' : '$100'}
                    userId={user?.id}
                />
            )}
        </div>
    );
};

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: 'PLUS' | 'PRO';
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
        const stored = localStorage.getItem('portal-notifications');
        const list = stored ? JSON.parse(stored) : [];
        const newItem = {
            id: 'notif-' + Date.now(),
            title,
            description,
            timestamp: new Date().toISOString(),
            read: false,
            type
        };
        localStorage.setItem('portal-notifications', JSON.stringify([newItem, ...list]));
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
            const { error } = await supabase
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
                    You are upgrading to <span className="font-bold text-welile-purple">{planName}</span> for <span className="font-bold text-gray-800 dark:text-slate-200">{amount}/mo</span>.
                </p>

                <div className="space-y-4">
                    {/* Airtel Money */}
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl">
                        <h4 className="font-bold text-red-650 dark:text-red-400 flex items-center gap-2 mb-2 text-sm">
                            <span className="text-lg">📱</span> Airtel Money
                        </h4>
                        <div className="text-xs space-y-1 text-gray-700 dark:text-slate-355">
                            <p><span className="font-semibold text-gray-900 dark:text-white">Dial:</span> <code className="bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded border dark:border-slate-700 font-mono font-bold">185*9#</code></p>
                            <p><span className="font-semibold text-gray-900 dark:text-white">Merchant ID:</span> <code className="bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded border dark:border-slate-700 font-mono font-bold">4380664</code></p>
                        </div>
                    </div>

                    {/* MTN MoMo */}
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-105 dark:border-yellow-900/50 rounded-2xl">
                        <h4 className="font-bold text-yellow-650 dark:text-yellow-400 flex items-center gap-2 mb-2 text-sm">
                            <span className="text-lg">📱</span> MTN MoMo
                        </h4>
                        <div className="text-xs space-y-1 text-gray-700 dark:text-slate-355">
                            <p><span className="font-semibold text-gray-900 dark:text-white">Instructions:</span> Use MoMo App or dial <code className="bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded border dark:border-slate-700 font-mono font-bold">165*3#</code></p>
                            <p><span className="font-semibold text-gray-900 dark:text-white">MoMo Code:</span> <code className="bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded border dark:border-slate-700 font-mono font-bold">090777</code></p>
                        </div>
                    </div>

                    {/* Bank Transfer */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl">
                        <h4 className="font-bold text-blue-650 dark:text-blue-400 flex items-center gap-2 mb-2 text-sm">
                            <span className="text-lg">🏦</span> Bank Transfer (Equity Bank)
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
