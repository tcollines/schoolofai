import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeDollarSign, ConciergeBell, CalendarClock, CalendarDays, GraduationCap, Loader2, Mail, MailPlus, Phone, Plus, RefreshCw, UserPlus, Users, Wifi } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { CalEvent, loadCalendar } from '../../lib/staffCalendarApi';
import { GLOSSARY, PersonRow, computePeopleMetrics, kampalaDay, loadPeople } from '../../lib/peopleMetrics';
import { PhysicalRow, fetchPhysicalAttendance, indexPhysical } from '../../lib/physicalAttendance';
import { CallRow, fetchCallLog, indexCalls } from '../../lib/callLog';
import { calColor, nowEat, timeRange, todaysBlocks } from './StaffCalendarView';

interface Summary {
    students: number; new_today: number; new_7d: number; active_7d: number; enrolled: number;
    next_session: { title: string; starts_at: string; meet_link: string | null } | null; sessions_ahead: number;
    reminders_7d: number; agents: number; agent_regs_7d: number;
}

const card = 'bg-white dark:bg-night-2 rounded-[22px]';
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kampala' }) + ' EAT';

const Tile: React.FC<{ label: string; value: number | string; icon: React.ElementType; to: string }> = ({ label, value, icon: Icon, to }) => (
    <Link to={to} className="block no-underline text-inherit press">
        <div className={`${card} p-4 h-full min-h-[96px]`}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-bold text-[#6B6680] dark:text-slate-400">{label}</span>
                <span className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300"><Icon size={17} /></span>
            </div>
            <p className="m-0 mt-1 text-[28px] font-extrabold tracking-[-0.02em] tabular-nums">{value}</p>
        </div>
    </Link>
);

const Attention: React.FC<{ text: string; cta: string; to: string }> = ({ text, cta, to }) => (
    <div className="flex items-center gap-3 py-3 border-t border-[#F4F2F9] dark:border-night-3 first:border-t-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#F0533A] shrink-0" aria-hidden="true" />
        <p className="m-0 flex-1 min-w-0 text-[14px] leading-snug">{text}</p>
        <Link to={to} className="press min-h-[44px] px-4 rounded-[12px] bg-brand text-white text-[14px] font-bold inline-flex items-center no-underline shrink-0">{cta}</Link>
    </div>
);

/** First page an admin sees: a few big numbers, what needs attention, and today's own timetable. */
const AdminToday: React.FC<{ firstName?: string }> = ({ firstName }) => {
    const [s, setS] = useState<Summary | null>(null);
    const [rows, setRows] = useState<PersonRow[]>([]);
    const [mine, setMine] = useState<CalEvent[] | null>(null);
    const [marks, setMarks] = useState<PhysicalRow[]>([]);
    const [callRows, setCallRows] = useState<CallRow[]>([]);
    const [deskOk, setDeskOk] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const [a, b, hq, log] = await Promise.all([
            supabaseClient.rpc('admin_dashboard'),
            loadPeople(),
            fetchPhysicalAttendance(),
            fetchCallLog(),
        ]);
        // The front desk card is for people allowed to see these (admins). If both loads are refused, the card stays hidden.
        setMarks(hq.rows);
        setCallRows(log.rows);
        setDeskOk(!hq.error || !log.error);
        if (a.error) setError(a.error.message); else { setError(null); setS(a.data as Summary); }
        if (!b.error) setRows(b.rows);
        setLoading(false);
    }, []);
    useEffect(() => { void load(); }, [load]);
    useEffect(() => { loadCalendar().then(setMine).catch(() => setMine([])); }, []);

    const lessonsFor = useMemo(() => indexPhysical(marks), [marks]);
    const callIndex = useMemo(() => indexCalls(callRows), [callRows]);
    const m = useMemo(() => computePeopleMetrics(rows, lessonsFor, callIndex), [rows, lessonsFor, callIndex]);
    // Front desk today (Kampala day): people called, people reached, and people marked at HQ
    const desk = useMemo(() => {
        const t = kampalaDay(Date.now());
        const callsToday = callRows.filter(c => kampalaDay(c.called_at) === t);
        return {
            called: new Set(callsToday.map(c => c.person_key)).size,
            reached: new Set(callsToday.filter(c => c.outcome === 'reached').map(c => c.person_key)).size,
            atHq: new Set(marks.filter(x => x.attended_on === t).map(x => x.person_key)).size,
        };
    }, [callRows, marks]);
    const todays = useMemo(() => todaysBlocks(mine || [], nowEat()), [mine]);
    const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Kampala' });
    const hour = nowEat().getUTCHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="flex flex-col gap-4 max-w-[900px]">
            <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em]">{greet}{firstName ? `, ${firstName}` : ''}</h1>
                    <p className="m-0 mt-1 text-[14px] text-[#6B6680] dark:text-slate-400">{dateLabel}</p>
                </div>
                <button onClick={() => void load()} aria-label="Refresh" className="press w-11 h-11 rounded-[12px] bg-white dark:bg-night-2 inline-flex items-center justify-center shrink-0"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button>
            </div>

            {error && <p role="alert" className="m-0 rounded-[14px] bg-[#FDECE8] text-[#A3321F] p-3.5 text-[14px]">{error}</p>}
            {!s && !error && <div className="flex items-center gap-2 text-[#6B6680] text-[14px]"><Loader2 className="animate-spin" size={18} /> Loading…</div>}

            {s && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Tile label={GLOSSARY.all.label} value={m.registered} icon={Users} to="/people" />
                        <Tile label={GLOSSARY.online.label} value={m.online} icon={Wifi} to="/people?stage=online" />
                        <Tile label={GLOSSARY.call.label} value={m.needsCall} icon={Phone} to="/people?stage=call" />
                        <Tile label={GLOSSARY.account.label} value={m.hasAccount} icon={UserPlus} to="/people?stage=account" />
                        <Tile label={GLOSSARY.invite.label} value={m.invitePending} icon={MailPlus} to="/people?stage=invite" />
                        <Tile label={GLOSSARY.studying.label} value={m.studying} icon={GraduationCap} to="/people?stage=studying" />
                        <Tile label={GLOSSARY.paid.label} value={m.paid} icon={BadgeDollarSign} to="/people?stage=paid" />
                        <Tile label="Live classes ahead" value={s.sessions_ahead} icon={CalendarClock} to="/learning?tab=live" />
                        <Tile label="Reminders sent, 7 days" value={s.reminders_7d} icon={Mail} to="/mails" />
                    </div>

                    {deskOk && (
                        <section className={`${card} p-[18px]`}>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <h2 className="m-0 text-[17px] font-extrabold flex items-center gap-2"><ConciergeBell size={18} className="text-brand dark:text-violet-300" />Front desk today</h2>
                                <Link to="/learning?tab=hq" className="press min-h-[44px] px-4 rounded-[12px] bg-brand text-white text-[14px] font-bold inline-flex items-center no-underline">Open</Link>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Link to="/learning?tab=hq&mode=calls" className="no-underline text-inherit rounded-[14px] bg-brand-soft dark:bg-night-3 p-3 min-h-[72px]"><span className="block text-[13px] font-bold text-[#6B6680] dark:text-slate-400">Called today</span><span className="block text-[24px] font-extrabold tabular-nums">{desk.called}</span></Link>
                                <Link to="/learning?tab=hq&mode=calls" className="no-underline text-inherit rounded-[14px] bg-brand-soft dark:bg-night-3 p-3 min-h-[72px]"><span className="block text-[13px] font-bold text-[#6B6680] dark:text-slate-400">Reached today</span><span className="block text-[24px] font-extrabold tabular-nums">{desk.reached}</span></Link>
                                <Link to="/learning?tab=hq&mode=attendance" className="no-underline text-inherit rounded-[14px] bg-brand-soft dark:bg-night-3 p-3 min-h-[72px]"><span className="block text-[13px] font-bold text-[#6B6680] dark:text-slate-400">At HQ today</span><span className="block text-[24px] font-extrabold tabular-nums">{desk.atHq}</span></Link>
                                <Link to="/learning?tab=hq&mode=calls" className="no-underline text-inherit rounded-[14px] bg-brand-soft dark:bg-night-3 p-3 min-h-[72px]"><span className="block text-[13px] font-bold text-[#6B6680] dark:text-slate-400">Call backs due</span><span className="block text-[24px] font-extrabold tabular-nums">{m.callBackDue}</span></Link>
                            </div>
                        </section>
                    )}

                    <section className={`${card} p-[18px]`}>
                        <h2 className="m-0 mb-1 text-[17px] font-extrabold">Needs attention</h2>
                        {m.followUpNew === 0 && m.invitePending === 0 && s.sessions_ahead > 0
                            ? <p className="m-0 py-3 text-[14px] text-[#6B6680] dark:text-slate-400">Nothing waiting. Well done.</p>
                            : (
                                <div>
                                    {m.followUpNew > 0 && <Attention text={`${m.followUpNew} ${m.followUpNew === 1 ? 'person has' : 'people have'} no email and still ${m.followUpNew === 1 ? 'needs' : 'need'} a call`} cta="Call them" to="/people?stage=call" />}
                                    {m.invitePending > 0 && <Attention text={`${m.invitePending} ${m.invitePending === 1 ? 'person has' : 'people have'} an email but no account yet`} cta="Invite them" to="/people?stage=invite" />}
                                    {s.sessions_ahead === 0 && <Attention text="No live class is scheduled" cta="Schedule" to="/learning?tab=live" />}
                                </div>
                            )}
                    </section>

                    {s.next_session && (
                        <section className="rounded-[22px] bg-night text-white p-4 flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F0533A] shrink-0" aria-hidden="true" />
                            <p className="m-0 flex-1 min-w-0 text-[14px] leading-snug"><strong>Next live class</strong><br /><span className="text-[#C9C3E6]">{s.next_session.title}, {when(s.next_session.starts_at)}</span></p>
                            {s.next_session.meet_link
                                ? <a href={s.next_session.meet_link} target="_blank" rel="noreferrer" className="press min-h-[44px] px-4 rounded-[12px] bg-lime-200 text-ink text-[14px] font-bold inline-flex items-center no-underline shrink-0">Open</a>
                                : <Link to="/learning?tab=live" className="press min-h-[44px] px-4 rounded-[12px] bg-lime-200 text-ink text-[14px] font-bold inline-flex items-center no-underline shrink-0">Open</Link>}
                        </section>
                    )}
                </>
            )}

            <section className={`${card} p-[18px]`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="m-0 text-[17px] font-extrabold flex items-center gap-2"><CalendarDays size={18} className="text-brand dark:text-violet-300" />My week, today</h2>
                    <Link to="/week" className="press min-h-[44px] inline-flex items-center gap-1 text-[14px] font-bold text-brand dark:text-violet-300 no-underline">Open <ArrowRight size={15} /></Link>
                </div>
                {mine === null ? <p className="m-0 text-[14px] text-[#6B6680]">Loading…</p>
                    : todays.length === 0
                        ? <div className="flex items-center gap-3"><p className="m-0 flex-1 text-[14px] text-[#6B6680] dark:text-slate-400">Nothing planned for today.</p><Link to="/week" className="press min-h-[44px] px-4 rounded-[12px] bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 text-[14px] font-bold inline-flex items-center gap-1.5 no-underline"><Plus size={15} />Add</Link></div>
                        : (
                            <div className="flex flex-col gap-2">
                                {todays.map(ev => (
                                    <Link key={ev.id} to="/week" className={`press no-underline block rounded-[14px] border-l-4 border p-3 ${calColor(ev.category).block}`}>
                                        <p className="m-0 text-[15px] font-bold">{ev.title}</p>
                                        <p className="m-0 text-[14px] opacity-80">{timeRange(ev)}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
            </section>

            <Link to="/dashboard" className="press min-h-[48px] rounded-[14px] bg-white dark:bg-night-2 inline-flex items-center justify-center gap-2 text-[14px] font-bold text-brand dark:text-violet-300 no-underline">Open the full dashboard <ArrowRight size={16} /></Link>
        </div>
    );
};

export default AdminToday;
