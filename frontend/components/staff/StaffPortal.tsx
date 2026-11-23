import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import {
    AlertTriangle, Check, CheckCircle2, Clock, Copy, Download, ExternalLink, LayoutDashboard, Loader2, MessageCircle,
    RefreshCw, Search, Trophy, UserPlus, Users, WifiOff
} from 'lucide-react';
import { ALL_ITEMS } from '../../src/content/aiFundamentals';
import { OFFICIAL_COURSE_CATALOG } from '../../src/lib/outreachSync';
import {
    LeaderRow, ProfileState, RegisterInput, StaffProfile, StaffStats, StaffStudent,
    flushRegistrationQueue, loadLeaderboard, loadStaffProfile, loadStaffStats, loadStaffStudents,
    queuedCount, registerStudent, staffLink, startMessage, whatsappShare,
    StaffFunnel, loadMyFunnel, joinLink, generateTempPassword, createClientAccount, clientCredentialsMessage
} from '../../src/lib/staffApi';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, INK, Logo, MUTED, PAPER, ThemeButton } from '../learn/learnUi';

type Tab = 'overview' | 'register' | 'students' | 'leaderboard';
const TOTAL_ITEMS = ALL_ITEMS.length;

const FREE_COURSE = 'AI Fundamentals (free)';
const PAGES = [
    { label: 'Free AI Fundamentals course', to: '/free/ai-fundamentals' },
    { label: 'Home page', to: '/' },
    { label: 'Course catalogue', to: '/discover' },
    { label: 'Official registration form', to: '/register' }
];

const INPUT = 'w-full h-[50px] rounded-[14px] border-2 border-transparent bg-panel dark:bg-night-3 px-4 text-[15px] focus:outline-none focus:border-brand transition-colors';

const ago = (iso: string | null) => {
    if (!iso) return 'never';
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 2) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
    return `${Math.round(mins / 1440)} days ago`;
};

