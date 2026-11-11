import React, { useEffect, useState } from 'react';
import { CalendarPlus, ExternalLink, PlayCircle, Video } from 'lucide-react';
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
                        ? <p className={`${CARD} rounded-2xl p-5 mt-3 text-sm ${MUTED}`}>No live classes are scheduled yet. Check back soon.</p>
                        : <ul className="mt-3 space-y-4">{upcoming.map(s => <SessionCard key={s.id} s={s} now={now} />)}</ul>}

                    {past.length > 0 && (
                        <>
                            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">Past sessions and replays</h2>
                            <ul className="mt-3 space-y-4">{past.map(s => <SessionCard key={s.id} s={s} now={now} />)}</ul>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default LivePanel;
