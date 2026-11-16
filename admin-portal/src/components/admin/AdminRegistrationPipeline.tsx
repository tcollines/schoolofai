import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Mail, MessageCircle, Phone, RefreshCw, Search } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';

interface Row {
    key: string; name: string; email: string | null; phone: string | null; location: string | null;
    sources: string[]; agent: string | null; registered_at: string; has_account: boolean;
    stage: 'Registered' | 'Account opened' | 'In course' | 'Studying' | 'Joined live' | 'Completed';
    last_active: string | null; followup: 'new' | 'contacted' | 'interested' | 'converted' | 'not_interested'; note: string | null;
}

const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm';
const STAGES: Row['stage'][] = ['Registered', 'Account opened', 'In course', 'Studying', 'Joined live', 'Completed'];
const STAGE_HELP: Record<string, string> = {
    'Registered': 'Registered, no account yet', 'Account opened': 'Has an account', 'In course': 'In the course, not started',
    'Studying': 'Studying the recorded lessons', 'Joined live': 'Joined a live class', 'Completed': 'Completed and certified'
};
const FOLLOW: { id: Row['followup']; label: string }[] = [
    { id: 'new', label: 'To contact' }, { id: 'contacted', label: 'Contacted' }, { id: 'interested', label: 'Interested' },
    { id: 'converted', label: 'Converted' }, { id: 'not_interested', label: 'Not interested' }
];
const waNumber = (p: string) => (p.startsWith('0') ? '256' + p.slice(1) : p);
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-');

