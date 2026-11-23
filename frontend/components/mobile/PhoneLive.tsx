import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessions, googleCalendarUrl } from '../learn/LivePanel';
import { trackedLiveJoinUrl } from '../../src/lib/analytics';
import { Ico, PageTitle, PhonePage } from './phoneKit';

/** Phone · Live classes (canvas board MobileLive). */

const TZ = 'Africa/Kampala';
const dayKey = (iso: string | number) => new Date(iso).toLocaleDateString('en-GB', { timeZone: TZ });
const timeEAT = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).toLowerCase();
const dayName = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { timeZone: TZ, weekday: 'short' }).toUpperCase();
const dayNum = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric' });
const dateLabel = (iso: string, now: number) => {
    if (dayKey(iso) === dayKey(now)) return 'Today';
    if (dayKey(iso) === dayKey(now + 86400000)) return 'Tomorrow';
    return new Date(iso).toLocaleDateString('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
};

const pad = (n: number) => String(n).padStart(2, '0');
/** "10:00" (mm:ss) under an hour, "3:05:00" under a day, then "2 days". */
const countdown = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    if (s >= 86400) { const d = Math.round(s / 86400); return { big: `${d} day${d > 1 ? 's' : ''}`, small: 'until it starts' }; }
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return { big: h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`, small: 'until it starts' };
};

const PhoneLive: React.FC<{ user: any }> = ({ user }) => {
    const uid = user?.id && user.id !== 'guest' ? user.id : undefined;
    const sessions = useSessions();
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);

    const upcoming = (sessions || []).filter(s => new Date(s.ends_at).getTime() > now);
    const next = upcoming[0];
    const start = next ? new Date(next.starts_at).getTime() : 0;
    const liveNow = !!next && now >= start;
    const joinable = !!next?.meet_link && now >= start - 10 * 60000;
    const cd = next ? countdown(start - now) : null;
    const week = upcoming.slice(0, 3);

    return (
        <PhonePage>
            <PageTitle>Live classes</PageTitle>

            <section className="relative overflow-hidden rounded-[26px] bg-brand text-white p-[22px]">
                <span aria-hidden="true" className="absolute -right-[60px] -top-[70px] w-[200px] h-[200px] rounded-full bg-brand-mid" />
                {sessions === null ? (
                    <p className="relative m-0 text-[15px] text-[#E6DEFF]">Loading the timetable…</p>
                ) : next ? (
                    <>
                        <span className="relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white text-ink text-[11px] font-extrabold">
                            <span className={`w-[7px] h-[7px] rounded-full bg-[#F0533A] ${liveNow ? 'motion-safe:animate-pulse' : ''}`} />
                            {liveNow ? 'Live now' : `${dateLabel(next.starts_at, now)} · ${timeEAT(next.starts_at)} EAT`}
                        </span>
                        <h2 className="relative mt-3 mb-0 text-[22px] leading-[1.2] font-extrabold tracking-[-0.02em]">{next.title}</h2>
                        <div className="relative flex items-baseline gap-2 mt-3.5">
                            {liveNow
                                ? <span className="text-[15px] text-[#E6DEFF]">Started {Math.max(1, Math.round((now - start) / 60000))} min ago{next.host_name ? ` · with ${next.host_name}` : ''}</span>
                                : <><span className="text-[44px] font-extrabold tracking-[-0.03em] tabular-nums text-lime-200">{cd!.big}</span><span className="text-[13px] text-[#E6DEFF]">{cd!.small}</span></>}
                        </div>
                        <div className="relative flex flex-col gap-2.5 mt-5">
                            {joinable ? (
                                <a href={trackedLiveJoinUrl(next.id, uid, 'phone_live')} target="_blank" rel="noreferrer"
                                    className="press h-[52px] rounded-[16px] bg-white text-brand text-[16px] font-extrabold flex items-center justify-center gap-2.5 no-underline shadow-[0_6px_16px_rgba(30,27,46,0.18)]">
                                    {Ico.video()}Join class
                                </a>
                            ) : (
                                <span aria-disabled="true" className="h-[52px] rounded-[16px] bg-white/85 text-brand text-[15px] font-extrabold flex items-center justify-center gap-2.5">
                                    {Ico.video()}Join opens 10 min before
                                </span>
                            )}
                            <a href={googleCalendarUrl(next, uid)} target="_blank" rel="noreferrer"
                                className="press h-12 rounded-[16px] bg-white/[0.14] border border-solid border-white/35 text-white text-[14px] font-bold flex items-center justify-center gap-2 no-underline">
                                {Ico.calendar()}Add to calendar
                            </a>
                        </div>
                    </>
                ) : (
                    <>
                        <span className="relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white text-ink text-[11px] font-extrabold">Mon, Wed and Fri · 2:00 pm EAT</span>
                        <h2 className="relative mt-3 mb-0 text-[22px] leading-[1.2] font-extrabold tracking-[-0.02em]">The next class will be posted soon</h2>
                        <p className="relative mt-2 mb-0 text-[13px] leading-relaxed text-[#E6DEFF]">Live classes are optional. Your recorded lessons are open now, and every class has a replay.</p>
                    </>
                )}
            </section>

            <section className="bg-white dark:bg-night-2 rounded-[22px] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-[12px] bg-mint-soft text-mint inline-flex items-center justify-center shrink-0">{Ico.whatsapp()}</span>
                    <div className="flex-1">
                        <p className="m-0 text-[15px] font-extrabold">WhatsApp reminders</p>
                        <p className="mt-0.5 mb-0 text-[12px] text-[#6B6680] dark:text-slate-400">24 hours and 1 hour before class</p>
                    </div>
                    <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-mint-soft text-mint-ink text-[12px] font-extrabold">{Ico.check(12)}On</span>
                </div>
                <p className="m-0 px-3 py-2.5 rounded-[12px] bg-panel dark:bg-night-3 text-[13px] text-[#4A4560] dark:text-slate-300">
                    Sent to the WhatsApp number on your profile · <Link to="/profile?view=details" className="font-bold text-brand dark:text-violet-300 no-underline">Change</Link>
                </p>
            </section>

            {week.length > 0 && (
                <section aria-labelledby="phone-week">
                    <h2 id="phone-week" className="m-0 mb-2.5 text-[17px] font-extrabold tracking-[-0.01em]">Coming up</h2>
                    <div className="bg-white dark:bg-night-2 rounded-[22px] p-1.5">
                        {week.map((s, i) => (
                            <div key={s.id} className={`flex items-center gap-3 p-2.5 rounded-[16px] ${i === 0 ? 'bg-brand-soft dark:bg-night-3' : ''}`}>
                                <span className={`w-[46px] h-[46px] rounded-[12px] inline-flex flex-col items-center justify-center leading-none shrink-0 ${i === 0 ? 'bg-brand text-white' : 'bg-[#F1EFF6] dark:bg-night-3'}`}>
                                    <span className={`text-[10px] font-bold ${i === 0 ? '' : 'text-[#6B6680] dark:text-slate-400'}`}>{dayName(s.starts_at)}</span>
                                    <span className="text-[17px] font-extrabold">{dayNum(s.starts_at)}</span>
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-[14px] font-bold truncate">{s.title}</span>
                                    <span className={`block text-[12px] ${i === 0 ? 'text-[#4A3B7A] dark:text-violet-200' : 'text-[#6B6680] dark:text-slate-400'}`}>
                                        {timeEAT(s.starts_at)}{dayKey(s.starts_at) === dayKey(now) ? ' · today' : ''}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <Link to="/events?view=all" className="press h-[52px] rounded-[18px] bg-white dark:bg-night-2 text-ink dark:text-white text-[14px] font-bold flex items-center justify-center gap-1 no-underline">
                Workshops, webinars and replays {Ico.chevron(16)}
            </Link>
        </PhonePage>
    );
};

export default PhoneLive;
