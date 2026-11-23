import React, { useEffect, useState } from 'react';
import { Bell, CalendarPlus, Users, ExternalLink, Loader2, PlayCircle, Video } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { useLearn } from './learnContext';
import { LiveSession, loadLiveSessions } from '../../src/lib/learnApi';
import { COURSE } from '../../src/content/aiFundamentals';
import { lectureForSession, moduleLabel, recordAttendance } from '../../src/lib/liveClass';
import { trackedLiveJoinUrl } from '../../src/lib/analytics';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, MUTED, formatEAT, formatLocal } from './learnUi';

const icsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export const googleCalendarUrl = (s: LiveSession, uid?: string) => {
    const joinUrl = s.meet_link ? trackedLiveJoinUrl(s.id, uid, 'calendar') : '';
    const p = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${s.title} (${COURSE.short} live class)`,
        dates: `${icsDate(s.starts_at)}/${icsDate(s.ends_at)}`,
        details: `${s.description || 'Live class for the free AI Fundamentals course.'}${joinUrl ? `\nJoin: ${joinUrl}` : ''}`,
        location: joinUrl || 'Online'
    });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

const downloadIcs = (s: LiveSession, uid?: string) => {
    const joinUrl = s.meet_link ? trackedLiveJoinUrl(s.id, uid, 'calendar') : '';
    const lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Welile School of AI//Live class//EN', 'BEGIN:VEVENT',
        `UID:${s.id}@welile`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
        `DTSTART:${icsDate(s.starts_at)}`, `DTEND:${icsDate(s.ends_at)}`,
        `SUMMARY:${s.title.replace(/[,;]/g, ' ')}`,
        `DESCRIPTION:${(s.description || 'Live class').replace(/\n/g, ' ').replace(/[,;]/g, ' ')}${joinUrl ? ` Join: ${joinUrl}` : ''}`,
        `LOCATION:${joinUrl || 'Online'}`, 'END:VEVENT', 'END:VCALENDAR'
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

interface Timetable { enrolled: boolean; my_group: string | null; my_cohort: string | null; sessions: { id: string; week: string; cohort: string; mine: boolean; attended: boolean }[]; }
const useTimetable = () => {
    const [tt, setTt] = useState<Timetable | null>(null);
    useEffect(() => {
        let alive = true;
        supabase.rpc('live_timetable', { p_course: 'ai-fundamentals' }).then(({ data, error }) => { if (alive && !error && data) setTt(data as Timetable); });
        return () => { alive = false; };
    }, []);
    return tt;
};
const weekLabel = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });

const GroupBanner: React.FC<{ tt: Timetable | null }> = ({ tt }) => {
    if (!tt || !tt.enrolled) return null;
    return (
        <div className={`${CARD} p-5 mt-6 flex gap-3`}>
            <Users size={20} className="text-brand dark:text-violet-400 shrink-0 mt-0.5" />
            <div className="text-sm">
                {tt.my_group
                    ? <>
                        <p className="font-semibold text-base">You are in the {tt.my_cohort} cohort, group of the week of {weekLabel(tt.my_group)}</p>
                        <p className={`mt-1 ${MUTED}`}>We send your live-class reminders for that week. You can still join any live class on this page, in any week. Your recorded course is open to you right now.</p>
                    </>
                    : <>
                        <p className="font-semibold text-base">Your group starts when the next live week is scheduled</p>
                        <p className={`mt-1 ${MUTED}`}>Your recorded course is open to you right now. We will email your timetable as soon as the next week of live classes is announced. Until then you are welcome to join any class listed here.</p>
                    </>}
            </div>
        </div>
    );
};

const SessionBadges: React.FC<{ id: string; tt: Timetable | null }> = ({ id, tt }) => {
    const row = tt?.sessions.find(x => x.id === id);
    if (!row) return null;
    return (
        <div className="mb-1.5 flex flex-wrap gap-2 text-xs font-medium">
            <span className="px-2.5 py-1 rounded-full bg-white dark:bg-night-2">{row.cohort} · week of {weekLabel(row.week)}</span>
            {row.mine && <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-ink dark:bg-night-3 dark:text-violet-200">Your group</span>}
            {!row.mine && <span className="px-2 py-0.5 rounded-full bg-lime-100 text-lime-900">Open to everyone</span>}
            {row.attended && <span className="px-2 py-0.5 rounded-full bg-mint-soft text-[#0E5A35]">You attended</span>}
        </div>
    );
};

const SessionCard: React.FC<{ s: LiveSession; now: number }> = ({ s, now }) => {
    const { uid, attended, refreshAttendance } = useLearn();
    const lecture = lectureForSession(s);
    const wasThere = !!lecture && attended.has(lecture.id);
    const [confirming, setConfirming] = useState(false);
    const start = new Date(s.starts_at).getTime();
    const end = new Date(s.ends_at).getTime();
    const joinable = s.meet_link && now >= start - 10 * 60000 && now <= end;
    const past = now > end;
    const canConfirm = past && !wasThere && !!lecture && now - end < 48 * 3600000;
    const onJoin = async () => { await recordAttendance(uid, s, 'join_click'); void refreshAttendance(); };
    const confirmAttended = async () => { setConfirming(true); await recordAttendance(uid, s, 'self_confirmed'); await refreshAttendance(); setConfirming(false); };
    const mins = Math.max(0, Math.round((start - now) / 60000));
    const when = mins < 60 ? `in ${mins} min` : mins < 1440 ? `in ${Math.round(mins / 60)} h` : `in ${Math.round(mins / 1440)} days`;

    return (
        <li className={`${CARD} p-5`}>
            <div className="flex items-start gap-4">
                <div aria-hidden="true" className={`shrink-0 w-[60px] rounded-[16px] text-center py-2 ${joinable ? 'bg-[#F0533A] text-white' : past ? 'bg-panel dark:bg-night-3 text-[#6B6680]' : 'bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300'}`}>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.08em]">{formatEAT(s.starts_at, { weekday: 'short', day: undefined, month: undefined, hour: undefined, minute: undefined })}</span>
                    <span className="block text-[22px] font-extrabold leading-tight">{formatEAT(s.starts_at, { weekday: undefined, day: 'numeric', month: undefined, hour: undefined, minute: undefined })}</span>
                    <span className="block text-[11px] font-semibold">{formatEAT(s.starts_at, { weekday: undefined, day: undefined, month: 'short', hour: undefined, minute: undefined })}</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="m-0 text-[16px] font-extrabold leading-snug">{s.title}</p>
                    {s.host_name && <p className={`text-sm ${MUTED}`}>with {s.host_name}</p>}
                    {lecture && <p className={`text-xs mt-1 ${MUTED}`}>{lecture.label}: {moduleLabel(lecture)}</p>}
                </div>
                {!past && !joinable && <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300">{when}</span>}
                {joinable && <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[#FDECE8] text-[#C23A22]"><span className="w-1.5 h-1.5 rounded-full bg-[#F0533A] animate-pulse" aria-hidden="true" />Live now</span>}
            </div>
            <p className="mt-3 mb-0 text-sm font-bold">{formatEAT(s.starts_at)} EAT</p>
            <p className={`text-sm ${MUTED}`}>Your time: {formatLocal(s.starts_at)}</p>
            {s.description && <p className={`mt-2 text-sm ${MUTED}`}>{s.description}</p>}

            <div className="mt-4 pt-4 border-t border-[#EEEBF6] dark:border-night-3 flex flex-wrap items-center gap-2.5">
                {!past && (
                    <>
                        <a
                            href={joinable ? s.meet_link : undefined}
                            onClick={joinable ? () => { void onJoin(); } : undefined}
                            target="_blank" rel="noreferrer"
                            aria-disabled={!joinable}
                            className={`${joinable ? BTN_PRIMARY : BTN_SECONDARY + ' opacity-60 pointer-events-none'} !py-2.5 !px-4 !text-sm`}
                        >
                            <Video size={16} /> {joinable ? 'Join now' : 'Join opens 10 min before'}
                        </a>
                        <a href={googleCalendarUrl(s, uid)} target="_blank" rel="noreferrer" className={`${BTN_SECONDARY} !py-2.5 !px-4 !text-sm`}><CalendarPlus size={16} /> Google Calendar</a>
                        <button onClick={() => downloadIcs(s, uid)} className={`${BTN_SECONDARY} !py-2.5 !px-4 !text-sm`}>.ics</button>
                    </>
                )}
                {past && s.recording_url && (
                    <a href={s.recording_url} target="_blank" rel="noreferrer" className={`${BTN_SECONDARY} !py-2.5 !px-4 !text-sm`}><PlayCircle size={16} /> Watch the replay <ExternalLink size={14} /></a>
                )}
                {past && !s.recording_url && <span className={`text-sm ${MUTED}`}>Replay will be posted here.</span>}
                {wasThere && <span className="inline-flex items-center gap-1.5 text-sm font-medium text-mint">You attended: this class's lessons count as done. Take the quizzes.</span>}
                {canConfirm && <button onClick={confirmAttended} disabled={confirming} className={`${BTN_SECONDARY} !py-2.5 !px-4 !text-sm`}>I was in this class</button>}
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
        setMsg(error ? { ok: false, text: 'We could not save that just now. Please try again.' } : { ok: true, text: 'Saved. We will remind you 24 hours and 15 minutes before each live class in your group, and skip classes you have already attended.' });
    };

    if (unavailable) return null;
    const field = 'mt-1 w-full rounded-[14px] border-0 bg-panel dark:bg-night-3 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600';

    return (
        <form onSubmit={save} className={`${CARD} p-5 mt-6`} aria-busy={!loaded}>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] flex items-center gap-2"><Bell size={18} className="text-brand" /> Remind me</h2>
            <p className={`mt-1 text-sm ${MUTED}`}>Get a gentle reminder 24 hours and 15 minutes before each live class in your group. We never remind you about a class you have already attended.</p>

            <label className="mt-4 flex items-start gap-3 text-sm">
                <input type="checkbox" checked={emailOn} onChange={e => setEmailOn(e.target.checked)} disabled={!loaded} className="mt-0.5 w-4 h-4 accent-[#5B2BC4]" />
                <span><span className="font-medium">Email</span>{accountEmail && <span className={MUTED}> to {accountEmail}</span>}</span>
            </label>

            <label className="mt-3 flex items-start gap-3 text-sm">
                <input type="checkbox" checked={waOn} onChange={e => setWaOn(e.target.checked)} disabled={!loaded} className="mt-0.5 w-4 h-4 accent-[#5B2BC4]" />
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
                {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-mint' : 'text-red-700'}`}>{msg.text}</p>}
            </div>
        </form>
    );
};

