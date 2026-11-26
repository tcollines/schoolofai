import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, ChevronRight, ClipboardList, LayoutGrid, LogOut, ShieldCheck, Users } from 'lucide-react';
import type { FrontDeskData } from './frontDeskData';
import type { Prefill } from './FrontDeskWalkIn';
import FrontDeskVisitors from './FrontDeskVisitors';
import FrontDeskEnrolments from './FrontDeskEnrolments';
import FrontDeskCourses from './FrontDeskCourses';

type Sub = 'visitors' | 'enrolments' | 'courses';
const row = 'w-full min-h-[64px] px-4 rounded-[16px] bg-white dark:bg-night-2 border border-stone-200 dark:border-slate-700 text-left text-base font-bold inline-flex items-center gap-3 cursor-pointer text-inherit';

/** More: visitors who only asked, enrolments and money, the courses, and the account actions. */
const FrontDeskMore: React.FC<{
    data: FrontDeskData;
    onRegister: (p: Prefill) => void;
    onAdminDashboard?: () => void;
    onChooseDashboard?: () => void;
    onSignOut?: () => void;
}> = ({ data, onRegister, onAdminDashboard, onChooseDashboard, onSignOut }) => {
    const [params, setParams] = useSearchParams();
    const sub = params.get('sub') as Sub | null;
    const open = (s: Sub | null) => { const next = new URLSearchParams(params); if (s) next.set('sub', s); else next.delete('sub'); setParams(next, { replace: true }); window.scrollTo({ top: 0 }); };
    const titles: Record<Sub, string> = { visitors: 'Visitors', enrolments: 'Enrolments', courses: 'Courses' };

    if (sub === 'visitors' || sub === 'enrolments' || sub === 'courses') {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => open(null)} className="min-h-[48px] px-4 rounded-[12px] border border-stone-300 dark:border-slate-600 text-sm font-bold">Back</button>
                    <h2 className="m-0 text-xl font-extrabold">{titles[sub]}</h2>
                </div>
                {sub === 'visitors' && <FrontDeskVisitors data={data} onRegister={onRegister} />}
                {sub === 'enrolments' && <FrontDeskEnrolments data={data} />}
                {sub === 'courses' && <FrontDeskCourses data={data} />}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <button onClick={() => open('visitors')} className={row}><ClipboardList size={22} className="text-brand dark:text-violet-300" /><span className="flex-1">Visitors<span className="block text-sm font-normal text-stone-500 dark:text-slate-400">People who came to ask</span></span><ChevronRight size={18} /></button>
            <button onClick={() => open('enrolments')} className={row}><Users size={22} className="text-brand dark:text-violet-300" /><span className="flex-1">Enrolments<span className="block text-sm font-normal text-stone-500 dark:text-slate-400">Who studies what, and the money</span></span><ChevronRight size={18} /></button>
            <button onClick={() => open('courses')} className={row}><BookOpen size={22} className="text-brand dark:text-violet-300" /><span className="flex-1">Courses<span className="block text-sm font-normal text-stone-500 dark:text-slate-400">Lessons, exams and fees</span></span><ChevronRight size={18} /></button>
            {(onAdminDashboard || onChooseDashboard || onSignOut) && <div className="pt-2 space-y-3">
                {onAdminDashboard && <button onClick={onAdminDashboard} className={row}><ShieldCheck size={22} className="text-brand dark:text-violet-300" />Admin dashboard</button>}
                {onChooseDashboard && <button onClick={onChooseDashboard} className={row}><LayoutGrid size={22} className="text-brand dark:text-violet-300" />Choose dashboard</button>}
                {onSignOut && <button onClick={onSignOut} className={`${row} text-[#A3321F]`}><LogOut size={22} />Sign out</button>}
            </div>}
        </div>
    );
};

export default FrontDeskMore;
