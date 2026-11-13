import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, PlayCircle, Sparkles, Video } from 'lucide-react';
import { COURSE } from '../../src/content/aiFundamentals';
import { LESSONS_OPEN_LABEL, LIVE_SCHEDULE } from '../../src/lib/courseAccess';
import { BTN_PRIMARY, CARD, MUTED } from './learnUi';

/** Shown instead of a locked lesson, quiz or the final assessment before the course opens. */
const ComingSoon: React.FC<{ firstName?: string; compact?: boolean }> = ({ firstName, compact }) => (
    <div className={`max-w-2xl mx-auto px-4 sm:px-6 ${compact ? 'py-6' : 'py-12'}`}>
        <div className={`${CARD} rounded-3xl p-7 sm:p-10 text-center bg-gradient-to-b from-violet-50 to-white dark:from-slate-900 dark:to-slate-900`}>
            <span className="mx-auto w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 flex items-center justify-center"><Sparkles size={26} /></span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-violet-800 dark:text-violet-300">You are registered</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight mt-2">
                {firstName ? `${firstName}, your` : 'Your'} lessons begin on {LESSONS_OPEN_LABEL}
            </h1>
            <p className={`mt-4 text-base leading-relaxed ${MUTED}`}>
                Thank you for joining {COURSE.short}. Your place is saved. Watch the welcome video now. You can learn two ways: join the live classes below, or study at your own pace once every lesson, quiz and hands-on task opens on {LESSONS_OPEN_LABEL}.
            </p>

            <div className="mt-7 text-left rounded-2xl border border-violet-100 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-5">
                <p className="flex items-center gap-2 font-semibold"><Video size={18} className="text-violet-700 dark:text-violet-400" /> Live classes: 3 a week</p>
                <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {LIVE_SCHEDULE.map(s => (
                        <li key={s.day} className="rounded-xl bg-violet-50 dark:bg-slate-900 py-3 px-1">
                            <p className="font-semibold text-sm">{s.day}</p>
                            <p className="text-violet-800 dark:text-violet-300 font-bold">{s.time}</p>
                        </li>
                    ))}
                </ul>
                <p className={`mt-3 text-sm ${MUTED}`}>East Africa Time. Join to ask questions and practise with others. The join link appears in the course timetable shortly before each class.</p>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to={`/learn/${COURSE.slug}/item/m0-l1`} className={BTN_PRIMARY}><PlayCircle size={18} /> Watch the welcome video</Link>
                <Link to={`/learn/${COURSE.slug}/live`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 dark:border-slate-700 px-5 py-3 font-semibold hover:bg-stone-50 dark:hover:bg-slate-800"><CalendarClock size={18} /> Live class timetable</Link>
            </div>
        </div>
    </div>
);

export default ComingSoon;
