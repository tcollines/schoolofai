import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader2, MessageCircle, Phone, PhoneCall, UserPlus } from 'lucide-react';
import { DeskStats } from './frontDeskData';

const card = 'bg-white dark:bg-night-2 rounded-[22px]';
const wa = (p: string) => (p.startsWith('0') ? '256' + p.slice(1) : p.replace(/\D/g, ''));

/** The four numbers for today. They come from the shared people model, so they equal the admin numbers. */
export const FrontDeskTiles: React.FC<{ stats: DeskStats }> = ({ stats }) => {
    const tiles = [
        { label: 'Called today', value: stats.calledToday, note: `${stats.reachedToday} reached` },
        { label: 'Call backs due', value: stats.callBacksDue, note: 'follow-up date has come' },
        { label: 'Walk-ins today', value: stats.walkInsToday, note: 'registered at HQ' },
        { label: 'At HQ today', value: stats.atHqToday, note: 'marked present' },
    ];
    return (
        <div className="grid grid-cols-2 gap-3">
            {tiles.map(t => (
                <div key={t.label} className={`${card} p-4 min-h-[96px] border border-stone-100 dark:border-slate-800`}>
                    <p className="m-0 text-sm font-bold text-stone-500 dark:text-slate-400">{t.label}</p>
                    <p className="m-0 mt-1 text-4xl font-extrabold tabular-nums">{t.value}</p>
                    <p className="m-0 mt-0.5 text-xs text-stone-500 dark:text-slate-400">{t.note}</p>
                </div>
            ))}
        </div>
    );
};

/** The Today view of the Front desk: numbers, two big actions, who needs a call next, and who converted this week. */
const FrontDeskToday: React.FC<{
    stats: DeskStats;
    loading: boolean;
    onWalkIn: () => void;
    onCalls: () => void;
    /** Opens the screen for entering registrations taken on paper forms. */
    onPaperForms: () => void;
    /** Opens the Calls tab with this person's log-call panel ready. */
    onLogCall: (key: string, name: string) => void;
}> = ({ stats, loading, onWalkIn, onCalls, onPaperForms, onLogCall }) => (
    <div className="space-y-4">
        <FrontDeskTiles stats={stats} />

        <div className="grid grid-cols-1 gap-3">
            <button onClick={onWalkIn} className="min-h-[64px] rounded-[16px] bg-brand text-white text-lg font-extrabold inline-flex items-center justify-center gap-2"><UserPlus size={22} /> Register a walk-in</button>
            <button onClick={onPaperForms} className="min-h-[64px] rounded-[16px] bg-white dark:bg-night-2 border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 text-lg font-extrabold inline-flex items-center justify-center gap-2"><FileText size={22} /> Enter paper forms</button>
            <button onClick={onCalls} className="min-h-[64px] rounded-[16px] bg-white dark:bg-night-2 border-2 border-violet-600 text-violet-700 dark:text-violet-300 text-lg font-extrabold inline-flex items-center justify-center gap-2"><PhoneCall size={22} /> Make calls</button>
        </div>

        <section className={`${card} p-4`}>
            <div className="flex items-baseline justify-between gap-2">
                <h2 className="m-0 text-lg font-extrabold">Who needs a call</h2>
                <p className="m-0 text-sm text-stone-500 dark:text-slate-400">{stats.metrics.notCalledYet} not called yet</p>
            </div>
            <p className="m-0 mt-0.5 mb-2 text-sm text-stone-500 dark:text-slate-400">People with no email who have waited longest.</p>
            {loading && stats.needsCallPreview.length === 0 && <p className="m-0 py-3 flex items-center gap-2 text-stone-500"><Loader2 size={16} className="animate-spin" /> Loading...</p>}
            {!loading && stats.needsCallPreview.length === 0 && <p className="m-0 py-3 text-base text-stone-600 dark:text-slate-300">Everyone with no email has been called. Well done.</p>}
            <ul className="m-0 p-0 list-none">
                {stats.needsCallPreview.map(p => (
                    <li key={p.key} className="py-3 border-t border-stone-100 dark:border-slate-800 first:border-t-0">
                        <p className="m-0 text-base font-bold break-words">{p.name || '(no name)'}</p>
                        {p.location && <p className="m-0 text-sm text-stone-500 dark:text-slate-400">{p.location}</p>}
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {p.phone
                                ? <a href={`tel:+${wa(p.phone)}`} className="min-h-[52px] rounded-[12px] bg-emerald-600 text-white text-base font-bold inline-flex items-center justify-center gap-1.5 no-underline"><Phone size={16} /> Call</a>
                                : <span className="min-h-[52px] rounded-[12px] bg-stone-100 dark:bg-slate-800 text-stone-500 text-sm inline-flex items-center justify-center">No phone</span>}
                            {p.phone
                                ? <a href={`https://wa.me/${wa(p.phone)}`} target="_blank" rel="noreferrer" className="min-h-[52px] rounded-[12px] border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-base font-bold inline-flex items-center justify-center gap-1.5 no-underline"><MessageCircle size={16} /> Chat</a>
                                : <span />}
                            <button onClick={() => onLogCall(p.key, p.name)} className="min-h-[52px] rounded-[12px] bg-brand text-white text-base font-bold">Log call</button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>

        <section className={`${card} p-4 flex items-center justify-between gap-3`}>
            <div>
                <h2 className="m-0 text-lg font-extrabold">Converted this week</h2>
                <p className="m-0 mt-0.5 text-sm text-stone-500 dark:text-slate-400">Called or registered at HQ in the last 7 days, and now converted, online, or at HQ.</p>
            </div>
            <p className="m-0 text-4xl font-extrabold text-emerald-600 tabular-nums">{stats.convertedThisWeek}</p>
        </section>

        <Link to="/people" className="min-h-[52px] rounded-[14px] bg-transparent text-violet-700 dark:text-violet-300 text-base font-bold inline-flex items-center justify-center no-underline">See everyone</Link>
    </div>
);

export default FrontDeskToday;
