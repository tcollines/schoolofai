import React, { useState } from 'react';
import { HqCourse, saveHqCourse, ugx } from '../../lib/hqApi';
import type { FrontDeskData } from './frontDeskData';
import { card, chip, errorBox, input, label, toNumber } from './frontDeskUi';

interface Draft { slug: string; title: string; lessons: string; has_exam: boolean; fee: string; active: boolean }
const blank: Draft = { slug: '', title: '', lessons: '3', has_exam: false, fee: '0', active: true };

/** The courses taught at HQ: add one, or change the name, number of lessons, exam, fee and whether it is open. Admins only. */
const FrontDeskCourses: React.FC<{ data: FrontDeskData }> = ({ data }) => {
    const [draft, setDraft] = useState<Draft | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const edit = (c: HqCourse) => { setDraft({ slug: c.slug, title: c.title, lessons: String(c.lessons_count), has_exam: c.has_exam, fee: String(c.fee_ugx), active: c.active }); setError(null); };
    const save = async () => {
        if (!draft) return;
        const lessons = toNumber(draft.lessons);
        if (draft.title.trim().length < 2) { setError('Please type the course name.'); return; }
        if (lessons < 1) { setError('A course needs at least 1 lesson.'); return; }
        setBusy(true); setError(null);
        const res = await saveHqCourse({ slug: draft.slug, title: draft.title, lessons, has_exam: draft.has_exam, fee: toNumber(draft.fee), active: draft.active });
        setBusy(false);
        if (!res.ok) { setError(res.error || 'Could not save the course.'); return; }
        setDraft(null);
        void data.reloadHq();
    };

    if (draft) {
        return (
            <section className={`${card} p-4 space-y-4`}>
                <h2 className="m-0 text-base font-extrabold">{draft.slug ? 'Edit course' : 'Add a course'}</h2>
                <label className="block"><span className={label}>Course name</span><input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className={input} /></label>
                <label className="block"><span className={label}>Number of lessons</span><input value={draft.lessons} onChange={e => setDraft({ ...draft, lessons: e.target.value })} className={input} inputMode="numeric" /></label>
                <label className="block"><span className={label}>Fee in UGX (0 means free)</span><input value={draft.fee} onChange={e => setDraft({ ...draft, fee: e.target.value })} className={input} inputMode="numeric" /></label>
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" aria-pressed={draft.has_exam} onClick={() => setDraft({ ...draft, has_exam: !draft.has_exam })} className={chip(draft.has_exam)}>{draft.has_exam ? '✓ Has an exam' : 'Has an exam'}</button>
                    <button type="button" aria-pressed={draft.active} onClick={() => setDraft({ ...draft, active: !draft.active })} className={chip(draft.active)}>{draft.active ? '✓ Open' : 'Closed'}</button>
                </div>
                {error && <p role="alert" className={errorBox}>{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setDraft(null)} className="min-h-[56px] rounded-[14px] border border-stone-300 dark:border-slate-600 text-base font-bold">Cancel</button>
                    <button onClick={() => void save()} disabled={busy} className="min-h-[56px] rounded-[14px] bg-brand text-white text-base font-extrabold disabled:opacity-60">{busy ? 'Saving...' : 'Save course'}</button>
                </div>
            </section>
        );
    }

    return (
        <div className="space-y-3">
            <button onClick={() => { setDraft(blank); setError(null); }} className="w-full min-h-[60px] rounded-[14px] bg-brand text-white text-lg font-extrabold">Add a course</button>
            {data.courses.length === 0 && <p className={`${card} p-5 m-0 text-center text-stone-500 dark:text-slate-400`}>{data.loading ? 'Loading...' : 'No courses found.'}</p>}
            <ul className="m-0 p-0 list-none space-y-2">
                {data.courses.map(c => (
                    <li key={c.slug}>
                        <button onClick={() => edit(c)} className={`${card} w-full min-h-[64px] p-4 text-left border border-stone-200 dark:border-slate-700 cursor-pointer text-inherit`}>
                            <div className="flex items-start justify-between gap-2"><p className="m-0 text-base font-bold break-words">{c.title}</p><span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-slate-800">{c.active ? 'Open' : 'Closed'}</span></div>
                            <p className="m-0 text-sm text-stone-600 dark:text-slate-300">{c.lessons_count} {c.lessons_count === 1 ? 'lesson' : 'lessons'}{c.has_exam ? ', exam' : ''}, {c.fee_ugx > 0 ? ugx(c.fee_ugx) : 'free'}</p>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FrontDeskCourses;
