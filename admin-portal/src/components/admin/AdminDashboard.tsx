import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CalendarClock, GraduationCap, Handshake, Loader2, RefreshCw, Smartphone, UserPlus, Users, Bell, Phone } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';

interface Summary {
    students: number; new_today: number; new_7d: number; active_7d: number; enrolled: number; certificates: number; installs: number; live_joined: number;
    next_session: { title: string; starts_at: string; meet_link: string | null } | null; sessions_ahead: number;
    reminders_7d: number; opted_out: number; agents: number; agent_regs_7d: number; leads_7d: number; signups_daily: number[];
}
interface PRow { stage: string; followup: string; }
interface Agent { name: string; registered: number; accounts: number; completed: number; active: boolean; }

const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm';
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kampala' }) + ' EAT';

const Stat: React.FC<{ label: string; value: number | string; sub?: string; to?: string; icon: React.ElementType; tone?: string }> = ({ label, value, sub, to, icon: Icon, tone = 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' }) => {
    const inner = (
        <div className={`${card} p-4 h-full ${to ? 'hover:ring-2 hover:ring-violet-300 transition' : ''}`}>
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{label}</span><span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}><Icon size={16} /></span></div>
            <p className="text-3xl font-extrabold mt-2">{value}</p>
            {sub && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{sub}</p>}
        </div>
    );
    return to ? <Link to={to} className="block">{inner}</Link> : inner;
};

