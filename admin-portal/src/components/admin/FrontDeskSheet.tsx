import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { applyLocalMark, buildPersonLookup } from '../../lib/physicalAttendance';
import { HqEnrolment, SheetRow, SheetStatus, enrolmentRef, marksFor, samePerson, setHqAttendance } from '../../lib/hqApi';
import type { FrontDeskData } from './frontDeskData';
import { card, chip, errorBox, input, label, shortDate, today } from './frontDeskUi';

type Filter = 'all' | 'none' | 'present' | 'absent';
const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'none', label: 'Not marked' }, { id: 'present', label: 'Present' }, { id: 'absent', label: 'Absent' },
];
const BUTTONS: { id: SheetStatus; label: string; on: string }[] = [
    { id: 'present', label: 'Present', on: 'bg-emerald-600 border-emerald-700 text-white' },
    { id: 'absent', label: 'Absent', on: 'bg-red-600 border-red-700 text-white' },
    { id: 'excused', label: 'Excused', on: 'bg-amber-500 border-amber-600 text-white' },
];
const dot = (s?: SheetStatus) => s === 'present' ? 'bg-emerald-600 text-white' : s === 'absent' ? 'bg-red-600 text-white' : s === 'excused' ? 'bg-amber-500 text-white' : 'bg-stone-100 dark:bg-slate-800 text-stone-400';

