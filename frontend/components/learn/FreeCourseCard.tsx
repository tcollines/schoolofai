import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Clock, GraduationCap, Layers } from 'lucide-react';
import { COURSE, MODULES } from '../../src/content/aiFundamentals';
import { useFreeCourse } from '../../src/hooks/useFreeCourse';
import { ProgressRing } from './learnUi';

interface Props {
    uid?: string;
    /** featured: big card for the dashboard and Browse. compact: a row card for My Courses. */
    variant?: 'featured' | 'compact';
}

const BASE = `/learn/${COURSE.slug}`;

/** The free AI Fundamentals course, with the student's own progress. */
const FreeCourseCard: React.FC<Props> = ({ uid, variant = 'featured' }) => {
    const s = useFreeCourse(uid);

    const signedIn = !!uid && uid !== 'guest';
    const cta = !signedIn ? { label: 'Start the course', to: '/free/ai-fundamentals' } : s.cert ? { label: 'View your certificate', to: `${BASE}/certificate` }
        : s.finalPassed ? { label: 'Get your certificate', to: `${BASE}/certificate` }
        : s.started ? { label: 'Resume', to: s.nextItemId ? `${BASE}/item/${s.nextItemId}` : `${BASE}/final` }
        : { label: 'Start the course', to: BASE };

    const status = s.cert ? 'Completed' : s.started ? 'In progress' : 'Not started';

    if (variant === 'compact') {
        return (
            <Link
                to={s.started || s.cert ? BASE : '/free/ai-fundamentals'}
                className="group flex items-center gap-4 rounded-[20px] bg-white dark:bg-night-2 p-4 hover:-translate-y-0.5 transition-colors"
            >
                <div className="shrink-0 w-14 h-14 rounded-[14px] bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 flex items-center justify-center"><GraduationCap size={26} /></div>
                <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold leading-snug">{COURSE.short}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-lime-200 text-lime-900">Free</span>
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-[#EEEBF6] dark:bg-night-3 overflow-hidden" role="progressbar" aria-valuenow={s.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
                            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold tabular-nums w-9 text-right">{s.pct}%</span>
                    </div>
                    <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">{status} · {s.done} of {s.total} items</p>
                </div>
                <ArrowRight size={18} className="shrink-0 text-stone-400 group-hover:text-brand transition-colors" />
            </Link>
        );
    }

    return (
        <section aria-label={COURSE.title} className="rounded-[24px] bg-white dark:bg-night-2 overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1 min-w-0">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-brand dark:text-violet-300 bg-brand-soft dark:bg-night-3 px-3 py-1.5 rounded-full">
                        Free course · sponsored by {COURSE.sponsor}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] leading-tight mt-4">{COURSE.title}</h2>
                    <p className="mt-2 text-stone-600 dark:text-slate-400 max-w-xl">{COURSE.tagline}</p>

                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-stone-700 dark:text-slate-300">
                        <li className="inline-flex items-center gap-1.5"><Clock size={15} /> About {COURSE.hours}</li>
                        <li className="inline-flex items-center gap-1.5"><Layers size={15} /> {MODULES.length - 1} modules</li>
                        <li className="inline-flex items-center gap-1.5"><Award size={15} /> Free certificate</li>
                    </ul>

                    {s.started && !s.cert && s.nextItemTitle && (
                        <p className="mt-4 text-sm text-stone-600 dark:text-slate-400">Up next: <span className="font-semibold text-ink dark:text-slate-100">{s.nextItemTitle}</span></p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Link to={cta.to} className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-brand hover:bg-brand-mid text-white font-semibold px-6 py-3.5 text-[15px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                            {cta.label} <ArrowRight size={18} />
                        </Link>
                        {!s.started && !s.cert && (
                            <Link to="/free/ai-fundamentals" className="text-sm font-semibold text-brand dark:text-violet-300 hover:underline">See what is inside</Link>
                        )}
                        <Link to={`${BASE}/live`} className="text-sm font-semibold text-brand dark:text-violet-300 hover:underline">Live classes</Link>
                    </div>
                </div>

                <div className="flex md:flex-col items-center gap-4 md:gap-2 md:px-4">
                    <ProgressRing pct={s.pct} size={104} stroke={9} />
                    <div className="text-sm md:text-center">
                        <p className="font-semibold">{status}</p>
                        <p className="text-stone-600 dark:text-slate-400">{s.done} of {s.total} items done</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FreeCourseCard;
