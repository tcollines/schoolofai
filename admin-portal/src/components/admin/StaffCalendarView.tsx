import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Loader2, Plus, X } from 'lucide-react';
import {
    CATEGORIES, CalCategory, CalEvent, CalEventInput, deleteCalendarEvent, loadCalendar, saveCalendarEvent
} from '../../lib/staffCalendarApi';

const CARD = 'bg-white dark:bg-night-2 border border-[#EEEAF6] dark:border-night-3';
const MUTED = 'text-[#6B6680] dark:text-slate-400';
const BTN_PRIMARY = 'press inline-flex items-center justify-center gap-2 rounded-[12px] bg-brand hover:bg-brand-mid text-white font-bold px-4 min-h-[44px] text-[14px] disabled:opacity-50';
const BTN_SECONDARY = 'press inline-flex items-center justify-center gap-2 rounded-[12px] bg-panel dark:bg-night-3 text-ink dark:text-white font-bold px-4 min-h-[44px] text-[14px]';

// ---- East Africa Time helpers (UTC+3, no daylight saving) ------------------------------
const EAT = 3 * 3600 * 1000;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pad = (n: number) => String(n).padStart(2, '0');
export const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
export const fmtTime = (t: string) => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; return `${h % 12 || 12}${m ? ':' + pad(m) : ''} ${ap}`; };
export const isoDate = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export const nowEat = () => new Date(Date.now() + EAT);
export const isoWeekday = (d: Date) => d.getUTCDay() || 7;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

