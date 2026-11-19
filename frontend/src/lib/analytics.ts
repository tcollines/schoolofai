import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured, supabase } from './supabaseClient';
import { isStandalone } from './pwa';

const VISITOR_KEY = 'welile_visitor_id_v1';
const SESSION_KEY = 'welile_session_id_v1';
const SESSION_TS_KEY = 'welile_session_ts_v1';
const SESSION_IDLE_MS = 30 * 60 * 1000; // 30 minutes idle starts a new visit session

const randomId = (prefix: string) => {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return `${prefix}_${crypto.randomUUID()}`;
        }
    } catch { /* ignore */ }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export function getVisitorId(): string {
    try {
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = randomId('v');
            localStorage.setItem(VISITOR_KEY, id);
        }
        return id;
    } catch {
        return randomId('v');
    }
}

/**
 * Returns the active visit session ID. Creates a new visit ID whenever:
 * - A fresh tab/window opens, OR
 * - More than 30 minutes elapsed since last activity, OR
 * - forceNew is true (e.g. returning to the tab/app after being away).
 * This ensures repeat visits by the same person (even 100x/day) are all counted!
 */
export function getSessionId(forceNew = false): string {
    try {
        const now = Date.now();
        const prevTs = Number(sessionStorage.getItem(SESSION_TS_KEY) || '0');
        let id = sessionStorage.getItem(SESSION_KEY);
        if (forceNew || !id || (prevTs > 0 && now - prevTs > SESSION_IDLE_MS)) {
            id = randomId('s');
            sessionStorage.setItem(SESSION_KEY, id);
        }
        sessionStorage.setItem(SESSION_TS_KEY, String(now));
        return id;
    } catch {
        return randomId('s');
    }
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    try {
        const ua = navigator.userAgent || '';
        const w = window.innerWidth || 1024;
        if (/ipad|tablet|playbook|silk/i.test(ua) || (w >= 640 && w < 1024 && /android/i.test(ua))) return 'tablet';
        if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua) || w < 640) return 'mobile';
        return 'desktop';
    } catch {
        return 'desktop';
    }
}