/** Landing page for admins: a summary of everything happening, as cards that open the right page. */
const AdminDashboard: React.FC = () => {
    const [s, setS] = useState<Summary | null>(null);
    const [rows, setRows] = useState<PRow[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const [a, b, c] = await Promise.all([
            supabaseClient.rpc('admin_dashboard'),
            supabaseClient.rpc('admin_registration_pipeline', { p_course: 'ai-fundamentals' }),
            supabaseClient.rpc('admin_agent_funnel', { p_since: null })
        ]);
        if (a.error) setError(a.error.message); else { setError(null); setS(a.data as Summary); }
        if (!b.error && b.data) setRows(b.data as PRow[]);
        if (!c.error && c.data) setAgents(c.data as Agent[]);
        setLoading(false);
    }, []);
    useEffect(() => { void load(); const t = window.setInterval(load, 60000); return () => window.clearInterval(t); }, [load]);

    const by = useMemo(() => {
        const n = (st: string) => rows.filter(r => r.stage === st).length;
        return { all: rows.length, noAccount: n('Registered'), account: n('Account opened'), inCourse: n('In course'), studying: n('Studying'), live: n('Joined live'), completed: n('Completed'), toContact: rows.filter(r => r.followup === 'new' && r.stage !== 'Completed').length };
    }, [rows]);
    const topAgents = useMemo(() => [...agents].filter(a => a.active).sort((x, y) => y.registered - x.registered || y.accounts - x.accounts).slice(0, 5), [agents]);
    const max = Math.max(1, ...(s?.signups_daily || [1]));
    const funnel: [string, number][] = [['Registered', by.all], ['Have an account', by.all - by.noAccount], ['In the course', by.inCourse + by.studying + by.live + by.completed], ['Studying', by.studying + by.live + by.completed], ['Joined a live class', by.live + by.completed], ['Completed', by.completed]];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-gray-500 dark:text-slate-400">Everything happening at Welile School of AI. Updates every minute.</p></div>
                <button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {!s && !error && <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin" size={18} /> Loading...</div>}

            {s && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Stat label="Students" value={s.students} sub={`${s.new_today} today · ${s.new_7d} this week`} icon={Users} to="/enrollments" />
                        <Stat label="Registered, free course" value={by.all} sub={`${by.noAccount} without an account`} icon={UserPlus} to="/free-course" />
                        <Stat label="Studying now" value={by.studying + by.live} sub={`${s.active_7d} active in 7 days`} icon={GraduationCap} to="/free-course" tone="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" />
                        <Stat label="Certificates" value={s.certificates} sub={`${by.completed} completed the course`} icon={Award} to="/free-course" tone="text-amber-600 bg-amber-50 dark:bg-amber-950/40" />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-4">
                        <div className={`${card} p-5 lg:col-span-2`}>
                            <div className="flex items-center justify-between"><h2 className="font-bold">Free course: where everyone is</h2><Link to="/free-course" className="text-sm font-semibold text-violet-700">Open the list</Link></div>
                            <div className="mt-3 space-y-2.5">
                                {funnel.map(([l, n]) => (
                                    <div key={l}>
                                        <div className="flex justify-between text-sm"><span>{l}</span><span className="font-semibold">{n}</span></div>
                                        <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 mt-1"><div className="h-2 rounded-full bg-violet-500" style={{ width: `${Math.min(100, (n / Math.max(1, by.all)) * 100)}%` }} /></div>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 text-sm"><b>{by.toContact}</b> {by.toContact === 1 ? 'person has' : 'people have'} not been followed up yet. <Link to="/free-course" className="font-semibold text-violet-700">Follow up</Link></p>
                        </div>

                        <div className={`${card} p-5`}>
                            <h2 className="font-bold">New students, last 14 days</h2>
                            <div className="flex items-end gap-1 h-28 mt-4" aria-label="New students per day">
                                {(s.signups_daily || []).map((n, i) => <div key={i} title={`${n}`} className="flex-1 rounded-sm bg-violet-300 dark:bg-violet-700" style={{ height: `${Math.max(4, (n / max) * 100)}%`, opacity: n ? 1 : 0.35 }} />)}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{s.new_7d} new in the last 7 days</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Stat label="Next live class" value={s.next_session ? '' : 'None'} sub={s.next_session ? `${s.next_session.title}, ${when(s.next_session.starts_at)}` : 'Create the next sessions in Live Classes'} icon={CalendarClock} to="/live-classes" tone="text-sky-600 bg-sky-50 dark:bg-sky-950/40" />
                        <Stat label="Live classes ahead" value={s.sessions_ahead} sub={`${s.live_joined} people have joined live`} icon={CalendarClock} to="/live-classes" tone="text-sky-600 bg-sky-50 dark:bg-sky-950/40" />
                        <Stat label="Reminders sent" value={s.reminders_7d} sub={`last 7 days · ${s.opted_out} opted out`} icon={Bell} to="/live-classes" tone="text-sky-600 bg-sky-50 dark:bg-sky-950/40" />
                        <Stat label="App installs" value={s.installs} sub="people with the app" icon={Smartphone} to="/free-course" tone="text-sky-600 bg-sky-50 dark:bg-sky-950/40" />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                        <div className={`${card} p-5`}>
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="font-bold flex items-center gap-2"><Handshake size={18} className="text-violet-600" /> Agents</h2>
                                <div className="flex items-center gap-3 text-sm font-semibold">
                                    <Link to="/agents" className="text-violet-700 hover:underline">Monitor agents</Link>
                                    <Link to="/staff" className="text-gray-500 hover:text-gray-800 dark:text-slate-400">Manage</Link>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{s.agents} active agents · {s.agent_regs_7d} registrations this week · {s.leads_7d} sign-ups through links</p>
                            <table className="w-full text-sm mt-3">
                                <thead><tr className="text-left text-xs uppercase text-gray-500"><th className="py-1">Top agents</th><th>Registered</th><th>Accounts</th><th>Completed</th></tr></thead>
                                <tbody>
                                    {topAgents.map(a => <tr key={a.name} className="border-t border-gray-100 dark:border-slate-800"><td className="py-2 font-medium">{a.name}</td><td className="font-semibold">{a.registered}</td><td>{a.accounts}</td><td>{a.completed}</td></tr>)}
                                    {topAgents.length === 0 && <tr><td colSpan={4} className="py-3 text-gray-500">No agents yet. Make a student an agent in Staff & Links.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div className={`${card} p-5`}>
                            <h2 className="font-bold flex items-center gap-2"><Phone size={18} className="text-violet-600" /> Follow up</h2>
                            <p className="text-sm text-gray-500 mt-1">The Welile team turns registrations into studying students.</p>
                            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3"><p className="text-2xl font-extrabold">{by.noAccount}</p><p className="text-xs text-gray-600 dark:text-slate-300">no account yet</p></div>
                                <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 p-3"><p className="text-2xl font-extrabold">{by.account + by.inCourse}</p><p className="text-xs text-gray-600 dark:text-slate-300">not started</p></div>
                                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3"><p className="text-2xl font-extrabold">{by.toContact}</p><p className="text-xs text-gray-600 dark:text-slate-300">to contact</p></div>
                            </div>
                            <Link to="/free-course" className="inline-block mt-4 px-4 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white">Open registrations</Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
