import React, { useEffect, useState } from 'react';
import { Bell, CalendarPlus, ExternalLink, Loader2, PlayCircle, Video } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { useLearn } from './learnContext';
import { LiveSession, loadLiveSessions } from '../../src/lib/learnApi';
import { COURSE } from '../../src/content/aiFundamentals';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, MUTED, formatEAT, formatLocal } from './learnUi';

const icsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const googleCalendarUrl = (s: LiveSession) => {
    const p = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${s.title} (${COURSE.short} live class)`,
        dates: `${icsDate(s.starts_at)}/${icsDate(s.ends_at)}`,
        details: `${s.description || 'Live class for the free AI Fundamentals course.'}${s.meet_link ? `\nJoin: ${s.meet_link}` : ''}`,
        location: s.meet_link || 'Online'
    });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

const downloadIcs = (s: LiveSession) => {
    const lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Welile School of AI//Live class//EN', 'BEGIN:VEVENT',
        `UID:${s.id}@welile`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
        `DTSTART:${icsDate(s.starts_at)}`, `DTEND:${icsDate(s.ends_at)}`,
        `SUMMARY:${s.title.replace(/[,;]/g, ' ')}`,
        `DESCRIPTION:${(s.description || 'Live class').replace(/\n/g, ' ').replace(/[,;]/g, ' ')}`,
        `LOCATION:${s.meet_link || 'Online'}`, 'END:VEVENT', 'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${s.title.replace(/\W+/g, '-').toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
};

const useNow = () => {
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(t); }, []);
    return now;
};

export const useSessions = () => {
    const [sessions, setSessions] = useState<LiveSession[] | null>(null);
    useEffect(() => { loadLiveSessions().then(setSessions); }, []);
    return sessions;
};

const SessionCard: React.FC<{ s: LiveSession; now: number }> = ({ s, now }) => {
    const start = new Date(s.starts_at).getTime();
    const end = new Date(s.ends_at).getTime();
    const joinable = s.meet_link && now >= start - 10 * 60000 && now <= end;
    const past = now > end;
    const mins = Math.max(0, Math.round((start - now) / 60000));
    const when = mins < 60 ? `in ${mins} min` : mins < 1440 ? `in ${Math.round(mins / 60)} h` : `in ${Math.round(mins / 1440)} days`;

    return (
        <li className={`${CARD} rounded-2xl p-5`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-semibold leading-snug">{s.title}</p>
                    {s.host_name && <p className={`text-sm ${MUTED}`}>with {s.host_name}</p>}
                </div>
                {!past && !joinable && <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300">{when}</span>}
                {joinable && <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Live now</span>}
            </div>
            <p className="mt-3 text-sm font-medium">{formatEAT(s.starts_at)} EAT</p>
            <p className={`text-sm ${MUTED}`}>Your time: {formatLocal(s.starts_at)}</p>
            {s.description && <p className={`mt-2 text-sm ${MUTED}`}>{s.description}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
                {!past && (
                    <>
                        <a
                            href={joinable ? s.meet_link : undefined}
                            target="_blank" rel="noreferrer"
                            aria-disabled={!joinable}
                            className={`${joinable ? BTN_PRIMARY : BTN_SECONDARY + ' opacity-60 pointer-events-none'} !py-2.5 !px-4 !text-sm`}
                        >
                            <Video size={16} /> {joinable ? 'Join now' : 'Join opens 10 min before'}
                        </a>
                        <a href={googleCalendarUrl(s)} target="_blank" rel="noreferrer" className={`${BTN_SECONDARY} !py-2.5 !px-4 !text-sm`}><CalendarPlus size={16} /> Google Calendar</a>
                        <button onClick={() => downloadIcs(s)} className={`${BTN_SECONDARY} !py-2.5 !px-4 !text-sm`}>.ics</button>
                    </>
                )}
                {past && s.recording_url && (
                    <a href={s.recording_url} target="_blank" rel="noreferrer" className={`${BTN_SECONDARY} !py-2.5 !px-4 !text-sm`}><PlayCircle size={16} /> Watch the replay <ExternalLink size={14} /></a>
                )}
                {past && !s.recording_url && <span className={`text-sm ${MUTED}`}>Replay will be posted here.</span>}
            </div>
        </li>
    );
};

const E164 = /^\+[1-9][0-9]{7,14}$/;

const ReminderCard: React.FC = () => {
    const { uid, email: accountEmail } = useLearn();
    const [loaded, setLoaded] = useState(false);
    const [emailOn, setEmailOn] = useState(true);
    const [waOn, setWaOn] = useState(false);
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [unavailable, setUnavailable] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { data, error } = await supabase.from('live_reminder_prefs')
                    .select('email_opt_in, whatsapp_opt_in, phone_e164').eq('user_id', uid).maybeSingle();
                if (!alive) return;
                if (error) { setUnavailable(true); return; }
                if (data) { setEmailOn(data.email_opt_in); setWaOn(data.whatsapp_opt_in); setPhone(data.phone_e164 || ''); }
            } catch { if (alive) setUnavailable(true); }
            finally { if (alive) setLoaded(true); }
        })();
        return () => { alive = false; };
    }, [uid]);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        const cleaned = phone.replace(/[\s-]/g, '');
        if (waOn && !E164.test(cleaned)) { setMsg({ ok: false, text: 'Enter your WhatsApp number with the country code, for example +256700123456.' }); return; }
        if (cleaned && !E164.test(cleaned)) { setMsg({ ok: false, text: 'That number does not look right. Use the format +256700123456, or leave it empty.' }); return; }
        setSaving(true);
        const { error } = await supabase.from('live_reminder_prefs').upsert({
            user_id: uid, email: accountEmail || null, email_opt_in: emailOn,
            whatsapp_opt_in: waOn, phone_e164: cleaned || null
        }, { onConflict: 'user_id' });
        setSaving(false);
        setMsg(error ? { ok: false, text: 'We could not save that just now. Please try again.' } : { ok: true, text: 'Saved. We will remind you 24 hours and 1 hour before each live class.' });
    };

    if (unavailable) return null;
    const field = 'mt-1 w-full rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600';

    return (
        <form onSubmit={save} className={`${CARD} rounded-2xl p-5 mt-6`} style={{ background: '#faf8f5' }} aria-busy={!loaded}>
            <h2 className="font-serif text-xl font-semibold flex items-center gap-2"><Bell size={18} className="text-violet-700" /> Remind me</h2>
            <p className={`mt-1 text-sm ${MUTED}`}>Get a gentle reminder 24 hours and 1 hour before each live class.</p>

            <label className="mt-4 flex items-start gap-3 text-sm">
                <input type="checkbox" checked={emailOn} onChange={e => setEmailOn(e.target.checked)} disabled={!loaded} className="mt-0.5 w-4 h-4 accent-violet-700" />
                <span><span className="font-medium">Email</span>{accountEmail && <span className={MUTED}> to {accountEmail}</span>}</span>
            </label>

            <label className="mt-3 flex items-start gap-3 text-sm">
                <input type="checkbox" checked={waOn} onChange={e => setWaOn(e.target.checked)} disabled={!loaded} className="mt-0.5 w-4 h-4 accent-violet-700" />
                <span><span className="font-medium">WhatsApp</span><span className={MUTED}> (I agree to receive class reminders on WhatsApp)</span></span>
            </label>
            {waOn && (
                <label className="block mt-3 text-sm">
                    <span className="font-medium">WhatsApp number</span>
                    <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+256700123456" className={field} />
                    <span className={`block mt-1 text-xs ${MUTED}`}>Include the country code. You can switch this off at any time.</span>
                </label>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={saving || !loaded} className={`${BTN_PRIMARY} !py-2.5 !px-4 !text-sm disabled:opacity-60`}>
                    {saving && <Loader2 size={16} className="animate-spin" />} Save reminders
                </button>
                {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-emerald-800' : 'text-red-700'}`}>{msg.text}</p>}
            </div>
        </form>
    );
};

