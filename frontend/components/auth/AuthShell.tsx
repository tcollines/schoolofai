import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import LandingOrb from '../landing/LandingOrb';

/**
 * Shared two-panel frame for sign in, sign up and password screens.
 * On laptops and desktops the whole frame fits the screen height: the orb shrinks with the
 * window, and only the form panel scrolls if a window is unusually short.
 */
export const AuthShell: React.FC<{ isDark: boolean; onToggleTheme: () => void; children: React.ReactNode }> = ({ isDark, onToggleTheme, children }) => (
    <div className="min-h-[100dvh] lg:h-[100dvh] bg-panel dark:bg-night text-ink dark:text-white p-3 sm:p-4 flex">
        <div className="w-full max-w-[1240px] mx-auto flex flex-col lg:flex-row gap-3 sm:gap-4 lg:min-h-0">
            {/* brand panel */}
            <aside className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-night text-white lg:w-[44%] p-6 lg:p-8 flex flex-col lg:min-h-0">
                <span aria-hidden="true" className="absolute -left-24 -bottom-40 w-[380px] h-[380px] rounded-full bg-night-2" />
                <div className="relative flex items-center justify-between gap-3 shrink-0">
                    <Link to="/" className="inline-flex items-center gap-2.5 no-underline text-white">
                        <span className="w-10 h-10 rounded-[12px] bg-lime-200 text-night inline-flex items-center justify-center text-[18px] font-extrabold">W</span>
                        <span className="text-[16px] font-extrabold tracking-[-0.01em]">Welile School of AI</span>
                    </Link>
                    <Link to="/" className="press lg:hidden h-10 px-3 rounded-[12px] bg-night-3 text-[13px] font-bold inline-flex items-center gap-1.5 no-underline text-white"><ArrowLeft size={15} />Home</Link>
                </div>
                {/* the orb takes whatever height is left, and stays square */}
                <div className="relative hidden lg:block flex-1 min-h-[120px]">
                    <div className="absolute inset-0 py-3 flex items-center justify-center">
                        <div className="h-full max-h-[320px] aspect-square">
                            <LandingOrb size="md" showBadges={false} />
                        </div>
                    </div>
                </div>
                <div className="relative mt-4 lg:mt-0 shrink-0">
                    <h1 className="m-0 text-[26px] sm:text-[32px] xl:text-[36px] leading-[1.08] font-extrabold tracking-[-0.03em]">Learn to use AI <span className="text-lime-200">with confidence.</span></h1>
                    <p className="mt-2.5 mb-0 text-[14px] leading-relaxed text-[#CFC8DC] max-w-[440px]">A free course in plain language, with live classes three times a week and a certificate at the end.</p>
                    <ul className="hidden sm:flex [@media(max-height:700px)]:hidden mt-4 p-0 list-none flex-wrap gap-2">
                        {['About 6 hours', 'Free certificate', 'Works on low data'].map(t => (
                            <li key={t} className="px-3 py-2 rounded-[12px] bg-night-3 text-[13px] font-semibold text-[#E6E1EE]">{t}</li>
                        ))}
                    </ul>
                </div>
            </aside>

            {/* form panel */}
            <main className="relative flex-1 rounded-[28px] sm:rounded-[32px] bg-white dark:bg-night-2 flex flex-col lg:min-h-0 lg:overflow-y-auto no-scrollbar">
                <div className="absolute top-4 inset-x-4 sm:top-5 sm:inset-x-5 flex items-center justify-between z-10">
                    <Link to="/" className="press hidden lg:inline-flex h-10 px-3.5 rounded-[12px] bg-panel dark:bg-night-3 text-[13px] font-bold items-center gap-2 no-underline text-ink dark:text-white"><ArrowLeft size={15} />Back to home</Link>
                    <span className="lg:hidden" />
                    <button type="button" onClick={onToggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} className="press w-10 h-10 rounded-[12px] bg-panel dark:bg-night-3 inline-flex items-center justify-center text-[#6B6680] dark:text-slate-300">
                        {isDark ? <Sun size={17} /> : <Moon size={17} />}
                    </button>
                </div>
                <div className="w-full max-w-[440px] mx-auto my-auto px-6 sm:px-8 pt-16 pb-6 lg:pt-[72px] lg:pb-4 [@media(max-height:700px)]:lg:pt-14">{children}</div>
            </main>
        </div>
    </div>
);

export const AUTH = {
    label: 'block text-[13px] font-bold mb-1',
    input: 'w-full h-12 [@media(max-height:700px)]:h-11 px-4 rounded-[14px] bg-panel dark:bg-night-3 border-2 border-transparent text-[15px] text-ink dark:text-white placeholder-[#9A94AE] outline-none focus:border-brand transition-colors',
    primary: 'press w-full h-12 [@media(max-height:700px)]:h-11 rounded-[14px] bg-brand hover:bg-brand-mid text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
    secondary: 'press w-full h-12 [@media(max-height:700px)]:h-11 rounded-[14px] bg-panel dark:bg-night-3 text-ink dark:text-white text-[15px] font-bold inline-flex items-center justify-center gap-2.5',
    link: 'text-[13px] font-bold text-brand dark:text-violet-300 hover:underline cursor-pointer',
    error: 'rounded-[14px] bg-[#FDECE8] dark:bg-red-950/30 text-[#A3321F] dark:text-red-300 p-3.5 text-[14px]',
};

export const GoogleIcon: React.FC = () => (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

export const OrDivider: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex items-center gap-3 my-3" role="separator">
        <span className="flex-1 h-px bg-[#EEEBF6] dark:bg-night-3" />
        <span className="text-[12px] font-bold text-[#9A94AE]">{label}</span>
        <span className="flex-1 h-px bg-[#EEEBF6] dark:bg-night-3" />
    </div>
);
