import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFreeCourse } from '../../src/hooks/useFreeCourse';
import { ALL_ITEMS, CourseItem, moduleOfItem } from '../../src/content/aiFundamentals';
import { useSessions } from '../learn/LivePanel';
import { formatEAT } from '../learn/learnUi';
import { Avatar, BASE, Ico, PhonePage, Ring, greeting, streakOf, useProgressMap } from './phoneKit';

/** Phone · Home (canvas board MobileHome). */

const kindLabel = (it: CourseItem) => it.kind === 'video' ? 'Video' : it.kind === 'quiz' ? 'Quiz' : 'Reading';

const useNow = (ms: number) => {
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), ms); return () => window.clearInterval(t); }, [ms]);
    return now;
};

const until = (iso: string, now: number) => {
    const m = Math.round((new Date(iso).getTime() - now) / 60000);
    if (m <= 0) return 'Live now';
    if (m < 60) return `${m} min`;
    if (m < 24 * 60) return `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim();
    const d = Math.round(m / 1440);
    return d === 1 ? 'Tomorrow' : `${d} days`;
};

const isToday = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' }) === new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' });
const timeEAT = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Africa/Kampala', hour: 'numeric', minute: '2-digit' }).toLowerCase();

const PhoneHome: React.FC<{ user: any }> = ({ user }) => {
    const navigate = useNavigate();
    const uid = user?.id && user.id !== 'guest' ? user.id : undefined;
    const fc = useFreeCourse(uid);
    const progress = useProgressMap(uid);
    const sessions = useSessions();
    const now = useNow(30000);

    const [unread, setUnread] = useState(0);
    useEffect(() => {
        const count = () => {
            try {
                const list = JSON.parse(localStorage.getItem(`portal-notifications-${localStorage.getItem('logged_in_email') || ''}`) || '[]');
                setUnread(list.filter((n: any) => !n.read).length);
            } catch { setUnread(0); }
        };
        count();
        window.addEventListener('notifications-update', count);
        return () => window.removeEventListener('notifications-update', count);
    }, []);

    const streak = useMemo(() => streakOf(progress), [progress]);
    const upNext = useMemo(() => {
        const start = Math.max(0, ALL_ITEMS.findIndex(i => progress[i.id]?.status !== 'completed'));
        return ALL_ITEMS.slice(start, start + 4);
    }, [progress]);

    const nextId = fc.nextItemId;
    const mod = nextId ? moduleOfItem(nextId) : undefined;
    const done = !!fc.cert || fc.finalPassed;
    const eyebrow = done ? 'Course complete' : mod ? `${fc.started ? 'Continue' : 'Start'} · ${mod.number ? `Module ${mod.number}` : 'Welcome'}` : 'Final test';
    const cardTitle = done ? 'You finished AI Fundamentals' : fc.nextItemTitle || 'Take the final test';
    const cardTo = done ? `${BASE}/certificate` : nextId ? `${BASE}/item/${nextId}` : `${BASE}/final`;
    const cardCta = done ? 'View certificate' : fc.started ? 'Resume' : 'Start';

    const live = (sessions || []).find(s => new Date(s.ends_at).getTime() > now);
    const firstName = String(user?.name || '').split(' ')[0];

    return (
        <PhonePage gap={18}>
            <header className="flex items-center gap-3">
                <button type="button" onClick={() => navigate('/profile')} aria-label="Your profile" className="press p-0 border-0 bg-transparent rounded-full cursor-pointer">
                    <Avatar user={user} size={44} text={15} />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="m-0 text-[13px] text-[#6B6680] dark:text-slate-400">{greeting()}</p>
                    <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.02em] truncate">{user?.name || firstName || 'Welcome'}</h1>
                </div>
                <button type="button" onClick={() => navigate('/notifications')} aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
                    className="press relative w-11 h-11 rounded-full border-0 bg-white dark:bg-night-2 text-ink dark:text-white inline-flex items-center justify-center cursor-pointer">
                    {Ico.bell()}
                    {unread > 0 && <span className="absolute top-[9px] right-[10px] w-[9px] h-[9px] rounded-full bg-[#F0533A] border-2 border-white dark:border-night-2" />}
                </button>
            </header>

            <section className="relative overflow-hidden rounded-[24px] bg-brand text-white p-5">
                <span aria-hidden="true" className="absolute -right-[50px] -top-[60px] w-[180px] h-[180px] rounded-full bg-brand-mid" />
                <p className="relative m-0 text-[11px] font-bold tracking-[0.12em] uppercase text-[#D9CCFF]">{eyebrow}</p>
                <p className="relative mt-2 mb-0 text-[19px] leading-[1.25] font-extrabold tracking-[-0.01em]">{cardTitle}</p>
                <div className="relative flex items-center gap-2.5 mt-3.5">
                    <div className="flex-1 h-1.5 rounded-full bg-brand-light overflow-hidden"><div className="h-full bg-lime-200" style={{ width: `${fc.pct}%` }} /></div>
                    <span className="text-[12px] font-bold">{fc.pct}%</span>
                </div>
                <Link to={cardTo} className="press relative inline-flex items-center gap-2.5 h-11 mt-4 pl-[18px] pr-1.5 rounded-full bg-white text-brand text-[14px] font-extrabold no-underline">
                    {cardCta}
                    <span className="w-8 h-8 rounded-full bg-brand text-white inline-flex items-center justify-center">{Ico.play()}</span>
                </Link>
            </section>

            <Link to="/events" className="press flex items-center gap-3 px-4 py-3.5 rounded-[20px] bg-ink dark:bg-night-2 text-white no-underline">
                <span className="w-[42px] h-[42px] rounded-[12px] bg-[#2C2742] inline-flex items-center justify-center shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full bg-[#F0533A] ${live && new Date(live.starts_at).getTime() <= now ? 'motion-safe:animate-pulse' : ''}`} />
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-bold truncate">
                        {live ? `${isToday(live.starts_at) ? 'Live class today' : `Live class ${formatEAT(live.starts_at, { hour: undefined, minute: undefined, month: undefined })}`} · ${timeEAT(live.starts_at)}` : 'Live classes · Wed and Fri'}
                    </span>
                    <span className="block text-[12px] text-[#CFC8DC] truncate">{live ? live.title : '2:00 pm EAT · times posted each week'}</span>
                </span>
                <span className="text-[13px] font-extrabold text-lime-200 shrink-0">{live ? until(live.starts_at, now) : 'See'}</span>
            </Link>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-night-2 rounded-[20px] p-3.5 flex items-center gap-2.5">
                    <Ring pct={fc.total ? fc.done / fc.total : 0} color="#5B2BC4" track="#EEE8FD" label={fc.done} />
                    <span className="text-[12px] font-semibold text-[#4A4560] dark:text-slate-300 leading-[1.3]">of {fc.total} items done</span>
                </div>
                <div className="bg-white dark:bg-night-2 rounded-[20px] p-3.5 flex items-center gap-2.5">
                    <Ring pct={streak / 7} color="#8DB31A" track="#EFF7D6" label={streak} />
                    <span className="text-[12px] font-semibold text-[#4A4560] dark:text-slate-300 leading-[1.3]">day learning streak</span>
                </div>
            </div>

            {!done && upNext.length > 0 && (
                <section aria-labelledby="phone-next">
                    <div className="flex justify-between items-baseline mb-2.5">
                        <h2 id="phone-next" className="m-0 text-[17px] font-extrabold tracking-[-0.01em]">Up next</h2>
                        <Link to={BASE} className="text-[13px] font-bold text-brand dark:text-violet-300 no-underline">See all</Link>
                    </div>
                    <div className="no-scrollbar flex gap-3 overflow-x-auto -mx-5 px-5 pb-1">
                        {upNext.map(it => {
                            const m = moduleOfItem(it.id);
                            return (
                                <Link key={it.id} to={`${BASE}/item/${it.id}`} className="press shrink-0 w-[220px] bg-white dark:bg-night-2 rounded-[20px] p-2 no-underline text-ink dark:text-white">
                                    {it.kind === 'video'
                                        ? <img src={`/thumb/${it.id}.jpg`} alt="" loading="lazy" className="w-full aspect-video object-cover rounded-[14px] block bg-brand-soft dark:bg-night-3" onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                                        : <span className={`w-full aspect-video rounded-[14px] flex items-center justify-center ${it.kind === 'quiz' ? 'bg-lime-100 text-[#3F4A1C]' : 'bg-brand-soft text-brand'} dark:bg-night-3 dark:text-violet-200`}>{it.kind === 'quiz' ? Ico.award(30) : Ico.book(30)}</span>}
                                    <p className="mt-2 mx-1 mb-0.5 text-[13px] font-bold leading-[1.3] line-clamp-1">{it.title}</p>
                                    <p className="m-0 mx-1 mb-1 text-[12px] text-[#6B6680] dark:text-slate-400">{m && m.number ? `Module ${m.number}` : kindLabel(it)} · {it.minutes} min</p>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}
        </PhonePage>
    );
};

export default PhoneHome;
