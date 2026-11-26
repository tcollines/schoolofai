import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Search } from 'lucide-react';
import { PersonRow, isOnline } from '../../lib/peopleMetrics';
import {
    LESSONS, applyLocalMark, indexPhysical, kampalaToday, setPhysicalLesson,
} from '../../lib/physicalAttendance';
import type { FrontDeskData } from './frontDeskData';

const card = 'bg-white dark:bg-night-2 rounded-[22px]';
type Filter = 'call' | 'all' | 'notyet';
const FILTERS: { id: Filter; label: string }[] = [
    { id: 'call', label: 'Needs a call (no email)' },
    { id: 'all', label: 'Everyone' },
    { id: 'notyet', label: 'Not yet at this lesson' },
];

const prettyDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** The marking screen: pick a lesson and a date, then tap Present for each person who came to HQ. */
const FrontDeskAttendance: React.FC<{ data: FrontDeskData }> = ({ data }) => {
    const { rows, marks, setMarks, loading } = data;
    const [error, setError] = useState<string | null>(null);
    const [lesson, setLesson] = useState<number>(1);
    const [date, setDate] = useState<string>(kampalaToday());
    const [filter, setFilter] = useState<Filter>('call');
    const [q, setQ] = useState('');
    const [limit, setLimit] = useState(100);
    const [busy, setBusy] = useState<Set<string>>(new Set());

    const lessonsFor = useMemo(() => indexPhysical(marks), [marks]);
    const presentToday = useMemo(() => marks.filter(r => r.lesson_no === lesson && r.attended_on === date).length, [marks, lesson, date]);
    const presentTotal = useMemo(() => marks.filter(r => r.lesson_no === lesson).length, [marks, lesson]);

    useEffect(() => { setLimit(100); }, [filter, q, lesson]);

    const list = useMemo(() => {
        const term = q.trim().toLowerCase();
        const digits = term.replace(/\D/g, '');
        return rows.filter(p => {
            const mine = lessonsFor({ key: p.key, email: p.email, phone: p.phone });
            if (filter === 'call' && isOnline(p)) return false;
            if (filter === 'notyet' && mine.includes(lesson)) return false;
            if (term) {
                const hay = `${p.name} ${p.email || ''} ${p.location || ''}`.toLowerCase();
                const phoneHit = digits.length >= 3 && (p.phone || '').replace(/\D/g, '').includes(digits);
                if (!hay.includes(term) && !phoneHit) return false;
            }
            return true;
        });
    }, [rows, filter, q, lesson, lessonsFor]);

    const toggle = async (p: PersonRow, attended: boolean) => {
        const person = { key: p.key, name: p.name, email: p.email, phone: p.phone };
        const id = `${p.key}:${lesson}`;
        setBusy(b => new Set(b).add(id));
        setMarks(prev => applyLocalMark(prev, person, lesson, attended, date));
        const res = await setPhysicalLesson(person, lesson, attended, date);
        if (!res.ok) {
            setMarks(prev => applyLocalMark(prev, person, lesson, !attended, date));
            setError(`Could not save for ${p.name || 'this person'}: ${res.error}`);
        } else setError(null);
        setBusy(b => { const n = new Set(b); n.delete(id); return n; });
    };

    const current = LESSONS.find(l => l.no === lesson)!;

    return (
        <div className="space-y-5">
            <p className="m-0 text-sm text-stone-500 dark:text-slate-400">Fundamentals of AI has 3 lessons at HQ. Pick the lesson and the date, then tap Present for everyone who came.</p>

            <section className={`${card} p-4 sm:p-5 space-y-4`}>
                <div>
                    <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">Lesson</p>
                    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Choose the lesson">
                        {LESSONS.map(l => (
                            <button
                                key={l.no}
                                type="button"
                                aria-pressed={lesson === l.no}
                                onClick={() => setLesson(l.no)}
                                className={`min-h-[64px] px-2 rounded-[14px] border text-center ${lesson === l.no ? 'bg-brand border-violet-600 text-white' : 'bg-white dark:bg-night-2 border-stone-200 dark:border-slate-700'}`}
                            >
                                <span className="block text-base font-extrabold">Lesson {l.no}</span>
                                <span className={`block text-xs ${lesson === l.no ? 'opacity-90' : 'text-stone-500 dark:text-slate-400'}`}>{l.modules}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <label className="block">
                        <span className="block mb-1 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">Date (Kampala)</span>
                        <input type="date" value={date} max={kampalaToday()} onChange={e => e.target.value && setDate(e.target.value)} className="min-h-[44px] rounded-[12px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 px-3 text-base" />
                    </label>
                    <p className="m-0 pb-2 text-sm font-semibold" aria-live="polite">
                        <span className="text-emerald-700 dark:text-emerald-400">{presentToday} present</span> at Lesson {lesson} on {prettyDate(date)}
                        <span className="block text-xs font-normal text-stone-500 dark:text-slate-400">{presentTotal} people have attended Lesson {lesson} in total ({current.modules}).</span>
                    </p>
                </div>
            </section>

            {error && (
                <div role="alert" className="flex items-start justify-between gap-3 rounded-[14px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="shrink-0 min-h-[44px] px-2 font-semibold">Dismiss</button>
                </div>
            )}

            <section className={`${card} p-4 sm:p-5 space-y-3`}>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
                    <input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search name, phone or email"
                        aria-label="Search people"
                        className="w-full min-h-[48px] rounded-[12px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 pl-9 pr-3 text-base"
                    />
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Who to show">
                    {FILTERS.map(f => (
                        <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
                            className={`min-h-[44px] px-3 rounded-[12px] border text-sm font-semibold ${filter === f.id ? 'bg-brand border-violet-600 text-white' : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2'}`}>{f.label}</button>
                    ))}
                </div>

                {rows.length === 0 && loading && <div className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={18} /> Loading people...</div>}
                {rows.length > 0 && <p className="m-0 text-xs text-stone-500 dark:text-slate-400">{list.length} {list.length === 1 ? 'person' : 'people'} shown</p>}

                <ul className="m-0 p-0 list-none space-y-2">
                    {list.slice(0, limit).map(p => {
                        const mine = lessonsFor({ key: p.key, email: p.email, phone: p.phone });
                        const here = mine.includes(lesson);
                        const working = busy.has(`${p.key}:${lesson}`);
                        return (
                            <li key={p.key} className={`flex items-center gap-3 min-h-[64px] rounded-[14px] border p-3 ${here ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-stone-200 dark:border-slate-700'}`}>
                                <div className="min-w-0 flex-1">
                                    <p className="m-0 font-bold text-base break-words">{p.name || '(no name)'}</p>
                                    <p className="m-0 text-xs text-stone-500 dark:text-slate-400 break-all">{p.phone ? `+${p.phone}` : ''}{p.phone && p.email ? ' · ' : ''}{p.email || (p.phone ? '' : 'no phone or email')}</p>
                                    <div className="mt-1 flex items-center gap-1" aria-label={`Attended at HQ: ${mine.length ? mine.map(n => `lesson ${n}`).join(', ') : 'none yet'}`}>
                                        {LESSONS.map(l => (
                                            <span key={l.no} className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${mine.includes(l.no) ? 'bg-emerald-600 text-white' : 'bg-stone-100 dark:bg-slate-800 text-stone-400'}`}>{l.no}</span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    disabled={working}
                                    aria-pressed={here}
                                    onClick={() => void toggle(p, !here)}
                                    className={`shrink-0 min-w-[112px] min-h-[56px] px-4 rounded-[14px] text-base font-extrabold inline-flex items-center justify-center gap-1.5 border disabled:opacity-60 ${here ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white dark:bg-night-2 border-stone-300 dark:border-slate-600 text-stone-800 dark:text-slate-100'}`}
                                >
                                    {working ? <Loader2 size={16} className="animate-spin" /> : here ? <><Check size={18} /> Present</> : 'Present'}
                                </button>
                            </li>
                        );
                    })}
                </ul>
                {rows.length > 0 && list.length === 0 && <p className="m-0 py-6 text-center text-stone-500">No one matches. Try Everyone, or clear the search.</p>}
                {list.length > limit && (
                    <button onClick={() => setLimit(l => l + 100)} className="min-h-[44px] px-2 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline">Show more ({list.length - limit} remaining)</button>
                )}
            </section>
        </div>
    );
};

export default FrontDeskAttendance;
