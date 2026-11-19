import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity, Award, BookOpen, Check, ChevronDown, ChevronUp, Clock, Copy,
    Download, GraduationCap, Handshake, Loader2, MapPin, RefreshCw, Search,
    TrendingUp, UserCheck, UserPlus, Users, Video, X
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import AdminAuthPrompt, { MissingDbNotice } from './AdminAuthPrompt';

interface AgentSummary {
    id: string;
    name: string;
    slug: string;
    staff_code?: string | null;
    role: string | null;
    email?: string | null;
    phone?: string | null;
    active: boolean;
    linked: boolean;
    created_at?: string | null;
    clicks: number;
    registered: number;
    accounts: number;
    waiting?: number;
    total_students?: number;
    enrolled: number;
    recorded: number;
    live: number;
    completed: number;
    active_7d: number;
    registered_today?: number;
    registered_7d?: number;
    last_activity_at?: string | null;
    points?: number;
    by_course: Record<string, number>;
    by_location: Record<string, number>;
    daily?: number[];
    daily_registered?: number[];
}

interface AgentClient {
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    stage: string;
    joined: string;
    course?: string | null;
    source?: string | null;
    registered_by?: string | null;
}

const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm';
const input = 'w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';
const isMissingFn = (m: string) => /schema cache|does not exist|could not find the function/i.test(m);
const isAuthError = (m: string) => /row-level security|permission denied|not authorized/i.test(m);

const STAGE_STYLES: Record<string, string> = {
    'Completed': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    'Joined live': 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
    'Studying': 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
    'In course': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300',
    'Account opened': 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
    'Waiting to sign up': 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
};

const timeAgo = (iso?: string | null) => {
    if (!iso) return 'No activity yet';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.round(diffMs / 60000));
    if (mins < 2) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 14) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Kampala' });
};

const formatEatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Kampala',
    });

