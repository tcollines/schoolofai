import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { CHANNELS, EnquiryChannel, EnquiryOutcome, EnquiryTopic, OUTCOMES, TOPICS, logEnquiry } from '../../lib/hqApi';
import type { FrontDeskData } from './frontDeskData';
import type { Prefill } from './FrontDeskWalkIn';
import { addDays, card, chip, errorBox, input, label, today } from './frontDeskUi';

/** Someone came only to ask: log what they wanted and what happens next, so no visitor is forgotten. */
const FrontDeskConsult: React.FC<{ data: FrontDeskData; onRegister: (p: Prefill) => void }> = ({ data, onRegister }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [channel, setChannel] = useState<EnquiryChannel>('walk_in');
    const [topic, setTopic] = useState<EnquiryTopic>('course_info');
    const [course, setCourse] = useState('');
    const [outcome, setOutcome] = useState<EnquiryOutcome>('answered');
    const [followUp, setFollowUp] = useState('');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState<{ id: string | null; name: string; phone: string; email: string } | null>(null);

    const needsDate = outcome === 'thinking' || outcome === 'follow_up';
    const outcomes = OUTCOMES.filter(o => o.id !== 'registered');
    const reset = () => { setName(''); setPhone(''); setEmail(''); setChannel('walk_in'); setTopic('course_info'); setCourse(''); setOutcome('answered'); setFollowUp(''); setNotes(''); setError(null); setSaved(null); };

    const save = async () => {
        setBusy(true); setError(null);
        const res = await logEnquiry({
            name, phone, email, channel, topic, courseSlug: course || null, courseText: course ? null : 'Not sure',
            outcome, followUpOn: needsDate && followUp ? followUp : null, notes,
        });
        setBusy(false);
        if (!res.ok) { setError(res.error || 'Could not save the visit. Please try again.'); return; }
        setSaved({ id: res.data?.id || null, name: name.trim(), phone: phone.trim(), email: email.trim() });
        void data.reloadHq();
    };

    if (saved) {
        return (
            <section className={`${card} p-5 text-center space-y-4`} aria-live="polite">
                <CheckCircle2 size={44} className="mx-auto text-emerald-600" aria-hidden />
                <p className="m-0 text-xl font-extrabold">Visit saved</p>
                <p className="m-0 text-sm text-stone-500 dark:text-slate-400">{needsDate && followUp ? 'It will show under Follow-ups due on the day.' : 'It is in the visitors list.'}</p>
                <div className="grid gap-3">
                    <button onClick={() => onRegister({ name: saved.name, phone: saved.phone, email: saved.email, enquiryId: saved.id })} className="min-h-[60px] rounded-[14px] bg-brand text-white text-lg font-extrabold">Register them now</button>
                    <button onClick={reset} className="min-h-[56px] rounded-[14px] border-2 border-violet-600 text-violet-700 dark:text-violet-300 text-base font-extrabold">Log another visit</button>
                </div>
            </section>
        );
    }

    return (
        <section className={`${card} p-4 sm:p-5 space-y-4`}>
            <div>
                <h2 className="m-0 text-base font-extrabold">Just consulting</h2>
                <p className="m-0 mt-0.5 text-xs text-stone-500 dark:text-slate-400">For people who came to ask. Name and phone are optional.</p>
            </div>
            <label className="block"><span className={label}>Name</span><input value={name} onChange={e => setName(e.target.value)} className={input} autoComplete="off" /></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block"><span className={label}>Phone</span><input value={phone} onChange={e => setPhone(e.target.value)} className={input} inputMode="tel" autoComplete="off" /></label>
                <label className="block"><span className={label}>Email</span><input value={email} onChange={e => setEmail(e.target.value)} className={input} inputMode="email" autoComplete="off" /></label>
            </div>

            <div>
                <span className={label}>How they came</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="How they came">
                    {CHANNELS.map(c => <button key={c.id} type="button" aria-pressed={channel === c.id} onClick={() => setChannel(c.id)} className={chip(channel === c.id)}>{c.label}</button>)}
                </div>
            </div>

            <div>
                <span className={label}>What they asked about</span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Reason">
                    {TOPICS.map(t => <button key={t.id} type="button" aria-pressed={topic === t.id} onClick={() => setTopic(t.id)} className={chip(topic === t.id)}>{t.label}</button>)}
                </div>
            </div>

            <label className="block">
                <span className={label}>Course they are interested in</span>
                <select value={course} onChange={e => setCourse(e.target.value)} className={input}>
                    <option value="">Not sure</option>
                    {data.courses.filter(c => c.active).map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
                </select>
            </label>

            <div>
                <span className={label}>How did it end?</span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Outcome">
                    {outcomes.map(o => <button key={o.id} type="button" aria-pressed={outcome === o.id} onClick={() => setOutcome(o.id)} className={chip(outcome === o.id)}>{o.label}</button>)}
                </div>
            </div>

            {needsDate && (
                <div>
                    <span className={label}>Follow up on</span>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <button type="button" onClick={() => setFollowUp(addDays(today(), 1))} className={chip(followUp === addDays(today(), 1))}>Tomorrow</button>
                        <button type="button" onClick={() => setFollowUp(addDays(today(), 3))} className={chip(followUp === addDays(today(), 3))}>In 3 days</button>
                        <button type="button" onClick={() => setFollowUp(addDays(today(), 7))} className={chip(followUp === addDays(today(), 7))}>Next week</button>
                    </div>
                    <input type="date" value={followUp} min={today()} onChange={e => setFollowUp(e.target.value)} className={input} aria-label="Follow-up date" />
                </div>
            )}

            <label className="block"><span className={label}>Notes</span><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={`${input} py-2`} /></label>
            {error && <p role="alert" className={errorBox}>{error}</p>}
            <button onClick={() => void save()} disabled={busy} className="w-full min-h-[64px] rounded-[14px] bg-brand text-white text-lg font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {busy ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save visit'}
            </button>
        </section>
    );
};

export default FrontDeskConsult;
