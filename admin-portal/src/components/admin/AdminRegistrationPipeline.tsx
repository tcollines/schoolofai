import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Award, CheckCircle2, Download, ExternalLink, Filter, Loader2,
    Mail, MessageCircle, Phone, RefreshCw, Search, Smartphone, Video
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { CHANNELS, channelOf } from './peopleChannels';
import { GLOSSARY, GROUP_ORDER, GroupId, HQ_GROUPS, inGroup, isOnline, normalizeGroup, rowLabel } from '../../lib/peopleMetrics';
import type { LessonsFor } from '../../lib/physicalAttendance';
import HqLessons from './HqLessons';

type Stage = 'Registered' | 'Account opened' | 'In course' | 'Studying' | 'Joined live' | 'Passed final' | 'Completed';

export interface StudentRow {
    key: string;
    user_id?: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    sources: string[];
    agent: string | null;
    registered_at: string;
    enrolled_at?: string | null;
    has_account: boolean;
    stage: Stage;
    items_done?: number;
    total_items?: number;
    progress_pct?: number;
    highest_module?: string | null;
    modules_touched?: string[];
    quizzes_passed?: number;
    final_passed?: boolean;
    final_score?: number | null;
    certificate_id?: string | null;
    certificate_issued_at?: string | null;
    live_count?: number;
    live_sources?: string[];
    app_installed?: boolean;
    last_active: string | null;
    followup: 'new' | 'contacted' | 'interested' | 'converted' | 'not_interested';
    note: string | null;
    courses?: string[];
    paid_enrolled?: boolean;
}