const LivePanel: React.FC = () => {
    const sessions = useSessions();
    const tt = useTimetable();
    const now = useNow();
    const upcoming = (sessions || []).filter(s => new Date(s.ends_at).getTime() >= now);
    const past = (sessions || []).filter(s => new Date(s.ends_at).getTime() < now).reverse();

    return (
        <div className="max-w-[920px] mx-auto px-4 sm:px-6 py-5 lg:py-0">
            <section className="relative overflow-hidden rounded-[26px] bg-night text-white p-6 sm:p-8">
                <span aria-hidden="true" className="absolute -right-16 -top-20 w-[260px] h-[260px] rounded-full bg-night-3" />
                <span aria-hidden="true" className="absolute right-32 -bottom-28 w-[200px] h-[200px] rounded-full bg-night-2" />
                <p className="relative m-0 inline-flex items-center gap-2 h-8 px-3 rounded-full bg-white/10 text-[12px] font-bold"><span className="w-2 h-2 rounded-full bg-[#F0533A]" aria-hidden="true" /> Mon, Wed, Fri · 2:00 pm EAT</p>
                <h1 className="relative mt-3 mb-0 text-[28px] sm:text-[32px] font-extrabold tracking-[-0.02em]">Live classes</h1>
                <p className="relative mt-2 mb-0 max-w-[560px] text-[14px] leading-relaxed text-[#C9C3E6]">Optional sessions to ask questions and practise with others. Times are shown in East Africa Time, with your local time underneath. Live classes are optional. If you join one, the lessons it covers count as done, and you only take the quizzes for those modules.</p>
            </section>

            <GroupBanner tt={tt} />

            {sessions === null && <p className={`mt-8 ${MUTED}`}>Loading the timetable...</p>}

            {sessions !== null && (
                <>
                    <h2 className="mt-7 mb-0 text-[18px] font-extrabold">Upcoming</h2>
                    {upcoming.length === 0
                        ? <div className={`${CARD} p-5 mt-3`}>
                            <p className="font-semibold">Live classes run every Monday, Wednesday and Friday at 2:00 pm</p>
                            <p className={`mt-1 text-sm ${MUTED}`}>East Africa Time. The next sessions will appear here with a join button that opens 10 minutes before the start.</p>
                        </div>
                        : <div className="mt-3 space-y-4">{upcoming.map(s => <div key={s.id}><SessionBadges id={s.id} tt={tt} /><ul className="m-0 p-0 list-none"><SessionCard s={s} now={now} /></ul></div>)}</div>}

                    {past.length > 0 && (
                        <>
                            <h2 className="mt-8 mb-0 text-[18px] font-extrabold">Past sessions and replays</h2>
                            <ul className="mt-3 p-0 list-none space-y-3">{past.map(s => <SessionCard key={s.id} s={s} now={now} />)}</ul>
                        </>
                    )}
                </>
            )}

            <ReminderCard />
        </div>
    );
};

export default LivePanel;
