import React, { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';
import { fetchMyPortalRoles } from '../src/lib/roles';
import { canPromptInstall, isStandalone, needsIosHelp, promptInstall, subscribePwa, trackInstall } from '../src/lib/pwa';
import { InstallSheet } from './InstallNudge';
import { MUST_INSTALL } from './InstallRequiredPrompt';

const HOUR = 60 * 60 * 1000;
const doneKey = (uid: string) => `welile_install_done_${uid}`;
const hiddenKey = (uid: string) => `welile_install_banner_hidden_at_${uid}`;
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

/** The small card itself: quiet on purpose. */
export const InstallBannerView: React.FC<{ onInstall: () => void; onClose: () => void }> = ({ onInstall, onClose }) => (
    <div className="fixed left-3 right-3 bottom-[88px] lg:bottom-5 lg:left-auto lg:right-5 lg:w-[360px] z-[55] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-stone-200 dark:border-slate-700 shadow-lg px-3.5 py-3 flex items-center gap-3 text-stone-900 dark:text-slate-100" role="region" aria-label="Install the Welile app">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 inline-flex items-center justify-center"><Smartphone size={18} /></span>
        <p className="flex-1 min-w-0 m-0 text-[13px] leading-snug text-stone-600 dark:text-slate-300">
            Install the app to <b className="text-stone-900 dark:text-white">track your progress</b> and pick up where you left off.
        </p>
        <button onClick={onInstall} className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-[12.5px] font-bold">Install</button>
        <button onClick={onClose} aria-label="Hide for now" className="shrink-0 p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800"><X size={15} /></button>
    </div>
);

/**
 * A subtle "install the app" card for signed-in students who have not installed it.
 *  - never shows once the app is installed (opened from the home screen, or an install was recorded)
 *  - when closed, stays away for an hour; if they are still on the site then, it comes back
 *  - people who already get the stronger reminder (InstallRequiredPrompt / InstallNudge) are left to that one
 */
const StudentInstallBanner: React.FC<{ uid?: string | null; email?: string | null }> = ({ uid, email }) => {
    const [eligible, setEligible] = useState(false);
    const [hiddenAt, setHiddenAt] = useState<number | null>(null);
    const [now, setNow] = useState(() => Date.now());
    const [sheet, setSheet] = useState(false);
    const [, tick] = useState(0);
    useEffect(() => subscribePwa(() => tick(n => n + 1)), []);

    useEffect(() => {
        setEligible(false);
        if (!uid) return;
        if (isStandalone()) { write(doneKey(uid), '1'); return; }
        if (read(doneKey(uid)) === '1') return;
        if (email && MUST_INSTALL.includes(email.trim().toLowerCase())) return;
        const at = Number(read(hiddenKey(uid)) || 0);
        setHiddenAt(at || null);
        let alive = true;
        (async () => {
            try {
                const roles = await fetchMyPortalRoles(uid);
                if (!alive || !roles.is_student) return;
                const [{ data: nudge }, { data: events }] = await Promise.all([
                    Promise.resolve(supabase.rpc('my_install_nudge')),
                    supabase.from('learn_events').select('id').eq('user_id', uid).in('event_type', ['app_installed', 'app_opened']).limit(1),
                ]);
                if (!alive) return;
                if (nudge === true) return;                     // they get the stronger reminder instead
                if (events && events.length) { write(doneKey(uid), '1'); return; } // installed on another visit or device
                setEligible(true);
            } catch { /* offline or blocked: no banner this time */ }
        })();
        return () => { alive = false; };
    }, [uid, email]);

    // while the page stays open, bring the card back once the hour is up
    useEffect(() => {
        if (!hiddenAt) return;
        const left = hiddenAt + HOUR - Date.now();
        if (left <= 0) { setNow(Date.now()); return; }
        const t = window.setTimeout(() => setNow(Date.now()), left + 500);
        return () => window.clearTimeout(t);
    }, [hiddenAt]);

    const deviceCanInstall = canPromptInstall() || needsIosHelp();
    const snoozed = hiddenAt !== null && now < hiddenAt + HOUR;
    useEffect(() => {
        if (uid && eligible && deviceCanInstall && !snoozed) {
            const k = `welile_install_seen_${uid}`;
            if (!read(k)) { write(k, '1'); trackInstall('app_install_available', uid); }
        }
    }, [uid, eligible, deviceCanInstall, snoozed]);

    if (!uid || !eligible || !deviceCanInstall || snoozed) return null;

    const hide = () => { const t = Date.now(); write(hiddenKey(uid), String(t)); setHiddenAt(t); setNow(t); trackInstall('app_install_dismissed', uid); };
    const install = async () => {
        if (canPromptInstall()) {
            const outcome = await promptInstall(uid);
            if (outcome === 'accepted') { write(doneKey(uid), '1'); setEligible(false); } else hide();
        } else {
            trackInstall('app_install_clicked', uid);
            setSheet(true);
        }
    };

    return (
        <>
            {!sheet && <InstallBannerView onInstall={() => void install()} onClose={hide} />}
            {sheet && <InstallSheet uid={uid} onClose={() => { setSheet(false); hide(); }} />}
        </>
    );
};

export default StudentInstallBanner;
