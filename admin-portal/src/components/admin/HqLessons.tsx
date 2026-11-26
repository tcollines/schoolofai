import React from 'react';
import { LESSONS } from '../../lib/physicalAttendance';

/** Three big chips (Lesson 1, 2, 3) showing and toggling which physical lessons at HQ a person attended. */
const HqLessons: React.FC<{
    lessons: number[];
    onToggle: (lesson: number, attended: boolean) => void;
    /** Show the label above the chips, used for people who still need a call. */
    prominent?: boolean;
    disabled?: boolean;
}> = ({ lessons, onToggle, prominent, disabled }) => (
    <div className={prominent ? 'rounded-[14px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-2.5' : ''}>
        <p className={`m-0 mb-1.5 font-bold ${prominent ? 'text-sm text-amber-900 dark:text-amber-200' : 'text-xs text-stone-500 dark:text-slate-400'}`}>
            Lessons at HQ{lessons.length > 0 ? `: ${lessons.length} of 3` : ''}
        </p>
        <div className="flex gap-2" role="group" aria-label="Lessons attended at HQ">
            {LESSONS.map(l => {
                const on = lessons.includes(l.no);
                return (
                    <button
                        key={l.no}
                        type="button"
                        disabled={disabled}
                        aria-pressed={on}
                        aria-label={`Lesson ${l.no}, ${l.modules}: ${on ? 'attended' : 'not attended'}`}
                        title={`Lesson ${l.no}: ${l.modules}`}
                        onClick={() => onToggle(l.no, !on)}
                        className={`min-w-[56px] min-h-[44px] px-3 rounded-[12px] border text-sm font-bold ${on ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white dark:bg-night-2 border-stone-300 dark:border-slate-600 text-stone-700 dark:text-slate-200'} disabled:opacity-50`}
                    >
                        {on ? '✓ ' : ''}{l.no}
                    </button>
                );
            })}
        </div>
    </div>
);

export default HqLessons;
