import React from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { UserRole } from '../../types';
import { Trash2 } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';

const AdminEnrollments: React.FC = () => {
    const { users, loading, updateUserRole, deleteUser } = useAdmin(true);

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

            const stored = localStorage.getItem('portal-notifications');
            const list = stored ? JSON.parse(stored) : [];
            
            const recommendation = u.pending_role === 'PLUS'
                ? "Since you upgraded to Plus, consider checking out the PRO plan to get unlimited AI Tutor support and complete course access!"
                : "You're now on our highest Pro plan! Explore advanced modules and ask our AI Tutor anything.";

            const newItem = {
                id: 'notif-' + Date.now(),
                title: "Payment Verified Successfully!",
                description: `Your payment has been successfully verified by our admin team. Welcome to the ${u.pending_role} plan! We appreciate your support. ${recommendation}`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'payment'
            };
            localStorage.setItem('portal-notifications', JSON.stringify([newItem, ...list]));
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

            const stored = localStorage.getItem('portal-notifications');
            const list = stored ? JSON.parse(stored) : [];
            const newItem = {
                id: 'notif-' + Date.now(),
                title: "Upgrade Request Declined",
                description: `Your upgrade request for plan ${u.pending_role} was declined by admin. Please verify your payment transaction ID or screenshot receipt and try again.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'payment'
            };
            localStorage.setItem('portal-notifications', JSON.stringify([newItem, ...list]));
            window.dispatchEvent(new Event('notifications-update'));

            alert('Upgrade request declined.');
        } catch (err: any) {
            console.error(err);
            alert('Failed to decline upgrade.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading directory...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Student Directory</h2>
                <div className="text-sm text-gray-500">Total: {users.length} registered</div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-4 px-6 border-b border-gray-200">Name</th>
                            <th className="py-4 px-6 border-b border-gray-200">Email</th>
                            <th className="py-4 px-6 border-b border-gray-200">Subscription Plan</th>
                            <th className="py-4 px-6 border-b border-gray-200 text-right">Wallet Balance</th>
                            <th className="py-4 px-6 border-b border-gray-200 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                        <img 
                                            src={u.avatar} 
                                            alt={u.name} 
                                            className="w-full h-full object-cover" 
                                            style={{
                                                transform: `scale(${u.avatarScale || 1}) translate(${u.avatarPositionX || 0}px, ${u.avatarPositionY || 0}px)`,
                                                transformOrigin: 'center center'
                                            }}
                                        />
                                    </div>
                                    {u.name}
                                </td>
                                <td className="py-4 px-6 text-gray-500 text-sm">{u.email}</td>
                                <td className="py-4 px-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                                        u.role === UserRole.INDIVIDUAL ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' :
                                        u.role === UserRole.PLUS ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50' :
                                        u.role === UserRole.PRO ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-900/50' :
                                        u.role === UserRole.SPONSORED ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50' :
                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                                    }`}>
                                        {u.role === UserRole.INDIVIDUAL ? 'BASIC' : u.role}
                                    </span>

                                    {u.pending_role && (
                                         <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-450 p-2.5 rounded-xl border border-yellow-100 dark:border-yellow-900/30 flex flex-col gap-1.5 items-start max-w-[190px]">
                                             <span className="font-bold">Pending: {u.pending_role}</span>
                                             <span className="text-[10px] text-gray-550 dark:text-slate-400 font-mono break-all select-all">TxID: {u.pending_txid}</span>
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
                                <td className="py-4 px-6 text-right font-medium text-gray-700">
                                    ${u.walletBalance?.toFixed(2) || '0.00'}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex items-center justify-center gap-3">
                                        <select
                                            value={u.role}
                                            onChange={async (e) => {
                                                try {
                                                    await updateUserRole(u.id, e.target.value as UserRole);
                                                    alert('Subscription plan updated successfully!');
                                                } catch (err: any) {
                                                    alert('Failed to update subscription plan.');
                                                }
                                            }}
                                            className="text-xs bg-gray-55 border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-750 cursor-pointer"
                                        >
                                            <option value={UserRole.INDIVIDUAL}>BASIC</option>
                                            <option value={UserRole.PRO}>PRO</option>
                                            <option value={UserRole.ADMIN}>ADMIN</option>
                                        </select>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Are you sure you want to delete user ${u.name || u.email}? This action is irreversible.`)) {
                                                    try {
                                                        await deleteUser(u.id);
                                                        alert('User deleted successfully!');
                                                    } catch (err: any) {
                                                        alert('Failed to delete user.');
                                                    }
                                                }
                                            }}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminEnrollments;
