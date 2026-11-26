import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Building2, ClipboardCheck, ConciergeBell, GraduationCap, Handshake, PencilRuler, Shield, X } from 'lucide-react';
import { DashboardId, DashboardOption, rememberDashboard, useMyDashboards } from '../../src/lib/roles';

/**
 * One switch control for every dashboard. It shows nothing unless the person holds two or more dashboards.
 * Tap it, pick where to go, done: phones get a bottom sheet, wide screens a centred panel.
 *   variant 'icon' : round icon button (headers)
 *   variant 'pill' : "Switch" with the current dashboard name (headers with room)
 *   variant 'row'  : a full-width menu row (sidebars and account screens); `compact` shows only the icon
 */
export interface DashboardSwitcherProps {
    current: DashboardId;
    variant?: 'icon' | 'pill' | 'row';
    compact?: boolean;
    className?: string;
}

const ICONS: Record<DashboardId, React.ElementType> = {
    student: GraduationCap,
    agent: Handshake,
    supervision: ClipboardCheck,
    admin: Shield,
    frontdesk: ConciergeBell,
    instructor: PencilRuler,
    corporate: Building2,
};

const TONES: Record<DashboardId, string> = {
    student: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    agent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    supervision: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    admin: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    frontdesk: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    instructor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    corporate: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
};

const DashboardSwitcher: React.FC<DashboardSwitcherProps> = ({ current, variant = 'icon', compact = false, className = '' }) => {
    const { dashboards, loading } = useMyDashboards();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => {
        setOpen(false);
        // give focus back to the button that opened the sheet
        window.setTimeout(() => triggerRef.current?.focus(), 0);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // move focus into the sheet: first row you can open, else the sheet itself
        window.setTimeout(() => {
            const first = sheetRef.current?.querySelector<HTMLElement>('button[data-pick]:not([disabled])');
            (first || sheetRef.current)?.focus();
        }, 0);
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
    }, [open, close]);

    if (loading || dashboards.length < 2) return null;

    const here = dashboards.find(d => d.id === current);
    const pick = (d: DashboardOption) => {
        rememberDashboard(d.id);
        setOpen(false);
        if (d.external) window.location.assign(d.href);
        else navigate(d.href);
    };

    const iconBtn = 'press w-11 h-11 rounded-[14px] bg-white dark:bg-night-2 text-ink dark:text-white inline-flex items-center justify-center border-0 cursor-pointer shrink-0';
    const pillBtn = 'press h-11 px-3 rounded-[14px] bg-white dark:bg-night-2 text-ink dark:text-white inline-flex items-center gap-2 border-0 cursor-pointer shrink-0';
    const rowBtn = compact
        ? 'press w-12 min-h-[46px] mx-auto rounded-[14px] inline-flex items-center justify-center border-0 bg-transparent text-stone-700 dark:text-slate-300 hover:bg-[#F7F5FD] dark:hover:bg-night-3 cursor-pointer'
        : 'press w-full min-h-[46px] px-3 rounded-[14px] flex items-center gap-3 border-0 bg-transparent text-left text-stone-700 dark:text-slate-300 hover:bg-[#F7F5FD] dark:hover:bg-night-3 cursor-pointer';

    const trigger = (
        <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={here ? `Switch dashboard. You are on ${here.label}` : 'Switch dashboard'}
            title="Switch dashboard"
            className={`${variant === 'icon' ? iconBtn : variant === 'pill' ? pillBtn : rowBtn} ${className}`}
        >
            <ArrowLeftRight size={variant === 'row' ? 22 : 18} strokeWidth={variant === 'row' ? 1.9 : 2} className={variant === 'row' ? 'shrink-0 text-[#8A85A0]' : 'shrink-0'} />
            {variant === 'pill' && (
                <>
                    <span className="text-[13px] font-bold">Switch</span>
                    {here && <span className="hidden sm:inline text-[12px] font-semibold text-[#6B6680] dark:text-slate-400">· {here.label}</span>}
                </>
            )}
            {variant === 'row' && !compact && (
                <>
                    <span className="flex-1 min-w-0 text-[14px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">Switch dashboard</span>
                    {here && <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-night-3 text-stone-600 dark:text-slate-300 text-[11px] font-extrabold">{here.label}</span>}
                </>
            )}
        </button>
    );

    const sheet = open && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[80] flex items-end lg:items-center justify-center" role="presentation">
            <div className="absolute inset-0 bg-night/50 backdrop-blur-sm" onClick={close} aria-hidden="true" />
            <div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-label="Switch dashboard"
                tabIndex={-1}
                className="relative w-full lg:max-w-md bg-white dark:bg-night-2 text-ink dark:text-white rounded-t-[28px] lg:rounded-[28px] shadow-2xl outline-none px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] lg:p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200"
            >
                <div className="lg:hidden mx-auto mb-2 h-1.5 w-10 rounded-full bg-stone-200 dark:bg-night-3" aria-hidden="true" />
                <div className="flex items-center justify-between gap-3 px-1 pb-2">
                    <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.01em]">Switch dashboard</h2>
                    <button type="button" onClick={close} aria-label="Close" className="press w-11 h-11 rounded-[14px] bg-panel dark:bg-night-3 text-ink dark:text-white inline-flex items-center justify-center border-0 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <ul className="m-0 p-0 list-none flex flex-col gap-2">
                    {dashboards.map(d => {
                        const Icon = ICONS[d.id];
                        const isHere = d.id === current;
                        return (
                            <li key={d.id}>
                                <button
                                    type="button"
                                    data-pick
                                    disabled={isHere}
                                    aria-current={isHere ? 'page' : undefined}
                                    onClick={() => pick(d)}
                                    className={`press w-full min-h-[64px] px-3.5 rounded-[18px] flex items-center gap-3.5 text-left border-0 ${isHere
                                        ? 'bg-brand-soft dark:bg-night-3 cursor-default'
                                        : 'bg-panel dark:bg-night-3 hover:bg-[#F1EEFB] dark:hover:bg-night cursor-pointer'}`}
                                >
                                    <span className={`shrink-0 w-11 h-11 rounded-[14px] inline-flex items-center justify-center ${TONES[d.id]}`}><Icon size={22} /></span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-[16px] font-extrabold leading-tight">{d.label}</span>
                                        <span className="block text-[13px] leading-snug text-[#6B6680] dark:text-slate-400">{d.hint}</span>
                                    </span>
                                    {isHere && <span className="shrink-0 px-2.5 py-1 rounded-full bg-brand text-white text-[11px] font-extrabold">You are here</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <div className="pt-3 text-center">
                    <Link to="/portal" onClick={() => { rememberDashboard(current); setOpen(false); }} className="inline-flex items-center justify-center min-h-[44px] px-4 text-[13px] font-bold text-brand dark:text-violet-300 no-underline">
                        See all dashboards
                    </Link>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            {trigger}
            {sheet}
        </>
    );
};

export default DashboardSwitcher;
