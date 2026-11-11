import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    queuedCount, registerStudent, staffLink, startMessage, whatsappShare
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

const INPUT = 'w-full rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';

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

    return (
        <div className="space-y-6">
            <section className={`${CARD} rounded-2xl p-5 sm:p-6`}>
                <h2 className="font-serif text-xl font-semibold">Your personal link</h2>
                <p className={`mt-1 text-sm ${MUTED}`}>Anyone who joins through this link is counted for you, and they never see your code.</p>

                <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-5 items-start">
                    <div className="space-y-4 min-w-0">
                        <div>
                            <label htmlFor="page" className="block text-sm font-semibold mb-1.5">Send people to</label>
                            <select id="page" value={target} onChange={e => setTarget(e.target.value)} className={INPUT}>
                                {PAGES.map(p => <option key={p.to} value={p.to}>{p.label}</option>)}
                            </select>
                        </div>
                        <div className="rounded-xl bg-stone-100 dark:bg-slate-800 px-4 py-3 text-sm break-all font-mono">{link}</div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => copy(link, 'link')} className={BTN_PRIMARY}>
                                {copied === 'link' ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy link</>}
                            </button>
                            <a href={whatsappShare(startMessage(null, link))} target="_blank" rel="noreferrer" className={BTN_SECONDARY}><MessageCircle size={18} /> Share on WhatsApp</a>
                        </div>
                    </div>
                    <div className="mx-auto sm:mx-0 text-center">
                        {qr ? <img src={qr} alt="QR code for your link" className="w-40 h-40 rounded-xl border border-stone-200 dark:border-slate-700 bg-white" /> : <div className="w-40 h-40" />}
                        <a href={qr} download={`welile-${profile.slug}-qr.png`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-violet-800 dark:text-violet-300 hover:underline"><Download size={14} /> Download QR</a>
                    </div>
                </div>
            </section>

            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-xl font-semibold">My results</h2>
                    <button onClick={onRefresh} className="text-sm font-medium inline-flex items-center gap-1.5 text-violet-800 dark:text-violet-300"><RefreshCw size={14} /> Refresh</button>
                </div>
                {!stats ? <Loader2 className="animate-spin text-violet-700" /> : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {tiles.map(t => (
                                <div key={t.label} className={`${CARD} rounded-2xl p-4`}>
                                    <p className={`text-xs font-semibold uppercase tracking-wide ${MUTED}`}>{t.label}</p>
                                    <p className="text-3xl font-extrabold mt-1">{t.value}</p>
                                </div>
                            ))}
                        </div>
                        <p className={`mt-3 text-sm ${MUTED}`}>You are ranked <span className="font-semibold text-[#1c1917] dark:text-slate-100">{stats.rank}</span> of {stats.staff_total}. Points: signed up 1, started 2, completed 5.</p>
                    </>
                )}
            </section>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Register a student
// ---------------------------------------------------------------------------
const emptyForm = { name: '', phone: '', email: '', course: FREE_COURSE, campaign: '', notes: '', consent: false };

