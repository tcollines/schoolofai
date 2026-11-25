import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { COURSE } from '../../content/aiFundamentals';
import AdminRegistrationPipeline, { StudentRow } from './AdminRegistrationPipeline';
import { CHANNELS, channelOf } from './peopleChannels';

type Person = StudentRow;
const FREE_TITLE = 'AI Fundamentals (free)';

const card = 'bg-white dark:bg-night-2 rounded-[22px]';
const RANGES = [['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All time']] as const;
type Range = typeof RANGES[number][0];

const kampalaDay = (iso: string) => new Date(new Date(iso).getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
const studying = (p: Person) => ['Studying', 'Joined live', 'Passed final', 'Completed'].includes(p.stage) || (p.live_count || 0) > 0 || !!p.certificate_id;
const completed = (p: Person) => p.stage === 'Completed' || !!p.certificate_id;

/** One place for everyone on the platform: how many, where they are in the journey, and who brought them. */
const AdminPeople: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [rows, setRows] = useState<Person[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<Range>('all');
    const courseFilter = searchParams.get('course') || 'all';

    const load = useCallback(async () => {
        setLoading(true);
        let res = await supabaseClient.rpc('admin_course_stage_students', { p_course: COURSE.slug });
        if (res.error) res = await supabaseClient.rpc('admin_registration_pipeline', { p_course: COURSE.slug });
        if (res.error) { setError(res.error.message); setLoading(false); return; }
        const free = ((res.data || []) as Person[]).map(r => ({ ...r, courses: [FREE_TITLE] }));
        // People outside the free course: general sign-ups, other-course interest and paid enrolments
        const other = await supabaseClient.rpc('admin_other_people');
        const byKey = new Map<string, Person>(free.map(r => [r.key, r] as [string, Person]));
        const merged: Person[] = [...free];
        if (!other.error) {
            ((other.data || []) as Person[]).forEach(o => {
                const hit = byKey.get(o.key);
                if (hit) {
                    hit.courses = Array.from(new Set([...(hit.courses || []), ...(o.courses || [])]));
                    hit.paid_enrolled = hit.paid_enrolled || o.paid_enrolled;
                } else { merged.push(o); byKey.set(o.key, o); }
            });
        }
        setError(null);
        setRows(merged.sort((a, b) => (a.registered_at < b.registered_at ? 1 : -1)));
        setLoading(false);
    }, []);
    useEffect(() => { void load(); }, [load]);

    const courseOptions = useMemo(() => {
        const m = new Map<string, number>();
        (rows || []).forEach(p => (p.courses || []).forEach(c => m.set(c, (m.get(c) || 0) + 1)));
        return [...m.entries()].sort((a, b) => b[1] - a[1]);
    }, [rows]);

    // The course filter narrows everything on the page: the numbers and the person-by-person list
    const inCourse = useMemo(
        () => (rows || []).filter(p => courseFilter === 'all' || (p.courses || []).includes(courseFilter)),
        [rows, courseFilter]
    );
    const pipelineData = useMemo(() => ({
        rows: rows ? inCourse : null,
        setRows: (updater: (prev: Person[] | null) => Person[]) => {
            const next = updater(inCourse);
            const m = new Map(next.map(r => [r.key, r]));
            setRows(prev => (prev || []).map(r => m.get(r.key) || r));
        },
        reload: load,
        loading,
        error,
    }), [rows, inCourse, load, loading, error]);

    const scoped = useMemo(() => {
        const list = inCourse;
        if (range === 'all') return list;
        const today = kampalaDay(new Date().toISOString());
        const cutoff = range === 'today' ? today : kampalaDay(new Date(Date.now() - (Number(range) - 1) * 86400000).toISOString());
        return list.filter(p => kampalaDay(p.registered_at) >= cutoff);
    }, [inCourse, range]);

    const tiles = useMemo(() => {
        const n = scoped.length;
        const noAcc = scoped.filter(p => !p.has_account).length;
        const acc = scoped.filter(p => p.has_account).length;
        const inCourse = scoped.filter(p => p.stage === 'In course').length;
        const accOnly = scoped.filter(p => p.stage === 'Account opened').length;
        const stud = scoped.filter(studying).length;
        const live = scoped.filter(p => (p.live_count || 0) > 0 || p.stage === 'Joined live').length;
        const done = scoped.filter(completed).length;
        return [
            { label: 'Everyone', value: n, note: 'registered or enrolled', tone: 'text-stone-900 dark:text-white' },
            { label: 'Just registered', value: noAcc, note: `${pct(noAcc, n)}% have no login yet`, tone: 'text-amber-700 dark:text-amber-400' },
            { label: 'Have an account', value: acc, note: `${pct(acc, n)}% of everyone`, tone: 'text-violet-700 dark:text-violet-300' },
            { label: 'Account, not started', value: accOnly + inCourse, note: 'opened but no lessons yet', tone: 'text-sky-700 dark:text-sky-300' },
            { label: 'Studying', value: stud, note: `${pct(stud, acc)}% of accounts`, tone: 'text-indigo-700 dark:text-indigo-300' },
            { label: 'Joined a live class', value: live, note: `${pct(live, acc)}% of accounts`, tone: 'text-teal-700 dark:text-teal-300' },
            { label: 'Completed', value: done, note: 'certified', tone: 'text-emerald-700 dark:text-emerald-400' },
        ];
    }, [scoped]);

    const byChannel = useMemo(() => CHANNELS.map(c => {
        const g = scoped.filter(p => channelOf(p) === c);
        return { c, n: g.length, acc: g.filter(p => p.has_account).length, stud: g.filter(studying).length, done: g.filter(completed).length };
    }), [scoped]);

    const byAgent = useMemo(() => {
        const m = new Map<string, Person[]>();
        scoped.forEach(p => { if (p.agent) m.set(p.agent, [...(m.get(p.agent) || []), p]); });
        return [...m.entries()].map(([a, g]) => ({ a, n: g.length, acc: g.filter(p => p.has_account).length, stud: g.filter(studying).length, done: g.filter(completed).length }))
            .sort((x, y) => y.n - x.n).slice(0, 15);
    }, [scoped]);

    const byPlace = useMemo(() => {
        const m = new Map<string, number>();
        scoped.forEach(p => { const l = (p.location || '').trim(); if (l) m.set(l, (m.get(l) || 0) + 1); });
        return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    }, [scoped]);

    const daily = useMemo(() => {
        const days: string[] = [];
        for (let i = 13; i >= 0; i--) days.push(kampalaDay(new Date(Date.now() - i * 86400000).toISOString()));
        const c = new Map<string, number>();
        (rows || []).forEach(p => { const d = kampalaDay(p.registered_at); c.set(d, (c.get(d) || 0) + 1); });
        return days.map(d => ({ d, n: c.get(d) || 0 }));
    }, [rows]);
    const maxDay = Math.max(1, ...daily.map(x => x.n));

    const pick = (key: 'channel' | 'agent', value: string) => {
        const next = new URLSearchParams(searchParams);
        if (next.get(key) === value) next.delete(key); else next.set(key, value);
        setSearchParams(next, { replace: true });
        document.getElementById('people-explorer')?.scrollIntoView({ behavior: 'smooth' });
    };
    const activeChannel = searchParams.get('channel');
    const activeAgent = searchParams.get('agent');
    const rowBtn = (on: boolean) => `w-full text-left grid grid-cols-[1fr_repeat(4,44px)] sm:grid-cols-[1fr_repeat(4,56px)] gap-1 sm:gap-2 items-center min-h-[44px] py-2 px-2 rounded-[10px] text-sm hover:bg-stone-50 dark:hover:bg-slate-800/50 ${on ? 'bg-violet-50 dark:bg-violet-950/30 ring-1 ring-violet-300' : ''}`;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold">All people</h1>
                    <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">Everyone registered or enrolled in any course, where they are in the journey, and who brought them in. The study stages follow the free AI Fundamentals course.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                        value={courseFilter}
                        onChange={e => { const next = new URLSearchParams(searchParams); if (e.target.value === 'all') next.delete('course'); else next.set('course', e.target.value); setSearchParams(next, { replace: true }); }}
                        aria-label="Filter by course"
                        className="w-full sm:w-auto min-h-[44px] rounded-[12px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 px-3 py-2 text-sm font-semibold"
                    >
                        <option value="all">All courses ({(rows || []).length})</option>
                        {courseOptions.map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2 text-sm font-semibold" role="group" aria-label="Time range">
                        {RANGES.map(([id, label]) => (
                            <button key={id} onClick={() => setRange(id)} aria-pressed={range === id} className={`min-h-[44px] px-4 rounded-[12px] border ${range === id ? 'bg-brand text-white border-violet-600' : 'bg-white dark:bg-night-2 border-stone-200 dark:border-slate-700'}`}>{label}</button>
                        ))}
                    </div>
                    <button onClick={() => void load()} aria-label="Refresh" className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-[12px] border border-stone-200 dark:border-slate-700"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {!rows && !error && <div className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={18} /> Loading people...</div>}

            {rows && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
                        {tiles.map(t => (
                            <div key={t.label} className={`${card} p-4`}>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">{t.label}</p>
                                <p className={`text-3xl font-extrabold mt-1 ${t.tone}`}>{t.value}</p>
                                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">{t.note}</p>
                            </div>
                        ))}
                    </div>

                    <div className={`${card} p-4 sm:p-5`}>
                        <p className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">New registrations, last 14 days</p>
                        <div className="flex items-end gap-1.5 h-24 mt-3">
                            {daily.map(x => (
                                <div key={x.d} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${x.d}: ${x.n}`}>
                                    {x.n > 0 && <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300">{x.n}</span>}
                                    <div className={`w-full rounded-t-sm ${x.n > 0 ? 'bg-violet-600' : 'bg-stone-200 dark:bg-slate-800'}`} style={{ height: `${Math.max(6, Math.round((x.n / maxDay) * 80))}%` }} />
                                    <span className="text-[9px] text-stone-400">{x.d.slice(8)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {courseOptions.length > 1 && (
                        <section className={`${card} p-4 sm:p-5`}>
                            <h2 className="text-base font-extrabold">By course</h2>
                            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 mb-2">One person can be in more than one course. Click a course to see only its people.</p>
                            <div className="flex flex-wrap gap-2">
                                {courseOptions.map(([c, n]) => (
                                    <button key={c} onClick={() => { const next = new URLSearchParams(searchParams); if (courseFilter === c) next.delete('course'); else next.set('course', c); setSearchParams(next, { replace: true }); }}
                                        className={`min-h-[44px] px-3 py-2 rounded-[12px] text-sm font-semibold border ${courseFilter === c ? 'bg-brand text-white border-violet-600' : 'border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800'}`}>
                                        {c} <b>{n}</b>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="grid lg:grid-cols-2 gap-4">
                        <section className={`${card} p-4 sm:p-5`}>
                            <h2 className="text-base font-extrabold">How they registered</h2>
                            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 mb-2">Click a row to filter the list below.</p>
                            <div className="grid grid-cols-[1fr_repeat(4,44px)] sm:grid-cols-[1fr_repeat(4,56px)] gap-1 sm:gap-2 px-2 text-[11px] font-bold uppercase text-stone-400"><span>Channel</span><span className="text-right">People</span><span className="text-right">Account</span><span className="text-right">Study</span><span className="text-right">Done</span></div>
                            {byChannel.map(r => (
                                <button key={r.c} onClick={() => pick('channel', r.c)} className={rowBtn(activeChannel === r.c)}>
                                    <span className="font-semibold">{r.c}</span>
                                    <span className="text-right font-bold">{r.n}</span><span className="text-right">{r.acc}</span><span className="text-right">{r.stud}</span><span className="text-right">{r.done}</span>
                                </button>
                            ))}
                        </section>

                        <section className={`${card} p-4 sm:p-5`}>
                            <h2 className="text-base font-extrabold">By agent</h2>
                            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 mb-2">Top 15 agents. People without an agent signed up on their own.</p>
                            <div className="grid grid-cols-[1fr_repeat(4,44px)] sm:grid-cols-[1fr_repeat(4,56px)] gap-1 sm:gap-2 px-2 text-[11px] font-bold uppercase text-stone-400"><span>Agent</span><span className="text-right">People</span><span className="text-right">Account</span><span className="text-right">Study</span><span className="text-right">Done</span></div>
                            {byAgent.length === 0 && <p className="text-sm text-stone-500 px-2 py-3">No agent sign-ups in this period.</p>}
                            {byAgent.map(r => (
                                <button key={r.a} onClick={() => pick('agent', r.a)} className={rowBtn(activeAgent === r.a)}>
                                    <span className="font-semibold truncate">{r.a}</span>
                                    <span className="text-right font-bold">{r.n}</span><span className="text-right">{r.acc}</span><span className="text-right">{r.stud}</span><span className="text-right">{r.done}</span>
                                </button>
                            ))}
                        </section>
                    </div>

                    {byPlace.length > 0 && (
                        <section className={`${card} p-4 sm:p-5`}>
                            <h2 className="text-base font-extrabold">Where they are</h2>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {byPlace.map(([l, n]) => <span key={l} className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-slate-800">{l} <b className="text-violet-700 dark:text-violet-300">{n}</b></span>)}
                            </div>
                        </section>
                    )}
                </>
            )}

            <div id="people-explorer">
                <h2 className="text-lg font-extrabold mb-2">Everyone, person by person</h2>
                <AdminRegistrationPipeline course={COURSE.slug} data={pipelineData} />
            </div>
        </div>
    );
};

export default AdminPeople;
