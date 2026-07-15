import React, { useState } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { UserRole } from '../../types';
import { Trash2, Check, Edit2, X, ChevronDown, Search } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';

const AdminEnrollments: React.FC = () => {
    const { users, courses, enrollments, loading, updateUserRole, deleteUser, refresh } = useAdmin(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

    const handleApproveUpgrade = async (u: any) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    role: u.pending_role,
                    pending_role: null,
                    pending_txid: null,
                    pending_screenshot: null
                })
                .eq('id', u.id);

            if (error) throw error;

            window.dispatchEvent(new Event('profile-update'));

            const notifKey = `portal-notifications-${u.email}`;
            const stored = localStorage.getItem(notifKey);
            const list = stored ? JSON.parse(stored) : [];
            
            const isSponsored = u.pending_role === 'SPONSORED';
            const recommendation = isSponsored
                ? `You're now on our Business plan sponsored by ${u.companyName || 'your company'}! Explore all modules and start learning.`
                : u.pending_role === 'PLUS'
                ? "Since you upgraded to Plus, consider checking out the PRO plan to get unlimited AI Tutor support and complete course access!"
                : "You're now on our highest Pro plan! Explore advanced modules and ask our AI Tutor anything.";

            const newItem = {
                id: 'notif-' + Date.now(),
                title: isSponsored ? "Corporate Plan Activated!" : "Payment Verified Successfully!",
                description: isSponsored
                    ? `Your corporate enrollment request has been approved. Welcome to the Business plan for ${u.companyName || 'your company'}!`
                    : `Your payment has been successfully verified by our admin team. Welcome to the ${u.pending_role} plan! We appreciate your support. ${recommendation}`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'payment'
            };
            localStorage.setItem(notifKey, JSON.stringify([newItem, ...list]));
            window.dispatchEvent(new Event('notifications-update'));

            window.dispatchEvent(new CustomEvent('payment-verified-alert', {
                detail: {
                    planName: u.pending_role,
                    recommendation
                }
            }));

            alert(`Upgrade request approved and role updated to ${u.pending_role}!`);
        } catch (err: any) {
            console.error(err);
            alert('Failed to approve upgrade.');
        }
    };

    const handleDeclineUpgrade = async (u: any) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    pending_role: null,
                    pending_txid: null,
                    pending_screenshot: null
                })
                .eq('id', u.id);

            if (error) throw error;

            window.dispatchEvent(new Event('profile-update'));

            const notifKey = `portal-notifications-${u.email}`;
            const stored = localStorage.getItem(notifKey);
            const list = stored ? JSON.parse(stored) : [];
            const isSponsored = u.pending_role === 'SPONSORED';
            const newItem = {
                id: 'notif-' + Date.now(),
                title: isSponsored ? "Corporate Plan Request Declined" : "Upgrade Request Declined",
                description: isSponsored
                    ? `Your corporate enrollment request for the Business plan was declined by admin.`
                    : `Your upgrade request for plan ${u.pending_role} was declined by admin. Please verify your payment transaction ID or screenshot receipt and try again.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'payment'
            };
            localStorage.setItem(notifKey, JSON.stringify([newItem, ...list]));
            window.dispatchEvent(new Event('notifications-update'));

            alert('Upgrade request declined.');
        } catch (err: any) {
            console.error(err);
            alert('Failed to decline upgrade.');
        }
    };

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Loading directory...</div>;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-150 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-150 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Student Directory</h2>
                    <p className="text-xs text-gray-550 dark:text-slate-400 mt-0.5">Total: {filteredUsers.length} registered</p>
                </div>
                
                {/* Student Search Engine Input */}
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={14} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-650 focus:outline-none focus:border-violet-500 transition-all shadow-sm"
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-950/60 transition-colors">
                        <tr className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-4 px-6 border-b border-gray-150 dark:border-slate-800">Name</th>
                            <th className="py-4 px-6 border-b border-gray-150 dark:border-slate-800">Email</th>
                            <th className="py-4 px-6 border-b border-gray-150 dark:border-slate-800">Subscription Plan</th>
                            <th className="py-4 px-6 border-b border-gray-150 dark:border-slate-800 text-right">Wallet Balance</th>
                            <th className="py-4 px-6 border-b border-gray-150 dark:border-slate-800 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-slate-500 text-sm font-medium">
                                    No students found matching "{searchQuery}"
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-850/30 transition-colors">
                                    <td className="py-4 px-6 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 shrink-0 flex items-center justify-center text-xs font-bold border border-violet-200 dark:border-violet-850">
                                            {u.avatar ? (
                                                <img 
                                                    src={u.avatar} 
                                                    alt={u.name} 
                                                    className="w-full h-full object-cover" 
                                                    style={{
                                                        transform: `scale(${u.avatarScale || 1}) translate(${u.avatarPositionX || 0}px, ${u.avatarPositionY || 0}px)`,
                                                        transformOrigin: 'center center'
                                                    }}
                                                />
                                            ) : (
                                                <span>{(u.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        {u.name}
                                    </td>
                                    <td className="py-4 px-6 text-gray-650 dark:text-slate-300 text-sm">{u.email}</td>
                                    <td className="py-4 px-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                                            u.role === UserRole.INDIVIDUAL ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' :
                                            u.role === UserRole.PLUS ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50' :
                                            u.role === UserRole.PRO ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-900/50' :
                                            u.role === UserRole.SPONSORED ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50' :
                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                                        }`}>
                                            {u.role === UserRole.INDIVIDUAL ? 'BASIC' : u.role}
                                        {u.role === UserRole.SPONSORED && u.companyName && (
                                            <div className="text-[10px] text-indigo-650 dark:text-indigo-400 font-semibold mt-1">
                                                Co: {u.companyName}
                                            </div>
                                        )}
                                        </span>

                                         {u.pending_role && (
                                             <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 p-2.5 rounded-xl border border-yellow-100 dark:border-yellow-900/30 flex flex-col gap-1.5 items-start max-w-[190px]">
                                                 <span className="font-bold">Pending: {u.pending_role}</span>
                                                 {u.pending_role === 'SPONSORED' && u.companyName && (
                                                     <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded">
                                                         Co: {u.companyName}
                                                     </span>
                                                 )}
                                                 <span className="text-[10px] text-gray-500 dark:text-slate-400 font-mono break-all select-all">TxID: {u.pending_txid}</span>
                                                 {u.pending_screenshot && u.pending_screenshot.startsWith('data:image') && (
                                                     <a href={u.pending_screenshot} target="_blank" rel="noreferrer" className="text-[10px] text-purple-600 hover:underline flex items-center gap-1 font-semibold">
                                                         View Receipt Image
                                                     </a>
                                                 )}
                                                 <div className="flex gap-1.5 mt-1 w-full">
                                                     <button 
                                                         onClick={() => handleApproveUpgrade(u)}
                                                         className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold cursor-pointer text-center transition-colors"
                                                     >
                                                         Verify
                                                     </button>
                                                     <button 
                                                         onClick={() => handleDeclineUpgrade(u)}
                                                         className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer text-center transition-colors"
                                                     >
                                                         Decline
                                                     </button>
                                                 </div>
                                             </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right font-semibold text-gray-900 dark:text-white">
                                        ${u.walletBalance?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActiveDropdownId(activeDropdownId === u.id ? null : u.id)}
                                                    className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-750 border border-gray-250 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                                                >
                                                    Actions <ChevronDown size={14} className="text-gray-400" />
                                                </button>

                                                {activeDropdownId === u.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                                                        <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-100 text-left">
                                                            <div className="px-3 py-1 text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                                                Change Plan
                                                            </div>
                                                            {[
                                                                { label: 'Basic', value: UserRole.INDIVIDUAL },
                                                                { label: 'Plus', value: UserRole.PLUS },
                                                                { label: 'Pro', value: UserRole.PRO },
                                                                { label: 'Sponsored', value: UserRole.SPONSORED },
                                                                { label: 'Admin', value: UserRole.ADMIN }
                                                            ].map(opt => (
                                                                <button
                                                                    key={opt.value}
                                                                    onClick={async () => {
                                                                        setActiveDropdownId(null);
                                                                        if (u.role === opt.value) return;
                                                                        try {
                                                                            await updateUserRole(u.id, opt.value);
                                                                            alert(`Subscription plan updated to ${opt.label} successfully!`);
                                                                        } catch (err) {
                                                                            alert('Failed to update subscription plan.');
                                                                        }
                                                                    }}
                                                                    className={`w-full px-4 py-2 text-xs flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors cursor-pointer ${
                                                                        u.role === opt.value ? 'text-violet-600 dark:text-violet-400 font-bold' : 'text-gray-700 dark:text-slate-300'
                                                                    }`}
                                                                >
                                                                    <span>{opt.label}</span>
                                                                    {u.role === opt.value && <Check size={12} />}
                                                                </button>
                                                            ))}

                                                            <div className="border-t border-gray-100 dark:border-slate-800 my-1"></div>

                                                            <button
                                                                onClick={async () => {
                                                                    setActiveDropdownId(null);
                                                                    
                                                                    if (u.role === UserRole.ADMIN) {
                                                                        const { data: { session } } = await supabase.auth.getSession();
                                                                        const currentAdminEmail = session?.user?.email;
                                                                        
                                                                        const password = prompt(
                                                                            `Security Authentication Required\n\nYou are attempting to delete an Administrator account (${u.name || u.email}).\nThis action is high risk and requires password verification.\n\nPlease enter YOUR Admin password to authenticate:`
                                                                        );
                                                                        
                                                                        if (!password) {
                                                                            alert("Deletion cancelled.");
                                                                            return;
                                                                        }

                                                                        const { error: authError } = await supabase.auth.signInWithPassword({
                                                                            email: currentAdminEmail || '',
                                                                            password: password
                                                                        });

                                                                        if (authError) {
                                                                            alert("Authentication failed! Incorrect password. Deletion aborted.");
                                                                            return;
                                                                        }
                                                                    } else {
                                                                        if (!confirm(`Are you sure you want to delete student ${u.name || u.email}? This action is irreversible.`)) {
                                                                            return;
                                                                        }
                                                                    }

                                                                    try {
                                                                        await deleteUser(u.id);
                                                                        alert('User deleted successfully!');
                                                                        
                                                                        const { data: { session } } = await supabase.auth.getSession();
                                                                        if (session?.user?.id === u.id) {
                                                                            await supabase.auth.signOut();
                                                                            window.location.href = '/';
                                                                        }
                                                                    } catch (err: any) {
                                                                        alert('Failed to delete user.');
                                                                    }
                                                                }}
                                                                className="w-full px-4 py-2 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
                                                            >
                                                                <Trash2 size={12} /> Delete Student
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminEnrollments;