const useCopy = () => {
    const [copied, setCopied] = useState<string | null>(null);
    const copy = async (text: string, key: string) => {
        try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1800); } catch { /* ignore */ }
    };
    return { copied, copy };
};

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
const Overview: React.FC<{ profile: StaffProfile; stats: StaffStats | null; onRefresh: () => void }> = ({ profile, stats, onRefresh }) => {
    const [funnel, setFunnel] = useState<StaffFunnel | null>(null);
    const [days, setDays] = useState<number | null>(null);
    useEffect(() => { void loadMyFunnel(days).then(setFunnel); }, [stats, days]);
    const quick = joinLink(profile.slug);
    const [target, setTarget] = useState(PAGES[0].to);
    const [qr, setQr] = useState('');
    const { copied, copy } = useCopy();
    const link = staffLink(profile.slug, target);

    useEffect(() => {
        QRCode.toDataURL(link, { margin: 2, width: 512 }).then(setQr).catch(() => setQr(''));
    }, [link]);

    const tiles = stats ? [
        { label: 'Link clicks', value: stats.clicks },
        { label: 'Registered by me', value: stats.registered },
        { label: 'Signed up', value: stats.signups },
        { label: 'Started learning', value: stats.started },
        { label: 'Completed', value: stats.completed },
        { label: 'My points', value: stats.points }
    ] : [];

    const tileTones = ['bg-white dark:bg-night-2', 'bg-white dark:bg-night-2', 'bg-white dark:bg-night-2', 'bg-white dark:bg-night-2', 'bg-white dark:bg-night-2', 'bg-lime-200 text-night'];
    const first = (profile.display_name || '').split(' ')[0];

    return (
        <div className="flex flex-col gap-5">
            {/* banner */}
            <section className="relative overflow-hidden rounded-[26px] bg-brand text-white p-6 sm:p-8 flex flex-wrap items-center gap-6">
                <span aria-hidden="true" className="absolute -right-16 -top-24 w-[300px] h-[300px] rounded-full bg-brand-mid" />
                <span aria-hidden="true" className="absolute right-40 -bottom-32 w-[220px] h-[220px] rounded-full bg-brand-mid" />
                <div className="relative flex-1 min-w-[240px]">
                    <p className="m-0 text-[12px] font-bold tracking-[0.12em] uppercase text-[#D9CCFF]">Agent portal · {profile.staff_code}</p>
                    <h1 className="mt-2 mb-0 text-[26px] sm:text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em]">Hello{first ? `, ${first}` : ''}. Let's bring more people into AI.</h1>
                    <p className="mt-2 mb-0 text-[14px] text-[#E4DAFF]">Points: signed up 1, started 2, completed 5.</p>
                </div>
                {stats && (
                    <div className="relative flex gap-3">
                        <div className="rounded-[18px] bg-white text-ink px-5 py-3.5 text-center min-w-[104px]">
                            <p className="m-0 text-[28px] font-extrabold tracking-[-0.02em] tabular-nums">{stats.points}</p>
                            <p className="m-0 text-[12px] font-bold text-[#6B6680]">points</p>
                        </div>
                        <div className="rounded-[18px] bg-lime-200 text-night px-5 py-3.5 text-center min-w-[104px]">
                            <p className="m-0 text-[28px] font-extrabold tracking-[-0.02em] tabular-nums">#{stats.rank}</p>
                            <p className="m-0 text-[12px] font-bold text-lime-900">of {stats.staff_total}</p>
                        </div>
                    </div>
                )}
            </section>

            {/* stat tiles */}
            <section aria-labelledby="results">
                <div className="flex items-center justify-between mb-3">
                    <h2 id="results" className="m-0 text-[18px] font-extrabold">My results</h2>
                    <button onClick={onRefresh} className="press h-10 px-3.5 rounded-[12px] bg-white dark:bg-night-2 text-[13px] font-bold inline-flex items-center gap-1.5 text-brand dark:text-violet-300"><RefreshCw size={14} /> Refresh</button>
                </div>
                {!stats ? <div className={`${CARD} p-8 flex justify-center`}><Loader2 className="animate-spin text-brand" /></div> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {tiles.map((t, i) => (
                            <div key={t.label} className={`${tileTones[i]} rounded-[20px] p-4`}>
                                <p className="m-0 text-[30px] font-extrabold tracking-[-0.02em] tabular-nums">{t.value}</p>
                                <p className={`m-0 text-[12px] font-bold ${i === 5 ? 'text-lime-900' : MUTED}`}>{t.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* links */}
                <div className="flex flex-col gap-5">
                    <section className={`${CARD} p-5 sm:p-6`}>
                        <div className="flex items-start gap-3">
                            <span className="w-11 h-11 rounded-[14px] bg-lime-200 text-night inline-flex items-center justify-center shrink-0"><UserPlus size={20} /></span>
                            <div className="min-w-0">
                                <h2 className="m-0 text-[17px] font-extrabold">Quick sign-up link</h2>
                                <p className={`mt-1 mb-0 text-[13px] leading-relaxed ${MUTED}`}>A very short form where a client opens their own account. They are counted for you automatically. Starts with the free course; other courses can be chosen too.</p>
                            </div>
                        </div>
                        <div className="mt-4 rounded-[14px] bg-panel dark:bg-night-3 px-4 py-3 text-[13px] break-all font-mono">{quick}</div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <button onClick={() => copy(quick, 'quick')} className={BTN_PRIMARY}>{copied === 'quick' ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy sign-up link</>}</button>
                            <a href={whatsappShare(`Open your free Welile School of AI account here (takes one minute): ${quick}`)} target="_blank" rel="noreferrer" className={BTN_SECONDARY}><MessageCircle size={18} /> Share on WhatsApp</a>
                        </div>
                    </section>

                    <section className={`${CARD} p-5 sm:p-6`}>
                        <h2 className="m-0 text-[17px] font-extrabold">Your personal link</h2>
                        <p className={`mt-1 mb-0 text-[13px] ${MUTED}`}>Anyone who joins through this link is counted for you, and they never see your code.</p>
                        <div className="mt-4 flex flex-col sm:flex-row gap-5 items-start">
                            <div className="space-y-3 min-w-0 flex-1 w-full">
                                <div>
                                    <label htmlFor="page" className="block text-[13px] font-bold mb-1.5">Send people to</label>
                                    <select id="page" value={target} onChange={e => setTarget(e.target.value)} className={INPUT}>
                                        {PAGES.map(p => <option key={p.to} value={p.to}>{p.label}</option>)}
                                    </select>
                                </div>
                                <div className="rounded-[14px] bg-panel dark:bg-night-3 px-4 py-3 text-[13px] break-all font-mono">{link}</div>
                                <div className="grid grid-cols-1 gap-2.5">
                                    <button onClick={() => copy(link, 'link')} className={BTN_PRIMARY}>
                                        {copied === 'link' ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy link</>}
                                    </button>
                                    <a href={whatsappShare(startMessage(null, link))} target="_blank" rel="noreferrer" className={BTN_SECONDARY}><MessageCircle size={18} /> Share on WhatsApp</a>
                                </div>
                            </div>
                            <div className="mx-auto sm:mx-0 text-center shrink-0 rounded-[20px] bg-panel dark:bg-night-3 p-3">
                                {qr ? <img src={qr} alt="QR code for your link" className="w-40 h-40 rounded-[14px] bg-white" /> : <div className="w-40 h-40" />}
                                <a href={qr} download={`welile-${profile.slug}-qr.png`} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand dark:text-violet-300 no-underline hover:underline"><Download size={14} /> Download QR</a>
                            </div>
                        </div>
                    </section>
                </div>

                {/* funnel */}
                <section className={`${CARD} p-5 sm:p-6`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h2 className="m-0 text-[17px] font-extrabold">Where your clients are</h2>
                        <div className="inline-flex p-1 rounded-[12px] bg-panel dark:bg-night-3" role="group" aria-label="Period">
                            {([[7, '7 days'], [30, '30 days'], [null, 'All']] as [number | null, string][]).map(([d, l]) => (
                                <button key={l} onClick={() => setDays(d)} aria-pressed={days === d} className={`press h-8 px-3 rounded-[9px] text-[12px] font-bold ${days === d ? 'bg-brand text-white' : 'text-[#6B6680] dark:text-slate-400'}`}>{l}</button>
                            ))}
                        </div>
                    </div>
                    {!funnel ? <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-brand" /></div> : (
                        <>
                            {funnel.daily && funnel.daily.length > 0 && (
                                <div className="mt-4 rounded-[18px] bg-panel dark:bg-night-3/60 p-4" aria-label="New accounts per day, last 14 days">
                                    <div className="flex items-end gap-1.5 h-24">
                                        {funnel.daily.map((n, i) => {
                                            const m = Math.max(1, ...funnel.daily);
                                            const last = i === funnel.daily.length - 1;
                                            return <div key={i} title={`${n}`} className={`flex-1 rounded-[6px] ${last ? 'bg-brand' : 'bg-[#C9B8F5] dark:bg-brand-mid'}`} style={{ height: `${Math.max(8, (n / m) * 100)}%`, opacity: n ? 1 : 0.4 }} />;
                                        })}
                                    </div>
                                    <p className={`mt-2 mb-0 text-[12px] font-semibold ${MUTED}`}>New accounts per day, last 14 days</p>
                                </div>
                            )}
                            <div className="mt-4 space-y-3">
                                {[
                                    ['Registered by you', funnel.registered], ['Accounts opened', funnel.accounts], ['In the free course', funnel.enrolled],
                                    ['Studying the recorded lessons', funnel.recorded], ['Joined a live class', funnel.live], ['Active in the last 7 days', funnel.active_7d], ['Completed and certified', funnel.completed]
                                ].map(([label, n], i, arr) => {
                                    const max = Math.max(1, funnel.registered, funnel.accounts);
                                    const lastRow = i === arr.length - 1;
                                    return (
                                        <div key={String(label)}>
                                            <div className="flex justify-between text-[13px]"><span className="font-semibold">{label}</span><span className="font-extrabold tabular-nums">{n}</span></div>
                                            <div className="h-2 rounded-full bg-[#EEEBF6] dark:bg-night-3 mt-1.5"><div className={`h-2 rounded-full ${lastRow ? 'bg-mint' : 'bg-brand'}`} style={{ width: `${Math.min(100, (Number(n) / max) * 100)}%` }} /></div>
                                        </div>
                                    );
                                })}
                            </div>
                            {funnel.by_location && Object.keys(funnel.by_location).length > 0 && (
                                <div className="mt-5">
                                    <p className={`m-0 text-[12px] font-bold uppercase tracking-[0.1em] ${MUTED}`}>Where they are</p>
                                    <div className="mt-2 flex flex-wrap gap-2">{Object.entries(funnel.by_location).map(([c, n]) => <span key={c} className="px-3 py-1.5 rounded-full bg-brand-soft dark:bg-night-3 text-brand-ink dark:text-violet-200 text-[12px] font-bold">{c} · {n}</span>)}</div>
                                </div>
                            )}
                            {Object.keys(funnel.by_course).length > 0 && (
                                <div className="mt-4">
                                    <p className={`m-0 text-[12px] font-bold uppercase tracking-[0.1em] ${MUTED}`}>By course</p>
                                    <div className="mt-2 flex flex-wrap gap-2">{Object.entries(funnel.by_course).map(([c, n]) => <span key={c} className="px-3 py-1.5 rounded-full bg-lime-100 text-lime-900 text-[12px] font-bold">{c} · {n}</span>)}</div>
                                </div>
                            )}
                        </>
                    )}
                    {stats && <p className={`mt-5 mb-0 text-[13px] ${MUTED}`}>You are ranked <span className="font-extrabold text-ink dark:text-slate-100">{stats.rank}</span> of {stats.staff_total}.</p>}
                </section>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Register a student
// ---------------------------------------------------------------------------
const emptyForm = { name: '', phone: '', email: '', location: '', course: FREE_COURSE, campaign: '', notes: '', consent: false, createNow: true, password: '' };

const Register: React.FC<{ profile: StaffProfile; onDone: () => void }> = ({ profile, onDone }) => {
    const [form, setForm] = useState(emptyForm);
    const [busy, setBusy] = useState(false);
    const sending = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<{ name: string; phone: string; queued: boolean; email: string; tempPassword: string | null; accountMsg: string | null } | null>(null);
    const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

    const isFree = form.course === FREE_COURSE;
    const courses = [FREE_COURSE, ...OFFICIAL_COURSE_CATALOG.filter(c => c.title !== 'Fundamentals of AI').map(c => c.title)];

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sending.current) return;   // a double tap must not send the same student twice
        setError(null);
        if (form.name.trim().length < 2) return setError("Please enter the student's full name.");
        if (form.phone.replace(/\D/g, '').length < 9) return setError('Please enter a valid phone number.');
        if (form.location.trim().length < 2) return setError('Please enter where the student is based (town or district).');
        if (!form.consent) return setError('The student must agree to be contacted.');
        const wantAccount = form.createNow && !!form.email.trim();
        if (wantAccount && form.password.length < 8) return setError('Choose a temporary password of at least 8 characters, or tap Generate.');

        const input: RegisterInput = {
            name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
            courseTitle: form.course, courseSlug: isFree ? 'ai-fundamentals' : null,
            campaign: form.campaign.trim(), notes: form.notes.trim(), location: form.location.trim(), consent: true
        };
        sending.current = true;
        setBusy(true);
        try {
            const r = await registerStudent(input);
            if (!r.ok) { setError(r.message || 'Could not register this student.'); return; }
            let tempPassword: string | null = null, accountMsg: string | null = null;
            if (wantAccount && !r.queued) {
                const a = await createClientAccount({ email: input.email, password: form.password, name: input.name, phone: input.phone, courseSlug: input.courseSlug, staffSlug: profile.slug, location: input.location });
                if (a.ok) tempPassword = form.password; else accountMsg = a.message || 'The account could not be created. The registration was saved; the client can sign up with their email.';
            }
            setDone({ name: input.name, phone: r.phone || input.phone, queued: !!r.queued, email: input.email, tempPassword, accountMsg });
            onDone();
        } catch (err: any) {
            setError(err?.message || 'Could not register this student.');
        } finally {
            sending.current = false;
            setBusy(false);
        }
    };

    if (done) {
        const link = staffLink(profile.slug, '/free/ai-fundamentals');
        const phoneDigits = (() => { const d = done.phone.replace(/\D/g, ''); return d.startsWith('0') ? '256' + d.slice(1) : d; })();
        return (
            <div className={`${CARD} p-6 sm:p-8 text-center max-w-[560px] mx-auto`}>
                <span className="mx-auto w-16 h-16 rounded-[20px] bg-mint-soft text-mint flex items-center justify-center"><CheckCircle2 size={32} /></span>
                <h2 className="text-2xl font-extrabold tracking-[-0.02em] mt-3">{done.queued ? 'Saved on this phone' : 'Student registered'}</h2>
                <p className={`mt-1 ${MUTED}`}>
                    {done.queued ? `${done.name} will be registered as soon as you are online.` : `${done.name} is registered under your name.`}
                </p>
                {done.tempPassword && (
                    <div className="mt-4 text-left rounded-[18px] bg-mint-soft dark:bg-emerald-950/30 p-4 text-sm">
                        <p className="font-semibold">Account created for {done.email}</p>
                        <p className="mt-1">Temporary password: <span className="font-mono font-semibold">{done.tempPassword}</span></p>
                        <p className={`mt-2 ${MUTED}`}>We emailed {done.name.split(' ')[0]} a confirmation link. After confirming, they sign in with this password and choose their own. Send them the details now:</p>
                        <a href={whatsappShare(clientCredentialsMessage(done.name, done.email, done.tempPassword), phoneDigits)} target="_blank" rel="noreferrer" className={`${BTN_PRIMARY} mt-3`}><MessageCircle size={18} /> Send sign-in details on WhatsApp</a>
                    </div>
                )}
                {done.accountMsg && <p role="alert" className="mt-4 text-sm text-amber-800 dark:text-amber-300">{done.accountMsg}</p>}
                {isFree && !done.tempPassword && (
                    <>
                        <p className={`mt-4 text-sm ${MUTED}`}>Now send them their link so they can create their login and start.</p>
                        <a href={whatsappShare(startMessage(done.name, link), phoneDigits)} target="_blank" rel="noreferrer" className={`${BTN_PRIMARY} mt-3`}>
                            <MessageCircle size={18} /> Send start link on WhatsApp
                        </a>
                    </>
                )}
                <div className="mt-3"><button onClick={() => { setDone(null); setError(null); setForm(emptyForm); }} className={BTN_SECONDARY}><UserPlus size={18} /> Register another student</button></div>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className={`${CARD} p-5 sm:p-7 space-y-5 max-w-[760px]`} noValidate>
            <div className="flex items-start gap-3">
                <span className="w-12 h-12 rounded-[15px] bg-brand text-white inline-flex items-center justify-center shrink-0"><UserPlus size={22} /></span>
                <div>
                <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">Register a student</h2>
                <p className={`text-sm mt-1 ${MUTED}`}>Registered under <span className="font-semibold">{profile.display_name}</span> ({profile.staff_code}). If you have no signal the entry is saved on this phone.</p>
                </div>
            </div>

            <div>
                <label htmlFor="r-name" className="block text-[13px] font-bold mb-1.5">Full name *</label>
                <input id="r-name" value={form.name} onChange={set('name')} autoComplete="off" className={INPUT} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="r-phone" className="block text-[13px] font-bold mb-1.5">Phone number *</label>
                    <input id="r-phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" className={INPUT} />
                </div>
                <div>
                    <label htmlFor="r-email" className="block text-[13px] font-bold mb-1.5">Email (optional)</label>
                    <input id="r-email" type="email" inputMode="email" value={form.email} onChange={set('email')} placeholder="name@example.com" className={INPUT} />
                    {!form.email.trim() && <p className={`mt-1 text-xs ${MUTED}`}>No email? That is fine. We will follow up on the phone number, and they can open their account later with your link.</p>}
                </div>
            </div>
            <div>
                <label htmlFor="r-loc" className="block text-[13px] font-bold mb-1.5">Location *</label>
                <input id="r-loc" value={form.location} onChange={set('location')} placeholder="Town or district, e.g. Kampala" className={INPUT} />
            </div>
            {form.email.trim() && (
                <div className="rounded-[18px] bg-brand-soft/60 dark:bg-night-3/60 p-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={form.createNow} onChange={set('createNow')} className="mt-1 accent-[#5B2BC4] w-5 h-5 shrink-0" />
                        <span className="text-sm leading-snug"><span className="font-semibold">Open their account now</span> with a temporary password. They confirm their email, then choose their own password the first time they sign in.</span>
                    </label>
                    {form.createNow && (
                        <div>
                            <label htmlFor="r-pass" className="block text-[13px] font-bold mb-1.5">Temporary password</label>
                            <div className="flex gap-2">
                                <input id="r-pass" value={form.password} onChange={set('password')} autoComplete="off" className={`${INPUT} font-mono`} />
                                <button type="button" onClick={() => setForm(f => ({ ...f, password: generateTempPassword() }))} className={BTN_SECONDARY}>Generate</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div>
                <label htmlFor="r-course" className="block text-[13px] font-bold mb-1.5">Programme</label>
                <select id="r-course" value={form.course} onChange={set('course')} className={INPUT}>
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {!isFree && (
                    <p className="mt-2 text-sm rounded-[14px] bg-[#FFF3D6] dark:bg-amber-950/30 text-[#6B4A00] dark:text-amber-200 p-3.5">
                        This records an interest only. To enrol someone in a paid programme, use the official registration form, which keeps your name as the registrar.{' '}
                        <a href={`/register?staff=${encodeURIComponent(profile.display_name)}`} target="_blank" rel="noreferrer" className="font-semibold underline inline-flex items-center gap-1">Open the official form <ExternalLink size={13} /></a>
                    </p>
                )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="r-campaign" className="block text-[13px] font-bold mb-1.5">Event or place <span className={`font-normal ${MUTED}`}>(optional)</span></label>
                    <input id="r-campaign" value={form.campaign} onChange={set('campaign')} placeholder="e.g. Nkumba outreach" className={INPUT} />
                </div>
                <div>
                    <label htmlFor="r-notes" className="block text-[13px] font-bold mb-1.5">Notes <span className={`font-normal ${MUTED}`}>(optional)</span></label>
                    <input id="r-notes" value={form.notes} onChange={set('notes')} className={INPUT} />
                </div>
            </div>
            <label className="flex items-start gap-3 rounded-[18px] bg-lime-100 text-lime-900 p-4 cursor-pointer">
                <input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-1 accent-[#5B2BC4] w-5 h-5 shrink-0" />
                <span className="text-sm leading-snug">The student has agreed that Welile School of AI may contact them about this programme.</span>
            </label>

            {error && <p role="alert" className="text-sm text-red-600 flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{error}</p>}
            <button type="submit" disabled={busy} className={`${BTN_PRIMARY} w-full`}>{busy ? <><Loader2 className="animate-spin" size={18} /> Saving...</> : <><UserPlus size={18} /> Register student</>}</button>
        </form>
    );
};

// ---------------------------------------------------------------------------
// My students
// ---------------------------------------------------------------------------
const statusOf = (s: StaffStudent): { label: string; tone: 'amber' | 'slate' | 'violet' | 'green' } => {
    if (s.completed) return { label: 'Completed', tone: 'green' };
    if (!s.account_linked) return { label: 'Waiting to sign up', tone: 'amber' };
    if (s.items_done === 0) return { label: 'Signed up, not started', tone: 'slate' };
    return { label: `In progress ${Math.round((s.items_done / TOTAL_ITEMS) * 100)}%`, tone: 'violet' };
};
const TONES = {
    amber: 'bg-[#FFF3D6] text-[#6B4A00]', slate: 'bg-panel text-[#4A4560] dark:bg-night-3 dark:text-slate-200',
    violet: 'bg-brand-soft text-brand-ink dark:bg-night-3 dark:text-violet-200', green: 'bg-mint-soft text-[#0E5A35]'
};

const Students: React.FC<{ profile: StaffProfile; students: StaffStudent[] | null; onRefresh: () => void }> = ({ profile, students, onRefresh }) => {
    const [filter, setFilter] = useState<'all' | 'waiting' | 'learning' | 'done'>('all');
    const [q, setQ] = useState('');
    const link = staffLink(profile.slug, '/free/ai-fundamentals');

    const rows = useMemo(() => (students || []).filter(s => {
        const st = statusOf(s).label;
        if (filter === 'waiting' && s.account_linked) return false;
        if (filter === 'learning' && !(s.account_linked && !s.completed)) return false;
        if (filter === 'done' && !s.completed) return false;
        const hay = `${s.name} ${s.email || ''} ${s.phone || ''} ${s.course} ${st}`.toLowerCase();
        return hay.includes(q.trim().toLowerCase());
    }), [students, filter, q]);

    if (!students) return <Loader2 className="animate-spin text-brand" />;

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-1 min-w-[12rem]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A94AE]" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search students" aria-label="Search students" className={`${INPUT} pl-10 bg-white dark:bg-night-2`} />
                </div>
                <button onClick={onRefresh} aria-label="Refresh" className="press w-[50px] h-[50px] rounded-[14px] bg-white dark:bg-night-2 inline-flex items-center justify-center text-brand dark:text-violet-300"><RefreshCw size={17} /></button>
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2 mb-3">
                {([['all', 'All'], ['waiting', 'Waiting to sign up'], ['learning', 'Learning'], ['done', 'Completed']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id}
                        className={`press shrink-0 h-10 px-4 rounded-full text-[13px] font-bold ${filter === id ? 'bg-brand text-white' : 'bg-white dark:bg-night-2 text-ink dark:text-slate-300'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {rows.length === 0 ? (
                <p className={`${CARD} p-6 text-center text-sm ${MUTED}`}>{students.length === 0 ? 'No students yet. Share your link or register someone.' : 'No students match.'}</p>
            ) : (
                <ul className="m-0 p-0 list-none grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {rows.map(s => {
                        const st = statusOf(s);
                        return (
                            <li key={`${s.kind}-${s.id}`} className={`${CARD} p-4`}>
                                <div className="flex items-start justify-between gap-3">
                                    <span aria-hidden="true" className="w-11 h-11 rounded-full bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 inline-flex items-center justify-center text-[14px] font-extrabold shrink-0">{(s.name || 'S').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="m-0 text-[15px] font-extrabold leading-snug">{s.name || 'Student'}</p>
                                        <p className={`text-sm truncate ${MUTED}`}>{[s.phone && `+${s.phone}`, s.email].filter(Boolean).join(' · ') || 'No contact details'}</p>
                                    </div>
                                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${TONES[st.tone]}`}>{st.label}</span>
                                </div>
                                <p className={`mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1 ${MUTED}`}>
                                    <span>{s.course}</span>
                                    <span>{s.kind === 'assisted' ? 'Registered by you' : 'Joined by your link'}</span>
                                    <span className="inline-flex items-center gap-1"><Clock size={12} /> Active {ago(s.last_active)}</span>
                                </p>
                                {s.kind === 'assisted' && !s.account_linked && s.phone && (
                                    <a href={whatsappShare(startMessage(s.name, link), s.phone)} target="_blank" rel="noreferrer" className={`${BTN_SECONDARY} mt-3 !py-2 !px-4 !text-sm`}>
                                        <MessageCircle size={16} /> Remind on WhatsApp
                                    </a>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------
const Leaderboard: React.FC<{ rows: LeaderRow[] | null }> = ({ rows }) => {
    if (!rows) return <Loader2 className="animate-spin text-brand" />;
    return (
        <div className={`${CARD} overflow-hidden`}>
            <div className="relative overflow-hidden px-6 py-6 bg-night text-white">
                <span aria-hidden="true" className="absolute -right-10 -top-14 w-44 h-44 rounded-full bg-night-3" />
                <h2 className="relative m-0 text-[22px] font-extrabold tracking-[-0.02em] flex items-center gap-2"><Trophy size={22} className="text-lime-200" /> Top agents</h2>
                <p className="relative mt-1 mb-0 text-[13px] text-[#C9C3E6]">Points: signed up 1, started learning 2, completed the course 5.</p>
            </div>
            {rows.length === 0 ? <p className={`p-5 text-sm ${MUTED}`}>No results yet.</p> : (
                <ol className="m-0 p-2 list-none">
                    {rows.map((r, i) => (
                        <li key={r.id} className={`flex items-center gap-4 px-4 py-3 rounded-[16px] ${r.is_me ? 'bg-brand-soft dark:bg-night-3' : ''}`}>
                            <span className={`w-9 h-9 rounded-[11px] inline-flex items-center justify-center text-[15px] font-extrabold shrink-0 ${i === 0 ? 'bg-lime-200 text-night' : i === 1 ? 'bg-brand text-white' : i === 2 ? 'bg-brand-soft text-brand dark:bg-night-3 dark:text-violet-300' : 'bg-panel dark:bg-night-3 text-[#6B6680]'}`}>{i + 1}</span>
                            <span className="flex-1 min-w-0">
                                <span className="block font-medium truncate">{r.display_name}{r.is_me && <span className="ml-2 text-xs font-semibold text-brand dark:text-violet-300">You</span>}</span>
                                <span className={`block text-xs ${MUTED}`}>{r.signups} signed up · {r.completed} completed</span>
                            </span>
                            <span className="text-[18px] font-extrabold tabular-nums text-brand dark:text-violet-300">{r.points}<span className="text-[11px] font-bold text-[#6B6680] ml-1">pts</span></span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Portal shell
// ---------------------------------------------------------------------------
const TABS: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'register', label: 'Register', icon: UserPlus },
    { id: 'students', label: 'My students', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
];

const StaffPortal: React.FC<{ session: any }> = ({ session }) => {
    const [state, setState] = useState<ProfileState | null>(null);
    const [tab, setTab] = useState<Tab>('overview');
    const [stats, setStats] = useState<StaffStats | null>(null);
    const [students, setStudents] = useState<StaffStudent[] | null>(null);
    const [leaders, setLeaders] = useState<LeaderRow[] | null>(null);
    const [pending, setPending] = useState(queuedCount());
    const [notice, setNotice] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        try { setStats(await loadStaffStats()); } catch { /* shown as loading */ }
        try { setStudents(await loadStaffStudents()); } catch { setStudents([]); }
        try { setLeaders(await loadLeaderboard()); } catch { setLeaders([]); }
    }, []);

    const flush = useCallback(async () => {
        if (queuedCount() === 0) return;
        const r = await flushRegistrationQueue();
        setPending(r.remaining);
        if (r.sent || r.rejected.length) {
            const bad = r.rejected.map(x => `${x.name}: ${x.reason}`).join(' ');
            setNotice(`${r.sent} saved registration${r.sent === 1 ? '' : 's'} sent.${bad ? ` Not added: ${bad}` : ''}`);
            void loadAll();
        }
    }, [loadAll]);

    useEffect(() => {
        document.title = 'Agent portal | Welile School of AI';
        loadStaffProfile().then(s => { setState(s); if (s.status === 'ok') { void loadAll(); void flush(); } });
        const onOnline = () => void flush();
        window.addEventListener('online', onOnline);
        return () => window.removeEventListener('online', onOnline);
    }, [loadAll, flush]);

    if (!state) return <div className={`min-h-screen ${PAPER} flex items-center justify-center`}><Loader2 className="animate-spin text-brand" size={32} /></div>;

    if (state.status !== 'ok') {
        const email = session?.user?.email || 'your email';
        return (
            <div className={`min-h-screen ${PAPER} ${INK}`}>
                <header className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between"><Logo className="h-11" /><ThemeButton /></header>
                <main className="max-w-lg mx-auto px-4 py-12 text-center">
                    <AlertTriangle className="mx-auto text-amber-600" size={44} />
                    <h1 className="text-2xl font-extrabold tracking-[-0.02em] mt-4">
                        {state.status === 'missing' ? 'The staff portal is not switched on yet' : state.status === 'error' ? 'Could not open the staff portal' : 'This login is not linked to a staff profile'}
                    </h1>
                    <p className={`mt-2 ${MUTED}`}>
                        {state.status === 'not_staff' && <>You are signed in as <span className="font-semibold">{email}</span>. Ask an administrator to link this email to your staff profile (Admin, then Staff).</>}
                        {state.status === 'missing' && 'An administrator needs to finish the setup. Please try again later.'}
                        {state.status === 'error' && state.message}
                    </p>
                    <Link to="/dashboard" className={`${BTN_PRIMARY} mt-6`}>Go to my dashboard</Link>
                </main>
            </div>
        );
    }

    const profile = state.profile;

    return (
        <div className={`min-h-screen ${PAPER} ${INK} pb-32 lg:pb-0`}>
            <div className="max-w-[1480px] mx-auto flex items-start gap-5 lg:p-5">
                {/* desktop sidebar */}
                <aside className="hidden lg:flex sticky top-5 w-[264px] shrink-0 h-[calc(100vh-40px)] flex-col rounded-[24px] bg-white dark:bg-night-2 p-4">
                    <div className="px-2 pt-1 pb-4"><Logo className="h-10" /></div>
                    <div className="rounded-[18px] bg-brand-soft dark:bg-night-3 p-3.5 flex items-center gap-3">
                        <span aria-hidden="true" className="w-11 h-11 rounded-full bg-brand text-white inline-flex items-center justify-center text-[15px] font-extrabold">{(profile.display_name || 'A').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}</span>
                        <span className="min-w-0">
                            <span className="block text-[14px] font-extrabold truncate">{profile.display_name}</span>
                            <span className="block text-[12px] font-semibold text-brand dark:text-violet-300">Sales agent · {profile.staff_code}</span>
                        </span>
                    </div>
                    <p className="mt-5 mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6680] dark:text-slate-400">Agent portal</p>
                    <nav className="flex flex-col gap-1" aria-label="Agent sections">
                        {TABS.map(t => {
                            const on = tab === t.id;
                            return (
                                <button key={t.id} onClick={() => setTab(t.id)} aria-current={on ? 'page' : undefined}
                                    className={`press relative h-12 px-3 rounded-[14px] flex items-center gap-3 text-[14px] font-bold text-left ${on ? 'bg-brand-soft dark:bg-night-3 text-brand-ink dark:text-white' : 'text-[#4A4560] dark:text-slate-300 hover:bg-panel dark:hover:bg-night-3/60'}`}>
                                    {on && <span aria-hidden="true" className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-brand" />}
                                    <t.icon size={19} className={on ? 'text-brand dark:text-violet-300' : ''} />{t.label}
                                    {t.id === 'register' && pending > 0 && <span className="ml-auto min-w-6 h-6 px-1.5 rounded-full bg-[#F0533A] text-white text-[11px] font-extrabold inline-flex items-center justify-center">{pending}</span>}
                                </button>
                            );
                        })}
                    </nav>
                    {stats && (
                        <div className="mt-5 rounded-[18px] bg-lime-200 text-night p-4">
                            <p className="m-0 text-[12px] font-bold text-lime-900">Your rank</p>
                            <p className="m-0 text-[26px] font-extrabold tracking-[-0.02em]">#{stats.rank} <span className="text-[13px] font-bold text-lime-900">of {stats.staff_total}</span></p>
                            <p className="m-0 text-[12px] font-semibold text-lime-900">{stats.points} points</p>
                        </div>
                    )}
                    <div className="flex-1" />
                    <div className="flex items-center gap-2 pt-3 border-t border-[#EEEBF6] dark:border-night-3">
                        <Link to="/dashboard" className="press flex-1 h-11 px-3 rounded-[14px] bg-panel dark:bg-night-3 text-[13px] font-bold inline-flex items-center gap-2 no-underline text-ink dark:text-white"><LayoutDashboard size={16} />My courses</Link>
                        <ThemeButton />
                    </div>
                </aside>

                <div className="flex-1 min-w-0">
                    {/* phone header */}
                    <header className="frost lg:hidden sticky top-0 z-30">
                        <div className="px-4 h-[68px] flex items-center gap-3">
                            <Logo className="h-9" />
                            <div className="leading-tight min-w-0">
                                <p className="m-0 text-[14px] font-extrabold">Agent portal</p>
                                <p className={`m-0 text-[12px] truncate ${MUTED}`}>{profile.display_name}</p>
                            </div>
                            <div className="flex-1" />
                            <Link to="/dashboard" aria-label="My courses" className="press w-11 h-11 rounded-[14px] bg-white dark:bg-night-2 inline-flex items-center justify-center text-ink dark:text-white"><LayoutDashboard size={18} /></Link>
                            <ThemeButton />
                        </div>
                    </header>

                    <main className="px-4 lg:px-0 py-4 lg:py-0 space-y-4 max-w-[1180px]">
                        {pending > 0 && (
                            <div role="status" className="rounded-[18px] bg-[#FFF3D6] dark:bg-amber-950/30 text-[#6B4A00] dark:text-amber-200 p-4 text-[14px] flex items-center gap-3">
                                <span className="w-9 h-9 rounded-[11px] bg-white/70 dark:bg-amber-900/40 inline-flex items-center justify-center shrink-0"><WifiOff size={17} /></span>
                                <span className="flex-1">{pending} registration{pending === 1 ? ' is' : 's are'} saved on this phone and will be sent when you are online.</span>
                                <button onClick={() => void flush()} className="press h-10 px-4 rounded-[12px] bg-ink text-white text-[13px] font-bold shrink-0">Send now</button>
                            </div>
                        )}
                        {notice && <div role="status" className="rounded-[18px] bg-mint-soft text-[#0E5A35] dark:bg-emerald-950/30 dark:text-emerald-200 p-4 text-[14px]">{notice}</div>}

                        {tab === 'overview' && <Overview profile={profile} stats={stats} onRefresh={() => void loadAll()} />}
                        {tab === 'register' && <Register profile={profile} onDone={() => { setPending(queuedCount()); void loadAll(); }} />}
                        {tab === 'students' && <Students profile={profile} students={students} onRefresh={() => void loadAll()} />}
                        {tab === 'leaderboard' && <Leaderboard rows={leaders} />}
                    </main>
                </div>
            </div>

            {/* phone navigation */}
            <nav className="lg:hidden fixed bottom-3 inset-x-3 z-30 frost-white rounded-[24px] h-[68px] grid grid-cols-4 px-1.5 mb-[env(safe-area-inset-bottom)] shadow-[0_10px_30px_rgba(30,27,46,0.12)]" aria-label="Agent sections">
                {TABS.map(t => {
                    const on = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)} aria-current={on ? 'page' : undefined}
                            className={`press flex flex-col items-center justify-center gap-1 my-1.5 rounded-[18px] text-[11px] font-bold ${on ? 'bg-brand text-white' : 'text-[#6B6680] dark:text-slate-400'}`}>
                            <t.icon size={20} />{t.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default StaffPortal;
