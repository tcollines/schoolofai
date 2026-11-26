import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabaseClient } from '../../lib/supabaseClient';
import { ALL_ITEMS, COURSE, MODULES } from '../../content/aiFundamentals';
import { AlertTriangle, Award, Check, Copy, Download, Eye, Loader2, MousePointerClick, RefreshCw, Search, Star, Trophy, UserPlus, Users, Zap } from 'lucide-react';
import AdminAuthPrompt from './AdminAuthPrompt';
import AdminLearnQA from './AdminLearnQA';
import AdminLiveInstallStats from './AdminLiveInstallStats';
import AdminRegistrationPipeline, { HqControl } from './AdminRegistrationPipeline';
import { GLOSSARY, GroupId, PersonRow, computePeopleMetrics, kampalaDay, loadPeople, pct } from '../../lib/peopleMetrics';
import { PhysicalRow, applyLocalMark, fetchPhysicalAttendance, indexPhysical, setPhysicalLesson } from '../../lib/physicalAttendance';
import { CallRow, fetchCallLog, indexCalls } from '../../lib/callLog';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Stats {
    clicks: number;
    enrolled: number;
    started: number;
    completed: number;
    active_7d: number;
    avg_rating: number | null;
    ratings: number;
    by_module: { module: string; learners: number }[];
    by_item: { item: string; learners: number }[];
    quizzes: { quiz: string; attempts: number; learners: number; pass_rate: number; avg_score: number }[];
    by_source: { source: string; learners: number }[];
    signups_by_day: { day: string; enrolled: number }[];
    leaderboard: { id: string; display_name: string; staff_code: string; clicks: number; registered: number; signups: number; started: number; completed: number; points: number }[];
}

interface Learner { user_id: string; name: string; email: string; enrolled_at: string; source: string; staff: string | null; items_done: number; last_active: string | null; final_passed: boolean; certificate_id: string | null; }

interface StaffRow { id: string; display_name: string; staff_code: string; slug: string; role: string | null; active: boolean }

const card = 'bg-white dark:bg-night-2 rounded-[22px]';

const itemTitle = (id: string) => ALL_ITEMS.find(i => i.id === id)?.title || id;
const quizTitle = (id: string) => (id === 'final' ? 'Final assessment' : itemTitle(id));

