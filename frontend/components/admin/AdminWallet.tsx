import React, { useState, useEffect } from 'react';
import { 
    Wallet, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, 
    Search, Filter, CheckCircle2, Clock, AlertTriangle, 
    Smartphone, CreditCard, Landmark, ShieldAlert, Sparkles,
    FileText, X, Check, Download, TrendingUp
} from 'lucide-react';
import { formatAmount } from '../../src/lib/currency';

interface Transaction {
    uuid: string;
    reference: string;
    type?: 'deposit' | 'withdrawal' | 'debit';
    plan?: string;
    amount: number;
    usdAmount?: number;
    currency: string;
    method?: string;
    phoneNumber?: string;
    userEmail?: string;
    userName?: string;
    sender?: string;
    recipient?: string;
    description?: string;
    category?: string;
    status: string;
    isSandbox?: boolean;
    isManual?: boolean;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface LedgerSummary {
    netBalanceUGX: number;
    totalDepositsUGX: number;
    totalWithdrawalsUGX: number;
    pendingDepositsUGX: number;
    pendingWithdrawalsUGX: number;
    totalCount: number;
    depositCount: number;
    withdrawalCount: number;
}

export const AdminWallet: React.FC = () => {
    const [summary, setSummary] = useState<LedgerSummary>({
        netBalanceUGX: 0,
        totalDepositsUGX: 0,
        totalWithdrawalsUGX: 0,
        pendingDepositsUGX: 0,
        pendingWithdrawalsUGX: 0,
        totalCount: 0,
        depositCount: 0,
        withdrawalCount: 0
    });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [sandboxMode, setSandboxMode] = useState(false);
    const [togglingMode, setTogglingMode] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
    const [modeFilter, setModeFilter] = useState<'all' | 'sandbox' | 'live'>('all');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalType, setAddModalType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    // Form inputs for new transaction
    const [formAmount, setFormAmount] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formMethod, setFormMethod] = useState('mobile_money');
    const [formCategory, setFormCategory] = useState('Subscription');
    const [formParty, setFormParty] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [submittingTx, setSubmittingTx] = useState(false);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/wallet/ledger');
            if (res.ok) {
                const data = await res.json();
                if (data.summary) setSummary(data.summary);
                if (data.transactions) setTransactions(data.transactions);
                if (data.sandboxMode !== undefined) setSandboxMode(data.sandboxMode);
            }
        } catch (err) {
            console.error('Error fetching ledger:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, []);

    const handleToggleSandbox = async () => {
        try {
            setTogglingMode(true);
            const nextMode = !sandboxMode;
            const res = await fetch('/api/admin/wallet/mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sandboxMode: nextMode })
            });
            if (res.ok) {
                const data = await res.json();
                setSandboxMode(data.sandboxMode);
                await fetchLedger();
            }
        } catch (e) {
            console.error('Error toggling sandbox mode:', e);
        } finally {
            setTogglingMode(false);
        }
    };

    const handleCreateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formAmount || isNaN(Number(formAmount))) {
            alert('Please enter a valid numeric amount.');
            return;
        }

        setSubmittingTx(true);
        try {
            const numAmount = Number(formAmount);
            const payload = {
                type: addModalType,
                amount: numAmount,
                description: formDescription,
                method: formMethod,
                category: formCategory,
                sender: addModalType === 'deposit' ? formParty : 'School Wallet',
                recipient: addModalType === 'withdrawal' ? formParty : 'School Wallet',
                notes: formNotes
            };

            const res = await fetch('/api/admin/wallet/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsAddModalOpen(false);
                setFormAmount('');
                setFormDescription('');
                setFormParty('');
                setFormNotes('');
                await fetchLedger();
            } else {
                alert('Failed to record transaction.');
            }
        } catch (err) {
            console.error('Transaction creation error:', err);
            alert('Error recording transaction.');
        } finally {
            setSubmittingTx(false);
        }
    };

    const filteredTransactions = transactions.filter((tx) => {
        const isDebit = tx.type === 'withdrawal' || tx.type === 'debit';
        const txType = isDebit ? 'withdrawal' : 'deposit';

        if (typeFilter !== 'all' && txType !== typeFilter) return false;

        const isSuccess = ['completed', 'successful', 'sandbox'].includes(tx.status?.toLowerCase());
        const isPending = ['processing', 'pending'].includes(tx.status?.toLowerCase());
        const isFailed = ['failed', 'cancelled', 'rejected'].includes(tx.status?.toLowerCase());

        if (statusFilter === 'completed' && !isSuccess) return false;
        if (statusFilter === 'processing' && !isPending) return false;
        if (statusFilter === 'failed' && !isFailed) return false;

        if (modeFilter === 'sandbox' && !tx.isSandbox) return false;
        if (modeFilter === 'live' && tx.isSandbox) return false;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchRef = (tx.reference || tx.uuid || '').toLowerCase().includes(query);
            const matchEmail = (tx.userEmail || '').toLowerCase().includes(query);
            const matchName = (tx.userName || tx.sender || tx.recipient || '').toLowerCase().includes(query);
            const matchDesc = (tx.description || '').toLowerCase().includes(query);
            const matchPhone = (tx.phoneNumber || '').includes(query);
            if (!matchRef && !matchEmail && !matchName && !matchDesc && !matchPhone) return false;
        }

        return true;
    });

    const exportToCSV = () => {
        const headers = ['Date', 'Reference', 'Type', 'Description', 'Amount (UGX)', 'Method', 'Party', 'Status', 'Environment'];
        const rows = filteredTransactions.map(tx => [
            tx.createdAt || '',
            tx.reference || tx.uuid,
            tx.type === 'withdrawal' ? 'Withdrawal' : 'Deposit',
            `"${(tx.description || '').replace(/"/g, '""')}"`,
            tx.amount,
            tx.method || '',
            `"${(tx.userName || tx.userEmail || tx.recipient || tx.sender || '').replace(/"/g, '""')}"`,
            tx.status,
            tx.isSandbox ? 'Sandbox' : 'Live'
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `welile-wallet-ledger-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-violet-600" />
                        Wallet & Ledger
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Track platform collections, student subscription revenue, disbursements, and testing modes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sandbox Toggle */}
                    <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm">
                        <span className="text-xs font-bold px-2 text-gray-600 dark:text-slate-400">
                            Mode:
                        </span>
                        <button
                            onClick={handleToggleSandbox}
                            disabled={togglingMode}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                sandboxMode 
                                    ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-300' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-400/40'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${sandboxMode ? 'bg-amber-900 animate-ping' : 'bg-white'}`}></span>
                            {sandboxMode ? 'SANDBOX (TEST)' : 'LIVE PRODUCTION'}
                        </button>
                    </div>

                    <button
                        onClick={fetchLedger}
                        className="p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                        title="Refresh Ledger"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Sandbox Mode Alert Banner */}
            {sandboxMode && (
                <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-transparent border border-amber-300 dark:border-amber-800/60 rounded-3xl flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-900 dark:text-amber-300">
                                Sandbox Mode is Currently Active
                            </h4>
                            <p className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                                API collections will run in simulated mode without charging real mobile money or bank accounts. Test collections will complete automatically.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleSandbox}
                        className="px-3 py-1.5 text-xs font-bold bg-amber-200 dark:bg-amber-900/50 hover:bg-amber-300 dark:hover:bg-amber-800/50 text-amber-900 dark:text-amber-200 rounded-xl shrink-0 cursor-pointer"
                    >
                        Switch to Live
                    </button>
                </div>
            )}

            {/* Balances Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Net Balance Card */}
                <div className="p-6 bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-900 text-white rounded-3xl shadow-xl border border-violet-400/20 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-violet-200">
                                Net Wallet Balance
                            </span>
                            <div className="text-3xl font-black mt-2">
                                UGX {summary.netBalanceUGX.toLocaleString()}
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-violet-200">
                        <span>Total Ledgers Recorded</span>
                        <span className="font-mono font-bold text-white">{summary.totalCount} Transactions</span>
                    </div>
                </div>

                {/* Total Deposits Card */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <ArrowDownLeft size={14} /> Total Deposits (Credits)
                            </span>
                            <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                                UGX {summary.totalDepositsUGX.toLocaleString()}
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <ArrowDownLeft className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-150 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                        <span>Confirmed Deposits</span>
                        <span className="font-bold text-gray-900 dark:text-white">{summary.depositCount} payments</span>
                    </div>
                </div>

                {/* Total Withdrawals Card */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <ArrowUpRight size={14} /> Total Withdrawals (Debits)
                            </span>
                            <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                                UGX {summary.totalWithdrawalsUGX.toLocaleString()}
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-150 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                        <span>Disbursements</span>
                        <span className="font-bold text-gray-900 dark:text-white">{summary.withdrawalCount} payouts</span>
                    </div>
                </div>
            </div>

            {/* Action Bar & Filters */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by reference, user email, party..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none"
                        >
                            <option value="all">All Types</option>
                            <option value="deposit">Deposits Only</option>
                            <option value="withdrawal">Withdrawals Only</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="processing">Processing</option>
                            <option value="failed">Failed</option>
                        </select>

                        <select
                            value={modeFilter}
                            onChange={(e) => setModeFilter(e.target.value as any)}
                            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none"
                        >
                            <option value="all">All Environments</option>
                            <option value="live">Live Only</option>
                            <option value="sandbox">Sandbox Only</option>
                        </select>

                        <button
                            onClick={exportToCSV}
                            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                        >
                            <Download size={14} /> Export CSV
                        </button>

                        {/* Action Buttons */}
                        <button
                            onClick={() => {
                                setAddModalType('deposit');
                                setIsAddModalOpen(true);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                            <Plus size={14} /> Record Deposit
                        </button>

                        <button
                            onClick={() => {
                                setAddModalType('withdrawal');
                                setIsAddModalOpen(true);
                            }}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                            <ArrowUpRight size={14} /> Record Withdrawal
                        </button>
                    </div>
                </div>

                {/* Ledger Transactions Table */}
                <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                <th className="py-3 px-4">Date & Time</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4">Party</th>
                                <th className="py-3 px-4">Method</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Env</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-slate-800/60 font-medium">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400 dark:text-slate-500">
                                        No ledger transactions found matching the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => {
                                    const isDebit = tx.type === 'withdrawal' || tx.type === 'debit';
                                    const isSuccess = ['completed', 'successful', 'sandbox'].includes(tx.status?.toLowerCase());
                                    const isPending = ['processing', 'pending'].includes(tx.status?.toLowerCase());

                                    return (
                                        <tr key={tx.uuid || tx.reference} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3.5 px-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                                {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    isDebit 
                                                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' 
                                                        : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                                }`}>
                                                    {isDebit ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                                    {isDebit ? 'Withdrawal' : 'Deposit'}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-900 dark:text-white max-w-xs truncate">
                                                    {tx.description || (tx.plan ? `${tx.plan.toUpperCase()} Plan Subscription` : 'Payment')}
                                                </div>
                                                <div className="text-[10px] font-mono text-gray-400 dark:text-slate-500 truncate">
                                                    Ref: {tx.reference || tx.uuid}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                                                {tx.userEmail || tx.userName || tx.recipient || tx.sender || '—'}
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className="capitalize text-gray-600 dark:text-slate-400 font-semibold">
                                                    {tx.method ? tx.method.replace('_', ' ') : 'Mobile Money'}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`font-black text-sm ${
                                                    isDebit 
                                                        ? 'text-amber-600 dark:text-amber-400' 
                                                        : 'text-emerald-600 dark:text-emerald-400'
                                                }`}>
                                                    {isDebit ? '-' : '+'}UGX {Number(tx.amount).toLocaleString()}
                                                </span>
                                                {tx.usdAmount && (
                                                    <div className="text-[10px] text-gray-400 font-medium">
                                                        ≈ ${tx.usdAmount} USD
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                    tx.isSandbox 
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' 
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                                                }`}>
                                                    {tx.isSandbox ? 'Sandbox' : 'Live'}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                                    isSuccess 
                                                        ? 'text-emerald-600 dark:text-emerald-400' 
                                                        : isPending 
                                                            ? 'text-yellow-600 dark:text-yellow-400' 
                                                            : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                    {isSuccess ? <CheckCircle2 size={13} /> : isPending ? <Clock size={13} /> : <AlertTriangle size={13} />}
                                                    {tx.status}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                                                >
                                                    <FileText size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RECORD TRANSACTION MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 text-gray-900 dark:text-white">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-full cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold mb-1">
                            {addModalType === 'deposit' ? 'Record Deposit (Credit)' : 'Record Withdrawal (Debit)'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
                            Manual ledger entries appear directly on the financial dashboard.
                        </p>

                        <form onSubmit={handleCreateTransaction} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Amount (UGX)</label>
                                <input
                                    type="number"
                                    required
                                    value={formAmount}
                                    onChange={(e) => setFormAmount(e.target.value)}
                                    placeholder="e.g. 150000"
                                    className="w-full mt-1 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-500/20"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Description</label>
                                <input
                                    type="text"
                                    required
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder={addModalType === 'deposit' ? "Corporate Sponsorship Deposit" : "Tutor Honorarium Payout"}
                                    className="w-full mt-1 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Method</label>
                                    <select
                                        value={formMethod}
                                        onChange={(e) => setFormMethod(e.target.value)}
                                        className="w-full mt-1 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                    >
                                        <option value="mobile_money">Mobile Money</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="card">Card Payment</option>
                                        <option value="cash">Cash / Cheque</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Category</label>
                                    <select
                                        value={formCategory}
                                        onChange={(e) => setFormCategory(e.target.value)}
                                        className="w-full mt-1 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                    >
                                        <option value="Subscription">Subscription</option>
                                        <option value="Sponsorship">Sponsorship</option>
                                        <option value="Tutor Payout">Tutor Payout</option>
                                        <option value="Operational">Operational</option>
                                        <option value="Refund">Refund</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                                    {addModalType === 'deposit' ? 'Sender (Entity / Person)' : 'Recipient (Beneficiary)'}
                                </label>
                                <input
                                    type="text"
                                    value={formParty}
                                    onChange={(e) => setFormParty(e.target.value)}
                                    placeholder="e.g. MTN Foundation / Dr. Jane"
                                    className="w-full mt-1 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Notes (Optional)</label>
                                <textarea
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    placeholder="Reference receipt or remarks..."
                                    rows={2}
                                    className="w-full mt-1 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submittingTx}
                                className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-md cursor-pointer transition-colors ${
                                    addModalType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                                }`}
                            >
                                {submittingTx ? 'Saving Entry...' : `Confirm & Save ${addModalType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* TRANSACTION DETAIL MODAL */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSelectedTx(null)} />
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 text-gray-900 dark:text-white max-h-[85vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setSelectedTx(null)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-full cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold mb-4">Transaction Details</h3>

                        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Transaction ID / UUID</span>
                                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedTx.uuid || selectedTx.reference}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Type</span>
                                <span className="font-bold uppercase">{selectedTx.type || 'deposit'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Amount</span>
                                <span className="font-black text-emerald-600 dark:text-emerald-400">UGX {Number(selectedTx.amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Method</span>
                                <span className="capitalize">{selectedTx.method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Environment</span>
                                <span>{selectedTx.isSandbox ? 'Sandbox Mode' : 'Live Mode'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className="font-bold">{selectedTx.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Timestamp</span>
                                <span>{selectedTx.createdAt}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
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

export default AdminWallet;
