import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { HqEnrolment, enrolmentRef, fetchHqEnrolments, graduate, marksFor, readiness, ugx } from '../../lib/hqApi';
import type { FrontDeskData } from './frontDeskData';
import { card, errorBox, input, label, prettyDate, today } from './frontDeskUi';

interface Ask { en: HqEnrolment; undo: boolean; force: boolean; reason?: string }

/** Who can graduate: an exam passed (if the course has one) and every lesson attended. A manager can still graduate someone who is not ready. */
const FrontDeskGraduation: React.FC<{ data: FrontDeskData }> = ({ data }) => {
    const courses = useMemo(() => data.courses.filter(c => c.active || data.enrolments.some(e => e.course_slug === c.slug)), [data.courses, data.enrolments]);
    const [slug, setSlug] = useState('');
    const [ask, setAsk] = useState<Ask | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { if (!slug && courses.length > 0) setSlug((courses.find(c => c.slug === 'ai-fundamentals') || courses[0]).slug); }, [courses, slug]);
    const course = courses.find(c => c.slug === slug);

    const items = useMemo(() => data.enrolments.filter(e => e.course_slug === slug && e.status !== 'withdrawn').map(en => ({ en, r: readiness(en, course, marksFor(data.sheet, slug, enrolmentRef(en))) })), [data.enrolments, data.sheet, slug, course]);
    const ready = items.filter(x => x.r.ready);
    const notReady = items.filter(x => !x.r.ready && !x.r.graduated);
    const done = items.filter(x => x.r.graduated).sort((a, b) => ((b.en.graduated_on || '') > (a.en.graduated_on || '') ? 1 : -1));

    const run = async () => {
        if (!ask) return;
        setBusy(true); setError(null);
        const res = await graduate(slug, enrolmentRef(ask.en), !ask.undo, today(), ask.force);
        setBusy(false);
        if (!res.ok) { setError(res.error || 'Could not save. Please try again.'); setAsk(null); return; }
        if (res.data && res.data.ok === false) {
            // Not ready: say why, and let a manager graduate anyway with a second confirm
            const missing = res.data.missing_lessons && res.data.missing_lessons.length > 0 ? ` Missing lessons ${res.data.missing_lessons.join(', ')}.` : '';
            setAsk({ ...ask, force: true, reason: `${res.data.reason || 'This person is not ready to graduate.'}${missing}` });
            return;
        }
        const fresh = await fetchHqEnrolments(slug);
        if (fresh.ok) data.setEnrolments(prev => [...prev.filter(e => e.course_slug !== slug), ...(fresh.data || [])]);
        setAsk(null);
    };

    const Money: React.FC<{ en: HqEnrolment }> = ({ en }) => (en.fee_ugx > en.paid_ugx ? <p className="m-0 text-sm font-bold text-red-700 dark:text-red-300">Balance owing {ugx(en.fee_ugx - en.paid_ugx)}</p> : null);

    if (courses.length === 0) return <p className={`${card} p-5 m-0 text-base text-stone-600 dark:text-slate-300`}>{data.loading ? 'Loading...' : 'No courses yet.'}</p>;

    return (
        <div className="space-y-5">
            <section className={`${card} p-4`}><label className="block"><span className={label}>Course</span>
                <select value={slug} onChange={e => setSlug(e.target.value)} className={input}>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select></label></section>
            {error && <p role="alert" className={errorBox}>{error}</p>}

            <section className="space-y-2">
                <h2 className="m-0 text-lg font-extrabold">Ready to graduate <span className="text-emerald-600">{ready.length}</span></h2>
                {ready.length === 0 && <p className="m-0 text-sm text-stone-500 dark:text-slate-400">No one is ready yet.</p>}
                <ul className="m-0 p-0 list-none space-y-2">
                    {ready.map(({ en }) => (
                        <li key={en.id} className={`${card} p-4 space-y-2 border border-emerald-200 dark:border-emerald-900`}>
                            <p className="m-0 text-base font-bold break-words">{en.person_name}</p>
                            <p className="m-0 text-sm text-stone-600 dark:text-slate-300">{course?.has_exam ? 'Exam passed. ' : ''}All lessons attended.</p>
                            <Money en={en} />
                            <button onClick={() => setAsk({ en, undo: false, force: false })} className="w-full min-h-[56px] rounded-[14px] bg-emerald-600 text-white text-base font-extrabold">Graduate</button>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="space-y-2">
                <h2 className="m-0 text-lg font-extrabold">Not ready <span className="text-amber-600">{notReady.length}</span></h2>
                <ul className="m-0 p-0 list-none space-y-2">
                    {notReady.map(({ en, r }) => (
                        <li key={en.id} className={`${card} p-4 space-y-1 border border-stone-200 dark:border-slate-700`}>
                            <p className="m-0 text-base font-bold break-words">{en.person_name}</p>
                            <p className="m-0 text-sm text-amber-800 dark:text-amber-300">{r.reasons.join('. ')}</p>
                            <Money en={en} />
                            <button onClick={() => setAsk({ en, undo: false, force: false })} className="mt-1 w-full min-h-[52px] rounded-[14px] border border-stone-300 dark:border-slate-600 text-sm font-bold">Graduate...</button>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="space-y-2">
                <h2 className="m-0 text-lg font-extrabold">Graduated <span className="text-violet-600">{done.length}</span></h2>
                <ul className="m-0 p-0 list-none space-y-2">
                    {done.map(({ en }) => (
                        <li key={en.id} className={`${card} p-4 space-y-1 border border-stone-200 dark:border-slate-700`}>
                            <p className="m-0 text-base font-bold break-words">{en.person_name}</p>
                            <p className="m-0 text-sm text-stone-600 dark:text-slate-300">Graduated {prettyDate(en.graduated_on)}</p>
                            <Money en={en} />
                            <button onClick={() => setAsk({ en, undo: true, force: false })} className="mt-1 w-full min-h-[52px] rounded-[14px] border border-stone-300 dark:border-slate-600 text-sm font-bold">Undo graduation</button>
                        </li>
                    ))}
                </ul>
            </section>

            {ask && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Confirm">
                    <button aria-label="Cancel" onClick={() => !busy && setAsk(null)} className="absolute inset-0 bg-black/40 border-0 cursor-default" />
                    <div className="relative w-full sm:max-w-[440px] rounded-t-[24px] sm:rounded-[24px] bg-panel dark:bg-night p-5 space-y-4" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
                        {ask.reason ? (
                            <>
                                <p className="m-0 text-lg font-extrabold text-red-800 dark:text-red-300">{ask.en.person_name} is not ready</p>
                                <p className="m-0 text-base">{ask.reason}</p>
                                <p className="m-0 text-sm text-stone-600 dark:text-slate-300">A manager can graduate them anyway. It will be recorded as graduated by override.</p>
                            </>
                        ) : ask.undo ? (
                            <p className="m-0 text-lg font-extrabold">Undo graduation for {ask.en.person_name}?</p>
                        ) : (
                            <p className="m-0 text-lg font-extrabold">Graduate {ask.en.person_name} from {course?.title}?</p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setAsk(null)} disabled={busy} className="min-h-[56px] rounded-[14px] border border-stone-300 dark:border-slate-600 text-base font-bold">Cancel</button>
                            <button onClick={() => void run()} disabled={busy} className={`min-h-[56px] rounded-[14px] text-white text-base font-extrabold disabled:opacity-60 inline-flex items-center justify-center gap-2 ${ask.reason ? 'bg-red-600' : 'bg-emerald-600'}`}>
                                {busy ? <Loader2 size={16} className="animate-spin" /> : null}{ask.reason ? 'Graduate anyway' : ask.undo ? 'Yes, undo' : 'Yes, graduate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FrontDeskGraduation;
