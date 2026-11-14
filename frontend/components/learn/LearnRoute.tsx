import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Award, CalendarClock, CheckCircle2, Circle, Lock, FileText, HelpCircle, LayoutDashboard, ListTree, Loader2, PlayCircle, X } from 'lucide-react';
import { ALL_ITEMS, COURSE, MODULES } from '../../src/content/aiFundamentals';
import {
    Certificate, ItemProgress, ProgressMap, completionState, ensureEnrolled, loadCertificate, loadProgress, saveItemProgress
} from '../../src/lib/learnApi';
import { clearFreeCourseIntent } from '../../src/lib/acquisition';
import { setReturnTo } from '../../src/lib/returnTo';
import { LearnContext } from './learnContext';
import CourseHome from './CourseHome';
import ItemPage from './ItemPage';
import FinalExam from './FinalExam';
import CertificatePage from './CertificatePage';
import LivePanel from './LivePanel';
import ComingSoon from './ComingSoon';
import { hasFullAccess, lockReason, lessonsAreOpen } from '../../src/lib/courseAccess';
import { INK, PAPER, Logo, ProgressRing, ThemeButton } from './learnUi';

const Outline: React.FC<{ progress: ProgressMap; base: string; fullAccess: boolean; onNavigate?: () => void }> = ({ progress, base, fullAccess, onNavigate }) => {
    const { pathname } = useLocation();
    const kindIcon = (k: string) => (k === 'video' ? PlayCircle : k === 'quiz' ? HelpCircle : FileText);
    return (
        <nav aria-label="Course outline" className="py-4">
            {MODULES.map(m => (
                <div key={m.id} className="mb-4">
                    <p className="px-5 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">
                        {m.number === 0 ? 'Start here' : `Module ${m.number}`}
                    </p>
                    <p className="px-5 text-sm font-semibold leading-snug mb-1">{m.title}</p>
                    <ul>
                        {m.items.map(i => {
                            const Icon = kindIcon(i.kind);
                            const active = pathname === `${base}/item/${i.id}`;
                            const done = progress[i.id]?.status === 'completed';
                            const locked = lockReason(i.id, progress, fullAccess) !== null;
                            return (
                                <li key={i.id}>
                                    <Link
                                        to={`${base}/item/${i.id}`}
                                        onClick={onNavigate}
                                        aria-current={active ? 'page' : undefined}
                                        className={`flex items-start gap-2.5 px-5 py-2.5 text-[14px] leading-snug min-h-[44px] border-l-4 ${active ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-700 font-semibold' : 'border-transparent hover:bg-stone-100 dark:hover:bg-slate-800/60'}`}
                                    >
                                        {done ? <CheckCircle2 size={17} className="text-emerald-600 shrink-0 mt-0.5" /> : <Circle size={17} className="text-stone-300 dark:text-slate-600 shrink-0 mt-0.5" />}
                                        <span className="flex-1">{i.title}</span>
                                        {locked ? <Lock size={14} className="text-stone-400 dark:text-slate-500 shrink-0 mt-1" /> : <Icon size={14} className="text-stone-400 dark:text-slate-500 shrink-0 mt-1" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
            <Link
                to={`${base}/final`}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-5 py-3 text-[14px] font-semibold border-l-4 ${pathname === `${base}/final` ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-700' : 'border-transparent hover:bg-stone-100 dark:hover:bg-slate-800/60'}`}
            >
                {progress['final']?.status === 'completed' ? <CheckCircle2 size={17} className="text-emerald-600" /> : <Award size={17} className="text-stone-400" />}
                Final assessment
            </Link>
        </nav>
    );
};

interface Props {
    session: any;
    userProfile: any;
}

const LearnRoute: React.FC<Props> = ({ session, userProfile }) => {
    const { course } = useParams();
    const { pathname } = useLocation();
    const uid: string | undefined = session?.user?.id;
    const base = `/learn/${COURSE.slug}`;

    const [progress, setProgress] = useState<ProgressMap>({});
    const [cert, setCert] = useState<Certificate | null>(null);
    const [ready, setReady] = useState(false);
    const [tick, setTick] = useState(0);
    const [drawer, setDrawer] = useState(false);

    useEffect(() => {
        document.title = `${COURSE.short} | Welile School of AI`;
        if (!uid) return;
        let cancelled = false;
        (async () => {
            await ensureEnrolled(uid, session?.user?.user_metadata);
            clearFreeCourseIntent();
            const [p, c] = await Promise.all([loadProgress(uid), loadCertificate(uid)]);
            if (cancelled) return;
            setProgress(p);
            setCert(c);
            setReady(true);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]);

    const markProgress = useCallback(async (itemId: string, patch: Partial<ItemProgress>) => {
        if (!uid) return;
        const next = await saveItemProgress(uid, itemId, patch);
        setProgress({ ...next });
    }, [uid]);

    const markComplete = useCallback((itemId: string) => markProgress(itemId, { status: 'completed' }), [markProgress]);

    const refresh = useCallback(async () => {
        if (!uid) return;
        setProgress(await loadProgress(uid));
    }, [uid]);

    const fullAccess = hasFullAccess(session?.user?.email, userProfile?.role);
    const fullName = userProfile?.name || session?.user?.user_metadata?.full_name || '';
    const ctx = useMemo(() => ({
        uid: uid || '',
        email: session?.user?.email || '',
        fullName,
        progress,
        markProgress,
        markComplete,
        refresh,
        cert,
        setCert,
        attemptsTick: tick,
        bump: () => setTick(t => t + 1),
        fullAccess
    }), [uid, session, fullName, fullAccess, progress, markProgress, markComplete, refresh, cert, tick]);

    if (course !== COURSE.slug) return <Navigate to="/dashboard" replace />;
    if (!uid) { setReturnTo(pathname); return <Navigate to="/login" replace />; }

    if (!ready) {
        return (
            <div className={`min-h-screen ${PAPER} flex items-center justify-center`}>
                <Loader2 className="animate-spin text-violet-700" size={32} aria-label="Loading your course" />
            </div>
        );
    }

    const state = completionState(progress, uid);
    const onHome = pathname === base || pathname === `${base}/`;

    return (
        <LearnContext.Provider value={ctx}>
            <div className={`min-h-screen ${PAPER} ${INK}`}>
                <header className="sticky top-0 z-40 bg-[#faf8f5]/95 dark:bg-slate-950/95 backdrop-blur border-b border-stone-200 dark:border-slate-800">
                    <div className="px-3 sm:px-5 h-16 flex items-center gap-2 sm:gap-4">
                        {!onHome && (
                            <button onClick={() => setDrawer(true)} aria-label="Open course outline" className="lg:hidden p-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800">
                                <ListTree size={20} />
                            </button>
                        )}
                        <Logo to={base} className="h-9" />
                        <p className="hidden md:block font-serif font-semibold truncate">{COURSE.short}</p>
                        <div className="flex-1" />
                        <div className="hidden sm:block"><ProgressRing pct={state.pct} size={40} stroke={5} /></div>
                        <Link to={`${base}/live`} aria-label="Live classes" className="flex items-center gap-2 p-2.5 sm:px-3 rounded-lg text-sm font-medium hover:bg-stone-100 dark:hover:bg-slate-800">
                            <CalendarClock size={18} /><span className="hidden sm:inline">Live</span>
                        </Link>
                        <Link to={`${base}/certificate`} aria-label="Certificate" className="flex items-center gap-2 p-2.5 sm:px-3 rounded-lg text-sm font-medium hover:bg-stone-100 dark:hover:bg-slate-800">
                            <Award size={18} /><span className="hidden sm:inline">Certificate</span>
                        </Link>
                        <Link to="/dashboard" aria-label="Exit to dashboard" className="flex items-center gap-2 p-2.5 sm:px-3 rounded-lg text-sm font-medium hover:bg-stone-100 dark:hover:bg-slate-800">
                            <LayoutDashboard size={18} /><span className="hidden lg:inline">Dashboard</span>
                        </Link>
                        <ThemeButton />
                    </div>
                    <div className="h-1 bg-stone-200 dark:bg-slate-800" role="progressbar" aria-valuenow={state.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
                        <div className="h-full bg-violet-700 transition-all duration-500" style={{ width: `${state.pct}%` }} />
                    </div>
                </header>

                <div className="flex">
                    {!onHome && (
                        <aside className="hidden lg:block w-80 shrink-0 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto border-r border-stone-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
                            <Outline progress={progress} base={base} fullAccess={fullAccess} />
                        </aside>
                    )}
                    <main className="flex-1 min-w-0">
                        <Routes>
                            <Route index element={<CourseHome />} />
                            <Route path="item/:itemId" element={<ItemPage />} />
                            <Route path="final" element={fullAccess || lessonsAreOpen() ? <FinalExam /> : <ComingSoon firstName={fullName.split(' ')[0]} />} />
                            <Route path="certificate" element={fullAccess || lessonsAreOpen() || cert ? <CertificatePage /> : <ComingSoon firstName={fullName.split(' ')[0]} />} />
                            <Route path="live" element={<LivePanel />} />
                            <Route path="*" element={<Navigate to={base} replace />} />
                        </Routes>
                    </main>
                </div>

                {/* mobile outline drawer */}
                {drawer && (
                    <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Course outline">
                        <div className="w-[85%] max-w-sm bg-[#faf8f5] dark:bg-slate-950 h-full overflow-y-auto shadow-2xl">
                            <div className="flex items-center justify-between px-5 h-16 border-b border-stone-200 dark:border-slate-800 sticky top-0 bg-[#faf8f5] dark:bg-slate-950">
                                <p className="font-serif font-semibold">Course outline</p>
                                <button onClick={() => setDrawer(false)} aria-label="Close outline" className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800"><X size={20} /></button>
                            </div>
                            <Outline progress={progress} base={base} fullAccess={fullAccess} onNavigate={() => setDrawer(false)} />
                        </div>
                        <button className="flex-1 bg-black/40" aria-label="Close outline" onClick={() => setDrawer(false)} />
                    </div>
                )}
            </div>
        </LearnContext.Provider>
    );
};

export default LearnRoute;
