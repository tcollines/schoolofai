import React from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FrontDeskData } from './frontDeskData';
import FrontDeskSheet from './FrontDeskSheet';
import FrontDeskExams from './FrontDeskExams';
import FrontDeskGraduation from './FrontDeskGraduation';

type Sub = 'attendance' | 'exams' | 'graduation';
const SUBS: { id: Sub; label: string }[] = [
    { id: 'attendance', label: 'Attendance' }, { id: 'exams', label: 'Exams' }, { id: 'graduation', label: 'Graduation' },
];

/** Everything for a class at HQ: who came, exam results, and who graduates. */
const FrontDeskClass: React.FC<{ data: FrontDeskData }> = ({ data }) => {
    const [params, setParams] = useSearchParams();
    const wanted = params.get('sub');
    const sub: Sub = SUBS.some(s => s.id === wanted) ? (wanted as Sub) : 'attendance';
    const setSub = (id: Sub) => { const next = new URLSearchParams(params); next.set('sub', id); setParams(next, { replace: true }); };
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Class">
                {SUBS.map(s => (
                    <button key={s.id} role="tab" aria-selected={sub === s.id} onClick={() => setSub(s.id)}
                        className={`min-h-[60px] px-2 rounded-[14px] border text-base font-extrabold ${sub === s.id ? 'bg-brand border-violet-600 text-white' : 'bg-white dark:bg-night-2 border-stone-200 dark:border-slate-700'}`}>{s.label}</button>
                ))}
            </div>
            {sub === 'attendance' && <FrontDeskSheet data={data} />}
            {sub === 'exams' && <FrontDeskExams data={data} />}
            {sub === 'graduation' && <FrontDeskGraduation data={data} />}
        </div>
    );
};

export default FrontDeskClass;
