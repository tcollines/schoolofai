import React, { useEffect, useState } from 'react';
import { ProgressMap, loadProgress } from '../../src/lib/learnApi';

/** Shared bits for the phone screens (drawn on the "Phone ·" canvas boards). */

export const BASE = '/learn/ai-fundamentals';

/** True below the desktop breakpoint (1024px), where the phone screens are used. */
export const usePhone = () => {
    const q = '(max-width: 1023px)';
    const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
    useEffect(() => {
        const m = window.matchMedia(q);
        const on = () => setPhone(m.matches);
        m.addEventListener('change', on);
        return () => m.removeEventListener('change', on);
    }, []);
    return phone;
};

/** Phone screen on small screens, the existing page on computers. */
export const PhoneOr: React.FC<{ phone: React.ReactNode; children: React.ReactNode }> = ({ phone, children }) =>
    <>{usePhone() ? phone : children}</>;

/** Full progress map for the free course; refreshes when a lesson is completed. */
export const useProgressMap = (uid?: string) => {
    const [progress, setProgress] = useState<ProgressMap>({});
    useEffect(() => {
        if (!uid || uid === 'guest') return;
        const load = () => { void loadProgress(uid).then(setProgress); };
        load();
        window.addEventListener('learn-progress-update', load);
        return () => window.removeEventListener('learn-progress-update', load);
    }, [uid]);
    return progress;
};

/** Days in a row with a completed item, ending today or yesterday. */
export const streakOf = (progress: ProgressMap) => {
    const days = new Set(Object.values(progress).map(p => (p?.completedAt ? new Date(p.completedAt).toDateString() : '')).filter(Boolean));
    let n = 0; const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
    return n;
};

export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export const initialsOf = (name?: string) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const avatarOf = (user: any): string => {
    const uid = user?.id;
    const saved = uid ? localStorage.getItem(`user-avatar-${uid}`) : null;
    const a = saved || user?.avatar || '';
    return a && !String(a).includes('placeholder') ? a : '';
};

export const Avatar: React.FC<{ user: any; size: number; text: number }> = ({ user, size, text }) => {
    const [bad, setBad] = useState(false);
    const src = avatarOf(user);
    if (src && !bad) return <img src={src} alt="" onError={() => setBad(true)} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
    return (
        <span aria-hidden="true" className="rounded-full bg-brand text-white inline-flex items-center justify-center font-extrabold shrink-0" style={{ width: size, height: size, fontSize: text }}>
            {initialsOf(user?.name)}
        </span>
    );
};

/** The page frame every phone tab uses: 20px sides, room at the bottom for the tab bar. */
export const PhonePage: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 16 }) => (
    <div className="lg:hidden min-h-[100dvh] bg-panel dark:bg-night text-ink dark:text-white px-5 pt-[max(24px,calc(env(safe-area-inset-top)+16px))] pb-[120px] grid grid-cols-[minmax(0,1fr)] content-start auto-rows-max"
        style={{ gap, fontFamily: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {children}
    </div>
);

export const PageTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.03em]">{children}</h1>
);

/** iOS-style switch, the one drawn on the Me board. */
export const Toggle: React.FC<{ on: boolean; onChange: () => void; label: string }> = ({ on, onChange, label }) => (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange}
        className={`relative shrink-0 w-[51px] h-[31px] rounded-full border-0 p-0 cursor-pointer transition-colors ${on ? 'bg-brand' : 'bg-[#DCD7EA] dark:bg-night-3'}`}>
        <span className="absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-[left] duration-200" style={{ left: on ? 22 : 2 }} />
    </button>
);

/** Small progress ring used on the Home tiles. */
export const Ring: React.FC<{ pct: number; color: string; track: string; label: React.ReactNode }> = ({ pct, color, track, label }) => {
    const c = 2 * Math.PI * 20;
    return (
        <div className="relative w-[50px] h-[50px] shrink-0">
            <svg width="50" height="50" viewBox="0 0 50 50" aria-hidden="true">
                <circle cx="25" cy="25" r="20" fill="none" stroke={track} strokeWidth="5" />
                <circle cx="25" cy="25" r="20" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, pct)))} transform="rotate(-90 25 25)" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold">{label}</span>
        </div>
    );
};

const sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const Ico = {
    bell: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>,
    play: (s = 13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>,
    chevron: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} strokeWidth={2} aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>,
    check: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} strokeWidth={2.6} aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>,
    search: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} strokeWidth={2} aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
    video: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><rect x="2" y="6" width="14" height="12" rx="3" /><path d="m16 10 6-3v10l-6-3" /></svg>,
    calendar: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
    whatsapp: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3z" /><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.2 2 1-1 1.7c-3 .3-7.4-4-7.2-7.2L10.2 7l1 2z" /></svg>,
    book: (s = 26) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></svg>,
    award: (s = 26) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" /></svg>,
    shield: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>,
    download: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} strokeWidth={2} aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>,
    share: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} strokeWidth={2} aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>,
    users: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3" /></svg>,
    code: (s = 30) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} strokeWidth={2} aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></svg>,
    saver: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><path d="M12 3c4 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2-6 6-10z" /></svg>,
    headphones: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><path d="M3 14v-2a9 9 0 0 1 18 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg>,
    megaphone: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><path d="M3 11v3a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M17 9a4 4 0 0 1 0 6" /></svg>,
    handshake: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...sv} aria-hidden="true"><path d="m11 17 2 2a1.4 1.4 0 0 0 2-2" /><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2L15 11l-1.5 1.5a2 2 0 0 1-3-3L13 7l-1-1-5 5 3 3" /><path d="m21 11-4-4-2 2M3 11l4-4" /></svg>,
};