export function getReferrerHost(): string | null {
    try {
        if (!document.referrer) return null;
        const u = new URL(document.referrer);
        if (u.hostname === window.location.hostname) return null;
        return u.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

export function getInitialSource(): string {
    try {
        const p = new URLSearchParams(window.location.search);
        const utm = p.get('utm_source') || p.get('src') || p.get('source');
        if (utm) return utm.toLowerCase().slice(0, 50);
        if (p.get('ref')) return 'referral';
        if (isStandalone()) return 'app';
        const ref = getReferrerHost();
        if (ref) return ref.slice(0, 50);
        return 'website';
    } catch {
        return 'website';
    }
}

export function classifyExternalUrl(rawUrl: string, fallbackText?: string): { category: string; label: string } {
    try {
        const u = new URL(rawUrl, window.location.origin);
        const host = u.hostname.toLowerCase().replace(/^www\./, '');
        const cleanText = (fallbackText || '').trim().replace(/\s+/g, ' ').slice(0, 80);

        if (host === 'welile.com' || host.endsWith('.welile.com') || host.includes('weliletech')) {
            return { category: 'welile_tech', label: cleanText ? `Welile Technologies (${cleanText})` : 'Welile Technologies (welile.com)' };
        }
        if (host === 'wa.me' || host.includes('whatsapp.com')) {
            return { category: 'whatsapp', label: cleanText || 'WhatsApp' };
        }
        if (host === 'meet.google.com') {
            return { category: 'live_class', label: cleanText || 'Google Meet' };
        }
        if (host === 'calendar.google.com') {
            return { category: 'calendar', label: cleanText || 'Google Calendar' };
        }
        if (host.includes('youtube.com') || host === 'youtu.be') {
            return { category: 'external', label: cleanText || 'YouTube' };
        }
        return { category: 'external', label: cleanText || host };
    } catch {
        return { category: 'external', label: (fallbackText || rawUrl).slice(0, 80) };
    }
}

export interface SiteEventPayload {
    eventType: 'page_view' | 'app_launch' | 'outbound_click' | 'cta_click' | 'live_join_click' | 'install_prompt' | 'install_accepted';
    path?: string;
    targetUrl?: string;
    label?: string;
    category?: string;
    source?: string;
    meta?: Record<string, unknown>;
    forceNewSession?: boolean;
    keepalive?: boolean;
}

// Short dedupe window to prevent double-firing when overlapping click handlers fire on the same click
let lastEventSig = '';
let lastEventAt = 0;

export function trackSiteEvent(payload: SiteEventPayload): void {
    if (!isSupabaseConfigured) return;
    try {
        const now = Date.now();
        const sig = `${payload.eventType}|${payload.path || ''}|${payload.targetUrl || ''}|${payload.label || ''}`;
        if (!payload.forceNewSession && sig === lastEventSig && now - lastEventAt < 500) return;
        lastEventSig = sig;
        lastEventAt = now;

        const isApp = isStandalone();
        const path = payload.path ?? (window.location.pathname || '/');
        const body = {
            p_visitor_id: getVisitorId(),
            p_session_id: getSessionId(!!payload.forceNewSession),
            p_event_type: payload.eventType,
            p_path: path,
            p_target_url: payload.targetUrl || null,
            p_label: payload.label || null,
            p_category: payload.category || null,
            p_source: payload.source || getInitialSource(),
            p_referrer: getReferrerHost(),
            p_is_app: isApp,
            p_device_type: getDeviceType(),
            p_meta: payload.meta || {},
        };

        // For outbound/navigation clicks, use fetch with keepalive so the request survives immediate tab navigation
        if (payload.keepalive) {
            supabase.auth.getSession().then(({ data }) => {
                const token = data?.session?.access_token || SUPABASE_ANON_KEY;
                void fetch(`${SUPABASE_URL}/rest/v1/rpc/track_site_event`, {
                    method: 'POST',
                    keepalive: true,
                    headers: {
                        apikey: SUPABASE_ANON_KEY,
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                }).catch(() => {});
            }).catch(() => {});
            return;
        }

        // IMPORTANT: In @supabase/supabase-js v2, supabase.rpc() is a lazy thenable and
        // ONLY sends the HTTP request when .then() / await is invoked!
        supabase.rpc('track_site_event', body).then(() => {}, () => {});
    } catch {
        // Never disrupt UX for analytics
    }
}

export function trackPageView(pathname: string, opts?: { returnVisit?: boolean; forceNewSession?: boolean }): void {
    trackSiteEvent({
        eventType: 'page_view',
        path: pathname || '/',
        category: 'navigation',
        source: isStandalone() ? 'app' : getInitialSource(),
        forceNewSession: opts?.forceNewSession,
        meta: opts?.returnVisit ? { return_visit: true } : {},
    });
}

export function trackAppLaunch(forceNewSession = false): void {
    try {
        if (!isStandalone()) return;
        trackSiteEvent({
            eventType: 'app_launch',
            path: window.location.pathname || '/',
            label: 'Opened Installed App',
            category: 'install',
            source: 'app',
            forceNewSession,
        });
    } catch { /* ignore */ }
}

export function trackOutboundClick(url: string, label?: string, category?: string): void {
    const classified = classifyExternalUrl(url, label);
    trackSiteEvent({
        eventType: 'outbound_click',
        path: window.location.pathname || '/',
        targetUrl: url,
        label: label || classified.label,
        category: category || classified.category,
        keepalive: true,
    });
}

export function trackCtaClick(label: string, category = 'cta', targetUrl?: string, meta?: Record<string, unknown>): void {
    trackSiteEvent({
        eventType: 'cta_click',
        path: window.location.pathname || '/',
        targetUrl,
        label,
        category,
        meta,
        keepalive: true,
    });
}

export function trackedLiveJoinUrl(sessionId: string, userId?: string | null, source = 'direct'): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.welileschoolofai.org';
    const params = new URLSearchParams();
    if (userId) params.set('u', userId);
    if (source) params.set('src', source);
    const qs = params.toString();
    return `${origin}/live/join/${sessionId}${qs ? `?${qs}` : ''}`;
}
