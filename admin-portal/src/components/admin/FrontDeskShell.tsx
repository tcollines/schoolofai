import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, FileText, Home, LayoutGrid, LogOut, Phone, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import AdminBottomNav, { BOTTOM_NAV_SPACE } from './AdminBottomNav';
import { useDeskStats, useFrontDeskData } from './frontDeskData';
import FrontDeskToday from './FrontDeskToday';
import FrontDeskWalkIn from './FrontDeskWalkIn';
import FrontDeskCalls from './FrontDeskCalls';
import FrontDeskAttendance from './FrontDeskAttendance';
import FrontDeskPaperForms from './FrontDeskPaperForms';

type Tab = 'today' | 'walkin' | 'paper' | 'calls' | 'attendance';
// `short` is the word under the icon in the phone bar, where five items share the width
const TABS: { id: Tab; label: string; short: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', short: 'Today', icon: <Home size={22} /> },
    { id: 'walkin', label: 'Walk-in', short: 'Walk-in', icon: <UserPlus size={22} /> },
    { id: 'paper', label: 'Paper forms', short: 'Paper', icon: <FileText size={22} /> },
    { id: 'calls', label: 'Calls', short: 'Calls', icon: <Phone size={22} /> },
    { id: 'attendance', label: 'Attendance', short: 'Attendance', icon: <ClipboardCheck size={22} /> },
];

/** The Front desk dashboard: a simple phone-first screen for the person who runs HQ.
 *  It has no admin menu. It shares its data and numbers with the Learning hub's Front desk tab, so the numbers equal the admin ones. */
const FrontDeskShell: React.FC<{
    firstName?: string;
    onAdminDashboard: () => void;
    onChooseDashboard: () => void;
    onSignOut: () => void;
}> = ({ firstName, onAdminDashboard, onChooseDashboard, onSignOut }) => {
    const [params, setParams] = useSearchParams();
    const wanted = params.get('tab');
    const tab: Tab = TABS.some(t => t.id === wanted) ? (wanted as Tab) : 'today';
    const [sheet, setSheet] = useState(false);

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
    const items = TABS.map(t => ({ id: t.id, label: t.short, icon: t.icon, onSelect: () => go(t.id) }));
    const sheetBtn = 'w-full min-h-[56px] px-4 rounded-[14px] text-left text-base font-bold inline-flex items-center gap-3 border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2';

    return (
        <div className="min-h-screen bg-panel dark:bg-night text-ink dark:text-slate-100 font-sans text-base">
            <header className="frost sticky top-0 z-30">
                <div className="h-[64px] px-4 max-w-[760px] mx-auto flex items-center gap-3">
                    <h1 className="m-0 flex-1 min-w-0 text-xl font-extrabold tracking-[-0.01em] truncate">Front desk</h1>
                    <button onClick={() => void data.reload()} aria-label="Refresh" className="press w-11 h-11 rounded-[12px] bg-white dark:bg-night-2 inline-flex items-center justify-center"><RefreshCw size={17} className={data.loading ? 'animate-spin' : ''} /></button>
                    <button onClick={() => setSheet(true)} aria-haspopup="dialog" className="press h-11 min-w-[44px] px-3 rounded-[12px] bg-white dark:bg-night-2 inline-flex items-center justify-center gap-2 text-sm font-bold"><LayoutGrid size={18} /> Switch</button>
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
                            onWalkIn={() => go('walkin')}
                            onCalls={() => go('calls')}
                            onPaperForms={() => go('paper')}
                            onLogCall={(key, name) => go('calls', { open: key, q: name })}
                        />
                    </>
                )}
                {tab === 'walkin' && <FrontDeskWalkIn data={data} />}
                {tab === 'paper' && <FrontDeskPaperForms data={data} />}
                {tab === 'calls' && <FrontDeskCalls data={data} />}
                {tab === 'attendance' && <FrontDeskAttendance data={data} />}
            </main>

            <AdminBottomNav items={items} activeId={tab} ariaLabel="Front desk" />

            {sheet && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Switch">
                    <button aria-label="Close" onClick={() => setSheet(false)} className="absolute inset-0 bg-black/40 border-0 cursor-default" />
                    <div className="relative w-full sm:max-w-[420px] rounded-t-[24px] sm:rounded-[24px] bg-panel dark:bg-night p-4 space-y-2" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
                        <p className="m-0 px-1 pb-1 text-sm font-bold text-stone-500 dark:text-slate-400">Go to</p>
                        <button onClick={() => { setSheet(false); onAdminDashboard(); }} className={sheetBtn}><ShieldCheck size={20} className="text-brand dark:text-violet-300" /> Admin dashboard</button>
                        <button onClick={() => { setSheet(false); onChooseDashboard(); }} className={sheetBtn}><LayoutGrid size={20} className="text-brand dark:text-violet-300" /> Choose dashboard</button>
                        <button onClick={() => { setSheet(false); onSignOut(); }} className={`${sheetBtn} text-[#A3321F]`}><LogOut size={20} /> Sign out</button>
                        <button onClick={() => setSheet(false)} className="w-full min-h-[52px] rounded-[14px] text-base font-semibold text-stone-600 dark:text-slate-300">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FrontDeskShell;
