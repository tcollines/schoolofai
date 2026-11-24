import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import {
    AlertTriangle, CalendarDays, ClipboardCheck, LayoutGrid, ListFilter, Loader2, LogOut, RefreshCw, UserPlus, Users
} from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { clearPortalRolesCache, fetchMyPortalRoles, PortalRoles } from '../../src/lib/roles';
import { createFieldOnlyAgent, generateTempPassword } from '../../src/lib/staffApi';
import { BTN_PRIMARY, INK, Logo, MUTED, PAPER, ThemeButton } from '../learn/learnUi';
import { AgentClient, AgentSummary, DailyRegSummary, getTodayEatYmd, RecentReg } from './supervision/shared';
import { SupervisionContext, SupervisionValue } from './supervision/SupervisionContext';
import OverviewPage from './supervision/OverviewPage';
import OfficersPage from './supervision/OfficersPage';
import CreateAgentPage from './supervision/CreateAgentPage';
import RegistrationsPage from './supervision/RegistrationsPage';

// Agent Supervision is four pages: /supervision (overview), /supervision/officers, /supervision/create-agent and
// /supervision/registrations. This file is the shell: access check, header, navigation, data loading and the state
// the pages share (so the selected officer and filters stay put as you move between pages).
const NAV = [
    { to: '/supervision', end: true, label: 'Overview', short: 'Overview', Icon: CalendarDays },
    { to: '/supervision/officers', end: false, label: 'Officers', short: 'Officers', Icon: Users },
    { to: '/supervision/create-agent', end: false, label: 'Create Field Agent', short: 'Add Agent', Icon: UserPlus },
    { to: '/supervision/registrations', end: false, label: 'All Registrations', short: 'All Regs', Icon: ListFilter },
] as const;

const AgentSupervisionPage: React.FC<{ session: any }> = ({ session }) => {
    const navigate = useNavigate();
    const uid = session?.user?.id as string | undefined;

    const [roles, setRoles] = useState<PortalRoles | null>(null);
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

    const supervision: SupervisionValue = {
        agents, regSummary, recentRegs, loading,
        summaryOfficer, setSummaryOfficer, summaryDate, setSummaryDate, summaryQuickRange, setSummaryQuickRange,
        openOfficerId, setOpenOfficerId, officerClients, officerClientsLoading, openOfficer, openOfficerRoster,
        regSearch, setRegSearch, regOfficerFilter, setRegOfficerFilter,
        newName, setNewName, newEmail, setNewEmail, newPhone, setNewPhone, newRole, setNewRole, newPassword, setNewPassword,
        creating, createError, createdAgent, copiedKey, togglingId,
        handleCreateFieldAgent, handleToggleActive, copyText, reload: loadAll,
        todayYmd, totals, convPct, summaryOfficers, filteredRegSummary, summaryTotals, maxSummaryCount, sortedAgents, filteredRecentRegs,
    };

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

                    <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Supervision pages">
                        {NAV.map(({ to, end, label, Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) => `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    isActive
                                        ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                                        : 'text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Icon size={15} />
                                {label}
                            </NavLink>
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
                            <span>Switch dashboard</span>
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

                <SupervisionContext.Provider value={supervision}>
                    <Routes>
                        <Route index element={<OverviewPage />} />
                        <Route path="officers" element={<OfficersPage />} />
                        <Route path="create-agent" element={<CreateAgentPage />} />
                        <Route path="registrations" element={<RegistrationsPage />} />
                        <Route path="*" element={<Navigate to="/supervision" replace />} />
                    </Routes>
                </SupervisionContext.Provider>
            </main>

            {/* Mobile bottom navigation */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-stone-200 dark:border-slate-800 grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
                {NAV.map(({ to, end, short, Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-stone-500 dark:text-slate-400'}`}
                    >
                        <Icon size={20} />
                        {short}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default AgentSupervisionPage;
