import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Award, CheckCircle2, Download, ExternalLink, Filter, Loader2,
    Mail, MessageCircle, Phone, RefreshCw, Search, Smartphone, Video
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { CHANNELS, channelOf } from './peopleChannels';

type Stage = 'Registered' | 'Account opened' | 'In course' | 'Studying' | 'Joined live' | 'Passed final' | 'Completed';

interface StudentRow {
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
const field = 'rounded-[12px] bg-white dark:bg-night-2 px-2.5 py-2 text-sm';

const VALID_STAGE_IDS = new Set<string>(['all', ...STAGES.map(s => s.id)]);

/** Stage-by-stage student explorer & follow-up pipeline for the free course. */
const AdminRegistrationPipeline: React.FC<{ course: string }> = ({ course }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialStage = (() => {
        const s = searchParams.get('stage');
        return s && VALID_STAGE_IDS.has(s) ? (s as 'all' | Stage) : 'all';
    })();

    const [rows, setRows] = useState<StudentRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'all' | Stage>(initialStage);
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

    // Sync tab if user clicked a stage link from Dashboard
    useEffect(() => {
        const s = searchParams.get('stage');
        if (s && VALID_STAGE_IDS.has(s) && s !== tab) {
            setTab(s as 'all' | Stage);
            setLimit(50);
        }
    }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectTab = (next: 'all' | Stage) => {
        setTab(next);
        setLimit(50);
        const nextParams = new URLSearchParams(searchParams);
        if (next === 'all') nextParams.delete('stage');
        else nextParams.set('stage', next);
        setSearchParams(nextParams, { replace: true });
    };

    const load = useCallback(async () => {
        setLoading(true);
        const res = await supabaseClient.rpc('admin_course_stage_students', { p_course: course });
        if (res.error) {
            // Graceful fallback to legacy pipeline RPC if needed
            const fallback = await supabaseClient.rpc('admin_registration_pipeline', { p_course: course });
            if (fallback.error) {
                setError(fallback.error.message);
            } else {
                setError(null);
                setRows((fallback.data || []) as StudentRow[]);
            }
        } else {
            setError(null);
            setRows((res.data || []) as StudentRow[]);
        }
        setLoading(false);
    }, [course]);

    useEffect(() => { void load(); }, [load]);

    const counts = useMemo(() => {
        const list = rows || [];
        const c: Record<string, number> = {
            all: list.length,
            app_installed: list.filter(r => r.app_installed).length,
            certified: list.filter(r => !!r.certificate_id).length,
            live_any: list.filter(r => (r.live_count || 0) > 0 || r.stage === 'Joined live').length,
        };
        STAGES.forEach(s => { c[s.id] = list.filter(r => r.stage === s.id).length; });
        return c;
    }, [rows]);

    const agentOptions = useMemo(() => {
        const set = new Set<string>();
        (rows || []).forEach(r => { if (r.agent) set.add(r.agent); });
        return [...set].sort();
    }, [rows]);

    const shown = useMemo(() => {
        const term = q.trim().toLowerCase();
        return (rows || []).filter(r => {
            if (tab !== 'all') {
                // For "Joined live", also include completed/passed learners who attended live!
                if (tab === 'Joined live') {
                    if (r.stage !== 'Joined live' && !(r.live_count && r.live_count > 0)) return false;
                } else if (tab === 'Completed') {
                    if (r.stage !== 'Completed' && !r.certificate_id) return false;
                } else if (r.stage !== tab) {
                    return false;
                }
            }
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
    }, [rows, tab, moduleFilter, agentFilter, channelFilter, onlyAppInstalled, q]);

    const save = async (r: StudentRow, status: StudentRow['followup'], note: string | null) => {
        setRows(prev => (prev || []).map(x => x.key === r.key ? { ...x, followup: status, note } : x));
        const { error: err } = await supabaseClient.rpc('admin_set_followup', { p_key: r.key, p_status: status, p_note: note });
        if (err) setError(err.message);
    };

    const exportCsv = () => {
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const head = [
            'Name', 'Email', 'Phone', 'Location', 'Source', 'Agent', 'Registered',
            'Stage', 'Items Done', 'Progress %', 'Current Module', 'Quizzes Passed',
            'Final Score %', 'Certificate ID', 'Certificate Issued', 'Live Classes',
            'App Installed', 'Last Active', 'Follow-up', 'Note'
        ];
        const lines = shown.map(r => [
            r.name, r.email, r.phone ? '+' + r.phone : '', r.location, r.sources.join('; '), r.agent,
            r.registered_at.slice(0, 10), r.stage, r.items_done ?? 0, r.progress_pct ?? 0,
            r.highest_module ? (MODULE_LABELS[r.highest_module] || r.highest_module) : '',
            r.quizzes_passed ?? 0, r.final_score ?? '', r.certificate_id || '',
            r.certificate_issued_at?.slice(0, 10) || '', r.live_count ?? 0,
            r.app_installed ? 'Yes' : 'No', r.last_active?.slice(0, 10) || '', r.followup, r.note || ''
        ].map(esc).join(','));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' }));
        a.download = `free-course-${tab === 'all' ? 'all' : tab.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const origin = typeof window !== 'undefined' ? window.location.origin.replace('admin.', '') : '';
    const help = tab === 'all'
        ? 'Everyone registered or enrolled in the free course. Click any stage tab above to view the exact students at that stage.'
        : STAGES.find(s => s.id === tab)?.help;

    return (
        <section className={`${card} p-4 sm:p-5 space-y-4`} aria-label="Free course learners by stage">
            {/* Stage Tabs */}
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Course stage">
                    <button
                        role="tab"
                        aria-selected={tab === 'all'}
                        onClick={() => selectTab('all')}
                        className={`px-3 py-2 rounded-[12px] text-xs sm:text-sm font-semibold border transition-colors ${
                            tab === 'all'
                                ? 'bg-brand border-violet-600 text-white'
                                : 'border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        All <span className={tab === 'all' ? 'opacity-90' : 'text-stone-500'}>{counts.all ?? 0}</span>
                    </button>
                    {STAGES.map(s => {
                        const cnt = s.id === 'Joined live' ? counts.live_any : s.id === 'Completed' ? counts.certified : counts[s.id];
                        return (
                            <button
                                key={s.id}
                                role="tab"
                                aria-selected={tab === s.id}
                                onClick={() => selectTab(s.id)}
                                className={`px-3 py-2 rounded-[12px] text-xs sm:text-sm font-semibold border transition-colors ${
                                    tab === s.id
                                        ? 'bg-brand border-violet-600 text-white'
                                        : 'border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                {s.tab} <span className={tab === s.id ? 'opacity-90' : 'text-stone-500'}>{cnt ?? 0}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={exportCsv}
                        disabled={!rows || shown.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-sm font-medium border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        <Download size={15} /> Export ({shown.length})
                    </button>
                    <button
                        onClick={() => void load()}
                        aria-label="Refresh"
                        className="inline-flex items-center px-3 py-2 rounded-[12px] text-sm border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <p className="text-sm text-stone-500 dark:text-slate-400">{help}</p>

            {/* Secondary Filter Bar: Search, Module, Agent, Installed App */}
            <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search size={14} className="absolute left-2.5 top-3 text-stone-400" />
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
                        className={`${field} text-xs`}
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
                    className={`${field} text-xs`}
                >
                    <option value="all">All ways of registering</option>
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {agentOptions.length > 0 && (
                    <select
                        value={agentFilter}
                        onChange={e => { setAgentFilter(e.target.value); setLimit(50); }}
                        aria-label="Filter by agent"
                        className={`${field} text-xs`}
                    >
                        <option value="all">All agents / direct</option>
                        <option value="__none__">Direct / No agent</option>
                        {agentOptions.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                    </select>
                )}

                <label className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-[12px] border border-stone-200 dark:border-slate-700 cursor-pointer select-none">
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
                <div className="overflow-x-auto">
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
                                                    {r.stage === 'Registered' ? 'No account yet' : r.stage}
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
                                            <select
                                                value={r.followup}
                                                onChange={e => void save(r, e.target.value as StudentRow['followup'], notes[r.key] ?? r.note)}
                                                className={`${field} text-xs`}
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
                                        No students match this stage or filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {shown.length > limit && (
                        <button
                            onClick={() => setLimit(l => l + 60)}
                            className="mt-3 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline"
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
