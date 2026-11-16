// "Install as an app" support. Deliberately quiet: nothing is cached or changed about how the site loads.
// The service worker only makes the site installable. Install events are queued here and written to
// learn_events (event types app_install_*, app_opened) once the learner is signed in, so the admin can count installs.

import { recordEvent } from './learnApi';

type Deferred = { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let deferred: Deferred | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(f => f());
const PENDING = 'welile_pwa_pending';

export const subscribePwa = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };

export const isStandalone = (): boolean => {
    try { return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true; } catch { return false; }
};
export const isIOS = (): boolean => /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
export const canPromptInstall = (): boolean => !!deferred;
/** iPhones have no install prompt: they add the site from the Share menu. Only Safari can do it. */
export const needsIosHelp = (): boolean => isIOS() && !isStandalone() && /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);

const queue = (type: string) => {
    try {
        const list = JSON.parse(localStorage.getItem(PENDING) || '[]') as { type: string; at: string }[];
        list.push({ type, at: new Date().toISOString() });
        localStorage.setItem(PENDING, JSON.stringify(list.slice(-20)));
    } catch { /* ignore */ }
};

/** Write queued install events for this learner. Safe to call often. */
export async function flushPwaEvents(uid: string) {
    let list: { type: string; at: string }[] = [];
    try { list = JSON.parse(localStorage.getItem(PENDING) || '[]'); localStorage.removeItem(PENDING); } catch { return; }
    for (const e of list) await recordEvent(uid, e.type, undefined, { at: e.at, standalone: isStandalone(), ios: isIOS() });
}

export const trackInstall = (type: 'app_install_available' | 'app_install_clicked' | 'app_installed' | 'app_install_dismissed' | 'app_opened', uid?: string) => {
    queue(type);
    if (uid) void flushPwaEvents(uid);
};

export async function promptInstall(uid?: string): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!deferred) return 'unavailable';
    trackInstall('app_install_clicked', uid);
    const d = deferred;
    deferred = null;
    notify();
    try {
        await d.prompt();
        const { outcome } = await d.userChoice;
        if (outcome === 'accepted') trackInstall('app_installed', uid); else trackInstall('app_install_dismissed', uid);
        return outcome;
    } catch { return 'dismissed'; }
}

let started = false;
export function initPwa() {
    if (started || typeof window === 'undefined') return;
    started = true;
    window.addEventListener('beforeinstallprompt', (e: Event) => { e.preventDefault(); deferred = e as unknown as Deferred; notify(); });
    window.addEventListener('appinstalled', () => { deferred = null; trackInstall('app_installed'); notify(); });
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
        window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => { /* installability is optional */ }); });
    }
}
