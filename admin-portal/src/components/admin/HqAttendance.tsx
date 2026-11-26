import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { FrontDeskData, useDeskStats, useFrontDeskData } from './frontDeskData';
import { FrontDeskTiles } from './FrontDeskToday';
import FrontDeskRegister from './FrontDeskRegister';
import FrontDeskClass from './FrontDeskClass';
import FrontDeskCalls from './FrontDeskCalls';
import FrontDeskMore from './FrontDeskMore';
import type { Prefill } from './FrontDeskWalkIn';

export type { FrontDeskData };

type Mode = 'register' | 'class' | 'calls' | 'more';
const MODES: { id: Mode; label: string; help: string }[] = [
    { id: 'register', label: 'Register', help: 'Study, ask, paper forms' },
    { id: 'class', label: 'Class', help: 'Attendance, exams, graduation' },
    { id: 'calls', label: 'Calls', help: 'Follow people up' },
    { id: 'more', label: 'More', help: 'Visitors, enrolments, courses' },
];
/** Old mode names still work, so earlier links keep opening the right screen. */
const ALIASES: Record<string, { mode: Mode; sub?: string }> = { walkin: { mode: 'register' }, paper: { mode: 'register', sub: 'paper' }, attendance: { mode: 'class' } };

/** The Front desk tab of the Learning hub. The Front desk dashboard (/desk) uses the same screens and the same data. */
const HqAttendance: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const raw = params.get('mode') || '';
    const alias = ALIASES[raw];
    const mode: Mode = alias ? alias.mode : MODES.some(m => m.id === raw) ? (raw as Mode) : 'register';
    const setMode = (id: Mode) => { const next = new URLSearchParams(params); next.set('mode', id); next.delete('sub'); setParams(next, { replace: true }); };
    const [prefill, setPrefill] = useState<Prefill | null>(null);

    const data = useFrontDeskData();
    const stats = useDeskStats(data);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="m-0 text-2xl font-extrabold">Front desk</h1>
                    <p className="m-0 mt-1 text-sm text-stone-500 dark:text-slate-400">Register people, run the class, follow people up, and keep the courses.</p>
                </div>
                <button onClick={() => void data.reload()} aria-label="Refresh" className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-[12px] border border-stone-200 dark:border-slate-700"><RefreshCw size={16} className={data.loading ? 'animate-spin' : ''} /></button>
            </div>

            <FrontDeskTiles stats={stats} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="tablist" aria-label="Front desk">
                {MODES.map(m => (
                    <button key={m.id} role="tab" aria-selected={mode === m.id} onClick={() => setMode(m.id)}
                        className={`min-h-[64px] px-2 rounded-[14px] border text-center ${mode === m.id ? 'bg-brand border-violet-600 text-white' : 'bg-white dark:bg-night-2 border-stone-200 dark:border-slate-700'}`}>
                        <span className="block text-base font-extrabold">{m.label}</span>
                        <span className={`block text-xs ${mode === m.id ? 'opacity-90' : 'text-stone-500 dark:text-slate-400'}`}>{m.help}</span>
                    </button>
                ))}
            </div>

            {data.notice && <p role="status" className="m-0 text-sm text-amber-700 dark:text-amber-400">{data.notice}</p>}
            {data.loading && data.rows.length === 0 && <div className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={18} /> Loading...</div>}

            {mode === 'register' && <FrontDeskRegister data={data} prefill={prefill} onClass={() => setMode('class')} defaultSub={alias?.sub as 'paper' | undefined} />}
            {mode === 'class' && <FrontDeskClass data={data} />}
            {mode === 'calls' && <FrontDeskCalls data={data} />}
            {mode === 'more' && <FrontDeskMore data={data} onRegister={p => { setPrefill(p); setMode('register'); }} />}
        </div>
    );
};

export default HqAttendance;
