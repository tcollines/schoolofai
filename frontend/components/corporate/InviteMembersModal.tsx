import React, { useState } from 'react';
import { X, UserPlus, Mail, Users, Building, Check, AlertCircle, Loader2 } from 'lucide-react';

interface InviteMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    availableSeats: number;
    onInvited: () => void;
    user?: any;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
    isOpen,
    onClose,
    orgId,
    availableSeats,
    onInvited,
    user
}) => {
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('Engineering');
    const [bulkEmails, setBulkEmails] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const parseBulkEmails = (text: string) => {
        return text
            .split(/[\n,;]+/)
            .map(e => e.trim().toLowerCase())
            .filter(e => e.includes('@') && e.includes('.'));
    };

    const handleSendInvites = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        let invitesList: Array<{ email: string; name?: string; department?: string }> = [];

        if (mode === 'single') {
            const cleanEmail = email.trim().toLowerCase();
            if (!cleanEmail || !cleanEmail.includes('@')) {
                setError('Please provide a valid email address.');
                return;
            }
            invitesList = [{
                email: cleanEmail,
                name: name.trim() || undefined,
                department: department.trim() || 'General'
            }];
        } else {
            const emails = parseBulkEmails(bulkEmails);
            if (emails.length === 0) {
                setError('Please paste at least one valid email address.');
                return;
            }
            invitesList = emails.map(em => ({
                email: em,
                department: department.trim() || 'General'
            }));
        }

        if (invitesList.length > availableSeats) {
            setError(`Cannot send ${invitesList.length} invites. You have ${availableSeats} seat(s) available.`);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/corporate/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgId,
                    invites: invitesList,
                    user
                })
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to send invites.');
            }

            setSuccessMessage(`Successfully sent ${result.invitedCount} invite(s)!`);
            onInvited();
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (err: any) {
            setError(err.message || 'Error sending invitations');
        } finally {
            setLoading(false);
        }
    };

    const bulkCount = parseBulkEmails(bulkEmails).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Invite Team Members</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Allocate seats and send invitations to employee emails
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Available Seats Pill */}
                <div className="px-6 pt-4 pb-2">
                    <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-200 dark:border-violet-900/60 text-xs">
                        <span className="font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Users size={14} className="text-violet-500" /> Available Plan Seats:
                        </span>
                        <span className="font-extrabold text-violet-700 dark:text-violet-300 text-sm">
                            {availableSeats} Remaining
                        </span>
                    </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="px-6 pt-2">
                    <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300">
                        <button
                            type="button"
                            onClick={() => setMode('single')}
                            className={`py-2 rounded-lg transition-all ${mode === 'single' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'hover:text-gray-900'}`}
                        >
                            Single Invite
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('bulk')}
                            className={`py-2 rounded-lg transition-all ${mode === 'bulk' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'hover:text-gray-900'}`}
                        >
                            Bulk Invite (Batch)
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSendInvites} className="p-6 space-y-4 flex-1 overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 text-xs rounded-xl font-medium flex items-center gap-2">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 text-xs rounded-xl font-medium flex items-center gap-2">
                            <Check size={14} />
                            {successMessage}
                        </div>
                    )}

                    {mode === 'single' ? (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Employee Full Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Work Email Address *
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="john.doe@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                                    Paste Work Emails (one per line or comma-separated) *
                                </label>
                                <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
                                    {bulkCount} detected
                                </span>
                            </div>
                            <textarea
                                rows={5}
                                required
                                placeholder="alice@company.com, bob@company.com&#10;charlie@company.com"
                                value={bulkEmails}
                                onChange={(e) => setBulkEmails(e.target.value)}
                                className="w-full p-3 text-xs font-mono rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    )}

                    {/* Department Tag */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                            Department / Team
                        </label>
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="Engineering">Software Engineering</option>
                            <option value="Data Science">Data & AI Team</option>
                            <option value="Product Management">Product & Design</option>
                            <option value="Operations">Operations & HR</option>
                            <option value="Finance">Finance & Legal</option>
                            <option value="Marketing">Marketing & Growth</option>
                            <option value="General">General / All Staff</option>
                        </select>
                    </div>

                    {/* Footer */}
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
                            disabled={loading || availableSeats <= 0}
                            className="px-6 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-violet-500/20 cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Sending Invites...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={14} />
                                    Send {mode === 'bulk' && bulkCount > 0 ? `${bulkCount} Invites` : 'Invite'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
