import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Award, BadgeDollarSign, CalendarClock, GraduationCap, Handshake, Loader2, RefreshCw, UserPlus, Users, Bell, Phone } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { GLOSSARY, PersonRow, computePeopleMetrics, dailyRegistrations, loadPeople, pct, registeredLast7, registeredToday } from '../../lib/peopleMetrics';

interface Summary {
    students: number; new_today: number; new_7d: number; active_7d: number; enrolled: number; certificates: number; installs: number; live_joined: number;
    next_session: { title: string; starts_at: string; meet_link: string | null } | null; sessions_ahead: number;
    reminders_7d: number; opted_out: number; agents: number; agent_regs_7d: number; leads_7d: number; signups_daily: number[];
}
interface Agent { name: string; registered: number; accounts: number; completed: number; active: boolean; }
interface TrafficMini { total_visits?: number; total_page_views: number; unique_visitors: number; welile_tech_clicks: number; welile_tech_unique: number; live_link_clicks: number; app_launches: number; }

const card = 'bg-white dark:bg-night-2 rounded-[22px]';
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kampala' }) + ' EAT';

const Stat: React.FC<{ label: string; value: number | string; sub?: string; to?: string; icon: React.ElementType; tone?: string; lime?: boolean }> = ({ label, value, sub, to, icon: Icon, tone = 'text-brand bg-brand-soft dark:bg-night-3 dark:text-violet-300', lime }) => {
    const inner = (
        <div className={`${lime ? 'bg-lime-100 text-lime-900' : card} rounded-[22px] p-4 h-full ${to ? 'lift' : ''}`}>
            <div className="flex items-center justify-between gap-2"><span className={`text-[12px] font-bold ${lime ? 'text-lime-800' : 'text-[#6B6680] dark:text-slate-400'}`}>{label}</span><span className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${lime ? 'bg-white/70 text-lime-900' : tone}`}><Icon size={15} /></span></div>
            <p className="m-0 mt-1.5 text-[26px] font-extrabold tracking-[-0.02em] tabular-nums">{value}</p>
            {sub && <p className={`m-0 mt-0.5 text-[11px] font-semibold ${lime ? 'text-lime-800' : 'text-[#6B6680] dark:text-slate-400'}`}>{sub}</p>}
        </div>
    );
    return to ? <Link to={to} className="block no-underline text-inherit">{inner}</Link> : inner;
};

/** Landing page for admins: a summary of everything happening, as cards that open the right page. */
const AdminDashboard: React.FC = () => {
    const [s, setS] = useState<Summary | null>(null);
    const [rows, setRows] = useState<PersonRow[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [traffic, setTraffic] = useState<TrafficMini | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const [a, b, c, d] = await Promise.all([
            supabaseClient.rpc('admin_dashboard'),
            loadPeople(),
            supabaseClient.rpc('admin_agent_funnel', { p_since: null }),
            supabaseClient.rpc('admin_site_analytics', { p_days: 30 })
        ]);
        if (a.error) setError(a.error.message); else { setError(null); setS(a.data as Summary); }
        if (!b.error) setRows(b.rows);
        if (!c.error && c.data) setAgents(c.data as Agent[]);
        if (!d.error && d.data && (d.data as any).overview) setTraffic((d.data as any).overview as TrafficMini);
        setLoading(false);
    }, []);
    useEffect(() => { void load(); const t = window.setInterval(load, 60000); return () => window.clearInterval(t); }, [load]);

    const m = useMemo(() => computePeopleMetrics(rows), [rows]);
    const regToday = useMemo(() => registeredToday(rows), [rows]);
    const regWeek = useMemo(() => registeredLast7(rows), [rows]);
    const daily = useMemo(() => dailyRegistrations(rows, 14), [rows]);
    const topAgents = useMemo(() => [...agents].filter(a => a.active).sort((x, y) => y.registered - x.registered || y.accounts - x.accounts).slice(0, 5), [agents]);
    const max = Math.max(1, ...daily.map(x => x.n));
    // Same groups, same words, same numbers as the People page. Registered = Online + Needs a call; Online = Has an account + Invite pending.
    const funnel: { id: 'all' | 'online' | 'account' | 'invite' | 'notStarted' | 'studying' | 'live' | 'completed' | 'call' | 'paid'; n: number }[] = [
        { id: 'all', n: m.registered },
        { id: 'online', n: m.online },
        { id: 'account', n: m.hasAccount },
        { id: 'invite', n: m.invitePending },
        { id: 'notStarted', n: m.notStarted },
        { id: 'studying', n: m.studying },
        { id: 'live', n: m.joinedLive },
        { id: 'completed', n: m.completed },
        { id: 'call', n: m.needsCall },
        { id: 'paid', n: m.paid },
    ];

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Kampala' });

    return (
        <div className="flex flex-col gap-[18px]">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[260px]">
                    <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">Dashboard</h1>
                    <p className="m-0 mt-1 text-[13px] text-[#6B6680] dark:text-slate-400">{today} · updates every minute</p>
                </div>
                <button onClick={() => void load()} className="press h-11 px-4 rounded-[12px] bg-white dark:bg-night-2 text-[13px] font-bold inline-flex items-center gap-2"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</button>
            </div>

            {error && <p role="alert" className="m-0 rounded-[14px] bg-[#FDECE8] text-[#A3321F] p-3.5 text-[14px]">{error}</p>}
            {!s && !error && <div className="flex items-center gap-2 text-[#6B6680]"><Loader2 className="animate-spin" size={18} /> Loading…</div>}

            {s && (
                <>
                    <section className="relative overflow-hidden rounded-[24px] bg-brand text-white px-6 sm:px-7 py-6 flex flex-wrap items-center gap-5">
                        <span aria-hidden="true" className="absolute -right-16 -top-24 w-[280px] h-[280px] rounded-full bg-brand-mid" />
                        <div className="relative flex-1 min-w-[280px]">
                            <p className="m-0 text-[12px] font-extrabold tracking-[0.12em] uppercase text-[#D9CCFF]">Today</p>
                            <h2 className="m-0 mt-1.5 text-[22px] sm:text-[24px] font-extrabold tracking-[-0.02em]">
                                {regToday} new {regToday === 1 ? 'registration' : 'registrations'} today{s.next_session ? ` · next live class ${when(s.next_session.starts_at)}` : ''}
                            </h2>
                            <p className="m-0 mt-1.5 text-[14px] text-[#E6DEFF]">{m.followUpNew} {m.followUpNew === 1 ? 'person has' : 'people have'} no email and still {m.followUpNew === 1 ? 'needs' : 'need'} a call.</p>
                        </div>
                        <div className="relative flex flex-wrap gap-2.5">
                            <Link to="/people?stage=call" className="press h-11 px-4 rounded-[12px] bg-white text-brand text-[13px] font-extrabold inline-flex items-center gap-2 no-underline"><Phone size={15} />Call them</Link>
                            {s.next_session?.meet_link
                                ? <a href={s.next_session.meet_link} target="_blank" rel="noreferrer" className="press h-11 px-4 rounded-[12px] bg-lime-200 text-ink text-[13px] font-extrabold inline-flex items-center gap-2 no-underline"><CalendarClock size={15} />Open live class</a>
                                : <Link to="/learning?tab=live" className="press h-11 px-4 rounded-[12px] bg-lime-200 text-ink text-[13px] font-extrabold inline-flex items-center gap-2 no-underline"><CalendarClock size={15} />Live classes</Link>}
                        </div>
                    </section>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Stat label={GLOSSARY.all.label} value={m.registered} sub={`${regToday} today · ${regWeek} in last 7 days`} icon={Users} to="/people" />
                        <Stat label={GLOSSARY.call.label} value={m.needsCall} sub={`${m.followUpNew} not called yet`} icon={Phone} to="/people?stage=call" />
                        <Stat label={GLOSSARY.account.label} value={m.hasAccount} sub={`${m.invitePending} invite pending`} icon={UserPlus} to="/people?stage=account" />
                        <Stat label={GLOSSARY.studying.label} value={m.studying} sub={`${s.active_7d} people active in last 7 days`} icon={GraduationCap} to="/people?stage=studying" tone="text-mint bg-mint-soft" />
                        <Stat label={GLOSSARY.completed.label} value={m.completed} sub={`${s.certificates} certificates issued`} icon={Award} to="/people?stage=completed" lime />
                        <Stat label={GLOSSARY.paid.label} value={m.paid} sub={`${pct(m.paid, m.registered)}% of registered`} icon={BadgeDollarSign} to="/people?stage=paid" />
                        <Stat label="Live classes ahead" value={s.sessions_ahead} sub={`${m.joinedLive} joined a live class`} icon={CalendarClock} to="/learning?tab=live" />
                        <Stat label="Reminders sent (email and WhatsApp)" value={s.reminders_7d} sub={`last 7 days · ${s.opted_out} opted out`} icon={Bell} to="/learning?tab=live" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
                        <section className={`${card} p-[22px]`}>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <h2 className="m-0 text-[16px] font-extrabold">People: where everyone is</h2>
                                <Link to="/people" className="press h-9 px-3 rounded-[10px] bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 text-[12px] font-extrabold inline-flex items-center gap-1.5 no-underline">Open People <ArrowUpRight size={14} /></Link>
                            </div>
                            <p className="m-0 mb-3 text-[12px] text-[#6B6680] dark:text-slate-400">Click a line to see those people. Registered = Online + Needs a call. Online = Has an account + Invite pending.</p>
                            <div className="flex flex-col gap-1">
                                {funnel.map((f, i) => (
                                    <Link key={f.id} to={f.id === 'all' ? '/people' : `/people?stage=${f.id}`} title={GLOSSARY[f.id].definition} className="grid grid-cols-[minmax(0,190px)_minmax(0,1fr)_56px] items-center gap-3 rounded-[12px] px-2 py-2 -mx-2 hover:bg-panel dark:hover:bg-night-3/60 no-underline text-inherit">
                                        <span className="text-[13px] text-[#4A4560] dark:text-slate-300 truncate">{GLOSSARY[f.id].label}</span>
                                        <span className="h-2.5 rounded-full bg-[#F1EFF6] dark:bg-night-3 overflow-hidden"><span className={`block h-full rounded-full ${f.id === 'completed' || f.id === 'paid' ? 'bg-lime-500' : f.id === 'call' ? 'bg-amber-400' : 'bg-[#9C7BF0]'}`} style={{ width: `${Math.min(100, (f.n / Math.max(1, m.registered)) * 100)}%` }} /></span>
                                        <span className="text-[13px] font-extrabold text-right tabular-nums">{f.n}</span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                        <section className={`${card} p-[22px] flex flex-col`}>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <h2 className="m-0 text-[16px] font-extrabold">New registrations, last 14 days</h2>
                                <span className="px-2.5 py-1 rounded-full bg-mint-soft text-[#0F5A35] text-[11px] font-extrabold">{regWeek} in last 7 days</span>
                            </div>
                            <div className="flex-1 min-h-[160px] flex items-end gap-1.5" role="img" aria-label="New registrations per day, last 14 days (Kampala days)">
                                {daily.map(({ d, n }, i, arr) => (
                                    <div key={d} title={`${d}: ${n}`} className={`flex-1 rounded-t-[6px] rounded-b-[3px] ${i === arr.length - 1 ? 'bg-brand' : 'bg-[#C9B8F5] dark:bg-brand-mid'}`} style={{ height: `${Math.max(4, (n / max) * 100)}%`, opacity: n ? 1 : 0.4 }} />
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <section className={`${card} p-[22px]`}>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <h2 className="m-0 text-[16px] font-extrabold">Traffic and Welile Tech</h2>
                                <span className="px-2.5 py-1 rounded-full bg-[#F1EFF6] dark:bg-night-3 text-[11px] font-extrabold">30 days</span>
                            </div>
                            {traffic ? (
                                <div className="grid grid-cols-2 gap-2.5">
                                    {[
                                        ['Visits', traffic.total_visits ?? traffic.total_page_views],
                                        ['Unique visitors', traffic.unique_visitors],
                                        ['welile.com clicks', traffic.welile_tech_clicks],
                                        ['App installs (all time)', s.installs],
                                    ].map(([l, v]) => (
                                        <div key={String(l)} className="rounded-[14px] bg-panel dark:bg-night-3/60 p-3"><p className="m-0 text-[11px] font-bold text-[#6B6680] dark:text-slate-400">{l}</p><p className="m-0 mt-0.5 text-[20px] font-extrabold tabular-nums">{v}</p></div>
                                    ))}
                                </div>
                            ) : <p className="m-0 text-[13px] text-[#6B6680]">No traffic data yet.</p>}
                            <Link to="/analytics" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand dark:text-violet-300 no-underline hover:underline">Open Traffic & Clicks <ArrowUpRight size={14} /></Link>
                        </section>

                        <section className={`${card} overflow-hidden`}>
                            <div className="flex items-center justify-between gap-2 p-[22px] pb-3">
                                <h2 className="m-0 text-[16px] font-extrabold flex items-center gap-2"><Handshake size={17} className="text-brand dark:text-violet-300" />Top agents</h2>
                                <div className="flex items-center gap-3 text-[13px] font-bold">
                                    <Link to="/agents" className="text-brand dark:text-violet-300 no-underline hover:underline">Monitor</Link>
                                    <Link to="/staff" className="text-[#6B6680] no-underline hover:underline">Manage</Link>
                                </div>
                            </div>
                            <p className="m-0 px-[22px] pb-3 text-[12px] text-[#6B6680] dark:text-slate-400">{s.agents} active agents · {s.agent_regs_7d} registrations this week · {s.leads_7d} link sign-ups</p>
                            <div role="table" aria-label="Top agents">
                                <div role="row" className="grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] gap-3 px-[22px] py-2.5 bg-[#FAF9FE] dark:bg-night-3/40 text-[10px] font-extrabold tracking-[0.08em] uppercase text-[#6B6680]"><span>Agent</span><span>Reg.</span><span>Accounts</span><span>Done</span></div>
                                {topAgents.map(a => (
                                    <div role="row" key={a.name} className="grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] gap-3 items-center px-[22px] py-2.5 border-t border-[#F4F2F9] dark:border-night-3 text-[13px]">
                                        <span className="flex items-center gap-2.5 min-w-0"><span className="w-8 h-8 rounded-full bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 text-[11px] font-extrabold inline-flex items-center justify-center shrink-0">{a.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span><span className="font-bold truncate">{a.name}</span></span>
                                        <span className="font-extrabold">{a.registered}</span><span>{a.accounts}</span><span>{a.completed}</span>
                                    </div>
                                ))}
                                {topAgents.length === 0 && <p className="m-0 px-[22px] py-4 text-[13px] text-[#6B6680]">No agents yet. Make a student an agent in Staff & Links.</p>}
                            </div>
                        </section>

                        <section className={`${card} p-[22px] flex flex-col`}>
                            <h2 className="m-0 text-[16px] font-extrabold flex items-center gap-2"><Phone size={17} className="text-brand dark:text-violet-300" />Who needs what</h2>
                            <p className="m-0 mt-1 text-[12px] text-[#6B6680] dark:text-slate-400">The Welile team turns registrations into studying students, then paying students.</p>
                            <div className="grid grid-cols-3 gap-2.5 mt-4 text-center">
                                <Link to="/people?stage=call" className="rounded-[14px] bg-[#FFF4CC] text-[#5C4400] p-3 no-underline"><p className="m-0 text-[22px] font-extrabold">{m.needsCall}</p><p className="m-0 text-[11px] font-semibold">{GLOSSARY.call.label}</p></Link>
                                <Link to="/people?stage=invite" className="rounded-[14px] bg-brand-soft dark:bg-night-3 text-brand-ink dark:text-violet-200 p-3 no-underline"><p className="m-0 text-[22px] font-extrabold">{m.invitePending}</p><p className="m-0 text-[11px] font-semibold">{GLOSSARY.invite.label}</p></Link>
                                <Link to="/people?stage=notStarted" className="rounded-[14px] bg-mint-soft text-[#0F5A35] p-3 no-underline"><p className="m-0 text-[22px] font-extrabold">{m.notStarted}</p><p className="m-0 text-[11px] font-semibold">{GLOSSARY.notStarted.label}</p></Link>
                            </div>
                            <p className="m-0 mt-3 text-[12px] text-[#6B6680] dark:text-slate-400">Of the {m.needsCall} who need a call: {m.followUpNew} not called yet · {m.followUpContacted} contacted · {m.followUpInterested} interested · {m.followUpConverted} converted</p>
                            <div className="mt-auto pt-4">
                                <div className="rounded-[16px] bg-night text-white p-3.5 flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#F0533A] shrink-0" aria-hidden="true" />
                                    <span className="flex-1 min-w-0 text-[13px] leading-snug"><strong>Next live class</strong><br /><span className="text-[#C9C3E6]">{s.next_session ? `${s.next_session.title}, ${when(s.next_session.starts_at)}` : 'None scheduled yet'}</span></span>
                                    <Link to="/learning?tab=live" className="press h-9 px-3 rounded-[10px] bg-lime-200 text-ink text-[12px] font-extrabold inline-flex items-center no-underline shrink-0">Open</Link>
                                </div>
                            </div>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
