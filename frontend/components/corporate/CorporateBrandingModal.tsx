import React, { useState } from 'react';
import { X, Building2, Upload, Globe, Mail, Phone, User, Check, Loader2, Image as ImageIcon } from 'lucide-react';

interface CorporateBrandingModalProps {
    isOpen: boolean;
    onClose: () => void;
    organization: any;
    onSaved: (updatedOrg: any) => void;
    userId?: string;
}

export const CorporateBrandingModal: React.FC<CorporateBrandingModalProps> = ({
    isOpen,
    onClose,
    organization,
    onSaved,
    userId
}) => {
    const [name, setName] = useState(organization?.name || '');
    const [logoUrl, setLogoUrl] = useState(organization?.logoUrl || '');
    const [contactName, setContactName] = useState(organization?.contactName || '');
    const [contactEmail, setContactEmail] = useState(organization?.contactEmail || '');
    const [contactPhone, setContactPhone] = useState(organization?.contactPhone || '');
    const [website, setWebsite] = useState(organization?.website || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!name.trim()) {
            setError('Please enter your Company / Organization name.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/corporate/branding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId || organization?.ownerUserId,
                    name: name.trim(),
                    logoUrl: logoUrl.trim(),
                    contactName: contactName.trim(),
                    contactEmail: contactEmail.trim(),
                    contactPhone: contactPhone.trim(),
                    website: website.trim()
                })
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to update branding details.');
            }

            setSuccessMessage('Corporate branding updated successfully!');
            onSaved(result.data);
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (err: any) {
            setError(err.message || 'Error updating branding');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Corporate Branding & Profile</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Setup your organization name, logo, and primary contact</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 text-xs rounded-xl font-medium">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 text-xs rounded-xl font-medium flex items-center gap-2">
                            <Check size={14} />
                            {successMessage}
                        </div>
                    )}

                    {/* Logo Preview and URL */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                            Company Logo
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt="Logo Preview"
                                        className="w-full h-full object-contain p-1"
                                        onError={(e) => {
                                            (e.target as any).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <ImageIcon size={24} className="text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Enter image URL (e.g. https://.../logo.png)"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLogoUrl('https://images.unsplash.com/photo-1542744094-3a31f272c490?w=120&auto=format&fit=crop&q=80')}
                                        className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                    >
                                        Use Sample Logo
                                    </button>
                                    <span className="text-gray-300 dark:text-slate-600">•</span>
                                    <button
                                        type="button"
                                        onClick={() => setLogoUrl('')}
                                        className="text-[11px] text-gray-400 hover:underline cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                            Company / Organization Name *
                        </label>
                        <div className="relative">
                            <Building2 size={16} className="absolute left-3.5 top-3 text-gray-400" />
                            <input
                                type="text"
                                required
                                placeholder="Acme Technologies Ltd"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                            />
                        </div>
                    </div>

                    {/* Primary Contact Person */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                Primary Contact Name
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Sarah Jenkins"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                Official Contact Email
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="contact@company.com"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Phone & Website */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                Contact Phone
                            </label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="+256 700 000 000"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                Company Website
                            </label>
                            <div className="relative">
                                <Globe size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="https://company.com"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-violet-500/20 cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    Save Branding
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
