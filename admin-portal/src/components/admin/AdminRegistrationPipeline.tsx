import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Mail, MessageCircle, Phone, RefreshCw, Search } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';

type Stage = 'Registered' | 'Account opened' | 'In course' | 'Studying' | 'Joined live' | 'Completed';
interface Row {
    key: string; name: string; email: string | null; phone: string | null; location: string | null;
    sources: string[]; agent: string | null; registered_at: string; has_account: boolean; stage: Stage;
    last_active: string | null; followup: 'new' | 'contacted' | 'interested' | 'converted' | 'not_interested'; note: string | null;
}

const STAGES: { id: Stage; tab: string; help: string }[] = [
    { id: 'Registered', tab: 'Registered, no account', help: 'Registered but no account yet. These need a follow-up.' },
    { id: 'Account opened', tab: 'Account opened', help: 'Has an account but has not joined the course yet.' },
    { id: 'In course', tab: 'In the course', help: 'Enrolled, has not started a lesson.' },
    { id: 'Studying', tab: 'Studying', help: 'Watching the recorded lessons.' },
    { id: 'Joined live', tab: 'Joined live', help: 'Attended at least one live class.' },
    { id: 'Completed', tab: 'Completed', help: 'Passed and certified.' }
];
const FOLLOW = [['new', 'To contact'], ['contacted', 'Contacted'], ['interested', 'Interested'], ['converted', 'Converted'], ['not_interested', 'Not interested']] as const;
const wa = (p: string) => (p.startsWith('0') ? '256' + p.slice(1) : p);
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-');
const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm';
const field = 'rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm';

