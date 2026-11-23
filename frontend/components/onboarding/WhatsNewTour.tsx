import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Award, Check, Download, Headphones, Home, BookOpen, Pause, Play, Sparkles, Video } from 'lucide-react';
import LandingOrb from '../landing/LandingOrb';

/**
 * "Welcome to your new dashboard" tour.
 * Shown once, over the dashboard, to students who used the app before the redesign.
 * Desktop: a dialog over the blurred dashboard. Phone: a full-screen walkthrough.
 */

type Step = { eyebrow: string; title: string; body: string; Preview: React.FC<{ name: string }> };

const Tag: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
    <span className={`absolute z-[2] inline-flex items-center gap-[5px] h-6 px-[9px] rounded-[8px] bg-lime-200 text-ink text-[11px] font-extrabold whitespace-nowrap shadow-[0_6px_16px_rgba(0,0,0,0.25)] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-ink" />{children}
    </span>
);

const Chip: React.FC<{ className: string; icon: React.ElementType; children: React.ReactNode }> = ({ className, icon: Icon, children }) => (
    <span className={`absolute inline-flex items-center gap-[7px] h-[38px] px-3.5 rounded-[13px] text-[13px] font-extrabold whitespace-nowrap shadow-[0_14px_30px_rgba(0,0,0,0.3)] ${className}`}>
        <Icon size={16} strokeWidth={2} aria-hidden="true" />{children}
    </span>
);

const card = 'shadow-[0_30px_60px_rgba(0,0,0,0.35)]';

const WelcomePreview: React.FC = () => (
    <div className="relative w-[320px] h-[320px]">
        <span className="absolute left-1/2 top-1/2 w-[260px] h-[260px] -ml-[130px] -mt-[130px] rounded-full border-2 border-dashed border-[#3A3160]" />
        <div className="absolute left-1/2 top-1/2 w-[236px] h-[236px] -ml-[118px] -mt-[118px]">
            <LandingOrb size="md" showBadges={false} showSays={false} />
        </div>
        <Chip className="left-1.5 top-[34px] bg-white text-ink" icon={Home}>Home</Chip>
        <Chip className="right-0 top-[70px] bg-brand-soft text-brand" icon={BookOpen}>Lessons</Chip>
        <Chip className="left-0 bottom-16 bg-[#F0533A] text-white" icon={Video}>Live</Chip>
        <Chip className="right-1 bottom-[26px] bg-lime-200 text-ink" icon={Award}>Certificates</Chip>
    </div>
);

const HomePreview: React.FC = () => (
    <div className="relative w-full max-w-[330px] py-4">
        <Tag className="-left-1.5 top-0">Menu</Tag>
        <Tag className="right-[18px] top-1">Up next</Tag>
        <Tag className="left-[70px] bottom-0">Your progress</Tag>
        <Tag className="-right-1 bottom-[34px]">Live today</Tag>
        <div className={`w-full bg-panel rounded-[20px] p-3 flex gap-2.5 ${card}`}>
            <div className="w-[54px] shrink-0 bg-white rounded-[14px] py-2.5 flex flex-col items-center gap-[9px]">
                <span className="w-[26px] h-[26px] rounded-[8px] bg-brand" />
                <span className="w-[30px] h-2 rounded bg-brand-soft" />
                {[0, 1, 2].map(i => <span key={i} className="w-[30px] h-2 rounded bg-[#EFEDF5]" />)}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-2">
                <span className="h-[18px] rounded-[7px] bg-white" />
                <div className="relative overflow-hidden h-[86px] rounded-[14px] bg-brand p-3">
                    <span className="absolute -right-6 -top-[30px] w-[100px] h-[100px] rounded-full bg-brand-mid" />
                    <span className="relative block w-3/5 h-2 rounded bg-[#D9CCFF]" />
                    <span className="relative block w-4/5 h-3 rounded-[5px] bg-white mt-2" />
                    <span className="relative block w-[46px] h-4 rounded-[6px] bg-lime-200 mt-3" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="h-[58px] rounded-[12px] bg-white" />
                    <span className="h-[58px] rounded-[12px] bg-lime-100" />
                    <span className="h-[58px] rounded-[12px] bg-brand-soft" />
                    <span className="h-[58px] rounded-[12px] bg-white" />
                </div>
            </div>
        </div>
    </div>
);

const LessonPreview: React.FC = () => (
    <div className={`w-full max-w-[330px] bg-white text-ink rounded-[22px] overflow-hidden ${card}`}>
        <div className="relative h-[150px] bg-night-3 flex items-center justify-center">
            <span className="absolute left-3 top-3 text-[11px] font-bold text-[#D9CCFF]">Module 2 · Lesson 2 of 6</span>
            <span className="w-[54px] h-[54px] rounded-full bg-white text-brand inline-flex items-center justify-center"><Play size={22} fill="currentColor" aria-hidden="true" /></span>
            <div className="absolute left-3 right-3 bottom-3 h-[5px] rounded-[5px] bg-[#4A4170]"><span className="block w-[22%] h-full rounded-[5px] bg-lime-200" /></div>
        </div>
        <div className="px-3.5 pt-3 pb-3.5">
            <p className="m-0 text-[14px] font-extrabold tracking-[-0.01em]">Context, task, format</p>
            <div className="flex gap-1.5 mt-2.5">
                <span className="h-[26px] px-2.5 rounded-[8px] bg-brand text-white text-[11px] font-extrabold inline-flex items-center">Video</span>
                <span className="h-[26px] px-2.5 rounded-[8px] bg-[#F4F1FC] text-brand text-[11px] font-extrabold inline-flex items-center">Data saver</span>
                <span className="h-[26px] px-2.5 rounded-[8px] bg-[#F4F1FC] text-brand text-[11px] font-extrabold inline-flex items-center">Audio only</span>
            </div>
            <div className="flex flex-col gap-1.5 mt-3 text-[12px]">
                <span className="flex items-center gap-2 font-bold"><span className="w-5 h-5 rounded-full bg-mint text-white inline-flex items-center justify-center"><Check size={12} strokeWidth={3} aria-hidden="true" /></span>What a prompt is</span>
                <span className="flex items-center gap-2 font-extrabold text-brand"><span className="w-5 h-5 rounded-full border-2 border-brand" />Context, task, format</span>
                <span className="flex items-center gap-2 font-semibold text-[#8A85A0]"><span className="w-5 h-5 rounded-full border-2 border-[#E3DEF2]" />Quiz · 5 questions</span>
            </div>
        </div>
    </div>
);

const LivePreview: React.FC = () => (
    <div className={`w-full max-w-[330px] bg-white text-ink rounded-[22px] overflow-hidden ${card}`}>
        <div className="relative h-[140px] bg-night-3 flex items-end p-3.5">
            <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[8px] bg-[#F0533A] text-white text-[11px] font-extrabold tracking-[0.08em]">
                <span className="w-[7px] h-[7px] rounded-full bg-white motion-safe:animate-pulse" />LIVE
            </span>
            <span className="absolute right-3.5 top-3.5 text-[12px] font-bold text-[#D9CCFF]">48 learners</span>
            <div className="flex">
                {['bg-lime-200', 'bg-brand-soft', 'bg-mint-soft'].map((c, i) => <span key={c} className={`w-[34px] h-[34px] rounded-full ${c} border-2 border-night-3 ${i ? '-ml-2.5' : ''}`} />)}
            </div>
        </div>
        <div className="p-4">
            <p className="m-0 text-[16px] font-extrabold tracking-[-0.01em]">AI for small business · Q&amp;A</p>
            <p className="mt-1 mb-0 text-[12px] text-[#6B6680]">Live now · started 6 min ago</p>
            <span className="flex items-center justify-center gap-2 h-[42px] mt-3.5 rounded-[12px] bg-brand text-white text-[14px] font-extrabold"><Video size={16} aria-hidden="true" />Join class</span>
        </div>
    </div>
);

const CertificatePreview: React.FC<{ name: string }> = ({ name }) => (
    <div className="w-full max-w-[330px] flex flex-col gap-3">
        <div className={`relative bg-white text-ink rounded-[20px] px-5 py-[22px] text-center ${card}`}>
            <div className="absolute inset-2 border-2 border-brand-soft rounded-[14px] pointer-events-none" />
            <span className="inline-flex w-10 h-10 rounded-[12px] bg-brand text-lime-200 items-center justify-center"><Award size={22} aria-hidden="true" /></span>
            <p className="mt-2.5 mb-0 text-[10px] font-extrabold tracking-[0.14em] uppercase text-brand">Certificate of completion</p>
            <p className="mt-2 mb-0 text-[22px] font-extrabold tracking-[-0.02em]">{name || 'Your name'}</p>
            <p className="mt-1 mb-0 text-[12px] text-[#6B6680]">AI Fundamentals: Use AI with Confidence</p>
            <div className="flex items-end justify-between mt-4 px-1.5">
                <span className="w-[70px] h-0.5 bg-ink mb-1.5" />
                <span className="w-10 h-10 rounded-[6px] bg-[repeating-linear-gradient(90deg,#1E1B2E_0_4px,#FFFFFF_4px_7px)] opacity-90" />
                <span className="w-[70px] h-0.5 bg-ink mb-1.5" />
            </div>
        </div>
        <div className="flex gap-2">
            <span className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-[12px] bg-brand text-white text-[13px] font-extrabold"><Download size={15} aria-hidden="true" />Download PDF</span>
            <span className="flex-1 inline-flex items-center justify-center h-10 rounded-[12px] bg-night-2 text-white text-[13px] font-extrabold">Add to LinkedIn</span>
        </div>
    </div>
);

const BARS = [14, 26, 18, 34, 22, 40, 28, 16, 36, 24, 30, 12, 26, 38, 20, 30, 14, 24, 32, 18];
const AudioPreview: React.FC = () => (
    <div className="w-[230px] h-[400px] bg-ink rounded-[34px] p-2.5 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
        <div className="h-full rounded-[26px] bg-night-3 text-white px-4 pt-[22px] pb-4 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[8px] bg-lime-200 text-ink text-[11px] font-extrabold"><Headphones size={13} aria-hidden="true" />Audio only</span>
            <span className="w-24 h-24 rounded-[28px] bg-brand mt-[22px] inline-flex items-center justify-center text-lime-200"><Headphones size={44} strokeWidth={1.8} aria-hidden="true" /></span>
            <p className="mt-[18px] mb-0 text-[14px] font-extrabold">What is a prompt?</p>
            <p className="mt-1 mb-0 text-[11px] text-[#B9B2CC]">Uses far less data</p>
            <div className="flex items-center gap-[3px] h-11 mt-4">
                {BARS.map((h, i) => <span key={i} className={`w-[5px] rounded-[3px] ${i < 13 ? 'bg-lime-200' : 'bg-[#4A4170]'}`} style={{ height: h }} />)}
            </div>
            <div className="flex-1" />
            <span className="w-[52px] h-[52px] rounded-full bg-white text-brand inline-flex items-center justify-center"><Pause size={20} fill="currentColor" aria-hidden="true" /></span>
        </div>
    </div>
);

const buildSteps = (first: string): Step[] => [
    { eyebrow: 'Welcome', title: `Welcome to your new dashboard${first ? `, ${first}` : ''}`, body: "We've redesigned Welile School of AI around how you learn. Your progress, certificates and plan are all still here. Take a quick tour to see what's where.", Preview: WelcomePreview },
    { eyebrow: 'Home dashboard', title: 'Everything starts on Home', body: "The menu on the left takes you anywhere. The purple card shows your next lesson, and your progress and today's live classes sit right below it.", Preview: HomePreview },
    { eyebrow: 'Lessons', title: 'A lesson player built for focus', body: 'Watch the video, or switch to data saver or audio only. Read the transcript and keep notes on the same screen. Finished lessons get a green tick.', Preview: LessonPreview },
    { eyebrow: 'Live classes', title: 'Live classes, one tap away', body: "When a class goes live you'll see a red LIVE badge. Join from Home or the Live tab, ask questions and watch the replay later.", Preview: LivePreview },
    { eyebrow: 'Certificates', title: 'Certificates you can share', body: "See exactly what's left to earn each certificate. Once you pass, download the PDF or add it to LinkedIn. Every certificate has a QR code employers can scan.", Preview: CertificatePreview },
    { eyebrow: 'Learn anywhere', title: 'Learn on any phone, even on low data', body: 'Switch any lesson to audio-only mode and listen like a podcast. It uses far less data, and you can still pay with MTN or Airtel Mobile Money.', Preview: AudioPreview },
];

const btn = 'press inline-flex items-center justify-center gap-2 h-[50px] px-[22px] rounded-[14px] text-[15px] font-extrabold border-0 cursor-pointer';

const WhatsNewTour: React.FC<{ session: any; onClose: () => void }> = ({ session, onClose }) => {
    const meta = session?.user?.user_metadata || {};
    const fullName = String(meta.full_name || meta.name || '').trim();
    const first = fullName.split(/\s+/)[0];
    const steps = buildSteps(first);
    const n = steps.length;
    const [step, setStep] = useState(0);
    const dialogRef = useRef<HTMLElement>(null);
    const go = useCallback((i: number) => setStep(Math.min(Math.max(i, 0), n - 1)), [n]);

    useEffect(() => {
        dialogRef.current?.focus();
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowRight') go(step + 1);
            else if (e.key === 'ArrowLeft') go(step - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [step, go, onClose]);

    const s = steps[step];
    const { Preview } = s;
    const last = step === n - 1;

    const dots = (
        <div role="tablist" aria-label="Tour steps" className="flex items-center gap-1.5">
            {steps.map((x, i) => (
                <button key={x.eyebrow} type="button" role="tab" aria-selected={i === step} aria-label={`Step ${i + 1}: ${x.eyebrow}`} onClick={() => go(i)}
                    className={`h-1.5 p-0 border-0 rounded-full cursor-pointer motion-safe:transition-all motion-safe:duration-300 ${i === step ? 'w-6 md:w-7' : 'w-2.5 md:w-3'} ${i <= step ? 'bg-brand' : 'bg-[#E3DEF2] dark:bg-night-3'}`} />
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[90] flex md:items-center md:justify-center md:p-6 md:bg-night/55 md:backdrop-blur-[6px]">
            <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="whats-new-title"
                className="relative w-full h-[100dvh] md:h-auto md:max-w-[980px] md:min-h-[580px] md:max-h-[calc(100dvh-48px)] bg-night md:bg-white md:dark:bg-night-2 md:rounded-[30px] overflow-hidden flex flex-col md:flex-row md:shadow-[0_40px_100px_rgba(10,6,30,0.45)] outline-none">

                {/* preview side */}
                <div className="relative flex-1 md:flex-none md:w-[460px] bg-night overflow-hidden flex flex-col min-h-0">
                    <span aria-hidden="true" className="absolute -left-20 md:-left-[90px] -top-16 md:-top-[90px] w-[260px] h-[260px] md:w-[300px] md:h-[300px] rounded-full bg-night-2" />
                    <span aria-hidden="true" className="absolute -right-16 md:-right-[70px] top-[250px] md:top-auto md:-bottom-[110px] w-[200px] h-[200px] md:w-[280px] md:h-[280px] rounded-full bg-night-3" />
                    <span aria-hidden="true" className="absolute right-10 md:right-[46px] top-24 md:top-[54px] w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-lime-200" />

                    <div className="relative md:hidden flex items-center justify-between px-5 pt-[max(20px,env(safe-area-inset-top))]">
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[9px] bg-lime-200 text-ink text-[12px] font-extrabold"><Sparkles size={13} aria-hidden="true" />New look</span>
                        <button type="button" onClick={onClose} className="press bg-transparent border-0 text-[14px] font-bold text-[#D9CCFF] px-1 py-2 cursor-pointer">Skip</button>
                    </div>

                    <div key={step} className="relative flex-1 min-h-0 flex items-center justify-center px-[30px] py-2.5 md:p-10 motion-safe:animate-[tour-in_260ms_ease-out]">
                        <div className="w-full flex justify-center [@media(max-width:767px)_and_(max-height:760px)]:scale-[0.82] [@media(max-width:767px)_and_(max-height:660px)]:scale-[0.68]"><Preview name={fullName} /></div>
                    </div>
                </div>

                {/* text side */}
                <div className="relative shrink-0 md:shrink md:flex-1 min-w-0 bg-white dark:bg-night-2 text-ink dark:text-white rounded-t-[30px] md:rounded-none min-h-[300px] [@media(max-height:700px)]:min-h-0 md:min-h-0 px-[22px] pt-[26px] pb-[max(30px,env(safe-area-inset-bottom))] md:px-12 md:pt-11 md:pb-10 flex flex-col">
                    <div className="hidden md:flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 h-[30px] px-3 rounded-[10px] bg-lime-100 text-[#3F5A0F] text-[12px] font-extrabold"><Sparkles size={14} aria-hidden="true" />New look</span>
                        <span className="text-[13px] font-bold text-[#8A85A0]">{step + 1} of {n}</span>
                    </div>
                    <div className="flex items-center justify-between md:mt-[34px]">
                        <p className="m-0 text-[11px] md:text-[12px] font-extrabold tracking-[0.12em] uppercase text-brand dark:text-violet-300">{s.eyebrow}</p>
                        <span className="md:hidden text-[12px] font-bold text-[#8A85A0]">{step + 1} of {n}</span>
                    </div>
                    <h1 id="whats-new-title" className="mt-2 md:mt-2.5 mb-0 text-[25px] md:text-[34px] leading-[1.2] md:leading-[1.15] font-extrabold tracking-[-0.02em] md:tracking-[-0.025em] md:max-w-[420px]">{s.title}</h1>
                    <p className="mt-2.5 md:mt-4 mb-0 text-[14px] md:text-[16px] leading-[1.55] md:leading-[1.6] text-[#6B6680] dark:text-[#B9B2CC] md:max-w-[420px]" aria-live="polite">{s.body}</p>
                    <div className="flex-1 min-h-[18px] md:min-h-8" />
                    {dots}
                    <div className="flex items-center gap-2.5 md:gap-3 md:justify-between mt-[18px] md:mt-6">
                        {step === 0
                            ? <button type="button" onClick={onClose} className={`${btn} flex-1 md:flex-none bg-transparent text-[#6B6680] dark:text-[#B9B2CC] px-2.5 md:px-3.5`}>Skip tour</button>
                            : <button type="button" onClick={() => go(step - 1)} className={`${btn} flex-1 md:flex-none bg-[#F4F1FC] dark:bg-night-3 text-brand dark:text-violet-200`}><ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />Back</button>}
                        {last
                            ? <button type="button" onClick={onClose} className={`${btn} flex-[1.6] md:flex-none bg-brand text-white`}>Go to my dashboard<ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" /></button>
                            : <button type="button" onClick={() => go(step + 1)} className={`${btn} flex-[1.6] md:flex-none bg-brand text-white`}>Next<ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" /></button>}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default WhatsNewTour;
