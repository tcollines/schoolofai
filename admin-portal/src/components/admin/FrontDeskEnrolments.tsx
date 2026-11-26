import React, { useEffect, useMemo, useState } from 'react';
import { EnrolStatus, HqEnrolment, STATUS_LABELS, enrolmentRef, fetchHqEnrolments, sourceLabel, ugx, updateEnrolment } from '../../lib/hqApi';
import type { FrontDeskData } from './frontDeskData';
import { card, chip, errorBox, input, label, prettyDate, toNumber } from './frontDeskUi';

const EDITABLE: EnrolStatus[] = ['active', 'paused', 'withdrawn'];

/** Every enrolment for a course, with its status and money. Tap one to change the status, fee, paid amount, intake, start date or notes. */
const FrontDeskEnrolments: React.FC<{ data: FrontDeskData }> = ({ data }) => {
    const [slug, setSlug] = useState('');
    const [q, setQ] = useState('');
    const [open, setOpen] = useState<string | null>(null);
    const [status, setStatus] = useState<EnrolStatus>('active');
    const [fee, setFee] = useState(''); const [paid, setPaid] = useState('');
    const [intake, setIntake] = useState(''); const [start, setStart] = useState(''); const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [limit, setLimit] = useState(60);

    useEffect(() => { if (!slug && data.courses.length > 0) setSlug((data.courses.find(c => c.slug === 'ai-fundamentals') || data.courses[0]).slug); }, [data.courses, slug]);
    const list = useMemo(() => {
        const term = q.trim().toLowerCase();
        return data.enrolments.filter(e => e.course_slug === slug && (!term || `${e.person_name || ''} ${e.email || ''} ${e.phone || ''}`.toLowerCase().includes(term)));
    }, [data.enrolments, slug, q]);

    const edit = (e: HqEnrolment) => {
        if (open === e.id) { setOpen(null); return; }
        setOpen(e.id); setStatus(e.status); setFee(String(e.fee_ugx || 0)); setPaid(String(e.paid_ugx || 0)); setIntake(e.intake || ''); setStart(e.start_on || ''); setNotes(e.notes || ''); setError(null);
    };
    const save = async (e: HqEnrolment) => {
        setBusy(true); setError(null);
        const patch: Partial<{ status: EnrolStatus; fee_ugx: number; paid_ugx: number; notes: string; intake: string; start_on: string }> = {
            fee_ugx: toNumber(fee), paid_ugx: toNumber(paid), notes, intake, ...(start ? { start_on: start } : {}),
        };
        if (e.status !== 'graduated') patch.status = status;
        const res = await updateEnrolment(slug, enrolmentRef(e), patch);
        setBusy(false);
        if (!res.ok) { setError(res.error || 'Could not save.'); return; }
        const fresh = await fetchHqEnrolments(slug);
        if (fresh.ok) data.setEnrolments(prev => [...prev.filter(x => x.course_slug !== slug), ...(fresh.data || [])]);
        setOpen(null);
    };

    return (
        <div className="space-y-3">
            <section className={`${card} p-4 space-y-3`}>
                <label className="block"><span className={label}>Course</span><select value={slug} onChange={e => setSlug(e.target.value)} className={input}>{data.courses.map(c => <option key={c.slug} value={c.slug}>{c.title}{c.active ? '' : ' (inactive)'}</option>)}</select></label>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, phone or email" aria-label="Search" className={input} />
                <p className="m-0 text-sm text-stone-500 dark:text-slate-400">{list.length} {list.length === 1 ? 'enrolment' : 'enrolments'}</p>
            </section>
            {error && !open && <p role="alert" className={errorBox}>{error}</p>}
            <ul className="m-0 p-0 list-none space-y-2">
                {list.slice(0, limit).map(e => (
                    <li key={e.id} className={`${card} border border-stone-200 dark:border-slate-700`}>
                        <button onClick={() => edit(e)} aria-expanded={open === e.id} className="w-full min-h-[64px] p-4 text-left bg-transparent border-0 cursor-pointer text-inherit">
                            <div className="flex items-start justify-between gap-2"><p className="m-0 text-base font-bold break-words">{e.person_name || '(no name)'}</p><span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-slate-800">{STATUS_LABELS[e.status]}</span></div>
                            <p className="m-0 text-sm text-stone-600 dark:text-slate-300">{e.fee_ugx > 0 ? `Fee ${ugx(e.fee_ugx)} · Paid ${ugx(e.paid_ugx)}${e.fee_ugx > e.paid_ugx ? ` · Balance ${ugx(e.fee_ugx - e.paid_ugx)}` : ''}` : 'Free'}</p>
                            <p className="m-0 text-xs text-stone-500 dark:text-slate-400">{sourceLabel(e.source)}{e.start_on ? ` · started ${prettyDate(e.start_on)}` : ''}{e.intake ? ` · ${e.intake}` : ''}</p>
                        </button>
                        {open === e.id && (
                            <div className="border-t border-stone-200 dark:border-slate-700 p-4 space-y-3">
                                {e.status !== 'graduated' ? (
                                    <div><span className={label}>Status</span><div className="grid grid-cols-3 gap-2">{EDITABLE.map(s => <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className={`${chip(status === s)} min-h-[52px]`}>{STATUS_LABELS[s]}</button>)}</div></div>
                                ) : <p className="m-0 text-sm text-stone-600 dark:text-slate-300">Graduated {prettyDate(e.graduated_on)}. Change this on the Graduation screen.</p>}
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="block"><span className={label}>Fee (UGX)</span><input value={fee} onChange={x => setFee(x.target.value)} className={input} inputMode="numeric" /></label>
                                    <label className="block"><span className={label}>Paid (UGX)</span><input value={paid} onChange={x => setPaid(x.target.value)} className={input} inputMode="numeric" /></label>
                                </div>
                                {toNumber(paid) > toNumber(fee) && <p className="m-0 text-sm font-bold text-red-700 dark:text-red-300">Paid is more than the fee. Please check.</p>}
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="block"><span className={label}>Start date</span><input type="date" value={start} onChange={x => setStart(x.target.value)} className={input} /></label>
                                    <label className="block"><span className={label}>Intake</span><input value={intake} onChange={x => setIntake(x.target.value)} className={input} /></label>
                                </div>
                                <label className="block"><span className={label}>Notes</span><textarea value={notes} onChange={x => setNotes(x.target.value)} rows={2} className={`${input} py-2`} /></label>
                                {error && <p role="alert" className={errorBox}>{error}</p>}
                                <button onClick={() => void save(e)} disabled={busy} className="w-full min-h-[60px] rounded-[14px] bg-brand text-white text-lg font-extrabold disabled:opacity-60">{busy ? 'Saving...' : 'Save changes'}</button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            {list.length === 0 && <p className={`${card} p-5 m-0 text-center text-stone-500 dark:text-slate-400`}>{data.loading ? 'Loading...' : 'No enrolments in this course.'}</p>}
            {list.length > limit && <button onClick={() => setLimit(l => l + 60)} className="min-h-[48px] px-2 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline">Show more ({list.length - limit} remaining)</button>}
        </div>
    );
};

export default FrontDeskEnrolments;