const csvEscape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadCsv = (filename: string, headers: string[], rows: unknown[][]) => {
    const csv = [headers.map(csvEscape).join(','), ...rows.map(r => r.map(csvEscape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const MiniSparkline: React.FC<{ data: number[] }> = ({ data }) => {
    const arr = data && data.length > 0 ? data : Array(14).fill(0);
    const max = Math.max(1, ...arr);
    return (
        <div className="flex items-end gap-0.5 h-7 w-24" aria-label="14-day registrations trend">
            {arr.map((n, i) => (
                <div
                    key={i}
                    title={`${n} registration${n === 1 ? '' : 's'}`}
                    className={`flex-1 rounded-xs transition-all ${n > 0 ? 'bg-violet-500 dark:bg-violet-400' : 'bg-gray-200 dark:bg-slate-800'}`}
                    style={{ height: `${Math.max(12, Math.round((n / max) * 100))}%` }}
                />
            ))}
        </div>
    );
};

const AdminAgents: React.FC = () => {
    const [agents, setAgents] = useState<AgentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [missingDb, setMissingDb] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters & sorting
    const [days, setDays] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'with_students'>('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'registered' | 'accounts' | 'recorded' | 'completed' | 'today' | 'name'>('registered');

    // Selected agent drill-down
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [clients, setClients] = useState<AgentClient[] | null>(null);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [clientStage, setClientStage] = useState<string>('all');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const sinceIso = useMemo(
        () => (days ? new Date(Date.now() - days * 86400000).toISOString() : null),
        [days]
    );

    const origin = window.location.origin.replace('admin.', '');

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error: err } = await supabaseClient.rpc('admin_agent_funnel', { p_since: sinceIso });
        if (err) {
            if (isMissingFn(err.message)) setMissingDb(true);
            else {
                setError(err.message);
                if (isAuthError(err.message)) setNeedsAuth(true);
            }
        } else {
            setError(null);
            setAgents((data || []) as AgentSummary[]);
        }
        setLoading(false);
    }, [sinceIso]);

    useEffect(() => {
        void load();
        const t = window.setInterval(load, 60000);
        return () => window.clearInterval(t);
    }, [load]);

    const loadClients = useCallback(async (agentId: string) => {
        setClientsLoading(true);
        setClients(null);
        const { data, error: err } = await supabaseClient.rpc('admin_agent_clients', {
            p_staff: agentId,
            p_since: sinceIso,
        });
        if (!err && data) {
            setClients(data as AgentClient[]);
        } else {
            setClients([]);
        }
        setClientsLoading(false);
    }, [sinceIso]);

    // Reload open agent's students when period filter changes
    useEffect(() => {
        if (selectedAgentId) {
            void loadClients(selectedAgentId);
        }
    }, [selectedAgentId, loadClients]);

    const toggleSelectAgent = (id: string) => {
        if (selectedAgentId === id) {
            setSelectedAgentId(null);
            setClients(null);
            setClientSearch('');
            setClientStage('all');
            return;
        }
        setSelectedAgentId(id);
        setClientSearch('');
        setClientStage('all');
    };

    const copyText = async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1600);
        } catch {
            // ignore clipboard errors
        }
    };

    const totals = useMemo(() => {
        return agents.reduce(
            (acc, a) => {
                const totalForAgent = a.total_students ?? Math.max(a.registered, a.accounts);
                const waitingForAgent = a.waiting ?? Math.max(0, a.registered - a.accounts);
                return {
                    activeAgents: acc.activeAgents + (a.active && a.linked ? 1 : 0),
                    agentsWithStudents: acc.agentsWithStudents + (totalForAgent > 0 ? 1 : 0),
                    registered: acc.registered + (a.registered || 0),
                    totalStudents: acc.totalStudents + totalForAgent,
                    waiting: acc.waiting + waitingForAgent,
                    accounts: acc.accounts + (a.accounts || 0),
                    enrolled: acc.enrolled + (a.enrolled || 0),
                    recorded: acc.recorded + (a.recorded || 0),
                    live: acc.live + (a.live || 0),
                    completed: acc.completed + (a.completed || 0),
                    today: acc.today + (a.registered_today || 0),
                    week: acc.week + (a.registered_7d || 0),
                };
            },
            {
                activeAgents: 0,
                agentsWithStudents: 0,
                registered: 0,
                totalStudents: 0,
                waiting: 0,
                accounts: 0,
                enrolled: 0,
                recorded: 0,
                live: 0,
                completed: 0,
                today: 0,
                week: 0,
            }
        );
    }, [agents]);

    const filteredAgents = useMemo(() => {
        const q = search.trim().toLowerCase();
        return agents
            .filter(a => {
                const total = a.total_students ?? Math.max(a.registered, a.accounts);
                if (statusFilter === 'active' && !a.active) return false;
                if (statusFilter === 'with_students' && total === 0 && a.registered === 0) return false;
                if (!q) return true;
                const hay = `${a.name} ${a.email || ''} ${a.staff_code || ''} ${a.slug} ${a.role || ''}`.toLowerCase();
                return hay.includes(q);
            })
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'today') return (b.registered_today || 0) - (a.registered_today || 0) || b.registered - a.registered;
                if (sortBy === 'accounts') return b.accounts - a.accounts || b.registered - a.registered;
                if (sortBy === 'recorded') return b.recorded - a.recorded || b.accounts - a.accounts;
                if (sortBy === 'completed') return b.completed - a.completed || b.recorded - a.recorded;
                return b.registered - a.registered || b.accounts - a.accounts;
            });
    }, [agents, statusFilter, search, sortBy]);

    const selectedAgent = useMemo(
        () => agents.find(a => a.id === selectedAgentId) || null,
        [agents, selectedAgentId]
    );

    const filteredClients = useMemo(() => {
        if (!clients) return [];
        const q = clientSearch.trim().toLowerCase();
        return clients.filter(c => {
            if (clientStage !== 'all' && c.stage !== clientStage) return false;
            if (!q) return true;
            const hay = `${c.name} ${c.email || ''} ${c.phone || ''} ${c.location || ''} ${c.course || ''} ${c.stage}`.toLowerCase();
            return hay.includes(q);
        });
    }, [clients, clientSearch, clientStage]);

    const stageCounts = useMemo(() => {
        const map: Record<string, number> = {};
        (clients || []).forEach(c => {
            map[c.stage] = (map[c.stage] || 0) + 1;
        });
        return map;
    }, [clients]);

    const exportSummaryCsv = () => {
        downloadCsv(
            `welile-agents-summary-${new Date().toISOString().slice(0, 10)}.csv`,
            ['Agent', 'Email', 'Staff Code', 'Role', 'Status', 'Registered', 'Today', 'Last 7d', 'Waiting', 'Accounts Opened', 'In Course', 'Studying', 'Joined Live', 'Completed', 'Points', 'Last Activity'],
            filteredAgents.map(a => [
                a.name,
                a.email || '',
                a.staff_code || '',
                a.role || '',
                a.active ? 'Active' : 'Inactive',
                a.registered,
                a.registered_today ?? 0,
                a.registered_7d ?? 0,
                a.waiting ?? Math.max(0, a.registered - a.accounts),
                a.accounts,
                a.enrolled,
                a.recorded,
                a.live,
                a.completed,
                a.points ?? 0,
                a.last_activity_at || '',
            ])
        );
    };

    const exportAgentClientsCsv = () => {
        if (!selectedAgent || !clients) return;
        downloadCsv(
            `welile-agent-${selectedAgent.slug}-students-${new Date().toISOString().slice(0, 10)}.csv`,
            ['Date', 'Student Name', 'Phone', 'Email', 'Location', 'Programme', 'Registered By', 'Source', 'Stage'],
            filteredClients.map(c => [
                formatEatDate(c.joined),
                c.name,
                c.phone || '',
                c.email || '',
                c.location || '',
                c.course || 'AI Fundamentals (free)',
                c.registered_by || selectedAgent.name,
                c.source || 'Registered by agent',
                c.stage,
            ])
        );
    };

    const overallConversion = totals.totalStudents > 0
        ? Math.round((totals.accounts / totals.totalStudents) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="text-violet-600" size={24} />
                        Agent Monitoring
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                        Live summary of every agent&apos;s registrations, account conversions, course progress, and full student roster.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        to="/staff"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                        <Handshake size={15} />
                        Manage Staff & Links
                    </Link>
                    <button
                        onClick={exportSummaryCsv}
                        disabled={filteredAgents.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        <Download size={15} />
                        Export Summary
                    </button>
                    <button
                        onClick={() => void load()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {missingDb && <MissingDbNotice />}
            {needsAuth && <AdminAuthPrompt onSignedIn={() => { setNeedsAuth(false); setError(null); void load(); }} />}
            {error && !missingDb && <p role="alert" className="text-sm text-red-600">{error}</p>}

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className={`${card} p-4`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Active Agents</span>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-600 bg-violet-50 dark:bg-violet-950/40">
                            <Handshake size={16} />
                        </span>
                    </div>
                    <p className="text-3xl font-extrabold mt-2">{totals.activeAgents}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {totals.agentsWithStudents} with registered students · {agents.length} total
                    </p>
                </div>

                <div className={`${card} p-4`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Registered Students</span>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50 dark:bg-blue-950/40">
                            <UserPlus size={16} />
                        </span>
                    </div>
                    <p className="text-3xl font-extrabold mt-2">{totals.registered}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {totals.today} today · {totals.week} in last 7 days
                    </p>
                </div>

                <div className={`${card} p-4`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Accounts Opened</span>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                            <UserCheck size={16} />
                        </span>
                    </div>
                    <p className="text-3xl font-extrabold mt-2">{totals.accounts}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {overallConversion}% converted · {totals.waiting} waiting to sign up
                    </p>
                </div>

                <div className={`${card} p-4`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Studying & Certified</span>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-950/40">
                            <GraduationCap size={16} />
                        </span>
                    </div>
                    <p className="text-3xl font-extrabold mt-2">{totals.recorded}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {totals.live} joined live · {totals.completed} completed
                    </p>
                </div>
            </div>

            {/* Filter & Controls Bar */}
            <div className={`${card} p-4 flex flex-wrap items-center justify-between gap-3`}>
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[220px]">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search agent name, email, code..."
                            className={`${input} pl-9`}
                        />
                    </div>
                    <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-700 overflow-hidden text-xs font-semibold" role="group" aria-label="Agent filter">
                        {([['all', 'All'], ['with_students', 'With students'], ['active', 'Active']] as const).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setStatusFilter(val)}
                                className={`px-3 py-2 ${statusFilter === val ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-700 overflow-hidden text-xs font-semibold" role="group" aria-label="Time period">
                        {([[7, '7 days'], [30, '30 days'], [null, 'All time']] as [number | null, string][]).map(([d, l]) => (
                            <button
                                key={l}
                                onClick={() => setDays(d)}
                                aria-pressed={days === d}
                                className={`px-3 py-2 ${days === d ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        aria-label="Sort agents by"
                        className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-semibold"
                    >
                        <option value="registered">Most registered</option>
                        <option value="today">Most today</option>
                        <option value="accounts">Most accounts</option>
                        <option value="recorded">Most studying</option>
                        <option value="completed">Most completed</option>
                        <option value="name">Name (A–Z)</option>
                    </select>
                </div>
            </div>

            {/* Agents Summary Table */}
            <div className={`${card} overflow-hidden`}>
                <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div>
                        <h2 className="font-bold text-base">Agents Summary</h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            Click any agent to inspect their full student roster, locations, and funnel breakdown.
                        </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                        {filteredAgents.length} {filteredAgents.length === 1 ? 'agent' : 'agents'}
                    </span>
                </div>

                {loading && agents.length === 0 ? (
                    <div className="p-8 flex items-center justify-center gap-2 text-gray-500">
                        <Loader2 className="animate-spin" size={18} /> Loading agent performance...
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                        No agents match the current filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 bg-gray-50/70 dark:bg-slate-800/40">
                                    <th className="py-3 px-4">Agent</th>
                                    <th className="py-3 px-3 text-right">Registered</th>
                                    <th className="py-3 px-3 text-right">Waiting</th>
                                    <th className="py-3 px-3 text-right">Accounts</th>
                                    <th className="py-3 px-3 text-right">Studying</th>
                                    <th className="py-3 px-3 text-right">Live / Done</th>
                                    <th className="py-3 px-3 hidden md:table-cell">14d Trend</th>
                                    <th className="py-3 px-3 hidden lg:table-cell">Last Activity</th>
                                    <th className="py-3 px-4 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {filteredAgents.map(a => {
                                    const isSelected = selectedAgentId === a.id;
                                    const waitingCount = a.waiting ?? Math.max(0, a.registered - a.accounts);
                                    const totalStudents = a.total_students ?? Math.max(a.registered, a.accounts);
                                    const convPct = totalStudents > 0 ? Math.round((a.accounts / totalStudents) * 100) : 0;
                                    return (
                                        <tr
                                            key={a.id}
                                            onClick={() => toggleSelectAgent(a.id)}
                                            className={`cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-violet-50/80 dark:bg-violet-950/30'
                                                    : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                                            } ${a.active ? '' : 'opacity-60'}`}
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2.5 min-w-[180px]">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                                        a.registered > 0
                                                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'
                                                            : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        {a.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-semibold text-gray-900 dark:text-white truncate">{a.name}</p>
                                                            {!a.active && (
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                                                                    Inactive
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                                            {[a.email, a.staff_code, a.role].filter(Boolean).join(' · ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                                <span className="text-base font-extrabold text-gray-900 dark:text-white">{a.registered}</span>
                                                {(a.registered_today || 0) > 0 && (
                                                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                        +{a.registered_today} today
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                                <span className={`font-semibold ${waitingCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-gray-400'}`}>
                                                    {waitingCount}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                                <span className="font-bold text-gray-900 dark:text-white">{a.accounts}</span>
                                                {totalStudents > 0 && (
                                                    <span className="block text-[11px] text-gray-500 dark:text-slate-400">{convPct}%</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                                <span className="font-semibold text-violet-700 dark:text-violet-300">{a.recorded}</span>
                                            </td>
                                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                                <span className="text-xs text-gray-600 dark:text-slate-300">
                                                    {a.live} live · <b className="text-emerald-700 dark:text-emerald-400">{a.completed}</b> cert
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-3 hidden md:table-cell">
                                                <MiniSparkline data={a.daily_registered || a.daily || []} />
                                            </td>
                                            <td className="py-3.5 px-3 hidden lg:table-cell whitespace-nowrap text-xs text-gray-500 dark:text-slate-400">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {timeAgo(a.last_activity_at)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        toggleSelectAgent(a.id);
                                                    }}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                                        isSelected
                                                            ? 'bg-violet-600 text-white border-violet-600'
                                                            : 'border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {isSelected ? (
                                                        <>Hide <ChevronUp size={13} /></>
                                                    ) : (
                                                        <>Students <ChevronDown size={13} /></>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Selected Agent Detailed Breakdown & Full Student Roster */}
            {selectedAgent && (
                <div className={`${card} p-5 space-y-5 ring-2 ring-violet-500/30`}>
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                                {selectedAgent.staff_code && (
                                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                                        {selectedAgent.staff_code}
                                    </span>
                                )}
                                {selectedAgent.role && (
                                    <span className="text-xs text-gray-500 dark:text-slate-400">{selectedAgent.role}</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                {[selectedAgent.email, selectedAgent.phone, `Last activity: ${timeAgo(selectedAgent.last_activity_at)}`].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => copyText(`${origin}/join/${selectedAgent.slug}`, `join-${selectedAgent.id}`)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                            >
                                {copiedKey === `join-${selectedAgent.id}` ? <><Check size={13} /> Copied sign-up link</> : <><Copy size={13} /> Copy /join/{selectedAgent.slug}</>}
                            </button>
                            <button
                                onClick={exportAgentClientsCsv}
                                disabled={!clients || clients.length === 0}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
                            >
                                <Download size={13} />
                                Export Students CSV
                            </button>
                            <button
                                onClick={() => toggleSelectAgent(selectedAgent.id)}
                                aria-label="Close agent details"
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Agent Metrics + Trend + Locations */}
                    <div className="grid lg:grid-cols-3 gap-4">
                        {/* Funnel Bars */}
                        <div className="rounded-xl border border-gray-100 dark:border-slate-800 p-4 space-y-2.5">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                                <TrendingUp size={14} className="text-violet-600" /> Conversion Funnel
                            </h3>
                            {(() => {
                                const maxVal = Math.max(1, selectedAgent.registered, selectedAgent.accounts, selectedAgent.total_students || 0);
                                const bars: [string, number, string][] = [
                                    ['Registered by agent', selectedAgent.registered, 'bg-violet-600'],
                                    ['Waiting to sign up', selectedAgent.waiting ?? Math.max(0, selectedAgent.registered - selectedAgent.accounts), 'bg-amber-500'],
                                    ['Accounts opened', selectedAgent.accounts, 'bg-blue-500'],
                                    ['In free course', selectedAgent.enrolled, 'bg-indigo-500'],
                                    ['Studying lessons', selectedAgent.recorded, 'bg-emerald-500'],
                                    ['Joined live class', selectedAgent.live, 'bg-sky-500'],
                                    ['Completed & certified', selectedAgent.completed, 'bg-teal-500'],
                                ];
                                return bars.map(([label, n, color]) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600 dark:text-slate-300">{label}</span>
                                            <span className="font-bold">{n}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 mt-1">
                                            <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(100, (n / maxVal) * 100)}%` }} />
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* 14-day Registrations Trend */}
                        <div className="rounded-xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Users size={14} className="text-violet-600" /> Daily Registrations (Last 14 Days)
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    Today: <b className="text-gray-900 dark:text-white">{selectedAgent.registered_today ?? 0}</b> · Last 7d: <b className="text-gray-900 dark:text-white">{selectedAgent.registered_7d ?? 0}</b> · Points: <b className="text-violet-600">{selectedAgent.points ?? 0}</b>
                                </p>
                            </div>
                            {(() => {
                                const daily = selectedAgent.daily_registered || selectedAgent.daily || Array(14).fill(0);
                                const maxD = Math.max(1, ...daily);
                                return (
                                    <div className="flex items-end gap-1.5 h-28 mt-4">
                                        {daily.map((n, idx) => (
                                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                                                {n > 0 && <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300">{n}</span>}
                                                <div
                                                    title={`${n} registration${n === 1 ? '' : 's'}`}
                                                    className={`w-full rounded-t-sm ${n > 0 ? 'bg-violet-500 dark:bg-violet-400' : 'bg-gray-100 dark:bg-slate-800'}`}
                                                    style={{ height: `${Math.max(6, Math.round((n / maxD) * 82))}%` }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                            <p className="text-[11px] text-gray-400 mt-2 flex justify-between">
                                <span>14 days ago</span>
                                <span>Today</span>
                            </p>
                        </div>

                        {/* Top Locations & Programmes */}
                        <div className="rounded-xl border border-gray-100 dark:border-slate-800 p-4 space-y-4">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-violet-600" /> Top Locations
                                </h3>
                                {selectedAgent.by_location && Object.keys(selectedAgent.by_location).length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {Object.entries(selectedAgent.by_location)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([loc, count]) => (
                                                <span
                                                    key={loc}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200"
                                                >
                                                    {loc} <b className="text-violet-700 dark:text-violet-300">{count}</b>
                                                </span>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 mt-2">No location data yet.</p>
                                )}
                            </div>
                            <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <BookOpen size={14} className="text-violet-600" /> Programmes Registered
                                </h3>
                                {selectedAgent.by_course && Object.keys(selectedAgent.by_course).length > 0 ? (
                                    <ul className="mt-2 space-y-1 text-xs">
                                        {Object.entries(selectedAgent.by_course)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([course, count]) => (
                                                <li key={course} className="flex justify-between">
                                                    <span className="text-gray-700 dark:text-slate-300 truncate pr-2">{course}</span>
                                                    <span className="font-bold">{count}</span>
                                                </li>
                                            ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-gray-400 mt-2">No course registrations yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Full Student Roster for Selected Agent */}
                    <div className="pt-2 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="font-bold text-base">
                                    Students Registered by {selectedAgent.name}
                                    {clients && <span className="ml-2 text-xs font-semibold text-violet-700 dark:text-violet-300">({filteredClients.length} of {clients.length})</span>}
                                </h3>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)}
                                    placeholder="Filter students..."
                                    className={`${input} pl-8 !py-1.5 text-xs`}
                                />
                            </div>
                        </div>

                        {/* Stage Filter Pills */}
                        {clients && clients.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => setClientStage('all')}
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                        clientStage === 'all'
                                            ? 'bg-violet-600 text-white border-violet-600'
                                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300'
                                    }`}
                                >
                                    All ({clients.length})
                                </button>
                                {(['Waiting to sign up', 'Account opened', 'In course', 'Studying', 'Joined live', 'Completed'] as const).map(st => {
                                    const count = stageCounts[st] || 0;
                                    if (count === 0) return null;
                                    return (
                                        <button
                                            key={st}
                                            onClick={() => setClientStage(st)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                clientStage === st
                                                    ? 'bg-violet-600 text-white border-violet-600'
                                                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300'
                                            }`}
                                        >
                                            {st} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {clientsLoading || clients === null ? (
                            <div className="py-6 flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 className="animate-spin" size={16} /> Loading students...
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <p className="py-6 text-sm text-gray-500">
                                {clients.length === 0 ? 'No students registered by this agent in this period.' : 'No students match your search.'}
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase text-gray-500 dark:text-slate-400 bg-gray-50/80 dark:bg-slate-800/40">
                                            <th className="py-2.5 px-3">Date</th>
                                            <th className="py-2.5 px-3">Student</th>
                                            <th className="py-2.5 px-3">Contact</th>
                                            <th className="py-2.5 px-3">Location</th>
                                            <th className="py-2.5 px-3 hidden sm:table-cell">Programme</th>
                                            <th className="py-2.5 px-3 hidden md:table-cell">Registered By</th>
                                            <th className="py-2.5 px-3 text-right">Stage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {filteredClients.map((c, idx) => (
                                            <tr key={`${c.phone || c.email || c.name}-${idx}`} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/30">
                                                <td className="py-2.5 px-3 whitespace-nowrap text-xs text-gray-500 dark:text-slate-400">
                                                    {formatEatDate(c.joined)}
                                                </td>
                                                <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">
                                                    {c.name || '(no name)'}
                                                </td>
                                                <td className="py-2.5 px-3 text-xs text-gray-600 dark:text-slate-300">
                                                    {c.phone && <div className="font-mono">{c.phone}</div>}
                                                    {c.email && <div className="text-gray-500 dark:text-slate-400 truncate max-w-[200px]">{c.email}</div>}
                                                </td>
                                                <td className="py-2.5 px-3 text-xs text-gray-600 dark:text-slate-300">
                                                    {c.location || '—'}
                                                </td>
                                                <td className="py-2.5 px-3 text-xs text-gray-600 dark:text-slate-300 hidden sm:table-cell">
                                                    {c.course || 'AI Fundamentals (free)'}
                                                </td>
                                                <td className="py-2.5 px-3 text-xs font-medium text-gray-700 dark:text-slate-200 hidden md:table-cell">
                                                    {c.registered_by || selectedAgent.name}
                                                </td>
                                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${STAGE_STYLES[c.stage] || 'bg-gray-100 text-gray-800'}`}>
                                                        {c.stage}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAgents;
