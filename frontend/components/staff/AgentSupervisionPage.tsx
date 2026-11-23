import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AlertTriangle, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronUp,
    ClipboardCheck, Clock, Copy, Download, Handshake, KeyRound, LayoutGrid,
    ListFilter, Loader2, LogOut, MessageCircle, RefreshCw, Search, UserCheck,
    UserPlus, Users, X
} from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { clearPortalRolesCache, fetchMyPortalRoles, PortalRoles } from '../../src/lib/roles';
import {
    createFieldOnlyAgent, fieldAgentCredentialsMessage, generateTempPassword, whatsappShare, joinLink
} from '../../src/lib/staffApi';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, INK, Logo, MUTED, PAPER, ThemeButton } from '../learn/learnUi';
import AgentLinksPanel from './AgentLinksPanel';

type SupTab = 'summary' | 'onboard' | 'registrations';

interface AgentSummary {
    id: string;
    name: string;
    slug: string;
    staff_code?: string | null;
    role: string | null;
    agent_type?: 'student_agent' | 'field_only';
    email?: string | null;
    phone?: string | null;
    active: boolean;
    linked: boolean;
    registered: number;
    accounts: number;
    waiting?: number;
    total_students?: number;
    recorded: number;
    live: number;
    completed: number;
    registered_today?: number;
    registered_7d?: number;
    last_activity_at?: string | null;
    by_location?: Record<string, number>;
}

interface DailyRegSummary {
    reg_date: string;
    staff_id: string;
    field_officer: string;
    staff_code?: string | null;
    role?: string | null;
    agent_type?: 'student_agent' | 'field_only';
    total_registered: number;
    field_registered: number;
    link_signups: number;
    accounts_opened: number;
    waiting_signup: number;
    conversion_pct: number;
    first_reg_at: string;
    last_reg_at: string;
    programmes: string[];
    top_locations: { location: string; count: number }[];
}

interface AgentClient {
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    stage: string;
    joined: string;
    course?: string | null;
    registered_by?: string | null;
}

interface RecentReg {
    id: string;
    created_at: string;
    full_name: string;
    phone: string;
    email: string | null;
    location: string | null;
    course_title: string;
    status: string;
    staff_id: string;
    field_officer: string;
    agent_type: 'student_agent' | 'field_only';
}

const INPUT = 'w-full rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600';

const formatSummaryDate = (ymd: string) =>
    new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });

const formatEatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Kampala' });

const formatEatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Kampala' });

const formatEatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Kampala' });

const getTodayEatYmd = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);

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

