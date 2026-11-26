import React, { useMemo, useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { Enquiry, EnquiryOutcome, OUTCOMES, channelLabel, outcomeLabel, topicLabel, updateEnquiry } from '../../lib/hqApi';
import type { FrontDeskData } from './frontDeskData';
import type { Prefill } from './FrontDeskWalkIn';
import { addDays, card, chip, errorBox, input, label, prettyDate, today, waNumber } from './frontDeskUi';
import { kampalaDay } from '../../lib/peopleMetrics';

type Filter = 'due' | 'all' | 'registered' | 'not_interested';
const FILTERS: { id: Filter; label: string }[] = [
    { id: 'due', label: 'Needs follow-up today' }, { id: 'all', label: 'All' }, { id: 'registered', label: 'Registered' }, { id: 'not_interested', label: 'Not interested' },
];

/** Everyone who came only to ask. Change what happened, set a follow-up date, call them, or register them. */
const FrontDeskVisitors: React.FC<{ data: FrontDeskData; onRegister: (p: Prefill) => void }> = ({ data, onRegister }) => {
    const [filter, setFilter] = useState<Filter>('due');
    const [open, setOpen] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [limit, setLimit] = useState(60);
    const t = today();

    const isDue = (q: Enquiry) => !!q.follow_up_on && q.follow_up_on <= t && (q.outcome === 'thinking' || q.outcome === 'follow_up');
    const counts = useMemo(() => ({
        due: data.enquiries.filter(isDue).length, all: data.enquiries.length,
        registered: data.enquiries.filter(q => q.outcome === 'registered').length, not_interested: data.enquiries.filter(q => q.outcome === 'not_interested').length,
    }), [data.enquiries]); // eslint-disable-line react-hooks/exhaustive-deps
    const list = useMemo(() => data.enquiries.filter(q => filter === 'all' ? true : filter === 'due' ? isDue(q) : q.outcome === filter), [data.enquiries, filter]); // eslint-disable-line react-hooks/exhaustive-deps

    const patch = async (q: Enquiry, p: Partial<{ outcome: EnquiryOutcome; follow_up_on: string }>) => {
        setBusy(true); setError(null);
        const res = await updateEnquiry(q.id, p);
        setBusy(false);
        if (!res.ok) { setError(res.error || 'Could not save the change.'); return; }
        data.setEnquiries(prev => prev.map(x => (x.id === q.id ? { ...x, ...p } as Enquiry : x)));
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Visitors">
                {FILTERS.map(f => <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => { setFilter(f.id); setLimit(60); }} className={`${chip(filter === f.id)} min-h-[48px]`}>{f.label} <span className="opacity-80">{counts[f.id]}</span></button>)}
            </div>
            {error && <p role="alert" className={errorBox}>{error}</p>}
            {list.length === 0 && <p className={`${card} p-5 m-0 text-center text-stone-500 dark:text-slate-400`}>{data.loading ? 'Loading...' : 'No visitors here.'}</p>}
            <ul className="m-0 p-0 list-none space-y-2">
                {list.slice(0, limit).map(q => {
                    const isOpen = open === q.id;
                    const course = q.course_slug ? data.courses.find(c => c.slug === q.course_slug)?.title : q.course_text;
                    return (
                        <li key={q.id} className={`${card} border ${isDue(q) ? 'border-amber-400' : 'border-stone-200 dark:border-slate-700'}`}>
                            <button onClick={() => setOpen(isOpen ? null : q.id)} aria-expanded={isOpen} className="w-full min-h-[64px] p-4 text-left bg-transparent border-0 cursor-pointer text-inherit">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="m-0 text-base font-bold break-words">{q.visitor_name || 'No name given'}</p>
                                    <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-slate-800">{outcomeLabel(q.outcome)}</span>
                                </div>
                                <p className="m-0 mt-0.5 text-sm text-stone-600 dark:text-slate-300">{topicLabel(q.topic)}{course ? ` · ${course}` : ''} · {channelLabel(q.channel)}</p>
                                <p className="m-0 text-xs text-stone-500 dark:text-slate-400">
                                    {prettyDate(kampalaDay(q.visited_at))}{q.handler_name ? ` · ${q.handler_name}` : ''}{q.follow_up_on ? ` · follow up ${prettyDate(q.follow_up_on)}` : ''}{isDue(q) ? ' · due' : ''}
                                </p>
                            </button>
                            {isOpen && (
                                <div className="border-t border-stone-200 dark:border-slate-700 p-4 space-y-3">
                                    {q.notes && <p className="m-0 text-sm text-stone-700 dark:text-slate-200">{q.notes}</p>}
                                    <div className="grid grid-cols-2 gap-2">
                                        {q.phone ? <a href={`tel:+${waNumber(q.phone)}`} className="min-h-[56px] rounded-[14px] bg-emerald-600 text-white text-base font-bold inline-flex items-center justify-center gap-1.5 no-underline"><Phone size={16} /> Call</a> : <span className="min-h-[56px] rounded-[14px] bg-stone-100 dark:bg-slate-800 text-sm inline-flex items-center justify-center text-stone-500">No phone</span>}
                                        {q.phone ? <a href={`https://wa.me/${waNumber(q.phone)}`} target="_blank" rel="noreferrer" className="min-h-[56px] rounded-[14px] border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-base font-bold inline-flex items-center justify-center gap-1.5 no-underline"><MessageCircle size={16} /> WhatsApp</a> : <span />}
                                    </div>
                                    <div>
                                        <span className={label}>What happened</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            {OUTCOMES.filter(o => o.id !== 'registered').map(o => <button key={o.id} disabled={busy} onClick={() => void patch(q, { outcome: o.id })} className={`${chip(q.outcome === o.id)} min-h-[52px] disabled:opacity-60`}>{o.label}</button>)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className={label}>Follow up on</span>
                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                            <button disabled={busy} onClick={() => void patch(q, { follow_up_on: addDays(t, 1), outcome: 'follow_up' })} className={`${chip(false)} min-h-[52px]`}>Tomorrow</button>
                                            <button disabled={busy} onClick={() => void patch(q, { follow_up_on: addDays(t, 3), outcome: 'follow_up' })} className={`${chip(false)} min-h-[52px]`}>In 3 days</button>
                                            <button disabled={busy} onClick={() => void patch(q, { follow_up_on: addDays(t, 7), outcome: 'follow_up' })} className={`${chip(false)} min-h-[52px]`}>Next week</button>
                                        </div>
                                        <input type="date" value={q.follow_up_on || ''} min={t} onChange={e => e.target.value && void patch(q, { follow_up_on: e.target.value })} className={input} aria-label="Follow-up date" />
                                    </div>
                                    {q.outcome !== 'registered' && <button onClick={() => onRegister({ name: q.visitor_name || '', phone: q.phone || '', email: q.email || '', enquiryId: q.id })} className="w-full min-h-[60px] rounded-[14px] bg-brand text-white text-lg font-extrabold">Register now</button>}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
            {list.length > limit && <button onClick={() => setLimit(l => l + 60)} className="min-h-[48px] px-2 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline">Show more ({list.length - limit} remaining)</button>}
        </div>
    );
};

export default FrontDeskVisitors;
