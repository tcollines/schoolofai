import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../src/lib/supabaseClient';
import WelileTechLink from './learn/WelileTechLink';
import LandingOrb from './landing/LandingOrb';
import {
    Bot,
    Brain,
    Zap,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    GraduationCap,
    Sun,
    Moon,
    BookOpen,
    MessageSquare,
    Award,
    Users,
    Wallet,
    Video,
    X,
    Loader,
    Shield,
    Star,
    Building2,
    TrendingUp,
    Smartphone,
    Wifi,
    CreditCard,
    Headphones,
    Plus,
    Menu
} from 'lucide-react';
import { formatAmount, getCurrencyPreference, setCurrencyPreference, getExchangeRate, CurrencyType } from '../src/lib/currency';

interface LandingPageProps {
    onLoginClick?: () => void;
    onSignupClick?: () => void;
    onGetStarted?: () => void;
    isAuthenticated?: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick, onGetStarted, isAuthenticated = false }) => {
    const [isDark, setIsDark] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    const [currency, setCurrency] = useState<CurrencyType>(getCurrencyPreference);
    const [outreachButtonVisible, setOutreachButtonVisible] = useState<boolean>(false);
    const [outreachButtonLabel, setOutreachButtonLabel] = useState<string>('Register for AI Classes');
    const [outreachTargetUrl, setOutreachTargetUrl] = useState<string>('/register');

    useEffect(() => {
        const applyPortalSettings = (ps: any) => {
            if (!ps || typeof ps !== 'object') return;
            setOutreachButtonVisible(Boolean(ps.website_button_visible));
            if (ps.website_button_label && String(ps.website_button_label).trim()) {
                setOutreachButtonLabel(String(ps.website_button_label).trim());
            } else {
                setOutreachButtonLabel(ps.outreach_mode_enabled ? 'Join an Outreach Event' : 'Register for AI Classes');
            }
            if (ps.outreach_mode_enabled && ps.active_campaign_name && String(ps.active_campaign_name).trim()) {
                setOutreachTargetUrl(`/register?event=${encodeURIComponent(String(ps.active_campaign_name).trim())}`);
            } else {
                setOutreachTargetUrl('/register');
            }
        };

        try {
            const cached = localStorage.getItem('welile_outreach_portal_settings_v1');
            if (cached) {
                applyPortalSettings(JSON.parse(cached));
            }
        } catch {
            // ignore
        }

        const loadRemotePortalSettings = async () => {
            try {
                const { data } = await supabase
                    .from('courses')
                    .select('sections')
                    .eq('category', '__OUTREACH_CONFIG__')
                    .limit(1);
                const ps = data?.[0]?.sections?.portal_settings;
                if (ps) {
                    applyPortalSettings(ps);
                    localStorage.setItem('welile_outreach_portal_settings_v1', JSON.stringify(ps));
                }
            } catch {
                // ignore
            }
        };

        loadRemotePortalSettings();
        window.addEventListener('outreach-portal-settings-update', loadRemotePortalSettings);
        return () => {
            window.removeEventListener('outreach-portal-settings-update', loadRemotePortalSettings);
        };
    }, []);

    useEffect(() => {
        const handleCurrencyChange = () => {
            setCurrency(getCurrencyPreference());
        };
        window.addEventListener('currency-change', handleCurrencyChange);
        return () => {
            window.removeEventListener('currency-change', handleCurrencyChange);
        };
    }, []);

    const handleCurrencyToggle = (cur: CurrencyType) => {
        setCurrency(cur);
        setCurrencyPreference(cur);
    };

    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [mobileNav, setMobileNav] = useState(false);
    const [inquiryName, setInquiryName] = useState('');
    const [inquiryEmail, setInquiryEmail] = useState('');
    const [inquiryMessage, setInquiryMessage] = useState('');
    const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);

    const handleSendInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inquiryName.trim() || !inquiryEmail.trim()) {
            alert("Please fill in your name and email.");
            return;
        }
        setIsInquirySubmitting(true);
        try {
            const { error } = await supabase
                .from('mails')
                .insert({
                    name: inquiryName,
                    email: inquiryEmail,
                    message: inquiryMessage || 'Corporate inquiry from landing page.',
                    type: 'INQUIRY'
                });
            if (error) throw error;
            
            alert(`Thank you, ${inquiryName}! Your corporate enrollment inquiry has been submitted. Our team will contact you at ${inquiryEmail} within 24 hours.`);
            setShowInquiryModal(false);
            setInquiryName('');
            setInquiryEmail('');
            setInquiryMessage('');
            window.dispatchEvent(new Event('new-mail-notification'));
        } catch (err) {
            console.error(err);
            alert("Failed to submit inquiry.");
        } finally {
            setIsInquirySubmitting(false);
        }
    };

    useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('theme-change', handleThemeChange);
        return () => window.removeEventListener('theme-change', handleThemeChange);
    }, []);

    const toggleTheme = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('theme-change'));
    };

    const start = onSignupClick || onGetStarted;
    const modules = [
        { n: 1, title: 'What AI really is', text: 'AI, machine learning, deep learning and generative AI, in plain language.', img: '/thumb/m1-l1.jpg' },
        { n: 2, title: 'How to talk to AI', text: 'Ask clearly, improve answers, and work from your own text.', img: '/thumb/m2-l1.jpg' },
        { n: 3, title: 'Make AI work for you', text: 'Four everyday jobs: brainstorm, draft, summarise and automate.', img: '/thumb/m3-l1.jpg' },
        { n: 4, title: 'When AI gets it wrong', text: 'Hallucinations, real cases, and how to fact-check.' },
        { n: 5, title: 'Fair and private', text: 'How bias gets in, and how to protect information.' },
        { n: 6, title: 'Using AI responsibly', text: 'Green, amber, red, and your 30-day plan.' },
    ];
    const features = [
        { icon: BookOpen, tone: 'bg-brand-soft text-brand', title: 'AI ICT Syllabus Generator', text: 'Type any technology topic and AI drafts a structured syllabus, from networking and databases to cybersecurity and programming.' },
        { icon: MessageSquare, tone: 'bg-lime-100 text-lime-800', title: 'Real-time ICT Code Tutor', text: 'Instant explanations of code, bugs and database schemas, right beside the video.' },
        { icon: Video, tone: 'bg-mint-soft text-mint', title: 'Hands-on ICT Video Labs', text: 'See systems, networks and cloud setups built step by step.' },
        { icon: Award, tone: 'bg-[#FFF4CC] text-[#7A5A00]', title: 'Professional ICT Certification', text: 'Certificates with a public verify link and QR code.' },
        { icon: Users, tone: 'bg-brand-soft text-brand', title: 'ICT Collaborative Forums', text: 'Ask questions under any lesson and learn with classmates.' },
    ];
    const faq = [
        { q: 'Do I need to pay anything?', a: 'No. The course and the certificate are free, sponsored by Welile Technologies.' },
        { q: 'Do I need a computer?', a: 'A smartphone is enough. Videos adapt to slow connections, and every lesson has written notes too.' },
        { q: 'How long does it take?', a: 'About 6 hours in total. Most people finish in one to two weeks, studying a little each day.' },
        { q: 'Do I have to attend the live classes?', a: 'No. Join the live classes (Monday, Wednesday and Friday at 2:00 pm, East Africa Time), or study at your own pace. Both are free and lead to the same certificate.' },
        { q: 'How do I get the certificate?', a: 'Finish every lesson, pass each module quiz, and pass the final assessment. Your certificate is issued instantly and can be verified online.' },
        { q: 'Which AI tool do I need?', a: 'Any major chatbot works. The course is tool-neutral and shows you how to pick one.' },
    ];
    const navLinks = [
        { href: '#course', label: 'Free course' },
        { href: '#how', label: 'How it works' },
        { href: '#features', label: 'Features' },
        { href: '#pricing', label: 'Pricing' },
        { href: '#faq', label: 'FAQ' },
    ];
    const tick = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D7F27A" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>;
    const planTick = (dark = false) => <CheckCircle2 size={17} className={`shrink-0 ${dark ? 'text-lime-200' : 'text-brand dark:text-violet-300'}`} />;

    return (
        <div className="min-h-screen bg-panel dark:bg-night text-ink dark:text-slate-100 font-sans transition-colors duration-200">
            {/* Navigation */}
            <nav aria-label="Main" className="frost fixed top-0 left-0 right-0 z-50">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[72px] flex items-center gap-3">
                    <Link to="/" aria-label="Welile School of AI home" className="shrink-0"><img src="/schoolofai-logo.png" alt="Welile School of AI" className="h-12 object-contain" /></Link>
                    <div className="hidden lg:flex items-center gap-1 ml-6 p-1 rounded-full bg-white/70 dark:bg-night-2">
                        {navLinks.map(l => (
                            <a key={l.href} href={l.href} className="h-10 px-4 inline-flex items-center rounded-full text-[14px] font-bold text-[#4A4560] dark:text-slate-300 hover:bg-white dark:hover:bg-night-3 hover:text-brand no-underline transition-colors">{l.label}</a>
                        ))}
                        <Link to="/register" className="h-10 px-4 inline-flex items-center gap-1.5 rounded-full text-[14px] font-bold text-brand dark:text-violet-300 hover:bg-white dark:hover:bg-night-3 no-underline"><Sparkles size={14} />Register now</Link>
                    </div>
                    <div className="flex-1" />
                    <button
                        onClick={() => handleCurrencyToggle(currency === 'USD' ? 'UGX' : 'USD')}
                        className="press hidden sm:inline-flex h-11 px-3.5 items-center rounded-[14px] bg-white dark:bg-night-2 text-[13px] font-extrabold"
                        title="Toggle currency (USD / UGX)"
                        aria-label={`Currency: ${currency}. Switch currency`}
                    >{currency}</button>
                    <button
                        onClick={toggleTheme}
                        className="press w-11 h-11 inline-flex items-center justify-center rounded-[14px] bg-white dark:bg-night-2 text-[#6B6680] dark:text-slate-300"
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
                    {isAuthenticated ? (
                        <button onClick={onLoginClick} className="press h-11 px-5 rounded-full bg-brand text-white text-[14px] font-bold whitespace-nowrap">Go to dashboard</button>
                    ) : (
                        <>
                            <button onClick={onLoginClick} className="press hidden sm:inline-flex h-11 px-4 items-center rounded-full text-[14px] font-bold hover:text-brand">Sign in</button>
                            <button onClick={start} className="press h-11 px-5 rounded-full bg-brand text-white text-[14px] font-bold whitespace-nowrap">Start free</button>
                        </>
                    )}
                    <button onClick={() => setMobileNav(v => !v)} aria-expanded={mobileNav} aria-label="Menu" className="press lg:hidden w-11 h-11 inline-flex items-center justify-center rounded-[14px] bg-white dark:bg-night-2">
                        {mobileNav ? <X size={19} /> : <Menu size={19} />}
                    </button>
                </div>
                {mobileNav && (
                    <div className="lg:hidden px-4 pb-4">
                        <div className="rounded-[22px] bg-white dark:bg-night-2 p-2 flex flex-col">
                            {navLinks.map(l => <a key={l.href} href={l.href} onClick={() => setMobileNav(false)} className="h-12 px-4 flex items-center rounded-[14px] text-[15px] font-bold no-underline text-ink dark:text-white hover:bg-panel dark:hover:bg-night-3">{l.label}</a>)}
                            <Link to="/register" className="h-12 px-4 flex items-center gap-2 rounded-[14px] text-[15px] font-bold no-underline text-brand dark:text-violet-300"><Sparkles size={15} />Register now</Link>
                            {!isAuthenticated && <button onClick={onLoginClick} className="h-12 px-4 text-left rounded-[14px] text-[15px] font-bold hover:bg-panel dark:hover:bg-night-3">Sign in</button>}
                            <button onClick={() => handleCurrencyToggle(currency === 'USD' ? 'UGX' : 'USD')} className="h-12 px-4 text-left rounded-[14px] text-[15px] font-bold hover:bg-panel dark:hover:bg-night-3">Currency: {currency}</button>
                        </div>
                    </div>
                )}
            </nav>

            <main className="max-w-[1280px] mx-auto px-3 sm:px-6 pt-[88px] pb-10 flex flex-col gap-6 sm:gap-8">
                {/* HERO */}
                <section className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-night text-white px-6 sm:px-10 lg:px-14 py-10 sm:py-12 lg:py-14 flex flex-col md:flex-row md:items-center gap-8 lg:gap-10">
                    <span aria-hidden="true" className="absolute -left-24 -bottom-40 w-[420px] h-[420px] rounded-full bg-night-2" />
                    <div className="relative min-w-0 md:flex-[1.2_1_0%]">
                        <p className="m-0 inline-flex flex-wrap items-center gap-1.5 px-3.5 py-2 rounded-full bg-night-3 text-[12px] font-extrabold tracking-[0.08em] uppercase text-lime-200">
                            Free course, sponsored by <WelileTechLink />
                        </p>
                        <h1 className="mt-5 mb-0 text-[40px] sm:text-[48px] lg:text-[56px] xl:text-[64px] leading-[1.02] font-extrabold tracking-[-0.035em]">
                            Learn to use AI<br /><span className="text-lime-200">with confidence.</span>
                        </h1>
                        <p className="mt-5 mb-0 text-[16px] lg:text-[18px] leading-relaxed text-[#CFC8DC] max-w-[520px]">
                            Start with AI Fundamentals: six hours, at your own pace, on any phone. Understand AI, use it for real work, stay safe, and earn a certificate.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link to="/free/ai-fundamentals" className="press inline-flex items-center gap-2.5 h-14 pl-6 pr-2 rounded-full bg-lime-200 text-night text-[16px] font-extrabold no-underline">
                                Study AI for free
                                <span className="w-10 h-10 rounded-full bg-night text-lime-200 inline-flex items-center justify-center"><ArrowRight size={18} /></span>
                            </Link>
                            <button onClick={onGetStarted} className="press inline-flex items-center h-14 px-6 rounded-full bg-night-3 text-white text-[16px] font-bold">
                                {isAuthenticated ? 'Go to my dashboard' : 'Create an account'}
                            </button>
                            {outreachButtonVisible && (
                                <Link to={outreachTargetUrl} className="press inline-flex items-center h-14 px-6 rounded-full border-2 border-night-3 text-lime-200 text-[16px] font-bold no-underline">
                                    {outreachButtonLabel}
                                </Link>
                            )}
                        </div>
                        <ul className="mt-8 p-0 list-none flex flex-wrap gap-2.5">
                            {['6 short modules', 'Quiz after every module', 'Live classes or self-paced', 'Free certificate'].map(t => (
                                <li key={t} className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-night-2 text-[13px] font-semibold text-[#E6E1EE]">{tick}{t}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative md:flex-[1_1_0%] min-w-0 flex justify-center">
                        <LandingOrb className="max-w-[300px] sm:max-w-[380px] md:max-w-[460px]" />
                    </div>
                </section>

                {/* TRUST STRIP */}
                <section aria-label="Made for how you learn" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {[
                        { icon: Smartphone, tone: 'bg-brand-soft text-brand', t: 'Any smartphone', s: 'No computer needed' },
                        { icon: Wifi, tone: 'bg-lime-100 text-lime-800', t: 'Data saver', s: 'Audio-only lessons and notes' },
                        { icon: MessageSquare, tone: 'bg-mint-soft text-mint', t: 'WhatsApp reminders', s: 'Before every live class' },
                        { icon: CreditCard, tone: 'bg-[#FFF4CC] text-[#7A5A00]', t: 'MoMo and Airtel Money', s: 'When you upgrade' },
                    ].map(x => (
                        <div key={x.t} className="bg-white dark:bg-night-2 rounded-[22px] p-[18px] flex items-center gap-3.5">
                            <span className={`w-11 h-11 rounded-[14px] inline-flex items-center justify-center shrink-0 ${x.tone}`}><x.icon size={20} /></span>
                            <span><span className="block text-[15px] font-extrabold">{x.t}</span><span className="block text-[13px] text-[#6B6680] dark:text-slate-400">{x.s}</span></span>
                        </div>
                    ))}
                </section>

                {/* COURSE BANNER */}
                <section id="course" className="scroll-mt-24 relative overflow-hidden rounded-[32px] sm:rounded-[36px] bg-brand text-white px-6 sm:px-14 py-10 sm:py-[52px]">
                    <span aria-hidden="true" className="absolute -right-[120px] -top-[140px] w-[440px] h-[440px] rounded-full bg-brand-mid" />
                    <div className="relative flex flex-wrap items-end justify-between gap-5">
                        <div className="max-w-[640px]">
                            <p className="m-0 text-[13px] font-extrabold tracking-[0.14em] uppercase text-lime-200">Inside AI Fundamentals</p>
                            <h2 className="mt-2.5 mb-0 text-[32px] sm:text-[44px] leading-[1.08] font-extrabold tracking-[-0.03em]">From "what is AI?" to using it every day.</h2>
                            <p className="mt-3 mb-0 text-[16px] sm:text-[17px] leading-relaxed text-[#E6DEFF]">Short videos, a "Try it" exercise in every lesson, and examples from everyday life here.</p>
                        </div>
                        <Link to="/free/ai-fundamentals" className="press inline-flex items-center h-[52px] px-6 rounded-full bg-white text-brand text-[15px] font-extrabold no-underline">Start module 1</Link>
                    </div>
                    <div className="relative mt-8 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {modules.slice(0, 3).map(m => (
                            <article key={m.n} className="lift bg-white text-ink rounded-[24px] p-2.5">
                                <img src={m.img} alt="" loading="lazy" className="w-full aspect-video object-cover rounded-[16px] block bg-brand-soft" />
                                <div className="px-2 pt-3 pb-2">
                                    <p className="m-0 text-[12px] font-extrabold text-brand">MODULE {m.n}</p>
                                    <h3 className="mt-1 mb-0 text-[17px] font-extrabold tracking-[-0.01em]">{m.title}</h3>
                                    <p className="mt-1 mb-0 text-[13px] leading-normal text-[#6B6680]">{m.text}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className="relative mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {modules.slice(3).map(m => (
                            <div key={m.n} className="bg-brand-mid rounded-[20px] p-[18px]">
                                <p className="m-0 text-[12px] font-extrabold text-lime-200">MODULE {m.n}</p>
                                <p className="mt-1 mb-0 text-[16px] font-extrabold">{m.title}</p>
                                <p className="mt-1 mb-0 text-[13px] text-[#E6DEFF]">{m.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section id="how" className="scroll-mt-24">
                    <p className="m-0 text-[13px] font-extrabold tracking-[0.14em] uppercase text-brand dark:text-violet-300">How it works</p>
                    <h2 className="mt-2 mb-0 text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">Two ways to learn. One certificate.</h2>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-night-2 rounded-[26px] p-6">
                            <div className="rounded-[18px] bg-panel dark:bg-night-3 p-3 flex gap-2" aria-hidden="true">
                                <span className="flex-1 h-10 rounded-[12px] bg-brand text-white text-[13px] font-bold inline-flex items-center justify-center gap-1.5"><Video size={15} />Video</span>
                                <span className="flex-1 h-10 rounded-[12px] bg-white dark:bg-night-2 text-[13px] font-bold inline-flex items-center justify-center gap-1.5"><Headphones size={15} />Audio only</span>
                            </div>
                            <h3 className="mt-5 mb-0 text-[19px] font-extrabold">1. Watch or listen</h3>
                            <p className="mt-1.5 mb-0 text-[14px] leading-relaxed text-[#6B6680] dark:text-slate-400">Short lessons that work on slow connections. Switch to audio only to save data.</p>
                        </div>
                        <div className="bg-white dark:bg-night-2 rounded-[26px] p-6">
                            <div className="grid grid-cols-3 gap-2" aria-hidden="true">
                                {['MON', 'WED', 'FRI'].map(d => <span key={d} className="rounded-[14px] bg-brand-soft dark:bg-night-3 py-2.5 text-center"><span className="block text-[11px] font-extrabold text-brand dark:text-violet-300">{d}</span><span className="block text-[16px] font-extrabold">2 pm</span></span>)}
                            </div>
                            <h3 className="mt-5 mb-0 text-[19px] font-extrabold">2. Join live, or go at your pace</h3>
                            <p className="mt-1.5 mb-0 text-[14px] leading-relaxed text-[#6B6680] dark:text-slate-400">Live classes every Monday, Wednesday and Friday at 2:00 pm EAT. Attend and those lessons count as done.</p>
                        </div>
                        <div className="bg-white dark:bg-night-2 rounded-[26px] p-6">
                            <div className="rounded-[18px] bg-lime-100 border-2 border-dashed border-lime-200 px-4 py-3 text-center" aria-hidden="true">
                                <span className="block text-[10px] font-extrabold tracking-[0.2em] text-lime-800">CERTIFICATE</span>
                                <span className="block font-cert text-[20px] italic text-ink">Your name here</span>
                                <span className="block text-[11px] font-bold text-lime-800">AI Fundamentals</span>
                            </div>
                            <h3 className="mt-5 mb-0 text-[19px] font-extrabold">3. Earn your certificate</h3>
                            <p className="mt-1.5 mb-0 text-[14px] leading-relaxed text-[#6B6680] dark:text-slate-400">Pass each module quiz and the final test. Your certificate is issued instantly and can be verified online.</p>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {[
                            { v: '6 hrs', t: 'Total learning time, most finish in 1–2 weeks', c: 'bg-white dark:bg-night-2' },
                            { v: '3×', t: 'Live classes every week', c: 'bg-white dark:bg-night-2' },
                            { v: '20', t: 'Questions in the final test, 80% to pass', c: 'bg-white dark:bg-night-2' },
                            { v: 'UGX 0', t: 'For the course and the certificate', c: 'bg-lime-200 text-night' },
                        ].map(x => (
                            <div key={x.v} className={`${x.c} rounded-[22px] px-5 py-[18px]`}>
                                <p className="m-0 text-[30px] font-extrabold tracking-[-0.03em]">{x.v}</p>
                                <p className={`mt-0.5 mb-0 text-[13px] font-semibold ${x.c.includes('lime') ? 'text-lime-900' : 'text-[#6B6680] dark:text-slate-400'}`}>{x.t}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FEATURES */}
                <section id="features" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
                    <div className="bg-white dark:bg-night-2 rounded-[32px] p-6 sm:p-9">
                        <p className="m-0 text-[13px] font-extrabold tracking-[0.14em] uppercase text-brand dark:text-violet-300">The platform</p>
                        <h2 className="mt-2 mb-0 text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight">Everything you need to keep going after the free course.</h2>
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {features.map(f => (
                                <div key={f.title} className="rounded-[20px] bg-panel dark:bg-night-3/60 p-4">
                                    <span className={`w-10 h-10 rounded-[12px] inline-flex items-center justify-center ${f.tone}`}><f.icon size={19} /></span>
                                    <h3 className="mt-3 mb-0 text-[15px] font-extrabold">{f.title}</h3>
                                    <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[#6B6680] dark:text-slate-400">{f.text}</p>
                                </div>
                            ))}
                            <div className="rounded-[20px] bg-night text-white p-4">
                                <span className="w-10 h-10 rounded-[12px] inline-flex items-center justify-center bg-night-3 text-lime-200"><Wallet size={19} /></span>
                                <h3 className="mt-3 mb-0 text-[15px] font-extrabold">Smart IT Training Wallet</h3>
                                <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[#C9C3E6]">Fund your wallet, track transactions and buy specialty modules, paid with MTN MoMo or Airtel Money.</p>
                                <div className="mt-3 flex gap-2"><span className="px-2.5 py-1 rounded-full bg-[#FFCC00] text-night text-[11px] font-extrabold">MTN MoMo</span><span className="px-2.5 py-1 rounded-full bg-[#E40000] text-white text-[11px] font-extrabold">Airtel Money</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden bg-lime-200 text-night rounded-[32px] p-6 sm:p-9 flex flex-col">
                        <p className="m-0 text-[13px] font-extrabold tracking-[0.14em] uppercase text-lime-900">Your instructor</p>
                        <img src="/instructor/timothy.webp" alt="Timothy Christian Waniaye" className="mt-5 w-[150px] h-[150px] rounded-full object-cover border-[6px] border-white" loading="lazy" />
                        <h2 className="mt-5 mb-0 text-[28px] font-extrabold tracking-[-0.02em] leading-tight">Timothy Christian Waniaye</h2>
                        <p className="mt-1.5 mb-0 text-[14px] font-semibold text-lime-900">Welile School of AI · teaches the videos and live classes</p>
                        <p className="mt-6 mb-2 text-[12px] font-extrabold tracking-[0.12em] uppercase text-lime-900">Made for</p>
                        <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
                            {['Students and school leavers', 'Job seekers and freelancers', 'Small business owners', 'Anyone curious, no tech background'].map(t => (
                                <li key={t} className="px-3 py-2 rounded-[12px] bg-white/70 text-[13px] font-bold">{t}</li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* PRICING */}
                <section id="pricing" className="scroll-mt-24">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="m-0 text-[13px] font-extrabold tracking-[0.14em] uppercase text-brand dark:text-violet-300">Pricing</p>
                            <h2 className="mt-2 mb-0 text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">Start free. Upgrade when you're ready.</h2>
                        </div>
                        <div role="radiogroup" aria-label="Currency" className="inline-flex p-1 rounded-[14px] bg-white dark:bg-night-2">
                            {(['USD', 'UGX'] as CurrencyType[]).map(c => (
                                <button key={c} type="button" role="radio" aria-checked={currency === c} onClick={() => handleCurrencyToggle(c)}
                                    className={`press h-10 px-4 rounded-[11px] text-[13px] font-extrabold ${currency === c ? 'bg-brand text-white' : 'text-[#6B6680] dark:text-slate-400'}`}>
                                    {c === 'USD' ? 'USD $' : 'UGX USh'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
                        <div className="bg-white dark:bg-night-2 rounded-[28px] p-6 flex flex-col">
                            <h3 className="m-0 text-[18px] font-extrabold">Basic</h3>
                            <p className="mt-3 mb-0 text-[38px] font-extrabold tracking-[-0.03em]">Free</p>
                            <p className="m-0 text-[13px] text-[#6B6680] dark:text-slate-400">AI Fundamentals and certificate</p>
                            <ul className="mt-5 mb-6 p-0 list-none space-y-2.5 text-[14px] flex-1">
                                <li className="flex gap-2.5">{planTick()}AI Fundamentals and certificate</li>
                                <li className="flex gap-2.5">{planTick()}Introduction modules</li>
                                <li className="flex gap-2.5">{planTick()}Community discussions</li>
                            </ul>
                            <button onClick={start} className="press h-12 rounded-[14px] bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-200 text-[14px] font-extrabold">Start free</button>
                        </div>
                        <div className="relative bg-brand text-white rounded-[28px] p-6 flex flex-col overflow-hidden">
                            <span aria-hidden="true" className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-brand-mid" />
                            <div className="relative flex items-center justify-between"><h3 className="m-0 text-[18px] font-extrabold">Pro</h3><span className="px-2.5 py-1 rounded-full bg-lime-200 text-night text-[11px] font-extrabold inline-flex items-center gap-1"><Star size={11} className="fill-current" />Most chosen</span></div>
                            <p className="relative mt-3 mb-0 text-[38px] font-extrabold tracking-[-0.03em]">{formatAmount(25)}<span className="text-[14px] font-semibold text-[#D9CCFF]"> / month</span></p>
                            <p className="relative m-0 text-[13px] text-[#E4DAFF]">Full monthly access for dedicated self-paced learners.</p>
                            <ul className="relative mt-5 mb-6 p-0 list-none space-y-2.5 text-[14px] flex-1">
                                <li className="flex gap-2.5">{planTick(true)}All Pro and free courses</li>
                                <li className="flex gap-2.5">{planTick(true)}Live cohorts with feedback</li>
                                <li className="flex gap-2.5">{planTick(true)}Resources and exercises</li>
                                <li className="flex gap-2.5">{planTick(true)}Verified certificates</li>
                            </ul>
                            <button onClick={start} className="press relative h-12 rounded-[14px] bg-white text-brand text-[14px] font-extrabold inline-flex items-center justify-center gap-1.5">Choose Pro <ArrowRight size={15} /></button>
                        </div>
                        <div className="relative bg-night text-white rounded-[28px] p-6 flex flex-col overflow-hidden">
                            <span aria-hidden="true" className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-night-3" />
                            <div className="relative flex items-center justify-between"><h3 className="m-0 text-[18px] font-extrabold">Premium</h3><span className="px-2.5 py-1 rounded-full bg-night-3 text-lime-200 text-[11px] font-extrabold inline-flex items-center gap-1"><Sparkles size={11} />Lifetime</span></div>
                            <p className="relative mt-3 mb-0 text-[38px] font-extrabold tracking-[-0.03em]">{formatAmount(150)}<span className="text-[14px] font-semibold text-[#C9C3E6]"> one-time</span></p>
                            <p className="relative m-0 text-[13px] text-[#C9C3E6]">One payment, lifetime access to all Pro and free courses.</p>
                            <ul className="relative mt-5 mb-6 p-0 list-none space-y-2.5 text-[14px] flex-1">
                                <li className="flex gap-2.5">{planTick(true)}Lifetime access, no renewals</li>
                                <li className="flex gap-2.5">{planTick(true)}All current and future Pro courses</li>
                                <li className="flex gap-2.5">{planTick(true)}1-on-1 mentorship and live Q&A</li>
                                <li className="flex gap-2.5">{planTick(true)}Portfolio review and career guidance</li>
                            </ul>
                            <button onClick={start} className="press relative h-12 rounded-[14px] bg-lime-200 text-night text-[14px] font-extrabold inline-flex items-center justify-center gap-1.5">Get lifetime access <ArrowRight size={15} /></button>
                        </div>
                        <div className="bg-white dark:bg-night-2 rounded-[28px] p-6 flex flex-col">
                            <div className="flex items-center justify-between"><h3 className="m-0 text-[18px] font-extrabold">Corporate</h3><span className="w-8 h-8 rounded-[10px] bg-brand-soft dark:bg-night-3 text-brand inline-flex items-center justify-center"><Building2 size={16} /></span></div>
                            <p className="mt-3 mb-0 text-[38px] font-extrabold tracking-[-0.03em]"><span className="text-[13px] font-semibold text-[#6B6680]">From </span>{formatAmount(15)}<span className="text-[14px] font-semibold text-[#6B6680]"> / seat</span></p>
                            <p className="m-0 text-[13px] text-[#6B6680] dark:text-slate-400">10–49 seats {formatAmount(20)} · 50+ seats {formatAmount(15)}</p>
                            <ul className="mt-5 mb-6 p-0 list-none space-y-2.5 text-[14px] flex-1">
                                <li className="flex gap-2.5">{planTick()}Dedicated team seats</li>
                                <li className="flex gap-2.5">{planTick()}Company branding and logo</li>
                                <li className="flex gap-2.5">{planTick()}Email invitations</li>
                                <li className="flex gap-2.5">{planTick()}Live team progress</li>
                            </ul>
                            <button onClick={() => { window.location.href = '/corporate/setup'; }} className="press h-12 rounded-[14px] bg-brand text-white text-[14px] font-extrabold">Set up a corporate plan</button>
                            <button onClick={() => setShowInquiryModal(true)} className="mt-2 h-9 text-[13px] font-bold text-brand dark:text-violet-300 hover:underline">Request a quote</button>
                        </div>
                    </div>
                    <p className="mt-3 mb-0 text-[13px] text-[#6B6680] dark:text-slate-400 inline-flex items-center gap-1.5"><TrendingUp size={14} />Shilling prices use the live exchange rate when you pay: $1 = {getExchangeRate().toLocaleString()} UGX.</p>
                </section>

                {/* BUSINESS BANNER */}
                <section className="relative overflow-hidden rounded-[32px] bg-brand-soft dark:bg-night-2 px-6 sm:px-12 py-9 flex flex-wrap items-center justify-between gap-5">
                    <div className="max-w-[560px]">
                        <p className="m-0 text-[13px] font-extrabold tracking-[0.14em] uppercase text-brand dark:text-violet-300">For organisations</p>
                        <h2 className="mt-2 mb-0 text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight text-brand-ink dark:text-white">Train your whole team in AI.</h2>
                        <p className="mt-2 mb-0 text-[15px] text-[#4A3B7A] dark:text-slate-300">Branded seats, email invites and a dashboard to follow everyone's progress.</p>
                    </div>
                    <button onClick={() => setShowInquiryModal(true)} className="press h-[52px] px-6 rounded-full bg-brand text-white text-[15px] font-extrabold inline-flex items-center gap-2"><Building2 size={17} />Request a business quote</button>
                </section>

                {/* FAQ */}
                <section id="faq" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
                    <div>
                        <p className="m-0 text-[13px] font-extrabold tracking-[0.14em] uppercase text-brand dark:text-violet-300">Questions</p>
                        <h2 className="mt-2 mb-0 text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">Good to know</h2>
                        <p className="mt-2 mb-0 text-[15px] text-[#6B6680] dark:text-slate-400">Still unsure? Ask under any lesson once you join.</p>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {faq.map(f => (
                            <details key={f.q} className="faq group bg-white dark:bg-night-2 rounded-[20px] px-5">
                                <summary className="list-none cursor-pointer min-h-[60px] flex items-center justify-between gap-4 text-[16px] font-extrabold">
                                    {f.q}
                                    <span className="w-8 h-8 shrink-0 rounded-full bg-brand-soft dark:bg-night-3 text-brand inline-flex items-center justify-center transition-transform group-open:rotate-45"><Plus size={16} /></span>
                                </summary>
                                <p className="mt-0 mb-5 text-[15px] leading-relaxed text-[#6B6680] dark:text-slate-400">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-lime-200 text-night px-6 sm:px-12 py-10 flex flex-wrap items-center justify-between gap-5">
                    <div>
                        <h2 className="m-0 text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">Your first lesson takes 5 minutes.</h2>
                        <p className="mt-2 mb-0 text-[16px] font-semibold text-lime-900">Watch the welcome video today, free, on any phone.</p>
                    </div>
                    <Link to="/free/ai-fundamentals" className="press inline-flex items-center gap-2.5 h-14 pl-6 pr-2 rounded-full bg-night text-white text-[16px] font-extrabold no-underline">
                        Study AI for free
                        <span className="w-10 h-10 rounded-full bg-lime-200 text-night inline-flex items-center justify-center"><ArrowRight size={18} /></span>
                    </Link>
                </section>
            </main>

            {showInquiryModal && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="inq-title">
                    <div className="fixed inset-0 bg-night/60 backdrop-blur-sm" onClick={() => setShowInquiryModal(false)} />
                    <div className="bg-white dark:bg-night-2 w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 sm:p-7 shadow-2xl relative z-10 text-ink dark:text-white">
                        <button type="button" onClick={() => setShowInquiryModal(false)} aria-label="Close" className="press absolute top-4 right-4 w-10 h-10 rounded-[12px] bg-panel dark:bg-night-3 inline-flex items-center justify-center"><X size={18} /></button>
                        <span className="w-12 h-12 rounded-[15px] bg-brand-soft text-brand inline-flex items-center justify-center"><Building2 size={22} /></span>
                        <h3 id="inq-title" className="mt-4 mb-0 text-[22px] font-extrabold tracking-[-0.02em]">Request a business quote</h3>
                        <p className="mt-1 mb-5 text-[13px] text-[#6B6680] dark:text-slate-400">Send your details for custom pricing and team seats.</p>
                        <form onSubmit={handleSendInquiry} className="space-y-3.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <label className="block">
                                    <span className="block text-[13px] font-bold mb-1.5">Your name</span>
                                    <input type="text" required value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} autoComplete="name" className="w-full h-12 px-3.5 bg-panel dark:bg-night-3 rounded-[14px] text-[15px] outline-none focus:ring-2 focus:ring-brand" />
                                </label>
                                <label className="block">
                                    <span className="block text-[13px] font-bold mb-1.5">Email address</span>
                                    <input type="email" required value={inquiryEmail} onChange={(e) => setInquiryEmail(e.target.value)} autoComplete="email" className="w-full h-12 px-3.5 bg-panel dark:bg-night-3 rounded-[14px] text-[15px] outline-none focus:ring-2 focus:ring-brand" />
                                </label>
                            </div>
                            <label className="block">
                                <span className="block text-[13px] font-bold mb-1.5">Message (optional)</span>
                                <textarea value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} rows={3} placeholder="How many people, and anything you need" className="w-full p-3.5 bg-panel dark:bg-night-3 rounded-[14px] text-[15px] outline-none focus:ring-2 focus:ring-brand placeholder-[#9A94AE]" />
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowInquiryModal(false)} className="press flex-1 h-12 rounded-[14px] bg-panel dark:bg-night-3 text-[14px] font-bold">Cancel</button>
                                <button type="submit" disabled={isInquirySubmitting} className="press flex-1 h-12 rounded-[14px] bg-brand text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-60">
                                    {isInquirySubmitting ? <><Loader size={14} className="animate-spin" />Sending...</> : 'Send request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-10">
                <div className="rounded-[28px] bg-white dark:bg-night-2 px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <img src="/schoolofai-logo.png" alt="Welile School of AI" className="h-11 object-contain" />
                    <div className="flex flex-wrap gap-x-6 gap-y-2 items-center justify-center text-[14px]">
                        <Link to="/free/ai-fundamentals" className="font-bold text-ink dark:text-white no-underline hover:text-brand">Free course</Link>
                        <Link to="/register" className="font-bold text-brand dark:text-violet-300 no-underline hover:underline">Outreach registration form</Link>
                        <span className="text-[#6B6680] dark:text-slate-400">© {new Date().getFullYear()} Welile School of AI. All rights reserved.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
