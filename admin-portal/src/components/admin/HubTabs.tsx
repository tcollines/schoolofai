import React from 'react';
import { useSearchParams } from 'react-router-dom';

export interface HubTab { id: string; label: string; }

/** Reads the active tab from the `tab` URL param (falls back to the first tab). */
export function useHubTab(tabs: HubTab[]): [string, (id: string) => void] {
    const [params, setParams] = useSearchParams();
    const wanted = params.get('tab');
    const active = tabs.some(t => t.id === wanted) ? (wanted as string) : tabs[0].id;
    const setTab = (id: string) => {
        const next = new URLSearchParams(params);
        next.set('tab', id);
        setParams(next, { replace: true });
    };
    return [active, setTab];
}

/** A plain row of big tabs that sits at the top of a page and scrolls sideways on phones. */
const HubTabs: React.FC<{ tabs: HubTab[]; active: string; onChange: (id: string) => void; label?: string }> = ({ tabs, active, onChange, label }) => (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-stone-50/95 dark:bg-night/95 backdrop-blur">
        <div role="tablist" aria-label={label || 'Sections'} className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(t => (
                <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active === t.id}
                    onClick={() => onChange(t.id)}
                    className={`shrink-0 min-h-[44px] px-4 rounded-[12px] text-sm font-semibold border whitespace-nowrap ${active === t.id ? 'bg-brand text-white border-violet-600' : 'bg-white dark:bg-night-2 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-200'}`}
                >{t.label}</button>
            ))}
        </div>
    </div>
);

export default HubTabs;
