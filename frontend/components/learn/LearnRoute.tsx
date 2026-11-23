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
import LiveTodayBar from './LiveTodayBar';
import { InstallChip, useInstallTracking } from './InstallApp';
import MobileTabBar from '../layouts/MobileTabBar';
import { exemptItemIds, loadAttendedLectures } from '../../src/lib/liveClass';

const Outline: React.FC<{ progress: ProgressMap; base: string; fullAccess: boolean; onNavigate?: () => void }> = ({ progress, base, fullAccess, onNavigate }) => {
    const { pathname } = useLocation();
    const kindIcon = (k: string) => (k === 'video' ? PlayCircle : k === 'quiz' ? HelpCircle : FileText);
    return (
        <nav aria-label="Course outline" className="p-3 flex flex-col gap-2">
            {MODULES.map(m => {
                const done = m.items.filter(i => progress[i.id]?.status === 'completed').length;
                const hasActive = m.items.some(i => pathname === `${base}/item/${i.id}`);
                return (
                    <details key={m.id} open={hasActive || undefined} className="group rounded-[16px] bg-panel dark:bg-night-3/60 open:bg-white dark:open:bg-night-2">
                        <summary className="list-none cursor-pointer flex items-center gap-3 px-3.5 py-3 min-h-[52px] rounded-[16px]">
                            <span className={`w-9 h-9 rounded-[11px] shrink-0 inline-flex items-center justify-center text-[13px] font-extrabold ${done === m.items.length ? 'bg-mint-soft text-mint' : 'bg-brand-soft text-brand dark:bg-night dark:text-violet-300'}`}>
                                {done === m.items.length ? <CheckCircle2 size={17} /> : m.number}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B6680] dark:text-slate-400">{m.number === 0 ? 'Start here' : `Module ${m.number}`} · {done}/{m.items.length}</span>
                                <span className="block text-[14px] font-bold leading-snug truncate">{m.title}</span>
                            </span>
                        </summary>
                        <ul className="px-1.5 pb-2">
                            {m.items.map(i => {
                                const Icon = kindIcon(i.kind);
                                const active = pathname === `${base}/item/${i.id}`;
                                const itemDone = progress[i.id]?.status === 'completed';
                                const locked = lockReason(i.id, progress, fullAccess) !== null;
                                return (
                                    <li key={i.id}>
                                        <Link
                                            to={`${base}/item/${i.id}`}
                                            onClick={onNavigate}
                                            aria-current={active ? 'page' : undefined}
                                            className={`relative flex items-start gap-2.5 px-3 py-2.5 rounded-[12px] text-[13.5px] leading-snug min-h-[44px] ${active ? 'bg-brand-soft dark:bg-night-3 text-brand-ink dark:text-white font-bold' : 'hover:bg-panel dark:hover:bg-night-3/60'}`}
                                        >
                                            {active && <span aria-hidden="true" className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-brand" />}
                                            {itemDone ? <CheckCircle2 size={17} className="text-mint shrink-0 mt-px" /> : <Circle size={17} className="text-[#C9C3DA] dark:text-slate-600 shrink-0 mt-px" />}
                                            <span className="flex-1">{i.title}</span>
                                            <span className="shrink-0 mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#6B6680] dark:text-slate-500">
                                                {i.minutes}m
                                                {locked ? <Lock size={13} /> : <Icon size={13} />}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </details>
                );
            })}
            <Link
                to={`${base}/final`}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3.5 py-3 min-h-[52px] rounded-[16px] text-[14px] font-bold ${pathname === `${base}/final` ? 'bg-lime-200 text-ink' : 'bg-lime-100 text-lime-900 hover:bg-lime-200'}`}
            >
                <span className="w-9 h-9 rounded-[11px] bg-white/70 inline-flex items-center justify-center">
                    {progress['final']?.status === 'completed' ? <CheckCircle2 size={17} className="text-mint" /> : <Award size={17} />}
                </span>
                <span className="flex-1">Final assessment<span className="block text-[11px] font-semibold opacity-80">20 questions · pass with 80%</span></span>
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
    const [attended, setAttended] = useState<Set<string>>(new Set());
    useInstallTracking(uid);

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

    const refreshAttendance = useCallback(async () => {
        if (!uid) return;
        const lectures = await loadAttendedLectures(uid);
        setAttended(prev => (prev.size === lectures.size && [...lectures].every(l => prev.has(l)) ? prev : lectures));
    }, [uid]);

    useEffect(() => { if (ready) void refreshAttendance(); }, [ready, refreshAttendance]);

    // Attending a live class counts as the lessons it covered: mark that class's videos and readings done, so only the quizzes remain.
    useEffect(() => {
        if (!uid || !ready || attended.size === 0) return;
        const todo = exemptItemIds(attended).filter(id => progress[id]?.status !== 'completed');
        if (todo.length === 0) return;
        let cancelled = false;
        (async () => {
            let latest: ProgressMap | null = null;
            for (const id of todo) latest = await saveItemProgress(uid, id, { status: 'completed' });
            if (!cancelled && latest) setProgress({ ...latest });
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid, ready, attended]);

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
        fullAccess,
        attended,
        refreshAttendance
    }), [uid, session, fullName, fullAccess, progress, markProgress, markComplete, refresh, cert, tick, attended, refreshAttendance]);

    if (course !== COURSE.slug) return <Navigate to="/dashboard" replace />;
    if (!uid) { setReturnTo(pathname); return <Navigate to="/login" replace />; }

    if (!ready) {
        return (
            <div className={`min-h-screen ${PAPER} flex items-center justify-center`}>
                <Loader2 className="animate-spin text-brand" size={32} aria-label="Loading your course" />
            </div>
        );
    }

    const state = completionState(progress, uid);
    const onHome = pathname === base || pathname === `${base}/`;
    // The phone tab bar shows on the course home, live and certificate pages; lessons and the final test stay full screen.
    const showTabs = onHome || pathname.startsWith(`${base}/live`) || pathname.startsWith(`${base}/certificate`);

    const navChip = (to: string, label: string, Icon: React.ElementType, active: boolean, hideLabel = 'sm') => (
        <Link to={to} aria-label={label} aria-current={active ? 'page' : undefined}
            className={`press h-11 inline-flex items-center gap-2 px-3 rounded-[14px] text-[13px] font-bold ${active ? 'bg-brand text-white' : 'bg-white dark:bg-night-2 text-ink dark:text-slate-200 hover:text-brand'}`}>
            <Icon size={17} /><span className={`hidden ${hideLabel}:inline`}>{label}</span>
        </Link>
    );

    return (
        <LearnContext.Provider value={ctx}>
            <div className={`min-h-screen ${PAPER} ${INK}`}>
                <header className="frost sticky top-0 z-40">
                    <div className="max-w-[1480px] mx-auto px-3 sm:px-5 h-[72px] flex items-center gap-2 sm:gap-3">
                        {!onHome && (
                            <button onClick={() => setDrawer(true)} aria-label="Open course outline" className="press lg:hidden w-11 h-11 inline-flex items-center justify-center rounded-[14px] bg-white dark:bg-night-2">
                                <ListTree size={19} />
                            </button>
                        )}
                        <Logo to={base} className="h-9" />
                        <div className="hidden md:flex flex-col min-w-0 pl-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6680] dark:text-slate-400">Free course</span>
                            <span className="text-[15px] font-extrabold tracking-[-0.01em] truncate">{COURSE.short}</span>
                        </div>
                        <div className="flex-1" />
                        <div className="hidden sm:flex items-center gap-2.5 h-11 pl-1.5 pr-3.5 rounded-[14px] bg-white dark:bg-night-2">
                            <ProgressRing pct={state.pct} size={34} stroke={4} />
                            <span className="text-[12px] font-bold leading-tight">{state.done}/{state.total}<span className="block font-semibold text-[#6B6680] dark:text-slate-400">done</span></span>
                        </div>
                        {navChip(`${base}/live`, 'Live', CalendarClock, pathname === `${base}/live`)}
                        {navChip(`${base}/certificate`, 'Certificate', Award, pathname === `${base}/certificate`)}
                        <span className="hidden lg:contents">
                            {navChip('/dashboard', 'Dashboard', LayoutDashboard, false, 'lg')}
                            <InstallChip />
                            <ThemeButton />
                        </span>
                    </div>
                    <div className="h-1 bg-brand-soft dark:bg-night-3" role="progressbar" aria-valuenow={state.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
                        <div className="h-full bg-brand transition-all duration-500 rounded-r-full" style={{ width: `${state.pct}%` }} />
                    </div>
                    <LiveTodayBar />
                </header>

                <div className="max-w-[1480px] mx-auto flex items-start gap-5 px-0 lg:px-5 lg:pt-5">
                    {!onHome && (
                        <aside className="hidden lg:block w-[320px] shrink-0 sticky top-[96px] max-h-[calc(100vh-116px)] overflow-y-auto no-scrollbar rounded-[24px] bg-white dark:bg-night-2">
                            <div className="px-5 pt-5 pb-1">
                                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6680] dark:text-slate-400">Course outline</p>
                                <p className="m-0 mt-1 text-[13px] font-semibold">{state.pct}% complete</p>
                            </div>
                            <Outline progress={progress} base={base} fullAccess={fullAccess} />
                        </aside>
                    )}
                    <main className={`flex-1 min-w-0 ${showTabs ? 'pb-32 lg:pb-16' : 'pb-16'}`}>
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

                {showTabs && <MobileTabBar />}

                {/* mobile outline drawer */}
                {drawer && (
                    <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Course outline">
                        <div className="w-[88%] max-w-sm bg-panel dark:bg-night h-full overflow-y-auto shadow-2xl rounded-r-[28px]">
                            <div className="frost flex items-center justify-between px-5 h-[68px] sticky top-0 z-10">
                                <div>
                                    <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6680]">Course outline</p>
                                    <p className="m-0 text-[15px] font-extrabold">{state.pct}% complete</p>
                                </div>
                                <button onClick={() => setDrawer(false)} aria-label="Close outline" className="press w-11 h-11 inline-flex items-center justify-center rounded-[14px] bg-white dark:bg-night-2"><X size={19} /></button>
                            </div>
                            <Outline progress={progress} base={base} fullAccess={fullAccess} onNavigate={() => setDrawer(false)} />
                        </div>
                        <button className="flex-1 bg-[#16122B]/40" aria-label="Close outline" onClick={() => setDrawer(false)} />
                    </div>
                )}
            </div>
        </LearnContext.Provider>
    );
};

export default LearnRoute;
