import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ExamResult, HqEnrolment, enrolmentRef, fetchHqEnrolments, marksFor, setExam } from '../../lib/hqApi';
import type { FrontDeskData } from './frontDeskData';
import { card, errorBox, input, label, prettyDate, today } from './frontDeskUi';

const RESULTS: { id: ExamResult; label: string; on: string }[] = [
    { id: 'passed', label: 'Passed', on: 'bg-emerald-600 border-emerald-700 text-white' },
    { id: 'failed', label: 'Failed', on: 'bg-red-600 border-red-700 text-white' },
    { id: 'absent', label: 'Absent', on: 'bg-amber-500 border-amber-600 text-white' },
];

/** Record exam results. Each result you save counts as one attempt, so a second result for the same person is a resit. */
const FrontDeskExams: React.FC<{ data: FrontDeskData }> = ({ data }) => {
    const courses = useMemo(() => data.courses.filter(c => c.active && c.has_exam), [data.courses]);
    const [slug, setSlug] = useState('');
    const [date, setDate] = useState(today());
    const [scores, setScores] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [limit, setLimit] = useState(100);

    useEffect(() => { if (!slug && courses.length > 0) setSlug(courses[0].slug); }, [courses, slug]);
    const course = courses.find(c => c.slug === slug) || null;
    const rows = useMemo(() => data.enrolments.filter(e => e.course_slug === slug && e.status === 'active'), [data.enrolments, slug]);

    const save = async (en: HqEnrolment, result: ExamResult | 'clear') => {
        const score = scores[en.id]?.trim();
        if (score && (Number(score) < 0 || Number(score) > 100 || Number.isNaN(Number(score)))) { setError('The score must be a number from 0 to 100.'); return; }
        setBusy(b => new Set(b).add(en.id)); setError(null);
        const res = await setExam(slug, enrolmentRef(en), result, score ? Number(score) : null, date);
        if (!res.ok) { setError(`Could not save for ${en.person_name || 'this person'}: ${res.error}`); }
        else {
            // Read the course's enrolments again, so the attempts and result are exactly what was saved
            const fresh = await fetchHqEnrolments(slug);
            if (fresh.ok) data.setEnrolments(prev => [...prev.filter(e => e.course_slug !== slug), ...(fresh.data || [])]);
            setScores(s => { const n = { ...s }; delete n[en.id]; return n; });
        }
        setBusy(b => { const n = new Set(b); n.delete(en.id); return n; });
    };

    if (courses.length === 0) return <p className={`${card} p-5 m-0 text-base text-stone-600 dark:text-slate-300`}>{data.loading ? 'Loading...' : 'No course with an exam is set up. Turn on "Has an exam" for a course under More, Courses.'}</p>;

    return (
        <div className="space-y-4">
            <section className={`${card} p-4 space-y-3`}>
                <label className="block"><span className={label}>Course</span><select value={slug} onChange={e => setSlug(e.target.value)} className={input}>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select></label>
                <label className="block"><span className={label}>Exam date</span><input type="date" value={date} max={today()} onChange={e => e.target.value && setDate(e.target.value)} className={input} /></label>
                <p className="m-0 text-sm text-stone-500 dark:text-slate-400">Each result you save is one attempt. Tap Clear result to remove a mistake.</p>
            </section>
            {error && <p role="alert" className={errorBox}>{error}</p>}
            {rows.length === 0 && <p className="m-0 py-4 text-center text-stone-500 dark:text-slate-400">Nobody is enrolled in this course yet.</p>}
            <ul className="m-0 p-0 list-none space-y-3">
                {rows.slice(0, limit).map(en => {
                    const marks = marksFor(data.sheet, slug, enrolmentRef(en));
                    const n = course?.lessons_count || 0;
                    let present = 0; marks.forEach(r => { if (r.status === 'present' && r.lesson_no <= n) present++; });
                    const working = busy.has(en.id);
                    const resit = en.exam_attempts > 0;
                    return (
                        <li key={en.id} className={`${card} p-4 space-y-3 border border-stone-200 dark:border-slate-700`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="m-0 text-base font-bold break-words">{en.person_name || '(no name)'}</p>
                                    <p className="m-0 text-sm text-stone-600 dark:text-slate-300">Lessons {present} of {n}{present < n ? ' (not all attended yet)' : ''}</p>
                                </div>
                                {en.exam_result && <span className={`shrink-0 text-xs font-extrabold px-2.5 py-1 rounded-full ${en.exam_result === 'passed' ? 'bg-emerald-100 text-emerald-800' : en.exam_result === 'failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{en.exam_result === 'passed' ? 'Passed' : en.exam_result === 'failed' ? 'Failed' : 'Absent'}{en.exam_score != null ? ` · ${en.exam_score}%` : ''}</span>}
                            </div>
                            <p className="m-0 text-xs text-stone-500 dark:text-slate-400">
                                {resit ? `Resit: ${en.exam_attempts} ${en.exam_attempts === 1 ? 'attempt' : 'attempts'} so far${en.exam_on ? `, last on ${prettyDate(en.exam_on)}` : ''}.` : 'No attempt yet.'}
                            </p>
                            <label className="block"><span className={label}>Score (optional, 0 to 100)</span>
                                <input value={scores[en.id] ?? ''} onChange={e => setScores(s => ({ ...s, [en.id]: e.target.value }))} className={input} inputMode="numeric" placeholder="e.g. 78" /></label>
                            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Exam result">
                                {RESULTS.map(r => (
                                    <button key={r.id} type="button" disabled={working} onClick={() => void save(en, r.id)}
                                        className={`min-h-[56px] rounded-[14px] border text-base font-extrabold disabled:opacity-60 ${en.exam_result === r.id ? r.on : 'bg-white dark:bg-night-2 border-stone-300 dark:border-slate-600 text-stone-800 dark:text-slate-100'}`}>
                                        {working ? <Loader2 size={16} className="animate-spin inline" /> : resit && en.exam_result !== r.id ? `Resit: ${r.label}` : r.label}
                                    </button>
                                ))}
                            </div>
                            {en.exam_result && <button onClick={() => void save(en, 'clear')} disabled={working} className="w-full min-h-[48px] rounded-[12px] border border-stone-300 dark:border-slate-600 text-sm font-bold">Clear result</button>}
                        </li>
                    );
                })}
            </ul>
            {rows.length > limit && <button onClick={() => setLimit(l => l + 100)} className="min-h-[48px] px-2 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline">Show more ({rows.length - limit} remaining)</button>}
        </div>
    );
};

export default FrontDeskExams;
