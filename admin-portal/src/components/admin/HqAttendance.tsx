import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { FrontDeskData, useDeskStats, useFrontDeskData } from './frontDeskData';
import { FrontDeskTiles } from './FrontDeskToday';
import FrontDeskAttendance from './FrontDeskAttendance';
import FrontDeskWalkIn from './FrontDeskWalkIn';
import FrontDeskCalls from './FrontDeskCalls';

export type { FrontDeskData };

type Mode = 'walkin' | 'calls' | 'attendance';
const MODES: { id: Mode; label: string; help: string }[] = [
    { id: 'walkin', label: 'Walk-in', help: 'Someone came to HQ' },
    { id: 'calls', label: 'Calls', help: 'Follow people up' },
    { id: 'attendance', label: 'Attendance', help: 'Tick who came' },
];

/** The Front desk tab of the Learning hub: register walk-ins, log follow-up calls, and mark who came to the physical lessons at HQ.
 *  The Front desk dashboard (/desk) uses the same pieces and the same data. */
const HqAttendance: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const wanted = params.get('mode');
    const mode: Mode = MODES.some(m => m.id === wanted) ? (wanted as Mode) : 'walkin';
    const setMode = (id: Mode) => { const next = new URLSearchParams(params); next.set('mode', id); setParams(next, { replace: true }); };

    const data = useFrontDeskData();
    const stats = useDeskStats(data);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="m-0 text-2xl font-extrabold">Front desk</h1>
                    <p className="m-0 mt-1 text-sm text-stone-500 dark:text-slate-400">Register walk-ins, call people to follow them up, and record who comes to the lessons at HQ.</p>
                </div>
                <button onClick={() => void data.reload()} aria-label="Refresh" className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-[12px] border border-stone-200 dark:border-slate-700"><RefreshCw size={16} className={data.loading ? 'animate-spin' : ''} /></button>
            </div>

            <FrontDeskTiles stats={stats} />

            <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Front desk">
                {MODES.map(m => (
                    <button
                        key={m.id}
                        role="tab"
                        aria-selected={mode === m.id}
                        onClick={() => setMode(m.id)}
                        className={`min-h-[64px] px-2 rounded-[14px] border text-center ${mode === m.id ? 'bg-brand border-violet-600 text-white' : 'bg-white dark:bg-night-2 border-stone-200 dark:border-slate-700'}`}
                    >
                        <span className="block text-base font-extrabold">{m.label}</span>
                        <span className={`block text-xs ${mode === m.id ? 'opacity-90' : 'text-stone-500 dark:text-slate-400'}`}>{m.help}</span>
                    </button>
                ))}
            </div>

            {data.notice && <p role="status" className="m-0 text-sm text-amber-700 dark:text-amber-400">{data.notice}</p>}
            {data.loading && data.rows.length === 0 && <div className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={18} /> Loading...</div>}

            {mode === 'walkin' && <FrontDeskWalkIn data={data} />}
            {mode === 'calls' && <FrontDeskCalls data={data} />}
            {mode === 'attendance' && <FrontDeskAttendance data={data} />}
        </div>
    );
};

export default HqAttendance;
