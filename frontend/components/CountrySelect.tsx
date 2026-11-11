import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { COUNTRIES, POPULAR_COUNTRIES, isCountry, searchCountries } from '../src/lib/countries';

interface Props {
    value: string;
    onChange: (country: string) => void;
    id?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

/**
 * Searchable country picker. Type to filter ("ug" finds Uganda, "drc" finds Congo), use the arrow keys
 * and Enter, or just tap a country. Works well with a phone keyboard.
 */
const CountrySelect: React.FC<Props> = ({ value, onChange, id, placeholder = 'Search your country', required, className = '' }) => {
    const reactId = useId();
    const inputId = id || `country-${reactId}`;
    const listId = `${inputId}-list`;
    const wrapRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);

    const results = useMemo(() => {
        if (query.trim()) return searchCountries(query);
        // empty search: popular first, then everyone else alphabetically
        return [...POPULAR_COUNTRIES, ...COUNTRIES.filter(c => !POPULAR_COUNTRIES.includes(c))];
    }, [query]);

    useEffect(() => { setActive(0); }, [query, open]);

    useEffect(() => {
        const onDown = (e: MouseEvent | TouchEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('touchstart', onDown);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); };
    }, []);

    useEffect(() => {
        if (!open) return;
        const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [active, open]);

    const choose = (country: string) => {
        onChange(country);
        setOpen(false);
        setQuery('');
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
        else if (e.key === 'Enter') { if (open && results[active]) { e.preventDefault(); choose(results[active]); } }
        else if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    };

    const showPopularHeader = open && !query.trim();

    return (
        <div ref={wrapRef} className={`relative ${className}`}>
            <div className="relative">
                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                    id={inputId}
                    type="text"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={open && results[active] ? `${inputId}-opt-${active}` : undefined}
                    autoComplete="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    required={required && !isCountry(value)}
                    value={open ? query : value}
                    placeholder={value && !open ? value : placeholder}
                    onFocus={() => setOpen(true)}
                    onClick={() => setOpen(true)}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onKeyDown={onKeyDown}
                    className="w-full pl-10 pr-16 py-3 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 text-gray-900 dark:text-white text-base"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    {value && (
                        <button type="button" aria-label="Clear country" onClick={() => { onChange(''); setQuery(''); setOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-slate-200">
                            <X size={16} />
                        </button>
                    )}
                    <button type="button" tabIndex={-1} aria-label="Show countries" onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg text-stone-400">
                        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {open && (
                <ul
                    id={listId}
                    ref={listRef}
                    role="listbox"
                    className="absolute z-30 mt-2 w-full max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1"
                >
                    {results.length === 0 && <li className="px-4 py-3 text-sm text-stone-500 dark:text-slate-400">No country matches "{query}". Check the spelling.</li>}
                    {results.map((c, i) => {
                        const selected = c === value;
                        const isPopularEnd = showPopularHeader && i === POPULAR_COUNTRIES.length - 1;
                        return (
                            <React.Fragment key={c}>
                                {showPopularHeader && i === 0 && <li role="presentation" className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Common</li>}
                                <li
                                    id={`${inputId}-opt-${i}`}
                                    data-index={i}
                                    role="option"
                                    aria-selected={selected}
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => choose(c)}
                                    onMouseEnter={() => setActive(i)}
                                    className={`flex items-center justify-between gap-3 px-4 min-h-[44px] cursor-pointer text-[15px] ${i === active ? 'bg-violet-50 dark:bg-violet-950/40' : ''} ${selected ? 'font-semibold' : ''}`}
                                >
                                    <span>{c}</span>
                                    {selected && <Check size={16} className="text-violet-700 dark:text-violet-300 shrink-0" />}
                                </li>
                                {isPopularEnd && <li role="presentation" className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400 border-t border-gray-100 dark:border-slate-800 mt-1">All countries</li>}
                            </React.Fragment>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default CountrySelect;
