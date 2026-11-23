import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowRight, Building2, ChevronLeft, ChevronRight, Lock, Megaphone, Play, Sparkles } from 'lucide-react';
import { Course, CourseStatus, UserRole } from '../types';
import { useSessions } from './learn/LivePanel';
import { formatEAT } from './learn/learnUi';
import { useFreeCourse } from '../src/hooks/useFreeCourse';
import { ALL_ITEMS, COURSE, moduleOfItem } from '../src/content/aiFundamentals';
import { ProgressMap, loadAttempts, loadProgress } from '../src/lib/learnApi';
import { hasFullAccess, lockReason } from '../src/lib/courseAccess';
import { Bar, Card, Ring, Segmented, SectionTitle, Tag, cx } from './ui/welile';

interface DashboardHomeProps {
    courses: Course[];
    userId?: string;
}

const BASE = `/learn/${COURSE.slug}`;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const courseProgress = (c: Course) =>
    Math.min(100, Math.round((c.lessonsTotal > 0 ? (c.lessonsCompleted / c.lessonsTotal) * 60 : 0) + (c.examCompleted ? 40 : 0)));

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const startOfWeek = () => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day); return d; };

const DashboardHome: React.FC<DashboardHomeProps> = ({ courses, userId }) => {
    const navigate = useNavigate();
    const outlet = useOutletContext<{ displayUser?: any } | undefined>();
    const user = outlet?.displayUser;
    const firstName = (user?.name || '').split(' ')[0];
    const sessions = useSessions();
    const fc = useFreeCourse(userId);

    // Full progress map: needed for lock states, watch time and the weekly chart
    const [progress, setProgress] = useState<ProgressMap>({});
    useEffect(() => {
        if (!userId || userId === 'guest') return;
        const load = () => { void loadProgress(userId).then(setProgress); };
        load();
        window.addEventListener('learn-progress-update', load);
        return () => window.removeEventListener('learn-progress-update', load);
    }, [userId]);

    // Module quiz results, saved on this device by the course player
    const [quizGrades, setQuizGrades] = useState<any[]>([]);
    useEffect(() => {
        if (!userId || userId === 'guest') return;
        const key = `quiz-grades-${localStorage.getItem('auth_logged_in_email') || userId}`;
        const load = () => {
            try { setQuizGrades(JSON.parse(localStorage.getItem(key) || '[]')); } catch { setQuizGrades([]); }
        };
        load();
        window.addEventListener('quiz-grades-update', load);
        window.addEventListener('storage', load);
        return () => { window.removeEventListener('quiz-grades-update', load); window.removeEventListener('storage', load); };
    }, [userId]);

    const [statTab, setStatTab] = useState<'time' | 'scores'>('time');

    const fullAccess = hasFullAccess(user?.email, user?.role);
    const quizItems = useMemo(() => ALL_ITEMS.filter(i => i.kind === 'quiz'), []);
    const quizzesPassed = quizItems.filter(q => progress[q.id]?.status === 'completed').length;
    const attempts = useMemo(() => (userId && userId !== 'guest' ? loadAttempts(userId) : []), [userId, progress]);
    const bestByQuiz = useMemo(() => {
        const m: Record<string, number> = {};
        attempts.forEach(a => { m[a.quizId] = Math.max(m[a.quizId] ?? 0, a.percentage); });
        return m;
    }, [attempts]);

    const totalSeconds = Object.values(progress).reduce((s, p) => s + (p?.seconds || 0), 0);
    const hours = totalSeconds / 3600;

    // Days in a row with a completed item, ending today or yesterday
    const streak = useMemo(() => {
        const days = new Set(Object.values(progress).map(p => p?.completedAt ? new Date(p.completedAt).toDateString() : '').filter(Boolean));
        let n = 0; const d = new Date();
        if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
        while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
        return n;
    }, [progress]);

    // Items completed per weekday this week
    const week = useMemo(() => {
        const start = startOfWeek().getTime();
        const counts = [0, 0, 0, 0, 0, 0, 0];
        Object.values(progress).forEach(p => {
            if (!p?.completedAt) return;
            const t = new Date(p.completedAt).getTime();
            if (t >= start && t < start + 7 * 86400000) counts[Math.floor((t - start) / 86400000)]++;
        });
        return counts;
    }, [progress]);

    // The next three things to do in the free course
    const upNext = useMemo(() => {
        const startIdx = Math.max(0, ALL_ITEMS.findIndex(i => progress[i.id]?.status !== 'completed'));
        return ALL_ITEMS.slice(startIdx, startIdx + 3);
    }, [progress]);

    const enrolled = courses.filter(c => c.status === CourseStatus.IN_PROGRESS || c.status === CourseStatus.COMPLETED);
    const explore = courses.filter(c => !c.isDraft && c.isVerified !== false && c.status === CourseStatus.NOT_STARTED).slice(0, 2);
    const upcoming = (sessions || []).filter(s => new Date(s.ends_at).getTime() > Date.now());
    const nextLive = upcoming[0];

    if (!userId) return <div className="p-8 text-center text-stone-600 dark:text-slate-400">Loading...</div>;

    const role = user?.role;
    const isCorporate = role === UserRole.SPONSORED || Boolean(user?.companyName);
    const isPremium = role === UserRole.PRO || role === UserRole.ADMIN || role === 'PREMIUM';

    const cta = fc.cert ? { label: 'View your certificate', to: `${BASE}/certificate` }
        : fc.finalPassed ? { label: 'Get your certificate', to: `${BASE}/certificate` }
        : fc.started ? { label: 'Resume lesson', to: fc.nextItemId ? `${BASE}/item/${fc.nextItemId}` : `${BASE}/final` }
        : { label: 'Start the course', to: BASE };

    const liveChip = nextLive
        ? (isToday(nextLive.starts_at) ? `Live today · ${formatEAT(nextLive.starts_at, { weekday: undefined, day: undefined, month: undefined })}` : `Next live · ${formatEAT(nextLive.starts_at)}`)
        : 'Live Mon, Wed, Fri · 2 pm';

    const maxWeek = Math.max(1, ...week);
    const chartPts = week.map((v, i) => ({ x: 42 + i * 46, y: 180 - (v / maxWeek) * 150, v }));
    const path = chartPts.map((p, i) => {
        if (i === 0) return `M${p.x} ${p.y}`;
        const prev = chartPts[i - 1]; const cx1 = prev.x + 23; const cx2 = p.x - 23;
        return `C ${cx1} ${prev.y}, ${cx2} ${p.y}, ${p.x} ${p.y}`;
    }).join(' ');
    const todayIdx = (new Date().getDay() + 6) % 7;

    return (
        <div className="flex flex-wrap gap-5 items-start">
            {/* ---------- Left column ---------- */}
            <div className="flex-[999_1_520px] min-w-0 flex flex-col gap-[22px]">
                <section aria-label="Continue your free course" className="relative overflow-hidden rounded-[24px] bg-brand text-white px-6 sm:px-8 py-7 sm:py-[30px] min-h-[196px] flex items-center">
                    <span aria-hidden="true" className="absolute -right-[60px] -top-20 w-[280px] h-[280px] rounded-full bg-brand-mid" />
                    <span aria-hidden="true" className="absolute right-[120px] -bottom-[110px] w-[220px] h-[220px] rounded-full bg-brand-mid" />
                    <div className="relative flex-auto max-w-[460px]">
                        <p className="m-0 text-[12px] font-bold tracking-[0.12em] uppercase text-[#D9CCFF]">
                            {fc.cert ? 'Course complete' : `Free course · ${fc.started ? `${fc.done} of ${fc.total} done` : 'certificate included'}`}
                        </p>
                        <h1 className="mt-2.5 mb-0 text-[26px] sm:text-[28px] leading-[1.2] font-extrabold tracking-[-0.02em]">
                            <span className="hidden lg:inline">{greeting()}{firstName ? `, ${firstName}` : ''}. </span>{fc.cert ? 'Well done on finishing.' : "Let's keep learning AI."}
                        </h1>
                        <Link to={cta.to} className="press mt-[18px] inline-flex items-center gap-2.5 h-[42px] pl-[18px] pr-1.5 rounded-full bg-white text-brand text-[14px] font-bold no-underline">
                            {cta.label}
                            <span className="w-[30px] h-[30px] rounded-full bg-brand text-white inline-flex items-center justify-center"><Play size={13} fill="currentColor" /></span>
                        </Link>
                    </div>
                    <div className="relative ml-auto hidden md:flex items-center gap-3.5">
                        <div className="flex flex-col gap-2.5">
                            <Link to={nextLive ? `${BASE}/live` : '/events'} className="press px-3 py-2 rounded-xl bg-white text-ink text-[13px] font-bold inline-flex items-center gap-2 no-underline">
                                <span className="w-2 h-2 rounded-full bg-[#F0533A]" aria-hidden="true" />{liveChip}
                            </Link>
                            <span className="px-3 py-2 rounded-xl bg-lime-200 text-ink text-[13px] font-bold">{fc.pct}% done</span>
                        </div>
                        <img src="/instructor/timothy.webp" alt="Your instructor, Timothy Christian Waniaye" className="w-[150px] h-[150px] rounded-full object-cover border-[6px] border-brand-light" />
                    </div>
                </section>

                <section aria-labelledby="cont">
                    <div className="flex items-center justify-between mb-3">
                        <h2 id="cont" className="m-0 text-[18px] font-bold">{fc.cert ? 'Review the course' : 'Continue learning'}</h2>
                        <Link to={BASE} className="text-[14px] font-bold text-brand dark:text-violet-300 no-underline hover:underline">See all lessons</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {upNext.map((it, idx) => {
                            const reason = lockReason(it.id, progress, fullAccess);
                            const locked = reason !== null;
                            const mod = moduleOfItem(it.id);
                            const href = `${BASE}/item/${it.id}`;
                            const thumb = it.kind === 'video' ? `/thumb/${it.id}.jpg` : null;
                            const done = progress[it.id]?.status === 'completed';
                            return (
                                <Link key={it.id} to={href} className="lift bg-white dark:bg-night-2 rounded-[20px] p-2.5 text-ink dark:text-white no-underline flex flex-col gap-2.5">
                                    {thumb ? (
                                        <img src={thumb} alt="" loading="lazy" className="w-full aspect-video object-cover rounded-[14px] bg-brand-soft" onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                                    ) : (
                                        <div className={cx('aspect-video rounded-[14px] flex flex-col justify-center px-[18px]', it.kind === 'quiz' ? 'bg-lime-200 text-ink' : 'bg-brand-soft text-brand-ink')}>
                                            <span className="text-[12px] font-bold tracking-[0.1em] uppercase opacity-80">{it.kind === 'quiz' ? `Quiz · ${it.questions?.length ?? ''} questions` : 'Reading'}</span>
                                            <span className="text-[22px] font-extrabold leading-tight mt-1">{mod?.title}</span>
                                        </div>
                                    )}
                                    <div className="px-1 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <Tag tone={it.kind === 'quiz' ? 'lime' : 'brand'}>{mod && mod.number > 0 ? `Module ${mod.number}` : 'Welcome'}</Tag>
                                            <span className="text-[12px] font-semibold text-stone-600 dark:text-slate-400">{it.minutes} min</span>
                                        </div>
                                        <p className="m-0 text-[14px] font-bold leading-snug line-clamp-2">{it.title}</p>
                                        <Bar pct={done ? 100 : idx === 0 && progress[it.id] ? 30 : 0} label={`${it.title} progress`} />
                                        <div className="flex items-center gap-2 pb-1">
                                            <span className="flex-1 text-[12px] text-stone-600 dark:text-slate-400">
                                                {locked ? (reason === 'date' ? 'Opens soon' : 'Finish the one before') : idx === 0 ? 'Up next' : 'Then'}
                                            </span>
                                            <span className={cx('w-7 h-7 rounded-full inline-flex items-center justify-center', locked ? 'bg-stone-100 text-stone-500 dark:bg-night-3' : idx === 0 ? 'bg-brand text-white' : 'bg-brand-soft text-brand dark:bg-night-3 dark:text-violet-300')}>
                                                {locked ? <Lock size={13} /> : <Play size={12} fill="currentColor" />}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {enrolled.length > 0 && (
                    <section aria-labelledby="other">
                        <SectionTitle id="other" title="Your other courses" action={<Link to="/courses" className="text-[14px] font-bold text-brand dark:text-violet-300 no-underline hover:underline">See all</Link>} />
                        <div className="flex flex-col gap-3">
                            {enrolled.slice(0, 4).map(c => {
                                const pct = courseProgress(c);
                                return (
                                    <Link key={c.id} to="/courses" className="lift flex items-center gap-4 p-3 rounded-[20px] bg-white dark:bg-night-2 no-underline text-ink dark:text-white">
                                        <span className="w-14 h-14 rounded-[14px] overflow-hidden bg-brand-soft shrink-0">{c.image && <img src={c.image} alt="" className="w-full h-full object-cover" loading="lazy" />}</span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block font-bold text-[14px] line-clamp-1">{c.title}</span>
                                            <span className="block text-[12px] text-stone-600 dark:text-slate-400 line-clamp-1">{c.instructor}</span>
                                            <span className="flex items-center gap-2.5 mt-2"><Bar pct={pct} className="flex-1" color={c.status === CourseStatus.COMPLETED ? 'bg-mint' : 'bg-brand'} label={`${c.title} progress`} /><span className="text-[12px] font-bold tabular-nums">{pct}%</span></span>
                                        </span>
                                        <ArrowRight size={18} className="text-stone-400 shrink-0" />
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section aria-labelledby="popular">
                    <div className="flex items-center justify-between mb-3">
                        <h2 id="popular" className="m-0 text-[18px] font-bold">Popular courses</h2>
                        <div className="flex items-center gap-3">
                            <Link to="/discover" className="text-[14px] font-bold text-brand dark:text-violet-300 no-underline hover:underline">See all</Link>
                            <span className="hidden sm:flex gap-2" aria-hidden="true">
                                <span className="w-8 h-8 rounded-full border border-stone-300 dark:border-night-3 bg-white dark:bg-night-2 text-stone-600 inline-flex items-center justify-center"><ChevronLeft size={14} /></span>
                                <span className="w-8 h-8 rounded-full border border-stone-300 dark:border-night-3 bg-white dark:bg-night-2 text-stone-600 inline-flex items-center justify-center"><ChevronRight size={14} /></span>
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link to={fc.enrolled ? BASE : '/free/ai-fundamentals'} className="lift bg-white dark:bg-night-2 rounded-[20px] p-2.5 text-ink dark:text-white no-underline flex flex-col gap-2.5">
                            <img src="/thumb/m1-l1.jpg" alt="" className="w-full aspect-video object-cover rounded-[14px] bg-brand-soft" loading="lazy" />
                            <div className="px-1 pb-1 flex flex-col gap-2">
                                <Tag tone="lime" className="self-start">Beginner</Tag>
                                <p className="m-0 text-[14px] font-bold leading-snug">{COURSE.title}</p>
                                <div className="flex items-center justify-between"><span className="text-[15px] font-extrabold">Free</span><span className="h-8 px-3.5 rounded-full bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 text-[12px] font-bold inline-flex items-center">{fc.enrolled ? 'Enrolled' : 'Start free'}</span></div>
                            </div>
                        </Link>
                        {explore.map(c => (
                            <button key={c.id} type="button" onClick={() => navigate(`/discover/${c.id}`)} className="lift bg-white dark:bg-night-2 rounded-[20px] p-2.5 text-left text-ink dark:text-white flex flex-col gap-2.5">
                                <span className="block w-full aspect-video rounded-[14px] overflow-hidden bg-night">
                                    {c.image && <img src={c.image} alt="" className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: `${c.imagePositionX ?? 50}% ${c.imagePositionY ?? 50}%` }} />}
                                </span>
                                <span className="px-1 pb-1 flex flex-col gap-2 w-full">
                                    <Tag tone={c.accessTier === 'FREE' ? 'lime' : 'brand'} className="self-start">{c.accessTier === 'FREE' ? 'Free' : (c.category || 'Pro')}</Tag>
                                    <span className="text-[14px] font-bold leading-snug line-clamp-2">{c.title}</span>
                                    <span className="flex items-center justify-between">
                                        <span className="text-[15px] font-extrabold">{c.accessTier === 'FREE' || !c.price ? 'Free' : `$${c.price}`}</span>
                                        <span className="h-8 px-3.5 rounded-full bg-brand text-white text-[12px] font-bold inline-flex items-center">View course</span>
                                    </span>
                                </span>
                            </button>
                        ))}
                        {explore.length < 2 && (
                            <div className="bg-white dark:bg-night-2 rounded-[20px] p-2.5 flex flex-col gap-2.5">
                                <div className="aspect-video rounded-[14px] bg-stone-100 dark:bg-night-3 border border-dashed border-stone-300 dark:border-night-line text-stone-600 flex items-center justify-center text-[12px] font-bold tracking-[0.1em] uppercase">More coming soon</div>
                                <div className="px-1 pb-1 flex flex-col gap-2">
                                    <Tag tone="grey" className="self-start">New</Tag>
                                    <p className="m-0 text-[14px] font-bold leading-snug">New courses are on the way</p>
                                    <Link to="/discover" className="text-[13px] font-bold text-brand dark:text-violet-300 no-underline">Browse the catalogue</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* ---------- Right column ---------- */}
            <aside className="flex-[1_1_340px] lg:max-w-[420px] w-full flex flex-col gap-[18px]">
                <div className="grid grid-cols-2 gap-3.5">
                    {[
                        { pct: fc.total ? (fc.done / fc.total) * 100 : 0, label: <>{fc.done}<span className="text-[10px] text-stone-600">/{fc.total}</span></>, text: 'Lessons completed' },
                        { pct: quizItems.length ? (quizzesPassed / quizItems.length) * 100 : 0, label: <>{quizzesPassed}<span className="text-[10px] text-stone-600">/{quizItems.length}</span></>, text: 'Quizzes passed' },
                        { pct: Math.min(100, (hours / 6) * 100), label: <span className="flex flex-col items-center leading-none">{hours < 10 ? hours.toFixed(1) : Math.round(hours)}<span className="text-[10px] text-stone-600">hrs</span></span>, text: 'Total learning time' },
                        { pct: Math.min(100, (streak / 7) * 100), label: <span className="flex flex-col items-center leading-none">{streak}<span className="text-[10px] text-stone-600">{streak === 1 ? 'day' : 'days'}</span></span>, text: 'Learning streak', lime: true },
                    ].map((r, i) => (
                        <Card key={i} pad="sm" as="div" className="flex items-center gap-3">
                            <Ring pct={r.pct} size={62} stroke={6} track={r.lime ? '#EFF7D6' : '#EEE8FD'} color={r.lime ? '#8DB31A' : '#5B2BC4'} label={r.label} />
                            <span className="text-[13px] font-semibold text-stone-700 dark:text-slate-300 leading-snug">{r.text}</span>
                        </Card>
                    ))}
                </div>

                <Card aria-labelledby="stats">
                    <h2 id="stats" className="m-0 text-[18px] font-bold">Your statistics</h2>
                    <div className="flex items-center gap-3 mt-3">
                        <div role="tablist" aria-label="Statistic" className="flex gap-4 flex-1">
                            {(['time', 'scores'] as const).map(k => (
                                <button key={k} type="button" role="tab" aria-selected={statTab === k} onClick={() => setStatTab(k)}
                                    className={cx('pb-1.5 border-b-2 text-[13px]', statTab === k ? 'border-brand font-bold text-ink dark:text-white' : 'border-transparent font-semibold text-stone-600 dark:text-slate-400')}>
                                    {k === 'time' ? 'Lessons this week' : 'Quiz scores'}
                                </button>
                            ))}
                        </div>
                        <span className="h-[30px] px-3 rounded-[10px] bg-brand text-white text-[12px] font-bold inline-flex items-center">This week</span>
                    </div>
                    {statTab === 'time' ? (
                        <svg viewBox="0 0 360 210" className="w-full h-auto mt-3.5 block" role="img" aria-label={`Lessons completed per day this week: ${DAYS.map((d, i) => `${d} ${week[i]}`).join(', ')}`}>
                            <g stroke="#F1EFF6">{[30, 67.5, 105, 142.5, 180].map(y => <path key={y} d={`M30 ${y}H350`} />)}</g>
                            <path d={path} fill="none" stroke="#5B2BC4" strokeWidth={3} strokeLinecap="round" />
                            {chartPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4.5} fill="#fff" stroke="#5B2BC4" strokeWidth={2.5} />)}
                            {week[todayIdx] > 0 && (<g><rect x={chartPts[todayIdx].x - 22} y={chartPts[todayIdx].y - 34} width={44} height={22} rx={7} fill="#1E1B2E" /><text x={chartPts[todayIdx].x} y={chartPts[todayIdx].y - 19} textAnchor="middle" fontSize="11" fontWeight={700} fill="#fff">{week[todayIdx]}</text></g>)}
                            <g fontSize="11" fill="#6B6680" textAnchor="middle">{DAYS.map((d, i) => <text key={d} x={42 + i * 46} y={202} fontWeight={i === todayIdx ? 800 : 400}>{d}</text>)}</g>
                        </svg>
                    ) : (
                        <div className="mt-4 flex flex-col gap-3">
                            {quizItems.map(q => {
                                const best = bestByQuiz[q.id];
                                const mod = moduleOfItem(q.id);
                                return (
                                    <div key={q.id}>
                                        <div className={cx('flex justify-between text-[13px] font-semibold', best == null && 'text-stone-500')}>
                                            <span>Module {mod?.number} quiz</span><span>{best == null ? 'Not taken' : `${best}%`}</span>
                                        </div>
                                        <Bar pct={best ?? 0} className="mt-1.5 h-2" color={best != null && best >= 70 ? 'bg-brand' : 'bg-[#E0A100]'} label={`Module ${mod?.number} quiz score`} />
                                    </div>
                                );
                            })}
                            {quizGrades.length > 0 && <p className="m-0 text-[12px] text-stone-600 dark:text-slate-400">Other courses: {quizGrades.slice(0, 2).map(g => `${g.quizTitle} ${g.percentage}%`).join(' · ')}</p>}
                            <p className="m-0 text-[12px] text-stone-600 dark:text-slate-400">Module quizzes need 70%. The final test needs 80%.</p>
                        </div>
                    )}
                </Card>

                {upcoming.length > 0 && (
                    <Card aria-labelledby="live">
                        <h2 id="live" className="m-0 text-[16px] font-bold">Next live classes</h2>
                        <ul className="m-0 mt-3 p-0 list-none flex flex-col gap-3">
                            {upcoming.slice(0, 2).map(s => (
                                <li key={s.id} className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-[#F0533A] shrink-0" aria-hidden="true" />
                                    <span className="min-w-0"><span className="block text-[14px] font-bold leading-snug">{s.title}</span><span className="block text-[12px] text-stone-600 dark:text-slate-400">{formatEAT(s.starts_at)} EAT</span></span>
                                </li>
                            ))}
                        </ul>
                        <Link to={`${BASE}/live`} className="inline-block mt-3 text-[13px] font-bold text-brand dark:text-violet-300 no-underline hover:underline">See the timetable</Link>
                    </Card>
                )}

                {isCorporate ? (
                    <section className="relative overflow-hidden bg-brand-soft dark:bg-night-2 rounded-[22px] p-[22px] flex items-center gap-3.5">
                        <div className="flex-1 min-w-0">
                            <h2 className="m-0 text-[18px] font-extrabold text-brand-ink dark:text-white flex items-center gap-2"><Building2 size={18} />{user?.companyName || 'Corporate partner'}</h2>
                            <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[#4A3B7A] dark:text-slate-300">You are part of your organisation's learning programme, with access to all verified courses.</p>
                            <Link to="/corporate" className="press inline-flex items-center h-[38px] mt-3.5 px-[18px] rounded-[10px] bg-brand text-white text-[13px] font-bold no-underline">Open the corporate portal</Link>
                        </div>
                    </section>
                ) : isPremium ? (
                    <section className="relative overflow-hidden bg-lime-100 rounded-[22px] p-[22px]">
                        <h2 className="m-0 text-[18px] font-extrabold text-lime-900 flex items-center gap-2"><Sparkles size={18} />Premium account</h2>
                        <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-lime-800">You have access to all courses and verified certificates.</p>
                    </section>
                ) : (
                    <section className="relative overflow-hidden bg-brand-soft dark:bg-night-2 rounded-[22px] p-[22px] flex items-center gap-3.5">
                        <div className="flex-1 min-w-0">
                            <h2 className="m-0 text-[18px] font-extrabold text-brand-ink dark:text-white">Learn even more!</h2>
                            <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[#4A3B7A] dark:text-slate-300">Live cohorts, every Pro course and verified certificates. Pay with MTN MoMo or Airtel Money.</p>
                            <Link to="/plans" className="press inline-flex items-center h-[38px] mt-3.5 px-[18px] rounded-[10px] bg-brand text-white text-[13px] font-bold no-underline">Go Pro</Link>
                        </div>
                        <span aria-hidden="true" className="shrink-0 w-[92px] h-[92px] rounded-[26px] bg-brand text-lime-200 flex items-center justify-center -rotate-[8deg]"><Megaphone size={44} strokeWidth={1.7} /></span>
                    </section>
                )}
            </aside>
        </div>
    );
};

export default DashboardHome;
