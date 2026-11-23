import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Award, CalendarClock, CheckCircle2, Headphones, PlayCircle, Smartphone } from 'lucide-react';
import LandingOrb from '../landing/LandingOrb';
import { markWelcomeSeen } from '../../src/lib/welcome';

const BASE = '/learn/ai-fundamentals';

/** Get started: the first screen a new student sees after signing in for the first time. */
const WelcomePage: React.FC<{ session: any }> = ({ session }) => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = params.get('next');
    const first = String(session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || '').trim().split(/\s+/)[0];

    useEffect(() => { document.title = 'Get started | Welile School of AI'; }, []);

    const go = (to: string) => { markWelcomeSeen(session); navigate(to, { replace: true }); };
    const startTo = next && next.startsWith('/learn/') ? next : `${BASE}/item/m0-l1`;
    const laterTo = next && !next.startsWith('/learn/') ? next : '/dashboard';

    const steps = [
        { icon: PlayCircle, tone: 'bg-brand text-white', title: 'Watch the welcome video', text: 'Five minutes. It shows how the course works and what you will be able to do.' },
        { icon: CalendarClock, tone: 'bg-lime-200 text-night', title: 'Learn your way', text: 'Join a live class (Mon, Wed or Fri at 2:00 pm EAT) or study at your own pace. A live class counts its lessons as done.' },
        { icon: Award, tone: 'bg-mint-soft text-mint', title: 'Earn your certificate', text: 'Pass each module quiz (70%) and the final test (80%). Your certificate is issued instantly.' },
    ];

    return (
        <div className="min-h-[100dvh] lg:h-[100dvh] bg-panel dark:bg-night text-ink dark:text-white p-3 sm:p-4 flex">
            <div className="w-full max-w-[1240px] mx-auto flex flex-col lg:flex-row gap-3 sm:gap-4 lg:min-h-0">
                {/* greeting */}
                <section className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-night text-white lg:w-[44%] p-6 lg:p-8 flex flex-col lg:min-h-0">
                    <span aria-hidden="true" className="absolute -left-24 -bottom-40 w-[380px] h-[380px] rounded-full bg-night-2" />
                    <div className="relative flex items-center gap-2.5 shrink-0">
                        <span className="w-10 h-10 rounded-[12px] bg-lime-200 text-night inline-flex items-center justify-center text-[18px] font-extrabold">W</span>
                        <span className="text-[16px] font-extrabold tracking-[-0.01em]">Welile School of AI</span>
                    </div>
                    <div className="relative flex-1 min-h-[200px] lg:min-h-[120px]">
                        <div className="absolute inset-0 py-3 flex items-center justify-center">
                            <div className="h-full max-h-[300px] aspect-square">
                                <LandingOrb size="md" showBadges={false} />
                            </div>
                        </div>
                    </div>
                    <div className="relative shrink-0">
                        <p className="m-0 text-[12px] font-extrabold tracking-[0.14em] uppercase text-lime-200">Your account is ready</p>
                        <h1 className="mt-2 mb-0 text-[30px] sm:text-[36px] leading-[1.06] font-extrabold tracking-[-0.03em]">Welcome{first ? `, ${first}` : ''}!</h1>
                        <p className="mt-2.5 mb-0 text-[15px] leading-relaxed text-[#CFC8DC] max-w-[440px]">You are enrolled in <b className="text-white">AI Fundamentals</b>, free, with a certificate at the end. Here is how it works.</p>
                    </div>
                </section>

                {/* steps */}
                <main className="flex-1 rounded-[28px] sm:rounded-[32px] bg-white dark:bg-night-2 flex flex-col lg:min-h-0 lg:overflow-y-auto no-scrollbar">
                    <div className="w-full max-w-[520px] mx-auto my-auto px-6 sm:px-8 py-6 lg:py-5">
                        <p className="m-0 inline-flex items-center h-8 px-3 rounded-full bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 text-[12px] font-extrabold tracking-[0.06em]">GET STARTED · 3 STEPS</p>
                        <h2 className="mt-3 mb-0 text-[26px] sm:text-[28px] font-extrabold tracking-[-0.03em]">Your first lesson takes 5 minutes</h2>

                        <ol className="mt-4 p-0 list-none flex flex-col gap-2">
                            {steps.map((s, i) => (
                                <li key={s.title} className="flex gap-3.5 rounded-[18px] bg-panel dark:bg-night-3/60 px-4 py-3.5">
                                    <span className={`w-11 h-11 rounded-[14px] shrink-0 inline-flex items-center justify-center ${s.tone}`}><s.icon size={20} /></span>
                                    <span className="min-w-0">
                                        <span className="block text-[11px] font-extrabold tracking-[0.1em] uppercase text-[#6B6680] dark:text-slate-400">Step {i + 1}</span>
                                        <span className="block text-[16px] font-extrabold leading-snug">{s.title}</span>
                                        <span className="block mt-0.5 text-[13px] leading-relaxed text-[#6B6680] dark:text-slate-400">{s.text}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>

                        <ul className="mt-3 p-0 list-none flex flex-wrap gap-1.5 text-[12px] font-bold">
                            <li className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-lime-100 text-lime-900"><Smartphone size={13} />Any phone</li>
                            <li className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-lime-100 text-lime-900"><Headphones size={13} />Audio-only option</li>
                            <li className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-lime-100 text-lime-900"><CheckCircle2 size={13} />About 6 hours</li>
                        </ul>

                        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                            <button type="button" onClick={() => go(startTo)} className="press flex-1 h-12 rounded-[14px] bg-brand hover:bg-brand-mid text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2">
                                Start my first lesson <ArrowRight size={17} />
                            </button>
                            <button type="button" onClick={() => go(laterTo)} className="press h-12 px-5 rounded-[14px] bg-panel dark:bg-night-3 text-[15px] font-bold">
                                Go to my dashboard
                            </button>
                        </div>
                        <p className="mt-3 mb-0 [@media(max-height:700px)]:hidden text-[13px] text-[#6B6680] dark:text-slate-400 text-center sm:text-left">
                            Want to see the timetable first? <Link to={`${BASE}/live`} onClick={() => markWelcomeSeen(session)} className="font-extrabold text-brand dark:text-violet-300 no-underline hover:underline">Live classes</Link>
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default WelcomePage;
