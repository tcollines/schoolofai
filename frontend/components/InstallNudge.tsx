import React, { useEffect, useState } from 'react';
import { Check, Copy, Plus, Share, Smartphone, X } from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';
import { canPromptInstall, isIOS, isStandalone, promptInstall, subscribePwa, trackInstall } from '../src/lib/pwa';

const isSafari = () => /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios|opios/i.test(navigator.userAgent);

/** One numbered step with a picture of the thing to tap. */
const Step: React.FC<{ n: number; title: React.ReactNode; hint?: string; icon: React.ReactNode }> = ({ n, title, hint, icon }) => (
    <li className="flex items-start gap-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 p-3.5">
        <span className="w-8 h-8 shrink-0 rounded-full bg-violet-700 text-white text-sm font-extrabold inline-flex items-center justify-center">{n}</span>
        <div className="flex-1 min-w-0">
            <p className="m-0 text-[15px] font-bold leading-snug">{title}</p>
            {hint && <p className="m-0 mt-0.5 text-[13px] text-stone-500 dark:text-slate-400 leading-snug">{hint}</p>}
        </div>
        <span className="w-12 h-12 shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 inline-flex items-center justify-center text-blue-600">{icon}</span>
    </li>
);

const InstallSheet: React.FC<{ uid: string; onClose: () => void }> = ({ uid, onClose }) => {
    const ios = isIOS();
    const safari = isSafari();
    const [copied, setCopied] = useState(false);
    const [, tick] = useState(0);
    useEffect(() => subscribePwa(() => tick(n => n + 1)), []);
    const canPrompt = canPromptInstall();

    const copy = async () => {
        try { await navigator.clipboard.writeText(window.location.origin); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Install the Welile app" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="m-0 text-xl font-extrabold tracking-[-0.02em]">{ios ? 'Put Welile on your iPhone' : 'Install the Welile app'}</p>
                        <p className="m-0 mt-1 text-sm text-stone-500 dark:text-slate-400">It takes about 30 seconds. After this, Welile opens from your home screen like any other app.</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 shrink-0"><X size={20} /></button>
                </div>

                {ios && !safari && (
                    <div className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3.5">
                        <p className="m-0 text-[14px] font-bold">First, open this page in Safari</p>
                        <p className="m-0 mt-1 text-[13px] leading-snug">On iPhone, Welile can only be added to the home screen from <b>Safari</b> (the blue compass app). Copy the link, open Safari, paste it in the address bar, sign in, and come back to this guide.</p>
                        <button onClick={copy} className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-700 text-white text-sm font-bold">
                            {copied ? <><Check size={15} /> Link copied</> : <><Copy size={15} /> Copy the link</>}
                        </button>
                    </div>
                )}

                {ios ? (
                    <ol className="mt-4 p-0 m-0 list-none space-y-2.5">
                        <Step n={1} title={<>Tap the <b>Share</b> button</>} hint="The square with an arrow pointing up. It is at the bottom of Safari (or the top right on an iPad)." icon={<Share size={24} />} />
                        <Step n={2} title={<>Scroll down and tap <b>Add to Home Screen</b></>} hint="You may need to swipe up on the menu to see it." icon={<span className="w-7 h-7 rounded-md border-2 border-current inline-flex items-center justify-center"><Plus size={18} /></span>} />
                        <Step n={3} title={<>Tap <b>Add</b></>} hint="It is at the top right. You can keep the name Welile." icon={<span className="text-[15px] font-extrabold">Add</span>} />
                        <Step n={4} title={<>Open <b>Welile</b> from your home screen</>} hint="Look for the Welile icon among your apps. Open it once and you are done." icon={<Smartphone size={24} />} />
                    </ol>
                ) : canPrompt ? (
                    <button onClick={async () => { await promptInstall(uid); onClose(); }} className="mt-5 w-full py-3.5 rounded-2xl bg-violet-700 hover:bg-violet-800 text-white text-base font-extrabold">Install now</button>
                ) : (
                    <ol className="mt-4 p-0 m-0 list-none space-y-2.5">
                        <Step n={1} title={<>Open the browser menu <b>(⋮)</b></>} hint="The three dots at the top right of Chrome." icon={<span className="text-xl font-extrabold">⋮</span>} />
                        <Step n={2} title={<>Tap <b>Install app</b> or <b>Add to Home screen</b></>} icon={<Smartphone size={24} />} />
                        <Step n={3} title={<>Open <b>Welile</b> from your home screen</>} hint="Open it once and you are done." icon={<Check size={24} />} />
                    </ol>
                )}

                <p className="mt-4 mb-0 text-[12.5px] text-stone-500 dark:text-slate-400 leading-snug">This reminder goes away by itself once you have opened Welile from your home screen.</p>
                <button onClick={onClose} className="mt-3 w-full py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-sm font-bold">Close this guide</button>
            </div>
        </div>
    );
};

/**
 * A reminder, shown only to people an admin or supervisor has marked, until they have installed the app.
 * It comes back on every visit (it can only be hidden for the page you are on) and stops once the app has been opened from the home screen.
 */
const InstallNudge: React.FC<{ uid?: string | null }> = ({ uid }) => {
    const [show, setShow] = useState(false);
    const [snoozed, setSnoozed] = useState(false);
    const [sheet, setSheet] = useState(false);

    useEffect(() => {
        setShow(false);
        if (!uid) return;
        if (isStandalone()) {
            // The app is open from the home screen: that is the proof of installation. Record it (once a day) and stop reminding.
            try {
                const day = new Date().toISOString().slice(0, 10);
                if (localStorage.getItem(`welile_app_open_${uid}`) !== day) { localStorage.setItem(`welile_app_open_${uid}`, day); trackInstall('app_opened', uid); }
            } catch { /* ignore */ }
            return;
        }
        let alive = true;
        void Promise.resolve(supabase.rpc('my_install_nudge')).then(({ data }) => {
            if (!alive || data !== true) return;
            setShow(true);
            // open the guide by itself the first time in each browser session, then keep the banner on screen
            try {
                if (!sessionStorage.getItem('welile_install_guide_seen')) { sessionStorage.setItem('welile_install_guide_seen', '1'); setSheet(true); }
            } catch { /* ignore */ }
        }, () => { /* offline: no reminder this time */ });
        return () => { alive = false; };
    }, [uid]);

    if (!uid || !show) return null;
    return (
        <>
            {!snoozed && !sheet && (
                <div className="fixed left-3 right-3 bottom-[88px] lg:bottom-5 lg:left-auto lg:right-5 lg:w-[380px] z-[60] rounded-2xl bg-violet-700 text-white shadow-2xl p-3.5 flex items-center gap-3" role="region" aria-label="Install the Welile app">
                    <span className="w-11 h-11 shrink-0 rounded-xl bg-white/15 inline-flex items-center justify-center"><Smartphone size={22} /></span>
                    <div className="flex-1 min-w-0 leading-snug">
                        <p className="m-0 text-[14.5px] font-extrabold">Install the Welile app</p>
                        <p className="m-0 text-[12.5px] text-violet-100">Quick to open, like any other app on your phone.</p>
                    </div>
                    <button onClick={() => { trackInstall('app_install_clicked', uid); setSheet(true); }} className="shrink-0 px-3.5 py-2 rounded-xl bg-white text-violet-800 text-[13px] font-extrabold">Show me how</button>
                    <button onClick={() => setSnoozed(true)} aria-label="Hide for now" className="shrink-0 p-1.5 rounded-lg hover:bg-white/15"><X size={16} /></button>
                </div>
            )}
            {sheet && <InstallSheet uid={uid} onClose={() => { setSheet(false); setSnoozed(true); }} />}
        </>
    );
};

export default InstallNudge;
