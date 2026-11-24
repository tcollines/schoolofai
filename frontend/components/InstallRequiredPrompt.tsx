import React, { useEffect, useState } from 'react';
import { Share, Smartphone } from 'lucide-react';
import { supabaseClient } from '../src/lib/supabaseClient';
import { canPromptInstall, flushPwaEvents, initPwa, isIOS, isStandalone, promptInstall, subscribePwa, trackInstall } from '../src/lib/pwa';

/** Accounts that must install the app. The popup stays until the app is installed, then never returns. */
export const MUST_INSTALL = ['isaacmugasha@gmail.com', 'naigagamutakipavin@gmail.com', 'elviskasozi456@gmail.com'];

const INSTALLED_KEY = (uid: string) => `welile_must_install_done_${uid}`;

const InstallRequiredPrompt: React.FC<{ uid?: string; email?: string }> = ({ uid, email }) => {
    const [, tick] = useState(0);
    const [done, setDone] = useState(true); // hidden until we know
    const [snoozed, setSnoozed] = useState(false);
    const target = !!uid && !!email && MUST_INSTALL.includes(email.trim().toLowerCase());

    useEffect(() => { initPwa(); return subscribePwa(() => tick(n => n + 1)); }, []);

    // Decide whether this person has already installed (this device, or any device in the past).
    useEffect(() => {
        if (!target || !uid) return;
        let cancelled = false;
        (async () => {
            if (isStandalone()) {
                try { localStorage.setItem(INSTALLED_KEY(uid), '1'); } catch { /* ignore */ }
                trackInstall('app_installed', uid);
                if (!cancelled) setDone(true);
                return;
            }
            try { if (localStorage.getItem(INSTALLED_KEY(uid)) === '1') { if (!cancelled) setDone(true); return; } } catch { /* ignore */ }
            try {
                const { data } = await supabaseClient.from('learn_events').select('id').eq('user_id', uid).eq('event_type', 'app_installed').limit(1);
                if (data && data.length) { try { localStorage.setItem(INSTALLED_KEY(uid), '1'); } catch { /* ignore */ } if (!cancelled) setDone(true); return; }
            } catch { /* if the lookup fails, show the popup */ }
            if (!cancelled) setDone(false);
        })();
        return () => { cancelled = true; };
    }, [target, uid]);

    // The browser tells us when the install finished: remember it and close the popup for good.
    useEffect(() => {
        if (!target || !uid) return;
        const onInstalled = () => {
            try { localStorage.setItem(INSTALLED_KEY(uid), '1'); } catch { /* ignore */ }
            void flushPwaEvents(uid);
            setDone(true);
        };
        window.addEventListener('appinstalled', onInstalled);
        return () => window.removeEventListener('appinstalled', onInstalled);
    }, [target, uid]);

    if (!target || done || snoozed) return null;

    const canPrompt = canPromptInstall();
    const ios = isIOS();
    const install = async () => {
        if (!canPrompt) return;
        const outcome = await promptInstall(uid);
        if (outcome === 'accepted' && uid) { try { localStorage.setItem(INSTALLED_KEY(uid), '1'); } catch { /* ignore */ } setDone(true); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Install the Welile app">
            <div className="bg-white dark:bg-slate-900 text-ink dark:text-slate-100 rounded-[22px] shadow-2xl p-6 max-w-sm w-full">
                <div className="w-12 h-12 rounded-[14px] bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 flex items-center justify-center mb-3"><Smartphone size={24} /></div>
                <p className="text-lg font-semibold">Install the Welile app</p>
                <p className="mt-1 text-[15px] text-stone-600 dark:text-slate-300">Put Welile on your phone so the admin panel and live classes are one tap away. This reminder goes away once the app is installed.</p>
                {canPrompt ? (
                    <button onClick={install} className="mt-4 w-full min-h-[48px] rounded-[14px] bg-violet-700 hover:bg-brand-mid text-white font-semibold">Install now</button>
                ) : ios ? (
                    <ol className="mt-4 space-y-2 text-[15px] list-decimal list-inside text-stone-700 dark:text-slate-200">
                        <li>Open this page in <b>Safari</b>.</li>
                        <li>Tap the <Share size={15} className="inline -mt-0.5" /> Share button.</li>
                        <li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
                    </ol>
                ) : (
                    <p className="mt-4 text-[15px] text-stone-700 dark:text-slate-200">Open the browser menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b>. If you don't see it, open this site in Chrome.</p>
                )}
                <button onClick={() => setSnoozed(true)} className="mt-2 w-full min-h-[44px] rounded-[14px] text-sm text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800">Remind me next time</button>
            </div>
        </div>
    );
};

export default InstallRequiredPrompt;
