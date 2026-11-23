import React, { useEffect, useState } from 'react';
import { Share, Smartphone, X } from 'lucide-react';
import { canPromptInstall, flushPwaEvents, isStandalone, needsIosHelp, promptInstall, subscribePwa, trackInstall } from '../../src/lib/pwa';
import { useLearn } from './learnContext';
import { BTN_PRIMARY, CARD, MUTED } from './learnUi';

const useInstallState = () => {
    const [, tick] = useState(0);
    useEffect(() => subscribePwa(() => tick(n => n + 1)), []);
    const standalone = isStandalone();
    const canPrompt = canPromptInstall();
    const ios = needsIosHelp();
    return { standalone, canPrompt, ios, show: !standalone && (canPrompt || ios) };
};

const IosSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Add to Home Screen" onClick={onClose}>
        <div className={`${CARD} p-6 max-w-sm w-full`} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-extrabold tracking-[-0.02em]">Put Welile on your home screen</p>
                <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-[12px] hover:bg-stone-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <ol className={`mt-3 space-y-2 text-[15px] ${MUTED} list-decimal list-inside`}>
                <li>Tap the <Share size={15} className="inline -mt-0.5" /> Share button in Safari.</li>
                <li>Choose <b>Add to Home Screen</b>.</li>
                <li>Tap <b>Add</b>. Open it like any other app.</li>
            </ol>
        </div>
    </div>
);

/** A small, quiet "Install" button for the header. Appears only when the phone or browser can install the site. */
export const InstallChip: React.FC = () => {
    const { uid } = useLearn();
    const s = useInstallState();
    const [help, setHelp] = useState(false);
    useEffect(() => {
        if (!s.show) return;
        try {
            if (!localStorage.getItem(`welile_install_seen_${uid}`)) { localStorage.setItem(`welile_install_seen_${uid}`, '1'); trackInstall('app_install_available', uid); }
        } catch { /* ignore */ }
    }, [s.show, uid]);
    if (!s.show) return null;
    const click = async () => { if (s.canPrompt) await promptInstall(uid); else { trackInstall('app_install_clicked', uid); setHelp(true); } };
    return (
        <>
            <button onClick={click} aria-label="Install the app" title="Install the app" className="flex items-center gap-1.5 p-2.5 sm:px-3 rounded-[12px] text-sm font-medium text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800">
                <Smartphone size={18} /><span className="hidden md:inline">Install app</span>
            </button>
            {help && <IosSheet onClose={() => setHelp(false)} />}
        </>
    );
};

/** A one-time, dismissible line on the course home page. */
export const InstallTip: React.FC = () => {
    const { uid } = useLearn();
    const s = useInstallState();
    const key = `welile_install_tip_${uid}`;
    const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(key) === '1'; } catch { return false; } });
    const [help, setHelp] = useState(false);
    if (!s.show || hidden) return null;
    const dismiss = () => { setHidden(true); try { localStorage.setItem(key, '1'); } catch { /* ignore */ } trackInstall('app_install_dismissed', uid); };
    const install = async () => { if (s.canPrompt) { await promptInstall(uid); setHidden(true); } else { trackInstall('app_install_clicked', uid); setHelp(true); } };
    return (
        <div className={`${CARD} px-4 py-3 flex items-center gap-3 text-sm`}>
            <Smartphone size={18} className="text-brand dark:text-violet-400 shrink-0" />
            <p className="flex-1">Tip: keep this course on your phone like an app. <button onClick={install} className="font-semibold text-brand dark:text-violet-300 underline underline-offset-2">Install it</button></p>
            <button onClick={dismiss} aria-label="Dismiss" className="p-1.5 rounded-[12px] hover:bg-stone-100 dark:hover:bg-slate-800"><X size={16} /></button>
            {help && <IosSheet onClose={() => setHelp(false)} />}
        </div>
    );
};

/** Writes queued install events and notes when the course is opened from the installed app. */
export const useInstallTracking = (uid?: string) => {
    useEffect(() => {
        if (!uid) return;
        void flushPwaEvents(uid);
        try {
            if (isStandalone()) {
                const day = new Date().toISOString().slice(0, 10);
                if (localStorage.getItem(`welile_app_open_${uid}`) !== day) { localStorage.setItem(`welile_app_open_${uid}`, day); trackInstall('app_opened', uid); }
            }
        } catch { /* ignore */ }
    }, [uid]);
};

export const InstallButtonPrimary: React.FC = () => {
    const { uid } = useLearn();
    return <button onClick={() => void promptInstall(uid)} className={BTN_PRIMARY}>Install</button>;
};
