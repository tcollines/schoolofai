import React, { useCallback, useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { MODULES } from '../../content/aiFundamentals';
import {
    Check, ChevronDown, ChevronUp, Copy, Download, Edit3, ExternalLink,
    Eye, EyeOff, Link2, Loader2, Plus, Trash2, UserCheck, Users, Video, X
} from 'lucide-react';
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

interface Attendee {
    user_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    source: string;
    method: string;
    joined_at: string;
}

interface SessionAttendance {
    session_id: string;
    identified_count: number;
    guest_clicks: number;
    total_clicks: number;
    by_source: Record<string, number>;
    attendees: Attendee[];
}

const COURSE_SLUG = 'ai-fundamentals';
const EAT = '+03:00'; // East Africa Time has no daylight saving
const card = 'bg-white dark:bg-night-2 rounded-[22px]';
const input = 'w-full rounded-[12px] bg-white dark:bg-night-2 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

const toEatParts = (iso: string) => {
    const d = new Date(new Date(iso).getTime() + 3 * 3600 * 1000);
    return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16) };
};
const fmt = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Kampala', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour: '2-digit', minute: '2-digit', hour12: false });

const isMissingTable = (m: string) => /schema cache|does not exist|could not find the table/i.test(m);

const blank = { title: '', description: '', host: '', module: '', date: '', start: '18:00', end: '19:00', meet: '', recording: '', published: true, repeat: 1 };

