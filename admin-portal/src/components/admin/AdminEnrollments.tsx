import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { UserRole } from '../../types';
import { Trash2, Check, Edit2, X, ChevronDown, Search, Copy, Eye } from 'lucide-react';
import { mysqlClient } from '../../lib/mysqlClient';
import { formatAmount, getCurrencyPreference, CurrencyType } from '../../lib/currency';

const AdminEnrollments: React.FC = () => {
    const { users, courses, enrollments, loading, updateUserRole, deleteUser, updateUserWallet, refresh } = useAdmin(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const [planFilter, setPlanFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const [currency, setCurrency] = useState<CurrencyType>(getCurrencyPreference);

    useEffect(() => {
        const handleCurrencyChange = () => {
            setCurrency(getCurrencyPreference());
        };
        window.addEventListener('currency-change', handleCurrencyChange);
        return () => {
            window.removeEventListener('currency-change', handleCurrencyChange);
        };
    }, []);
    
    // Instructor settings modal states
    const [selectedUpgradeUser, setSelectedUpgradeUser] = useState<any | null>(null);
    const [instPassword, setInstPassword] = useState('instructor');
    const [instBio, setInstBio] = useState('');
    const [selectedDetailUser, setSelectedDetailUser] = useState<any | null>(null);

    const handleApproveUpgrade = async (u: any) => {
        try {
            const { error } = await mysqlClient
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
            const { error } = await mysqlClient
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

    const filteredUsers = users
        .filter(u => 
            (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(u => {
            if (planFilter === 'ALL') return true;
            return u.role === planFilter;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') {
                comparison = (a.name || '').localeCompare(b.name || '');
            } else if (sortBy === 'email') {
                comparison = (a.email || '').localeCompare(b.email || '');
            } else if (sortBy === 'role') {
                const roleA = a.role === UserRole.INDIVIDUAL ? 'BASIC' : (a.role === UserRole.ADMIN ? 'INSTRUCTOR' : a.role);
                const roleB = b.role === UserRole.INDIVIDUAL ? 'BASIC' : (b.role === UserRole.ADMIN ? 'INSTRUCTOR' : b.role);
                comparison = roleA.localeCompare(roleB);
            } else if (sortBy === 'wallet_balance') {
                comparison = (Number(a.wallet_balance) || 0) - (Number(b.wallet_balance) || 0);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    if (loading) return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Loading directory...</div>;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-150 dark:border-slate-800 overflow-hidden transition-colors">
            <style>{`
                .student-row {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .student-row td {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .student-row:hover td {
                    transform: translateY(-2px);
                    color: #1e1b4b;
                }
                .dark .student-row:hover td {
                    color: #ffffff;
                }
                .student-row .avatar-container {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .student-row:hover .avatar-container {
                    transform: scale(1.15) rotate(5deg);
                    border-color: #7c3aed;
                    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
                }
            `}</style>
            <div className="p-6 border-b border-gray-150 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Student Directory</h2>
                    <p className="text-xs text-gray-555 dark:text-slate-400 mt-0.5">Total: {filteredUsers.length} registered</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Plan Filter */}
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 px-3 py-2 rounded-xl text-[11px] font-medium text-gray-600 dark:text-slate-350">
                        <span className="text-gray-400 dark:text-slate-500">Plan:</span>
                        <select 
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value)}
                            className="bg-transparent border-none text-gray-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-0 cursor-pointer dark:bg-slate-950"
                        >
                            <option value="ALL">All Plans</option>
                            <option value="INDIVIDUAL">Basic</option>
                            <option value="PLUS">Plus</option>
                            <option value="PRO">Pro</option>
                            <option value="SPONSORED">Sponsored</option>
                            <option value="ADMIN">Instructor</option>
                        </select>
                    </div>

                    {/* Sort By Selector */}
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 px-3 py-2 rounded-xl text-[11px] font-medium text-gray-600 dark:text-slate-350">
                        <span className="text-gray-400 dark:text-slate-500">Sort By:</span>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent border-none text-gray-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-0 cursor-pointer dark:bg-slate-950 mr-0.5"
                        >
                            <option value="name">Name</option>
                            <option value="email">Email</option>
                            <option value="role">Subscription Plan</option>
                            <option value="wallet_balance">Wallet Balance</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors ml-1 font-bold text-xs"
                            title="Toggle Sort Order"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
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
            </div>
            
            <div className={`overflow-x-auto transition-all duration-150 ${activeDropdownId ? 'pb-44' : 'pb-4'}`}>
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
                                <tr key={u.id} className="student-row hover:bg-gray-50/50 dark:hover:bg-slate-850/30 transition-colors">
                                    <td className="py-4 px-6 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        <div className="avatar-container w-8 h-8 rounded-full overflow-hidden bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 shrink-0 flex items-center justify-center text-xs font-bold border border-violet-200 dark:border-violet-850">
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
                                            {u.role === UserRole.INDIVIDUAL ? 'BASIC' : (u.role === UserRole.ADMIN ? 'INSTRUCTOR' : u.role)}
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
                                         {formatAmount(u.walletBalance || 0)}
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
                                                            <button
                                                                onClick={async () => {
                                                                    setActiveDropdownId(null);
                                                                    let bio = '';
                                                                    let password = u.password || 'student123';
                                                                    if (u.role === UserRole.ADMIN) {
                                                                        try {
                                                                            const { data } = await mysqlClient
                                                                                .from('instructors')
                                                                                .select('*')
                                                                                .eq('email', u.email.trim().toLowerCase());
                                                                            if (data && data.length > 0) {
                                                                                bio = data[0].bio || '';
                                                                                password = data[0].password || password;
                                                                            }
                                                                        } catch (e) {
                                                                            console.error('Error fetching instructor details:', e);
                                                                        }
                                                                    }
                                                                    setSelectedDetailUser({
                                                                        ...u,
                                                                        bio,
                                                                        password
                                                                    });
                                                                }}
                                                                className="w-full px-4 py-2 text-xs text-violet-650 dark:text-violet-400 hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors flex items-center gap-2 cursor-pointer font-bold border-b border-gray-150 dark:border-slate-800/60"
                                                             >
                                                                <Eye size={12} /> View Full Details
                                                             </button>
                                                             <div className="px-3 py-1 mt-1 text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                                                Change Plan
                                                            </div>
                                                            {[
                                                                { label: 'Basic', value: UserRole.INDIVIDUAL },
                                                                { label: 'Pro', value: UserRole.PRO },
                                                                { label: 'Instructor', value: UserRole.ADMIN }
                                                            ].map(opt => (
                                                                <button
                                                                    key={opt.value}
                                                                    onClick={async () => {
                                                                        setActiveDropdownId(null);
                                                                        if (opt.value === UserRole.ADMIN) {
                                                                            setInstPassword('instructor');
                                                                            setInstBio('');
                                                                            try {
                                                                                const { data: existing } = await mysqlClient
                                                                                    .from('instructors')
                                                                                    .select('*')
                                                                                    .eq('email', u.email.trim().toLowerCase());
                                                                                if (existing && existing.length > 0) {
                                                                                    setInstPassword(existing[0].password || 'instructor');
                                                                                    setInstBio(existing[0].bio || '');
                                                                                }
                                                                            } catch (e) {
                                                                                console.error('Error fetching instructor settings:', e);
                                                                            }
                                                                            setSelectedUpgradeUser(u);
                                                                            return;
                                                                        }
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
                                                                    const currentVal = u.walletBalance !== undefined ? u.walletBalance : 100;
                                                                    const amountStr = prompt(
                                                                        `Allocate Wallet Balance\n\nEnter the new wallet balance (in shillings/USD) for ${u.name || u.email}:`,
                                                                        currentVal.toString()
                                                                    );
                                                                    
                                                                    if (amountStr === null) return; // User clicked Cancel
                                                                    
                                                                    const parsed = parseFloat(amountStr);
                                                                    if (isNaN(parsed) || parsed < 0) {
                                                                        alert("Please enter a valid non-negative number.");
                                                                        return;
                                                                    }

                                                                    try {
                                                                        await updateUserWallet(u.id, parsed);
                                                                        alert(`Wallet balance successfully updated to $${parsed.toFixed(2)} for ${u.name}!`);
                                                                    } catch (err) {
                                                                        alert("Failed to update wallet balance.");
                                                                    }
                                                                }}
                                                                className="w-full px-4 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
                                                            >
                                                                Allocate Balance
                                                            </button>

                                                            <div className="border-t border-gray-100 dark:border-slate-800 my-1"></div>

                                                            <button
                                                                onClick={async () => {
                                                                    setActiveDropdownId(null);
                                                                    
                                                                    if (u.role === UserRole.ADMIN) {
                                                                        const currentAdminEmail = localStorage.getItem('admin-email') || 'admin@welile.com';
                                                                        
                                                                        const password = prompt(
                                                                            `Security Authentication Required\n\nYou are attempting to delete an Administrator account (${u.name || u.email}).\nThis action is high risk and requires password verification.\n\nPlease enter YOUR Admin password to authenticate:`
                                                                        );
                                                                        
                                                                        if (!password) {
                                                                            alert("Deletion cancelled.");
                                                                            return;
                                                                        }
                                                                        
                                                                        if (password !== 'adminpassword' && password !== 'admin') {
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
                                                                        
                                                                        const { data: { session } } = await mysqlClient.auth.getSession();
                                                                        if (session?.user?.id === u.id) {
                                                                            await mysqlClient.auth.signOut();
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
            {selectedUpgradeUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedUpgradeUser(null)} />
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setSelectedUpgradeUser(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-center mb-6 border-b border-gray-100 dark:border-slate-800 pb-3 text-gray-900 dark:text-white">
                            Configure Instructor Settings
                        </h3>

                        <div className="space-y-4 text-left">
                            <div>
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Instructor Name</span>
                                <p className="font-bold text-sm text-gray-800 dark:text-slate-205">{selectedUpgradeUser.name}</p>
                            </div>

                            <div>
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</span>
                                <p className="font-bold text-sm text-gray-800 dark:text-slate-205">{selectedUpgradeUser.email}</p>
                            </div>

                            <div className="border-t border-gray-100 dark:border-slate-800/80 my-4"></div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">Console Password</label>
                                <input
                                    type="text"
                                    required
                                    value={instPassword}
                                    onChange={(e) => setInstPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-605 dark:text-slate-400 uppercase tracking-wider mb-2">Biography</label>
                                <textarea
                                    value={instBio}
                                    onChange={(e) => setInstBio(e.target.value)}
                                    placeholder="Brief background or bio (optional)..."
                                    rows={2}
                                    className="w-full bg-gray-50 dark:bg-slate-955 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 resize-none"
                                />
                            </div>



                            <button
                                onClick={async () => {
                                    if (!instPassword) {
                                        alert("Please enter a password.");
                                        return;
                                    }
                                    try {
                                        // 1. Check if instructor already exists in database
                                        const { data: existing } = await mysqlClient
                                            .from('instructors')
                                            .select('id')
                                            .eq('email', selectedUpgradeUser.email.trim().toLowerCase());

                                        if (existing && existing.length > 0) {
                                            // Update
                                            const { error: updErr } = await mysqlClient
                                                .from('instructors')
                                                .update({
                                                    name: selectedUpgradeUser.name,
                                                    bio: instBio,
                                                    password: instPassword
                                                })
                                                .eq('email', selectedUpgradeUser.email.trim().toLowerCase());
                                            if (updErr) throw updErr;
                                        } else {
                                            // Insert
                                            const { error: insErr } = await mysqlClient
                                                .from('instructors')
                                                .insert({
                                                    id: 'inst-' + Math.random().toString(36).substr(2, 9),
                                                    name: selectedUpgradeUser.name,
                                                    email: selectedUpgradeUser.email.trim().toLowerCase(),
                                                    bio: instBio,
                                                    avatar: selectedUpgradeUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
                                                    courses_count: 0,
                                                    password: instPassword
                                                });
                                            if (insErr) throw insErr;
                                        }

                                        // 2. Update user profile role in profiles table to ADMIN
                                        await updateUserRole(selectedUpgradeUser.id, UserRole.ADMIN);
                                        
                                        alert(`Instructor setup initialized successfully for ${selectedUpgradeUser.name}!`);
                                        setSelectedUpgradeUser(null);
                                    } catch (err) {
                                        console.error('Error saving instructor setup:', err);
                                        alert('Failed to initialize instructor setup details.');
                                    }
                                }}
                                className="w-full py-3 mt-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-900/20"
                            >
                                Save & Initialize Instructor
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* View Student Details Modal */}
            {selectedDetailUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-left">
                    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Profile Details</h3>
                            <button 
                                onClick={() => setSelectedDetailUser(null)} 
                                className="p-1.5 text-gray-400 hover:text-gray-650 dark:hover:text-slate-350 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-850 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-violet-100 dark:bg-violet-950 text-violet-750 dark:text-violet-300 flex items-center justify-center text-xl font-bold border border-violet-200 dark:border-violet-850">
                                    {selectedDetailUser.avatar ? (
                                        <img src={selectedDetailUser.avatar} alt={selectedDetailUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{(selectedDetailUser.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-gray-900 dark:text-white">{selectedDetailUser.name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{selectedDetailUser.email}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-extrabold mb-1">User ID</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white font-mono break-all">{selectedDetailUser.id}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-extrabold mb-1">Subscription Plan</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white uppercase">{selectedDetailUser.role === 'ADMIN' ? 'INSTRUCTOR' : selectedDetailUser.role || 'BASIC'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-extrabold mb-1">Wallet Balance</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white">{formatAmount(selectedDetailUser.walletBalance || 0)}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-extrabold mb-1">Stored Password</p>
                                    <p className="text-sm font-bold text-indigo-650 dark:text-indigo-400 font-mono break-all select-all">{selectedDetailUser.password || 'student123'}</p>
                                </div>
                            </div>
                            
                            {selectedDetailUser.role === 'ADMIN' && (
                                <div className="p-4 bg-violet-50/50 dark:bg-violet-950/10 border border-violet-100 dark:border-violet-900/30 rounded-2xl space-y-2">
                                    <p className="text-[10px] text-violet-650 dark:text-violet-400 uppercase font-extrabold">Instructor Metadata</p>
                                    <div className="text-xs text-slate-700 dark:text-slate-300">
                                        <p><span className="font-bold">Bio:</span> {selectedDetailUser.bio || 'No bio provided.'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedDetailUser(null)}
                                className="px-5 py-2.5 bg-gray-900 dark:bg-slate-100 text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-800 cursor-pointer shadow-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEnrollments;
