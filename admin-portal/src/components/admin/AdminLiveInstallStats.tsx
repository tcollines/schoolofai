import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, RefreshCw, Smartphone, Video } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';

// Live-class attendance and app-install numbers, read from learn_events (admin can read all rows).
// Event types: live_joined (payload.lecture, payload.method), app_install_available / _clicked / app_installed / _dismissed, app_opened.

interface Ev { user_id: string; event_type: string; item_id: string | null; payload: any; device: string | null; created_at: string }
interface Learner { user_id: string; name: string; email: string }

const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm';
const LECTURES: Record<string, string> = { 'lecture-1': 'Lecture 1 (Modules 1 and 2)', 'lecture-2': 'Lecture 2 (Modules 3 and 4)', 'lecture-3': 'Lecture 3 (Modules 5 and 6)' };
const TYPES = ['live_joined', 'app_install_available', 'app_install_clicked', 'app_installed', 'app_install_dismissed', 'app_opened'];

const AdminLiveInstallStats: React.FC<{ course: string; learners: Learner[]; enrolled: number }> = ({ course, learners, enrolled }) => {
    const [events, setEvents] = useState<Ev[] | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const all: Ev[] = [];
        for (let from = 0; from < 20000; from += 1000) {
            const { data, error } = await supabaseClient.from('learn_events').select('user_id,event_type,item_id,payload,device,created_at')
                .eq('course_slug', course).in('event_type', TYPES).order('created_at', { ascending: false }).range(from, from + 999);
            if (error) { setErr(error.message); setLoading(false); return; }
            all.push(...((data as Ev[]) || []));
            if (!data || data.length < 1000) break;
        }
        setErr(null);
        setEvents(all);
        setLoading(false);
    }, [course]);
    useEffect(() => { void load(); }, [load]);

    const who = useMemo(() => new Map(learners.map(l => [l.user_id, l])), [learners]);
    const distinct = (type: string) => new Set((events || []).filter(e => e.event_type === type).map(e => e.user_id));

    const m = useMemo(() => {
        const ev = events || [];
        const installed = distinct('app_installed');
        const opened = distinct('app_opened');
        const available = distinct('app_install_available');
        const clicked = distinct('app_install_clicked');
        const everInstalled = new Set([...installed, ...opened]);
        const byLecture = Object.keys(LECTURES).map(id => {
            const rows = ev.filter(e => e.event_type === 'live_joined' && e.payload?.lecture === id);
            const users = new Set(rows.map(r => r.user_id));
            const joined = new Set(rows.filter(r => r.payload?.method !== 'self_confirmed').map(r => r.user_id));
            return { id, label: LECTURES[id], attended: users.size, joined: joined.size, confirmed: users.size - [...users].filter(u => joined.has(u)).length };
        });
        const attendees = new Set(ev.filter(e => e.event_type === 'live_joined').map(e => e.user_id));
        return { installed: everInstalled.size, opened: opened.size, available: available.size, clicked: clicked.size, byLecture, attendees: attendees.size };
    }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

    const exportAttendance = () => {
        const rows = (events || []).filter(e => e.event_type === 'live_joined').map(e => {
            const l = who.get(e.user_id);
            return [l?.name || '', l?.email || '', LECTURES[e.payload?.lecture] || e.payload?.lecture || '', e.payload?.method || '', e.payload?.title || '', e.created_at];
        });
        const csv = [['Name', 'Email', 'Lecture', 'How recorded', 'Session', 'Recorded at'], ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `live-attendance-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

    return (
        <div className={`${card} p-5`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-bold text-lg flex items-center gap-2"><Video size={18} /> Live attendance and app installs</h3>
                <div className="flex gap-2">
                    <button onClick={exportAttendance} disabled={!events} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"><Download size={15} /> Export attendance</button>
                    <button onClick={load} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
                </div>
            </div>
            {err && <p className="mt-3 text-sm text-red-600">Could not read events: {err}</p>}
            {!events && !err && <p className="mt-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Loading...</p>}
            {events && (
                <>
                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1"><Smartphone size={14} /> App installed</p><p className="text-3xl font-extrabold mt-1">{m.installed}</p><p className="text-xs text-gray-500">{pct(m.installed, enrolled)}% of registered</p></div>
                        <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Opened from the app</p><p className="text-3xl font-extrabold mt-1">{m.opened}</p><p className="text-xs text-gray-500">people</p></div>
                        <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Saw the install option</p><p className="text-3xl font-extrabold mt-1">{m.available}</p><p className="text-xs text-gray-500">{m.clicked} tapped Install</p></div>
                        <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attended a live class</p><p className="text-3xl font-extrabold mt-1">{m.attendees}</p><p className="text-xs text-gray-500">{pct(m.attendees, enrolled)}% of registered</p></div>
                    </div>
                    <table className="mt-5 w-full text-sm">
                        <thead><tr className="text-left text-gray-500 text-xs uppercase tracking-wide"><th className="py-2">Live lecture</th><th className="text-right">Attended</th><th className="text-right">Joined by link</th><th className="text-right">Confirmed after</th></tr></thead>
                        <tbody>{m.byLecture.map(l => (
                            <tr key={l.id} className="border-t border-gray-100 dark:border-slate-800"><td className="py-2">{l.label}</td><td className="text-right font-semibold">{l.attended}</td><td className="text-right text-gray-500">{l.joined}</td><td className="text-right text-gray-500">{l.confirmed}</td></tr>
                        ))}</tbody>
                    </table>
                    <p className="mt-3 text-xs text-gray-500">People who attend a lecture only need to take the quizzes for its modules. "Joined by link" means they pressed Join in the course; "Confirmed after" means they confirmed on the Live page after the class.</p>
                </>
            )}
        </div>
    );
};

export default AdminLiveInstallStats;
