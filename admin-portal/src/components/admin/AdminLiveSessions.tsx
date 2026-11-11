import React, { useCallback, useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { MODULES } from '../../content/aiFundamentals';
import { Check, Copy, Edit3, ExternalLink, Eye, EyeOff, Loader2, Plus, Trash2, Video, X } from 'lucide-react';
import AdminAuthPrompt, { MissingDbNotice } from './AdminAuthPrompt';

interface Session {
    id: string;
    course_slug: string;
    module_id: string | null;
    title: string;
    description: string | null;
    host_name: string | null;
    starts_at: string;
    ends_at: string;
    meet_link: string | null;
    recording_url: string | null;
    is_published: boolean;
}

const COURSE_SLUG = 'ai-fundamentals';
const EAT = '+03:00'; // East Africa Time has no daylight saving
const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm';
const input = 'w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';

const toEatParts = (iso: string) => {
    const d = new Date(new Date(iso).getTime() + 3 * 3600 * 1000); // shift to EAT then read as UTC
    return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16) };
};
const fmt = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Kampala', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

const isMissingTable = (m: string) => /schema cache|does not exist|could not find the table/i.test(m);

const blank = { title: '', description: '', host: '', module: '', date: '', start: '18:00', end: '19:00', meet: '', recording: '', published: true, repeat: 1 };

