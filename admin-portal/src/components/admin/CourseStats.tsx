import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import {
    COURSE_NAME, GLOSSARY, GroupId, PersonRow, canonicalCourse, computePeopleMetrics, hqLessons, isOnline, loadPeople, pct, startedOnline,
} from '../../lib/peopleMetrics';
import { LESSONS, PhysicalRow, buildPersonLookup, fetchPhysicalAttendance, indexPhysical } from '../../lib/physicalAttendance';
import { CallRow, fetchCallLog, indexCalls } from '../../lib/callLog';
import { channelOf } from './peopleChannels';

const card = 'bg-white dark:bg-night-2 rounded-[22px]';
const PROGRAMME = COURSE_NAME;

/** There is exactly one course called Fundamentals of AI: the free online course and the class at HQ are the same programme. */
const courseLabel = (c: string) => canonicalCourse(c);

/** Highest module a person reached online: m1 to m6, 0 if none. */
const reachedModule = (r: PersonRow, k: number) => {
    const touched = r.modules_touched || [];
    if (touched.includes(`m${k}`) || r.highest_module === `m${k}`) return true;
    const hi = Number((r.highest_module || '').replace(/\D/g, '')) || 0;
    return hi >= k;
};

type Route = 'online' | 'hq' | 'both' | 'none';

/** A big number that opens the matching people list when there is one. */
const Stat: React.FC<{ label: string; value: number; note?: string; tone?: string; to?: string; hint?: string }> = ({ label, value, note, tone = 'text-stone-900 dark:text-white', to, hint }) => {
    const inner = (
        <>
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">{label}</p>
            <p className={`m-0 mt-1 text-3xl font-extrabold ${tone}`}>{value}</p>
            {note && <p className="m-0 mt-0.5 text-xs text-stone-500 dark:text-slate-400">{note}</p>}
        </>
    );
    const cls = `${card} p-4 text-left block min-h-[44px] border border-stone-100 dark:border-slate-800`;
    return to
        ? <Link to={to} title={hint} className={`${cls} hover:ring-2 hover:ring-violet-200 dark:hover:ring-violet-900 no-underline text-inherit`}>{inner}</Link>
        : <div title={hint} className={cls}>{inner}</div>;
};