const AdminFreeCourse: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [staff, setStaff] = useState<StaffRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ kind: 'auth' | 'missing' | 'other'; message: string } | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [learners, setLearners] = useState<Learner[]>([]);
    const [search, setSearch] = useState('');
    const [more, setMore] = useState(false);

    // People numbers come from the same source as Today, Dashboard, People and Course stats
    const [searchParams, setSearchParams] = useSearchParams();
    const [people, setPeople] = useState<PersonRow[] | null>(null);
    const [physicalRows, setPhysicalRows] = useState<PhysicalRow[]>([]);
    const [callRows, setCallRows] = useState<CallRow[]>([]);
    const [peopleLoading, setPeopleLoading] = useState(true);
    const [peopleError, setPeopleError] = useState<string | null>(null);

    const loadPeopleData = useCallback(async () => {
        setPeopleLoading(true);
        const [res, hq, log] = await Promise.all([loadPeople(COURSE.slug), fetchPhysicalAttendance(COURSE.slug), fetchCallLog()]);
        if (res.error) setPeopleError(res.error); else { setPeopleError(null); setPeople(res.rows); }
        setPhysicalRows(hq.rows);
        setCallRows(log.rows);
        setPeopleLoading(false);
    }, []);
    useEffect(() => { void loadPeopleData(); }, [loadPeopleData]);

    const lessonsFor = useMemo(() => indexPhysical(physicalRows), [physicalRows]);
    const callIndex = useMemo(() => indexCalls(callRows), [callRows]);
    const m = useMemo(() => computePeopleMetrics(people || [], lessonsFor, callIndex), [people, lessonsFor, callIndex]);

    const toggleHq = useCallback(async (r: PersonRow, lesson: number, attended: boolean) => {
        const person = { key: r.key, name: r.name, email: r.email, phone: r.phone };
        setPhysicalRows(prev => applyLocalMark(prev, person, lesson, attended));
        const res = await setPhysicalLesson(person, lesson, attended);
        if (!res.ok) {
            setPhysicalRows(prev => applyLocalMark(prev, person, lesson, !attended));
            setPeopleError(`Could not save HQ attendance: ${res.error}`);
        } else setPeopleError(null);
    }, []);
    const hqControl = useMemo<HqControl>(() => ({ lessonsFor, toggle: (r, lesson, attended) => { void toggleHq(r, lesson, attended); } }), [lessonsFor, toggleHq]);

    // The list below uses the same rows as the tiles, so its tab counts equal People
    const pipelineData = useMemo(() => ({
        rows: people,
        setRows: (updater: (prev: PersonRow[] | null) => PersonRow[]) => setPeople(prev => updater(prev)),
        reload: loadPeopleData,
        loading: peopleLoading,
        error: peopleError,
    }), [people, loadPeopleData, peopleLoading, peopleError]);

    const goTo = (id: GroupId) => {
        const next = new URLSearchParams(searchParams);
        next.delete('route');
        if (id === 'all') next.delete('stage'); else next.set('stage', id);
        setSearchParams(next, { replace: true });
        document.getElementById('free-people-explorer')?.scrollIntoView({ behavior: 'smooth' });
    };
    type Tile = { id: GroupId; value: number; note: string; tone: string };
    const routeTiles: Tile[] = [
        { id: 'all', value: m.registered, note: `${GLOSSARY.online.label} + ${GLOSSARY.call.label}`, tone: 'text-stone-900 dark:text-white' },
        { id: 'online', value: m.online, note: `${pct(m.online, m.registered)}% of registered`, tone: 'text-violet-700 dark:text-violet-300' },
        { id: 'call', value: m.needsCall, note: `${m.notCalledYet} not called yet`, tone: 'text-amber-700 dark:text-amber-400' },
    ];
    const journeyTiles: Tile[] = [
        { id: 'account', value: m.hasAccount, note: `${pct(m.hasAccount, m.online)}% of online`, tone: 'text-violet-700 dark:text-violet-300' },
        { id: 'invite', value: m.invitePending, note: 'email, no account yet', tone: 'text-amber-700 dark:text-amber-400' },
        { id: 'notStarted', value: m.notStarted, note: `${pct(m.notStarted, m.hasAccount)}% of accounts`, tone: 'text-sky-700 dark:text-sky-300' },
        { id: 'studying', value: m.studying, note: `${pct(m.studying, m.hasAccount)}% of accounts`, tone: 'text-indigo-700 dark:text-indigo-300' },
        { id: 'live', value: m.joinedLive, note: `${pct(m.joinedLive, m.hasAccount)}% of accounts`, tone: 'text-teal-700 dark:text-teal-300' },
        { id: 'completed', value: m.completed, note: `${pct(m.completed, m.hasAccount)}% of accounts`, tone: 'text-emerald-700 dark:text-emerald-400' },
    ];
    const otherTiles: Tile[] = [
        { id: 'paid', value: m.paid, note: `${pct(m.paid, m.registered)}% of registered`, tone: 'text-emerald-700 dark:text-emerald-400' },
        { id: 'hq', value: m.physicalAny, note: `${pct(m.physicalAny, m.registered)}% of registered`, tone: 'text-emerald-700 dark:text-emerald-400' },
    ];
    const renderTile = (t: Tile) => (
        <button key={t.id} type="button" onClick={() => goTo(t.id)} title={GLOSSARY[t.id].definition} className={`${card} p-4 text-left min-h-[44px] hover:ring-2 hover:ring-violet-200 dark:hover:ring-violet-900`}>
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">{GLOSSARY[t.id].label}</p>
            <p className={`m-0 text-3xl font-extrabold mt-1 ${t.tone}`}>{t.value}</p>
            <p className="m-0 text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">{t.note}</p>
        </button>
    );

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error: err } = await supabaseClient.rpc('admin_learn_stats', { p_course: COURSE.slug });
        if (err) {
            const msg = err.message || '';
            if (/not authorized/i.test(msg)) setError({ kind: 'auth', message: msg });
            else if (/could not find|does not exist|PGRST202/i.test(msg + (err.code || ''))) setError({ kind: 'missing', message: msg });
            else setError({ kind: 'other', message: msg });
            setStats(null);
        } else if (!data) {
            setError({ kind: 'other', message: 'No statistics were returned.' });
            setStats(null);
        } else {
            setError(null);
            setStats(data as Stats);
            const { data: s } = await supabaseClient.from('staff_members').select('id,display_name,staff_code,slug,role,active').order('display_name');
            setStaff((s as StaffRow[]) || []);
            const { data: l } = await supabaseClient.rpc('admin_learners', { p_course: COURSE.slug });
            setLearners((l as Learner[]) || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        void load();
        const t = window.setInterval(load, 60000);
        return () => window.clearInterval(t);
    }, [load]);

    const metrics = m;
    const funnel = useMemo(() => {
        if (!stats) return [];
        const reached = Object.fromEntries(stats.by_module.map(x => [x.module, x.learners]));
        return [
            { step: GLOSSARY.account.label, value: metrics.hasAccount },
            ...MODULES.filter(x => x.number > 0).map(x => ({ step: `Module ${x.number}`, value: reached[x.id] || 0 })),
            { step: GLOSSARY.completed.label, value: metrics.completed },
        ];
    }, [stats, metrics]);

    const signups = useMemo(() => {
        if (!stats) return [];
        const byDay = new Map(stats.signups_by_day.map(d => [d.day, d.enrolled]));
        const out: { day: string; enrolled: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const key = kampalaDay(Date.now() - i * 86400000);
            out.push({ day: key.slice(5), enrolled: byDay.get(key) || 0 });
        }
        return out;
    }, [stats]);

    const itemCounts = useMemo(() => Object.fromEntries((stats?.by_item || []).map(i => [i.item, i.learners])), [stats]);
    const maxItem = Math.max(1, ...Object.values(itemCounts) as number[]);

    const filteredLearners = useMemo(() => {
        const q = search.trim().toLowerCase();
        return learners.filter(l => !q || `${l.name} ${l.email} ${l.staff || ''} ${l.source}`.toLowerCase().includes(q));
    }, [learners, search]);

    const exportLearners = () => {
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = [['Name', 'Email', 'Joined', 'Source', 'Staff', 'Items done', 'Last active', 'Final passed', 'Certificate'],
            ...filteredLearners.map(l => [l.name, l.email, l.enrolled_at, l.source, l.staff || '', l.items_done, l.last_active || '', l.final_passed ? 'yes' : 'no', l.certificate_id || ''])];
        const blob = new Blob([rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ai-fundamentals-learners-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const copy = async (text: string, key: string) => {
        try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1800); } catch { /* ignore */ }
    };

    const exportCsv = () => {
        if (!stats) return;
        const rows = [['Step', 'Learners'], ...funnel.map(f => [f.step, String(f.value)])];
        const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ai-fundamentals-funnel-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const origin = typeof window !== 'undefined' ? window.location.origin.replace('admin.', '') : '';

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">Fundamentals of AI <span className="align-middle ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Free online course</span></h1>
                    <p className="text-sm text-stone-500 dark:text-slate-400">Who registered, who has an account, who is studying, and who finished. Pick a tab, then follow up.</p>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">People numbers on this page come from the same source as Today and People.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportCsv} disabled={!stats} className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] text-sm font-medium border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 disabled:opacity-50"><Download size={16} /> Export funnel</button>
                    <button onClick={() => { void load(); void loadPeopleData(); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] text-sm font-medium bg-brand hover:bg-brand-mid text-white"><RefreshCw size={16} className={loading || peopleLoading ? 'animate-spin' : ''} /> Refresh</button>
                </div>
            </div>

            {peopleError && <p role="alert" className="m-0 text-sm text-red-600">{peopleError}</p>}
            {people && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{routeTiles.map(renderTile)}</div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400 mb-2">Online (has email): where they are</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{journeyTiles.map(renderTile)}</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{otherTiles.map(renderTile)}</div>
                    <p className="text-xs text-stone-500 dark:text-slate-400">Registered = {GLOSSARY.online.label} + {GLOSSARY.call.label}. {GLOSSARY.account.definition} Has an account = {GLOSSARY.notStarted.label} + {GLOSSARY.studying.label} + {GLOSSARY.live.label} + {GLOSSARY.completed.label}. {GLOSSARY.studying.definition}</p>
                </div>
            )}

            <div id="free-people-explorer">
                <AdminRegistrationPipeline course={COURSE.slug} data={pipelineData} hq={hqControl} />
            </div>

            {more && loading && !stats && <div className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={18} /> Loading statistics...</div>}

            {error?.kind === 'auth' && <AdminAuthPrompt onSignedIn={() => void load()} />}

            {more && error && error.kind !== 'auth' && (
                <div className="rounded-[22px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-5 flex gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0" />
                    <div className="text-sm">
                        {error.kind === 'missing' && <><p className="font-semibold">The free-course database objects are not installed yet</p><p className="mt-1">Run <code>20261111000000_free_course_foundation.sql</code> and then <code>20261111010000_staff_portal_live_admin_server_grading.sql</code> from <code>supabase/migrations</code> in the Supabase SQL Editor (both only add new objects), then refresh.</p></>}
                        {error.kind === 'other' && <><p className="font-semibold">Could not load statistics</p><p className="mt-1">{error.message}</p></>}
                    </div>
                </div>
            )}

            <button onClick={() => setMore(m => !m)} aria-expanded={more} className="w-full text-left px-4 py-3 rounded-[22px] bg-white dark:bg-night-2 text-sm font-semibold flex justify-between">
                <span>Course activity: link clicks, ratings, live classes and app installs, staff results, quizzes, lesson drop-off</span><span>{more ? 'Hide' : 'Show'}</span>
            </button>

            {more && stats && (
                <>
                    <div>
                        <h2 className="m-0 text-lg font-extrabold">Course activity</h2>
                        <p className="m-0 text-xs text-stone-500 dark:text-slate-400">What happens inside the online course. These use the course's own records, so a few labels differ from the people numbers above on purpose.</p>
                    </div>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {[
                            { label: 'Link clicks', value: stats.clicks, icon: MousePointerClick, sub: 'staff links' },
                            { label: 'Enrolled online (opened the course)', value: stats.enrolled, icon: UserPlus, sub: `${pct(stats.enrolled, stats.clicks)}% of link clicks` },
                            { label: 'Opened a lesson', value: stats.started, icon: Zap, sub: `${pct(stats.started, stats.enrolled)}% of enrolled online` },
                            { label: 'Certificates issued', value: stats.completed, icon: Award, sub: `${pct(stats.completed, stats.enrolled)}% of enrolled online` },
                            { label: 'Active in the app, 7 days', value: stats.active_7d, icon: Users, sub: `${pct(stats.active_7d, stats.enrolled)}% of enrolled online` },
                            { label: 'Avg rating', value: stats.avg_rating ?? '-', icon: Star, sub: `${stats.ratings} ratings` }
                        ].map(k => (
                            <div key={k.label} className={`${card} p-4`}>
                                <div className="flex items-center justify-between text-stone-500 dark:text-slate-400"><span className="text-xs font-semibold uppercase tracking-wide">{k.label}</span><k.icon size={16} /></div>
                                <p className="text-3xl font-extrabold mt-2">{k.value}</p>
                                <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">{k.sub}</p>
                            </div>
                        ))}
                    </div>

                    <AdminLiveInstallStats course={COURSE.slug} learners={learners} enrolled={stats.enrolled} />

                    {/* Funnel + signups */}
                    <div className="grid xl:grid-cols-2 gap-6">
                        <div className={`${card} p-5`}>
                            <h2 className="m-0 text-[16px] font-extrabold">Online lessons: people who reached each module</h2>
                            <p className="text-xs text-stone-500 dark:text-slate-400 mb-3">Starts from everyone with an account. A person counts at a module once they have completed at least one item in it. The last bar is everyone who completed the course.</p>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={funnel} layout="vertical" margin={{ left: 10, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" allowDecimals={false} />
                                        <YAxis type="category" dataKey="step" width={90} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={`${card} p-5`}>
                            <h2 className="m-0 text-[16px] font-extrabold">Opened the course, last 30 days</h2>
                            <p className="text-xs text-stone-500 dark:text-slate-400">People who opened the online course each day (Kampala days).</p>
                            <div className="h-80 mt-3">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={signups} margin={{ left: -10, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={3} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="enrolled" stroke="#7c3aed" fill="#ddd6fe" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Staff */}
                    <div className="grid xl:grid-cols-2 gap-6">
                        <div className={`${card} p-5`}>
                            <h2 className="m-0 text-[16px] font-extrabold flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> Staff leaderboard</h2>
                            <p className="text-xs text-stone-500 dark:text-slate-400 mb-3">Ranked by total people signed up. Points: signed up 1, opened the course 1, started lessons 2, certified 5.</p>
                            {stats.leaderboard.length === 0 ? <p className="text-sm text-stone-500">No attributed registrations yet. Share the staff links below.</p> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="text-left text-[10px] font-extrabold tracking-[0.08em] uppercase text-[#6B6680] bg-[#FAF9FE] dark:bg-night-3/40"><th className="py-2">#</th><th>Staff</th><th className="text-right">Clicks</th><th className="text-right">Signed up</th><th className="text-right">Opened course</th><th className="text-right">Started lessons</th><th className="text-right">Certified</th><th className="text-right">Pts</th></tr></thead>
                                        <tbody>
                                            {stats.leaderboard.map((l, i) => (
                                                <tr key={l.id} className="border-t border-stone-100 dark:border-slate-800">
                                                    <td className="py-2 font-semibold">{i + 1}</td>
                                                    <td><span className="font-medium">{l.display_name}</span><span className="block text-xs text-stone-500">{l.staff_code}</span></td>
                                                    <td className="text-right">{l.clicks}</td><td className="text-right font-semibold">{l.registered ?? l.signups}</td><td className="text-right">{l.signups}</td><td className="text-right">{l.started}</td><td className="text-right">{l.completed}</td>
                                                    <td className="text-right font-bold text-violet-600">{l.points}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className={`${card} p-5`}>
                            <h2 className="m-0 text-[16px] font-extrabold">Staff referral links</h2>
                            <p className="text-xs text-stone-500 dark:text-slate-400 mb-3">Each link leads to the free course. Students never see the staff code.</p>
                            <ul className="divide-y divide-stone-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                                {staff.filter(s => s.active).map(s => {
                                    const link = `${origin}/r/${s.slug}`;
                                    return (
                                        <li key={s.id} className="py-2.5 flex items-center gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{s.display_name}</p>
                                                <p className="text-xs text-stone-500 truncate">{link}</p>
                                            </div>
                                            <button onClick={() => copy(link, s.id)} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[12px] text-xs font-medium border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800">
                                                {copied === s.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                                            </button>
                                        </li>
                                    );
                                })}
                                {staff.length === 0 && <li className="py-3 text-sm text-stone-500">No staff members found.</li>}
                            </ul>
                        </div>
                    </div>

                    {/* Source + quizzes */}
                    <div className="grid xl:grid-cols-2 gap-6">
                        <div className={`${card} p-5`}>
                            <h2 className="m-0 text-[16px] font-extrabold">Where learners who opened the course came from</h2>
                            <table className="w-full text-sm mt-3">
                                <tbody>
                                    {stats.by_source.map(s => (
                                        <tr key={s.source} className="border-t border-stone-100 dark:border-slate-800">
                                            <td className="py-2 capitalize">{s.source.replace('_', ' ')}</td>
                                            <td className="text-right font-semibold">{s.learners}</td>
                                            <td className="text-right text-stone-500 w-16">{pct(s.learners, stats.enrolled)}%</td>
                                        </tr>
                                    ))}
                                    {stats.by_source.length === 0 && <tr><td className="py-3 text-stone-500">No registrations yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        <div className={`${card} p-5`}>
                            <h2 className="m-0 text-[16px] font-extrabold">Quiz performance</h2>
                            <p className="text-xs text-stone-500 dark:text-slate-400 mb-3">A pass rate under 50% can mean a confusing lesson or a badly worded question.</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-left text-[10px] font-extrabold tracking-[0.08em] uppercase text-[#6B6680] bg-[#FAF9FE] dark:bg-night-3/40"><th className="py-2">Quiz</th><th className="text-right">Learners</th><th className="text-right">Attempts</th><th className="text-right">Pass</th><th className="text-right">Avg</th></tr></thead>
                                    <tbody>
                                        {stats.quizzes.map(q => (
                                            <tr key={q.quiz} className="border-t border-stone-100 dark:border-slate-800">
                                                <td className="py-2">{quizTitle(q.quiz)}</td>
                                                <td className="text-right">{q.learners}</td><td className="text-right">{q.attempts}</td>
                                                <td className={`text-right font-semibold ${q.pass_rate < 50 ? 'text-red-600' : ''}`}>{q.pass_rate}%</td>
                                                <td className="text-right">{q.avg_score}%</td>
                                            </tr>
                                        ))}
                                        {stats.quizzes.length === 0 && <tr><td colSpan={5} className="py-3 text-stone-500">No quiz attempts yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Lesson drop-off */}
                    <div className={`${card} p-5`}>
                        <h2 className="m-0 text-[16px] font-extrabold flex items-center gap-2"><Eye size={18} /> Lesson completion (where people drop off)</h2>
                        <div className="mt-3 space-y-1.5">
                            {MODULES.map(m => (
                                <div key={m.id}>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mt-3 mb-1">{m.number === 0 ? 'Welcome' : `Module ${m.number}: ${m.title}`}</p>
                                    {m.items.map(i => {
                                        const n = itemCounts[i.id] || 0;
                                        return (
                                            <div key={i.id} className="flex items-center gap-3 text-sm">
                                                <span className="w-56 sm:w-72 truncate shrink-0">{i.title}</span>
                                                <div className="flex-1 h-2.5 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-violet-500 rounded-full" style={{ width: `${(n / maxItem) * 100}%` }} /></div>
                                                <span className="w-10 text-right font-semibold">{n}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Q&A and lesson ratings */}
                    <AdminLearnQA />
                </>
            )}
        </div>
    );
};

export default AdminFreeCourse;