/** The class attendance sheet: pick the course, the lesson and the date, then mark each person Present, Absent or Excused. */
const FrontDeskSheet: React.FC<{ data: FrontDeskData }> = ({ data }) => {
    const courses = useMemo(() => data.courses.filter(c => c.active), [data.courses]);
    const [slug, setSlug] = useState('');
    const [lesson, setLesson] = useState(1);
    const [date, setDate] = useState(today());
    const [filter, setFilter] = useState<Filter>('all');
    const [q, setQ] = useState('');
    const [limit, setLimit] = useState(100);
    const [busy, setBusy] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [confirmAll, setConfirmAll] = useState(false);
    const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
    const [addQ, setAddQ] = useState('');

    useEffect(() => {
        if (slug || courses.length === 0) return;
        setSlug((courses.find(c => c.slug === 'ai-fundamentals') || courses[0]).slug);
    }, [courses, slug]);
    const course = courses.find(c => c.slug === slug) || null;
    const lessonCount = course?.lessons_count || 0;
    useEffect(() => { if (lesson > lessonCount && lessonCount > 0) setLesson(1); setLimit(100); }, [slug, lessonCount]); // eslint-disable-line react-hooks/exhaustive-deps

    const enrolled = useMemo(() => data.enrolments.filter(e => e.course_slug === slug && e.status === 'active'), [data.enrolments, slug]);
    const rowsAll = useMemo(() => enrolled.map(en => {
        const marks = marksFor(data.sheet, slug, enrolmentRef(en));
        return { en, marks, status: marks.get(lesson)?.status, row: marks.get(lesson) };
    }), [enrolled, data.sheet, slug, lesson]);

    const counts = useMemo(() => ({
        present: rowsAll.filter(r => r.status === 'present').length,
        absent: rowsAll.filter(r => r.status === 'absent').length,
        excused: rowsAll.filter(r => r.status === 'excused').length,
        none: rowsAll.filter(r => !r.status).length,
    }), [rowsAll]);

    const list = useMemo(() => {
        const term = q.trim().toLowerCase();
        const digits = term.replace(/\D/g, '');
        return rowsAll.filter(r => {
            if (filter === 'none' && r.status) return false;
            if (filter === 'present' && r.status !== 'present') return false;
            if (filter === 'absent' && r.status !== 'absent') return false;
            if (term) {
                const hay = `${r.en.person_name || ''} ${r.en.email || ''}`.toLowerCase();
                const ph = digits.length >= 3 && (r.en.phone || '').replace(/\D/g, '').includes(digits);
                if (!hay.includes(term) && !ph) return false;
            }
            return true;
        });
    }, [rowsAll, filter, q]);

    // Put one mark on screen straight away; the caller puts it back if the save fails
    const applyLocal = (en: HqEnrolment, status: SheetStatus | 'clear') => {
        const ref = enrolmentRef(en);
        data.setSheet(prev => {
            const rest = prev.filter(r => !(r.course_slug === slug && r.lesson_no === lesson && samePerson(ref, { key: r.person_key, email: r.email, phone: r.phone })));
            if (status === 'clear') return rest;
            const row: SheetRow = { person_key: en.person_key, person_name: en.person_name, email: en.email, phone: en.phone, lesson_no: lesson, status, attended_on: date, note: null, course_slug: slug };
            return [...rest, row];
        });
        // The lesson chips on the People screens only know the first 3 lessons of Fundamentals of AI
        if (slug === 'ai-fundamentals' && lesson <= 3) data.setMarks(prev => applyLocalMark(prev, ref, lesson, status === 'present', date));
    };

    const mark = async (en: HqEnrolment, status: SheetStatus | 'clear'): Promise<boolean> => {
        const id = `${en.person_key}:${lesson}`;
        const prevSheet = data.sheet, prevMarks = data.marks;
        setBusy(b => new Set(b).add(id));
        applyLocal(en, status);
        const res = await setHqAttendance(slug, enrolmentRef(en), lesson, status, date);
        setBusy(b => { const n = new Set(b); n.delete(id); return n; });
        if (!res.ok) { data.setSheet(prevSheet); data.setMarks(prevMarks); setError(`Could not save for ${en.person_name || 'this person'}: ${res.error}`); return false; }
        setError(null);
        return true;
    };

    const markAllPresent = async () => {
        setConfirmAll(false);
        const todo = rowsAll.filter(r => !r.status).map(r => r.en);
        setBulk({ done: 0, total: todo.length });
        let done = 0;
        for (const en of todo) {
            const ok = await mark(en, 'present');
            if (!ok) break;
            done++; setBulk({ done, total: todo.length });
        }
        setBulk(null);
    };

    // People not on the list yet: marking them present enrols them
    const known = useMemo(() => buildPersonLookup(enrolled.map(e => ({ key: e.person_key, email: e.email, phone: e.phone }))), [enrolled]);
    const addResults = useMemo(() => {
        const term = addQ.trim().toLowerCase();
        const digits = term.replace(/\D/g, '');
        if (term.length < 2) return [];
        return data.allRows.filter(p => {
            if (known({ key: p.key, email: p.email, phone: p.phone })) return false;
            return `${p.name} ${p.email || ''}`.toLowerCase().includes(term) || (digits.length >= 3 && (p.phone || '').replace(/\D/g, '').includes(digits));
        }).slice(0, 8);
    }, [addQ, data.allRows, known]);
    const addPerson = async (p: { key: string; name: string; email: string | null; phone: string | null }) => {
        setBusy(b => new Set(b).add(`add:${p.key}`));
        const res = await setHqAttendance(slug, { key: p.key, name: p.name, email: p.email, phone: p.phone }, lesson, 'present', date);
        setBusy(b => { const n = new Set(b); n.delete(`add:${p.key}`); return n; });
        if (!res.ok) { setError(`Could not add ${p.name}: ${res.error}`); return; }
        setAddQ('');
        void data.reloadHq();
    };

    if (courses.length === 0) {
        return <p className={`${card} p-5 m-0 text-base text-stone-600 dark:text-slate-300`}>{data.loading ? 'Loading courses...' : 'No courses are set up yet, or they could not be loaded. Add a course under More, Courses.'}</p>;
    }

    return (
        <div className="space-y-4">
            <section className={`${card} p-4 space-y-3`}>
                <label className="block"><span className={label}>Course</span>
                    <select value={slug} onChange={e => setSlug(e.target.value)} className={input}>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
                </label>
                <div>
                    <span className={label}>Lesson</span>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Choose the lesson">
                        {Array.from({ length: lessonCount }, (_, i) => i + 1).map(n => <button key={n} type="button" aria-pressed={lesson === n} onClick={() => setLesson(n)} className={`${chip(lesson === n)} min-w-[64px]`}>{n}</button>)}
                    </div>
                </div>
                <label className="block"><span className={label}>Date</span>
                    <input type="date" value={date} max={today()} onChange={e => e.target.value && setDate(e.target.value)} className={input} />
                </label>
                <p className="m-0 text-base font-bold" aria-live="polite">
                    <span className="text-emerald-700 dark:text-emerald-400">{counts.present} present</span>, <span className="text-red-700 dark:text-red-400">{counts.absent} absent</span>{counts.excused > 0 ? `, ${counts.excused} excused` : ''}, {counts.none} not marked
                </p>
            </section>

            {error && <p role="alert" className={errorBox}>{error}</p>}

            <section className={`${card} p-4 space-y-3`}>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or phone" aria-label="Search" className={`${input} pl-9`} />
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Who to show">
                    {FILTERS.map(f => <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={`${chip(filter === f.id)} min-h-[48px]`}>{f.label}</button>)}
                </div>
                <button onClick={() => setConfirmAll(true)} disabled={counts.none === 0 || !!bulk} className="w-full min-h-[56px] rounded-[14px] border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 text-base font-extrabold disabled:opacity-50">
                    {bulk ? `Saving ${bulk.done} of ${bulk.total}...` : `Mark everyone not yet marked as present (${counts.none})`}
                </button>

                {enrolled.length === 0 && <p className="m-0 py-4 text-center text-stone-500 dark:text-slate-400">Nobody is enrolled in this course yet. Add someone below, or register people first.</p>}

                <ul className="m-0 p-0 list-none space-y-3">
                    {list.slice(0, limit).map(({ en, marks, status, row }) => {
                        const working = busy.has(`${en.person_key}:${lesson}`);
                        const missedEarlier = status === 'absent' && !!row && row.attended_on !== date;
                        return (
                            <li key={en.id} className="rounded-[16px] border border-stone-200 dark:border-slate-700 p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="m-0 text-base font-bold break-words">{en.person_name || '(no name)'}</p>
                                        <p className="m-0 text-xs text-stone-500 dark:text-slate-400 break-all">{[en.phone ? `+${en.phone}` : '', en.email || ''].filter(Boolean).join(' · ')}</p>
                                    </div>
                                    {missedEarlier && <span className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">Missed earlier ({shortDate(row?.attended_on)})</span>}
                                </div>
                                <div className="flex items-center gap-1" aria-label="Lessons so far">
                                    {Array.from({ length: lessonCount }, (_, i) => i + 1).map(n => <span key={n} title={`Lesson ${n}: ${marks.get(n)?.status || 'not marked'}`} className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${dot(marks.get(n)?.status)} ${n === lesson ? 'ring-2 ring-violet-500' : ''}`}>{n}</span>)}
                                </div>
                                <div className="grid grid-cols-3 gap-2" role="group" aria-label={`Mark ${en.person_name || 'person'}`}>
                                    {BUTTONS.map(b => (
                                        <button key={b.id} type="button" disabled={working} aria-pressed={status === b.id} onClick={() => void mark(en, status === b.id ? 'clear' : b.id)}
                                            className={`min-h-[56px] rounded-[14px] border text-base font-extrabold disabled:opacity-60 ${status === b.id ? b.on : 'bg-white dark:bg-night-2 border-stone-300 dark:border-slate-600 text-stone-800 dark:text-slate-100'}`}>
                                            {working && status === b.id ? <Loader2 size={16} className="animate-spin inline" /> : b.label}
                                        </button>
                                    ))}
                                </div>
                            </li>
                        );
                    })}
                </ul>
                {enrolled.length > 0 && list.length === 0 && <p className="m-0 py-4 text-center text-stone-500 dark:text-slate-400">No one matches. Try All, or clear the search.</p>}
                {list.length > limit && <button onClick={() => setLimit(l => l + 100)} className="min-h-[48px] px-2 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline">Show more ({list.length - limit} remaining)</button>}
            </section>

            <section className={`${card} p-4 space-y-3`}>
                <h2 className="m-0 text-base font-extrabold">Add someone not on the list</h2>
                <p className="m-0 text-sm text-stone-500 dark:text-slate-400">Search everyone we know. Tap Present to enrol them in {course?.title} and mark lesson {lesson}.</p>
                <input value={addQ} onChange={e => setAddQ(e.target.value)} placeholder="Search name, phone or email" aria-label="Find a person" className={input} />
                <ul className="m-0 p-0 list-none space-y-2">
                    {addResults.map(p => (
                        <li key={p.key} className="flex items-center gap-3 rounded-[14px] border border-stone-200 dark:border-slate-700 p-3">
                            <div className="min-w-0 flex-1"><p className="m-0 font-bold break-words">{p.name}</p><p className="m-0 text-xs text-stone-500 break-all">{[p.phone ? `+${p.phone}` : '', p.email || ''].filter(Boolean).join(' · ')}</p></div>
                            <button onClick={() => void addPerson(p)} disabled={busy.has(`add:${p.key}`)} className="shrink-0 min-w-[104px] min-h-[56px] rounded-[14px] bg-emerald-600 text-white text-base font-extrabold disabled:opacity-60">{busy.has(`add:${p.key}`) ? 'Saving...' : 'Present'}</button>
                        </li>
                    ))}
                </ul>
                {addQ.trim().length >= 2 && addResults.length === 0 && <p className="m-0 text-sm text-stone-500">No one found. Register them first on the Register screen.</p>}
            </section>

            {confirmAll && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Confirm">
                    <button aria-label="Cancel" onClick={() => setConfirmAll(false)} className="absolute inset-0 bg-black/40 border-0 cursor-default" />
                    <div className="relative w-full sm:max-w-[420px] rounded-t-[24px] sm:rounded-[24px] bg-panel dark:bg-night p-5 space-y-4" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
                        <p className="m-0 text-lg font-extrabold">Mark {counts.none} {counts.none === 1 ? 'person' : 'people'} present for lesson {lesson}?</p>
                        <p className="m-0 text-sm text-stone-600 dark:text-slate-300">Only people not marked yet are changed. Anyone already marked stays as they are.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirmAll(false)} className="min-h-[56px] rounded-[14px] border border-stone-300 dark:border-slate-600 text-base font-bold">Cancel</button>
                            <button onClick={() => void markAllPresent()} className="min-h-[56px] rounded-[14px] bg-emerald-600 text-white text-base font-extrabold">Yes, mark present</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FrontDeskSheet;
