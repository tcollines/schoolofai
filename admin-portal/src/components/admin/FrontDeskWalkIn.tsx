import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { LESSONS, kampalaToday } from '../../lib/physicalAttendance';
import { registerWalkIn } from '../../lib/callLog';
import type { FrontDeskData } from './frontDeskData';

const card = 'bg-white dark:bg-night-2 rounded-[22px]';
const input = 'w-full min-h-[48px] rounded-[12px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 px-3 text-base';
const label = 'block mb-1 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400';

/** Someone walked in to HQ: register them under your own agent profile and tick the lessons they attended today. */
const FrontDeskWalkIn: React.FC<{ data: FrontDeskData }> = ({ data }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [location, setLocation] = useState('');
    const [lessons, setLessons] = useState<number[]>([]);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<{ name: string; already: boolean } | null>(null);

    const reset = () => { setName(''); setPhone(''); setEmail(''); setLocation(''); setLessons([]); setNote(''); setError(null); setDone(null); };
    const toggle = (n: number) => setLessons(l => (l.includes(n) ? l.filter(x => x !== n) : [...l, n].sort((a, b) => a - b)));
    const ready = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 7;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ready || busy) return;
        setBusy(true);
        setError(null);
        const res = await registerWalkIn({ name, phone, email, location, lessons, date: kampalaToday(), note });
        setBusy(false);
        if (!res.ok) { setError(res.error || 'Could not register the walk-in'); return; }
        setDone({ name: name.trim(), already: res.alreadyRegistered && !res.created });
        // Refresh the shared people, attendance and call data so every number updates
        void data.reload();
    };

    if (done) {
        return (
            <section className={`${card} p-5 text-center space-y-4`} aria-live="polite">
                <CheckCircle2 size={44} className="mx-auto text-emerald-600" aria-hidden />
                <div>
                    <p className="m-0 text-xl font-extrabold">{done.already ? 'Already registered, attendance recorded' : `Registered ${done.name}`}</p>
                    <p className="m-0 mt-1 text-sm text-stone-500 dark:text-slate-400">
                        {done.already ? `${done.name} was already on the list. Their HQ lessons were saved.` : 'They are now on the list under your agent profile, so they count in your numbers.'}
                    </p>
                </div>
                <button onClick={reset} className="min-h-[56px] w-full sm:w-auto px-8 rounded-[14px] bg-brand text-white text-base font-extrabold">Register another</button>
            </section>
        );
    }

    return (
        <form onSubmit={submit} className={`${card} p-4 sm:p-5 space-y-4`}>
            <div>
                <h2 className="m-0 text-base font-extrabold">Register a walk-in</h2>
                <p className="m-0 mt-0.5 text-xs text-stone-500 dark:text-slate-400">They are saved under your own agent profile and marked as converted.</p>
            </div>
            <label className="block">
                <span className={label}>Full name *</span>
                <input value={name} onChange={e => setName(e.target.value)} className={input} autoComplete="off" required />
            </label>
            <label className="block">
                <span className={label}>Phone *</span>
                <input value={phone} onChange={e => setPhone(e.target.value)} className={input} inputMode="tel" autoComplete="off" placeholder="07XX XXX XXX" required />
            </label>
            <label className="block">
                <span className={label}>Email (optional)</span>
                <input value={email} onChange={e => setEmail(e.target.value)} className={input} inputMode="email" autoComplete="off" placeholder="name@example.com" />
                <span className="block mt-1 text-xs text-stone-500 dark:text-slate-400">No email? That is fine, we will follow up by phone.</span>
            </label>
            <label className="block">
                <span className={label}>Location</span>
                <input value={location} onChange={e => setLocation(e.target.value)} className={input} autoComplete="off" placeholder="Where do they live?" />
            </label>
            <div>
                <span className={label}>Lessons they attended today</span>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Lessons attended today">
                    {LESSONS.map(l => {
                        const on = lessons.includes(l.no);
                        return (
                            <button key={l.no} type="button" aria-pressed={on} onClick={() => toggle(l.no)}
                                className={`min-h-[64px] px-2 rounded-[14px] border text-center ${on ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white dark:bg-night-2 border-stone-300 dark:border-slate-600'}`}>
                                <span className="block text-base font-extrabold">{on ? '✓ ' : ''}Lesson {l.no}</span>
                                <span className={`block text-xs ${on ? 'opacity-90' : 'text-stone-500 dark:text-slate-400'}`}>{l.modules}</span>
                            </button>
                        );
                    })}
                </div>
                <span className="block mt-1 text-xs text-stone-500 dark:text-slate-400">None selected is fine if they only came to register.</span>
            </div>
            <label className="block">
                <span className={label}>Note (optional)</span>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className={`${input} py-2`} />
            </label>
            {error && <p role="alert" className="m-0 rounded-[12px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
            <button type="submit" disabled={!ready || busy} className="w-full min-h-[60px] rounded-[14px] bg-brand text-white text-lg font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                {busy ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Register walk-in'}
            </button>
        </form>
    );
};

export default FrontDeskWalkIn;