const Register: React.FC<{ profile: StaffProfile; onDone: () => void }> = ({ profile, onDone }) => {
    const [form, setForm] = useState(emptyForm);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<{ name: string; phone: string; queued: boolean } | null>(null);
    const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

    const isFree = form.course === FREE_COURSE;
    const courses = [FREE_COURSE, ...OFFICIAL_COURSE_CATALOG.filter(c => c.title !== 'Fundamentals of AI').map(c => c.title)];

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (form.name.trim().length < 2) return setError("Please enter the student's full name.");
        if (form.phone.replace(/\D/g, '').length < 9) return setError('Please enter a valid phone number.');
        if (isFree && !form.email.trim()) return setError('An email address is needed so the student can log in and get their certificate.');
        if (!form.consent) return setError('The student must agree to be contacted.');

        const input: RegisterInput = {
            name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
            courseTitle: form.course, courseSlug: isFree ? 'ai-fundamentals' : null,
            campaign: form.campaign.trim(), notes: form.notes.trim(), consent: true
        };
        setBusy(true);
        try {
            const r = await registerStudent(input);
            if (!r.ok) { setError(r.message || 'Could not register this student.'); return; }
            setDone({ name: input.name, phone: r.phone || input.phone, queued: !!r.queued });
            onDone();
        } catch (err: any) {
            setError(err?.message || 'Could not register this student.');
        } finally {
            setBusy(false);
        }
    };

    if (done) {
        const link = staffLink(profile.slug, '/free/ai-fundamentals');
        const phoneDigits = (() => { const d = done.phone.replace(/\D/g, ''); return d.startsWith('0') ? '256' + d.slice(1) : d; })();
        return (
            <div className={`${CARD} rounded-2xl p-6 text-center`}>
                <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
                <h2 className="font-serif text-2xl font-semibold mt-3">{done.queued ? 'Saved on this phone' : 'Student registered'}</h2>
                <p className={`mt-1 ${MUTED}`}>
                    {done.queued ? `${done.name} will be registered as soon as you are online.` : `${done.name} is registered under your name.`}
                </p>
                {isFree && (
                    <>
                        <p className={`mt-4 text-sm ${MUTED}`}>Now send them their link so they can create their login and start.</p>
                        <a href={whatsappShare(startMessage(done.name, link), phoneDigits)} target="_blank" rel="noreferrer" className={`${BTN_PRIMARY} mt-3`}>
                            <MessageCircle size={18} /> Send start link on WhatsApp
                        </a>
                    </>
                )}
                <div className="mt-3"><button onClick={() => { setDone(null); setForm(emptyForm); }} className={BTN_SECONDARY}><UserPlus size={18} /> Register another student</button></div>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className={`${CARD} rounded-2xl p-5 sm:p-6 space-y-5`} noValidate>
            <div>
                <h2 className="font-serif text-xl font-semibold">Register a student</h2>
                <p className={`text-sm mt-1 ${MUTED}`}>Registered under <span className="font-semibold">{profile.display_name}</span> ({profile.staff_code}). If you have no signal the entry is saved on this phone.</p>
            </div>

            <div>
                <label htmlFor="r-name" className="block text-sm font-semibold mb-1.5">Full name *</label>
                <input id="r-name" value={form.name} onChange={set('name')} autoComplete="off" className={INPUT} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="r-phone" className="block text-sm font-semibold mb-1.5">Phone number *</label>
                    <input id="r-phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" className={INPUT} />
                </div>
                <div>
                    <label htmlFor="r-email" className="block text-sm font-semibold mb-1.5">Email {isFree ? '*' : '(optional)'}</label>
                    <input id="r-email" type="email" inputMode="email" value={form.email} onChange={set('email')} placeholder="name@example.com" className={INPUT} />
                </div>
            </div>
            <div>
                <label htmlFor="r-course" className="block text-sm font-semibold mb-1.5">Programme</label>
                <select id="r-course" value={form.course} onChange={set('course')} className={INPUT}>
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {!isFree && (
                    <p className="mt-2 text-sm rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3">
                        This records an interest only. To enrol someone in a paid programme, use the official registration form, which keeps your name as the registrar.{' '}
                        <a href={`/register?staff=${encodeURIComponent(profile.display_name)}`} target="_blank" rel="noreferrer" className="font-semibold underline inline-flex items-center gap-1">Open the official form <ExternalLink size={13} /></a>
                    </p>
                )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="r-campaign" className="block text-sm font-semibold mb-1.5">Event or place <span className={`font-normal ${MUTED}`}>(optional)</span></label>
                    <input id="r-campaign" value={form.campaign} onChange={set('campaign')} placeholder="e.g. Nkumba outreach" className={INPUT} />
                </div>
                <div>
                    <label htmlFor="r-notes" className="block text-sm font-semibold mb-1.5">Notes <span className={`font-normal ${MUTED}`}>(optional)</span></label>
                    <input id="r-notes" value={form.notes} onChange={set('notes')} className={INPUT} />
                </div>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-stone-200 dark:border-slate-700 p-4 cursor-pointer">
                <input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-1 accent-violet-700 w-5 h-5 shrink-0" />
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
    amber: 'bg-amber-100 text-amber-900', slate: 'bg-stone-200 text-stone-800 dark:bg-slate-700 dark:text-slate-100',
    violet: 'bg-violet-100 text-violet-900', green: 'bg-emerald-100 text-emerald-900'
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

    if (!students) return <Loader2 className="animate-spin text-violet-700" />;

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-1 min-w-[12rem]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search students" aria-label="Search students" className={`${INPUT} pl-10 !py-2.5`} />
                </div>
                <button onClick={onRefresh} className={`${BTN_SECONDARY} !py-2.5`}><RefreshCw size={16} /></button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                {([['all', 'All'], ['waiting', 'Waiting to sign up'], ['learning', 'Learning'], ['done', 'Completed']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id}
                        className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium border ${filter === id ? 'bg-violet-700 text-white border-violet-700' : 'border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {rows.length === 0 ? (
                <p className={`${CARD} rounded-2xl p-6 text-center text-sm ${MUTED}`}>{students.length === 0 ? 'No students yet. Share your link or register someone.' : 'No students match.'}</p>
            ) : (
                <ul className="space-y-3">
                    {rows.map(s => {
                        const st = statusOf(s);
                        return (
                            <li key={`${s.kind}-${s.id}`} className={`${CARD} rounded-2xl p-4`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold leading-snug">{s.name || 'Student'}</p>
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
    if (!rows) return <Loader2 className="animate-spin text-violet-700" />;
    return (
        <div className={`${CARD} rounded-2xl overflow-hidden`}>
            <div className="px-5 py-4 border-b border-stone-100 dark:border-slate-800">
                <h2 className="font-serif text-xl font-semibold flex items-center gap-2"><Trophy size={20} className="text-amber-500" /> Top staff</h2>
                <p className={`text-sm mt-1 ${MUTED}`}>Points: signed up 1, started learning 2, completed the course 5.</p>
            </div>
            {rows.length === 0 ? <p className={`p-5 text-sm ${MUTED}`}>No results yet.</p> : (
                <ol>
                    {rows.map((r, i) => (
                        <li key={r.id} className={`flex items-center gap-4 px-5 py-3.5 border-t border-stone-100 dark:border-slate-800 ${r.is_me ? 'bg-violet-50 dark:bg-violet-950/30' : ''}`}>
                            <span className="w-7 text-center font-bold text-lg">{i + 1}</span>
                            <span className="flex-1 min-w-0">
                                <span className="block font-medium truncate">{r.display_name}{r.is_me && <span className="ml-2 text-xs font-semibold text-violet-800 dark:text-violet-300">You</span>}</span>
                                <span className={`block text-xs ${MUTED}`}>{r.signups} signed up · {r.completed} completed</span>
                            </span>
                            <span className="font-extrabold text-violet-700 dark:text-violet-300">{r.points}</span>
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
        if (r.sent || r.rejected) {
            setNotice(`${r.sent} saved registration${r.sent === 1 ? '' : 's'} sent${r.rejected ? `, ${r.rejected} could not be added (already registered)` : ''}.`);
            void loadAll();
        }
    }, [loadAll]);

    useEffect(() => {
        document.title = 'Staff portal | Welile School of AI';
        loadStaffProfile().then(s => { setState(s); if (s.status === 'ok') { void loadAll(); void flush(); } });
        const onOnline = () => void flush();
        window.addEventListener('online', onOnline);
        return () => window.removeEventListener('online', onOnline);
    }, [loadAll, flush]);

    if (!state) return <div className={`min-h-screen ${PAPER} flex items-center justify-center`}><Loader2 className="animate-spin text-violet-700" size={32} /></div>;

    if (state.status !== 'ok') {
        const email = session?.user?.email || 'your email';
        return (
            <div className={`min-h-screen ${PAPER} ${INK}`}>
                <header className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between"><Logo className="h-11" /><ThemeButton /></header>
                <main className="max-w-lg mx-auto px-4 py-12 text-center">
                    <AlertTriangle className="mx-auto text-amber-600" size={44} />
                    <h1 className="font-serif text-2xl font-semibold mt-4">
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
        <div className={`min-h-screen ${PAPER} ${INK} pb-24 md:pb-10`}>
            <header className="sticky top-0 z-30 bg-[#faf8f5]/95 dark:bg-slate-950/95 backdrop-blur border-b border-stone-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
                    <Logo className="h-9" />
                    <div className="hidden sm:block leading-tight">
                        <p className="font-serif font-semibold">Staff portal</p>
                        <p className={`text-xs ${MUTED}`}>{profile.display_name}</p>
                    </div>
                    <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Staff sections">
                        {TABS.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
                                className={`px-3.5 py-2 rounded-lg text-sm font-semibold ${tab === t.id ? 'bg-violet-100 dark:bg-violet-950 text-violet-900 dark:text-violet-200' : 'hover:bg-stone-100 dark:hover:bg-slate-800'}`}>
                                {t.label}
                            </button>
                        ))}
                    </nav>
                    <div className="flex-1" />
                    <Link to="/dashboard" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800">Exit</Link>
                    <ThemeButton />
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                {pending > 0 && (
                    <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3.5 text-sm flex items-center gap-2">
                        <WifiOff size={16} className="shrink-0" /> {pending} registration{pending === 1 ? ' is' : 's are'} saved on this phone and will be sent when you are online.
                        <button onClick={() => void flush()} className="ml-auto font-semibold underline">Send now</button>
                    </div>
                )}
                {notice && <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-sm">{notice}</div>}

                {tab === 'overview' && <Overview profile={profile} stats={stats} onRefresh={() => void loadAll()} />}
                {tab === 'register' && <Register profile={profile} onDone={() => { setPending(queuedCount()); void loadAll(); }} />}
                {tab === 'students' && <Students profile={profile} students={students} onRefresh={() => void loadAll()} />}
                {tab === 'leaderboard' && <Leaderboard rows={leaders} />}
            </main>

            {/* phone navigation */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-stone-200 dark:border-slate-800 grid grid-cols-4 pb-[env(safe-area-inset-bottom)]" aria-label="Staff sections">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
                        className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${tab === t.id ? 'text-violet-800 dark:text-violet-300' : 'text-stone-500 dark:text-slate-400'}`}>
                        <t.icon size={22} />{t.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default StaffPortal;
