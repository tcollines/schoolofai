import React, { useMemo } from 'react';
import { Enquiry, HqCourse, HqEnrolment, STATUS_LABELS, SheetRow, enrolmentRef, samePerson, sourceLabel, topicLabel, ugx } from '../../lib/hqApi';
import { pct } from '../../lib/peopleMetrics';
import { today } from './frontDeskUi';

const card = 'bg-white dark:bg-night-2 rounded-[22px]';

const Stat: React.FC<{ label: string; value: number | string; note?: string; tone?: string }> = ({ label, value, note, tone = '' }) => (
    <div className={`${card} p-4 border border-stone-100 dark:border-slate-800`}>
        <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">{label}</p>
        <p className={`m-0 mt-1 text-3xl font-extrabold ${tone}`}>{value}</p>
        {note && <p className="m-0 mt-0.5 text-xs text-stone-500 dark:text-slate-400">{note}</p>}
    </div>
);
const Bar: React.FC<{ label: string; sub?: string; n: number; of: number; tone?: string }> = ({ label, sub, n, of, tone = 'bg-emerald-600' }) => (
    <div className="py-2">
        <div className="flex items-baseline justify-between gap-3"><p className="m-0 text-sm font-semibold">{label}{sub && <span className="block text-xs font-normal text-stone-500 dark:text-slate-400">{sub}</span>}</p><p className="m-0 text-sm shrink-0"><b>{n}</b> <span className="text-stone-500 dark:text-slate-400">· {pct(n, of)}%</span></p></div>
        <div className="mt-1.5 h-2.5 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${tone}`} style={{ width: `${pct(n, of)}%` }} /></div>
    </div>
);
const Section: React.FC<{ title: string; help?: string; children: React.ReactNode }> = ({ title, help, children }) => (
    <section className={`${card} p-4 sm:p-5`}><h2 className="m-0 text-base font-extrabold">{title}</h2>{help ? <p className="m-0 mt-0.5 mb-3 text-xs text-stone-500 dark:text-slate-400">{help}</p> : <div className="h-3" />}{children}</section>
);