/** Everyone who registered for the free course, with or without an account, merged from every source, with follow-up. */
const AdminRegistrationPipeline: React.FC<{ course: string }> = ({ course }) => {
    const [rows, setRows] = useState<Row[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState<string>('all');
    const [source, setSource] = useState<string>('all');
    const [follow, setFollow] = useState<string>('all');
    const [q, setQ] = useState('');
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [limit, setLimit] = useState(30);

    const load = useCallback(async () => {
        const { data, error: err } = await supabaseClient.rpc('admin_registration_pipeline', { p_course: course });
        if (err) { setError(err.message); return; }
        setError(null); setRows((data || []) as Row[]);
    }, [course]);
    useEffect(() => { void load(); }, [load]);

    const counts = useMemo(() => {
        const r = rows || [];
        const idx = (s: Row['stage']) => STAGES.indexOf(s);
        return {
            total: r.length,
            noAccount: r.filter(x => !x.has_account).length,
            accounts: r.filter(x => x.has_account).length,
            inCourse: r.filter(x => idx(x.stage) >= 2).length,
            studying: r.filter(x => idx(x.stage) >= 3).length,
            live: r.filter(x => idx(x.stage) >= 4).length,
            completed: r.filter(x => x.stage === 'Completed').length,
            toContact: r.filter(x => x.followup === 'new' && x.stage !== 'Completed').length
        };
    }, [rows]);
    const sources = useMemo(() => Array.from(new Set((rows || []).flatMap(r => r.sources))).sort(), [rows]);

    const filtered = useMemo(() => (rows || []).filter(r => {
        if (stage !== 'all' && r.stage !== stage) return false;
        if (source !== 'all' && !r.sources.includes(source)) return false;
        if (follow !== 'all' && r.followup !== follow) return false;
        if (q.trim()) {
            const hay = `${r.name} ${r.email || ''} ${r.phone || ''} ${r.location || ''} ${r.agent || ''}`.toLowerCase();
            if (!hay.includes(q.trim().toLowerCase())) return false;
        }
        return true;
    }), [rows, stage, source, follow, q]);

    const setFollowup = async (r: Row, status: Row['followup'], note: string | null) => {
        setSaving(r.key);
        const { error: err } = await supabaseClient.rpc('admin_set_followup', { p_key: r.key, p_status: status, p_note: note });
        setSaving(null);
        if (err) { setError(err.message); return; }
        setRows(prev => (prev || []).map(x => x.key === r.key ? { ...x, followup: status, note } : x));
    };

    const exportCsv = () => {
        const head = ['Name', 'Email', 'Phone', 'Location', 'Source', 'Agent', 'Registered', 'Stage', 'Last active', 'Follow-up', 'Note'];
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const lines = filtered.map(r => [r.name, r.email, r.phone ? '+' + r.phone : '', r.location, r.sources.join('; '), r.agent, r.registered_at.slice(0, 10), r.stage, r.last_active?.slice(0, 10), r.followup, r.note].map(esc).join(','));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' }));
        a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
    };

    const tiles: [string, number, string][] = [
        ['All registrations', counts.total, 'every person, with or without an account'],
        ['No account yet', counts.noAccount, 'to follow up and convert'],
        ['Accounts', counts.accounts, 'signed up'],
        ['In the course', counts.inCourse, 'enrolled'],
        ['Studying', counts.studying, 'started lessons'],
        ['Joined live', counts.live, 'attended a class'],
        ['Completed', counts.completed, 'certified']
    ];
    const select = 'rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm';

    return (
        <section className={`${card} p-5`} aria-label="Registrations and follow-up">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-bold text-lg">Registrations and follow-up</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Everyone who registered for the free course counts, even before they create an account. Follow up and move them to studying.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportCsv} disabled={!rows} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 disabled:opacity-50"><Download size={16} /> Export</button>
                    <button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700"><RefreshCw size={16} /> Refresh</button>
                </div>
            </div>

            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            {!rows && !error && <div className="mt-4 flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin" size={18} /> Loading registrations...</div>}

            {rows && (
                <>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
                        {tiles.map(([l, n, s]) => (
                            <button key={l} onClick={() => setStage(l === 'No account yet' ? 'Registered' : l === 'Completed' ? 'Completed' : l === 'Joined live' ? 'Joined live' : l === 'Studying' ? 'Studying' : 'all')} className="text-left rounded-xl bg-violet-50 dark:bg-violet-950/30 p-3 hover:ring-2 hover:ring-violet-400">
                                <p className="text-xs text-gray-500">{l}</p><p className="text-2xl font-extrabold">{n}</p><p className="text-[11px] text-gray-500 leading-tight">{s}</p>
                            </button>
                        ))}
                    </div>
                    <p className="mt-3 text-sm">{counts.toContact} {counts.toContact === 1 ? 'person has' : 'people have'} not been contacted yet.</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <div className="relative"><Search size={14} className="absolute left-2.5 top-3 text-gray-400" /><input value={q} onChange={e => { setQ(e.target.value); setLimit(30); }} placeholder="Search name, email, phone, place, agent" className={`${select} pl-8 w-64 max-w-full`} /></div>
                        <select value={stage} onChange={e => { setStage(e.target.value); setLimit(30); }} className={select} aria-label="Stage"><option value="all">All stages</option>{STAGES.map(s => <option key={s} value={s}>{STAGE_HELP[s]}</option>)}</select>
                        <select value={source} onChange={e => { setSource(e.target.value); setLimit(30); }} className={select} aria-label="Source"><option value="all">All sources</option>{sources.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select value={follow} onChange={e => { setFollow(e.target.value); setLimit(30); }} className={select} aria-label="Follow-up"><option value="all">Any follow-up</option>{FOLLOW.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
                    </div>

                    <ul className="mt-3 divide-y divide-gray-100 dark:divide-slate-800">
                        {filtered.slice(0, limit).map(r => (
                            <li key={r.key} className="py-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold">{r.name || '(no name)'} <span className={`ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.has_account ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{r.stage}</span></p>
                                        <p className="text-xs text-gray-500 break-all">{[r.email, r.phone ? '+' + r.phone : null, r.location].filter(Boolean).join(' · ')}</p>
                                        <p className="text-xs text-gray-500">{r.sources.join(', ')}{r.agent ? ` · ${r.agent}` : ''} · registered {day(r.registered_at)}{r.last_active ? ` · last active ${day(r.last_active)}` : ''}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {r.phone && <a href={`tel:+${waNumber(r.phone)}`} aria-label="Call" className="p-2 rounded-lg border border-gray-200 dark:border-slate-700"><Phone size={15} /></a>}
                                        {r.phone && <a href={`https://wa.me/${waNumber(r.phone)}?text=${encodeURIComponent(`Hello ${(r.name || '').split(' ')[0]}, this is Welile School of AI. You registered for our free AI Fundamentals course. Can we help you get started?`)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="p-2 rounded-lg border border-gray-200 dark:border-slate-700"><MessageCircle size={15} /></a>}
                                        {r.email && <a href={`mailto:${r.email}`} aria-label="Email" className="p-2 rounded-lg border border-gray-200 dark:border-slate-700"><Mail size={15} /></a>}
                                    </div>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 items-center">
                                    <select value={r.followup} onChange={e => void setFollowup(r, e.target.value as Row['followup'], notes[r.key] ?? r.note)} className={select} aria-label="Follow-up status">{FOLLOW.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
                                    <input value={notes[r.key] ?? r.note ?? ''} onChange={e => setNotes(n => ({ ...n, [r.key]: e.target.value }))} onBlur={() => { if ((notes[r.key] ?? r.note ?? '') !== (r.note ?? '')) void setFollowup(r, r.followup, notes[r.key] ?? null); }} placeholder="Follow-up note" className={`${select} flex-1 min-w-[10rem]`} />
                                    {saving === r.key && <Loader2 size={14} className="animate-spin text-gray-400" />}
                                </div>
                            </li>
                        ))}
                        {filtered.length === 0 && <li className="py-4 text-sm text-gray-500">No one matches those filters.</li>}
                    </ul>
                    {filtered.length > limit && <button onClick={() => setLimit(l => l + 50)} className="mt-3 text-sm font-semibold text-violet-700">Show more ({filtered.length - limit} left)</button>}
                </>
            )}
        </section>
    );
};

export default AdminRegistrationPipeline;
