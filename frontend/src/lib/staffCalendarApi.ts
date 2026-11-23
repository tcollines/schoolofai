import { supabase } from './supabaseClient';

/** Personal calendar for staff. Row-level security means each person only ever reads and writes their own blocks. */

export type CalCategory = 'meeting' | 'live_class' | 'teaching' | 'strategy' | 'networking' | 'ops' | 'travel' | 'personal' | 'other';

export interface CalEvent {
    id: string;
    title: string;
    category: CalCategory;
    /** 1 = Monday ... 7 = Sunday; set for blocks that repeat every week */
    weekday: number | null;
    /** YYYY-MM-DD in East Africa Time; set for one-off blocks */
    event_date: string | null;
    /** HH:MM, 24 hour */
    start_time: string;
    end_time: string;
    notes: string | null;
    is_assumed: boolean;
}

export interface CalEventInput {
    title: string;
    category: CalCategory;
    weekday: number | null;
    event_date: string | null;
    start_time: string;
    end_time: string;
    notes: string;
    is_assumed: boolean;
}

export const CATEGORIES: { id: CalCategory; label: string }[] = [
    { id: 'meeting', label: 'Meeting' },
    { id: 'live_class', label: 'Live class' },
    { id: 'teaching', label: 'Teaching' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'networking', label: 'Networking' },
    { id: 'ops', label: 'Operations' },
    { id: 'travel', label: 'Travel' },
    { id: 'personal', label: 'Personal' },
    { id: 'other', label: 'Other' }
];

const COLS = 'id,title,category,weekday,event_date,start_time,end_time,notes,is_assumed';
const hm = (t: string) => String(t || '').slice(0, 5);
const clean = (r: any): CalEvent => ({ ...r, start_time: hm(r.start_time), end_time: hm(r.end_time) });

export async function loadCalendar(): Promise<CalEvent[]> {
    const { data, error } = await supabase.from('staff_calendar_events').select(COLS).order('start_time', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(clean);
}

async function myUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    const id = data?.user?.id;
    if (!id) throw new Error('Please sign in again.');
    return id;
}

const toRow = (i: CalEventInput) => ({
    title: i.title.trim(),
    category: i.category,
    weekday: i.event_date ? null : i.weekday,
    event_date: i.event_date || null,
    start_time: i.start_time,
    end_time: i.end_time,
    notes: i.notes.trim() || null,
    is_assumed: i.is_assumed
});

export async function saveCalendarEvent(id: string | null, input: CalEventInput): Promise<CalEvent> {
    if (id) {
        const { data, error } = await supabase.from('staff_calendar_events').update(toRow(input)).eq('id', id).select(COLS).single();
        if (error) throw new Error(error.message);
        return clean(data);
    }
    const user_id = await myUserId();
    const { data, error } = await supabase.from('staff_calendar_events').insert({ ...toRow(input), user_id }).select(COLS).single();
    if (error) throw new Error(error.message);
    return clean(data);
}

export async function deleteCalendarEvent(id: string): Promise<void> {
    const { error } = await supabase.from('staff_calendar_events').delete().eq('id', id);
    if (error) throw new Error(error.message);
}
