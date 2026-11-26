import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { lastDigits, normEmail } from '../../lib/physicalAttendance';
import { HqEnrolment, STATUS_LABELS, enrolmentRef, marksFor, registerStudy, samePerson, setHqAttendance, ugx } from '../../lib/hqApi';
import { channelOf } from './peopleChannels';
import type { PersonRow } from '../../lib/peopleMetrics';
import type { FrontDeskData } from './frontDeskData';
import { card, chip, errorBox, input, label, prettyDate, today, toNumber } from './frontDeskUi';

export interface Prefill { name?: string; phone?: string; email?: string; enquiryId?: string | null }

const tokens = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
/** Same name even if the order differs ("Mary Nakato" and "Nakato Mary"). Family names alone do not count. */
const namesAlike = (a: string, b: string) => {
    const ta = tokens(a), tb = tokens(b);
    if (ta.length === 0 || tb.length === 0) return true;
    const [small, big] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
    return small.every(t => big.includes(t));
};

type Done = { kind: 'new' | 'existing' | 'already' | 'present'; name: string; course: string };

/** Register someone to study at HQ, or enrol a person we already know. Before saving, it looks the person up so nobody is registered twice. */
const FrontDeskWalkIn: React.FC<{ data: FrontDeskData; prefill?: Prefill | null; onClass?: () => void }> = ({ data, prefill, onClass }) => {
    const activeCourses = useMemo(() => data.courses.filter(c => c.active), [data.courses]);
    const [slug, setSlug] = useState('');
    const [name, setName] = useState(prefill?.name || '');
    const [phone, setPhone] = useState(prefill?.phone || '');
    const [email, setEmail] = useState(prefill?.email || '');
    const [location, setLocation] = useState('');
    const [start, setStart] = useState(today());
    const [intake, setIntake] = useState('');
    const [fee, setFee] = useState('');
    const [paid, setPaid] = useState('');
    const [lessons, setLessons] = useState<number[]>([]);
    const [note, setNote] = useState('');
    const [confirmDiff, setConfirmDiff] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<Done | null>(null);
    const enquiryId = prefill?.enquiryId || null;

    // Default course: Fundamentals of AI, else the first active one
    useEffect(() => {
        if (slug || activeCourses.length === 0) return;
        setSlug((activeCourses.find(c => c.slug === 'ai-fundamentals') || activeCourses[0]).slug);
    }, [activeCourses, slug]);
    const course = activeCourses.find(c => c.slug === slug) || null;
    useEffect(() => { if (course) { setFee(course.fee_ugx > 0 ? String(course.fee_ugx) : ''); setPaid(''); setLessons([]); } }, [course?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

    // Look the person up as soon as there is a phone number (9 or more digits) or an email
    const digits = phone.replace(/\D/g, '');
    const emailOk = /\S+@\S+\.\S+/.test(email);
    const matches = useMemo<PersonRow[]>(() => {
        if (digits.length < 9 && !emailOk) return [];
        return data.allRows.filter(r => (emailOk && normEmail(r.email) === normEmail(email)) || (digits.length >= 9 && lastDigits(r.phone) === lastDigits(phone)));
    }, [data.allRows, digits, emailOk, email, phone]);
    const person = matches[0] || null;
    const personRef = person ? { key: person.key, name: person.name, email: person.email, phone: person.phone } : null;
    const personEnrols: HqEnrolment[] = useMemo(() => (personRef ? data.enrolments.filter(en => samePerson(enrolmentRef(en), personRef)) : []), [data.enrolments, personRef?.key]); // eslint-disable-line react-hooks/exhaustive-deps
    const thisEnrol = personEnrols.find(en => en.course_slug === slug) || null;
    const otherEnrols = personEnrols.filter(en => en.course_slug !== slug);
    const matchedByPhone = !!person && digits.length >= 9 && lastDigits(person.phone) === lastDigits(phone) && !(emailOk && normEmail(person.email) === normEmail(email));
    const differentName = !!person && matchedByPhone && name.trim().length > 1 && !namesAlike(name, person.name);
    const byAgent = person ? channelOf(person) === 'Registered by an agent' : false;
    const courseTitle = (s: string) => data.courses.find(c => c.slug === s)?.title || s;

    const feeNum = toNumber(fee), paidNum = toNumber(paid);
    const needsMoney = !!course && course.fee_ugx > 0;
    const ready = name.trim().length > 1 && digits.length >= 7 && !busy && !thisEnrol && (!differentName || confirmDiff);

    const reset = () => { setName(''); setPhone(''); setEmail(''); setLocation(''); setIntake(''); setLessons([]); setNote(''); setPaid(''); setStart(today()); setConfirmDiff(false); setError(null); setDone(null); setFee(course && course.fee_ugx > 0 ? String(course.fee_ugx) : ''); };
    const toggle = (n: number) => setLessons(l => (l.includes(n) ? l.filter(x => x !== n) : [...l, n].sort((a, b) => a - b)));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ready) return;
        setBusy(true); setError(null);
        const res = await registerStudy({
            name, phone, email, location, lessons, date: today(), note, course: course ? course.slug : null,
            fee: needsMoney ? feeNum : null, paid: needsMoney ? paidNum : null, start, intake, enquiryId,
        });
        setBusy(false);
        if (!res.ok) { setError(res.error || 'Could not register. Please try again.'); return; }
        const created = !!res.data?.created;
        setDone({ kind: created ? 'new' : 'existing', name: name.trim(), course: course?.title || '' });
        void data.reload();
    };

    const markPresent = async () => {
        if (!thisEnrol || !personRef) return;
        const marks = marksFor(data.sheet, thisEnrol.course_slug, personRef);
        const n = course?.lessons_count || 1;
        let lesson = lessons[0] || 0;
        if (!lesson) { lesson = 1; for (let i = 1; i <= n; i++) if (marks.get(i)?.status !== 'present') { lesson = i; break; } }
        setBusy(true); setError(null);
        const res = await setHqAttendance(thisEnrol.course_slug, personRef, lesson, 'present', today());
        setBusy(false);
        if (!res.ok) { setError(res.error || 'Could not mark attendance.'); return; }
        setDone({ kind: 'present', name: person?.name || name.trim(), course: `${course?.title || ''} lesson ${lesson}` });
        void data.reloadHq();
    };

    if (done) {
        const text = done.kind === 'new' ? `Registered ${done.name}` : done.kind === 'existing' ? `Enrolled ${done.name}` : done.kind === 'already' ? `${done.name} is already enrolled` : `Marked ${done.name} present`;
        const sub = done.kind === 'new' ? 'They are on the list under your agent profile and enrolled in the course.'
            : done.kind === 'existing' ? 'They were already on the list, so their earlier registration and agent credit are kept. They are now enrolled.'
            : done.kind === 'present' ? `Present for ${done.course}.` : '';
        return (
            <section className={`${card} p-5 text-center space-y-4`} aria-live="polite">
                <CheckCircle2 size={44} className="mx-auto text-emerald-600" aria-hidden />
                <div>
                    <p className="m-0 text-xl font-extrabold">{text}</p>
                    {done.course && done.kind !== 'present' && <p className="m-0 mt-1 text-base text-stone-600 dark:text-slate-300">{done.course}</p>}
                    <p className="m-0 mt-1 text-sm text-stone-500 dark:text-slate-400">{sub}</p>
                </div>
                <div className="grid gap-3">
                    <button onClick={reset} className="min-h-[60px] px-8 rounded-[14px] bg-brand text-white text-lg font-extrabold">Register another</button>
                    {onClass && <button onClick={onClass} className="min-h-[56px] px-8 rounded-[14px] border-2 border-violet-600 text-violet-700 dark:text-violet-300 text-base font-extrabold">Mark attendance</button>}
                </div>
            </section>
        );
    }

    return (
        <form onSubmit={submit} className={`${card} p-4 sm:p-5 space-y-4`}>
            <div>
                <h2 className="m-0 text-base font-extrabold">Register to study</h2>
                <p className="m-0 mt-0.5 text-xs text-stone-500 dark:text-slate-400">New people are saved under your own agent profile. People we already know keep their first registration.</p>
            </div>

            <label className="block"><span className={label}>Full name *</span><input value={name} onChange={e => setName(e.target.value)} className={input} autoComplete="off" required /></label>
            <label className="block"><span className={label}>Phone *</span><input value={phone} onChange={e => setPhone(e.target.value)} className={input} inputMode="tel" autoComplete="off" placeholder="07XX XXX XXX" required /></label>
            <label className="block">
                <span className={label}>Email (optional)</span>
                <input value={email} onChange={e => setEmail(e.target.value)} className={input} inputMode="email" autoComplete="off" placeholder="name@example.com" />
                <span className="block mt-1 text-xs text-stone-500 dark:text-slate-400">No email? That is fine, we will follow up by phone.</span>
            </label>

            {/* Who is this? Shown as soon as the phone or email matches someone */}
            {person && (
                <div className="rounded-[16px] border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2" role="status" aria-live="polite">
                    <p className="m-0 text-base font-extrabold text-amber-900 dark:text-amber-200">We already know this {matchedByPhone ? 'phone number' : 'email'}</p>
                    <p className="m-0 text-base font-bold">{person.name}</p>
                    <p className="m-0 text-sm text-stone-700 dark:text-slate-200">
                        {byAgent ? `Registered by agent ${person.agent || ''}` : person.agent ? `Came through agent ${person.agent}` : 'Signed up on their own'} on {prettyDate(person.registered_at)}.
                    </p>
                    <p className="m-0 text-sm text-stone-700 dark:text-slate-200">Online account: <b>{person.has_account ? 'yes' : 'no'}</b>{person.has_account ? '. Their online progress is kept.' : '.'}</p>
                    {personEnrols.length > 0 && (
                        <ul className="m-0 pl-5 text-sm text-stone-700 dark:text-slate-200">
                            {personEnrols.map(en => <li key={en.id}>{courseTitle(en.course_slug)}: {STATUS_LABELS[en.status]}</li>)}
                        </ul>
                    )}
                    {byAgent && !thisEnrol && <p className="m-0 text-sm font-semibold text-amber-900 dark:text-amber-200">Already registered by an agent. The credit stays with that agent. Tap Register below to enrol them: yes, it is them.</p>}
                    {otherEnrols.length > 0 && !thisEnrol && <p className="m-0 text-sm text-stone-700 dark:text-slate-200">They study another course here. A second enrolment is fine.</p>}
                    {thisEnrol && (
                        <div className="space-y-2">
                            <p className="m-0 text-base font-bold text-amber-900 dark:text-amber-200">Already enrolled in this course ({STATUS_LABELS[thisEnrol.status]}). No need to register again.</p>
                            <button type="button" onClick={() => void markPresent()} disabled={busy} className="w-full min-h-[60px] rounded-[14px] bg-emerald-600 text-white text-lg font-extrabold disabled:opacity-60">{busy ? 'Saving...' : 'Mark present today'}</button>
                        </div>
                    )}
                    {differentName && (
                        <div className="rounded-[12px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 space-y-2">
                            <p className="m-0 text-sm font-bold text-red-800 dark:text-red-300">This phone is registered to {person.name}. If this is a different person (for example family), use their own phone or email.</p>
                            <label className="flex items-start gap-3 min-h-[56px] text-sm font-semibold">
                                <input type="checkbox" checked={confirmDiff} onChange={e => setConfirmDiff(e.target.checked)} className="mt-1 w-6 h-6" />
                                <span>I checked. Continue with this phone anyway.</span>
                            </label>
                            <button type="button" onClick={() => setName(person.name)} className="min-h-[48px] w-full rounded-[12px] border border-red-300 dark:border-red-800 text-sm font-bold">It is {person.name}: use that name</button>
                        </div>
                    )}
                </div>
            )}

            <label className="block"><span className={label}>Location</span><input value={location} onChange={e => setLocation(e.target.value)} className={input} autoComplete="off" placeholder="Where do they live?" /></label>

            {activeCourses.length > 0 && (
                <div>
                    <label className="block">
                        <span className={label}>Course</span>
                        <select value={slug} onChange={e => setSlug(e.target.value)} className={input}>
                            {activeCourses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
                        </select>
                    </label>
                    {course && <p className="m-0 mt-1 text-sm text-stone-600 dark:text-slate-300">{course.lessons_count} {course.lessons_count === 1 ? 'lesson' : 'lessons'}{course.has_exam ? ', exam' : ''}, {course.fee_ugx > 0 ? `fee ${ugx(course.fee_ugx)}` : 'free'}</p>}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className={label}>Start date</span><input type="date" value={start} onChange={e => e.target.value && setStart(e.target.value)} className={input} /></label>
                <label className="block"><span className={label}>Intake or group</span><input value={intake} onChange={e => setIntake(e.target.value)} className={input} autoComplete="off" placeholder="optional" /></label>
            </div>

            {needsMoney && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block"><span className={label}>Fee (UGX)</span><input value={fee} onChange={e => setFee(e.target.value)} className={input} inputMode="numeric" /></label>
                        <label className="block"><span className={label}>Paid today (UGX)</span><input value={paid} onChange={e => setPaid(e.target.value)} className={input} inputMode="numeric" placeholder="0" /></label>
                    </div>
                    <p className={`m-0 text-base font-bold ${paidNum > feeNum ? 'text-red-700 dark:text-red-300' : ''}`} aria-live="polite">
                        {paidNum > feeNum ? `Paid is more than the fee by ${ugx(paidNum - feeNum)}. Please check.` : `Balance: ${ugx(Math.max(0, feeNum - paidNum))}`}
                    </p>
                </div>
            )}

            {course && course.lessons_count > 0 && !thisEnrol && (
                <div>
                    <span className={label}>Lessons attended today</span>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Lessons attended today">
                        {Array.from({ length: course.lessons_count }, (_, i) => i + 1).map(n => (
                            <button key={n} type="button" aria-pressed={lessons.includes(n)} onClick={() => toggle(n)} className={`${chip(lessons.includes(n))} min-w-[64px]`}>{lessons.includes(n) ? '✓ ' : ''}{n}</button>
                        ))}
                    </div>
                    <span className="block mt-1 text-xs text-stone-500 dark:text-slate-400">None selected is fine if they only came to register.</span>
                </div>
            )}

            <label className="block"><span className={label}>Note (optional)</span><textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className={`${input} py-2`} /></label>
            {error && <p role="alert" className={errorBox}>{error}</p>}
            <button type="submit" disabled={!ready} className="w-full min-h-[64px] rounded-[14px] bg-brand text-white text-lg font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                {busy ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : byAgent && !thisEnrol ? 'Yes, it is them: enrol' : person && !thisEnrol ? 'Enrol in this course' : 'Register'}
            </button>
        </form>
    );
};

export default FrontDeskWalkIn;
