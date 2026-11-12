import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, CalendarClock, CheckCircle2, Circle, FileText, HelpCircle, Lock, PlayCircle } from 'lucide-react';
import { ALL_ITEMS, COURSE, MODULES } from '../../src/content/aiFundamentals';
import { completionState } from '../../src/lib/learnApi';
import { useLearn } from './learnContext';
import { LESSONS_OPEN_LABEL, LIVE_SCHEDULE, isItemOpen, lessonsAreOpen } from '../../src/lib/courseAccess';
import { useSessions } from './LivePanel';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, MUTED, ProgressRing, formatEAT } from './learnUi';

const kindIcon = (kind: string) => kind === 'video' ? PlayCircle : kind === 'quiz' ? HelpCircle : FileText;

const CourseHome: React.FC = () => {
    const { uid, progress, fullName, cert, fullAccess } = useLearn();
    const preLaunch = !fullAccess && !lessonsAreOpen();
    const sessions = useSessions();
    const base = `/learn/${COURSE.slug}`;
    const state = completionState(progress, uid);
    const nextItem = ALL_ITEMS.find(i => progress[i.id]?.status !== 'completed');
    const started = Object.keys(progress).length > 0;
    const nextLive = (sessions || []).find(s => new Date(s.ends_at).getTime() > Date.now());

    const resumeTo = cert ? `${base}/certificate` : nextItem ? `${base}/item/${nextItem.id}` : `${base}/final`;
    const resumeLabel = cert ? 'View your certificate' : nextItem ? (started ? 'Resume' : 'Start the course') : state.finalPassed ? 'Get your certificate' : 'Take the final assessment';
    const first = (fullName || '').split(' ')[0];

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* hero */}
            <section className={`${CARD} rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6`}>
                <ProgressRing pct={state.pct} size={84} stroke={8} />
                <div className="flex-1 min-w-0">
                    <p className={`text-sm ${MUTED}`}>{started ? `Welcome back${first ? ', ' + first : ''}` : `Welcome${first ? ', ' + first : ''}`}</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">{COURSE.title}</h1>
                    <p className={`mt-1 text-sm ${MUTED}`}>
                        {state.done} of {state.total} items complete{nextItem && ` · Up next: ${nextItem.title}`}
                    </p>
                </div>
                <Link to={resumeTo} className={`${BTN_PRIMARY} w-full sm:w-auto`}>{resumeLabel} <ArrowRight size={18} /></Link>
            </section>

            {preLaunch && (
                <section className="mt-6 rounded-3xl border border-violet-200 dark:border-violet-900 bg-gradient-to-r from-violet-50 to-white dark:from-slate-900 dark:to-slate-900 p-6 sm:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-800 dark:text-violet-300">You are registered</p>
                    <h2 className="font-serif text-2xl font-semibold mt-1">Your lessons begin on {LESSONS_OPEN_LABEL}</h2>
                    <p className={`mt-2 ${MUTED}`}>Watch the welcome video today. Everything else opens on {LESSONS_OPEN_LABEL}. You can also join our live classes on Monday, Wednesday and Friday at 2:00 pm (East Africa Time).</p>
                    <Link to={`${base}/item/m0-l1`} className={`${BTN_PRIMARY} mt-4`}><PlayCircle size={18} /> Watch the welcome video</Link>
                </section>
            )}

            <div className="mt-8 grid lg:grid-cols-[1fr_20rem] gap-8">
                {/* modules */}
                <section className="space-y-5">
                    {MODULES.map(m => {
                        const done = m.items.filter(i => progress[i.id]?.status === 'completed').length;
                        return (
                            <div key={m.id} className={`${CARD} rounded-2xl overflow-hidden`}>
                                <div className="px-5 py-4 flex items-center gap-4">
                                    <span className="shrink-0 w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 font-bold flex items-center justify-center text-sm">{m.number}</span>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-semibold leading-snug">{m.title}</h2>
                                        <p className={`text-sm ${MUTED}`}>{done}/{m.items.length} complete</p>
                                    </div>
                                    {done === m.items.length && <CheckCircle2 className="text-emerald-600 shrink-0" />}
                                </div>
                                <ul className="border-t border-stone-100 dark:border-slate-800 divide-y divide-stone-100 dark:divide-slate-800">
                                    {m.items.map(i => {
                                        const Icon = kindIcon(i.kind);
                                        const isDone = progress[i.id]?.status === 'completed';
                                        const locked = !isItemOpen(i.id, fullAccess);
                                        return (
                                            <li key={i.id}>
                                                <Link to={`${base}/item/${i.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 dark:hover:bg-slate-800/60 min-h-[48px]">
                                                    {isDone ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : locked ? <Lock size={18} className="text-stone-300 dark:text-slate-600 shrink-0" /> : <Circle size={18} className="text-stone-300 dark:text-slate-600 shrink-0" />}
                                                    <Icon size={16} className="text-stone-400 dark:text-slate-500 shrink-0" />
                                                    <span className="flex-1 text-[15px] leading-snug">{i.title}</span>
                                                    <span className={`text-xs ${MUTED}`}>{locked ? 'Opens Mon 16 Nov' : `${i.minutes} min`}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}

                    {/* final */}
                    <div className={`${CARD} rounded-2xl px-5 py-4 flex items-center gap-4`}>
                        <span className="shrink-0 w-9 h-9 rounded-full bg-lime-200 text-lime-900 flex items-center justify-center"><Award size={18} /></span>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-semibold">Final assessment</h2>
                            <p className={`text-sm ${MUTED}`}>{state.finalPassed ? 'Passed' : state.allItemsDone ? 'Ready to take' : 'Unlocks when every lesson and quiz is complete'}</p>
                        </div>
                        {state.allItemsDone || state.finalPassed
                            ? <Link to={`${base}/final`} className={`${BTN_SECONDARY} !py-2.5 !px-4 !text-sm`}>{state.finalPassed ? 'Review' : 'Start'}</Link>
                            : <Lock size={18} className="text-stone-400" />}
                    </div>
                </section>

                {/* side */}
                <aside className="space-y-5">
                    <div className={`${CARD} rounded-2xl p-5`}>
                        <p className="flex items-center gap-2 font-semibold"><CalendarClock size={18} className="text-violet-700 dark:text-violet-400" /> Next live class</p>
                        {nextLive ? (
                            <>
                                <p className="mt-3 font-medium leading-snug">{nextLive.title}</p>
                                <p className={`text-sm ${MUTED}`}>{formatEAT(nextLive.starts_at)} EAT</p>
                            </>
                        ) : (
                            <div className="mt-3">
                                <p className="text-sm font-medium">Every Monday, Wednesday and Friday at 2:00 pm</p>
                                <p className={`text-sm ${MUTED}`}>East Africa Time. The join link appears in the timetable before each class.</p>
                            </div>
                        )}
                        <Link to={`${base}/live`} className={`${BTN_SECONDARY} w-full mt-4 !py-2.5 !text-sm`}>See the timetable</Link>
                    </div>

                    <div className={`${CARD} rounded-2xl p-5`}>
                        <p className="flex items-center gap-2 font-semibold"><Award size={18} className="text-violet-700 dark:text-violet-400" /> Your certificate</p>
                        <p className={`mt-3 text-sm ${MUTED}`}>
                            {cert ? 'Your certificate is ready.' : 'Finish every lesson, pass each module quiz and the final assessment to earn it.'}
                        </p>
                        {cert && <Link to={`${base}/certificate`} className={`${BTN_PRIMARY} w-full mt-4 !py-2.5 !text-sm`}>View certificate</Link>}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CourseHome;
