import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { kampalaToday } from '../../lib/physicalAttendance';
import {
    AgentOption, PaperStudent, agentLabel, importPaperForms, listAgents, newId, parsePasted,
} from '../../lib/paperForms';
import type { FrontDeskData } from './frontDeskData';

const card = 'bg-white dark:bg-night-2 rounded-[22px]';
const input = 'w-full min-h-[56px] rounded-[12px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 px-3 text-base';
const label = 'block mb-1 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400';
const DRAFT_KEY = 'welile-paper-forms-draft-v1';

interface Draft { agentId: string; date: string; defaultLocation: string; students: PaperStudent[] }
interface SkippedStudent { student: PaperStudent; reason: string }

const readDraft = (): Draft => {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
            const d = JSON.parse(raw) as Partial<Draft>;
            return { agentId: d.agentId || '', date: d.date || '', defaultLocation: d.defaultLocation || '', students: Array.isArray(d.students) ? d.students : [] };
        }
    } catch { /* a private window or blocked storage: start empty */ }
    return { agentId: '', date: '', defaultLocation: '', students: [] };
};

const prettyDate = (d: string) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');

/** Entering registrations that agents took on paper forms before the digital switch.
 *  Every student on one sheet shares the agent and the date written on the form. The draft is kept in this browser, so a dropped connection or a refresh loses nothing. */
