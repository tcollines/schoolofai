import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    classifyExternalUrl,
    trackAppLaunch,
    trackCtaClick,
    trackOutboundClick,
    trackPageView,
} from '../src/lib/analytics';

/**
 * Global analytics tracker mounted inside BrowserRouter:
 * - Counts EVERY page load & SPA route visit (including repeat visits by the same person!)
 * - Counts return visits whenever a user returns to the tab or reopens the installed PWA app after >= 60s away
 * - Automatically captures EVERY outbound link click (including Welile Technologies / welile.com,
 *   WhatsApp, Google Calendar, Google Meet, and partner links) with fetch keepalive
 * - Captures high-signal internal CTAs (Free Course, Sign Up, Register, Plans, etc.)
 */
const AnalyticsTracker: React.FC = () => {
    const location = useLocation();
    const lastPathRef = useRef<string>('');
    const hiddenAtRef = useRef<number | null>(null);

    // Count initial launch of installed PWA app (every time the app is opened freshly)
    useEffect(() => {
        trackAppLaunch(true);
    }, []);

    // Track every route navigation and initial page load
    useEffect(() => {
        const path = location.pathname || '/';
        if (lastPathRef.current === path) return;
        const isFirstLoad = lastPathRef.current === '';
        lastPathRef.current = path;
        if (path.startsWith('/live/join/')) return;
        trackPageView(path, { forceNewSession: isFirstLoad });
    }, [location.pathname]);

    // Track return visits when user comes back to the tab or installed app after being away (>= 60s)
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') {
                hiddenAtRef.current = Date.now();
            } else if (document.visibilityState === 'visible' && hiddenAtRef.current) {
                const awayMs = Date.now() - hiddenAtRef.current;
                hiddenAtRef.current = null;
                if (awayMs >= 60 * 1000) {
                    const path = window.location.pathname || '/';
                    if (!path.startsWith('/live/join/')) {
                        trackPageView(path, { returnVisit: true, forceNewSession: true });
                        trackAppLaunch(false);
                    }
                }
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    // Global capture listener for outbound links & key CTAs
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // 1. Explicit data-track attribute
            const trackedEl = target.closest<HTMLElement>('[data-track]');
            if (trackedEl) {
                const label = trackedEl.getAttribute('data-track') || 'Action';
                const category = trackedEl.getAttribute('data-track-category') || 'cta';
                const href = trackedEl.getAttribute('href') || undefined;
                if (href && /^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
                    trackOutboundClick(href, label, category);
                } else {
                    trackCtaClick(label, category, href);
                }
                return;
            }

            // 2. Any anchor click
            const anchor = target.closest<HTMLAnchorElement>('a[href]');
            if (!anchor) return;
            const href = anchor.getAttribute('href') || '';
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

            const text = (anchor.textContent || anchor.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80);

            // Outbound external link (welile.com, wa.me, meet.google.com, calendar.google.com, etc.)
            if (/^https?:\/\//i.test(href)) {
                try {
                    const url = new URL(href);
                    if (url.origin !== window.location.origin) {
                        const forcedCat = anchor.getAttribute('data-track-category') || undefined;
                        const classified = classifyExternalUrl(href, text);
                        trackOutboundClick(href, classified.label, forcedCat || classified.category);
                        return;
                    }
                } catch {
                    return;
                }
            }

            // Key internal CTAs
            if (href === '/free/ai-fundamentals' || href.startsWith('/free/')) {
                trackCtaClick(text || 'Open Free Course', 'cta', href);
            } else if (href === '/register' || href.startsWith('/register?')) {
                trackCtaClick(text || 'Official Registration Form', 'cta', href);
            } else if (href === '/signup' || href.startsWith('/join/')) {
                trackCtaClick(text || 'Sign Up CTA', 'cta', href);
            } else if (href === '/plans') {
                trackCtaClick(text || 'View Plans', 'cta', href);
            }
        };

        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, []);

    return null;
};

export default AnalyticsTracker;