function weekDates(now: Date): Date[] {
    const monday = addDays(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), -(isoWeekday(now) - 1));
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const COLORS: Record<CalCategory, { chip: string; block: string; dot: string }> = {
    meeting: { chip: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200', block: 'bg-blue-100 border-blue-400 text-blue-950 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-100', dot: 'bg-blue-500' },
    live_class: { chip: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200', block: 'bg-violet-100 border-violet-400 text-violet-950 dark:bg-violet-950 dark:border-violet-700 dark:text-violet-100', dot: 'bg-violet-600' },
    teaching: { chip: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-200', block: 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-950 dark:bg-fuchsia-950 dark:border-fuchsia-700 dark:text-fuchsia-100', dot: 'bg-fuchsia-500' },
    strategy: { chip: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200', block: 'bg-emerald-100 border-emerald-400 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-100', dot: 'bg-emerald-500' },
    networking: { chip: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200', block: 'bg-amber-100 border-amber-400 text-amber-950 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-100', dot: 'bg-amber-500' },
    ops: { chip: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200', block: 'bg-cyan-100 border-cyan-400 text-cyan-950 dark:bg-cyan-950 dark:border-cyan-700 dark:text-cyan-100', dot: 'bg-cyan-500' },
    travel: { chip: 'bg-stone-200 text-stone-800 dark:bg-slate-800 dark:text-slate-200', block: 'bg-stone-200 border-stone-400 text-stone-900 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100', dot: 'bg-stone-500' },
    personal: { chip: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200', block: 'bg-rose-100 border-rose-400 text-rose-950 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-100', dot: 'bg-rose-500' },
    other: { chip: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', block: 'bg-slate-100 border-slate-400 text-slate-900 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100', dot: 'bg-slate-500' }
};
const catLabel = (c: CalCategory) => CATEGORIES.find(x => x.id === c)?.label || 'Other';

interface Placed { ev: CalEvent; day: number; date: string }

function placeWeek(events: CalEvent[], dates: Date[]): Placed[] {
    const out: Placed[] = [];
    dates.forEach((d, i) => {
        const date = isoDate(d);
        events.forEach(ev => {
            if (ev.event_date ? ev.event_date === date : ev.weekday === i + 1) out.push({ ev, day: i + 1, date });
        });
    });
    return out.sort((a, b) => mins(a.ev.start_time) - mins(b.ev.start_time) || mins(a.ev.end_time) - mins(b.ev.end_time));
}

/** The event happening now, or the next one to start, looking up to 8 days ahead. */
function nextUp(events: CalEvent[], now: Date): { ev: CalEvent; startsIn: number; ongoing: boolean; dayLabel: string } | null {
    const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    let best: { ev: CalEvent; startsIn: number; ongoing: boolean; dayLabel: string } | null = null;
    for (let add = 0; add <= 8; add++) {
        const d = addDays(now, add);
        const date = isoDate(d), wd = isoWeekday(d);
        for (const ev of events) {
            if (!(ev.event_date ? ev.event_date === date : ev.weekday === wd)) continue;
            const s = mins(ev.start_time), e = mins(ev.end_time);
            if (add === 0 && e <= nowMin) continue;
            const ongoing = add === 0 && s <= nowMin;
            const startsIn = ongoing ? 0 : add * 1440 + s - nowMin;
            if (!best || startsIn < best.startsIn) best = { ev, startsIn, ongoing, dayLabel: add === 0 ? 'Today' : add === 1 ? 'Tomorrow' : DAY_NAMES[wd - 1] };
        }
        if (best) break;
    }
    return best;
}

/** Today's blocks, for the Today page strip. */
export function todaysBlocks(events: CalEvent[], now: Date = nowEat()): CalEvent[] {
    const date = isoDate(now), wd = isoWeekday(now);
    return events
        .filter(ev => (ev.event_date ? ev.event_date === date : ev.weekday === wd))
        .sort((a, b) => mins(a.start_time) - mins(b.start_time));
}
export { loadCalendar };
export const timeRange = (ev: CalEvent) => `${fmtTime(ev.start_time)} to ${fmtTime(ev.end_time)}`;
export const calColor = (c: CalCategory) => COLORS[c];

const untilText = (m: number) => m < 60 ? `in ${m} min` : m < 1440 ? `in ${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : '';

function lanes(items: Placed[]): Map<Placed, { lane: number; of: number }> {
    const res = new Map<Placed, { lane: number; of: number }>();
    let group: Placed[] = [], groupEnd = -1;
    const flush = () => {
        const ends: number[] = [];
        group.forEach(p => {
            let l = ends.findIndex(e => e <= mins(p.ev.start_time));
            if (l < 0) { l = ends.length; ends.push(0); }
            ends[l] = mins(p.ev.end_time);
            res.set(p, { lane: l, of: 0 });
        });
        group.forEach(p => { res.get(p)!.of = ends.length; });
        group = []; groupEnd = -1;
    };
    items.forEach(p => {
        if (group.length && mins(p.ev.start_time) >= groupEnd) flush();
        group.push(p); groupEnd = Math.max(groupEnd, mins(p.ev.end_time));
    });
    if (group.length) flush();
    return res;
}

const GRID_START = 6, GRID_END = 21, HOUR_PX = 52;

const StaffCalendarView: React.FC = () => {
    const [events, setEvents] = useState<CalEvent[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(nowEat());
    const [selDay, setSelDay] = useState(isoWeekday(nowEat()));
    const [editing, setEditing] = useState<CalEvent | 'new' | null>(null);

    const load = useCallback(async () => {
        setError(null);
        try { setEvents(await loadCalendar()); }
        catch (e: any) { setError(e?.message ? `We could not load your calendar. ${e.message}` : 'We could not load your calendar. Please check your connection and try again.'); setEvents(prev => prev || []); }
    }, []);
    useEffect(() => { void load(); }, [load]);
    useEffect(() => { const t = setInterval(() => setNow(nowEat()), 30000); return () => clearInterval(t); }, []);

    const dates = useMemo(() => weekDates(now), [now]);
    const today = isoWeekday(now);
    const placed = useMemo(() => placeWeek(events || [], dates), [events, dates]);
    const next = useMemo(() => nextUp(events || [], now), [events, now]);
    const usedCats = useMemo(() => Array.from(new Set((events || []).map(e => e.category))), [events]);
    const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();

    const onSaved = (ev: CalEvent) => {
        setEvents(prev => { const rest = (prev || []).filter(x => x.id !== ev.id); return [...rest, ev]; });
        setEditing(null);
    };
    const onDeleted = (id: string) => { setEvents(prev => (prev || []).filter(x => x.id !== id)); setEditing(null); };
    const openNew = () => setEditing('new');

    return (
        <section aria-label="My week" className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="min-w-0">
                    <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] flex items-center gap-2"><CalendarDays size={24} className="text-brand dark:text-violet-300" /> My week</h1>
                    <p className={`m-0 mt-1 text-[14px] ${MUTED}`}>Your week, in East Africa Time. Tap any block to change it.</p>
                </div>
                <div className="flex-1" />
                <button onClick={openNew} className={`${BTN_PRIMARY} shrink-0`}><Plus size={16} /> Add block</button>
            </div>

            {error && (
                <div role="alert" className="rounded-[14px] bg-[#FDECE8] text-[#A3321F] p-3.5 text-[14px] flex items-center gap-3">
                    <span>{error}</span>
                    <button onClick={() => void load()} className="ml-auto font-bold underline shrink-0 min-h-[44px]">Try again</button>
                </div>
            )}

            {events === null ? (
                <div className={`${CARD} rounded-[22px] p-8 flex items-center justify-center gap-2 ${MUTED}`}><Loader2 size={18} className="animate-spin" /> Loading your calendar...</div>
            ) : (
                <>
                    {next && (
                        <button onClick={() => setEditing(next.ev)} className={`${CARD} press w-full text-left rounded-[22px] p-4 flex items-center gap-3`}>
                            <span className={`shrink-0 w-1.5 self-stretch rounded-full ${COLORS[next.ev.category].dot}`} />
                            <div className="min-w-0 flex-1">
                                <p className="m-0 text-[12px] font-extrabold uppercase tracking-wide text-brand dark:text-violet-300">{next.ongoing ? 'Happening now' : 'Next up'}</p>
                                <p className="m-0 text-[18px] font-extrabold truncate">{next.ev.title}</p>
                                <p className={`m-0 text-[14px] ${MUTED}`}>{next.dayLabel}, {fmtTime(next.ev.start_time)} to {fmtTime(next.ev.end_time)}{!next.ongoing && untilText(next.startsIn) ? ` (${untilText(next.startsIn)})` : ''}</p>
                            </div>
                            <Clock size={20} className={MUTED} />
                        </button>
                    )}

                    {events.length === 0 && !error && (
                        <div className={`${CARD} rounded-[22px] p-6 text-center`}>
                            <p className="m-0 font-bold text-[15px]">Your calendar is empty.</p>
                            <p className={`m-0 mt-1 text-[14px] ${MUTED}`}>Add the things that fill your week: meetings, classes, travel. Mark repeating ones as "Every week".</p>
                            <button onClick={openNew} className={`${BTN_PRIMARY} mt-4`}><Plus size={16} /> Add your first block</button>
                        </div>
                    )}

                    {usedCats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5" aria-label="Colour guide">
                            {CATEGORIES.filter(c => usedCats.includes(c.id)).map(c => (
                                <span key={c.id} className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${COLORS[c.id].chip}`}>{c.label}</span>
                            ))}
                        </div>
                    )}

                    {/* phone: one day at a time */}
                    <div className="md:hidden space-y-3">
                        <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Day of the week">
                            {DAY_SHORT.map((n, i) => {
                                const d = i + 1, on = d === selDay;
                                return (
                                    <button key={n} role="tab" aria-selected={on} onClick={() => setSelDay(d)}
                                        className={`press rounded-[12px] min-h-[52px] py-2 text-center border ${on ? 'bg-brand border-brand text-white' : CARD} ${d === today && !on ? 'ring-2 ring-violet-400' : ''}`}>
                                        <span className="block text-[12px] font-semibold">{n}</span>
                                        <span className="block text-[14px] font-bold">{dates[i].getUTCDate()}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="space-y-2">
                            {placed.filter(p => p.day === selDay).length === 0 && (
                                <p className={`${CARD} rounded-[22px] p-5 text-[14px] text-center m-0 ${MUTED}`}>Nothing planned for {DAY_NAMES[selDay - 1]}.</p>
                            )}
                            {placed.filter(p => p.day === selDay).map(p => {
                                const live = selDay === today && mins(p.ev.start_time) <= nowMin && nowMin < mins(p.ev.end_time);
                                return (
                                    <button key={p.ev.id + p.date} onClick={() => setEditing(p.ev)}
                                        className={`press w-full text-left rounded-[18px] border-l-4 border p-3.5 ${COLORS[p.ev.category].block} ${live ? 'ring-2 ring-violet-500' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <p className="m-0 font-bold text-[15px] flex-1 min-w-0">{p.ev.title}</p>
                                            {live && <span className="text-[12px] font-bold uppercase text-violet-800 dark:text-violet-200">Now</span>}
                                            {p.ev.is_assumed && <span className="text-[12px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30">Tentative</span>}
                                        </div>
                                        <p className="m-0 text-[14px] opacity-80">{fmtTime(p.ev.start_time)} to {fmtTime(p.ev.end_time)} · {catLabel(p.ev.category)}{p.ev.event_date ? ' · one time' : ''}</p>
                                        {p.ev.notes && <p className="m-0 mt-1 text-[14px] opacity-80">{p.ev.notes}</p>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* wide screens: Monday to Sunday grid */}
                    <div className={`hidden md:block ${CARD} rounded-[22px] overflow-hidden`}>
                        <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, minmax(0, 1fr))' }}>
                            <div />
                            {DAY_SHORT.map((n, i) => (
                                <div key={n} className={`py-2 text-center border-l border-stone-200 dark:border-slate-800 ${i + 1 === today ? 'bg-violet-50 dark:bg-violet-950/40' : ''}`}>
                                    <p className="m-0 text-[12px] font-semibold">{n}</p>
                                    <p className={`m-0 text-[14px] font-bold ${i + 1 === today ? 'text-brand dark:text-violet-300' : ''}`}>{dates[i].getUTCDate()}</p>
                                </div>
                            ))}
                        </div>
                        <div className="grid border-t border-stone-200 dark:border-slate-800" style={{ gridTemplateColumns: '48px repeat(7, minmax(0, 1fr))' }}>
                            <div className="relative" style={{ height: (GRID_END - GRID_START) * HOUR_PX }}>
                                {Array.from({ length: GRID_END - GRID_START }, (_, i) => (
                                    <span key={i} className={`absolute right-1.5 text-[11px] ${MUTED}`} style={{ top: i * HOUR_PX - 6 }}>{i === 0 ? '' : fmtTime(`${pad(GRID_START + i)}:00`)}</span>
                                ))}
                            </div>
                            {DAY_SHORT.map((_, i) => {
                                const day = i + 1;
                                const items = placed.filter(p => p.day === day);
                                const lay = lanes(items);
                                return (
                                    <div key={day} className={`relative border-l border-stone-200 dark:border-slate-800 ${day === today ? 'bg-violet-50/60 dark:bg-violet-950/20' : ''}`} style={{ height: (GRID_END - GRID_START) * HOUR_PX }}>
                                        {Array.from({ length: GRID_END - GRID_START }, (_, h) => (
                                            <div key={h} className="absolute inset-x-0 border-t border-stone-100 dark:border-slate-800/70" style={{ top: h * HOUR_PX }} />
                                        ))}
                                        {items.map(p => {
                                            const s = Math.max(mins(p.ev.start_time), GRID_START * 60), e = Math.min(mins(p.ev.end_time), GRID_END * 60);
                                            if (e <= s) return null;
                                            const l = lay.get(p)!;
                                            return (
                                                <button key={p.ev.id + p.date} onClick={() => setEditing(p.ev)} title={`${p.ev.title}, ${fmtTime(p.ev.start_time)} to ${fmtTime(p.ev.end_time)}`}
                                                    className={`absolute rounded-md border-l-4 border px-1.5 py-0.5 text-left overflow-hidden text-[11px] leading-tight hover:z-10 hover:shadow-md ${COLORS[p.ev.category].block} ${p.ev.is_assumed ? 'border-dashed' : ''}`}
                                                    style={{ top: (s - GRID_START * 60) / 60 * HOUR_PX + 1, height: Math.max((e - s) / 60 * HOUR_PX - 2, 18), left: `calc(${l.lane / l.of * 100}% + 2px)`, width: `calc(${100 / l.of}% - 4px)` }}>
                                                    <span className="font-semibold block truncate">{p.ev.title}</span>
                                                    <span className="opacity-75 block truncate">{fmtTime(p.ev.start_time)}{p.ev.is_assumed ? ' · tentative' : ''}</span>
                                                </button>
                                            );
                                        })}
                                        {day === today && nowMin >= GRID_START * 60 && nowMin <= GRID_END * 60 && (
                                            <div className="absolute inset-x-0 z-20 pointer-events-none" style={{ top: (nowMin - GRID_START * 60) / 60 * HOUR_PX }} aria-hidden>
                                                <div className="h-0.5 bg-red-500" />
                                                <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <p className={`m-0 text-[12px] ${MUTED}`}>Dashed blocks are tentative. Blocks outside 6 am to 9 pm only show on the phone view.</p>
                </>
            )}

            {editing && (
                <EventEditor
                    event={editing === 'new' ? null : editing}
                    defaultDay={selDay}
                    onClose={() => setEditing(null)}
                    onSaved={onSaved}
                    onDeleted={onDeleted}
                />
            )}
        </section>
    );
};

const FIELD = 'w-full rounded-[12px] border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 min-h-[44px] py-2 text-[16px] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';

const EventEditor: React.FC<{
    event: CalEvent | null; defaultDay: number;
    onClose: () => void; onSaved: (e: CalEvent) => void; onDeleted: (id: string) => void;
}> = ({ event, defaultDay, onClose, onSaved, onDeleted }) => {
    const [title, setTitle] = useState(event?.title || '');
    const [category, setCategory] = useState<CalCategory>(event?.category || 'meeting');
    const [repeat, setRepeat] = useState<'weekly' | 'once'>(event?.event_date ? 'once' : 'weekly');
    const [weekday, setWeekday] = useState(event?.weekday || defaultDay);
    const [date, setDate] = useState(event?.event_date || isoDate(nowEat()));
    const [start, setStart] = useState(event?.start_time || '09:00');
    const [end, setEnd] = useState(event?.end_time || '10:00');
    const [notes, setNotes] = useState(event?.notes || '');
    const [tentative, setTentative] = useState(event?.is_assumed || false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [confirmDel, setConfirmDel] = useState(false);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setErr('Please give this block a name.'); return; }
        if (!start || !end || mins(end) <= mins(start)) { setErr('The end time must be after the start time.'); return; }
        if (repeat === 'once' && !date) { setErr('Please pick a date.'); return; }
        setBusy(true); setErr(null);
        const input: CalEventInput = {
            title, category, notes, is_assumed: tentative, start_time: start, end_time: end,
            weekday: repeat === 'weekly' ? weekday : null, event_date: repeat === 'once' ? date : null
        };
        try { onSaved(await saveCalendarEvent(event?.id || null, input)); }
        catch (ex: any) { setErr(`We could not save this block. ${ex?.message || 'Please try again.'}`); setBusy(false); }
    };
    const remove = async () => {
        if (!event) return;
        setBusy(true); setErr(null);
        try { await deleteCalendarEvent(event.id); onDeleted(event.id); }
        catch (ex: any) { setErr(`We could not delete this block. ${ex?.message || 'Please try again.'}`); setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={event ? 'Edit block' : 'Add block'} onClick={onClose}>
            <form onSubmit={save} onClick={e => e.stopPropagation()} className={`${CARD} w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 max-h-[92vh] overflow-y-auto`}>
                <div className="flex items-center">
                    <h2 className="m-0 text-[20px] font-extrabold flex-1">{event ? 'Edit block' : 'Add block'}</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="w-11 h-11 inline-flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>
                <label className="block text-[14px] font-semibold">What is it?
                    <input className={`${FIELD} mt-1`} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Team meeting" maxLength={120} autoFocus />
                </label>
                <label className="block text-[14px] font-semibold">Type
                    <select className={`${FIELD} mt-1`} value={category} onChange={e => setCategory(e.target.value as CalCategory)}>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="block text-[14px] font-semibold">How often
                        <select className={`${FIELD} mt-1`} value={repeat} onChange={e => setRepeat(e.target.value as 'weekly' | 'once')}>
                            <option value="weekly">Every week</option>
                            <option value="once">One date only</option>
                        </select>
                    </label>
                    {repeat === 'weekly' ? (
                        <label className="block text-[14px] font-semibold">Day
                            <select className={`${FIELD} mt-1`} value={weekday} onChange={e => setWeekday(Number(e.target.value))}>
                                {DAY_NAMES.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
                            </select>
                        </label>
                    ) : (
                        <label className="block text-[14px] font-semibold">Date
                            <input type="date" className={`${FIELD} mt-1`} value={date} onChange={e => setDate(e.target.value)} />
                        </label>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <label className="block text-[14px] font-semibold">Starts
                        <input type="time" className={`${FIELD} mt-1`} value={start} onChange={e => setStart(e.target.value)} />
                    </label>
                    <label className="block text-[14px] font-semibold">Ends
                        <input type="time" className={`${FIELD} mt-1`} value={end} onChange={e => setEnd(e.target.value)} />
                    </label>
                </div>
                <label className="block text-[14px] font-semibold">Notes (optional)
                    <textarea className={`${FIELD} mt-1`} rows={2} value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} />
                </label>
                <label className="flex items-center gap-2 text-[14px] min-h-[44px]">
                    <input type="checkbox" checked={tentative} onChange={e => setTentative(e.target.checked)} className="w-5 h-5 accent-violet-700" />
                    Tentative (not confirmed yet)
                </label>
                {err && <p role="alert" className="m-0 text-[14px] text-red-700 dark:text-red-300">{err}</p>}
                <div className="flex items-center gap-2 pt-1">
                    {event && (confirmDel
                        ? <button type="button" onClick={() => void remove()} disabled={busy} className="rounded-[12px] bg-red-600 hover:bg-red-700 text-white font-bold px-4 min-h-[44px] text-[14px] disabled:opacity-50">Yes, delete</button>
                        : <button type="button" onClick={() => setConfirmDel(true)} disabled={busy} className="text-[14px] font-bold text-red-700 dark:text-red-300 px-2 min-h-[44px]">Delete</button>)}
                    <div className="flex-1" />
                    <button type="button" onClick={onClose} className={BTN_SECONDARY}>Cancel</button>
                    <button type="submit" disabled={busy} className={BTN_PRIMARY}>{busy ? <Loader2 size={16} className="animate-spin" /> : 'Save'}</button>
                </div>
            </form>
        </div>
    );
};

export default StaffCalendarView;