const STAGES: { id: Stage; tab: string; help: string; badge: string }[] = [
    { id: 'Registered', tab: 'Registered, no account', help: 'Registered by an agent, lead form, or outreach — no login account yet. Follow up to help them open their account.', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' },
    { id: 'Account opened', tab: 'Account opened', help: 'Created an account but has not opened the free AI Fundamentals course yet.', badge: 'bg-brand-soft text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' },
    { id: 'In course', tab: 'In course (not started)', help: 'Enrolled in AI Fundamentals, 0 lessons completed so far.', badge: 'bg-brand-soft text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300' },
    { id: 'Studying', tab: 'Studying', help: 'Actively progressing through lessons and module quizzes.', badge: 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300' },
    { id: 'Joined live', tab: 'Joined live', help: 'Attended at least one live class session (via app, email link, WhatsApp, or admin check-in).', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300' },
    { id: 'Passed final', tab: 'Passed final', help: 'Passed the final assessment (80%+) and ready to claim their certificate.', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300' },
    { id: 'Completed', tab: 'Completed & Certified', help: 'Finished the course, passed the final exam, and issued a verified Welile certificate.', badge: 'bg-mint-soft text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' },
];

const MODULE_LABELS: Record<string, string> = {
    m0: 'Welcome',
    m1: 'Module 1',
    m2: 'Module 2',
    m3: 'Module 3',
    m4: 'Module 4',
    m5: 'Module 5',
    m6: 'Module 6',
};

const FOLLOW = [
    ['new', 'To contact'],
    ['contacted', 'Contacted'],
    ['interested', 'Interested'],
    ['converted', 'Converted'],
    ['not_interested', 'Not interested'],
] as const;

const wa = (p: string) => (p.startsWith('0') ? '256' + p.slice(1) : p);
const fmtDay = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Kampala' }) : '—';
const card = 'bg-white dark:bg-night-2 rounded-[22px]';
const field = 'rounded-[12px] bg-white dark:bg-night-2 px-2.5 py-2 text-sm min-h-[44px]';


/** Stage-by-stage student explorer & follow-up pipeline for the free course. */
export interface PipelineData {
    rows: StudentRow[] | null;
    setRows: (updater: (prev: StudentRow[] | null) => StudentRow[]) => void;
    reload: () => Promise<void>;
    loading: boolean;
    error: string | null;
}

/** Optional HQ attendance: when given, each person gets Lesson 1, 2, 3 chips and the HQ groups appear. */
export interface HqControl {
    lessonsFor: LessonsFor;
    toggle: (r: StudentRow, lesson: number, attended: boolean) => void;
}

/** Pass `data` to let a parent page own the list (the All People page does this so it can mix in other courses). */
const AdminRegistrationPipeline: React.FC<{ course: string; data?: PipelineData; hq?: HqControl }> = ({ course, data, hq }) => {
    const lessonsFor = hq?.lessonsFor;
    const visibleGroups = useMemo(() => (hq ? GROUP_ORDER : GROUP_ORDER.filter(g => !HQ_GROUPS.includes(g))), [hq]);
    const [searchParams, setSearchParams] = useSearchParams();
    // ?stage= takes a group id (all, online, call, invite, account, notStarted, studying, live, completed, paid); ?route= is the same idea.
    // Old links with the previous stage names still work.
    const initialStage: GroupId = normalizeGroup(searchParams.get('stage'), searchParams.get('route')) || 'all';

    const [ownRows, setOwnRows] = useState<StudentRow[] | null>(null);
    const [ownError, setOwnError] = useState<string | null>(null);
    const [ownLoading, setOwnLoading] = useState(true);
    const rows = data ? data.rows : ownRows;
    const error = data ? data.error : ownError;
    const loading = data ? data.loading : ownLoading;
    const setError = (m: string | null) => { if (!data) setOwnError(m); };
    const setRows = (u: ((prev: StudentRow[] | null) => StudentRow[]) | StudentRow[] | null) => {
        if (data) { if (typeof u === 'function') data.setRows(u); return; }
        setOwnRows(u as any);
    };
    const [tab, setTab] = useState<GroupId>(initialStage);
    const [q, setQ] = useState('');
    const [moduleFilter, setModuleFilter] = useState<string>('all');
    const [agentFilter, setAgentFilter] = useState<string>(searchParams.get('agent') || 'all');
    const [channelFilter, setChannelFilter] = useState<string>(searchParams.get('channel') || 'all');
    const [onlyAppInstalled, setOnlyAppInstalled] = useState(false);
    const [limit, setLimit] = useState(50);
    const [notes, setNotes] = useState<Record<string, string>>({});

    // Keep the agent and channel filters in step with the People page summary tables
    useEffect(() => {
        setAgentFilter(searchParams.get('agent') || 'all');
        setChannelFilter(searchParams.get('channel') || 'all');
        setLimit(50);
    }, [searchParams]);

    // Sync the tab when a link from Today, Dashboard or the People tiles sets ?stage= or ?route=
    useEffect(() => {
        const next: GroupId = normalizeGroup(searchParams.get('stage'), searchParams.get('route')) || 'all';
        if (next !== tab) {
            setTab(next);
            setLimit(50);
        }
    }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectTab = (next: GroupId) => {
        setTab(next);
        setLimit(50);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('route');
        if (next === 'all') nextParams.delete('stage');
        else nextParams.set('stage', next);
        setSearchParams(nextParams, { replace: true });
    };

    const load = useCallback(async () => {
        if (data) { await data.reload(); return; }
        setOwnLoading(true);
        const res = await supabaseClient.rpc('admin_course_stage_students', { p_course: course });
        if (res.error) {
            // Graceful fallback to legacy pipeline RPC if needed
            const fallback = await supabaseClient.rpc('admin_registration_pipeline', { p_course: course });
            if (fallback.error) {
                setOwnError(fallback.error.message);
            } else {
                setOwnError(null);
                setOwnRows((fallback.data || []) as StudentRow[]);
            }
        } else {
            setOwnError(null);
            setOwnRows((res.data || []) as StudentRow[]);
        }
        setOwnLoading(false);
    }, [course, data]);

    useEffect(() => { if (!data) void load(); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

    // Every tab count uses the same rule as the list and as the tiles on the People page (see lib/peopleMetrics.ts)
    const counts = useMemo(() => {
        const list = rows || [];
        const c: Record<string, number> = { app_installed: list.filter(r => r.app_installed).length };
        GROUP_ORDER.forEach(g => { c[g] = list.filter(r => inGroup(r, g, lessonsFor)).length; });
        return c;
    }, [rows, lessonsFor]);

    const agentOptions = useMemo(() => {
        const set = new Set<string>();
        (rows || []).forEach(r => { if (r.agent) set.add(r.agent); });
        return [...set].sort();
    }, [rows]);

    const shown = useMemo(() => {
        const term = q.trim().toLowerCase();
        return (rows || []).filter(r => {
            if (!inGroup(r, tab, lessonsFor)) return false;
            if (moduleFilter !== 'all') {
                const touched = r.modules_touched || [];
                if (!touched.includes(moduleFilter) && r.highest_module !== moduleFilter) return false;
            }
            if (agentFilter !== 'all') {
                if (agentFilter === '__none__' && r.agent) return false;
                if (agentFilter !== '__none__' && r.agent !== agentFilter) return false;
            }
            if (channelFilter !== 'all' && channelOf(r) !== channelFilter) return false;
            if (onlyAppInstalled && !r.app_installed) return false;
            if (term) {
                const hay = `${r.name} ${r.email || ''} ${r.phone || ''} ${r.location || ''} ${r.agent || ''} ${r.certificate_id || ''}`.toLowerCase();
                if (!hay.includes(term)) return false;
            }
            return true;
        });
    }, [rows, tab, lessonsFor, moduleFilter, agentFilter, channelFilter, onlyAppInstalled, q]);

    const save = async (r: StudentRow, status: StudentRow['followup'], note: string | null) => {
        setRows(prev => (prev || []).map(x => x.key === r.key ? { ...x, followup: status, note } : x));
        const { error: err } = await supabaseClient.rpc('admin_set_followup', { p_key: r.key, p_status: status, p_note: note });
        if (err) setError(err.message);
    };

    const exportCsv = () => {
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const head = [
            'Name', 'Email', 'Phone', 'Location', 'Courses', 'Source', 'Agent', 'Registered',
            'Stage', 'Items Done', 'Progress %', 'Current Module', 'Quizzes Passed',
            'Final Score %', 'Certificate ID', 'Certificate Issued', 'Live Classes',
            'App Installed', 'Last Active', 'Follow-up', 'Note', 'HQ Lessons'
        ];
        const lines = shown.map(r => [
            r.name, r.email, r.phone ? '+' + r.phone : '', r.location, (r.courses || []).join('; '), r.sources.join('; '), r.agent,
            r.registered_at.slice(0, 10), r.stage, r.items_done ?? 0, r.progress_pct ?? 0,
            r.highest_module ? (MODULE_LABELS[r.highest_module] || r.highest_module) : '',
            r.quizzes_passed ?? 0, r.final_score ?? '', r.certificate_id || '',
            r.certificate_issued_at?.slice(0, 10) || '', r.live_count ?? 0,
            r.app_installed ? 'Yes' : 'No', r.last_active?.slice(0, 10) || '', r.followup, r.note || '',
            hq ? hq.lessonsFor({ key: r.key, name: r.name, email: r.email, phone: r.phone }).join('+') : ''
        ].map(esc).join(','));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' }));
        a.download = `people-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const origin = typeof window !== 'undefined' ? window.location.origin.replace('admin.', '') : '';
    const help = GLOSSARY[tab].definition;

    return (
        <section className={`${card} p-4 sm:p-5 space-y-4`} aria-label="People, person by person">
            {/* Stage Tabs */}
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="People groups">
                    {visibleGroups.map(g => (
                        <button
                            key={g}
                            role="tab"
                            aria-selected={tab === g}
                            onClick={() => selectTab(g)}
                            className={`min-h-[44px] px-3 py-2 rounded-[12px] text-sm font-semibold border transition-colors ${
                                tab === g
                                    ? 'bg-brand border-violet-600 text-white'
                                    : 'border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            {GLOSSARY[g].label} <span className={tab === g ? 'opacity-90' : 'text-stone-500'}>{counts[g] ?? 0}</span>
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={exportCsv}
                        disabled={!rows || shown.length === 0}
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-[12px] text-sm font-medium border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        <Download size={15} /> Export ({shown.length})
                    </button>
                    <button
                        onClick={() => void load()}
                        aria-label="Refresh"
                        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 py-2 rounded-[12px] text-sm border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <p className="text-sm text-stone-500 dark:text-slate-400">{help}</p>

            {/* Secondary Filter Bar: Search, Module, Agent, Installed App */}
            <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
                    <Search size={14} className="absolute left-2.5 top-[15px] text-stone-400" />
                    <input
                        value={q}
                        onChange={e => { setQ(e.target.value); setLimit(50); }}
                        placeholder="Search name, email, phone, place, agent, cert ID..."
                        className={`${field} pl-8 w-full`}
                    />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                    <Filter size={14} className="text-stone-400" />
                    <select
                        value={moduleFilter}
                        onChange={e => { setModuleFilter(e.target.value); setLimit(50); }}
                        aria-label="Filter by module reached"
                        className={`${field} text-sm`}
                    >
                        <option value="all">All modules</option>
                        {Object.entries(MODULE_LABELS).map(([id, label]) => (
                            <option key={id} value={id}>Reached {label}</option>
                        ))}
                    </select>
                </div>

                <select
                    value={channelFilter}
                    onChange={e => { setChannelFilter(e.target.value); setLimit(50); }}
                    aria-label="Filter by how they registered"
                    className={`${field} text-sm`}
                >
                    <option value="all">All ways of registering</option>
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {agentOptions.length > 0 && (
                    <select
                        value={agentFilter}
                        onChange={e => { setAgentFilter(e.target.value); setLimit(50); }}
                        aria-label="Filter by agent"
                        className={`${field} text-sm`}
                    >
                        <option value="all">All agents / direct</option>
                        <option value="__none__">Direct / No agent</option>
                        {agentOptions.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                    </select>
                )}

                <label className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold px-3 py-2 rounded-[12px] border border-stone-200 dark:border-slate-700 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={onlyAppInstalled}
                        onChange={e => { setOnlyAppInstalled(e.target.checked); setLimit(50); }}
                        className="accent-violet-600"
                    />
                    <Smartphone size={13} className="text-violet-600" />
                    App installed ({counts.app_installed ?? 0})
                </label>
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {!rows && !error && <div className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={18} /> Loading learners...</div>}

            {rows && (
                <div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[860px]">
                        <thead>
                            <tr className="text-left text-xs uppercase text-stone-500 dark:text-slate-400 border-b border-stone-100 dark:border-slate-800">
                                <th className="py-2.5 pr-3">Student</th>
                                <th className="pr-3">Contact</th>
                                <th className="pr-3">Stage & Progress</th>
                                <th className="pr-3">Source / Agent</th>
                                <th className="pr-3">Activity</th>
                                <th className="pr-3">Follow-up</th>
                                <th>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.slice(0, limit).map(r => {
                                const stageMeta = STAGES.find(s => s.id === r.stage);
                                const pct = r.progress_pct ?? 0;
                                const itemsDone = r.items_done ?? 0;
                                const totalItems = r.total_items ?? 38;
                                return (
                                    <tr key={r.key} className="border-t border-stone-100 dark:border-slate-800 align-top hover:bg-stone-50/50 dark:hover:bg-slate-800/30">
                                        <td className="py-3 pr-3">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-semibold text-stone-900 dark:text-white">{r.name || '(no name)'}</span>
                                                {r.app_installed && (
                                                    <span title="Installed Welile app" className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                                                        <Smartphone size={10} /> App
                                                    </span>
                                                )}
                                            </div>
                                            {r.location && <span className="block text-xs text-stone-500 dark:text-slate-400">{r.location}</span>}
                                            {(r.courses || []).length > 0 && (
                                                <span className="mt-1 flex flex-wrap gap-1">
                                                    {(r.courses || []).map(c => <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300">{c}{r.paid_enrolled && !c.toLowerCase().includes('free') && !c.toLowerCase().includes('general') ? ' · paid' : ''}</span>)}
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3 pr-3">
                                            <div className="flex items-center gap-1.5">
                                                {r.phone && <a href={`tel:+${wa(r.phone)}`} aria-label="Call" className="p-1.5 rounded-md border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800"><Phone size={13} /></a>}
                                                {r.phone && <a href={`https://wa.me/${wa(r.phone)}?text=${encodeURIComponent(`Hello ${(r.name || '').split(' ')[0]}, this is Welile School of AI. You registered for our free AI Fundamentals course. Can we help you get started?`)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="p-1.5 rounded-md border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800"><MessageCircle size={13} /></a>}
                                                {r.email && <a href={`mailto:${r.email}`} aria-label="Email" className="p-1.5 rounded-md border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800"><Mail size={13} /></a>}
                                            </div>
                                            {r.phone && <span className="block text-xs font-mono text-stone-600 dark:text-slate-300 mt-1">+{r.phone}</span>}
                                            {r.email && <span className="block text-xs text-stone-500 dark:text-slate-400 break-all max-w-[200px]">{r.email}</span>}
                                        </td>

                                        <td className="py-3 pr-3 min-w-[210px]">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${stageMeta?.badge || 'bg-stone-100 text-stone-700'}`}>
                                                    {rowLabel(r)}
                                                </span>
                                                {(r.live_count || 0) > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                                                        <Video size={11} /> {r.live_count} live
                                                    </span>
                                                )}
                                            </div>

                                            {r.has_account && (
                                                <div className="mt-1.5 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden max-w-[120px]">
                                                            <div
                                                                className={`h-full rounded-full ${r.certificate_id ? 'bg-emerald-500' : 'bg-violet-500'}`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-stone-600 dark:text-slate-300">
                                                            {itemsDone}/{totalItems} ({pct}%)
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-stone-500 dark:text-slate-400">
                                                        {r.highest_module && <span>At {MODULE_LABELS[r.highest_module] || r.highest_module}</span>}
                                                        {(r.quizzes_passed || 0) > 0 && <span>· {r.quizzes_passed}/6 quizzes</span>}
                                                        {r.final_score != null && (
                                                            <span className={r.final_passed ? 'text-mint dark:text-emerald-400 font-semibold' : ''}>
                                                                · Final {r.final_score}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {r.certificate_id && (
                                                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-[12px] bg-mint-soft dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs">
                                                    <Award size={13} className="text-mint shrink-0" />
                                                    <a
                                                        href={`${origin}/verify/${encodeURIComponent(r.certificate_id)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-mono font-semibold text-emerald-800 dark:text-emerald-300 hover:underline inline-flex items-center gap-1"
                                                    >
                                                        {r.certificate_id}
                                                        <ExternalLink size={10} />
                                                    </a>
                                                    {r.certificate_issued_at && (
                                                        <span className="text-[10px] text-mint/80 dark:text-emerald-400/80">
                                                            ({fmtDay(r.certificate_issued_at)})
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        <td className="py-3 pr-3 text-xs">
                                            <span className="text-stone-700 dark:text-slate-300">{r.sources.join(', ')}</span>
                                            {r.agent && <span className="block font-semibold text-violet-700 dark:text-violet-300 mt-0.5">{r.agent}</span>}
                                        </td>

                                        <td className="py-3 pr-3 whitespace-nowrap text-xs">
                                            <span className="block text-stone-700 dark:text-slate-300">Reg: {fmtDay(r.registered_at)}</span>
                                            {r.last_active && <span className="block text-stone-500 dark:text-slate-400 mt-0.5">Active: {fmtDay(r.last_active)}</span>}
                                        </td>

                                        <td className="py-3 pr-3">
                                            {hq && (
                                                <div className="mb-2">
                                                    <HqLessons lessons={hq.lessonsFor({ key: r.key, name: r.name, email: r.email, phone: r.phone })} prominent={!isOnline(r)} onToggle={(n, on) => hq.toggle(r, n, on)} />
                                                </div>
                                            )}
                                            <select
                                                value={r.followup}
                                                onChange={e => void save(r, e.target.value as StudentRow['followup'], notes[r.key] ?? r.note)}
                                                className={`${field} text-sm`}
                                                aria-label="Follow-up status"
                                            >
                                                {FOLLOW.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
                                            </select>
                                        </td>

                                        <td className="py-3">
                                            <input
                                                value={notes[r.key] ?? r.note ?? ''}
                                                onChange={e => setNotes(n => ({ ...n, [r.key]: e.target.value }))}
                                                onBlur={() => {
                                                    if ((notes[r.key] ?? r.note ?? '') !== (r.note ?? '')) {
                                                        void save(r, r.followup, notes[r.key] ?? null);
                                                    }
                                                }}
                                                placeholder="Add a note"
                                                className={`${field} text-xs w-36`}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {shown.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-stone-500">
                                        No people match this group or filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                  </div>

                  {/* Phone view: one card per person, same data and same actions */}
                  <div className="md:hidden space-y-3">
                    {shown.slice(0, limit).map(r => {
                        const stageMeta = STAGES.find(s => s.id === r.stage);
                        const pct = r.progress_pct ?? 0;
                        const first = (r.name || '').split(' ')[0];
                        const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-[12px] border border-stone-200 dark:border-slate-700 text-sm font-semibold';
                        return (
                            <div key={r.key} className="rounded-[16px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="m-0 font-bold text-base text-stone-900 dark:text-white break-words">{r.name || '(no name)'}</p>
                                        {r.location && <p className="m-0 text-xs text-stone-500 dark:text-slate-400">{r.location}</p>}
                                    </div>
                                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${stageMeta?.badge || 'bg-stone-100 text-stone-700'}`}>
                                        {rowLabel(r)}
                                    </span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {r.app_installed && <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"><Smartphone size={11} /> App</span>}
                                    {(r.live_count || 0) > 0 && <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300"><Video size={11} /> {r.live_count} live</span>}
                                    {(r.courses || []).map(c => <span key={c} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300">{c}{r.paid_enrolled && !c.toLowerCase().includes('free') && !c.toLowerCase().includes('general') ? ' · paid' : ''}</span>)}
                                </div>
                                {r.has_account && (
                                    <div className="mt-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
                                                <div className={`h-full rounded-full ${r.certificate_id ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-xs font-semibold text-stone-600 dark:text-slate-300">{r.items_done ?? 0}/{r.total_items ?? 38} ({pct}%)</span>
                                        </div>
                                        <p className="m-0 mt-1 text-xs text-stone-500 dark:text-slate-400">
                                            {r.highest_module && <>At {MODULE_LABELS[r.highest_module] || r.highest_module}</>}
                                            {(r.quizzes_passed || 0) > 0 && <> · {r.quizzes_passed}/6 quizzes</>}
                                            {r.final_score != null && <> · Final {r.final_score}%</>}
                                        </p>
                                    </div>
                                )}
                                {r.certificate_id && (
                                    <a href={`${origin}/verify/${encodeURIComponent(r.certificate_id)}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-[12px] bg-mint-soft dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                                        <Award size={14} className="shrink-0" /> {r.certificate_id}{r.certificate_issued_at ? ` (${fmtDay(r.certificate_issued_at)})` : ''} <ExternalLink size={11} />
                                    </a>
                                )}
                                <div className="mt-3 text-xs text-stone-600 dark:text-slate-300 space-y-0.5">
                                    {r.phone && <p className="m-0 font-mono">+{r.phone}</p>}
                                    {r.email && <p className="m-0 break-all">{r.email}</p>}
                                    <p className="m-0">{r.sources.join(', ')}{r.agent && <span className="font-semibold text-violet-700 dark:text-violet-300"> · {r.agent}</span>}</p>
                                    <p className="m-0 text-stone-500 dark:text-slate-400">Registered {fmtDay(r.registered_at)}{r.last_active ? ` · Active ${fmtDay(r.last_active)}` : ''}</p>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {r.phone && <a href={`tel:+${wa(r.phone)}`} className={btn}><Phone size={15} /> Call</a>}
                                    {r.phone && <a href={`https://wa.me/${wa(r.phone)}?text=${encodeURIComponent(`Hello ${first}, this is Welile School of AI. You registered for our free AI Fundamentals course. Can we help you get started?`)}`} target="_blank" rel="noreferrer" className={btn}><MessageCircle size={15} /> WhatsApp</a>}
                                    {r.email && <a href={`mailto:${r.email}`} className={btn}><Mail size={15} /> Email</a>}
                                </div>
                                <div className="mt-3 space-y-2">
                                    {hq && <HqLessons lessons={hq.lessonsFor({ key: r.key, name: r.name, email: r.email, phone: r.phone })} prominent={!isOnline(r)} onToggle={(n, on) => hq.toggle(r, n, on)} />}
                                    <select
                                        value={r.followup}
                                        onChange={e => void save(r, e.target.value as StudentRow['followup'], notes[r.key] ?? r.note)}
                                        className={`${field} text-sm w-full`}
                                        aria-label="Follow-up status"
                                    >
                                        {FOLLOW.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
                                    </select>
                                    <input
                                        value={notes[r.key] ?? r.note ?? ''}
                                        onChange={e => setNotes(n => ({ ...n, [r.key]: e.target.value }))}
                                        onBlur={() => {
                                            if ((notes[r.key] ?? r.note ?? '') !== (r.note ?? '')) {
                                                void save(r, r.followup, notes[r.key] ?? null);
                                            }
                                        }}
                                        placeholder="Add a note"
                                        className={`${field} text-sm w-full`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {shown.length === 0 && <p className="py-8 text-center text-stone-500">No people match this group or filter.</p>}
                  </div>
                    {shown.length > limit && (
                        <button
                            onClick={() => setLimit(l => l + 60)}
                            className="mt-3 min-h-[44px] px-2 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline"
                        >
                            Show more ({shown.length - limit} remaining)
                        </button>
                    )}
                </div>
            )}
        </section>
    );
};

export default AdminRegistrationPipeline;