/** One simple table of everyone who registered for the free course. Tabs filter it by stage. */
const AdminRegistrationPipeline: React.FC<{ course: string }> = ({ course }) => {
    const [rows, setRows] = useState<Row[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'all' | Stage>('Registered');
    const [q, setQ] = useState('');
    const [limit, setLimit] = useState(40);
    const [notes, setNotes] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        const { data, error: err } = await supabaseClient.rpc('admin_registration_pipeline', { p_course: course });
        if (err) { setError(err.message); return; }
        setError(null); setRows((data || []) as Row[]);
    }, [course]);
    useEffect(() => { void load(); }, [load]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: rows?.length || 0 };
        STAGES.forEach(s => { c[s.id] = (rows || []).filter(r => r.stage === s.id).length; });
        return c;
    }, [rows]);

    const shown = useMemo(() => (rows || []).filter(r => {
        if (tab !== 'all' && r.stage !== tab) return false;
        if (q.trim() && !`${r.name} ${r.email || ''} ${r.phone || ''} ${r.location || ''} ${r.agent || ''}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
        return true;
    }), [rows, tab, q]);

    const save = async (r: Row, status: Row['followup'], note: string | null) => {
        setRows(prev => (prev || []).map(x => x.key === r.key ? { ...x, followup: status, note } : x));
        const { error: err } = await supabaseClient.rpc('admin_set_followup', { p_key: r.key, p_status: status, p_note: note });
        if (err) setError(err.message);
    };

    const exportCsv = () => {
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const head = ['Name', 'Email', 'Phone', 'Location', 'Source', 'Agent', 'Registered', 'Stage', 'Last active', 'Follow-up', 'Note'];
        const lines = shown.map(r => [r.name, r.email, r.phone ? '+' + r.phone : '', r.location, r.sources.join('; '), r.agent, r.registered_at.slice(0, 10), r.stage, r.last_active?.slice(0, 10), r.followup, r.note].map(esc).join(','));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' }));
        a.download = `free-course-${tab === 'all' ? 'all' : tab.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
    };

    const help = tab === 'all' ? 'Everyone who registered for the free course, with or without an account.' : STAGES.find(s => s.id === tab)?.help;

    return (
        <section className={`${card} p-4 sm:p-5`} aria-label="Free course registrations">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Stage">
                    {[{ id: 'all' as const, tab: 'All' }, ...STAGES].map(s => (
                        <button key={s.id} role="tab" aria-selected={tab === s.id} onClick={() => { setTab(s.id as any); setLimit(40); }}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${tab === s.id ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                            {s.tab} <span className={tab === s.id ? 'opacity-90' : 'text-gray-500'}>{counts[s.id] ?? 0}</span>
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={exportCsv} disabled={!rows} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 disabled:opacity-50"><Download size={15} /> Export</button>
                    <button onClick={() => void load()} aria-label="Refresh" className="inline-flex items-center px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-slate-700"><RefreshCw size={15} /></button>
                </div>
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">{help}</p>
            <div className="relative mt-3 max-w-sm"><Search size={14} className="absolute left-2.5 top-3 text-gray-400" /><input value={q} onChange={e => { setQ(e.target.value); setLimit(40); }} placeholder="Search name, email, phone, place, agent" className={`${field} pl-8 w-full`} /></div>

            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            {!rows && !error && <div className="mt-4 flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin" size={18} /> Loading...</div>}

            {rows && (
                <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                        <thead><tr className="text-left text-xs uppercase text-gray-500">
                            <th className="py-2 pr-3">Name</th><th className="pr-3">Contact</th><th className="pr-3">Source</th><th className="pr-3">Registered</th><th className="pr-3">Stage</th><th className="pr-3">Follow-up</th><th>Note</th>
                        </tr></thead>
                        <tbody>
                            {shown.slice(0, limit).map(r => (
                                <tr key={r.key} className="border-t border-gray-100 dark:border-slate-800 align-top">
                                    <td className="py-2.5 pr-3 font-medium">{r.name || '(no name)'}{r.location ? <span className="block text-xs font-normal text-gray-500">{r.location}</span> : null}</td>
                                    <td className="pr-3">
                                        <div className="flex items-center gap-1.5">
                                            {r.phone && <a href={`tel:+${wa(r.phone)}`} aria-label="Call" className="p-1.5 rounded-md border border-gray-200 dark:border-slate-700"><Phone size={13} /></a>}
                                            {r.phone && <a href={`https://wa.me/${wa(r.phone)}?text=${encodeURIComponent(`Hello ${(r.name || '').split(' ')[0]}, this is Welile School of AI. You registered for our free AI Fundamentals course. Can we help you get started?`)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="p-1.5 rounded-md border border-gray-200 dark:border-slate-700"><MessageCircle size={13} /></a>}
                                            {r.email && <a href={`mailto:${r.email}`} aria-label="Email" className="p-1.5 rounded-md border border-gray-200 dark:border-slate-700"><Mail size={13} /></a>}
                                        </div>
                                        <span className="block text-xs text-gray-500 mt-1 break-all">{r.phone ? '+' + r.phone : r.email}</span>
                                    </td>
                                    <td className="pr-3 text-xs">{r.sources.join(', ')}{r.agent ? <span className="block text-gray-500">{r.agent}</span> : null}</td>
                                    <td className="pr-3 whitespace-nowrap">{day(r.registered_at)}</td>
                                    <td className="pr-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${r.has_account ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{r.stage === 'Registered' ? 'No account yet' : r.stage}</span></td>
                                    <td className="pr-3"><select value={r.followup} onChange={e => void save(r, e.target.value as Row['followup'], notes[r.key] ?? r.note)} className={field} aria-label="Follow-up status">{FOLLOW.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select></td>
                                    <td><input value={notes[r.key] ?? r.note ?? ''} onChange={e => setNotes(n => ({ ...n, [r.key]: e.target.value }))} onBlur={() => { if ((notes[r.key] ?? r.note ?? '') !== (r.note ?? '')) void save(r, r.followup, notes[r.key] ?? null); }} placeholder="Add a note" className={`${field} w-40`} /></td>
                                </tr>
                            ))}
                            {shown.length === 0 && <tr><td colSpan={7} className="py-6 text-gray-500">No one in this list.</td></tr>}
                        </tbody>
                    </table>
                    {shown.length > limit && <button onClick={() => setLimit(l => l + 60)} className="mt-3 text-sm font-semibold text-violet-700">Show more ({shown.length - limit} left)</button>}
                </div>
            )}
        </section>
    );
};

export default AdminRegistrationPipeline;
