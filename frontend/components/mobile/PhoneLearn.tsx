import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFreeCourse } from '../../src/hooks/useFreeCourse';
import { ALL_ITEMS, COURSE, MODULES, findItem } from '../../src/content/aiFundamentals';
import { loadAttempts } from '../../src/lib/learnApi';
import { Course, CourseStatus } from '../../types';
import { BASE, Ico, PageTitle, PhonePage, useProgressMap } from './phoneKit';

/** Phone · My learning (canvas board MobileLearn): Ongoing, Completed, Certificates. */

type Tab = 'ongoing' | 'done' | 'certs';
const CARD = 'bg-white dark:bg-night-2';
const LABEL = 'mt-1 mb-0 ml-1 text-[12px] font-bold tracking-[0.08em] uppercase text-[#6B6680] dark:text-slate-400';

const PhoneLearn: React.FC<{ user: any; courses: Course[] }> = ({ user, courses }) => {
    const uid = user?.id && user.id !== 'guest' ? user.id : undefined;
    const fc = useFreeCourse(uid);
    const progress = useProgressMap(uid);
    const finished = !!fc.cert || fc.finalPassed;
    const [params, setParams] = useSearchParams();
    const tab = (params.get('tab') as Tab) || (finished ? 'done' : 'ongoing');
    const setTab = (t: Tab) => setParams(p => { p.set('tab', t); return p; }, { replace: true });

    const isDone = (id: string) => progress[id]?.status === 'completed';
    const best = useMemo(() => {
        const m: Record<string, number> = {};
        (uid ? loadAttempts(uid) : []).forEach(a => { m[a.quizId] = Math.max(m[a.quizId] ?? 0, a.percentage); });
        return m;
    }, [uid, progress]);

    const mods = MODULES.map(m => {
        const doneN = m.items.filter(i => isDone(i.id)).length;
        const quiz = m.items.find(i => i.kind === 'quiz');
        return { m, doneN, total: m.items.length, complete: doneN === m.items.length, quiz };
    });
    const completedMods = mods.filter(x => x.complete);
    const current = mods.find(x => !x.complete);
    const currentIdx = current ? mods.indexOf(current) : mods.length;
    const later = mods.slice(currentIdx + 1);
    const lastDone = completedMods[completedMods.length - 1];

    const quizzesPassed = ALL_ITEMS.filter(i => i.kind === 'quiz' && isDone(i.id)).length;
    const lessonsDone = ALL_ITEMS.filter(i => i.kind !== 'quiz' && isDone(i.id)).length;
    const otherOngoing = courses.filter(c => c.status === CourseStatus.IN_PROGRESS);
    const otherDone = courses.filter(c => c.status === CourseStatus.COMPLETED);
    const nextItem = fc.nextItemId ? findItem(fc.nextItemId) : undefined;
    const name = fc.cert?.name || user?.name || '';

    const [copied, setCopied] = useState(false);
    const share = async () => {
        if (!fc.cert) return;
        const url = `${window.location.origin}/verify/${fc.cert.id}`;
        const text = `I earned my ${COURSE.short} certificate from Welile School of AI.`;
        try {
            if (navigator.share) await navigator.share({ title: 'My certificate', text, url });
            else { await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true); window.setTimeout(() => setCopied(false), 2500); }
        } catch { /* cancelled */ }
    };

    const tabBtn = (t: Tab, label: string) => (
        <button type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`h-[38px] rounded-[10px] border-0 text-[13px] cursor-pointer ${tab === t ? 'bg-white dark:bg-night-2 text-ink dark:text-white font-extrabold shadow-[0_1px_3px_rgba(30,27,46,0.12)]' : 'bg-transparent text-[#6B6680] dark:text-slate-400 font-semibold'}`}>{label}</button>
    );

    const progressBar = (pct: number, h = 6) => (
        <div className="flex-1 rounded-full bg-[#EEEBF6] dark:bg-night-3 overflow-hidden" style={{ height: h }}><div className="h-full bg-brand" style={{ width: `${pct}%` }} /></div>
    );

    return (
        <PhonePage>
            <PageTitle>My learning</PageTitle>

            <div role="tablist" aria-label="My learning" className="grid grid-cols-3 p-1 gap-0.5 rounded-[14px] bg-[#EAE6F5] dark:bg-night-3">
                {tabBtn('ongoing', 'Ongoing')}{tabBtn('done', 'Completed')}{tabBtn('certs', 'Certificates')}
            </div>

            {/* ONGOING */}
            {tab === 'ongoing' && (finished && otherOngoing.length === 0 ? (
                <div className={`${CARD} rounded-[22px] px-5 py-[26px] text-center`}>
                    <span className="inline-flex w-14 h-14 rounded-[18px] bg-brand-soft text-brand items-center justify-center">{Ico.book()}</span>
                    <p className="mt-3 mb-0 text-[16px] font-extrabold">Nothing in progress</p>
                    <p className="mt-1 mb-0 text-[13px] text-[#6B6680] dark:text-slate-400">You've finished everything you started. Find your next course.</p>
                    <Link to="/discover" className="press mt-3.5 h-[46px] rounded-[14px] bg-brand text-white text-[14px] font-extrabold flex items-center justify-center no-underline">Discover courses</Link>
                </div>
            ) : (
                <>
                    {!finished && (
                        <>
                            <Link to={fc.nextItemId ? `${BASE}/item/${fc.nextItemId}` : BASE} className={`press block overflow-hidden rounded-[24px] ${CARD} text-ink dark:text-white no-underline`}>
                                <img src="/thumb/m1-l1.jpg" alt="" className="w-full aspect-video object-cover block bg-brand-soft" onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                                <div className="p-4">
                                    <span className="px-2 py-[3px] rounded-[6px] bg-lime-100 text-[#3F4A1C] text-[11px] font-extrabold uppercase">Free · certificate</span>
                                    <p className="mt-2.5 mb-0 text-[17px] leading-[1.25] font-extrabold tracking-[-0.01em]">{COURSE.title}</p>
                                    <p className="mt-1 mb-0 text-[13px] text-[#6B6680] dark:text-slate-400">{nextItem ? `Up next: ${nextItem.title} · ${nextItem.minutes} min` : 'Up next: the final test'}</p>
                                    <div className="flex items-center gap-2.5 mt-3">
                                        {progressBar(fc.pct)}
                                        <span className="text-[12px] font-extrabold text-brand dark:text-violet-300">{fc.pct}%</span>
                                    </div>
                                </div>
                            </Link>
                            <div className={`${CARD} rounded-[22px] p-1.5`}>
                                {lastDone && (
                                    <Link to={BASE} className="flex items-center gap-3 p-2.5 no-underline text-ink dark:text-white">
                                        <span className="w-[34px] h-[34px] rounded-[10px] bg-mint-soft text-mint inline-flex items-center justify-center">{Ico.check()}</span>
                                        <span className="flex-1 text-[14px] font-semibold">{lastDone.m.number ? `${lastDone.m.number} · ${lastDone.m.title}` : `${lastDone.m.title} · Module 1`}</span>
                                        <span className="text-[12px] text-[#6B6680] dark:text-slate-400">Done</span>
                                    </Link>
                                )}
                                {current && (
                                    <Link to={BASE} className="flex items-center gap-3 p-2.5 rounded-[16px] bg-brand-soft dark:bg-night-3 no-underline">
                                        <span className="w-[34px] h-[34px] rounded-[10px] bg-brand text-white inline-flex items-center justify-center text-[14px] font-extrabold">{current.m.number || 'W'}</span>
                                        <span className="flex-1 text-[14px] font-bold text-brand-ink dark:text-white">{current.m.title}</span>
                                        <span className="text-[12px] font-bold text-brand dark:text-violet-300">{current.doneN} of {current.total}</span>
                                    </Link>
                                )}
                                <Link to={BASE} className="flex items-center gap-3 p-2.5 no-underline">
                                    <span className="w-[34px] h-[34px] rounded-[10px] bg-[#F1EFF6] dark:bg-night-3 text-[#6B6680] inline-flex items-center justify-center text-[13px] font-extrabold">{later.length ? `+${later.length}` : Ico.award(16)}</span>
                                    <span className="flex-1 text-[14px] font-semibold text-[#6B6680] dark:text-slate-400">
                                        {later.length ? `Module${later.length > 1 ? 's' : ''} ${later[0].m.number}${later.length > 1 ? ` to ${later[later.length - 1].m.number}` : ''}, then the final test` : 'Then the final test'}
                                    </span>
                                </Link>
                            </div>
                        </>
                    )}
                    {otherOngoing.map(c => (
                        <Link key={c.id} to={`/discover/${c.id}`} className={`press flex items-center gap-3 p-2.5 rounded-[20px] ${CARD} no-underline text-ink dark:text-white`}>
                            <span className="w-[64px] h-[64px] rounded-[14px] overflow-hidden bg-brand-soft shrink-0">{c.image && <img src={c.image} alt="" className="w-full h-full object-cover" />}</span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-[15px] font-extrabold leading-[1.25] line-clamp-2">{c.title}</span>
                                <span className="flex items-center gap-2 mt-2">{progressBar(c.lessonsTotal ? Math.round((c.lessonsCompleted / c.lessonsTotal) * 100) : 0)}<span className="text-[12px] font-extrabold text-brand">{c.lessonsTotal ? Math.round((c.lessonsCompleted / c.lessonsTotal) * 100) : 0}%</span></span>
                            </span>
                        </Link>
                    ))}
                </>
            ))}

            {/* COMPLETED */}
            {tab === 'done' && (
                <>
                    <div className="grid grid-cols-3 gap-2.5">
                        {[[(finished ? 1 : 0) + otherDone.length, 'Courses'], [lessonsDone, 'Lessons'], [quizzesPassed, 'Quizzes passed']].map(([v, l]) => (
                            <div key={l as string} className={`${CARD} rounded-[18px] p-3 text-center`}>
                                <p className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">{v}</p>
                                <p className="mt-0.5 mb-0 text-[11px] font-semibold text-[#6B6680] dark:text-slate-400">{l}</p>
                            </div>
                        ))}
                    </div>

                    <section className="grid gap-2.5">
                        <h2 className={LABEL}>Completed courses</h2>
                        {finished ? (
                            <>
                                <div className={`${CARD} rounded-[22px] p-3.5 flex gap-3 items-center`}>
                                    <div className="relative shrink-0 w-[74px] h-[74px] rounded-[18px] overflow-hidden bg-brand-soft">
                                        <img src="/thumb/m1-l1.jpg" alt="" className="w-full h-full object-cover" />
                                        <span className="absolute right-1.5 bottom-1.5 w-6 h-6 rounded-full bg-mint text-white inline-flex items-center justify-center border-2 border-white">{Ico.check(12)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="m-0 text-[15px] leading-[1.25] font-extrabold">{COURSE.title}</p>
                                        <p className="mt-1 mb-0 text-[12px] text-[#6B6680] dark:text-slate-400">{fc.done} of {fc.total} · final test passed</p>
                                        <div className="flex gap-1.5 mt-2">
                                            <span className="px-2 py-[3px] rounded-[6px] bg-mint-soft text-mint-ink text-[11px] font-extrabold">100%</span>
                                            {fc.cert && <span className="px-2 py-[3px] rounded-[6px] bg-lime-100 text-[#3F4A1C] text-[11px] font-extrabold">Certificate earned</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2.5">
                                    <button type="button" onClick={() => setTab('certs')} className="press flex-1 h-[46px] rounded-[14px] border-0 bg-brand text-white text-[14px] font-extrabold cursor-pointer">View certificate</button>
                                    <Link to={BASE} className={`press flex-1 h-[46px] rounded-[14px] ${CARD} text-ink dark:text-white text-[14px] font-bold flex items-center justify-center no-underline`}>Review lessons</Link>
                                </div>
                            </>
                        ) : (
                            <div className={`${CARD} rounded-[22px] p-5 text-center`}>
                                <p className="m-0 text-[15px] font-extrabold">No finished courses yet</p>
                                <p className="mt-1 mb-0 text-[13px] text-[#6B6680] dark:text-slate-400">You're {fc.pct}% through {COURSE.short}.</p>
                            </div>
                        )}
                        {otherDone.map(c => (
                            <Link key={c.id} to={`/discover/${c.id}`} className={`${CARD} rounded-[22px] p-3.5 flex gap-3 items-center no-underline text-ink dark:text-white`}>
                                <span className="w-[56px] h-[56px] rounded-[14px] overflow-hidden bg-brand-soft shrink-0">{c.image && <img src={c.image} alt="" className="w-full h-full object-cover" />}</span>
                                <span className="flex-1 text-[15px] font-extrabold leading-[1.25]">{c.title}</span>
                            </Link>
                        ))}
                    </section>

                    <section className="grid gap-2.5">
                        <h2 className={LABEL}>Completed modules</h2>
                        <div className={`${CARD} rounded-[22px] overflow-hidden`}>
                            {completedMods.length === 0 && <p className="m-0 px-3.5 py-4 text-[14px] text-[#6B6680] dark:text-slate-400">Finish a module and it shows up here.</p>}
                            {completedMods.map(x => {
                                const score = x.quiz ? best[x.quiz.id] : undefined;
                                return (
                                    <div key={x.m.id} className="flex items-center gap-3 min-h-[56px] px-3.5 border-b border-solid border-x-0 border-t-0 border-[#F1EFF6] dark:border-night-3 last:border-b-0">
                                        <span className="w-[30px] h-[30px] rounded-[9px] bg-mint-soft text-mint inline-flex items-center justify-center">{Ico.check(14)}</span>
                                        <span className="flex-1 text-[14px] font-semibold">{x.m.number ? `${x.m.number} · ${x.m.title}` : x.m.title}</span>
                                        <span className="text-[12px] font-bold text-mint-ink dark:text-emerald-300">{x.quiz ? (score != null ? `Quiz ${Math.round(score)}%` : 'Quiz passed') : `${x.doneN}/${x.total}`}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}

            {/* CERTIFICATES */}
            {tab === 'certs' && (fc.cert ? (
                <section aria-label={`${COURSE.short} certificate`} className={`${CARD} rounded-[24px] p-3.5`}>
                    <div className="relative overflow-hidden aspect-[1.414/1] rounded-[16px] bg-[#FBFAFE] p-4 flex flex-col text-center text-ink">
                        <div className="absolute inset-[7px] border-[1.2px] border-solid border-[#DCD2FA] rounded-[10px]" />
                        <span className="absolute -right-10 -top-10 w-[120px] h-[120px] rounded-full bg-brand-soft" />
                        <span className="relative self-start text-[10px] font-extrabold tracking-[0.02em] text-brand">Welile School of AI</span>
                        <div className="relative flex-1 flex flex-col justify-center">
                            <p className="m-0 text-[8px] font-extrabold tracking-[0.18em] uppercase text-brand">Certificate of completion</p>
                            <p className="mt-1.5 mb-0 font-cert italic text-[24px] font-medium">{name}</p>
                            <p className="mt-1 mb-0 text-[11px] font-extrabold">{fc.cert.courseTitle || COURSE.title}</p>
                        </div>
                        <div className="relative flex justify-between text-[7px] text-[#6B6680] text-left">
                            <span><strong className="text-ink">Collines Tumwine</strong><br />CEO, Welile School of AI</span>
                            <span className="text-right"><strong className="text-ink">Benjamin Muhangzi</strong><br />CEO, Welile Technologies</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 mt-3 px-3 py-2.5 rounded-[14px] bg-mint-soft text-mint">
                        {Ico.shield()}
                        <span className="flex-1 text-[12px] text-mint-ink"><strong>Verified.</strong> Anyone can check it with your verify link or QR code.</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 mt-3">
                        <Link to={`${BASE}/certificate`} className="press h-[46px] rounded-[14px] bg-brand text-white text-[14px] font-extrabold flex items-center justify-center gap-2 no-underline">{Ico.download()}Download</Link>
                        <button type="button" onClick={share} className="press h-[46px] rounded-[14px] border-0 bg-[#F1EFF6] dark:bg-night-3 text-ink dark:text-white text-[14px] font-bold flex items-center justify-center gap-2 cursor-pointer">{Ico.share()}{copied ? 'Link copied' : 'Share'}</button>
                    </div>
                </section>
            ) : (
                <section className={`${CARD} rounded-[24px] p-5 text-center`}>
                    <span className="inline-flex w-14 h-14 rounded-[18px] bg-lime-100 text-[#3F4A1C] items-center justify-center">{Ico.award()}</span>
                    <p className="mt-3 mb-0 text-[16px] font-extrabold">{fc.finalPassed ? 'Your certificate is ready to claim' : 'Your first certificate is on its way'}</p>
                    <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6B6680] dark:text-slate-400">
                        {fc.finalPassed ? 'You passed the final test. Open the certificate page to issue it in your name.' : `Finish every lesson, pass all 6 module quizzes (${COURSE.passModule}%) and the final test (${COURSE.passFinal}%).`}
                    </p>
                    {fc.finalPassed
                        ? <Link to={`${BASE}/certificate`} className="press mt-4 h-[46px] rounded-[14px] bg-brand text-white text-[14px] font-extrabold flex items-center justify-center no-underline">Get my certificate</Link>
                        : <>
                            <div className="h-2 rounded-full bg-[#EEEBF6] dark:bg-night-3 overflow-hidden mt-4"><div className="h-full bg-brand" style={{ width: `${fc.pct}%` }} /></div>
                            <p className="mt-1.5 mb-0 text-[12px] font-bold text-brand dark:text-violet-300">{fc.pct}% of the way there</p>
                        </>}
                </section>
            ))}
        </PhonePage>
    );
};

export default PhoneLearn;
