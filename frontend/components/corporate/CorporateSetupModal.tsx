import React, { useState } from 'react';
import { X, Building2, Users, Minus, Plus, ArrowRight, ShieldCheck, Mail, Phone, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { formatAmount, getExchangeRate } from '../../src/lib/currency';

interface CorporateSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceedToCheckout: (seats: number, companyDetails: { name: string; email: string; phone: string }) => void;
    onOpenDashboard: () => void;
    user?: any;
}

export const CorporateSetupModal: React.FC<CorporateSetupModalProps> = ({
    isOpen,
    onClose,
    onProceedToCheckout,
    onOpenDashboard,
    user
}) => {
    const [seats, setSeats] = useState(10);
    const [companyName, setCompanyName] = useState(user?.companyName || user?.company_name || '');
    const [contactEmail, setContactEmail] = useState(user?.email || '');
    const [contactPhone, setContactPhone] = useState(user?.phone || '');

    if (!isOpen) return null;

    const unitPrice = seats >= 50 ? 15 : 20;
    const totalUsd = seats * unitPrice;
    const isDiscounted = seats >= 50;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onProceedToCheckout(seats, {
            name: companyName.trim() || 'Corporate Partner',
            email: contactEmail.trim(),
            phone: contactPhone.trim()
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                            <Building2 size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight">Corporate Plan Setup</h3>
                            <p className="text-xs text-violet-100">Configure team seats, organization details & billing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Seat Calculator */}
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Users size={16} className="text-violet-600" />
                                Select Team Seats (Min 10):
                            </label>
                            <span className="text-violet-600 dark:text-violet-400 text-base font-black">
                                {seats} Seats
                            </span>
                        </div>

                        {/* Slider and - / + */}
                        <div className="flex items-center gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => setSeats(prev => Math.max(10, prev - 5))}
                                disabled={seats <= 10}
                                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 text-gray-700 dark:text-white border border-gray-200 dark:border-slate-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-sm"
                            >
                                <Minus size={15} />
                            </button>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                step="5"
                                value={seats}
                                onChange={(e) => setSeats(Number(e.target.value))}
                                className="flex-1 accent-violet-600 cursor-pointer h-2 bg-gray-200 dark:bg-slate-700 rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={() => setSeats(prev => prev + 5)}
                                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 text-gray-700 dark:text-white border border-gray-200 dark:border-slate-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer shadow-sm"
                            >
                                <Plus size={15} />
                            </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {[10, 25, 50, 100].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSeats(s)}
                                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                        seats === s
                                            ? 'bg-violet-600 text-white shadow-md'
                                            : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
                                    }`}
                                >
                                    {s} Seats {s >= 50 && '⭐'}
                                </button>
                            ))}
                        </div>

                        {/* Price summary callout */}
                        <div className="pt-3 border-t border-gray-200/80 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-gray-500 dark:text-slate-400">Rate: </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">${unitPrice}/seat</span>
                                {isDiscounted ? (
                                    <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                        25% Volume Discount
                                    </span>
                                ) : (
                                    <span className="ml-2 text-[10px] text-gray-400">
                                        (50+ seats: $15/seat)
                                    </span>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-gray-900 dark:text-white">
                                    {formatAmount(totalUsd)}
                                </div>
                                <div className="text-[11px] text-gray-400">
                                    ${totalUsd} USD total
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Organization Details */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                            Organization Details
                        </h4>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                Company / Organization Name *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Acme Technologies Ltd"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Contact Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="admin@company.com"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="+256 700 000 000"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                        <button
                            type="submit"
                            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                            <span>Proceed to Payment ({formatAmount(totalUsd)})</span>
                            <ArrowRight size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onOpenDashboard();
                            }}
                            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-violet-700 dark:text-violet-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Building2 size={14} />
                            <span>Or Open Existing Corporate Dashboard</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CorporateSetupModal;
