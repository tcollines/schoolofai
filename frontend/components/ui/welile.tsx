import React from 'react';

/**
 * Shared building blocks for the Welile redesign: lavender panel, white rounded cards,
 * purple banners with soft circles, lime accents, progress rings and segmented controls.
 */

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/** White rounded card. */
export const Card: React.FC<React.HTMLAttributes<HTMLElement> & { as?: any; pad?: 'none' | 'sm' | 'md' | 'lg' }> = ({ as: Tag = 'section', pad = 'md', className, children, ...rest }) => (
    <Tag
        className={cx(
            'bg-white dark:bg-night-2 rounded-[22px]',
            pad === 'sm' && 'p-4', pad === 'md' && 'p-5 sm:p-[22px]', pad === 'lg' && 'p-6 sm:p-7',
            className
        )}
        {...rest}
    >
        {children}
    </Tag>
);

/** Purple hero banner with the soft decorative circles from the design. */
export const Banner: React.FC<{ className?: string; tone?: 'purple' | 'night' | 'lime'; children: React.ReactNode; ariaLabel?: string }> = ({ className, tone = 'purple', children, ariaLabel }) => {
    const bg = tone === 'purple' ? 'bg-brand text-white' : tone === 'night' ? 'bg-night text-white' : 'bg-lime-200 text-night';
    const circle = tone === 'purple' ? 'bg-brand-mid' : tone === 'night' ? 'bg-night-2' : 'bg-lime-300';
    return (
        <section aria-label={ariaLabel} className={cx('relative overflow-hidden rounded-[24px]', bg, className)}>
            <span aria-hidden="true" className={cx('pointer-events-none absolute -right-16 -top-20 w-[280px] h-[280px] rounded-full', circle)} />
            <span aria-hidden="true" className={cx('pointer-events-none absolute right-32 -bottom-28 w-[220px] h-[220px] rounded-full opacity-70', circle)} />
            <div className="relative">{children}</div>
        </section>
    );
};

/** Small uppercase eyebrow label. */
export const Eyebrow: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
    <p className={cx('m-0 text-[12px] font-extrabold tracking-[0.12em] uppercase', className ?? 'text-brand dark:text-violet-300')}>{children}</p>
);

