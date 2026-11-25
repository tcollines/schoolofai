import React from 'react';

/**
 * The one phone bottom bar used by every dashboard (student, agent, supervisor).
 * Rules it enforces: 3 to 5 destinations, an icon and a plain-word label on every item, a label of at least 12px,
 * a tap target of at least 56px, and a visible highlight for where you are. Hidden from the `lg` breakpoint up,
 * where each dashboard shows its own sidebar.
 *
 * Pages that use it should leave room at the bottom: add the `BOTTOM_NAV_SPACE` class to the page container.
 */
export interface BottomNavItem {
    id: string;
    label: string;
    icon: React.ReactNode;        // a 22px icon (lucide or svg), uses currentColor
    onSelect: () => void;
    badge?: number | null;        // small count, for example people waiting
}

export const BOTTOM_NAV_SPACE = 'pb-[112px] lg:pb-0';

const BottomNav: React.FC<{ items: BottomNavItem[]; activeId: string; ariaLabel?: string; className?: string }> = ({ items, activeId, ariaLabel = 'Main', className = '' }) => {
    const list = items.slice(0, 5);
    return (
        <nav
            aria-label={ariaLabel}
            className={`lg:hidden fixed left-3 right-3 z-40 min-h-[72px] rounded-[24px] frost-white border-t border-solid border-x-0 border-b-0 border-white/60 dark:border-white/5 shadow-[0_10px_30px_rgba(76,52,150,0.14)] grid items-stretch ${className}`}
            style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))', gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }}
        >
            {list.map(it => {
                const on = it.id === activeId;
                return (
                    <button
                        key={it.id}
                        type="button"
                        onClick={it.onSelect}
                        aria-current={on ? 'page' : undefined}
                        className={`press relative flex flex-col items-center justify-center gap-1 min-h-[56px] px-1 text-[12px] font-semibold leading-tight bg-transparent border-0 cursor-pointer ${on ? 'text-brand dark:text-violet-300' : 'text-[#6B6680] dark:text-slate-400'}`}
                    >
                        <span className={`inline-flex items-center justify-center w-11 h-7 rounded-full ${on ? 'bg-brand-soft dark:bg-violet-950/60' : ''}`}>{it.icon}</span>
                        <span className="max-w-full truncate">{it.label}</span>
                        {it.badge ? <span className="absolute top-1.5 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F0533A] text-white text-[11px] font-bold inline-flex items-center justify-center">{it.badge > 99 ? '99+' : it.badge}</span> : null}
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;
