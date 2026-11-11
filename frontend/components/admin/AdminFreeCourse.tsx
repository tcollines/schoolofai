import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '../../src/lib/supabaseClient';
import { ALL_ITEMS, COURSE, MODULES } from '../../src/content/aiFundamentals';
import { AlertTriangle, Award, Check, Copy, Download, Eye, Loader2, MousePointerClick, RefreshCw, Star, Trophy, UserPlus, Users, Zap } from 'lucide-react';
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
    leaderboard: { id: string; display_name: string; staff_code: string; clicks: number; signups: number; started: number; completed: number; points: number }[];
}

interface StaffRow { id: string; display_name: string; staff_code: string; slug: string; role: string | null; active: boolean }

const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm';
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

const itemTitle = (id: string) => ALL_ITEMS.find(i => i.id === id)?.title || id;
const quizTitle = (id: string) => (id === 'final' ? 'Final assessment' : itemTitle(id));

const AdminFreeCourse: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [staff, setStaff] = useState<StaffRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ kind: 'auth' | 'missing' | 'other'; message: string } | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error: err } = await supabaseClient.rpc('admin_learn_stats', { p_course: COURSE.slug });
        if (err) {
            const msg = err.message || '';
            if (/not authorized/i.test(msg)) setError({ kind: 'auth', message: msg });
            else if (/could not find|does not exist|PGRST202/i.test(msg + (err.code || ''))) setError({ kind: 'missing', message: msg });
            else setError({ kind: 'other', message: msg });
            setStats(null);
        } else {
            setError(null);
            setStats(data as Stats);
            const { data: s } = await supabaseClient.from('staff_members').select('id,display_name,staff_code,slug,role,active').order('display_name');
            setStaff((s as StaffRow[]) || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        void load();
        const t = window.setInterval(load, 60000);
        return () => window.clearInterval(t);
    }, [load]);

    const funnel = useMemo(() => {
        if (!stats) return [];
        const m = Object.fromEntries(stats.by_module.map(x => [x.module, x.learners]));
        return [
            { step: 'Link clicks', value: stats.clicks },
            { step: 'Registered', value: stats.enrolled },
            { step: 'Started', value: stats.started },
            ...MODULES.filter(x => x.number > 0).map(x => ({ step: `Module ${x.number}`, value: m[x.id] || 0 })),
            { step: 'Completed', value: stats.completed }
        ];
    }, [stats]);

    const signups = useMemo(() => {
        if (!stats) return [];
        const byDay = new Map(stats.signups_by_day.map(d => [d.day, d.enrolled]));
        const out: { day: string; enrolled: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400000);
            const key = d.toISOString().slice(0, 10);
            out.push({ day: key.slice(5), enrolled: byDay.get(key) || 0 });
        }
        return out;
    }, [stats]);

    const itemCounts = useMemo(() => Object.fromEntries((stats?.by_item || []).map(i => [i.item, i.learners])), [stats]);
    const maxItem = Math.max(1, ...Object.values(itemCounts) as number[]);

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
                    <h1 className="text-2xl font-bold">Free Course: AI Fundamentals</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Registration, progress, completion and staff results. Updates every minute.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportCsv} disabled={!stats} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"><Download size={16} /> Export funnel</button>
                    <button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
                </div>
            </div>

            {loading && !stats && <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin" size={18} /> Loading statistics...</div>}

            {error && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-5 flex gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0" />
                    <div className="text-sm">
                        {error.kind === 'auth' && <><p className="font-semibold">Administrator sign-in required</p><p className="mt-1">Learner data is only shown to a signed-in administrator account (a user whose profile role is ADMIN). The shared demo passcode login does not create a database session, so it cannot read this data. Sign in with your administrator email and password.</p></>}
                        {error.kind === 'missing' && <><p className="font-semibold">The free-course database objects are not installed yet</p><p className="mt-1">Apply <code>supabase/migrations/20261111000000_free_course_foundation.sql</code> (additive, it does not change existing data), then refresh.</p></>}
                        {error.kind === 'other' && <><p className="font-semibold">Could not load statistics</p><p className="mt-1">{error.message}</p></>}
                    </div>
                </div>
            )}

            {stats && (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {[
                            { label: 'Link clicks', value: stats.clicks, icon: MousePointerClick, sub: 'staff links' },
                            { label: 'Registered', value: stats.enrolled, icon: UserPlus, sub: `${pct(stats.enrolled, stats.clicks)}% of clicks` },
                            { label: 'Started', value: stats.started, icon: Zap, sub: `${pct(stats.started, stats.enrolled)}% of registered` },
                            { label: 'Completed', value: stats.completed, icon: Award, sub: `${pct(stats.completed, stats.enrolled)}% of registered` },
                            { label: 'Active, 7 days', value: stats.active_7d, icon: Users, sub: `${pct(stats.active_7d, stats.enrolled)}% of registered` },
                            { label: 'Avg rating', value: stats.avg_rating ?? '-', icon: Star, sub: `${stats.ratings} ratings` }
                        ].map(k => (
                            <div key={k.label} className={`${card} p-4`}>
                                <div className="flex items-center justify-between text-gray-500 dark:text-slate-400"><span className="text-xs font-semibold uppercase tracking-wide">{k.label}</span><k.icon size={16} /></div>
                                <p className="text-3xl font-extrabold mt-2">{k.value}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{k.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Funnel + signups */}
                    <div className="grid xl:grid-cols-2 gap-6">
                        <div className={`${card} p-5`}>
                            <h2 className="font-bold">Learner funnel</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">A learner counts at a module once they have completed at least one item in it.</p>
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
                            <h2 className="font-bold">Registrations, last 30 days</h2>
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
                            <h2 className="font-bold flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> Staff leaderboard</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Points: registered 1, started 2, completed 5. First referral wins; staff-registered students count for the registrar.</p>
                            {stats.leaderboard.length === 0 ? <p className="text-sm text-gray-500">No attributed registrations yet. Share the staff links below.</p> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="text-left text-xs uppercase text-gray-500"><th className="py-2">#</th><th>Staff</th><th className="text-right">Clicks</th><th className="text-right">Reg.</th><th className="text-right">Started</th><th className="text-right">Done</th><th className="text-right">Pts</th></tr></thead>
                                        <tbody>
                                            {stats.leaderboard.map((l, i) => (
                                                <tr key={l.id} className="border-t border-gray-100 dark:border-slate-800">
                                                    <td className="py-2 font-semibold">{i + 1}</td>
                                                    <td><span className="font-medium">{l.display_name}</span><span className="block text-xs text-gray-500">{l.staff_code}</span></td>
                                                    <td className="text-right">{l.clicks}</td><td className="text-right">{l.signups}</td><td className="text-right">{l.started}</td><td className="text-right">{l.completed}</td>
                                                    <td className="text-right font-bold text-violet-600">{l.points}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className={`${card} p-5`}>
                            <h2 className="font-bold">Staff referral links</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Each link leads to the free course. Students never see the staff code.</p>
                            <ul className="divide-y divide-gray-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                                {staff.filter(s => s.active).map(s => {
                                    const link = `${origin}/r/${s.slug}`;
                                    return (
                                        <li key={s.id} className="py-2.5 flex items-center gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{s.display_name}</p>
                                                <p className="text-xs text-gray-500 truncate">{link}</p>
                                            </div>
                                            <button onClick={() => copy(link, s.id)} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                                                {copied === s.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                                            </button>
                                        </li>
                                    );
                                })}
                                {staff.length === 0 && <li className="py-3 text-sm text-gray-500">No staff members found.</li>}
                            </ul>
                        </div>
                    </div>

                    {/* Source + quizzes */}
                    <div className="grid xl:grid-cols-2 gap-6">
                        <div className={`${card} p-5`}>
                            <h2 className="font-bold">Where learners came from</h2>
                            <table className="w-full text-sm mt-3">
                                <tbody>
                                    {stats.by_source.map(s => (
                                        <tr key={s.source} className="border-t border-gray-100 dark:border-slate-800">
                                            <td className="py-2 capitalize">{s.source.replace('_', ' ')}</td>
                                            <td className="text-right font-semibold">{s.learners}</td>
                                            <td className="text-right text-gray-500 w-16">{pct(s.learners, stats.enrolled)}%</td>
                                        </tr>
                                    ))}
                                    {stats.by_source.length === 0 && <tr><td className="py-3 text-gray-500">No registrations yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        <div className={`${card} p-5`}>
                            <h2 className="font-bold">Quiz performance</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">A pass rate under 50% can mean a confusing lesson or a badly worded question.</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-left text-xs uppercase text-gray-500"><th className="py-2">Quiz</th><th className="text-right">Learners</th><th className="text-right">Attempts</th><th className="text-right">Pass</th><th className="text-right">Avg</th></tr></thead>
                                    <tbody>
                                        {stats.quizzes.map(q => (
                                            <tr key={q.quiz} className="border-t border-gray-100 dark:border-slate-800">
                                                <td className="py-2">{quizTitle(q.quiz)}</td>
                                                <td className="text-right">{q.learners}</td><td className="text-right">{q.attempts}</td>
                                                <td className={`text-right font-semibold ${q.pass_rate < 50 ? 'text-red-600' : ''}`}>{q.pass_rate}%</td>
                                                <td className="text-right">{q.avg_score}%</td>
                                            </tr>
                                        ))}
                                        {stats.quizzes.length === 0 && <tr><td colSpan={5} className="py-3 text-gray-500">No quiz attempts yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Lesson drop-off */}
                    <div className={`${card} p-5`}>
                        <h2 className="font-bold flex items-center gap-2"><Eye size={18} /> Lesson completion (where people drop off)</h2>
                        <div className="mt-3 space-y-1.5">
                            {MODULES.map(m => (
                                <div key={m.id}>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mt-3 mb-1">{m.number === 0 ? 'Welcome' : `Module ${m.number}: ${m.title}`}</p>
                                    {m.items.map(i => {
                                        const n = itemCounts[i.id] || 0;
                                        return (
                                            <div key={i.id} className="flex items-center gap-3 text-sm">
                                                <span className="w-56 sm:w-72 truncate shrink-0">{i.title}</span>
                                                <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-violet-500 rounded-full" style={{ width: `${(n / maxItem) * 100}%` }} /></div>
                                                <span className="w-10 text-right font-semibold">{n}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminFreeCourse;
