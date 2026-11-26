// The data every Front desk screen shares: people, HQ attendance marks and the call log.
// The Learning-hub "Front desk" tab and the Front desk dashboard both load it here, and every number comes from the shared people model,
// so the Front desk numbers always equal the admin numbers.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FREE_COURSE_TITLE, PeopleMetrics, PersonRow, computePeopleMetrics, invalidatePeople, isOnline, kampalaDay, loadPeople } from '../../lib/peopleMetrics';
import { Enquiry, HqCourse, HqEnrolment, SheetRow, fetchAllSheets, fetchEnquiries, fetchHqCourses, fetchHqEnrolments, marksFor, readiness, enrolmentRef } from '../../lib/hqApi';
import { PhysicalRow, fetchPhysicalAttendance, indexPhysical } from '../../lib/physicalAttendance';
import { CallIndex, CallRow, fetchCallLog, indexCalls } from '../../lib/callLog';
import { channelOf } from './peopleChannels';

/** What every Front desk screen shares, so a walk-in, a call or a mark shows up everywhere straight away. */
export interface FrontDeskData {
    /** People in Fundamentals of AI (the programme). Used by the lesson-chip screens. */
    rows: PersonRow[];
    /** Everyone we know about, in every course. Used to find a person before registering or enrolling them. */
    allRows: PersonRow[];
    courses: HqCourse[];
    enrolments: HqEnrolment[];
    setEnrolments: React.Dispatch<React.SetStateAction<HqEnrolment[]>>;
    /** Class attendance (present, absent, excused) for every course. */
    sheet: SheetRow[];
    setSheet: React.Dispatch<React.SetStateAction<SheetRow[]>>;
    enquiries: Enquiry[];
    setEnquiries: React.Dispatch<React.SetStateAction<Enquiry[]>>;
    /** Loads only the HQ parts again (courses, enrolments, attendance sheet, visitors). Cheap, so it is fine after a single tap. */
    reloadHq: () => Promise<void>;
    marks: PhysicalRow[];
    setMarks: React.Dispatch<React.SetStateAction<PhysicalRow[]>>;
    calls: CallRow[];
    setCalls: React.Dispatch<React.SetStateAction<CallRow[]>>;
    loading: boolean;
    /** A plain-words message when something could not be loaded. */
    notice: string | null;
    /** Loads people, HQ marks and calls again, without blanking the screen. */
    reload: () => Promise<void>;
}

export function useFrontDeskData(): FrontDeskData {
    const [rows, setRows] = useState<PersonRow[]>([]);
    const [allRows, setAllRows] = useState<PersonRow[]>([]);
    const [courses, setCourses] = useState<HqCourse[]>([]);
    const [enrolments, setEnrolments] = useState<HqEnrolment[]>([]);
    const [sheet, setSheet] = useState<SheetRow[]>([]);
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [hqNotice, setHqNotice] = useState<string | null>(null);
    const [marks, setMarks] = useState<PhysicalRow[]>([]);
    const [calls, setCalls] = useState<CallRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState<string | null>(null);

    const reloadHq = useCallback(async () => {
        const [c, e, q] = await Promise.all([fetchHqCourses(), fetchHqEnrolments(null), fetchEnquiries()]);
        const active = (c.data || []).map(x => x.slug);
        const sheets = await fetchAllSheets(active);
        if (c.ok) setCourses(c.data || []);
        if (e.ok) setEnrolments(e.data || []);
        if (q.ok) setEnquiries(q.data || []);
        setSheet(sheets.rows);
        const bad = [c, e, q].find(x => !x.ok);
        setHqNotice(bad ? `Some course information could not be loaded (${bad.error}). The rest still works.` : sheets.error ? `Class attendance could not be loaded (${sheets.error}).` : null);
    }, []);

    const reload = useCallback(async () => {
        setLoading(true);
        // A fresh copy of the people list, so a registration, a mark or a call made a moment ago is included
        invalidatePeople();
        const [people, hq, log] = await Promise.all([loadPeople(), fetchPhysicalAttendance(), fetchCallLog(), reloadHq()]);
        if (people.error) setNotice(`Could not load people: ${people.error}`);
        else {
            setAllRows(people.rows);
            setRows(people.rows.filter(p => (p.courses || []).includes(FREE_COURSE_TITLE)));
            setNotice(hq.error ? `HQ attendance could not be loaded: ${hq.error}` : log.error ? `The call log could not be loaded: ${log.error}` : null);
        }
        setMarks(hq.rows);
        setCalls(log.rows);
        setLoading(false);
    }, []);
    useEffect(() => { void reload(); }, [reload]);

    return { rows, allRows, courses, enrolments, setEnrolments, sheet, setSheet, enquiries, setEnquiries, reloadHq, marks, setMarks, calls, setCalls, loading, notice: notice || hqNotice, reload };
}