const FrontDeskPaperForms: React.FC<{ data: FrontDeskData }> = ({ data }) => {
    const initial = useMemo(readDraft, []);
    const today = kampalaToday();

    const [agents, setAgents] = useState<AgentOption[]>([]);
    const [agentsError, setAgentsError] = useState<string | null>(null);
    const [agentId, setAgentId] = useState(initial.agentId);
    const [date, setDate] = useState(initial.date);
    const [defaultLocation, setDefaultLocation] = useState(initial.defaultLocation);
    const [students, setStudents] = useState<PaperStudent[]>(initial.students);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loc, setLoc] = useState(initial.defaultLocation);
    const [editId, setEditId] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const [showPaste, setShowPaste] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [confirm, setConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ inserted: number; agent: string; date: string; skipped: SkippedStudent[] } | null>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const prevDefault = useRef(initial.defaultLocation);

    useEffect(() => {
        void listAgents().then(r => { setAgents(r.agents); setAgentsError(r.error); });
    }, []);

    // Keep the draft in this browser after every change
    useEffect(() => {
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ agentId, date, defaultLocation, students } as Draft)); } catch { /* storage blocked: the sheet still works */ }
    }, [agentId, date, defaultLocation, students]);

    // When the default location changes, the Location box follows it unless the person typed something else there
    useEffect(() => {
        setLoc(l => (l === prevDefault.current ? defaultLocation : l));
        prevDefault.current = defaultLocation;
    }, [defaultLocation]);

    const agent = agents.find(a => a.id === agentId) || null;
    const dateOk = !!date && date <= today;
    const sheetReady = !!agentId && dateOk;
    const preview = useMemo(() => parsePasted(pasteText, defaultLocation), [pasteText, defaultLocation]);

    const clearForm = () => { setName(''); setPhone(''); setEmail(''); setLoc(defaultLocation); setEditId(null); setFormError(null); };

    const addOrUpdate = () => {
        if (name.trim().length < 2) { setFormError('Please type the student\'s name.'); return; }
        if (phone.replace(/\D/g, '').length < 7) { setFormError('Please type a phone number.'); return; }
        const s: PaperStudent = { id: editId || newId(), name: name.trim(), phone: phone.trim(), email: email.trim(), location: loc.trim() };
        setStudents(list => (editId ? list.map(x => (x.id === editId ? s : x)) : [...list, s]));
        clearForm();
        nameRef.current?.focus();
    };

    const edit = (s: PaperStudent) => {
        setEditId(s.id); setName(s.name); setPhone(s.phone); setEmail(s.email); setLoc(s.location); setFormError(null);
        nameRef.current?.focus();
        nameRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    const remove = (id: string) => { setStudents(l => l.filter(x => x.id !== id)); if (editId === id) clearForm(); };

    const addPasted = () => {
        if (preview.students.length === 0) return;
        setStudents(l => [...l, ...preview.students]);
        setPasteText('');
        setShowPaste(false);
    };

    const save = async () => {
        if (!sheetReady || students.length === 0 || saving) return;
        setSaving(true);
        setError(null);
        const sent = students.map(s => ({
            name: s.name.trim(), phone: s.phone.trim(), email: s.email.trim() || null,
            location: (s.location.trim() || defaultLocation.trim()) || null, registered_on: date, agent_id: agentId, note: null,
        }));
        const res = await importPaperForms(sent);
        setSaving(false);
        setConfirm(false);
        if (!res.ok) {
            // Keep the list so nothing is lost. If some were saved before the problem, say so, so they are not added twice.
            setError(res.inserted > 0
                ? `${res.inserted} students were saved before a problem stopped the rest (${res.error}). Check People before trying again, so nobody is added twice.`
                : `Could not save: ${res.error || 'unknown problem'}. Nothing was added, so you can try again.`);
            return;
        }
        // Match each skipped row back to the student typed. The name is the safest match; the position is the fallback.
        const skipped: SkippedStudent[] = res.skipped.map(sk => {
            const byName = students.filter(s => s.name.trim().toLowerCase() === (sk.name || '').trim().toLowerCase());
            const student = byName.length === 1 ? byName[0] : students[sk.row] || students[sk.row - 1] || byName[0] || { id: newId(), name: sk.name || '', phone: '', email: '', location: '' };
            return { student, reason: sk.reason };
        });
        setResult({ inserted: res.inserted, agent: agent ? agentLabel(agent) : '', date, skipped });
        setStudents([]);
        clearForm();
        void data.reload();
    };

    const fixAndReAdd = (sk: SkippedStudent) => {
        setStudents(l => (l.some(x => x.id === sk.student.id) ? l : [...l, sk.student]));
        setResult(r => (r ? { ...r, skipped: r.skipped.filter(x => x !== sk) } : r));
        edit(sk.student);
    };

    const nextSheet = () => { setResult(null); setError(null); clearForm(); };

    if (result && students.length === 0 && !editId) {
        return (
            <section className="space-y-4" aria-live="polite">
                <div className={`${card} p-5 text-center space-y-3`}>
                    <CheckCircle2 size={44} className="mx-auto text-emerald-600" aria-hidden />
                    <p className="m-0 text-2xl font-extrabold">Saved {result.inserted} {result.inserted === 1 ? 'student' : 'students'}</p>
                    <p className="m-0 text-base text-stone-600 dark:text-slate-300">Credited to {result.agent || 'the agent'} on {prettyDate(result.date)}.</p>
                </div>
                {error && <p role="alert" className="m-0 rounded-[12px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
                {result.skipped.length > 0 && (
                    <div className="rounded-[22px] border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 space-y-3">
                        <p className="m-0 text-base font-extrabold text-red-800 dark:text-red-300">{result.skipped.length} not saved</p>
                        <ul className="m-0 p-0 list-none space-y-2">
                            {result.skipped.map((sk, i) => (
                                <li key={`${sk.student.id}-${i}`} className="rounded-[14px] bg-white dark:bg-night-2 border border-red-200 dark:border-red-900 p-3">
                                    <p className="m-0 font-bold text-base break-words">{sk.student.name || '(no name)'}</p>
                                    <p className="m-0 text-sm text-stone-500 dark:text-slate-400 break-all">{[sk.student.phone, sk.student.email].filter(Boolean).join(' · ') || 'no phone or email'}</p>
                                    <p className="m-0 mt-1 text-sm text-red-700 dark:text-red-300">{sk.reason}</p>
                                    <button onClick={() => fixAndReAdd(sk)} className="mt-2 min-h-[52px] w-full rounded-[12px] border border-red-300 dark:border-red-800 text-base font-bold text-red-800 dark:text-red-300">Fix and re-add</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <button onClick={nextSheet} className="w-full min-h-[60px] rounded-[14px] bg-brand text-white text-lg font-extrabold">Start next sheet</button>
                <p className="m-0 text-center text-sm text-stone-500 dark:text-slate-400">The agent, date and location stay the same. Change them on the next screen if the next sheet is different.</p>
            </section>
        );
    }

    return (
        <div className="space-y-4">
            <p className="m-0 text-sm text-stone-500 dark:text-slate-400">Enter students from a paper form. Pick the agent who took the forms and the date written on them, then add each student. Everyone on this sheet is credited to that agent on that date.</p>

            {/* Sheet details stay in view while you type */}
            <section className={`${card} p-4 space-y-3 sticky top-[68px] z-20 border border-stone-200 dark:border-slate-700 shadow-sm`}>
                <h2 className="m-0 text-base font-extrabold">Sheet details</h2>
                <label className="block">
                    <span className={label}>Agent *</span>
                    <select value={agentId} onChange={e => setAgentId(e.target.value)} className={input} aria-required="true">
                        <option value="">{agents.length === 0 && !agentsError ? 'Loading agents...' : 'Choose the agent'}</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{agentLabel(a)}</option>)}
                    </select>
                    {agentsError && <span role="alert" className="block mt-1 text-sm text-red-700 dark:text-red-300">Could not load the agents: {agentsError}</span>}
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className={label}>Date on the form *</span>
                        <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} className={input} aria-required="true" />
                    </label>
                    <label className="block">
                        <span className={label}>Default location</span>
                        <input value={defaultLocation} onChange={e => setDefaultLocation(e.target.value)} className={input} autoComplete="off" placeholder="e.g. Gayaza" />
                    </label>
                </div>
                {date && date > today && <p role="alert" className="m-0 text-sm text-red-700 dark:text-red-300">The date cannot be in the future.</p>}
            </section>

            {/* Fast entry */}
            <section className={`${card} p-4 space-y-3`}>
                <h2 className="m-0 text-base font-extrabold">{editId ? 'Edit this student' : 'Add a student'}</h2>
                <label className="block">
                    <span className={label}>Name *</span>
                    <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} className={input} autoComplete="off" enterKeyHint="next" />
                </label>
                <label className="block">
                    <span className={label}>Phone *</span>
                    <input value={phone} onChange={e => setPhone(e.target.value)} className={input} inputMode="tel" autoComplete="off" placeholder="07XX XXX XXX" enterKeyHint="next" />
                </label>
                <label className="block">
                    <span className={label}>Email (optional)</span>
                    <input value={email} onChange={e => setEmail(e.target.value)} className={input} inputMode="email" autoComplete="off" enterKeyHint="next" />
                    <span className="block mt-1 text-xs text-stone-500 dark:text-slate-400">No email on the form? Leave it empty.</span>
                </label>
                <label className="block">
                    <span className={label}>Location</span>
                    <input value={loc} onChange={e => setLoc(e.target.value)} className={input} autoComplete="off" enterKeyHint="done"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOrUpdate(); } }} />
                </label>
                {formError && <p role="alert" className="m-0 text-sm text-red-700 dark:text-red-300">{formError}</p>}
                <div className="flex gap-2">
                    <button onClick={addOrUpdate} className="flex-1 min-h-[60px] rounded-[14px] bg-brand text-white text-lg font-extrabold inline-flex items-center justify-center gap-2"><Plus size={20} /> {editId ? 'Update student' : 'Add to list'}</button>
                    {editId && <button onClick={clearForm} className="min-h-[60px] px-5 rounded-[14px] border border-stone-300 dark:border-slate-600 text-base font-bold">Cancel</button>}
                </div>
            </section>

            {/* Paste a list */}
            <section className={`${card} p-4`}>
                <button onClick={() => setShowPaste(v => !v)} aria-expanded={showPaste} className="w-full min-h-[56px] flex items-center justify-between gap-3 text-left text-base font-extrabold bg-transparent border-0 cursor-pointer text-inherit">
                    <span>Paste a list <span className="block text-sm font-normal text-stone-500 dark:text-slate-400">One student per line: name, phone, then email or location</span></span>
                    <ChevronDown size={20} className={showPaste ? 'rotate-180' : ''} aria-hidden />
                </button>
                {showPaste && (
                    <div className="mt-2 space-y-3">
                        <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={6} className={`${input} py-3 font-mono`} placeholder={'Mary Nakato, 0772123456, Gayaza\nJohn Okello, 0701234567, john@mail.com, Kyanja'} aria-label="Pasted list" />
                        {pasteText.trim() && (
                            <p className="m-0 text-sm text-stone-600 dark:text-slate-300" aria-live="polite">
                                <b>{preview.students.length}</b> {preview.students.length === 1 ? 'student' : 'students'} found
                                {preview.unreadable.length > 0 && <span className="text-red-700 dark:text-red-300"> · {preview.unreadable.length} {preview.unreadable.length === 1 ? 'line' : 'lines'} need a name and a phone number</span>}
                            </p>
                        )}
                        <button onClick={addPasted} disabled={preview.students.length === 0} className="w-full min-h-[56px] rounded-[14px] bg-brand text-white text-base font-extrabold disabled:opacity-50">Add {preview.students.length || ''} to the list</button>
                    </div>
                )}
            </section>

            {/* The list */}
            <section className="space-y-2" aria-label="Students ready to save">
                <h2 className="m-0 text-base font-extrabold">{students.length} {students.length === 1 ? 'student' : 'students'} ready</h2>
                {students.length === 0 && <p className="m-0 py-4 text-center text-stone-500 dark:text-slate-400">Nobody added yet.</p>}
                <ul className="m-0 p-0 list-none space-y-2">
                    {students.map(s => (
                        <li key={s.id} className={`flex items-start gap-2 rounded-[14px] border p-3 bg-white dark:bg-night-2 ${editId === s.id ? 'border-violet-500' : 'border-stone-200 dark:border-slate-700'}`}>
                            <div className="min-w-0 flex-1">
                                <p className="m-0 font-bold text-base break-words">{s.name}</p>
                                <p className="m-0 text-sm text-stone-500 dark:text-slate-400 break-all">{[s.phone, s.email].filter(Boolean).join(' · ')}</p>
                                {(s.location || defaultLocation) && <p className="m-0 text-sm text-stone-500 dark:text-slate-400">{s.location || defaultLocation}</p>}
                            </div>
                            <button onClick={() => edit(s)} aria-label={`Edit ${s.name}`} className="shrink-0 min-w-[48px] min-h-[48px] rounded-[12px] border border-stone-200 dark:border-slate-700 inline-flex items-center justify-center"><Pencil size={17} /></button>
                            <button onClick={() => remove(s.id)} aria-label={`Remove ${s.name}`} className="shrink-0 min-w-[48px] min-h-[48px] rounded-[12px] border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 inline-flex items-center justify-center"><Trash2 size={17} /></button>
                        </li>
                    ))}
                </ul>
            </section>

            {error && <p role="alert" className="m-0 rounded-[12px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}

            {/* Save: always in reach, above the bottom bar on a phone */}
            <div className="sticky bottom-[104px] lg:bottom-4 z-20">
                <button
                    onClick={() => setConfirm(true)}
                    disabled={!sheetReady || students.length === 0 || saving}
                    className="w-full min-h-[64px] px-4 rounded-[16px] bg-emerald-600 text-white text-base font-extrabold shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                    {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
                        : !agentId ? 'Choose the agent first'
                        : !dateOk ? 'Choose the date on the form'
                        : students.length === 0 ? 'Add a student to save'
                        : `Save all ${students.length} ${students.length === 1 ? 'student' : 'students'} under ${agent?.display_name || 'the agent'} on ${prettyDate(date)}`}
                </button>
            </div>

            {confirm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Confirm save">
                    <button aria-label="Cancel" onClick={() => setConfirm(false)} className="absolute inset-0 bg-black/40 border-0 cursor-default" />
                    <div className="relative w-full sm:max-w-[420px] rounded-t-[24px] sm:rounded-[24px] bg-panel dark:bg-night p-5 space-y-4" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
                        <p className="m-0 text-lg font-extrabold">This will add {students.length} {students.length === 1 ? 'student' : 'students'} to {agent ? agentLabel(agent) : 'the agent'}. Continue?</p>
                        <p className="m-0 text-sm text-stone-600 dark:text-slate-300">They will show as registered on {prettyDate(date)} and count in this agent's numbers.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirm(false)} className="min-h-[56px] rounded-[14px] border border-stone-300 dark:border-slate-600 text-base font-bold">Cancel</button>
                            <button onClick={() => void save()} disabled={saving} className="min-h-[56px] rounded-[14px] bg-emerald-600 text-white text-base font-extrabold disabled:opacity-60 inline-flex items-center justify-center gap-2">{saving ? <Loader2 size={16} className="animate-spin" /> : null} Yes, save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FrontDeskPaperForms;
