import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, MessageCircle, Phone, Search } from 'lucide-react';
import { PersonRow, isOnline, kampalaDay } from '../../lib/peopleMetrics';
import { LESSONS, indexPhysical } from '../../lib/physicalAttendance';
import {
    CallOutcome, CallRow, NEXT_STEPS, NextStep, OUTCOMES, applyLocalCall, indexCalls, logCall, nextStepLabel, outcomeLabel,
} from '../../lib/callLog';
import type { FrontDeskData } from './frontDeskData';

const card = 'bg-white dark:bg-night-2 rounded-[22px]';
type Filter = 'never' | 'due' | 'interested' | 'converted' | 'all';
const FILTERS: { id: Filter; label: string }[] = [
    { id: 'never', label: 'Never called' },
    { id: 'due', label: 'Call back due' },
    { id: 'interested', label: 'Interested' },
    { id: 'converted', label: 'Converted' },
    { id: 'all', label: 'All' },
];

const wa = (p: string) => (p.startsWith('0') ? '256' + p.slice(1) : p.replace(/\D/g, ''));
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Kampala' });
const today = () => kampalaDay(Date.now());

/** The call list: people who need a call first, then everyone else to follow up. Log each call in two taps. */
const FrontDeskCalls: React.FC<{ data: FrontDeskData }> = ({ data }) => {
    const { rows, marks, calls, setCalls, loading } = data;
    // The dashboard's one-tap "Log call" arrives here with ?open=<person key>, so the log panel is already open for that person
    const [sp] = useSearchParams();
    const [filter, setFilter] = useState<Filter>(sp.get('open') ? 'all' : 'never');
    const [q, setQ] = useState(sp.get('q') || '');
    const [limit, setLimit] = useState(60);
    const [openKey, setOpenKey] = useState<string | null>(sp.get('open'));
    const [outcome, setOutcome] = useState<CallOutcome | null>(null);
    const [next, setNext] = useState<NextStep | null>(null);
    const [note, setNote] = useState('');
    const [followUp, setFollowUp] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lessonsFor = useMemo(() => indexPhysical(marks), [marks]);
    const callIndex = useMemo(() => indexCalls(calls), [calls]);
    useEffect(() => { setLimit(60); }, [filter, q]);

    const items = useMemo(() => {
        const term = q.trim().toLowerCase();
        const digits = term.replace(/\D/g, '');
        const t = today();
        const list = rows
            .filter(p => !(p.followup === 'not_interested' && filter === 'never'))
            .map(p => {
                const ref = { key: p.key, name: p.name, email: p.email, phone: p.phone };
                const last = callIndex.last(ref);
                const hq = lessonsFor(ref);
                const converted = p.followup === 'converted' || !!p.has_account || hq.length > 0;
                const due = !!last?.follow_up_on && last.follow_up_on <= t && !converted;
                const interested = p.followup === 'interested' || (last?.outcome === 'reached' && !!last.next_step && ['online', 'recorded', 'hq', 'paid'].includes(last.next_step));
                return { p, ref, last, hq, converted, due, interested, needsCall: !isOnline(p) };
            })
            .filter(x => {
                if (filter === 'never' && x.last) return false;
                if (filter === 'due' && !x.due) return false;
                if (filter === 'interested' && !x.interested) return false;
                if (filter === 'converted' && !(x.p.followup === 'converted')) return false;
                // The call list is for people we have to reach: skip people who already have an account unless a filter asks for them
                if (filter === 'never' && x.p.has_account) return false;
                if (term) {
                    const hay = `${x.p.name} ${x.p.email || ''} ${x.p.location || ''}`.toLowerCase();
                    const phoneHit = digits.length >= 3 && (x.p.phone || '').replace(/\D/g, '').includes(digits);
                    if (!hay.includes(term) && !phoneHit) return false;
                }
                return true;
            });
        // Needs a call first, then others; inside each: never called first, then the oldest call
        return list.sort((a, b) => {
            if (a.needsCall !== b.needsCall) return a.needsCall ? -1 : 1;
            if (!!a.last !== !!b.last) return a.last ? 1 : -1;
            if (a.last && b.last) return a.last.called_at < b.last.called_at ? -1 : 1;
            return 0;
        });
    }, [rows, filter, q, callIndex, lessonsFor]);

    const counts = useMemo(() => {
        const t = today();
        let never = 0, due = 0, interested = 0, converted = 0;
        rows.forEach(p => {
            const ref = { key: p.key, name: p.name, email: p.email, phone: p.phone };
            const last = callIndex.last(ref);
            const isConverted = p.followup === 'converted' || !!p.has_account || lessonsFor(ref).length > 0;
            if (!last && !p.has_account && p.followup !== 'not_interested') never++;
            if (last?.follow_up_on && last.follow_up_on <= t && !isConverted) due++;
            if (p.followup === 'interested' || (last?.outcome === 'reached' && !!last.next_step && ['online', 'recorded', 'hq', 'paid'].includes(last.next_step))) interested++;
            if (p.followup === 'converted') converted++;
        });
        return { never, due, interested, converted, all: rows.length } as Record<Filter, number>;
    }, [rows, callIndex, lessonsFor]);

    const open = (p: PersonRow) => {
        if (openKey === p.key) { setOpenKey(null); return; }
        setOpenKey(p.key); setOutcome(null); setNext(null); setNote(''); setFollowUp(''); setError(null);
    };

    const save = async (p: PersonRow) => {
        if (!outcome || busy) return;
        if (outcome === 'reached' && !next) { setError('Pick what they want to do next.'); return; }
        const ref = { key: p.key, name: p.name, email: p.email, phone: p.phone };
        const step = outcome === 'reached' ? next : null;
        setBusy(true);
        setError(null);
        const previous: CallRow[] = calls;
        setCalls(prev => applyLocalCall(prev, ref, outcome, step, note.trim() || null, followUp || null, null));
        const res = await logCall(ref, outcome, step, note, followUp || null);
        setBusy(false);
        if (!res.ok) { setCalls(previous); setError(res.error || 'Could not save the call'); return; }
        setOpenKey(null);
        // Reload so the call shows who made it and the follow-up status is up to date everywhere
        void data.reload();
    };

    const bigBtn = (on: boolean) => `min-h-[56px] px-3 rounded-[14px] border text-base font-bold ${on ? 'bg-brand border-violet-600 text-white' : 'bg-white dark:bg-night-2 border-stone-300 dark:border-slate-600 text-stone-800 dark:text-slate-100'}`;

    return (
        <section className={`${card} p-4 sm:p-5 space-y-3`}>
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, phone or email" aria-label="Search people"
                    className="w-full min-h-[48px] rounded-[12px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 pl-9 pr-3 text-base" />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Who to show">
                {FILTERS.map(f => (
                    <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
                        className={`min-h-[44px] px-3 rounded-[12px] border text-sm font-semibold ${filter === f.id ? 'bg-brand border-violet-600 text-white' : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2'}`}>
                        {f.label} <span className={filter === f.id ? 'opacity-90' : 'text-stone-500'}>{counts[f.id]}</span>
                    </button>
                ))}
            </div>
            <p className="m-0 text-xs text-stone-500 dark:text-slate-400">People with no email come first, then everyone else. Never called is first, then the oldest call. {items.length} shown.</p>

            {rows.length === 0 && loading && <div className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={18} /> Loading people...</div>}

            <ul className="m-0 p-0 list-none space-y-2">
                {items.slice(0, limit).map(({ p, last, hq, due, needsCall }) => {
                    const isOpen = openKey === p.key;
                    return (
                        <li key={p.key} className={`rounded-[14px] border ${due ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/20' : 'border-stone-200 dark:border-slate-700'}`}>
                            <div className="flex items-start gap-3 min-h-[64px] p-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <p className="m-0 font-bold text-base break-words">{p.name || '(no name)'}</p>
                                        {needsCall && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">No email</span>}
                                        {due && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">Call back due</span>}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                        {p.phone
                                            ? <>
                                                <a href={`tel:+${wa(p.phone)}`} className="inline-flex items-center gap-1 min-h-[44px] font-mono font-semibold text-violet-700 dark:text-violet-300 no-underline"><Phone size={14} /> +{wa(p.phone)}</a>
                                                <a href={`https://wa.me/${wa(p.phone)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-[44px] px-2 font-semibold text-emerald-700 dark:text-emerald-400 no-underline"><MessageCircle size={14} /> WhatsApp</a>
                                            </>
                                            : <span className="text-xs text-stone-500">No phone number</span>}
                                    </div>
                                    <p className="m-0 text-xs text-stone-500 dark:text-slate-400">
                                        {last
                                            ? <>Last call: <b>{outcomeLabel(last.outcome)}</b>{last.next_step ? ` · ${nextStepLabel(last.next_step)}` : ''} · {day(last.called_at)}{last.caller_name ? ` · ${last.caller_name}` : ''}{last.follow_up_on ? ` · call back ${day(last.follow_up_on)}` : ''}</>
                                            : 'Never called'}
                                    </p>
                                    <div className="mt-1 flex items-center gap-1" aria-label={`Attended at HQ: ${hq.length ? hq.map(n => `lesson ${n}`).join(', ') : 'none yet'}`}>
                                        {LESSONS.map(l => <span key={l.no} className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${hq.includes(l.no) ? 'bg-emerald-600 text-white' : 'bg-stone-100 dark:bg-slate-800 text-stone-400'}`}>{l.no}</span>)}
                                    </div>
                                </div>
                                <button type="button" onClick={() => open(p)} aria-expanded={isOpen}
                                    className={`shrink-0 min-w-[96px] min-h-[56px] px-3 rounded-[14px] border text-base font-extrabold ${isOpen ? 'bg-stone-100 dark:bg-slate-800 border-stone-300 dark:border-slate-600' : 'bg-brand border-violet-600 text-white'}`}>{isOpen ? 'Close' : 'Log call'}</button>
                            </div>

                            {isOpen && (
                                <div className="border-t border-stone-200 dark:border-slate-700 p-3 space-y-3">
                                    <div>
                                        <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">1. How did the call go?</p>
                                        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Call outcome">
                                            {OUTCOMES.map(o => <button key={o.id} type="button" aria-pressed={outcome === o.id} onClick={() => { setOutcome(o.id); if (o.id !== 'reached') setNext(null); }} className={bigBtn(outcome === o.id)}>{o.label}</button>)}
                                        </div>
                                    </div>
                                    {outcome === 'reached' && (
                                        <div>
                                            <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">2. What do they want to do next?</p>
                                            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Next step">
                                                {NEXT_STEPS.map(n => <button key={n.id} type="button" aria-pressed={next === n.id} onClick={() => setNext(n.id)} className={bigBtn(next === n.id)}>{n.label}</button>)}
                                            </div>
                                        </div>
                                    )}
                                    {outcome && (
                                        <>
                                            <label className="block">
                                                <span className="block mb-1 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">Note (optional)</span>
                                                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full rounded-[12px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 px-3 py-2 text-base" />
                                            </label>
                                            <label className="block">
                                                <span className="block mb-1 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">Call back on (optional)</span>
                                                <input type="date" value={followUp} min={today()} onChange={e => setFollowUp(e.target.value)} className="min-h-[48px] rounded-[12px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 px-3 text-base" />
                                            </label>
                                        </>
                                    )}
                                    {error && <p role="alert" className="m-0 rounded-[12px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
                                    <button type="button" disabled={!outcome || busy || (outcome === 'reached' && !next)} onClick={() => void save(p)}
                                        className="w-full min-h-[56px] rounded-[14px] bg-emerald-600 text-white text-base font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                                        {busy ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save call'}
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
            {rows.length > 0 && items.length === 0 && <p className="m-0 py-6 text-center text-stone-500">No one matches. Try another filter, or clear the search.</p>}
            {items.length > limit && <button onClick={() => setLimit(l => l + 60)} className="min-h-[44px] px-2 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline">Show more ({items.length - limit} remaining)</button>}
        </section>
    );
};

export default FrontDeskCalls;
