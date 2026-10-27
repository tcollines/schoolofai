import React, { useState, useEffect, useMemo } from 'react';
import { 
    Wallet, BookOpen, Layers, Users, ArrowUpRight, ArrowDownLeft, 
    Search, Filter, Download, Plus, RefreshCw, CheckCircle2, 
    Clock, AlertTriangle, ChevronLeft, ChevronRight, Building, 
    Smartphone, CreditCard, Landmark, Sparkles, X, Eye, FileText
} from 'lucide-react';
import { formatRawAmount, formatAmount } from '../../lib/currency';

interface Transaction {
    uuid: string;
    reference: string;
    type?: 'deposit' | 'withdrawal' | 'debit';
    paymentType?: 'course' | 'package' | 'payout';
    plan?: 'course' | 'pro' | 'premium' | 'corporate' | 'withdrawal' | string;
    itemTitle?: string;
    companyName?: string;
    seats?: number;
    amount: number;
    usdAmount?: number;
    currency: string;
    method?: string;
    phoneNumber?: string;
    userEmail?: string;
    userName?: string;
    recipient?: string;
    sender?: string;
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

    // Filter & Pagination States
    const [activeTab, setActiveTab] = useState<'all' | 'courses' | 'packages' | 'payouts'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [packageFilter, setPackageFilter] = useState<'all' | 'pro' | 'premium' | 'corporate'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    // Fetch ledger data
    const fetchLedger = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/wallet/ledger');
            if (res.ok) {
                const data = await res.json();
                if (data.summary) setSummary(data.summary);
                if (data.transactions) setTransactions(data.transactions);
                if (data.sandboxMode !== undefined) setSandboxMode(Boolean(data.sandboxMode));
            }
        } catch (e) {
            console.error('Failed to load wallet ledger:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, []);

    const handleToggleSandbox = async () => {
        setTogglingMode(true);
        try {
            const nextMode = !sandboxMode;
            const res = await fetch('/api/admin/wallet/mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sandboxMode: nextMode })
            });
            if (res.ok) {
                const data = await res.json();
                setSandboxMode(data.sandboxMode);
                fetchLedger();
            }
        } catch (err) {
            console.error('Failed to toggle sandbox mode:', err);
        } finally {
            setTogglingMode(false);
        }
    };

    // Calculate aggregated metrics
    const stats = useMemo(() => {
        let courseRevenueUGX = 0;
        let packageRevenueUGX = 0;
        let courseCount = 0;
        let packageCount = 0;
        let totalSeatsSold = 0;

        for (const t of transactions) {
            if (t.type === 'withdrawal' || t.type === 'debit') continue;
            if (t.status !== 'completed' && t.status !== 'successful' && t.status !== 'sandbox') continue;

            const isCourse = t.paymentType === 'course' || t.plan === 'course';
            const amt = Number(t.amount) || 0;
            const seats = Number(t.seats) || 1;

            if (isCourse) {
                courseRevenueUGX += amt;
                courseCount += 1;
                totalSeatsSold += seats;
            } else {
                packageRevenueUGX += amt;
                packageCount += 1;
                totalSeatsSold += seats;
            }
        }

        return {
            courseRevenueUGX,
            packageRevenueUGX,
            courseCount,
            packageCount,
            totalSeatsSold
        };
    }, [transactions]);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const isWithdrawal = t.type === 'withdrawal' || t.type === 'debit';
            const isCourse = (t.paymentType === 'course' || t.plan === 'course') && !isWithdrawal;
            const isPackage = !isCourse && !isWithdrawal;

            // Tab filtering
            if (activeTab === 'courses' && !isCourse) return false;
            if (activeTab === 'packages' && !isPackage) return false;
            if (activeTab === 'payouts' && !isWithdrawal) return false;

            // Sub-filter for packages
            if (activeTab === 'packages' && packageFilter !== 'all') {
                const planKey = (t.plan || '').toLowerCase();
                if (packageFilter === 'pro' && !planKey.includes('pro')) return false;
                if (packageFilter === 'premium' && !planKey.includes('prem')) return false;
                if (packageFilter === 'corporate' && !planKey.includes('corp') && !planKey.includes('sponsor')) return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = (t.userName || '').toLowerCase().includes(q);
                const matchEmail = (t.userEmail || '').toLowerCase().includes(q);
                const matchTitle = (t.itemTitle || t.description || '').toLowerCase().includes(q);
                const matchCompany = (t.companyName || '').toLowerCase().includes(q);
                const matchRef = (t.reference || t.uuid || '').toLowerCase().includes(q);
                const matchPhone = (t.phoneNumber || '').toLowerCase().includes(q);
                if (!matchName && !matchEmail && !matchTitle && !matchCompany && !matchRef && !matchPhone) {
                    return false;
                }
            }

            return true;
        });
    }, [transactions, activeTab, packageFilter, searchQuery]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(start, start + itemsPerPage);
    }, [filteredTransactions, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // CSV Export
    const handleExportCSV = () => {
        const headers = [
            'Reference', 'Date', 'Type', 'Item/Plan', 'Customer', 'Email', 
            'Company', 'Seats', 'Amount UGX', 'Amount USD', 'Method', 'Status'
        ];
        const rows = filteredTransactions.map(t => [
            t.reference || t.uuid,
            t.createdAt ? new Date(t.createdAt).toLocaleString() : '',
            t.paymentType || t.type || 'deposit',
            t.itemTitle || t.plan || '',
            t.userName || '',
            t.userEmail || '',
            t.companyName || '',
            t.seats || 1,
            t.amount || 0,
            t.usdAmount || '',
            t.method || '',
            t.status || ''
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + 
            [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `wallet-payments-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            {/* Header: Title and Environment Mode Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <Wallet className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                        Wallet & Payments
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Track platform revenue from individual courses and subscription packages with seat management.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLedger}
                        disabled={loading}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                        title="Refresh wallet balances"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin text-violet-600' : ''} />
                    </button>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Mode:</span>
                        <button
                            onClick={handleToggleSandbox}
                            disabled={togglingMode}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                sandboxMode 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${sandboxMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                            {sandboxMode ? 'SANDBOX TESTING' : 'LIVE PRODUCTION'}
                        </button>
                    </div>
                </div>
            </div>

            {/* SIMPLE TOTAL WALLET BALANCE CARD */}
            <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-violet-800/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider">
                            <Wallet className="w-4 h-4" />
                            Total Wallet Balance
                        </div>
                        <div className="mt-2 flex items-baseline gap-3">
                            <span className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                                {formatRawAmount(summary.netBalanceUGX, 'UGX')}
                            </span>
                            <span className="text-lg md:text-xl font-semibold text-violet-300/80">
                                ≈ ${Math.round(summary.netBalanceUGX / 4600).toLocaleString()} USD
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Net funds received from student courses and corporate packages minus instructor disbursements.
                        </p>
                    </div>

                    {/* Breakdown Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-xs font-semibold text-violet-200">
                                <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                                Course Payments
                            </div>
                            <div className="text-lg font-bold text-white mt-1">
                                {formatRawAmount(stats.courseRevenueUGX, 'UGX')}
                            </div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                                {stats.courseCount} student enrollment{stats.courseCount === 1 ? '' : 's'}
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
                                <Layers className="w-3.5 h-3.5 text-amber-400" />
                                Package Plans
                            </div>
                            <div className="text-lg font-bold text-white mt-1">
                                {formatRawAmount(stats.packageRevenueUGX, 'UGX')}
                            </div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                                {stats.packageCount} packages • {stats.totalSeatsSold} total seats
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-xs font-semibold text-rose-200">
                                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                                Withdrawals / Payouts
                            </div>
                            <div className="text-lg font-bold text-white mt-1">
                                {formatRawAmount(summary.totalWithdrawalsUGX, 'UGX')}
                            </div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                                {summary.withdrawalCount} honorarium payout{summary.withdrawalCount === 1 ? '' : 's'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER TABS & SEARCH CONTROLS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <button
                        onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'all'
                                ? 'bg-violet-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        All Payments ({transactions.length})
                    </button>

                    <button
                        onClick={() => { setActiveTab('courses'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            activeTab === 'courses'
                                ? 'bg-violet-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        <BookOpen size={14} />
                        Course Payments ({transactions.filter(t => t.paymentType === 'course' || t.plan === 'course').length})
                    </button>

                    <button
                        onClick={() => { setActiveTab('packages'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            activeTab === 'packages'
                                ? 'bg-violet-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        <Layers size={14} />
                        Package Payments ({transactions.filter(t => t.paymentType === 'package' || ['pro', 'premium', 'corporate'].includes(t.plan || '')).length})
                    </button>

                    <button
                        onClick={() => { setActiveTab('payouts'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            activeTab === 'payouts'
                                ? 'bg-violet-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        <ArrowUpRight size={14} />
                        Payouts ({transactions.filter(t => t.type === 'withdrawal' || t.type === 'debit').length})
                    </button>
                </div>

                {/* Sub-filter when on Packages tab */}
                {activeTab === 'packages' && (
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                        {(['all', 'pro', 'premium', 'corporate'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => { setPackageFilter(p); setCurrentPage(1); }}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
                                    packageFilter === p
                                        ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {p === 'all' ? 'All Packages' : p}
                            </button>
                        ))}
                    </div>
                )}

                {/* Search & Actions */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            placeholder="Search payments..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl text-xs border border-gray-200 dark:border-slate-700 focus:outline-hidden focus:border-violet-500"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleExportCSV}
                        className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                        <Download size={13} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* PAYMENTS TABLE WITH PAGINATION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-150 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                <th className="py-3.5 px-4">Date & Time</th>
                                <th className="py-3.5 px-4">Student / Buyer</th>
                                <th className="py-3.5 px-4">Course or Package</th>
                                <th className="py-3.5 px-4 text-center">Seats</th>
                                <th className="py-3.5 px-4 text-right">Amount (UGX / USD)</th>
                                <th className="py-3.5 px-4">Method</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                                            <span>Loading payment records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-gray-400 dark:text-slate-500">
                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center mb-3">
                                                <Wallet size={24} />
                                            </div>
                                            <p className="font-bold text-sm text-gray-800 dark:text-slate-200">No payment transactions yet</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                Transactions will automatically appear here as students purchase individual courses or subscribe to Pro, Premium, or Corporate packages.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTransactions.map(t => {
                                    const isWithdrawal = t.type === 'withdrawal' || t.type === 'debit';
                                    const isCourse = (t.paymentType === 'course' || t.plan === 'course') && !isWithdrawal;
                                    const planKey = (t.plan || '').toLowerCase();
                                    const isPro = planKey.includes('pro');
                                    const isPremium = planKey.includes('prem');
                                    const isCorporate = planKey.includes('corp') || planKey.includes('sponsor') || Boolean(t.companyName);
                                    const seatsCount = t.seats || 1;

                                    return (
                                        <tr key={t.uuid || t.reference} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Date & Time */}
                                            <td className="py-3.5 px-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                                <div className="font-medium text-gray-900 dark:text-slate-200">
                                                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    {t.createdAt ? new Date(t.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </div>
                                            </td>

                                            {/* Student / Buyer */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                    {t.userName || t.sender || t.recipient || 'Learner'}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-slate-400">
                                                    {t.userEmail || t.phoneNumber || '—'}
                                                </div>
                                                {t.companyName && (
                                                    <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
                                                        <Building size={10} />
                                                        {t.companyName}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Course or Package */}
                                            <td className="py-3.5 px-4">
                                                {isCourse ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold uppercase tracking-wide">
                                                            <BookOpen size={10} />
                                                            Individual Course
                                                        </span>
                                                        <div className="font-semibold text-gray-900 dark:text-slate-100 mt-1 line-clamp-1">
                                                            {t.itemTitle || t.description || 'Course Purchase'}
                                                        </div>
                                                    </div>
                                                ) : isWithdrawal ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold uppercase tracking-wide">
                                                            <ArrowUpRight size={10} />
                                                            Payout / Withdrawal
                                                        </span>
                                                        <div className="font-semibold text-gray-900 dark:text-slate-100 mt-1 line-clamp-1">
                                                            {t.description || t.itemTitle || 'Instructor Disbursement'}
                                                        </div>
                                                    </div>
                                                ) : isCorporate ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-wide">
                                                            <Building size={10} />
                                                            Corporate Package
                                                        </span>
                                                        <div className="font-semibold text-gray-900 dark:text-slate-100 mt-1">
                                                            {t.itemTitle || 'Corporate Sponsored Access'}
                                                        </div>
                                                    </div>
                                                ) : isPremium ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wide">
                                                            <Sparkles size={10} />
                                                            Premium Plan ($150)
                                                        </span>
                                                        <div className="font-semibold text-gray-900 dark:text-slate-100 mt-1">
                                                            Lifetime All-Access Access
                                                        </div>
                                                    </div>
                                                ) : isPro ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-[10px] font-extrabold uppercase tracking-wide">
                                                            <Layers size={10} />
                                                            Pro Plan ($25/mo)
                                                        </span>
                                                        <div className="font-semibold text-gray-900 dark:text-slate-100 mt-1">
                                                            Monthly Subscription
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-[10px] font-extrabold uppercase">
                                                            Package Payment
                                                        </span>
                                                        <div className="font-semibold text-gray-900 dark:text-slate-100 mt-1">
                                                            {t.itemTitle || t.description || 'Platform Subscription'}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Number of Seats */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                {isWithdrawal ? (
                                                    <span className="text-gray-400">—</span>
                                                ) : isCorporate || seatsCount > 1 ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 text-xs font-extrabold border border-indigo-200 dark:border-indigo-800">
                                                        <Users size={12} />
                                                        {seatsCount} Seats
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[11px] font-semibold">
                                                        1 Seat
                                                    </span>
                                                )}
                                            </td>

                                            {/* Amount */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className={`font-extrabold text-sm ${isWithdrawal ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {isWithdrawal ? '-' : '+'}{formatRawAmount(t.amount, 'UGX')}
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    ≈ ${t.usdAmount || Math.round(t.amount / 4600)} USD
                                                </div>
                                            </td>

                                            {/* Method */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-slate-300">
                                                    {t.method === 'mobile_money' ? (
                                                        <>
                                                            <Smartphone size={13} className="text-amber-500" />
                                                            Mobile Money
                                                        </>
                                                    ) : t.method === 'bank_transfer' ? (
                                                        <>
                                                            <Landmark size={13} className="text-blue-500" />
                                                            Bank Transfer
                                                        </>
                                                    ) : t.method === 'card' ? (
                                                        <>
                                                            <CreditCard size={13} className="text-emerald-500" />
                                                            Card
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Wallet size={13} className="text-violet-500" />
                                                            {t.method || 'Direct'}
                                                        </>
                                                    )}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {['completed', 'successful', 'sandbox'].includes(t.status?.toLowerCase()) ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                                        <CheckCircle2 size={11} />
                                                        Completed
                                                    </span>
                                                ) : ['processing', 'pending'].includes(t.status?.toLowerCase()) ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                                        <Clock size={11} className="animate-spin" />
                                                        Processing
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                                                        <AlertTriangle size={11} />
                                                        Failed
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedTx(t)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                    title="View payment receipt details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                <div className="p-4 border-t border-gray-150 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-gray-500 dark:text-slate-400 font-medium">
                        Showing{' '}
                        <span className="font-bold text-gray-900 dark:text-white">
                            {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-bold text-gray-900 dark:text-white">
                            {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
                        </span>{' '}
                        of{' '}
                        <span className="font-bold text-gray-900 dark:text-white">
                            {filteredTransactions.length}
                        </span>{' '}
                        payment records
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Rows per page selector */}
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-gray-400 text-[11px]">Rows:</span>
                            <select
                                value={itemsPerPage}
                                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg px-2 py-1 text-xs border border-gray-200 dark:border-slate-700 focus:outline-hidden"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        {/* Prev Button */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => handlePageChange(p)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        currentPage === p
                                            ? 'bg-violet-600 text-white shadow-xs'
                                            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* TRANSACTION DETAILS MODAL */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-150 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Payment Details</h3>
                                    <p className="text-xs text-gray-500 font-mono">{selectedTx.reference || selectedTx.uuid}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 text-xs">
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <span className="text-gray-400 text-[11px] block">Total Amount</span>
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                                        {formatRawAmount(selectedTx.amount, 'UGX')}
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-500">
                                    ≈ ${selectedTx.usdAmount || Math.round(selectedTx.amount / 4600)} USD
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40">
                                    <span className="text-gray-400 block text-[10px]">Payment Type</span>
                                    <span className="font-bold uppercase text-gray-800 dark:text-slate-200">
                                        {selectedTx.paymentType || selectedTx.plan || 'Direct'}
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40">
                                    <span className="text-gray-400 block text-[10px]">Seats Allocated</span>
                                    <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1">
                                        <Users size={12} />
                                        {selectedTx.seats || 1} Seat{(selectedTx.seats || 1) === 1 ? '' : 's'}
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40">
                                    <span className="text-gray-400 block text-[10px]">Customer / Payer</span>
                                    <span className="font-bold text-gray-800 dark:text-slate-200 truncate block">
                                        {selectedTx.userName || 'Learner'}
                                    </span>
                                    <span className="text-[10px] text-gray-500 truncate block">{selectedTx.userEmail}</span>
                                </div>

                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40">
                                    <span className="text-gray-400 block text-[10px]">Method</span>
                                    <span className="font-bold capitalize text-gray-800 dark:text-slate-200">
                                        {selectedTx.method?.replace('_', ' ') || 'Mobile Money'}
                                    </span>
                                </div>
                            </div>

                            {selectedTx.companyName && (
                                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                                    <span className="text-indigo-600 dark:text-indigo-400 block text-[10px] font-bold uppercase">
                                        Corporate Sponsoring Organization
                                    </span>
                                    <span className="font-extrabold text-sm text-indigo-900 dark:text-indigo-200">
                                        {selectedTx.companyName}
                                    </span>
                                </div>
                            )}

                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 flex justify-between items-center">
                                <span className="text-gray-400">Payment Status</span>
                                <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">
                                    {selectedTx.status}
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 flex justify-between items-center">
                                <span className="text-gray-400">Timestamp</span>
                                <span className="font-mono text-gray-600 dark:text-slate-300">
                                    {selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString() : 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
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
