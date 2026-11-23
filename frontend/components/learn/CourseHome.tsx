import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, CalendarClock, CheckCircle2, Circle, FileText, HelpCircle, Lock, PlayCircle } from 'lucide-react';
import { ALL_ITEMS, COURSE, MODULES } from '../../src/content/aiFundamentals';
import { completionState } from '../../src/lib/learnApi';
import { useLearn } from './learnContext';
import { LESSONS_OPEN_LABEL, LIVE_SCHEDULE, lessonsAreOpen, lockReason } from '../../src/lib/courseAccess';
import { useSessions } from './LivePanel';
import { InstallTip } from './InstallApp';
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

    const quizzes = ALL_ITEMS.filter(i => i.kind === 'quiz');
    const quizzesDone = quizzes.filter(q => progress[q.id]?.status === 'completed').length;

    return (
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-0 py-5 lg:py-0">
            {/* hero */}
            <section aria-label="Your progress" className="relative overflow-hidden rounded-[26px] bg-brand text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
                <span aria-hidden="true" className="absolute -right-16 -top-24 w-[300px] h-[300px] rounded-full bg-brand-mid" />
                <span aria-hidden="true" className="absolute right-40 -bottom-32 w-[240px] h-[240px] rounded-full bg-brand-mid" />
                <div className="relative shrink-0 w-[96px] h-[96px] rounded-full bg-white/10 flex items-center justify-center">
                    <svg width="96" height="96" viewBox="0 0 96 96" role="img" aria-label={`${state.pct}% complete`}>
                        <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="9" />
                        <circle cx="48" cy="48" r="40" fill="none" stroke="#D7F27A" strokeWidth="9" strokeLinecap="round" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - state.pct / 100)} transform="rotate(-90 48 48)" className="transition-all duration-700" />
                        <text x="48" y="48" dominantBaseline="central" textAnchor="middle" fill="#fff" fontSize="20" fontWeight={800}>{state.pct}%</text>
                    </svg>
                </div>
                <div className="relative flex-1 min-w-0">
                    <p className="m-0 text-[12px] font-bold tracking-[0.12em] uppercase text-[#D9CCFF]">{started ? `Welcome back${first ? ', ' + first : ''}` : `Welcome${first ? ', ' + first : ''}`}</p>
                    <h1 className="mt-2 mb-0 text-[26px] sm:text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em]">{COURSE.title}</h1>
                    <p className="mt-2 mb-0 text-[14px] text-[#E4DAFF]">
                        {state.done} of {state.total} items complete{nextItem && <> · Up next: <strong className="text-white">{nextItem.title}</strong></>}
                    </p>
                </div>
                <Link to={resumeTo} className="press relative inline-flex items-center justify-center gap-2.5 h-12 pl-5 pr-1.5 rounded-full bg-white text-brand text-[15px] font-bold no-underline w-full sm:w-auto">
                    {resumeLabel}
                    <span className="w-9 h-9 rounded-full bg-brand text-white inline-flex items-center justify-center"><ArrowRight size={17} /></span>
                </Link>
            </section>

            {/* quick stats */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { k: 'Lessons done', v: `${state.done}/${state.total}`, tone: 'bg-white dark:bg-night-2' },
                    { k: 'Quizzes passed', v: `${quizzesDone}/${quizzes.length}`, tone: 'bg-white dark:bg-night-2' },
                    { k: 'Module quiz pass mark', v: '70%', tone: 'bg-white dark:bg-night-2' },
                    { k: 'Final test pass mark', v: '80%', tone: 'bg-lime-100 text-lime-900' },
                ].map(x => (
                    <div key={x.k} className={`${x.tone} rounded-[18px] px-4 py-3.5`}>
                        <p className="m-0 text-[22px] font-extrabold tracking-[-0.02em] tabular-nums">{x.v}</p>
                        <p className={`m-0 text-[12px] font-semibold ${x.tone.includes('lime') ? 'text-lime-800' : MUTED}`}>{x.k}</p>
                    </div>
                ))}
            </div>

            <div className="mt-4"><InstallTip /></div>

            {preLaunch && (
                <section className="mt-4 rounded-[24px] bg-brand-soft dark:bg-night-2 p-6 sm:p-7">
                    <p className="m-0 text-[12px] font-bold uppercase tracking-[0.12em] text-brand dark:text-violet-300">You are registered</p>
                    <h2 className="mt-1.5 mb-0 text-[22px] font-extrabold tracking-[-0.01em] text-brand-ink dark:text-white">Your lessons begin on {LESSONS_OPEN_LABEL}</h2>
                    <p className={`mt-2 mb-0 text-[14px] leading-relaxed ${MUTED}`}>Watch the welcome video today. You can then learn two ways: join our 2 live classes each week (Wednesday and Friday at 2:00 pm, East Africa Time), or study at your own pace once every lesson opens on {LESSONS_OPEN_LABEL}.</p>
                    <Link to={`${base}/item/m0-l1`} className={`${BTN_PRIMARY} mt-4`}><PlayCircle size={18} /> Watch the welcome video</Link>
                </section>
            )}

            <div className="mt-6 grid lg:grid-cols-[1fr_340px] gap-5 items-start">
                {/* modules */}
                <section aria-label="Modules" className="flex flex-col gap-4">
                    {MODULES.map(m => {
                        const done = m.items.filter(i => progress[i.id]?.status === 'completed').length;
                        const complete = done === m.items.length;
                        const pct = Math.round((done / m.items.length) * 100);
                        return (
                            <div key={m.id} className={`${CARD} overflow-hidden`}>
                                <div className="px-5 pt-5 pb-4 flex items-center gap-4">
                                    <span className={`shrink-0 w-12 h-12 rounded-[15px] font-extrabold flex items-center justify-center text-[16px] ${complete ? 'bg-mint-soft text-mint' : 'bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300'}`}>
                                        {complete ? <CheckCircle2 size={22} /> : m.number}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`m-0 text-[11px] font-bold uppercase tracking-[0.1em] ${MUTED}`}>{m.number === 0 ? 'Start here' : `Module ${m.number}`}</p>
                                        <h2 className="m-0 text-[17px] font-extrabold leading-snug tracking-[-0.01em]">{m.title}</h2>
                                    </div>
                                    <span className="hidden sm:flex flex-col items-end gap-1.5 w-28">
                                        <span className="text-[12px] font-bold tabular-nums">{done}/{m.items.length}</span>
                                        <span className="w-full h-1.5 rounded-full bg-[#EEEBF6] dark:bg-night-3 overflow-hidden"><span className={`block h-full rounded-full ${complete ? 'bg-mint' : 'bg-brand'}`} style={{ width: `${pct}%` }} /></span>
                                    </span>
                                </div>
                                <ul className="m-0 px-2.5 pb-2.5 list-none flex flex-col gap-1">
                                    {m.items.map(i => {
                                        const Icon = kindIcon(i.kind);
                                        const isDone = progress[i.id]?.status === 'completed';
                                        const reason = lockReason(i.id, progress, fullAccess);
                                        const locked = reason !== null;
                                        const isNext = nextItem?.id === i.id;
                                        return (
                                            <li key={i.id}>
                                                <Link to={`${base}/item/${i.id}`} className={`press flex items-center gap-3 px-3 py-3 rounded-[14px] min-h-[52px] no-underline ${isNext ? 'bg-brand-soft dark:bg-night-3' : 'hover:bg-panel dark:hover:bg-night-3/60'}`}>
                                                    <span className={`w-9 h-9 rounded-[11px] shrink-0 inline-flex items-center justify-center ${isDone ? 'bg-mint-soft text-mint' : i.kind === 'quiz' ? 'bg-lime-100 text-lime-900' : 'bg-panel dark:bg-night text-brand dark:text-violet-300'}`}>
                                                        {isDone ? <CheckCircle2 size={17} /> : locked ? <Lock size={15} className="text-[#9A94AE]" /> : <Icon size={17} />}
                                                    </span>
                                                    <span className="flex-1 min-w-0">
                                                        <span className="block text-[14.5px] font-semibold leading-snug">{i.title}</span>
                                                        <span className={`block text-[12px] ${MUTED}`}>{i.kind === 'video' ? 'Video' : i.kind === 'quiz' ? `Quiz · pass with 70%` : 'Reading'} · {i.minutes} min</span>
                                                    </span>
                                                    <span className={`shrink-0 text-[12px] font-semibold ${isNext && !locked ? 'text-brand dark:text-violet-300' : MUTED}`}>
                                                        {reason === 'date' ? 'Opens Mon 16 Nov' : reason === 'previous' ? 'Finish the one before' : isDone ? 'Done' : isNext ? 'Up next' : ''}
                                                    </span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}

                    {/* final */}
                    <div className="rounded-[22px] bg-lime-200 text-ink px-5 py-5 flex items-center gap-4">
                        <span className="shrink-0 w-12 h-12 rounded-[15px] bg-white/70 flex items-center justify-center"><Award size={22} /></span>
                        <div className="flex-1 min-w-0">
                            <h2 className="m-0 text-[17px] font-extrabold">Final assessment</h2>
                            <p className="m-0 text-[13px] text-lime-900">{state.finalPassed ? 'Passed' : state.allItemsDone ? 'Ready to take · 20 questions, pass with 80%' : 'Unlocks when every lesson and quiz is complete'}</p>
                        </div>
                        {state.allItemsDone || state.finalPassed
                            ? <Link to={`${base}/final`} className="press h-11 px-5 rounded-[12px] bg-ink text-white text-[14px] font-bold inline-flex items-center no-underline">{state.finalPassed ? 'Review' : 'Start'}</Link>
                            : <Lock size={18} className="text-lime-900" />}
                    </div>
                </section>

                {/* side */}
                <aside className="flex flex-col gap-4 lg:sticky lg:top-[96px]">
                    <div className={`${CARD} p-5`}>
                        <p className="m-0 flex items-center gap-2 text-[15px] font-extrabold"><span className="w-2 h-2 rounded-full bg-[#F0533A]" aria-hidden="true" /> Next live class</p>
                        {nextLive ? (
                            <>
                                <p className="mt-3 mb-0 font-bold leading-snug">{nextLive.title}</p>
                                <p className={`m-0 text-[13px] ${MUTED}`}>{formatEAT(nextLive.starts_at)} EAT</p>
                            </>
                        ) : (
                            <div className="mt-3">
                                <p className="m-0 text-[14px] font-bold">Every Wednesday and Friday at 2:00 pm</p>
                                <p className={`m-0 text-[13px] ${MUTED}`}>East Africa Time. The join link appears in the timetable before each class.</p>
                            </div>
                        )}
                        <p className={`mt-3 mb-0 text-[13px] leading-relaxed ${MUTED}`}>Join a live class and the lessons it covers count as done. You only take the quizzes.</p>
                        <Link to={`${base}/live`} className={`${BTN_SECONDARY} w-full mt-4 !py-2.5 !text-sm`}><CalendarClock size={16} /> See the timetable</Link>
                    </div>

                    <div className="rounded-[22px] bg-night text-white p-5 relative overflow-hidden">
                        <span aria-hidden="true" className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-night-3" />
                        <p className="relative m-0 flex items-center gap-2 text-[15px] font-extrabold"><Award size={18} className="text-lime-200" /> Your certificate</p>
                        <p className="relative mt-3 mb-0 text-[13px] leading-relaxed text-[#C9C3E6]">
                            {cert ? 'Your certificate is ready.' : 'Finish every lesson, pass each module quiz and the final assessment to earn it.'}
                        </p>
                        {cert && <Link to={`${base}/certificate`} className="press relative mt-4 w-full h-11 rounded-[12px] bg-lime-200 text-ink text-[14px] font-bold inline-flex items-center justify-center no-underline">View certificate</Link>}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CourseHome;
