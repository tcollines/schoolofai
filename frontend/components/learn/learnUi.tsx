import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';

/** Shared bits for the free-course pages: Welile look (lavender panel, ink, purple brand, lime accent). */

export const PAPER = 'bg-panel dark:bg-night';
export const INK = 'text-ink dark:text-slate-100';
export const MUTED = 'text-[#6B6680] dark:text-slate-400';
export const CARD = 'bg-white dark:bg-night-2 rounded-[22px]';
export const BTN_PRIMARY =
    'inline-flex items-center justify-center gap-2 press rounded-[14px] bg-brand hover:bg-brand-mid text-white font-bold px-6 py-3.5 text-[15px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
export const BTN_SECONDARY =
    'inline-flex items-center justify-center gap-2 press rounded-[14px] bg-brand-soft dark:bg-night-3 hover:bg-[#E3DAFB] dark:hover:bg-night-2 text-brand dark:text-violet-200 font-bold px-5 py-3 text-[15px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50';

export const useTheme = () => {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    useEffect(() => {
        const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
        window.addEventListener('theme-change', sync);
        return () => window.removeEventListener('theme-change', sync);
    }, []);
    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
        try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
        window.dispatchEvent(new Event('theme-change'));
    };
    return { isDark, toggle };
};

export const ThemeButton: React.FC = () => {
    const { isDark, toggle } = useTheme();
    return (
        <button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="press w-11 h-11 inline-flex items-center justify-center rounded-[14px] bg-white dark:bg-night-2 text-[#6B6680] dark:text-slate-300 hover:text-brand transition-colors"
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
};

export const Logo: React.FC<{ to?: string; className?: string }> = ({ to = '/', className = 'h-10' }) => (
    <Link to={to} aria-label="Welile School of AI home" className="flex items-center">
        <img src="/schoolofai-logo.png" alt="Welile School of AI" className={`${className} w-auto object-contain`} />
    </Link>
);

export const ProgressRing: React.FC<{ pct: number; size?: number; stroke?: number }> = ({ pct, size = 56, stroke = 6 }) => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${pct}% complete`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-brand-soft dark:stroke-night-3" />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
                className="stroke-brand dark:stroke-violet-400 transition-all duration-500"
                strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-ink dark:fill-slate-100 text-[13px] font-extrabold">{pct}%</text>
        </svg>
    );
};

export const formatEAT = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
    new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Kampala', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, ...opts });

export const formatLocal = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export interface PlayerPrefs { dataSaver: boolean; audioOnly: boolean; }
const PREFS_KEY = 'welile_learn_player_prefs';
const readPrefs = (): PlayerPrefs => {
    try {
        const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
        return { dataSaver: !!raw.dataSaver, audioOnly: !!raw.audioOnly };
    } catch { return { dataSaver: false, audioOnly: false }; }
};

/** Data-saver / audio-only preferences, remembered on this device. */
export const usePlayerPrefs = () => {
    const [prefs, setPrefs] = useState<PlayerPrefs>(readPrefs);
    const update = (patch: Partial<PlayerPrefs>) => {
        setPrefs(prev => {
            const next = { ...prev, ...patch };
            try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };
    return { prefs, update };
};
