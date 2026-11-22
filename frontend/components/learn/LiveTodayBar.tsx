import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, X } from 'lucide-react';
import { COURSE } from '../../src/content/aiFundamentals';
import { LiveSession, loadLiveSessions } from '../../src/lib/learnApi';
import { lectureForSession, moduleLabel, recordAttendance, todaysClass } from '../../src/lib/liveClass';
import { useLearn } from './learnContext';

/** A slim bar on class days (Wed and Fri): tells the learner about the 2:00 pm class and links to the join page. */
const LiveTodayBar: React.FC = () => {
    const { uid } = useLearn();
    const [now, setNow] = useState(Date.now());
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const day = new Date(now + 3 * 3600 * 1000).toISOString().slice(0, 10);
    const key = `welile_livebar_${uid}_${day}`;
    const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(key) === '1'; } catch { return false; } });
    useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(t); }, []);
    useEffect(() => { loadLiveSessions().then(setSessions); }, []);

    const sched = todaysClass(now);
    if (!sched || hidden) return null;
    // Prefer the real session scheduled for today (it carries the join link); otherwise use the weekly timetable.
    const real = sessions.find(s => new Date(s.starts_at).getTime() >= sched.startsAt - 6 * 3600000 && new Date(s.starts_at).getTime() <= sched.startsAt + 6 * 3600000);
    const start = real ? new Date(real.starts_at).getTime() : sched.startsAt;
    const end = real ? new Date(real.ends_at).getTime() : sched.endsAt;
    if (now > end + 30 * 60000) return null;
    const lecture = (real && lectureForSession(real)) || sched.lecture;
    const joinable = !!real?.meet_link && now >= start - 10 * 60000 && now <= end;
    const mins = Math.round((start - now) / 60000);
    const when = now >= start ? 'now' : mins < 60 ? `in ${Math.max(1, mins)} min` : `in about ${Math.round(mins / 60)} h`;
    const hide = () => { setHidden(true); try { localStorage.setItem(key, '1'); } catch { /* ignore */ } };
    const join = () => { if (real) void recordAttendance(uid, real, 'join_click'); };

    return (
        <div role="status" className="bg-violet-700 text-white">
            <div className="px-3 sm:px-5 py-2 flex items-center gap-3 text-sm">
                <Video size={16} className="shrink-0" />
                <p className="flex-1 min-w-0 leading-snug">
                    <b>Live class today, 2:00 pm EAT</b> · {lecture.label} ({moduleLabel(lecture)}) · {when === 'now' ? 'starting now' : when}
                </p>
                {joinable
                    ? <a href={real!.meet_link} target="_blank" rel="noreferrer" onClick={join} className="shrink-0 rounded-lg bg-white text-violet-800 font-semibold px-3 py-1.5 hover:bg-violet-50">Join now</a>
                    : <Link to={`/learn/${COURSE.slug}/live`} className="shrink-0 rounded-lg bg-white/15 hover:bg-white/25 font-semibold px-3 py-1.5">Details</Link>}
                <button onClick={hide} aria-label="Hide for today" className="shrink-0 p-1 rounded hover:bg-white/15"><X size={16} /></button>
            </div>
        </div>
    );
};

export default LiveTodayBar;
