import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Award, CalendarClock, CheckCircle2, ChevronDown, Clock, HeartHandshake, Layers, Smartphone, PlayCircle, FileText, HelpCircle } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { setFreeCourseIntent } from '../../src/lib/acquisition';
import { COURSE, MODULES, lessonCount } from '../../src/content/aiFundamentals';
import { loadLiveSessions, LiveSession } from '../../src/lib/learnApi';
import CertificateDocument from './CertificateDocument';
import WelileTechLink, { linkifyWelileTech } from './WelileTechLink';
import { PAPER, INK, MUTED, CARD, BTN_PRIMARY, BTN_SECONDARY, ThemeButton, Logo, formatEAT } from './learnUi';

const kindIcon = (kind: string) => kind === 'video' ? <PlayCircle size={16} /> : kind === 'quiz' ? <HelpCircle size={16} /> : <FileText size={16} />;

const FreeCoursePage: React.FC = () => {
    const navigate = useNavigate();
    const [signedIn, setSignedIn] = useState(false);
    const [openModule, setOpenModule] = useState<string | null>('m1');
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [sessions, setSessions] = useState<LiveSession[]>([]);

    useEffect(() => {
        document.title = `${COURSE.title} | Free course | Welile School of AI`;
        supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)).catch(() => undefined);
        loadLiveSessions().then(s => setSessions(s.filter(x => new Date(x.ends_at).getTime() > Date.now()).slice(0, 4)));
    }, []);

    const start = () => {
        setFreeCourseIntent(COURSE.slug);
        if (signedIn) navigate(`/learn/${COURSE.slug}`);
        else navigate(`/signup?course=${COURSE.slug}`);
    };

    const goLogin = () => {
        setFreeCourseIntent(COURSE.slug);
        navigate('/login');
    };

    const facts = [
        { icon: <Clock size={18} />, label: `About ${COURSE.hours}` },
        { icon: <Layers size={18} />, label: `${MODULES.length - 1} modules, ${lessonCount} short videos` },
        { icon: <Award size={18} />, label: 'Free certificate' },
        { icon: <Smartphone size={18} />, label: 'Works on any phone' }
    ];

    return (
        <div className={`min-h-screen ${PAPER} ${INK} pb-24 lg:pb-0`}>
            {/* Top bar */}
            <header className="sticky top-0 z-40 bg-[#faf8f5]/90 dark:bg-slate-950/90 backdrop-blur border-b border-stone-200/70 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Logo className="h-11" />
                    <div className="flex items-center gap-1 sm:gap-3">
                        <ThemeButton />
                        <button onClick={goLogin} className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800">
                            {signedIn ? 'My learning' : 'Log in'}
                        </button>
                        <button onClick={start} className="hidden sm:inline-flex text-sm font-semibold px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 text-white">
                            Start studying
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                <div>
                    <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-violet-800 dark:text-violet-300 bg-violet-100 dark:bg-violet-950 px-3 py-1.5 rounded-full">
                        <HeartHandshake size={14} /> Free course, sponsored by <WelileTechLink>{COURSE.sponsor}</WelileTechLink>
                    </p>
                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] font-semibold mt-5">
                        Learn to use AI with confidence.
                    </h1>
                    <p className={`mt-5 text-lg leading-relaxed ${MUTED} max-w-xl`}>{COURSE.tagline}</p>

                    <div className="mt-6 rounded-2xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/40 px-4 py-3 text-sm leading-snug max-w-xl">
                        <p className="font-semibold text-violet-900 dark:text-violet-200">Lessons start Monday 16th November. Register now to save your place.</p>
                        <p className="mt-1 text-stone-700 dark:text-slate-300">You can watch the welcome video straight away, and join live classes every Monday, Wednesday and Friday at 2:00 pm (East Africa Time).</p>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button onClick={start} className={`${BTN_PRIMARY} text-base`}>
                            {signedIn ? 'Continue studying' : 'Start studying, it is free'} <ArrowRight size={18} />
                        </button>
                        <a href="#outline" className={BTN_SECONDARY}>See the course outline</a>
                    </div>
                    {!signedIn && (
                        <p className={`mt-3 text-sm ${MUTED}`}>
                            Free account needed. Already registered?{' '}
                            <button onClick={goLogin} className="underline font-medium text-violet-800 dark:text-violet-300">Log in</button>
                        </p>
                    )}

                    <ul className="mt-8 grid grid-cols-2 gap-3 max-w-md">
                        {facts.map(f => (
                            <li key={f.label} className="flex items-center gap-2 text-sm font-medium">
                                <span className="text-violet-700 dark:text-violet-400">{f.icon}</span>{f.label}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative">
                    <img
                        src="/classroom_students.png"
                        alt="Students learning together in a classroom"
                        className="w-full aspect-[4/3] object-cover rounded-3xl shadow-xl border border-stone-200 dark:border-slate-800"
                        loading="eager"
                    />
                    <div className={`${CARD} absolute -bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-[16rem] rounded-2xl p-4 shadow-lg`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">You will leave with</p>
                        <p className="text-sm mt-1 leading-snug">Skills you can use this week, and a certificate you can share.</p>
                    </div>
                </div>
            </section>

            {/* Outcomes */}
            <section className="bg-white dark:bg-slate-900/60 border-y border-stone-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid lg:grid-cols-[1fr_1.4fr] gap-10">
                    <div>
                        <h2 className="font-serif text-3xl font-semibold">What you will learn</h2>
                        <p className={`mt-3 ${MUTED}`}>Plain language, real examples from everyday life and work in Uganda, and a hands-on task in almost every lesson.</p>
                        <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide">Who it is for</h3>
                        <ul className={`mt-3 space-y-2 ${MUTED}`}>
                            {COURSE.audience.map(a => <li key={a} className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-violet-700 dark:text-violet-400" />{a}</li>)}
                        </ul>
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-4">
                        {COURSE.outcomes.map(o => (
                            <li key={o} className={`${CARD} rounded-2xl p-5 text-[15px] leading-snug flex gap-3`}>
                                <CheckCircle2 size={20} className="shrink-0 text-violet-700 dark:text-violet-400 mt-0.5" />{o}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Outline */}
            <section id="outline" className="max-w-4xl mx-auto px-4 sm:px-6 py-14 scroll-mt-20">
                <h2 className="font-serif text-3xl font-semibold">Course outline</h2>
                <p className={`mt-2 ${MUTED}`}>{MODULES.length - 1} modules. Study in order or jump around. Each module ends with a short quiz.</p>
                <div className="mt-8 space-y-3">
                    {MODULES.map(m => {
                        const open = openModule === m.id;
                        const mins = m.items.reduce((s, i) => s + i.minutes, 0);
                        return (
                            <div key={m.id} className={`${CARD} rounded-2xl overflow-hidden`}>
                                <button
                                    onClick={() => setOpenModule(open ? null : m.id)}
                                    aria-expanded={open}
                                    className="w-full flex items-center gap-4 text-left px-5 py-4 hover:bg-stone-50 dark:hover:bg-slate-800/60"
                                >
                                    <span className="shrink-0 w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 font-bold flex items-center justify-center text-sm">{m.number}</span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block font-semibold leading-snug">{m.title}</span>
                                        <span className={`block text-sm ${MUTED}`}>{m.items.length} items · about {mins} min</span>
                                    </span>
                                    <ChevronDown size={20} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                                </button>
                                {open && (
                                    <div className="px-5 pb-5 border-t border-stone-100 dark:border-slate-800">
                                        <p className={`pt-4 text-sm ${MUTED}`}>{m.blurb}</p>
                                        <ul className="mt-3 space-y-2">
                                            {m.items.map(i => (
                                                <li key={i.id} className="flex items-center gap-3 text-sm">
                                                    <span className="text-stone-400 dark:text-slate-500">{kindIcon(i.kind)}</span>
                                                    <span className="flex-1">{i.title}</span>
                                                    <span className={MUTED}>{i.minutes} min</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div className={`${CARD} rounded-2xl px-5 py-4 flex items-center gap-4`}>
                        <span className="shrink-0 w-9 h-9 rounded-full bg-lime-200 text-lime-900 flex items-center justify-center"><Award size={18} /></span>
                        <span className="flex-1">
                            <span className="block font-semibold">Final assessment and certificate</span>
                            <span className={`block text-sm ${MUTED}`}>{COURSE.finalQuestions} questions · {COURSE.passFinal}% to pass · about 30 min</span>
                        </span>
                    </div>
                </div>
            </section>

            {/* Live classes */}
            <section className="bg-white dark:bg-slate-900/60 border-y border-stone-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
                    <div className="flex items-center gap-3">
                        <CalendarClock className="text-violet-700 dark:text-violet-400" />
                        <h2 className="font-serif text-3xl font-semibold">Join a live class</h2>
                    </div>
                    <p className={`mt-2 ${MUTED}`}>Prefer to learn with others? Optional live sessions run alongside the course. Ask questions, practise together, and watch the replay if you miss one.</p>
                    {sessions.length === 0 ? (
                        <p className={`${CARD} rounded-2xl p-5 mt-6 text-sm ${MUTED}`}>The live timetable is announced inside the course once you register.</p>
                    ) : (
                        <ul className="mt-6 grid sm:grid-cols-2 gap-4">
                            {sessions.map(s => (
                                <li key={s.id} className={`${CARD} rounded-2xl p-5`}>
                                    <p className="font-semibold">{s.title}</p>
                                    <p className={`text-sm mt-1 ${MUTED}`}>{formatEAT(s.starts_at)} (East Africa Time)</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* Certificate */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
                <div>
                    <h2 className="font-serif text-3xl font-semibold">A certificate you can show</h2>
                    <p className={`mt-3 ${MUTED}`}>When you finish, your certificate is issued instantly, signed by the CEOs of Welile School of AI and <WelileTechLink />. It has its own ID and a public page where anyone can confirm it is genuine.</p>
                    <ul className="mt-5 space-y-2 text-[15px]">
                        {['Download or print it', 'Add it to LinkedIn', 'Share on WhatsApp'].map(t => <li key={t} className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 text-violet-700 dark:text-violet-400" />{t}</li>)}
                    </ul>
                </div>
                <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-slate-800 shadow-lg">
                    <CertificateDocument sample name="Your Name" courseTitle={COURSE.title} issuedAt={new Date().toISOString()} certId="WSAI-FUND-2026-XXXXXXXX" />
                </div>
            </section>

            {/* Sponsor */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-4">
                <div className={`${CARD} rounded-3xl p-8 text-center`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">Sponsored by</p>
                    <p className="font-serif text-2xl font-semibold mt-2"><WelileTechLink>{COURSE.sponsor}</WelileTechLink></p>
                    <p className={`mt-3 max-w-xl mx-auto ${MUTED}`}>This course is free because <WelileTechLink>{COURSE.sponsor}</WelileTechLink> believes everyone in Uganda should be able to understand and safely use AI.</p>
                </div>
            </section>

            {/* FAQ */}
            <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
                <h2 className="font-serif text-3xl font-semibold">Questions</h2>
                <div className="mt-6 divide-y divide-stone-200 dark:divide-slate-800 border-y border-stone-200 dark:border-slate-800">
                    {COURSE.faq.map((f, i) => (
                        <div key={f.q}>
                            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="w-full text-left py-4 flex items-center justify-between gap-4 font-medium">
                                {f.q}<ChevronDown size={18} className={`shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                            </button>
                            {openFaq === i && <p className={`pb-4 ${MUTED}`}>{linkifyWelileTech(f.a)}</p>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 text-center">
                <h2 className="font-serif text-3xl font-semibold">Ready when you are.</h2>
                <p className={`mt-2 ${MUTED}`}>It takes a minute to register. Your progress is saved so you can stop and carry on any time.</p>
                <button onClick={start} className={`${BTN_PRIMARY} mt-6 text-base`}>
                    {signedIn ? 'Continue studying' : 'Start studying, it is free'} <ArrowRight size={18} />
                </button>
                <p className={`mt-8 text-sm ${MUTED}`}>
                    Looking for our paid programmes? <Link to="/" className="underline">See all courses</Link>
                </p>
            </section>

            {/* Sticky mobile CTA */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-stone-200 dark:border-slate-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <button onClick={start} className={`${BTN_PRIMARY} w-full`}>
                    {signedIn ? 'Continue studying' : 'Start studying, it is free'} <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default FreeCoursePage;