/** A horizontal bar with its count and share. */
const Bar: React.FC<{ label: string; sub?: string; n: number; of: number; tone?: string; to?: string }> = ({ label, sub, n, of, tone = 'bg-violet-600', to }) => {
    const body = (
        <div className="py-2">
            <div className="flex items-baseline justify-between gap-3">
                <p className="m-0 text-sm font-semibold">{label}{sub && <span className="block text-xs font-normal text-stone-500 dark:text-slate-400">{sub}</span>}</p>
                <p className="m-0 text-sm shrink-0"><b>{n}</b> <span className="text-stone-500 dark:text-slate-400">· {pct(n, of)}%</span></p>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${tone}`} style={{ width: `${pct(n, of)}%` }} /></div>
        </div>
    );
    return to ? <Link to={to} className="block no-underline text-inherit min-h-[44px] rounded-[10px] hover:bg-stone-50 dark:hover:bg-slate-800/50 px-1">{body}</Link> : <div className="px-1">{body}</div>;
};

const Section: React.FC<{ title: string; help?: string; children: React.ReactNode }> = ({ title, help, children }) => (
    <section className={`${card} p-4 sm:p-5`}>
        <h2 className="m-0 text-base font-extrabold">{title}</h2>
        {help && <p className="m-0 mt-0.5 mb-3 text-xs text-stone-500 dark:text-slate-400">{help}</p>}
        {!help && <div className="h-3" />}
        {children}
    </section>
);

/** Stats for one course. Fundamentals of AI also shows how many people learned online, at HQ (the 3 physical lessons), or both. */
const CourseStats: React.FC = () => {
    const [rows, setRows] = useState<PersonRow[] | null>(null);
    const [physical, setPhysical] = useState<ReturnType<typeof indexPhysical> | null>(null);
    const [hqRows, setHqRows] = useState<PhysicalRow[]>([]);
    const [callRows, setCallRows] = useState<CallRow[]>([]);
    const [callNote, setCallNote] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hqNote, setHqNote] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<string>(COURSE_NAME);

    const load = useCallback(async () => {
        setLoading(true);
        const [people, hq, log] = await Promise.all([loadPeople(), fetchPhysicalAttendance(), fetchCallLog()]);
        if (people.error) setError(people.error); else { setError(null); setRows(people.rows); }
        setPhysical(() => indexPhysical(hq.rows));
        setHqRows(hq.rows);
        setCallRows(log.rows);
        setCallNote(log.error ? `The call log could not be loaded (${log.error}). The calling numbers may read zero.` : null);
        setHqNote(hq.error ? `HQ attendance could not be loaded (${hq.error}). The HQ numbers below may read zero.` : null);
        setLoading(false);
    }, []);
    useEffect(() => { void load(); }, [load]);

    const courses = useMemo(() => {
        const m = new Map<string, number>();
        (rows || []).forEach(p => (p.courses || []).forEach(c => m.set(c, (m.get(c) || 0) + 1)));
        const list = [...m.entries()].sort((a, b) => b[1] - a[1]);
        // The programme always comes first, even before anyone is in it
        if (!m.has(COURSE_NAME)) list.unshift([COURSE_NAME, 0]);
        else { const i = list.findIndex(x => x[0] === COURSE_NAME); list.unshift(list.splice(i, 1)[0]); }
        return list;
    }, [rows]);

    const pop = useMemo(() => (rows || []).filter(p => (p.courses || []).includes(course)), [rows, course]);
    const lessonsFor = physical || undefined;
    const callIndex = useMemo(() => indexCalls(callRows), [callRows]);
    const m = useMemo(() => computePeopleMetrics(pop, lessonsFor, callIndex), [pop, lessonsFor, callIndex]);
    const isProgramme = course === COURSE_NAME;
    const q = `course=${encodeURIComponent(course)}`;
    const link = (g: GroupId) => `/people?${q}&stage=${g}`;

    const routeOf = (r: PersonRow): Route => {
        const hq = hqLessons(r, lessonsFor).length > 0;
        const on = startedOnline(r);
        return hq && on ? 'both' : hq ? 'hq' : on ? 'online' : 'none';
    };

    const detail = useMemo(() => {
        const accounts = pop.filter(r => r.has_account);
        const modules = [1, 2, 3, 4, 5, 6].map(k => ({ k, n: accounts.filter(r => reachedModule(r, k)).length }));
        const live = pop.filter(r => (r.live_count || 0) > 0 || r.stage === 'Joined live').length;
        const callRows = pop.filter(r => !isOnline(r));
        const callAtHq = callRows.filter(r => hqLessons(r, lessonsFor).length > 0).length;
        const agentToAccount = pop.filter(r => channelOf(r) === 'Registered by an agent' && r.has_account).length;
        const paidBy: Record<Route, number> = { online: 0, hq: 0, both: 0, none: 0 };
        pop.forEach(r => { if (r.paid_enrolled) paidBy[routeOf(r)]++; });
        const hqWalkIns = pop.filter(r => channelOf(r) === 'Registered by an agent' && hqLessons(r, lessonsFor).length > 0).length;
        return { modules, live, callAtHq, agentToAccount, paidBy, hqWalkIns, started: m.studying + m.joinedLive + m.completed };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pop, lessonsFor, m]);

    // Do the numbers agree? Every check uses the same rows as the cards above.
    const checks = useMemo(() => {
        const all = rows || [];
        const known = buildPersonLookup(all.map(r => ({ key: r.key, email: r.email, phone: r.phone })));
        const orphanMarks = hqRows.filter(x => !known({ key: x.person_key, email: x.email, phone: x.phone }));
        const orphanNames = [...new Set(orphanMarks.map(x => (x.person_name || x.person_key || 'unknown').trim()))];
        const orphanCalls = callRows.filter(x => !known({ key: x.person_key, email: x.email, phone: x.phone }));
        const sum4 = m.onlineOnly + m.physicalOnly + m.both + m.notYetAny;
        const journey = m.notStarted + m.studying + m.joinedLive + m.completed;
        return [
            { ok: m.registered === m.online + m.needsCall, title: `Registered ${m.registered} = Online ${m.online} + Needs a call ${m.needsCall}`,
                bad: `Registered is ${m.registered} but Online plus Needs a call is ${m.online + m.needsCall}. Someone is counted in both routes or in neither.` },
            { ok: m.online === m.hasAccount + m.invitePending, title: `Online ${m.online} = Has an account ${m.hasAccount} + Invite pending ${m.invitePending}`,
                bad: `Online is ${m.online} but Has an account plus Invite pending is ${m.hasAccount + m.invitePending}. Someone with an email is in neither box.` },
            { ok: m.hasAccount === journey, title: `Has an account ${m.hasAccount} = Not started ${m.notStarted} + Studying ${m.studying} + Joined a live class ${m.joinedLive} + Completed ${m.completed}`,
                bad: `Has an account is ${m.hasAccount} but the four journey steps add up to ${journey}. Someone with an account is in no step, or in two.` },
            { ok: sum4 === m.registered, title: `Online only ${m.onlineOnly} + At HQ only ${m.physicalOnly} + Both ${m.both} + Not started ${m.notYetAny} = Registered ${m.registered}`,
                bad: `The four learning boxes add up to ${sum4} but Registered is ${m.registered}.` },
            { ok: orphanMarks.length === 0, title: orphanMarks.length === 0 ? `All ${hqRows.length} HQ attendance marks match a registered person` : `${orphanMarks.length} HQ marks match nobody`,
                bad: `These people were marked at HQ but are not on the registered list: ${orphanNames.slice(0, 12).join(', ')}${orphanNames.length > 12 ? ` and ${orphanNames.length - 12} more` : ''}. Register them, or fix the spelling of their phone or email.` },
            { ok: orphanCalls.length === 0, title: orphanCalls.length === 0 ? `All ${callRows.length} logged calls match a registered person` : `${orphanCalls.length} logged calls match nobody`,
                bad: `${orphanCalls.length} calls were logged for people who are not on the registered list, so they are left out of the calling numbers.` },
        ];
    }, [rows, hqRows, callRows, m]);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="m-0 text-2xl font-extrabold">Course stats {isProgramme && <span className="align-middle ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Free online course</span>}</h1>
                    <p className="m-0 mt-1 text-sm text-stone-500 dark:text-slate-400">How many people join each course, how they learn (online, or at HQ), and who goes on to pay.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={course}
                        onChange={e => setCourse(e.target.value)}
                        aria-label="Choose a course"
                        className="flex-1 sm:flex-none min-h-[44px] rounded-[12px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 px-3 py-2 text-sm font-semibold"
                    >
                        {courses.map(([c, n]) => <option key={c} value={c}>{courseLabel(c)} ({n})</option>)}
                    </select>
                    <button onClick={() => void load()} aria-label="Refresh" className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-[12px] border border-stone-200 dark:border-slate-700"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {callNote && isProgramme && <p role="status" className="text-sm text-amber-700 dark:text-amber-400">{callNote}</p>}
            {hqNote && isProgramme && <p role="status" className="text-sm text-amber-700 dark:text-amber-400">{hqNote}</p>}
            {!rows && !error && <div className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={18} /> Loading course stats...</div>}

            {rows && !isProgramme && (
                <Section title={courseLabel(course)} help="Lesson and HQ tracking is set up for Fundamentals of AI. For other courses we show who signed up and who paid.">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Stat label={GLOSSARY.all.label} value={m.registered} to={`/people?${q}`} hint={GLOSSARY.all.definition} />
                        <Stat label={GLOSSARY.account.label} value={m.hasAccount} to={link('account')} hint={GLOSSARY.account.definition} note={`${pct(m.hasAccount, m.registered)}% of registered`} tone="text-violet-700 dark:text-violet-300" />
                        <Stat label={GLOSSARY.paid.label} value={m.paid} to={link('paid')} hint={GLOSSARY.paid.definition} note={`${pct(m.paid, m.registered)}% of registered`} tone="text-emerald-700 dark:text-emerald-400" />
                    </div>
                </Section>
            )}

            {rows && isProgramme && (
                <>
                    <Section title="Who is learning how" help="Every registered person is in exactly one box: online only, at HQ only, both, or not started anywhere yet. The four boxes add up to Registered.">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <Stat label={GLOSSARY.all.label} value={m.registered} to={`/people?${q}`} hint={GLOSSARY.all.definition} />
                            <Stat label="Online only" value={m.onlineOnly} tone="text-violet-700 dark:text-violet-300" hint="Started lessons online and has not been to HQ." />
                            <Stat label="At HQ only" value={m.physicalOnly} tone="text-emerald-700 dark:text-emerald-400" hint="Attended at HQ and has not started lessons online." />
                            <Stat label={GLOSSARY.both.label} value={m.both} to={link('both')} tone="text-teal-700 dark:text-teal-300" hint={GLOSSARY.both.definition} />
                            <Stat label="Not started anywhere" value={m.notYetAny} to={link('notyet')} tone="text-amber-700 dark:text-amber-400" hint={GLOSSARY.notyet.definition} />
                        </div>
                        <p className="m-0 mt-3 text-xs text-stone-500 dark:text-slate-400">Learning online = {m.onlineOnly + m.both}. Learning at HQ = {m.physicalAny}. Started lessons online means at least one lesson done, a live class joined, or finished.</p>
                    </Section>

                    <Section title="Online" help="People with an account study recorded lessons and join live classes. Bars show the share of people with an account.">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <Stat label={GLOSSARY.account.label} value={m.hasAccount} to={link('account')} hint={GLOSSARY.account.definition} note={`${pct(m.hasAccount, m.online)}% of online`} tone="text-violet-700 dark:text-violet-300" />
                            <Stat label="Started lessons" value={detail.started} note={`${pct(detail.started, m.hasAccount)}% of accounts`} hint="Has done a lesson, joined a live class, or finished." />
                            <Stat label="Joined a live class" value={detail.live} to={link('live')} note="at least one class" tone="text-teal-700 dark:text-teal-300" hint="Attended at least one live class, whatever else they have done." />
                            <Stat label={GLOSSARY.completed.label} value={m.completed} to={link('completed')} note={`${pct(m.completed, m.hasAccount)}% of accounts`} tone="text-emerald-700 dark:text-emerald-400" hint={GLOSSARY.completed.definition} />
                        </div>
                        <p className="m-0 mb-1 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">Reached each module online</p>
                        {detail.modules.map(x => <Bar key={x.k} label={`Module ${x.k}`} n={x.n} of={m.hasAccount} />)}
                    </Section>

                    <Section title="At HQ (physical)" help="3 lessons at HQ cover the same 6 modules. Staff mark attendance on the HQ attendance tab or on each person when they follow them up. Bars show the share of everyone registered.">
                        {LESSONS.map(l => (
                            <Bar key={l.no} label={`Lesson ${l.no}`} sub={l.modules} n={l.no === 1 ? m.physicalLesson1 : l.no === 2 ? m.physicalLesson2 : m.physicalLesson3} of={m.registered} tone="bg-emerald-600" to={link('hq')} />
                        ))}
                        <div className="grid grid-cols-3 gap-3 mt-3">
                            <Stat label="Attended all 3" value={m.physicalAll3} to={link('hq3')} tone="text-emerald-700 dark:text-emerald-400" hint={GLOSSARY.hq3.definition} />
                            <Stat label="2 or more" value={m.physicalTwoPlus} to={link('hq')} hint="Attended two or three lessons at HQ." />
                            <Stat label="Exactly 1" value={m.physicalAny - m.physicalTwoPlus} to={link('hq')} hint="Attended only one lesson at HQ." />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <Stat label="Agent-registered, came to HQ" value={detail.hqWalkIns} to={`/people?${q}&channel=${encodeURIComponent('Registered by an agent')}&stage=hq`} note="includes walk-ins registered at the front desk" hint="Registered by an agent (including walk-ins registered at HQ) and has attended at least one lesson." tone="text-emerald-700 dark:text-emerald-400" />
                            <Stat label="Came to HQ, any way" value={m.physicalAny} to={link('hq')} note="everyone with an HQ lesson" hint={GLOSSARY.hq.definition} />
                        </div>
                    </Section>

                    <Section title="Follow-up" help={GLOSSARY.call.definition}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Stat label={GLOSSARY.call.label} value={m.needsCall} to={link('call')} tone="text-amber-700 dark:text-amber-400" note={`${pct(m.needsCall, m.registered)}% of registered`} />
                            <Stat label="Of them, at HQ" value={detail.callAtHq} note="came to at least one lesson" tone="text-emerald-700 dark:text-emerald-400" hint="People with no email who have attended at HQ." />
                            <Stat label="Agent-registered, now online" value={detail.agentToAccount} to={`/people?${q}&channel=${encodeURIComponent('Registered by an agent')}&stage=account`} note="have an account now" tone="text-violet-700 dark:text-violet-300" hint="Registered by an agent and have since opened an account." />
                            <Stat label="Called so far" value={m.followUpContacted + m.followUpInterested + m.followUpConverted + m.followUpNotInterested} note={`${m.followUpNew} not called yet`} hint="People with no email whose follow-up status is anything other than To contact." />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                            <Stat label="To contact" value={m.followUpNew} />
                            <Stat label="Contacted" value={m.followUpContacted} />
                            <Stat label="Interested" value={m.followUpInterested} />
                            <Stat label="Converted" value={m.followUpConverted} />
                            <Stat label="Not interested" value={m.followUpNotInterested} />
                        </div>
                    </Section>

                    <Section title="Calling" help="Calls made by staff from the Front desk. Each person is counted once, by their most recent call.">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Stat label="Needs a call" value={m.needsCall} to={link('call')} tone="text-amber-700 dark:text-amber-400" note={`${m.notCalledYet} not called yet`} hint={GLOSSARY.call.definition} />
                            <Stat label="Called" value={m.calledAny} note={`${m.calledToday} today · ${m.calledThisWeek} in 7 days`} hint="People with at least one logged call." />
                            <Stat label="Reached" value={m.reached} note={`${m.noAnswer} no answer`} tone="text-emerald-700 dark:text-emerald-400" hint="Their latest call reached them." />
                            <Stat label="Call back due" value={m.callBackDue} tone="text-amber-700 dark:text-amber-400" note="follow-up date is today or earlier" hint="Latest call has a call-back date that has come, and they have not converted." />
                        </div>
                        <p className="m-0 mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">Reached people, by what they want next</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <Stat label="Online" value={m.interestedByNextStep.online} />
                            <Stat label="Recorded lessons" value={m.interestedByNextStep.recorded} />
                            <Stat label="HQ lessons" value={m.interestedByNextStep.hq} />
                            <Stat label="Paid course" value={m.interestedByNextStep.paid} />
                            <Stat label="Converted from calls" value={m.convertedFromCalls} tone="text-emerald-700 dark:text-emerald-400" hint="Were called and now are converted, have an account, or came to HQ." />
                        </div>
                        {m.perCaller.length > 0 ? (
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 dark:text-slate-400"><th className="py-2 pr-3">Caller</th><th className="py-2 pr-3 text-right">Calls</th><th className="py-2 pr-3 text-right">Reached</th><th className="py-2 text-right">Now converted</th></tr></thead>
                                    <tbody>{m.perCaller.map(c => (
                                        <tr key={c.name} className="border-t border-stone-100 dark:border-slate-800"><td className="py-2.5 pr-3 font-semibold">{c.name}</td><td className="py-2.5 pr-3 text-right">{c.calls}</td><td className="py-2.5 pr-3 text-right">{c.reached}</td><td className="py-2.5 text-right">{c.converted}</td></tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        ) : <p className="m-0 mt-4 text-sm text-stone-500 dark:text-slate-400">No calls logged yet. Use the Calls tab on the Front desk.</p>}
                    </Section>

                    <Section title="Paid conversion" help={GLOSSARY.paid.definition}>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <Stat label={GLOSSARY.paid.label} value={m.paid} to={link('paid')} note={`${pct(m.paid, m.registered)}% of registered`} tone="text-emerald-700 dark:text-emerald-400" />
                            <Stat label="Paid, online only" value={detail.paidBy.online} note={`of ${m.onlineOnly} online only`} />
                            <Stat label="Paid, at HQ only" value={detail.paidBy.hq} note={`of ${m.physicalOnly} at HQ only`} />
                            <Stat label="Paid, both" value={detail.paidBy.both} note={`of ${m.both} both`} />
                            <Stat label="Paid, not started" value={detail.paidBy.none} note={`of ${m.notYetAny} not started`} />
                        </div>
                    </Section>

                    <Section title="Do the numbers agree?" help="These checks use the same people, calls and HQ marks as every card on this page. Green means the numbers add up. Red says what is off.">
                        <ul className="m-0 p-0 list-none space-y-2">
                            {checks.map((c, i) => (
                                <li key={i} className={`flex items-start gap-3 rounded-[12px] border p-3 ${c.ok ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'}`}>
                                    <span aria-hidden className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-sm font-bold ${c.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>{c.ok ? '✓' : '✕'}</span>
                                    <p className="m-0 text-sm"><span className="sr-only">{c.ok ? 'Agrees: ' : 'Does not agree: '}</span><b>{c.title}</b>{!c.ok && <span className="block mt-0.5 text-red-700 dark:text-red-300">{c.bad}</span>}</p>
                                </li>
                            ))}
                        </ul>
                    </Section>
                </>
            )}
        </div>
    );
};

export default CourseStats;