/** Class numbers for one HQ course: who is enrolled, attendance by lesson, exams, graduates, money, where they came from, and what happened to visitors. */
const CourseHqStats: React.FC<{ hq: HqCourse; enrolments: HqEnrolment[]; sheet: SheetRow[]; enquiries: Enquiry[] }> = ({ hq, enrolments, sheet, enquiries }) => {
    const d = useMemo(() => {
        const total = enrolments.length;
        const byStatus = { active: 0, paused: 0, withdrawn: 0, graduated: 0 } as Record<string, number>;
        enrolments.forEach(e => { byStatus[e.status] = (byStatus[e.status] || 0) + 1; });
        const lessons = Array.from({ length: hq.lessons_count }, (_, i) => i + 1).map(n => {
            const rows = sheet.filter(r => r.lesson_no === n);
            return { n, present: rows.filter(r => r.status === 'present').length, absent: rows.filter(r => r.status === 'absent').length, excused: rows.filter(r => r.status === 'excused').length };
        });
        const taken = enrolments.filter(e => e.exam_result);
        const passed = taken.filter(e => e.exam_result === 'passed').length;
        const failed = taken.filter(e => e.exam_result === 'failed').length;
        const absent = taken.filter(e => e.exam_result === 'absent').length;
        const scores = enrolments.filter(e => e.exam_score != null).map(e => e.exam_score as number);
        const feesDue = enrolments.reduce((a, e) => a + (e.fee_ugx || 0), 0);
        const paid = enrolments.reduce((a, e) => a + (e.paid_ugx || 0), 0);
        const balance = enrolments.reduce((a, e) => a + Math.max(0, (e.fee_ugx || 0) - (e.paid_ugx || 0)), 0);
        const sources = new Map<string, number>();
        enrolments.forEach(e => { const k = sourceLabel(e.source); sources.set(k, (sources.get(k) || 0) + 1); });
        // The visitor funnel: visitors, then registered, then came to class, then paid, then graduated
        const t = today();
        const regVisitors = enquiries.filter(q => q.outcome === 'registered' || !!q.converted_key);
        const enrolOf = (q: Enquiry) => enrolments.find(e => samePerson(enrolmentRef(e), { key: q.converted_key, email: q.email, phone: q.phone }));
        const regEnrols = regVisitors.map(enrolOf).filter((e): e is HqEnrolment => !!e);
        const attended = regEnrols.filter(e => sheet.some(r => r.status === 'present' && samePerson({ key: r.person_key, email: r.email, phone: r.phone }, enrolmentRef(e)))).length;
        const topics = new Map<string, number>();
        enquiries.forEach(q => topics.set(topicLabel(q.topic), (topics.get(topicLabel(q.topic)) || 0) + 1));
        return {
            total, byStatus, lessons, taken: taken.length, passed, failed, absent, passRate: pct(passed, passed + failed),
            avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null, feesDue, paid, balance,
            sources: [...sources.entries()].sort((a, b) => b[1] - a[1]), visitors: enquiries.length, registered: regVisitors.length, attended,
            paidV: regEnrols.filter(e => (e.paid_ugx || 0) > 0).length, gradV: regEnrols.filter(e => e.status === 'graduated').length,
            topics: [...topics.entries()].sort((a, b) => b[1] - a[1]),
            due: enquiries.filter(q => !!q.follow_up_on && (q.follow_up_on as string) <= t && (q.outcome === 'thinking' || q.outcome === 'follow_up')).length,
        };
    }, [hq, enrolments, sheet, enquiries]);
    const showMoney = hq.fee_ugx > 0 || d.feesDue > 0;

    return (
        <>
            <Section title="At HQ: who is enrolled" help={`Everyone enrolled in ${hq.title} at HQ, by status. The four boxes add up to the total.`}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Stat label="Enrolled" value={d.total} />
                    {(['active', 'paused', 'withdrawn', 'graduated'] as const).map(s => <Stat key={s} label={STATUS_LABELS[s]} value={d.byStatus[s] || 0} note={`${pct(d.byStatus[s] || 0, d.total)}%`} tone={s === 'graduated' ? 'text-violet-700 dark:text-violet-300' : ''} />)}
                </div>
            </Section>

            <Section title="Class attendance by lesson" help="Present, absent and excused marks for each lesson. Bars show the share of everyone enrolled who was present.">
                {d.lessons.map(l => (
                    <div key={l.n}>
                        <Bar label={`Lesson ${l.n}`} sub={`${l.absent} absent · ${l.excused} excused`} n={l.present} of={d.total} />
                    </div>
                ))}
                {d.lessons.length === 0 && <p className="m-0 text-sm text-stone-500">This course has no lessons set up.</p>}
            </Section>

            {hq.has_exam && (
                <Section title="Exam" help="Each saved result is one attempt, so a person who resits can appear more than once in the totals of attempts but only once here, by their latest result.">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Stat label="Took the exam" value={d.taken} note={`${pct(d.taken, d.total)}% of enrolled`} />
                        <Stat label="Passed" value={d.passed} tone="text-emerald-700 dark:text-emerald-400" />
                        <Stat label="Failed" value={d.failed} tone="text-red-700 dark:text-red-400" />
                        <Stat label="Absent" value={d.absent} tone="text-amber-700 dark:text-amber-400" />
                        <Stat label="Pass rate" value={`${d.passRate}%`} note={d.avg != null ? `average score ${d.avg}%` : 'no scores yet'} />
                    </div>
                </Section>
            )}

            <Section title="Graduated">
                <div className="grid grid-cols-2 gap-3"><Stat label="Graduated" value={d.byStatus.graduated || 0} tone="text-violet-700 dark:text-violet-300" /><Stat label="Share of enrolled" value={`${pct(d.byStatus.graduated || 0, d.total)}%`} /></div>
            </Section>

            {showMoney && (
                <Section title="Money" help="Fees due, paid and still owing for this course.">
                    <div className="grid grid-cols-3 gap-3"><Stat label="Fees due" value={ugx(d.feesDue)} /><Stat label="Paid" value={ugx(d.paid)} tone="text-emerald-700 dark:text-emerald-400" /><Stat label="Balance" value={ugx(d.balance)} tone="text-red-700 dark:text-red-400" /></div>
                </Section>
            )}

            <Section title="Where enrolments came from">
                {d.sources.length === 0 ? <p className="m-0 text-sm text-stone-500">No enrolments yet.</p> : d.sources.map(([k, n]) => <Bar key={k} label={k} n={n} of={d.total} tone="bg-violet-600" />)}
            </Section>

            <Section title="Visitors who came to ask" help="From the visitor log. Visitors, then who registered, came to class, paid and graduated.">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Stat label="Visitors" value={d.visitors} />
                    <Stat label="Registered" value={d.registered} note={`${pct(d.registered, d.visitors)}% of visitors`} />
                    <Stat label="Came to class" value={d.attended} note={`${pct(d.attended, d.visitors)}% of visitors`} />
                    <Stat label="Paid" value={d.paidV} note={`${pct(d.paidV, d.visitors)}% of visitors`} />
                    <Stat label="Graduated" value={d.gradV} note={`${pct(d.gradV, d.visitors)}% of visitors`} />
                </div>
                <p className="m-0 mt-4 mb-1 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">What they asked about</p>
                {d.topics.length === 0 ? <p className="m-0 text-sm text-stone-500">No visitors logged yet.</p> : d.topics.map(([k, n]) => <Bar key={k} label={k} n={n} of={d.visitors} tone="bg-sky-600" />)}
                <p className="m-0 mt-3 text-sm"><b>{d.due}</b> follow-ups due today or overdue.</p>
            </Section>
        </>
    );
};

export default CourseHqStats;
