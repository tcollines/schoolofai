import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';

/** Shared bits for the free-course pages: calm, editorial look (warm paper, ink, one violet accent). */

export const PAPER = 'bg-[#faf8f5] dark:bg-slate-950';
export const INK = 'text-[#1c1917] dark:text-slate-100';
export const MUTED = 'text-stone-600 dark:text-slate-400';
export const CARD = 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800';
export const BTN_PRIMARY =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-semibold px-6 py-3.5 text-[15px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
export const BTN_SECONDARY =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 text-[#1c1917] dark:text-slate-100 font-semibold px-5 py-3 text-[15px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50';

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
            className="p-2.5 rounded-full text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
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
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-stone-200 dark:stroke-slate-800" />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
                className="stroke-violet-700 dark:stroke-violet-400 transition-all duration-500"
                strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-[#1c1917] dark:fill-slate-100 text-[13px] font-bold">{pct}%</text>
        </svg>
    );
};

export const formatEAT = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
    new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Kampala', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, ...opts });

export const formatLocal = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
