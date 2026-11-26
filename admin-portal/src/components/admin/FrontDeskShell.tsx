import DashboardSwitcher from './DashboardSwitcher';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Home, LayoutGrid, LogOut, MoreHorizontal, Phone, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import AdminBottomNav, { BOTTOM_NAV_SPACE } from './AdminBottomNav';
import { useDeskStats, useFrontDeskData } from './frontDeskData';
import FrontDeskToday from './FrontDeskToday';
import FrontDeskRegister from './FrontDeskRegister';
import FrontDeskClass from './FrontDeskClass';
import FrontDeskCalls from './FrontDeskCalls';
import FrontDeskMore from './FrontDeskMore';
import type { Prefill } from './FrontDeskWalkIn';

type Tab = 'today' | 'register' | 'class' | 'calls' | 'more';
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <Home size={22} /> },
    { id: 'register', label: 'Register', icon: <UserPlus size={22} /> },
    { id: 'class', label: 'Class', icon: <ClipboardCheck size={22} /> },
    { id: 'calls', label: 'Calls', icon: <Phone size={22} /> },
    { id: 'more', label: 'More', icon: <MoreHorizontal size={22} /> },
];
/** Old tab names still work: links and bookmarks from before the courses update land in the right place. */
const ALIASES: Record<string, { tab: Tab; sub?: string }> = {
    walkin: { tab: 'register' }, attendance: { tab: 'class' }, paper: { tab: 'register', sub: 'paper' },
};

/** The Front desk dashboard: a simple phone-first screen for the person who runs HQ.
 *  It has no admin menu. It shares its data and numbers with the Learning hub's Front desk tab, so the numbers equal the admin ones. */
const FrontDeskShell: React.FC<{
    firstName?: string;
    onAdminDashboard: () => void;
    onChooseDashboard: () => void;
    onSignOut: () => void;
}> = ({ firstName, onAdminDashboard, onChooseDashboard, onSignOut }) => {
    const [params, setParams] = useSearchParams();
    const rawTab = params.get('tab') || '';
    const alias = ALIASES[rawTab];
    const tab: Tab = alias ? alias.tab : TABS.some(t => t.id === rawTab) ? (rawTab as Tab) : 'today';
    // An old link like ?tab=paper means Register, Paper forms
    const [prefill, setPrefill] = useState<Prefill | null>(null);

    const data = useFrontDeskData();
    const stats = useDeskStats(data);

    const go = (id: Tab, extra?: Record<string, string>) => {
        const next = new URLSearchParams();
        next.set('tab', id);
        Object.entries(extra || {}).forEach(([k, v]) => next.set(k, v));
        setParams(next, { replace: true });
        window.scrollTo({ top: 0 });
    };

    const hour = new Date(Date.now() + 3 * 3600 * 1000).getUTCHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const items = TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon, onSelect: () => go(t.id) }));
    const registerFrom = (p: Prefill) => { setPrefill(p); go('register'); };

    return (
        <div className="min-h-screen bg-panel dark:bg-night text-ink dark:text-slate-100 font-sans text-base">
            <header className="frost sticky top-0 z-30">
                <div className="h-[64px] px-4 max-w-[760px] mx-auto flex items-center gap-3">
                    <h1 className="m-0 flex-1 min-w-0 text-xl font-extrabold tracking-[-0.01em] truncate">Front desk</h1>
                    <button onClick={() => void data.reload()} aria-label="Refresh" className="press w-11 h-11 rounded-[12px] bg-white dark:bg-night-2 inline-flex items-center justify-center"><RefreshCw size={17} className={data.loading ? 'animate-spin' : ''} /></button>
                    <DashboardSwitcher current="frontdesk" variant="pill" />
                </div>
                {/* On a wide screen the same four places show as tabs, because the floating bar is for phones */}
                <nav aria-label="Front desk" className="hidden lg:flex gap-2 px-4 pb-2 max-w-[760px] mx-auto">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}
                            className={`min-h-[44px] px-4 rounded-[12px] text-sm font-bold border ${tab === t.id ? 'bg-brand text-white border-violet-600' : 'bg-white dark:bg-night-2 border-stone-200 dark:border-slate-700'}`}>{t.label}</button>
                    ))}
                </nav>
            </header>

            <main className={`px-4 pt-3 max-w-[760px] mx-auto ${BOTTOM_NAV_SPACE}`}>
                {data.notice && <p role="status" className="m-0 mb-3 text-sm text-amber-700 dark:text-amber-400">{data.notice}</p>}

                {tab === 'today' && (
                    <>
                        <div className="mb-3">
                            <h2 className="m-0 text-2xl font-extrabold tracking-[-0.02em]">{greet}{firstName ? `, ${firstName}` : ''}</h2>
                            <p className="m-0 mt-1 text-base text-stone-500 dark:text-slate-400">Here is your day at HQ.</p>
                        </div>
                        <FrontDeskToday
                            stats={stats}
                            loading={data.loading}
                            onWalkIn={() => go('register')}
                            onCalls={() => go('calls')}
                            onPaperForms={() => go('register', { sub: 'paper' })}
                            onVisitors={() => go('more', { sub: 'visitors' })}
                            onGraduation={() => go('class', { sub: 'graduation' })}
                            onLogCall={(key, name) => go('calls', { open: key, q: name })}
                        />
                    </>
                )}
                {tab === 'register' && <FrontDeskRegister data={data} prefill={prefill} onClass={() => go('class')} defaultSub={alias?.sub as 'paper' | undefined} />}
                {tab === 'class' && <FrontDeskClass data={data} />}
                {tab === 'calls' && <FrontDeskCalls data={data} />}
                {tab === 'more' && <FrontDeskMore data={data} onRegister={registerFrom} onAdminDashboard={onAdminDashboard} onChooseDashboard={onChooseDashboard} onSignOut={onSignOut} />}
            </main>

            <AdminBottomNav items={items} activeId={tab} ariaLabel="Front desk" />
        </div>
    );
};

export default FrontDeskShell;
