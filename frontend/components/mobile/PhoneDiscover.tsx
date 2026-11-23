import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFreeCourse } from '../../src/hooks/useFreeCourse';
import { COURSE } from '../../src/content/aiFundamentals';
import { Course } from '../../types';
import { BASE, Ico, PageTitle, PhonePage } from './phoneKit';

/** Phone · Discover (canvas board MobileDiscover). */

const CHIPS = ['All', 'Free', 'Pro', 'Live cohort', 'Self-paced'] as const;
type Chip = typeof CHIPS[number];

const isPaid = (c: Course) => c.accessTier === 'PAID' || (c.price || 0) > 0;
const isCohort = (c: Course) => !!(c.startDate || (c.lessonDays && c.lessonDays.length));

const PhoneDiscover: React.FC<{ user: any; courses: Course[] }> = ({ user, courses }) => {
    const uid = user?.id && user.id !== 'guest' ? user.id : undefined;
    const fc = useFreeCourse(uid);
    const [params] = useSearchParams();
    const [q, setQ] = useState(params.get('q') || '');
    const [chip, setChip] = useState<Chip>('All');

    const term = q.trim().toLowerCase();
    const freeMatches = (!term || `${COURSE.title} ${COURSE.tagline} ai`.toLowerCase().includes(term)) && (chip === 'All' || chip === 'Free' || chip === 'Self-paced');

    const list = useMemo(() => courses
        .filter(c => !c.isDraft && c.isVerified !== false)
        .filter(c => !/ai fundamentals/i.test(c.title))
        .filter(c => !term || `${c.title} ${c.category} ${c.description || ''}`.toLowerCase().includes(term))
        .filter(c => chip === 'All' || (chip === 'Free' && !isPaid(c)) || (chip === 'Pro' && isPaid(c)) || (chip === 'Live cohort' && isCohort(c)) || (chip === 'Self-paced' && !isCohort(c))),
        [courses, term, chip]);

    return (
        <PhonePage>
            <PageTitle>Discover</PageTitle>

            <label className="flex items-center gap-2.5 h-[46px] px-3.5 rounded-[14px] bg-white dark:bg-night-2 text-[#6B6680] dark:text-slate-400">
                {Ico.search()}
                <input type="search" aria-label="Search courses" placeholder="Search courses or skills" value={q} onChange={e => setQ(e.target.value)}
                    className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[15px] text-ink dark:text-white placeholder:text-[#8A85A0]" />
            </label>

            <div role="group" aria-label="Filter courses" className="no-scrollbar flex gap-2 overflow-x-auto -mx-5 px-5 pb-0.5">
                {CHIPS.map(c => (
                    <button key={c} type="button" aria-pressed={chip === c} onClick={() => setChip(c)}
                        className={`press shrink-0 h-[38px] px-4 rounded-full border-0 text-[13px] cursor-pointer ${chip === c ? 'bg-ink dark:bg-white text-white dark:text-ink font-extrabold' : 'bg-white dark:bg-night-2 text-ink dark:text-white font-semibold'}`}>{c}</button>
                ))}
            </div>

            {freeMatches && (
                <Link to={BASE} className="press relative overflow-hidden block rounded-[26px] bg-brand text-white no-underline">
                    <img src="/thumb/m1-l1.jpg" alt="" className="w-full aspect-video object-cover block bg-brand-mid" onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                    <div className="px-[18px] pt-4 pb-[18px]">
                        <div className="flex gap-1.5">
                            <span className="px-2 py-[3px] rounded-[6px] bg-lime-200 text-ink text-[11px] font-extrabold uppercase">Free</span>
                            <span className="px-2 py-[3px] rounded-[6px] bg-brand-light text-white text-[11px] font-bold uppercase">Certificate</span>
                        </div>
                        <p className="mt-2.5 mb-0 text-[19px] leading-[1.25] font-extrabold tracking-[-0.01em]">{COURSE.title}</p>
                        {fc.enrolled ? (
                            <div className="flex items-center gap-2.5 mt-3">
                                <div className="flex-1 h-1.5 rounded-full bg-brand-light overflow-hidden"><div className="h-full bg-lime-200" style={{ width: `${fc.pct}%` }} /></div>
                                <span className="text-[12px] font-bold">Enrolled · {fc.pct}%</span>
                            </div>
                        ) : (
                            <p className="mt-2 mb-0 text-[13px] text-[#E6DEFF]">{COURSE.hours} · sponsored by {COURSE.sponsor}</p>
                        )}
                    </div>
                </Link>
            )}

            <section aria-labelledby="phone-more">
                <h2 id="phone-more" className="m-0 mb-2.5 text-[17px] font-extrabold tracking-[-0.01em]">{term || chip !== 'All' ? `${list.length} course${list.length === 1 ? '' : 's'}` : 'More courses'}</h2>
                <div className="flex flex-col gap-2.5">
                    {list.length === 0 && (
                        <div className="p-5 rounded-[20px] bg-white dark:bg-night-2 text-center text-[14px] text-[#6B6680] dark:text-slate-400">No courses match. Try another word or filter.</div>
                    )}
                    {list.map(c => (
                        <Link key={c.id} to={`/discover/${c.id}`} className="press flex items-center gap-3 p-2.5 rounded-[20px] bg-white dark:bg-night-2 text-ink dark:text-white no-underline">
                            <span className="shrink-0 w-[76px] h-[76px] rounded-[16px] overflow-hidden bg-ink text-lime-200 inline-flex items-center justify-center">
                                {c.image ? <img src={c.image} alt="" loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: `${c.imagePositionX ?? 50}% ${c.imagePositionY ?? 50}%` }} /> : Ico.code()}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className={`inline-block px-[7px] py-0.5 rounded-[6px] text-[10px] font-extrabold uppercase ${isPaid(c) ? 'bg-brand-soft text-brand' : 'bg-lime-100 text-[#3F4A1C]'}`}>
                                    {isPaid(c) ? 'Pro' : 'Free'}{isCohort(c) ? ' · live cohort' : ''}
                                </span>
                                <span className="block mt-[5px] text-[15px] font-extrabold leading-[1.25] line-clamp-2">{c.title}</span>
                                <span className="block mt-0.5 text-[12px] text-[#6B6680] dark:text-slate-400 truncate">{c.category}{c.duration ? ` · ${c.duration}` : ''}</span>
                            </span>
                            <span className="text-right shrink-0">
                                <span className="block text-[15px] font-extrabold">{isPaid(c) && c.price ? `$${c.price}` : 'Free'}</span>
                                {isPaid(c) && <span className="block text-[11px] text-[#6B6680] dark:text-slate-400">or with Pro</span>}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="rounded-[22px] bg-brand-soft dark:bg-night-2 p-4 flex items-center gap-3">
                <span className="shrink-0 w-11 h-11 rounded-[14px] bg-brand text-white inline-flex items-center justify-center">{Ico.users()}</span>
                <span className="flex-1">
                    <span className="block text-[14px] font-extrabold text-brand-ink dark:text-white">Training a team?</span>
                    <span className="block text-[12px] text-[#4A3B7A] dark:text-slate-400">Corporate seats for your staff</span>
                </span>
                <Link to="/plans" className="text-[13px] font-extrabold text-brand dark:text-violet-300 no-underline">See plans</Link>
            </section>
        </PhonePage>
    );
};

export default PhoneDiscover;