const LivePanel: React.FC = () => {
    const sessions = useSessions();
    const now = useNow();
    const upcoming = (sessions || []).filter(s => new Date(s.ends_at).getTime() >= now);
    const past = (sessions || []).filter(s => new Date(s.ends_at).getTime() < now).reverse();

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="font-serif text-3xl font-semibold">Live classes</h1>
            <p className={`mt-2 ${MUTED}`}>Optional sessions to ask questions and practise with others. Times are shown in East Africa Time, with your local time underneath. Live classes are not required for your certificate.</p>

            {sessions === null && <p className={`mt-8 ${MUTED}`}>Loading the timetable...</p>}

            {sessions !== null && (
                <>
                    <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">Upcoming</h2>
                    {upcoming.length === 0
                        ? <div className={`${CARD} rounded-2xl p-5 mt-3`}>
                            <p className="font-semibold">Live classes run every Monday, Wednesday and Friday at 2:00 pm</p>
                            <p className={`mt-1 text-sm ${MUTED}`}>East Africa Time. The next sessions will appear here with a join button that opens 10 minutes before the start.</p>
                        </div>
                        : <ul className="mt-3 space-y-4">{upcoming.map(s => <SessionCard key={s.id} s={s} now={now} />)}</ul>}

                    {past.length > 0 && (
                        <>
                            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">Past sessions and replays</h2>
                            <ul className="mt-3 space-y-4">{past.map(s => <SessionCard key={s.id} s={s} now={now} />)}</ul>
                        </>
                    )}
                </>
            )}

            <ReminderCard />
        </div>
    );
};

export default LivePanel;