const AgentSupervisionPage: React.FC<{ session: any }> = ({ session }) => {
    const navigate = useNavigate();
    const uid = session?.user?.id as string | undefined;

    const [roles, setRoles] = useState<PortalRoles | null>(null);
    const [tab, setTab] = useState<SupTab>('summary');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [agents, setAgents] = useState<AgentSummary[]>([]);
    const [regSummary, setRegSummary] = useState<DailyRegSummary[]>([]);
    const [recentRegs, setRecentRegs] = useState<RecentReg[]>([]);

    // Summary filters
    const [summaryOfficer, setSummaryOfficer] = useState('all');
    const [summaryDate, setSummaryDate] = useState('');
    const [summaryQuickRange, setSummaryQuickRange] = useState<'all' | 'today' | '7d'>('all');

    // Officer drill-down
    const [openOfficerId, setOpenOfficerId] = useState<string | null>(null);
    const [officerClients, setOfficerClients] = useState<AgentClient[] | null>(null);
    const [officerClientsLoading, setOfficerClientsLoading] = useState(false);

    // Recent registrations search
    const [regSearch, setRegSearch] = useState('');
    const [regOfficerFilter, setRegOfficerFilter] = useState('all');

    // Create Non-Student Field Agent form
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newRole, setNewRole] = useState('Field Agent');
    const [newPassword, setNewPassword] = useState(() => generateTempPassword());
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createdAgent, setCreatedAgent] = useState<{
        name: string; email: string; phone: string; password: string; staff_code?: string;
    } | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        const [fRes, sRes, rRes] = await Promise.all([
            supabase.rpc('admin_agent_funnel', { p_since: null }),
            supabase.rpc('admin_agent_registration_summary', { p_since: null }),
            supabase.rpc('supervisor_recent_registrations', { p_limit: 500 }),
        ]);
        if (fRes.error) {
            setError(fRes.error.message);
        } else {
            setError(null);
            setAgents((fRes.data || []) as AgentSummary[]);
        }
        if (!sRes.error && sRes.data) setRegSummary(sRes.data as DailyRegSummary[]);
        if (!rRes.error && rRes.data) setRecentRegs(rRes.data as RecentReg[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        document.title = 'Agent Supervision | Welile School of AI';
        if (!uid) {
            navigate('/login', { replace: true });
            return;
        }
        let alive = true;
        fetchMyPortalRoles(uid).then(r => {
            if (!alive) return;
            setRoles(r);
            if (r.is_supervisor || r.is_admin) {
                void loadAll();
            } else {
                setLoading(false);
            }
        });
        return () => { alive = false; };
    }, [uid, navigate, loadAll]);

    const openOfficerRoster = async (staffId: string) => {
        if (openOfficerId === staffId) {
            setOpenOfficerId(null);
            setOfficerClients(null);
            return;
        }
        setOpenOfficerId(staffId);
        setOfficerClients(null);
        setOfficerClientsLoading(true);
        const { data } = await supabase.rpc('admin_agent_clients', { p_staff: staffId, p_since: null });
        setOfficerClients((data || []) as AgentClient[]);
        setOfficerClientsLoading(false);
    };

    const handleCreateFieldAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setCreating(true);
        const res = await createFieldOnlyAgent({
            name: newName,
            email: newEmail,
            phone: newPhone,
            role: newRole,
            password: newPassword,
        });
        setCreating(false);
        if (!res.ok) {
            setCreateError(res.message || 'Could not create field agent.');
            return;
        }
        setCreatedAgent({
            name: res.name || newName.trim(),
            email: res.email || newEmail.trim().toLowerCase(),
            phone: newPhone.trim(),
            password: newPassword,
            staff_code: res.staff_code,
        });
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewRole('Field Agent');
        setNewPassword(generateTempPassword());
        await loadAll();
    };

    const handleToggleActive = async (agent: AgentSummary) => {
        setTogglingId(agent.id);
        await supabase.rpc('supervisor_toggle_agent', { p_staff_id: agent.id, p_active: !agent.active });
        setTogglingId(null);
        await loadAll();
    };

    const copyText = async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1800);
        } catch { /* ignore */ }
    };

    const handleSignOut = async () => {
        clearPortalRolesCache();
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const todayYmd = useMemo(() => getTodayEatYmd(), []);

    const totals = useMemo(() => {
        return agents.reduce(
            (acc, a) => ({
                active: acc.active + (a.active && a.linked ? 1 : 0),
                fieldOnly: acc.fieldOnly + (a.agent_type === 'field_only' ? 1 : 0),
                registered: acc.registered + (a.registered || 0),
                today: acc.today + (a.registered_today || 0),
                week: acc.week + (a.registered_7d || 0),
                accounts: acc.accounts + (a.accounts || 0),
                waiting: acc.waiting + (a.waiting ?? Math.max(0, a.registered - a.accounts)),
                studying: acc.studying + (a.recorded || 0),
                completed: acc.completed + (a.completed || 0),
            }),
            { active: 0, fieldOnly: 0, registered: 0, today: 0, week: 0, accounts: 0, waiting: 0, studying: 0, completed: 0 }
        );
    }, [agents]);

    const summaryOfficers = useMemo(() => {
        const map = new Map<string, string>();
        regSummary.forEach(r => { if (!map.has(r.staff_id)) map.set(r.staff_id, r.field_officer); });
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [regSummary]);

    const filteredRegSummary = useMemo(() => {
        const sevenDaysAgoYmd = new Date(Date.now() + 3 * 3600 * 1000 - 6 * 86400000).toISOString().slice(0, 10);
        return regSummary.filter(r => {
            if (summaryOfficer !== 'all' && r.staff_id !== summaryOfficer) return false;
            if (summaryDate && r.reg_date !== summaryDate) return false;
            if (!summaryDate && summaryQuickRange === 'today' && r.reg_date !== todayYmd) return false;
            if (!summaryDate && summaryQuickRange === '7d' && r.reg_date < sevenDaysAgoYmd) return false;
            return true;
        });
    }, [regSummary, summaryOfficer, summaryDate, summaryQuickRange, todayYmd]);

    const summaryTotals = useMemo(() => {
        return filteredRegSummary.reduce(
            (acc, r) => ({
                total: acc.total + r.total_registered,
                opened: acc.opened + r.accounts_opened,
                waiting: acc.waiting + r.waiting_signup,
            }),
            { total: 0, opened: 0, waiting: 0 }
        );
    }, [filteredRegSummary]);

    const maxSummaryCount = useMemo(
        () => Math.max(1, ...filteredRegSummary.map(r => r.total_registered)),
        [filteredRegSummary]
    );

    const sortedAgents = useMemo(
        () => [...agents].sort((a, b) => b.registered - a.registered || b.accounts - a.accounts || a.name.localeCompare(b.name)),
        [agents]
    );

    const filteredRecentRegs = useMemo(() => {
        const q = regSearch.trim().toLowerCase();
        return recentRegs.filter(r => {
            if (regOfficerFilter !== 'all' && r.staff_id !== regOfficerFilter) return false;
            if (!q) return true;
            return `${r.full_name} ${r.phone} ${r.email || ''} ${r.location || ''} ${r.field_officer}`.toLowerCase().includes(q);
        });
    }, [recentRegs, regSearch, regOfficerFilter]);

    if (!roles) {
        return (
            <div className={`min-h-screen ${PAPER} flex items-center justify-center`}>
                <Loader2 className="animate-spin text-violet-700" size={32} />
            </div>
        );
    }

    if (!roles.is_supervisor && !roles.is_admin) {
        return (
            <div className={`min-h-screen ${PAPER} ${INK}`}>
                <header className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Logo className="h-9" />
                    <ThemeButton />
                </header>
                <main className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
                    <AlertTriangle className="mx-auto text-amber-600" size={44} />
                    <h1 className="font-serif text-2xl font-bold">Agent Supervision Access Required</h1>
                    <p className={`text-sm ${MUTED}`}>
                        This workspace is reserved for designated Agent Supervisors.
                    </p>
                    <Link to="/portal" className={BTN_PRIMARY}>Return to my workspace</Link>
                </main>
            </div>
        );
    }

    const openOfficer = agents.find(a => a.id === openOfficerId) || null;
    const convPct = totals.registered > 0 ? Math.round((totals.accounts / totals.registered) * 100) : 0;

    return (
        <div className={`min-h-screen ${PAPER} ${INK} pb-20 md:pb-12`}>
            {/* Top Navigation Header */}
            <header className="sticky top-0 z-30 bg-[#faf8f5]/95 dark:bg-slate-950/95 backdrop-blur border-b border-stone-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
                    <Logo className="h-9" />
                    <div className="hidden sm:block leading-tight">
                        <p className="font-serif font-bold flex items-center gap-1.5">
                            <ClipboardCheck size={16} className="text-indigo-600" />
                            Agent Supervision
                        </p>
                        <p className={`text-xs ${MUTED}`}>{roles.name}</p>
                    </div>

                    <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Supervision tabs">
                        {([
                            ['summary', 'Summary & Officers', CalendarDays],
                            ['onboard', 'Create Field Agent', UserPlus],
                            ['registrations', 'All Registrations', ListFilter],
                        ] as const).map(([id, label, Icon]) => (
                            <button
                                key={id}
                                onClick={() => setTab(id)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    tab === id
                                        ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                                        : 'text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Icon size={15} />
                                {label}
                            </button>
                        ))}
                    </nav>

                    <div className="flex-1" />

                    <button
                        onClick={() => void loadAll()}
                        title="Refresh data"
                        className="p-2 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>

                    {roles.role_count >= 2 && (
                        <Link
                            to="/portal"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-violet-100 dark:bg-violet-950/60 text-violet-900 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-900/60"
                        >
                            <LayoutGrid size={15} />
                            <span className="hidden sm:inline">Switch Role</span>
                        </Link>
                    )}

                    <ThemeButton />

                    <button
                        onClick={handleSignOut}
                        title="Sign out"
                        className="p-2 rounded-xl text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {error && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-3.5 text-sm text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* Top 4 KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className={`${CARD} rounded-2xl p-4`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${MUTED}`}>Active Officers</span>
                            <Handshake size={16} className="text-indigo-600" />
                        </div>
                        <p className="text-3xl font-extrabold mt-2">{totals.active}</p>
                        <p className={`text-xs mt-1 ${MUTED}`}>{totals.fieldOnly} field-only · {agents.length} total</p>
                    </div>

                    <div className={`${CARD} rounded-2xl p-4`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${MUTED}`}>Total Registered</span>
                            <Users size={16} className="text-violet-600" />
                        </div>
                        <p className="text-3xl font-extrabold mt-2">{totals.registered.toLocaleString()}</p>
                        <p className={`text-xs mt-1 ${MUTED}`}>{totals.today} today · {totals.week} in 7 days</p>
                    </div>

                    <div className={`${CARD} rounded-2xl p-4`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${MUTED}`}>Accounts Opened</span>
                            <UserCheck size={16} className="text-emerald-600" />
                        </div>
                        <p className="text-3xl font-extrabold mt-2">{totals.accounts}</p>
                        <p className={`text-xs mt-1 ${MUTED}`}>{convPct}% converted · {totals.waiting} waiting</p>
                    </div>

                    <div className={`${CARD} rounded-2xl p-4 flex flex-col justify-between`}>
                        <div>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${MUTED}`}>Quick Action</p>
                            <p className="text-sm font-bold mt-1.5">Onboard Field Agent</p>
                        </div>
                        <button
                            onClick={() => setTab('onboard')}
                            className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <UserPlus size={14} /> Add Non-Student Agent
                        </button>
                    </div>
                </div>

                {/* TAB 1: DAILY REGISTRATION SUMMARY + ALL OFFICERS */}
                {tab === 'summary' && (
                    <div className="space-y-6">
                        {/* Daily Registration Summary Table */}
                        <section className={`${CARD} rounded-2xl overflow-hidden`}>
                            <div className="px-5 py-4 border-b border-stone-100 dark:border-slate-800 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-bold text-base flex items-center gap-2">
                                            <CalendarDays size={18} className="text-indigo-600" />
                                            Registration Summary
                                        </h2>
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                                            {summaryTotals.total.toLocaleString()} {summaryTotals.total === 1 ? 'person' : 'people'}
                                        </span>
                                    </div>
                                    <p className={`text-xs mt-0.5 ${MUTED}`}>
                                        Daily log by date and field officer — captures all field-only &amp; student-agent registrations.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="inline-flex rounded-lg border border-stone-300 dark:border-slate-700 overflow-hidden text-xs font-semibold">
                                        {([['all', 'All'], ['today', 'Today'], ['7d', '7 days']] as const).map(([val, label]) => (
                                            <button
                                                key={val}
                                                onClick={() => { setSummaryDate(''); setSummaryQuickRange(val); }}
                                                className={`px-2.5 py-1.5 ${!summaryDate && summaryQuickRange === val ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="date"
                                        value={summaryDate}
                                        onChange={e => setSummaryDate(e.target.value)}
                                        aria-label="Filter by date"
                                        className="rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                                    />
                                    <select
                                        value={summaryOfficer}
                                        onChange={e => setSummaryOfficer(e.target.value)}
                                        aria-label="Filter by field officer"
                                        className="rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold"
                                    >
                                        <option value="all">All Field Officers</option>
                                        {summaryOfficers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                                    </select>
                                    <button
                                        onClick={() => downloadCsv(
                                            `welile-supervision-summary-${todayYmd}.csv`,
                                            ['Date', 'Field Officer', 'Type', 'People Registered', 'Accounts Opened', 'Waiting', 'Conversion %', 'Locations', 'Field Window (EAT)'],
                                            filteredRegSummary.map(r => [
                                                r.reg_date, r.field_officer, r.agent_type === 'field_only' ? 'Field-Only' : 'Student Agent',
                                                r.total_registered, r.accounts_opened, r.waiting_signup, `${r.conversion_pct}%`,
                                                (r.top_locations || []).map(l => `${l.location} (${l.count})`).join('; '),
                                                `${formatEatTime(r.first_reg_at)} - ${formatEatTime(r.last_reg_at)}`,
                                            ])
                                        )}
                                        disabled={filteredRegSummary.length === 0}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 dark:border-slate-700 disabled:opacity-50"
                                    >
                                        <Download size={13} /> CSV
                                    </button>
                                </div>
                            </div>

                            {filteredRegSummary.length === 0 ? (
                                <p className={`p-6 text-sm text-center ${MUTED}`}>No registrations recorded for this selection.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[740px]">
                                        <thead>
                                            <tr className="text-left text-xs uppercase text-stone-500 dark:text-slate-400 bg-stone-50 dark:bg-slate-800/40">
                                                <th className="py-3 px-4">Date</th>
                                                <th className="py-3 px-3">Field Officer</th>
                                                <th className="py-3 px-3">People Registered</th>
                                                <th className="py-3 px-3">Account Status</th>
                                                <th className="py-3 px-3 hidden md:table-cell">Locations</th>
                                                <th className="py-3 px-4 text-right hidden lg:table-cell">Field Window</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                                            {filteredRegSummary.map(row => {
                                                const isToday = row.reg_date === todayYmd;
                                                const firstT = formatEatTime(row.first_reg_at);
                                                const lastT = formatEatTime(row.last_reg_at);
                                                const barPct = Math.max(8, Math.round((row.total_registered / maxSummaryCount) * 100));
                                                return (
                                                    <tr
                                                        key={`${row.reg_date}-${row.staff_id}`}
                                                        onClick={() => void openOfficerRoster(row.staff_id)}
                                                        className="cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-slate-800/40"
                                                    >
                                                        <td className="py-3 px-4 whitespace-nowrap font-semibold">
                                                            {formatSummaryDate(row.reg_date)}
                                                            {isToday && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Today</span>}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <p className="font-semibold">{row.field_officer}</p>
                                                            <p className={`text-xs ${MUTED}`}>
                                                                {row.agent_type === 'field_only' ? 'Field-Only Agent' : (row.role || 'Student Agent')}
                                                                {row.staff_code ? ` · ${row.staff_code}` : ''}
                                                            </p>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span className="text-lg font-extrabold">{row.total_registered}</span>
                                                            <span className={`ml-1.5 text-xs ${MUTED}`}>{row.total_registered === 1 ? 'person' : 'people'}</span>
                                                            <div className="h-1.5 w-32 rounded-full bg-stone-200 dark:bg-slate-800 mt-1 overflow-hidden">
                                                                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${barPct}%` }} />
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 whitespace-nowrap text-xs">
                                                            <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">{row.accounts_opened} opened</span>
                                                            {' '}
                                                            <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">{row.waiting_signup} waiting</span>
                                                        </td>
                                                        <td className="py-3 px-3 hidden md:table-cell">
                                                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                                                                {(row.top_locations || []).map(loc => (
                                                                    <span key={loc.location} className="px-2 py-0.5 rounded text-[11px] bg-stone-100 dark:bg-slate-800">
                                                                        {loc.location} <b>{loc.count}</b>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-right whitespace-nowrap hidden lg:table-cell text-xs font-mono text-stone-500">
                                                            {firstT === lastT ? `${firstT} EAT` : `${firstT} – ${lastT} EAT`}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-stone-50 dark:bg-slate-800/60 border-t-2 border-stone-200 dark:border-slate-700 font-bold text-xs">
                                                <td className="py-3 px-4" colSpan={2}>Total ({filteredRegSummary.length} records)</td>
                                                <td className="py-3 px-3 text-sm font-extrabold">{summaryTotals.total.toLocaleString()} people</td>
                                                <td className="py-3 px-3" colSpan={3}>
                                                    {summaryTotals.opened} opened · {summaryTotals.waiting} waiting
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </section>

                        {/* All Field Officers Table */}
                        <section className={`${CARD} rounded-2xl overflow-hidden`}>
                            <div className="px-5 py-4 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold text-base">All Field Officers &amp; Agents</h2>
                                    <p className={`text-xs ${MUTED}`}>Click any officer to view every student they registered. Use Copy link to copy their sign-up link, or All links for every link.</p>
                                </div>
                                <span className={`text-xs font-semibold ${MUTED}`}>{sortedAgents.length} total</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[680px]">
                                    <thead>
                                        <tr className="text-left text-xs uppercase text-stone-500 dark:text-slate-400 bg-stone-50 dark:bg-slate-800/40">
                                            <th className="py-3 px-4">Officer</th>
                                            <th className="py-3 px-3">Account Type</th>
                                            <th className="py-3 px-3 text-right">Registered</th>
                                            <th className="py-3 px-3 text-right">Today</th>
                                            <th className="py-3 px-3 text-right">Accounts</th>
                                            <th className="py-3 px-3 text-right">Link</th>
                                            <th className="py-3 px-4 text-right">Roster</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                                        {sortedAgents.map(a => {
                                            const isOpen = openOfficerId === a.id;
                                            return (
                                                <tr
                                                    key={a.id}
                                                    onClick={() => void openOfficerRoster(a.id)}
                                                    className={`cursor-pointer ${isOpen ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : 'hover:bg-stone-50 dark:hover:bg-slate-800/40'} ${a.active ? '' : 'opacity-55'}`}
                                                >
                                                    <td className="py-3 px-4">
                                                        <p className="font-semibold">{a.name}</p>
                                                        <p className={`text-xs ${MUTED}`}>{[a.email, a.staff_code].filter(Boolean).join(' · ')}</p>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                                            a.agent_type === 'field_only'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                                : 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300'
                                                        }`}>
                                                            {a.agent_type === 'field_only' ? 'Field-Only (3-Field)' : 'Student Agent'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-extrabold">{a.registered}</td>
                                                    <td className="py-3 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                                                        {a.registered_today || 0}
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-semibold">{a.accounts}</td>
                                                    <td className="py-3 px-3 text-right whitespace-nowrap">
                                                        {a.slug ? (
                                                            <div className="inline-flex flex-col items-end gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={e => { e.stopPropagation(); void copyText(joinLink(a.slug), `row-${a.id}`); }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                                                                >
                                                                    {copiedKey === `row-${a.id}` ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        if (openOfficerId !== a.id) void openOfficerRoster(a.id);
                                                                        setTimeout(() => document.getElementById('agent-links-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
                                                                    }}
                                                                    className="text-[11px] font-semibold underline text-stone-600 dark:text-slate-300"
                                                                >
                                                                    All links
                                                                </button>
                                                            </div>
                                                        ) : <span className="text-[11px] text-stone-400">No link yet</span>}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                                            {isOpen ? <>Hide <ChevronUp size={13} /></> : <>View <ChevronDown size={13} /></>}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Selected Officer Student Roster */}
                        {openOfficer && (
                            <div className="space-y-4">
                            <div id="agent-links-panel" className="scroll-mt-4"><AgentLinksPanel agent={openOfficer} /></div>
                            <section className={`${CARD} rounded-2xl p-5 space-y-4 ring-2 ring-indigo-500/30`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold text-lg">Students Registered by {openOfficer.name}</h3>
                                        <p className={`text-xs ${MUTED}`}>
                                            {openOfficer.registered} registered · {openOfficer.accounts} accounts opened
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {officerClients && officerClients.length > 0 && (
                                            <button
                                                onClick={() => downloadCsv(
                                                    `welile-${openOfficer.slug}-students-${todayYmd}.csv`,
                                                    ['Date', 'Name', 'Phone', 'Email', 'Location', 'Stage'],
                                                    officerClients.map(c => [formatEatDate(c.joined), c.name, c.phone || '', c.email || '', c.location || '', c.stage])
                                                )}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 dark:border-slate-700"
                                            >
                                                <Download size={13} /> Export CSV
                                            </button>
                                        )}
                                        <button onClick={() => setOpenOfficerId(null)} className="p-1.5 rounded-lg border border-stone-300 dark:border-slate-700">
                                            <X size={15} />
                                        </button>
                                    </div>
                                </div>

                                {officerClientsLoading || !officerClients ? (
                                    <div className={`py-6 flex items-center gap-2 text-sm ${MUTED}`}><Loader2 className="animate-spin" size={16} /> Loading students...</div>
                                ) : officerClients.length === 0 ? (
                                    <p className={`text-sm ${MUTED}`}>No students registered yet.</p>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-slate-800">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-xs uppercase text-stone-500 bg-stone-50 dark:bg-slate-800/40">
                                                    <th className="py-2.5 px-3">Date</th>
                                                    <th className="py-2.5 px-3">Student</th>
                                                    <th className="py-2.5 px-3">Phone / Email</th>
                                                    <th className="py-2.5 px-3">Location</th>
                                                    <th className="py-2.5 px-3 text-right">Stage</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                                                {officerClients.map((c, idx) => (
                                                    <tr key={`${c.phone || c.name}-${idx}`}>
                                                        <td className="py-2.5 px-3 text-xs text-stone-500 whitespace-nowrap">{formatEatDate(c.joined)}</td>
                                                        <td className="py-2.5 px-3 font-medium">{c.name || '(no name)'}</td>
                                                        <td className="py-2.5 px-3 text-xs font-mono text-stone-600 dark:text-slate-300">
                                                            {c.phone || c.email || '—'}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-xs">{c.location || '—'}</td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                                                                {c.stage}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: CREATE FIELD-ONLY AGENT (NON-STUDENT) */}
                {tab === 'onboard' && (
                    <div className="grid lg:grid-cols-2 gap-6 items-start">
                        <form onSubmit={handleCreateFieldAgent} className={`${CARD} rounded-2xl p-6 space-y-4`}>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    Non-Student Field Agent
                                </span>
                                <h2 className="font-serif text-xl font-bold mt-2">Create a Field-Only Agent</h2>
                                <p className={`text-sm mt-1 ${MUTED}`}>
                                    Creates a dedicated field officer account (not enrolled as a student). When they sign in, they go straight to an ultra-simple <strong>3-field registration form</strong> (Name, Phone Number, Location) and their personal stats.
                                </p>
                            </div>

                            {createdAgent && (
                                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
                                    <div className="flex items-start gap-2.5">
                                        <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <p className="font-bold text-emerald-900 dark:text-emerald-200">
                                                {createdAgent.name} is ready to register students!
                                            </p>
                                            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                                                Their email is already confirmed — they can log in immediately at <span className="font-mono">{window.location.origin}/login</span>.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 p-3 text-xs space-y-1 font-mono">
                                        <div>Email: <b>{createdAgent.email}</b></div>
                                        <div>Temporary Password: <b>{createdAgent.password}</b></div>
                                        {createdAgent.staff_code && <div>Agent Code: <b>{createdAgent.staff_code}</b></div>}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => copyText(fieldAgentCredentialsMessage(createdAgent.name, createdAgent.email, createdAgent.password, createdAgent.staff_code), 'creds')}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                                        >
                                            {copiedKey === 'creds' ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Login Details</>}
                                        </button>
                                        <a
                                            href={whatsappShare(
                                                fieldAgentCredentialsMessage(createdAgent.name, createdAgent.email, createdAgent.password, createdAgent.staff_code),
                                                createdAgent.phone ? (createdAgent.phone.replace(/\D/g, '').startsWith('0') ? '256' + createdAgent.phone.replace(/\D/g, '').slice(1) : createdAgent.phone.replace(/\D/g, '')) : null
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60"
                                        >
                                            <MessageCircle size={14} /> Send on WhatsApp
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="fa-name" className="block text-sm font-semibold mb-1">Full Name *</label>
                                <input id="fa-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Sarah Nakato" className={INPUT} required />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="fa-email" className="block text-sm font-semibold mb-1">Login Email *</label>
                                    <input id="fa-email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="sarah@example.com" className={INPUT} required />
                                </div>
                                <div>
                                    <label htmlFor="fa-phone" className="block text-sm font-semibold mb-1">Phone Number</label>
                                    <input id="fa-phone" type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="07XX XXX XXX" className={INPUT} />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="fa-role" className="block text-sm font-semibold mb-1">Title / Role</label>
                                    <input id="fa-role" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Field Agent" className={INPUT} />
                                </div>
                                <div>
                                    <label htmlFor="fa-pass" className="block text-sm font-semibold mb-1">Temporary Password *</label>
                                    <div className="flex gap-2">
                                        <input id="fa-pass" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`${INPUT} font-mono`} required />
                                        <button
                                            type="button"
                                            onClick={() => setNewPassword(generateTempPassword())}
                                            className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800"
                                        >
                                            <KeyRound size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {createError && (
                                <p role="alert" className="text-sm text-red-600 flex items-start gap-2">
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {createError}
                                </p>
                            )}

                            <button type="submit" disabled={creating} className={`${BTN_PRIMARY} w-full`}>
                                {creating ? <><Loader2 className="animate-spin" size={17} /> Creating Field Agent...</> : <><UserPlus size={17} /> Create Field-Only Agent</>}
                            </button>
                        </form>

                        {/* Existing Agents Roster + Activate/Deactivate */}
                        <div className={`${CARD} rounded-2xl p-6 space-y-4`}>
                            <div>
                                <h2 className="font-serif text-xl font-bold">Manage Field Officers</h2>
                                <p className={`text-xs mt-1 ${MUTED}`}>
                                    All active and inactive agents across Welile School of AI.
                                </p>
                            </div>
                            <ul className="divide-y divide-stone-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
                                {sortedAgents.map(a => (
                                    <li key={a.id} className={`py-3 flex items-center justify-between gap-3 ${a.active ? '' : 'opacity-55'}`}>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <p className="font-semibold text-sm truncate">{a.name}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    a.agent_type === 'field_only'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300'
                                                }`}>
                                                    {a.agent_type === 'field_only' ? 'Field-Only' : 'Student Agent'}
                                                </span>
                                            </div>
                                            <p className={`text-xs truncate ${MUTED}`}>
                                                {[a.email, a.staff_code, `${a.registered} registered`].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={togglingId === a.id}
                                            onClick={() => void handleToggleActive(a)}
                                            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800"
                                        >
                                            {togglingId === a.id ? '...' : a.active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* TAB 3: ALL REGISTRATIONS LIVE FEED */}
                {tab === 'registrations' && (
                    <section className={`${CARD} rounded-2xl p-5 space-y-4`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="font-bold text-base">All Field Registrations ({filteredRecentRegs.length})</h2>
                                <p className={`text-xs ${MUTED}`}>Every student registered by field-only agents and student agents.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        value={regSearch}
                                        onChange={e => setRegSearch(e.target.value)}
                                        placeholder="Search student, phone, location..."
                                        className={`${INPUT} pl-8 !py-1.5 text-xs w-56`}
                                    />
                                </div>
                                <select
                                    value={regOfficerFilter}
                                    onChange={e => setRegOfficerFilter(e.target.value)}
                                    className="rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold"
                                >
                                    <option value="all">All Officers</option>
                                    {summaryOfficers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                                </select>
                                <button
                                    onClick={() => downloadCsv(
                                        `welile-all-registrations-${todayYmd}.csv`,
                                        ['Date & Time (EAT)', 'Student', 'Phone', 'Email', 'Location', 'Field Officer', 'Agent Type', 'Programme', 'Status'],
                                        filteredRecentRegs.map(r => [
                                            formatEatDateTime(r.created_at), r.full_name, r.phone, r.email || '',
                                            r.location || '', r.field_officer, r.agent_type === 'field_only' ? 'Field-Only' : 'Student Agent',
                                            r.course_title, r.status,
                                        ])
                                    )}
                                    disabled={filteredRecentRegs.length === 0}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 dark:border-slate-700 disabled:opacity-50"
                                >
                                    <Download size={13} /> Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[700px]">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-stone-500 bg-stone-50 dark:bg-slate-800/40">
                                        <th className="py-2.5 px-3">Date &amp; Time (EAT)</th>
                                        <th className="py-2.5 px-3">Student</th>
                                        <th className="py-2.5 px-3">Phone</th>
                                        <th className="py-2.5 px-3">Location</th>
                                        <th className="py-2.5 px-3">Field Officer</th>
                                        <th className="py-2.5 px-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                                    {filteredRecentRegs.slice(0, 150).map(r => (
                                        <tr key={r.id}>
                                            <td className="py-2.5 px-3 text-xs text-stone-500 whitespace-nowrap font-mono">{formatEatDateTime(r.created_at)}</td>
                                            <td className="py-2.5 px-3 font-medium">{r.full_name}</td>
                                            <td className="py-2.5 px-3 text-xs font-mono">{r.phone}</td>
                                            <td className="py-2.5 px-3 text-xs">{r.location || '—'}</td>
                                            <td className="py-2.5 px-3 text-xs">
                                                <span className="font-semibold">{r.field_officer}</span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                    r.status === 'account_created'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {r.status === 'account_created' ? 'Account opened' : 'Waiting to sign up'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRecentRegs.length === 0 && (
                                        <tr><td colSpan={6} className={`py-8 text-center text-sm ${MUTED}`}>No registrations found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </main>

            {/* Mobile bottom navigation */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-stone-200 dark:border-slate-800 grid grid-cols-3 pb-[env(safe-area-inset-bottom)]">
                {([
                    ['summary', 'Summary', CalendarDays],
                    ['onboard', 'Add Agent', UserPlus],
                    ['registrations', 'All Regs', ListFilter],
                ] as const).map(([id, label, Icon]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${tab === id ? 'text-indigo-700 dark:text-indigo-300' : 'text-stone-500 dark:text-slate-400'}`}
                    >
                        <Icon size={20} />
                        {label}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default AgentSupervisionPage;
