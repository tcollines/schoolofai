import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Phone navigation, as drawn on the canvas "Phone ·" boards: the only way around the app on small screens. */
export type TabId = 'home' | 'learn' | 'live' | 'discover' | 'me';

const sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const ICONS: Record<TabId, (on: boolean) => React.ReactNode> = {
    home: on => on
        ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
        : <svg width="22" height="22" viewBox="0 0 24 24" {...sv} aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
    learn: () => <svg width="22" height="22" viewBox="0 0 24 24" {...sv} aria-hidden="true"><path d="M22 9 12 4 2 9l10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></svg>,
    live: () => <svg width="22" height="22" viewBox="0 0 24 24" {...sv} aria-hidden="true"><rect x="2" y="6" width="14" height="12" rx="3" /><path d="m16 10 6-3v10l-6-3" /></svg>,
    discover: () => <svg width="22" height="22" viewBox="0 0 24 24" {...sv} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>,
    me: () => <svg width="22" height="22" viewBox="0 0 24 24" {...sv} aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>,
};

const TABS: { id: TabId; to: string; label: string }[] = [
    { id: 'home', to: '/dashboard', label: 'Home' },
    { id: 'learn', to: '/courses', label: 'Learn' },
    { id: 'live', to: '/events', label: 'Live' },
    { id: 'discover', to: '/discover', label: 'Discover' },
    { id: 'me', to: '/profile', label: 'Me' },
];

/** Which tab a page belongs to. Everything reached from the Me screen keeps Me highlighted. */
export const tabForPath = (path: string): TabId => {
    const seg = path.split('/')[1] || '';
    if (seg === 'dashboard' || seg === '') return 'home';
    if (seg === 'learn' || seg === 'courses') return path.endsWith('/live') ? 'live' : 'learn';
    if (seg === 'events') return 'live';
    if (seg === 'discover') return 'discover';
    return 'me';
};

const MobileTabBar: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const active = tabForPath(pathname);
    return (
        <nav aria-label="Main"
            className={`lg:hidden fixed left-3 right-3 z-40 min-h-[72px] rounded-[24px] frost-white border-t border-solid border-x-0 border-b-0 border-white/60 dark:border-white/5 shadow-[0_10px_30px_rgba(76,52,150,0.14)] grid grid-cols-5 items-center ${className}`}
            style={{ bottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
            {TABS.map(t => {
                const on = t.id === active;
                return (
                    <button key={t.id} type="button" onClick={() => navigate(t.to)} aria-current={on ? 'page' : undefined}
                        className={`press flex flex-col items-center justify-center gap-[3px] h-full min-h-[56px] text-[12px] bg-transparent border-0 cursor-pointer ${on ? 'text-brand dark:text-violet-300 font-extrabold' : 'text-[#6B6680] dark:text-slate-400 font-bold'}`}>
                        {ICONS[t.id](on)}
                        <span>{t.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export default MobileTabBar;
