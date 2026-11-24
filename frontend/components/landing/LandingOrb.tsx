import React, { useCallback, useRef, useState } from 'react';
import Orb from '../Orb';

/**
 * Welile's orb character: the WebGL orb with a face.
 * Calm by default; when someone points at it (mouse or touch) it gets wobbly and its eyes jitter.
 */
const LandingOrb: React.FC<{ size?: 'lg' | 'md'; className?: string; showBadges?: boolean; showSays?: boolean }> = ({ size = 'lg', className = '', showBadges = true, showSays = true }) => {
    const [unstable, setUnstable] = useState(false);
    const timer = useRef<number | undefined>(undefined);
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const wobble = useCallback(() => { window.clearTimeout(timer.current); setUnstable(true); }, []);
    const calm = useCallback(() => { window.clearTimeout(timer.current); setUnstable(false); }, []);
    const tap = useCallback(() => {
        setUnstable(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setUnstable(false), 1600);
    }, []);

    const eye = size === 'lg' ? 'orb-eye' : 'orb-eye sm';
    return (
        <div className={`relative w-full aspect-square ${className}`}>
            {/* soft fallback so there is always something to see while WebGL starts (or if it can't) */}
            <div aria-hidden="true" className="absolute inset-[14%] rounded-full blur-2xl opacity-70" style={{ background: 'radial-gradient(circle at 40% 35%, #9C7BFF 0%, #5B2BC4 45%, #2A1A5E 75%, transparent 100%)' }} />
            <div
                className="absolute inset-0 cursor-pointer rounded-full overflow-hidden"
                role="img"
                aria-label="Welile's orb, an animated character. It floats calmly and gets wobbly when you point at it."
                onPointerEnter={e => { if (e.pointerType === 'mouse') wobble(); }}
                onPointerLeave={e => { if (e.pointerType === 'mouse') calm(); }}
                onPointerDown={e => { if (e.pointerType !== 'mouse') tap(); }}
            >
                <Orb hue={0} hoverIntensity={unstable && !reduced ? 0.9 : 0.25} rotateOnHover={!reduced} forceHoverState={unstable && !reduced} backgroundColor="#16122B" />
            </div>
            <div aria-hidden="true" className={`pointer-events-none absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 flex ${size === 'lg' ? 'gap-14' : 'gap-8'}`}>
                <span className={`${eye}${unstable ? ' wild' : ''}`} /><span className={`${eye}${unstable ? ' wild' : ''}`} />
            </div>
            {showBadges && (
                <>
                    <span className="floaty absolute left-0 top-[18%] inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[16px] bg-white text-ink text-[13px] font-extrabold shadow-[0_14px_30px_rgba(0,0,0,0.25)]">
                        <span className="w-2 h-2 rounded-full bg-[#F0533A]" aria-hidden="true" />Live Wed · Fri, 2 pm EAT
                    </span>
                    <span className="floaty absolute right-0 bottom-[20%] px-3.5 py-2.5 rounded-[16px] bg-lime-200 text-night text-[13px] font-extrabold shadow-[0_14px_30px_rgba(0,0,0,0.25)]" style={{ animationDelay: '-3s' }}>
                        Free certificate
                    </span>
                </>
            )}
            {showSays && <span aria-live="polite" className="absolute left-1/2 bottom-[2%] -translate-x-1/2 px-3.5 py-2 rounded-full bg-night-3 text-[#E6E1EE] text-[13px] font-bold whitespace-nowrap">
                {unstable ? 'Whoa, steady! I am a bit wobbly' : 'Hi! Point at me'}
            </span>}
        </div>
    );
};

export default LandingOrb;
