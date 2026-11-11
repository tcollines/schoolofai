import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowRight, Award, Building2, CalendarClock, CheckCircle2, Compass } from 'lucide-react';
import { Course, CourseStatus, UserRole } from '../types';
import FreeCourseCard from './learn/FreeCourseCard';
import { useSessions } from './learn/LivePanel';
import { formatEAT } from './learn/learnUi';

interface DashboardHomeProps {
    courses: Course[];
    userId?: string;
}

const card = 'rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900';

const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const courseProgress = (c: Course) =>
    Math.min(100, Math.round((c.lessonsTotal > 0 ? (c.lessonsCompleted / c.lessonsTotal) * 60 : 0) + (c.examCompleted ? 40 : 0)));

const DashboardHome: React.FC<DashboardHomeProps> = ({ courses, userId }) => {
    const navigate = useNavigate();
    const outlet = useOutletContext<{ displayUser?: any } | undefined>();
    const user = outlet?.displayUser;
    const firstName = (user?.name || '').split(' ')[0];
    const sessions = useSessions();

    const enrolled = courses.filter(c => c.status === CourseStatus.IN_PROGRESS || c.status === CourseStatus.COMPLETED);
    const explore = courses
        .filter(c => !c.isDraft && c.isVerified !== false && c.status === CourseStatus.NOT_STARTED)
        .slice(0, 3);
    const nextLive = (sessions || []).filter(s => new Date(s.ends_at).getTime() > Date.now()).slice(0, 2);

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

    if (!userId) return <div className="p-8 text-center text-stone-500 dark:text-slate-400">Loading...</div>;

    const role = user?.role;
    const isCorporate = role === UserRole.SPONSORED || Boolean(user?.companyName);
    const isPremium = role === UserRole.PRO || role === UserRole.ADMIN;

    return (
        <div className="space-y-8 max-w-6xl">
            <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
                    {greeting()}{firstName ? `, ${firstName}` : ''}.
                </h1>
                <p className="mt-1 text-stone-600 dark:text-slate-400">Here is where you left off.</p>
            </div>

            <FreeCourseCard uid={userId} variant="featured" />

            <div className="grid lg:grid-cols-[1fr_22rem] gap-8">
                {/* Left */}
                <div className="space-y-8 min-w-0">
                    <section aria-labelledby="your-courses">
                        <div className="flex items-center justify-between mb-3">
                            <h2 id="your-courses" className="font-serif text-xl font-semibold">Your other courses</h2>
                            {enrolled.length > 0 && <Link to="/courses" className="text-sm font-semibold text-violet-800 dark:text-violet-300 hover:underline">See all</Link>}
                        </div>
                        {enrolled.length === 0 ? (
                            <div className={`${card} p-6 text-center`}>
                                <p className="font-medium">You are not enrolled in any other course yet.</p>
                                <p className="text-sm text-stone-600 dark:text-slate-400 mt-1">When you join a programme, your progress will appear here.</p>
                                <Link to="/discover" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-violet-800 dark:text-violet-300 hover:underline"><Compass size={16} /> Browse courses</Link>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {enrolled.slice(0, 4).map(c => {
                                    const pct = courseProgress(c);
                                    return (
                                        <li key={c.id}>
                                            <Link to="/courses" className={`${card} group flex items-center gap-4 p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors`}>
                                                <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-stone-100 dark:bg-slate-800">
                                                    {c.image && <img src={c.image} alt="" className="w-full h-full object-cover" loading="lazy" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold leading-snug line-clamp-1">{c.title}</p>
                                                    <p className="text-xs text-stone-600 dark:text-slate-400 line-clamp-1">{c.instructor}</p>
                                                    <div className="mt-2 flex items-center gap-3">
                                                        <div className="flex-1 h-2 rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.title} progress`}>
                                                            <div className={`h-full rounded-full ${c.status === CourseStatus.COMPLETED ? 'bg-emerald-600' : 'bg-violet-700'}`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-xs font-semibold tabular-nums w-9 text-right">{pct}%</span>
                                                    </div>
                                                </div>
                                                <ArrowRight size={18} className="shrink-0 text-stone-400 group-hover:text-violet-700 transition-colors" />
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {explore.length > 0 && (
                        <section aria-labelledby="explore">
                            <div className="flex items-center justify-between mb-3">
                                <h2 id="explore" className="font-serif text-xl font-semibold">Explore more</h2>
                                <Link to="/discover" className="text-sm font-semibold text-violet-800 dark:text-violet-300 hover:underline">Browse all</Link>
                            </div>
                            <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {explore.map(c => (
                                    <li key={c.id}>
                                        <button onClick={() => navigate(`/discover/${c.id}`)} className={`${card} w-full text-left overflow-hidden hover:border-violet-300 dark:hover:border-violet-700 transition-colors`}>
                                            <div className="aspect-[16/9] bg-stone-100 dark:bg-slate-800">
                                                {c.image && <img src={c.image} alt="" className="w-full h-full object-cover" loading="lazy" />}
                                            </div>
                                            <div className="p-4">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">{c.category}</p>
                                                <p className="font-semibold leading-snug mt-1 line-clamp-2">{c.title}</p>
                                                <p className="text-sm mt-2 font-medium text-violet-800 dark:text-violet-300">{c.accessTier === 'FREE' ? 'Free' : 'View course'}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                {/* Right */}
                <aside className="space-y-6">
                    <section className={`${card} p-5`} aria-labelledby="live">
                        <h2 id="live" className="font-semibold flex items-center gap-2"><CalendarClock size={18} className="text-violet-700 dark:text-violet-400" /> Next live classes</h2>
                        {nextLive.length === 0 ? (
                            <p className="mt-3 text-sm text-stone-600 dark:text-slate-400">Nothing scheduled yet. New sessions appear here.</p>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {nextLive.map(s => (
                                    <li key={s.id}>
                                        <p className="font-medium leading-snug">{s.title}</p>
                                        <p className="text-sm text-stone-600 dark:text-slate-400">{formatEAT(s.starts_at)} EAT</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Link to="/learn/ai-fundamentals/live" className="inline-block mt-4 text-sm font-semibold text-violet-800 dark:text-violet-300 hover:underline">See the timetable</Link>
                    </section>

                    <section className={`${card} p-5`} aria-labelledby="plan">
                        {isCorporate ? (
                            <>
                                <h2 id="plan" className="font-semibold flex items-center gap-2"><Building2 size={18} className="text-violet-700 dark:text-violet-400" /> {user?.companyName || 'Corporate partner'}</h2>
                                <p className="mt-2 text-sm text-stone-600 dark:text-slate-400">You are part of your organisation's learning programme with access to all verified courses.</p>
                                <Link to="/corporate" className="inline-block mt-4 text-sm font-semibold text-violet-800 dark:text-violet-300 hover:underline">Open the corporate portal</Link>
                            </>
                        ) : isPremium ? (
                            <>
                                <h2 id="plan" className="font-semibold">Premium account</h2>
                                <p className="mt-2 text-sm text-stone-600 dark:text-slate-400">You have access to all courses and verified certificates.</p>
                            </>
                        ) : (
                            <>
                                <h2 id="plan" className="font-semibold">Want to go further?</h2>
                                <p className="mt-2 text-sm text-stone-600 dark:text-slate-400">Our paid programmes include live cohorts, instructor feedback and verified certificates.</p>
                                <Link to="/plans" className="inline-block mt-4 text-sm font-semibold text-violet-800 dark:text-violet-300 hover:underline">See plans</Link>
                            </>
                        )}
                    </section>

                    <section className={`${card} p-5`} aria-labelledby="results">
                        <h2 id="results" className="font-semibold flex items-center gap-2"><Award size={18} className="text-violet-700 dark:text-violet-400" /> Recent quiz results</h2>
                        {quizGrades.length === 0 ? (
                            <p className="mt-3 text-sm text-stone-600 dark:text-slate-400">No quizzes taken yet.</p>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {quizGrades.slice(0, 4).map((g, i) => (
                                    <li key={i} className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium leading-snug line-clamp-1">{g.quizTitle}</p>
                                            <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-1">{g.courseTitle}</p>
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${g.percentage >= 80 ? 'bg-emerald-100 text-emerald-900' : g.percentage >= 50 ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-900'}`}>
                                            {g.percentage >= 80 && <CheckCircle2 size={12} />}{g.percentage}%
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default DashboardHome;