/** Progress ring. */
export const Ring: React.FC<{ pct: number; size?: number; stroke?: number; track?: string; color?: string; label?: React.ReactNode; sub?: React.ReactNode; className?: string }> = ({ pct, size = 62, stroke = 6, track = '#EEE8FD', color = '#5B2BC4', label, sub, className }) => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(100, pct));
    return (
        <div className={cx('relative shrink-0', className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(p)}% complete`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={c - (p / 100) * c} transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.32,0.72,0,1)' }} />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="font-extrabold tracking-tight" style={{ fontSize: Math.max(12, size * 0.24) }}>{label ?? `${Math.round(p)}%`}</span>
                {sub && <span className="text-[10px] text-stone-600 dark:text-slate-300 mt-0.5">{sub}</span>}
            </span>
        </div>
    );
};

/** Thin progress bar. */
export const Bar: React.FC<{ pct: number; className?: string; color?: string; track?: string; label?: string }> = ({ pct, className, color = 'bg-brand', track = 'bg-[#EEEBF6] dark:bg-night-3', label = 'Progress' }) => (
    <div className={cx('h-[6px] rounded-full overflow-hidden', track, className)} role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={cx('h-full rounded-full', color)} style={{ width: `${Math.max(0, Math.min(100, pct))}%`, transition: 'width 600ms cubic-bezier(0.32,0.72,0,1)' }} />
    </div>
);

/** iOS-style segmented control. */
export function Segmented<T extends string>({ options, value, onChange, label, dark, size = 'md', className }: {
    options: { value: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void; label: string; dark?: boolean; size?: 'sm' | 'md'; className?: string;
}) {
    return (
        <div role="radiogroup" aria-label={label} className={cx('inline-flex p-1 gap-0.5 rounded-[14px]', dark ? 'bg-night-3' : 'bg-[#EAE6F5] dark:bg-night-3', className)}>
            {options.map(o => {
                const on = o.value === value;
                return (
                    <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
                        className={cx('press rounded-[10px] font-semibold whitespace-nowrap',
                            size === 'sm' ? 'h-8 px-3 text-[12px]' : 'h-9 px-3.5 text-[13px]',
                            on ? (dark ? 'bg-lime-200 text-night font-extrabold' : 'bg-white dark:bg-night-2 text-ink dark:text-white font-bold shadow-[0_1px_3px_rgba(30,27,46,0.12)]')
                               : (dark ? 'text-slate-300' : 'text-stone-600 dark:text-slate-300'))}>
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Initials avatar. */
export const Initials: React.FC<{ name?: string; size?: number; className?: string }> = ({ name = '', size = 40, className }) => {
    const ini = name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
    return (
        <span aria-hidden="true" className={cx('shrink-0 rounded-full bg-brand text-white font-extrabold inline-flex items-center justify-center', className)}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}>{ini}</span>
    );
};

/** Coloured square icon tile. */
export const IconTile: React.FC<{ tone?: 'brand' | 'lime' | 'mint' | 'amber' | 'grey' | 'solid' | 'night'; size?: number; className?: string; children: React.ReactNode }> = ({ tone = 'brand', size = 42, className, children }) => {
    const t = {
        brand: 'bg-brand-soft text-brand dark:bg-night-3 dark:text-violet-300',
        lime: 'bg-lime-100 text-lime-800',
        mint: 'bg-mint-soft text-mint',
        amber: 'bg-[#FFF4CC] text-[#7A5A00]',
        grey: 'bg-stone-100 text-stone-600 dark:bg-night-3 dark:text-slate-300',
        solid: 'bg-brand text-white',
        night: 'bg-night-3 text-lime-200',
    }[tone];
    return <span className={cx('shrink-0 inline-flex items-center justify-center rounded-xl', t, className)} style={{ width: size, height: size }}>{children}</span>;
};

/** Small rounded tag. */
export const Tag: React.FC<{ tone?: 'brand' | 'lime' | 'mint' | 'amber' | 'grey' | 'red' | 'solid'; className?: string; children: React.ReactNode }> = ({ tone = 'brand', className, children }) => {
    const t = {
        brand: 'bg-brand-soft text-brand dark:bg-night-3 dark:text-violet-300',
        lime: 'bg-lime-100 text-lime-800',
        mint: 'bg-mint-soft text-mint-ink',
        amber: 'bg-[#FFF4CC] text-[#5C4400]',
        grey: 'bg-stone-100 text-stone-600 dark:bg-night-3 dark:text-slate-300',
        red: 'bg-[#FDECE8] text-[#9A2B14]',
        solid: 'bg-brand text-white',
    }[tone];
    return <span className={cx('inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md text-[11px] font-extrabold uppercase tracking-[0.02em]', t, className)}>{children}</span>;
};

/** Section heading row with optional action. */
export const SectionTitle: React.FC<{ id?: string; title: React.ReactNode; action?: React.ReactNode; className?: string }> = ({ id, title, action, className }) => (
    <div className={cx('flex items-baseline justify-between gap-3 mb-3', className)}>
        <h2 id={id} className="m-0 text-[18px] font-bold tracking-[-0.01em]">{title}</h2>
        {action}
    </div>
);

/** Primary / secondary button class names. */
export const BTN = {
    primary: 'press inline-flex items-center justify-center gap-2 rounded-[14px] bg-brand hover:bg-violet-800 text-white font-bold px-6 h-12 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'press inline-flex items-center justify-center gap-2 rounded-[14px] bg-white dark:bg-night-2 text-ink dark:text-white font-bold px-5 h-12 text-[15px] shadow-[0_1px_3px_rgba(30,27,46,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50',
    soft: 'press inline-flex items-center justify-center gap-2 rounded-[14px] bg-stone-100 dark:bg-night-3 text-ink dark:text-white font-bold px-5 h-12 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50',
    lime: 'press inline-flex items-center justify-center gap-2 rounded-[14px] bg-lime-200 text-night font-extrabold px-6 h-12 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 disabled:opacity-50',
    pillWhite: 'press inline-flex items-center gap-2.5 h-11 pl-[18px] pr-1.5 rounded-full bg-white text-brand text-[14px] font-bold',
};

/** Field styles for forms. */
export const FIELD = {
    label: 'flex flex-col gap-1.5 text-[13px] font-bold',
    input: 'h-[50px] w-full px-4 rounded-[14px] border-0 bg-panel dark:bg-night-3 text-[15px] font-medium text-ink dark:text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand',
    inputWhite: 'h-[50px] w-full px-4 rounded-[14px] border-0 bg-white dark:bg-night-3 text-[15px] font-medium text-ink dark:text-white placeholder:text-stone-500 shadow-[0_1px_3px_rgba(30,27,46,0.08)] focus:outline-none focus:ring-2 focus:ring-brand',
};

/** The Welile orb as a static, breathing character (used where WebGL is not needed). */
export const MiniOrb: React.FC<{ size?: number; className?: string }> = ({ size = 64, className }) => (
    <div aria-hidden="true" className={cx('breathe relative shrink-0 rounded-full', className)}
        style={{ width: size, height: size, background: 'radial-gradient(circle at 35% 30%, #9C43FE, #4CC2E9 60%, #101499 100%)', boxShadow: '0 0 34px rgba(156,67,254,0.55)' }}>
        <span className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 flex" style={{ gap: size * 0.18 }}>
            <span className="orb-eye xs" style={{ width: size * 0.15, height: size * 0.25 }} />
            <span className="orb-eye xs" style={{ width: size * 0.15, height: size * 0.25 }} />
        </span>
    </div>
);