const SOURCE_LABELS: Record<string, string> = {
    app: 'In-App',
    join_click: 'In-App',
    email: 'Email Link',
    calendar: 'Calendar Invite',
    whatsapp: 'WhatsApp Link',
    outreach: 'Outreach Email',
    direct: 'Direct Link',
    self_confirmed: 'Self-Confirmed',
    admin_marked: 'Admin Check-In',
};

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
    const [attendance, setAttendance] = useState<Record<string, SessionAttendance>>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [manualEmails, setManualEmails] = useState<Record<string, string>>({});
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [markNotice, setMarkNotice] = useState<Record<string, string>>({});

    const origin = typeof window !== 'undefined' ? window.location.origin.replace('admin.', '') : 'https://www.welileschoolofai.org';

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error: err } = await supabaseClient.from('live_sessions').select('*').eq('course_slug', COURSE_SLUG).order('starts_at', { ascending: false });
        if (err) { if (isMissingTable(err.message)) setMissingDb(true); else setError(err.message); } else { setError(null); setMissingDb(false); setSessions((data || []) as Session[]); }
        setLoading(false);

        const [rsRes, attRes] = await Promise.all([
            supabaseClient.rpc('reminders_status', { p_course: COURSE_SLUG }),
            supabaseClient.rpc('admin_live_attendance', { p_course: COURSE_SLUG }),
        ]);

        const m: Record<string, { sent: number; failed: number; email: number; whatsapp: number }> = {};
        for (const r of (Array.isArray(rsRes.data) ? rsRes.data : []) as { session_id: string; channel: string; status: string; n: number }[]) {
            const e = m[r.session_id] || (m[r.session_id] = { sent: 0, failed: 0, email: 0, whatsapp: 0 });
            if (r.status === 'sent') { e.sent += r.n; if (r.channel === 'email') e.email += r.n; else if (r.channel === 'whatsapp') e.whatsapp += r.n; }
            else if (r.status === 'failed') e.failed += r.n;
        }
        setRemStatus(m);

        const attMap: Record<string, SessionAttendance> = {};
        for (const a of (Array.isArray(attRes.data) ? attRes.data : []) as SessionAttendance[]) {
            attMap[a.session_id] = a;
        }
        setAttendance(attMap);
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
        if (err) { setError(err.message); if (/row-level security|permission denied|not authorized/i.test(err.message)) setNeedsAuth(true); return; }
        await load();
    };

    const togglePublish = async (s: Session) => {
        const { error: err } = await supabaseClient.from('live_sessions').update({ is_published: !s.is_published }).eq('id', s.id);
        if (err) { setError(err.message); if (/row-level security|permission denied|not authorized/i.test(err.message)) setNeedsAuth(true); return; }
        await load();
    };

    const copyText = async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(null), 1600);
        } catch { /* ignore */ }
    };

    const submitManualCheckIn = async (sessionId: string) => {
        const raw = (manualEmails[sessionId] || '').trim();
        const emails = raw.split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(x => x.includes('@'));
        if (emails.length === 0) {
            setMarkNotice(n => ({ ...n, [sessionId]: 'Paste one or more student email addresses separated by commas or new lines.' }));
            return;
        }
        setMarkingId(sessionId);
        const { data, error: err } = await supabaseClient.rpc('admin_mark_live_attendance', {
            p_session_id: sessionId,
            p_emails: emails,
        });
        setMarkingId(null);
        if (err) {
            setMarkNotice(n => ({ ...n, [sessionId]: `Error: ${err.message}` }));
            return;
        }
        const d: any = data || {};
        const unmatched: string[] = d.unmatched || [];
        setMarkNotice(n => ({
            ...n,
            [sessionId]: `Credited ${d.added ?? 0} new attendee(s) (${d.matched ?? 0} matched).${unmatched.length ? ` Not found: ${unmatched.join(', ')}` : ''}`,
        }));
        if (d.added > 0) {
            setManualEmails(m => ({ ...m, [sessionId]: '' }));
            await load();
        }
    };

    const exportSessionAttendees = (s: Session, att: SessionAttendance) => {
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = [
            ['Session', 'Name', 'Email', 'Phone', 'Channel / Source', 'Joined At'],
            ...att.attendees.map(a => [s.title, a.name, a.email || '', a.phone || '', SOURCE_LABELS[a.source] || a.source, a.joined_at]),
        ];
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv' }));
        a.download = `live-attendance-${s.starts_at.slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const upcoming = sessions.filter(s => new Date(s.ends_at).getTime() >= Date.now()).reverse();
    const past = sessions.filter(s => new Date(s.ends_at).getTime() < Date.now());

    const Row = ({ s }: { s: Session }) => {
        const att = attendance[s.id];
        const identified = att?.identified_count ?? 0;
        const guest = att?.guest_clicks ?? 0;
        const totalEst = identified + guest;
        const isOpen = expandedId === s.id;
        const trackedUrl = `${origin}/live/join/${s.id}?src=whatsapp`;

        return (
            <li className="py-4 space-y-3">
                <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{s.title}</p>
                            {!s.is_published && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-slate-700">Hidden</span>}
                            <button
                                type="button"
                                onClick={() => setExpandedId(isOpen ? null : s.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60"
                            >
                                <Users size={12} />
                                {totalEst} joined{guest > 0 ? ` (${identified} signed in · ${guest} guest)` : ''}
                                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        </div>
                        <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">
                            {fmt(s.starts_at)} EAT{s.host_name ? ` · ${s.host_name}` : ''}{s.module_id ? ` · ${MODULES.find(m => m.id === s.module_id)?.title || s.module_id}` : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-slate-400 mt-1">
                            <span>{(() => {
                                const r = remStatus[s.id];
                                if (!r) return 'Reminders: none sent yet';
                                return `Reminders: ${r.sent} sent (${r.email} email, ${r.whatsapp} WhatsApp)${r.failed ? `, ${r.failed} failed` : ''}`;
                            })()}</span>
                            {att && Object.keys(att.by_source || {}).length > 0 && (
                                <span className="text-violet-700 dark:text-violet-300 font-medium">
                                    Channels: {Object.entries(att.by_source).map(([src, n]) => `${SOURCE_LABELS[src] || src} ${n}`).join(' · ')}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        {s.meet_link && (
                            <>
                                <button
                                    title="Copy tracked share link (counts joins from WhatsApp, groups, or email)"
                                    onClick={() => copyText(trackedUrl, `tracked-${s.id}`)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[12px] text-xs font-semibold border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                                >
                                    {copied === `tracked-${s.id}` ? <><Check size={14} /> Tracked link copied</> : <><Link2 size={14} /> Copy tracked link</>}
                                </button>
                                <button
                                    title="Copy raw Google Meet link"
                                    onClick={() => copyText(s.meet_link!, `raw-${s.id}`)}
                                    className="p-2 rounded-[12px] hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500"
                                >
                                    {copied === `raw-${s.id}` ? <Check size={15} className="text-mint" /> : <Copy size={15} />}
                                </button>
                            </>
                        )}
                        <button title={s.is_published ? 'Hide from students' : 'Show to students'} onClick={() => togglePublish(s)} className="p-2 rounded-[12px] hover:bg-stone-100 dark:hover:bg-slate-800">{s.is_published ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                        <button title="Edit" onClick={() => startEdit(s)} className="p-2 rounded-[12px] hover:bg-stone-100 dark:hover:bg-slate-800"><Edit3 size={16} /></button>
                        <button title="Delete" onClick={() => remove(s)} className="p-2 rounded-[12px] hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={16} /></button>
                    </div>
                </div>

                {/* Expandable Attendees + Manual Check-in Drawer */}
                {isOpen && (
                    <div className="rounded-[14px] bg-stone-50 dark:bg-slate-800/40 border border-stone-200 dark:border-slate-800 p-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="font-bold text-sm">Tracked Attendance for this Session</h3>
                                <p className="text-xs text-stone-500 dark:text-slate-400">
                                    Email reminders, calendar invites, and the tracked share link automatically record attendance here.
                                </p>
                            </div>
                            {att && att.attendees.length > 0 && (
                                <button
                                    onClick={() => exportSessionAttendees(s, att)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[12px] text-xs font-semibold bg-white dark:bg-night-2 hover:bg-stone-50"
                                >
                                    <Download size={13} /> Export Attendees
                                </button>
                            )}
                        </div>

                        {s.meet_link && (
                            <div className="text-xs bg-white dark:bg-night-2 rounded-[12px] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-stone-600 dark:text-slate-300 break-all">
                                    <strong className="text-violet-700 dark:text-violet-300">Shareable Tracked Link:</strong> {trackedUrl}
                                </span>
                                <button onClick={() => copyText(trackedUrl, `box-${s.id}`)} className="font-semibold text-violet-700 dark:text-violet-300 hover:underline shrink-0">
                                    {copied === `box-${s.id}` ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        )}

                        {att && att.attendees.length > 0 ? (
                            <div className="overflow-x-auto rounded-[12px] bg-white dark:bg-night-2">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left uppercase text-stone-500 border-b border-stone-100 dark:border-slate-800">
                                            <th className="py-2 px-3">Learner</th>
                                            <th className="py-2 px-3">Contact</th>
                                            <th className="py-2 px-3">Joined Via</th>
                                            <th className="py-2 px-3 text-right">Time (EAT)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                                        {att.attendees.map(a => (
                                            <tr key={a.user_id}>
                                                <td className="py-2 px-3 font-medium">{a.name}</td>
                                                <td className="py-2 px-3 text-stone-500">{[a.email, a.phone].filter(Boolean).join(' · ')}</td>
                                                <td className="py-2 px-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 font-semibold">
                                                        {SOURCE_LABELS[a.source] || a.source}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-stone-500">{fmtTime(a.joined_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-xs text-stone-500">No signed-in learners recorded yet for this session.</p>
                        )}

                        {guest > 0 && (
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                + <strong>{guest}</strong> guest visitor{guest === 1 ? '' : 's'} clicked the tracked join link without signing in ({att?.total_clicks ?? guest} total link clicks).
                            </p>
                        )}

                        {/* Manual Attendance Check-In */}
                        <div className="border-t border-stone-200 dark:border-slate-700 pt-3 space-y-2">
                            <p className="text-xs font-bold flex items-center gap-1.5">
                                <UserCheck size={14} className="text-violet-600" />
                                Record extra Google Meet attendees (if anyone joined outside the tracked link)
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    value={manualEmails[s.id] || ''}
                                    onChange={e => setManualEmails(m => ({ ...m, [s.id]: e.target.value }))}
                                    placeholder="Paste student email(s), separated by commas or spaces..."
                                    className={`${input} !py-2 text-xs`}
                                />
                                <button
                                    type="button"
                                    disabled={markingId === s.id}
                                    onClick={() => void submitManualCheckIn(s.id)}
                                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold bg-brand hover:bg-brand-mid text-white disabled:opacity-60"
                                >
                                    {markingId === s.id ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                                    Credit Attendance
                                </button>
                            </div>
                            {markNotice[s.id] && <p className="text-xs text-mint dark:text-emerald-400 font-medium">{markNotice[s.id]}</p>}
                        </div>
                    </div>
                )}
            </li>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">Live Classes</h1>
                    <p className="text-sm text-stone-500 dark:text-slate-400">
                        Schedule live sessions, share tracked join links (so email, WhatsApp &amp; calendar attendees are always counted), and inspect exact attendance.
                    </p>
                </div>
                <button onClick={startNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-semibold bg-brand hover:bg-brand-mid text-white"><Plus size={16} /> New session</button>
            </div>

            {missingDb && <MissingDbNotice />}
            {needsAuth && <AdminAuthPrompt onSignedIn={() => { setNeedsAuth(false); setError(null); void load(); }} />}
            {error && !open && !needsAuth && <p role="alert" className="text-sm text-red-600">{error}</p>}

            {open && (
                <form onSubmit={save} className={`${card} p-5 space-y-4`}>
                    <div className="flex items-center justify-between">
                        <h2 className="m-0 text-[16px] font-extrabold">{editing ? 'Edit session' : 'New session'}</h2>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-2 rounded-[12px] hover:bg-stone-100 dark:hover:bg-slate-800"><X size={18} /></button>
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
                                <a href="https://meet.google.com/new" target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1.5 px-3 rounded-[12px] border border-stone-300 dark:border-slate-700 text-sm font-medium hover:bg-stone-50 dark:hover:bg-slate-800"><Video size={15} /> Create <ExternalLink size={12} /></a>
                            </div>
                            <span className="text-xs text-stone-500">Reminders and share links automatically route through our tracked join URL before opening Google Meet.</span>
                        </label>
                        <label className="block md:col-span-2"><span className="text-sm font-semibold">Recording link (add after the class)</span><input value={form.recording} onChange={set('recording')} placeholder="https://" className={`${input} mt-1`} /></label>
                        {!editing && (
                            <label className="block"><span className="text-sm font-semibold">Repeat weekly for</span>
                                <div className="flex items-center gap-2 mt-1"><input type="number" min={1} max={26} value={form.repeat} onChange={set('repeat')} className={`${input} w-24`} /><span className="text-sm text-stone-500">session(s) in total</span></div>
                            </label>
                        )}
                        <label className="flex items-center gap-2 md:col-span-2 text-sm font-medium"><input type="checkbox" checked={form.published} onChange={set('published')} className="accent-violet-600 w-4 h-4" /> Visible to students</label>
                    </div>
                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                    <div className="flex gap-2">
                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-semibold bg-brand hover:bg-brand-mid text-white disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />} {editing ? 'Save changes' : 'Create session'}</button>
                        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-[12px] text-sm font-medium border border-stone-300 dark:border-slate-700">Cancel</button>
                    </div>
                </form>
            )}

            {loading ? <div className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={18} /> Loading...</div> : (
                <>
                    <div className={`${card} p-5`}>
                        <h2 className="m-0 text-[16px] font-extrabold">Upcoming</h2>
                        {upcoming.length === 0 ? <p className="text-sm text-stone-500 mt-2">No upcoming sessions. Create one above.</p> : <ul className="divide-y divide-stone-100 dark:divide-slate-800 mt-1">{upcoming.map(s => <Row key={s.id} s={s} />)}</ul>}
                    </div>
                    <div className={`${card} p-5`}>
                        <h2 className="m-0 text-[16px] font-extrabold">Past sessions</h2>
                        {past.length === 0 ? <p className="text-sm text-stone-500 mt-2">Nothing yet.</p> : <ul className="divide-y divide-stone-100 dark:divide-slate-800 mt-1">{past.map(s => <Row key={s.id} s={s} />)}</ul>}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminLiveSessions;
