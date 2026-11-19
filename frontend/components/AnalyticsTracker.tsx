import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    classifyExternalUrl,
    trackAppLaunchOnce,
    trackCtaClick,
    trackOutboundClick,
    trackPageView,
} from '../src/lib/analytics';

/**
 * Invisible global analytics tracker mounted inside BrowserRouter:
 * - Tracks every SPA page view (website & installed PWA app)
 * - Tracks installed PWA app launches (even before login)
 * - Automatically captures EVERY outbound link click (including Welile Technologies / welile.com,
 *   WhatsApp, Google Calendar, Google Meet, and partner links)
 * - Captures high-signal internal CTAs (Free Course, Sign Up, Register, Plans, Staff/Agent links)
 */
const AnalyticsTracker: React.FC = () => {
    const location = useLocation();
    const lastPathRef = useRef<string>('');

    useEffect(() => {
        trackAppLaunchOnce();
    }, []);

    useEffect(() => {
        const path = location.pathname || '/';
        if (lastPathRef.current === path) return;
        lastPathRef.current = path;
        // Skip /live/join/:id since LiveJoinRedirect records its own live_join_click event
        if (path.startsWith('/live/join/')) return;
        trackPageView(path);
    }, [location.pathname]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // 1. Explicit data-track attribute on any clickable element
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