export interface DeskStats {
    metrics: PeopleMetrics;
    callIndex: CallIndex;
    lessonsFor: ReturnType<typeof indexPhysical>;
    /** People called today (Kampala day), counted once. */
    calledToday: number;
    reachedToday: number;
    /** Registered today by an agent and already converted: this is how a walk-in registered at the front desk looks. */
    walkInsToday: number;
    /** People marked as attending a lesson at HQ today. */
    atHqToday: number;
    callBacksDue: number;
    /** Called in the last 7 days, or registered as a walk-in in the last 7 days, and now converted, with an account, or at HQ. */
    convertedThisWeek: number;
    /** The people who have waited longest for a first call: no email and never called. */
    needsCallPreview: PersonRow[];
    /** Visitors who came only to ask something, today (Kampala day). */
    visitorsToday: number;
    /** Visitors whose follow-up date is today or earlier and who are still thinking or need follow-up, oldest date first. */
    followUpsDue: Enquiry[];
    /** People who can graduate now: exam passed (if the course has one), every lesson attended, not graduated yet. */
    readyToGraduate: number;
}

export function useDeskStats(data: FrontDeskData): DeskStats {
    const lessonsFor = useMemo(() => indexPhysical(data.marks), [data.marks]);
    const callIndex = useMemo(() => indexCalls(data.calls), [data.calls]);
    const metrics = useMemo(() => computePeopleMetrics(data.rows, lessonsFor, callIndex), [data.rows, lessonsFor, callIndex]);

    return useMemo(() => {
        const today = kampalaDay(Date.now());
        const weekCutoff = Date.now() - 7 * 86400000;
        const todays = data.calls.filter(c => kampalaDay(c.called_at) === today);
        const walkIns = data.rows.filter(p => channelOf(p) === 'Registered by an agent' && p.followup === 'converted');
        const isDone = (p: PersonRow) => p.followup === 'converted' || !!p.has_account || lessonsFor({ key: p.key, email: p.email, phone: p.phone }).length > 0;
        const week = new Set<string>();
        data.rows.forEach(p => {
            const last = callIndex.last({ key: p.key, email: p.email, phone: p.phone });
            if (last && new Date(last.called_at).getTime() >= weekCutoff && isDone(p)) week.add(p.key);
        });
        walkIns.forEach(p => { if (new Date(p.registered_at).getTime() >= weekCutoff) week.add(p.key); });
        const preview = data.rows
            .filter(p => !isOnline(p) && p.followup !== 'not_interested' && !callIndex.last({ key: p.key, email: p.email, phone: p.phone }))
            .sort((a, b) => (a.registered_at < b.registered_at ? -1 : 1))
            .slice(0, 5);
        const followUpsDue = data.enquiries
            .filter(q => !!q.follow_up_on && (q.follow_up_on as string) <= today && (q.outcome === 'thinking' || q.outcome === 'follow_up'))
            .sort((a, b) => ((a.follow_up_on as string) < (b.follow_up_on as string) ? -1 : 1));
        const ready = data.enrolments.filter(en => {
            const course = data.courses.find(c => c.slug === en.course_slug);
            return readiness(en, course, marksFor(data.sheet, en.course_slug, enrolmentRef(en))).ready;
        }).length;
        return {
            visitorsToday: data.enquiries.filter(q => kampalaDay(q.visited_at) === today).length, followUpsDue, readyToGraduate: ready,
            metrics, callIndex, lessonsFor,
            calledToday: new Set(todays.map(c => c.person_key)).size,
            reachedToday: new Set(todays.filter(c => c.outcome === 'reached').map(c => c.person_key)).size,
            walkInsToday: walkIns.filter(p => kampalaDay(p.registered_at) === today).length,
            atHqToday: new Set(data.marks.filter(x => x.attended_on === today).map(x => x.person_key)).size,
            callBacksDue: metrics.callBackDue,
            convertedThisWeek: week.size,
            needsCallPreview: preview,
        };
    }, [data.rows, data.calls, data.marks, data.enquiries, data.enrolments, data.courses, data.sheet, metrics, callIndex, lessonsFor]);
}