const AdminLiveSessions: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [missingDb, setMissingDb] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState(blank);
    const [editing, setEditing] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [remStatus, setRemStatus] = useState<Record<string, { sent: number; failed: number; email: number; whatsapp: number }>>({});

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error: err } = await supabaseClient.from('live_sessions').select('*').eq('course_slug', COURSE_SLUG).order('starts_at', { ascending: false });
        if (err) { if (isMissingTable(err.message)) setMissingDb(true); else setError(err.message); } else { setError(null); setMissingDb(false); setSessions((data || []) as Session[]); }
        setLoading(false);
        // Reminder counts per session (admin-only RPC; ignored if the reminders migration is not applied yet)
        const { data: rs } = await supabaseClient.rpc('reminders_status', { p_course: COURSE_SLUG });
        const m: Record<string, { sent: number; failed: number; email: number; whatsapp: number }> = {};
        for (const r of (Array.isArray(rs) ? rs : []) as { session_id: string; channel: string; status: string; n: number }[]) {
            const e = m[r.session_id] || (m[r.session_id] = { sent: 0, failed: 0, email: 0, whatsapp: 0 });
            if (r.status === 'sent') { e.sent += r.n; if (r.channel === 'email') e.email += r.n; else if (r.channel === 'whatsapp') e.whatsapp += r.n; }
            else if (r.status === 'failed') e.failed += r.n;
        }
        setRemStatus(m);
    }, []);
    useEffect(() => { void load(); }, [load]);

    const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

    const startNew = () => { setEditing(null); setForm(blank); setError(null); setOpen(true); };
    const startEdit = (s: Session) => {
        const a = toEatParts(s.starts_at), b = toEatParts(s.ends_at);
        setEditing(s.id);
        setForm({ title: s.title, description: s.description || '', host: s.host_name || '', module: s.module_id || '', date: a.date, start: a.time, end: b.time, meet: s.meet_link || '', recording: s.recording_url || '', published: s.is_published, repeat: 1 });
        setError(null);
        setOpen(true);
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.title.trim()) return setError('Please enter a title.');
        if (!form.date) return setError('Please choose a date.');
        const startIso = new Date(`${form.date}T${form.start}:00${EAT}`);
        const endIso = new Date(`${form.date}T${form.end}:00${EAT}`);
        if (isNaN(startIso.getTime()) || isNaN(endIso.getTime())) return setError('Please check the date and times.');
        if (endIso <= startIso) return setError('The end time must be after the start time.');
        for (const [label, url] of [['Meeting link', form.meet], ['Recording link', form.recording]] as const) {
            if (url.trim() && !/^https:\/\//i.test(url.trim())) return setError(`${label} must start with https://`);
        }

        const base = {
            course_slug: COURSE_SLUG, module_id: form.module || null, title: form.title.trim(), description: form.description.trim() || null,
            host_name: form.host.trim() || null, meet_link: form.meet.trim() || null, recording_url: form.recording.trim() || null, is_published: form.published
        };
        setSaving(true);
        let err;
        if (editing) {
            ({ error: err } = await supabaseClient.from('live_sessions').update({ ...base, starts_at: startIso.toISOString(), ends_at: endIso.toISOString() }).eq('id', editing));
        } else {
            const count = Math.min(Math.max(Number(form.repeat) || 1, 1), 26);
            const rows = Array.from({ length: count }, (_, i) => ({
                ...base,
                starts_at: new Date(startIso.getTime() + i * 7 * 86400000).toISOString(),
                ends_at: new Date(endIso.getTime() + i * 7 * 86400000).toISOString()
            }));
            ({ error: err } = await supabaseClient.from('live_sessions').insert(rows));
        }
        setSaving(false);
        if (err) {
            if (/row-level security|permission denied|not authorized/i.test(err.message)) setNeedsAuth(true);
            setError(err.message);
            return;
        }
        setOpen(false);
        setNeedsAuth(false);
        await load();
    };

    const remove = async (s: Session) => {
        if (!window.confirm(`Delete "${s.title}" (${fmt(s.starts_at)})? This cannot be undone.`)) return;
        const { error: err } = await supabaseClient.from('live_sessions').delete().eq('id', s.id);
        if (err) { setError(err.message); if (/row-level security|permission denied/i.test(err.message)) setNeedsAuth(true); return; }
        await load();
    };

    const togglePublish = async (s: Session) => {
        const { error: err } = await supabaseClient.from('live_sessions').update({ is_published: !s.is_published }).eq('id', s.id);
        if (err) { setError(err.message); if (/row-level security|permission denied/i.test(err.message)) setNeedsAuth(true); return; }
        await load();
    };

    const upcoming = sessions.filter(s => new Date(s.ends_at).getTime() >= Date.now()).reverse();
    const past = sessions.filter(s => new Date(s.ends_at).getTime() < Date.now());

    const Row = ({ s }: { s: Session }) => (
        <li className="py-3.5 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
                <p className="font-medium flex items-center gap-2">{s.title}{!s.is_published && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-slate-700">Hidden</span>}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{fmt(s.starts_at)} EAT{s.host_name ? ` · ${s.host_name}` : ''}{s.module_id ? ` · ${MODULES.find(m => m.id === s.module_id)?.title || s.module_id}` : ''}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{(() => {
                    const r = remStatus[s.id];
                    if (!r) return 'Reminders: none sent yet';
                    return `Reminders: ${r.sent} sent (${r.email} email, ${r.whatsapp} WhatsApp)${r.failed ? `, ${r.failed} failed` : ''}`;
                })()}</p>
            </div>
            <div className="flex items-center gap-1">
                {s.meet_link && (
                    <button title="Copy join link" onClick={async () => { await navigator.clipboard.writeText(s.meet_link!); setCopied(s.id); setTimeout(() => setCopied(null), 1500); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                        {copied === s.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                )}
                <button title={s.is_published ? 'Hide from students' : 'Show to students'} onClick={() => togglePublish(s)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">{s.is_published ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                <button title="Edit" onClick={() => startEdit(s)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><Edit3 size={16} /></button>
                <button title="Delete" onClick={() => remove(s)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={16} /></button>
            </div>
        </li>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Live Classes</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Schedule live sessions for the free AI Fundamentals course. Times are East Africa Time. Students see them in the course timetable.</p>
                </div>
                <button onClick={startNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white"><Plus size={16} /> New session</button>
            </div>

            {missingDb && <MissingDbNotice />}
            {needsAuth && <AdminAuthPrompt onSignedIn={() => { setNeedsAuth(false); setError(null); void load(); }} />}
            {error && !open && !needsAuth && <p role="alert" className="text-sm text-red-600">{error}</p>}

            {open && (
                <form onSubmit={save} className={`${card} p-5 space-y-4`}>
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold">{editing ? 'Edit session' : 'New session'}</h2>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><X size={18} /></button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="block md:col-span-2"><span className="text-sm font-semibold">Title *</span><input value={form.title} onChange={set('title')} placeholder="Live Clinic: prompting practice" className={`${input} mt-1`} /></label>
                        <label className="block md:col-span-2"><span className="text-sm font-semibold">Description</span><textarea value={form.description} onChange={set('description')} rows={2} className={`${input} mt-1`} /></label>
                        <label className="block"><span className="text-sm font-semibold">Host</span><input value={form.host} onChange={set('host')} className={`${input} mt-1`} /></label>
                        <label className="block"><span className="text-sm font-semibold">Linked module</span>
                            <select value={form.module} onChange={set('module')} className={`${input} mt-1`}>
                                <option value="">Not linked to a module</option>
                                {MODULES.filter(m => m.number > 0).map(m => <option key={m.id} value={m.id}>Module {m.number}: {m.title}</option>)}
                            </select>
                        </label>
                        <label className="block"><span className="text-sm font-semibold">Date (EAT) *</span><input type="date" value={form.date} onChange={set('date')} className={`${input} mt-1`} /></label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block"><span className="text-sm font-semibold">Starts *</span><input type="time" value={form.start} onChange={set('start')} className={`${input} mt-1`} /></label>
                            <label className="block"><span className="text-sm font-semibold">Ends *</span><input type="time" value={form.end} onChange={set('end')} className={`${input} mt-1`} /></label>
                        </div>
                        <label className="block md:col-span-2"><span className="text-sm font-semibold">Meeting link</span>
                            <div className="flex gap-2 mt-1">
                                <input value={form.meet} onChange={set('meet')} placeholder="https://meet.google.com/abc-defg-hij" className={input} />
                                <a href="https://meet.google.com/new" target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1.5 px-3 rounded-lg border border-gray-300 dark:border-slate-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800"><Video size={15} /> Create <ExternalLink size={12} /></a>
                            </div>
                            <span className="text-xs text-gray-500">Students see the Join button 10 minutes before the start.</span>
                        </label>
                        <label className="block md:col-span-2"><span className="text-sm font-semibold">Recording link (add after the class)</span><input value={form.recording} onChange={set('recording')} placeholder="https://" className={`${input} mt-1`} /></label>
                        {!editing && (
                            <label className="block"><span className="text-sm font-semibold">Repeat weekly for</span>
                                <div className="flex items-center gap-2 mt-1"><input type="number" min={1} max={26} value={form.repeat} onChange={set('repeat')} className={`${input} w-24`} /><span className="text-sm text-gray-500">session(s) in total</span></div>
                            </label>
                        )}
                        <label className="flex items-center gap-2 md:col-span-2 text-sm font-medium"><input type="checkbox" checked={form.published} onChange={set('published')} className="accent-violet-600 w-4 h-4" /> Visible to students</label>
                    </div>
                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                    <div className="flex gap-2">
                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />} {editing ? 'Save changes' : 'Create session'}</button>
                        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-slate-700">Cancel</button>
                    </div>
                </form>
            )}

            {loading ? <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin" size={18} /> Loading...</div> : (
                <>
                    <div className={`${card} p-5`}>
                        <h2 className="font-bold">Upcoming</h2>
                        {upcoming.length === 0 ? <p className="text-sm text-gray-500 mt-2">No upcoming sessions. Create one above.</p> : <ul className="divide-y divide-gray-100 dark:divide-slate-800 mt-1">{upcoming.map(s => <Row key={s.id} s={s} />)}</ul>}
                    </div>
                    <div className={`${card} p-5`}>
                        <h2 className="font-bold">Past sessions</h2>
                        {past.length === 0 ? <p className="text-sm text-gray-500 mt-2">Nothing yet.</p> : <ul className="divide-y divide-gray-100 dark:divide-slate-800 mt-1">{past.map(s => <Row key={s.id} s={s} />)}</ul>}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminLiveSessions;
