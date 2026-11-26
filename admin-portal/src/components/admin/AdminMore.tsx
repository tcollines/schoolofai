import React from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart3, BookOpen, Calendar, CalendarDays, ClipboardList, ConciergeBell, FileQuestion, Globe, Handshake, Home, LayoutGrid, LogOut, Mail, UserCheck, UserCog, Wallet
} from 'lucide-react';
import type { MoreItem } from './adminNav';

const ITEMS: (MoreItem & { to: string })[] = [
    { id: 'desk', to: '/desk', label: 'Front desk', hint: 'Walk-ins, calls and who came to HQ', icon: ConciergeBell },
    { id: 'week', to: '/week', label: 'My week', hint: 'Your own timetable', icon: CalendarDays },
    { id: 'dashboard', to: '/dashboard', label: 'Full dashboard', hint: 'All the numbers in one page', icon: Home },
    { id: 'analytics', to: '/analytics', label: 'Traffic and clicks', hint: 'Who visits and clicks', icon: BarChart3 },
    { id: 'partners', to: '/partners', label: 'Partners', hint: 'Partner organisations', icon: Handshake },
    { id: 'mails', to: '/mails', label: 'Mails', hint: 'Emails we send', icon: Mail },
    { id: 'wallet', to: '/wallet', label: 'Wallet and ledger', hint: 'Money in and out', icon: Wallet },
    { id: 'instructors', to: '/instructors', label: 'Instructors', hint: 'Teachers and trainers', icon: UserCheck },
    { id: 'registrations', to: '/registrations', label: 'Outreach registrations', hint: 'Sign-ups from outreach', icon: ClipboardList },
    { id: 'staff', to: '/staff', label: 'Staff and links', hint: 'Staff, agents and their links', icon: UserCog },
    { id: 'courses', to: '/courses', label: 'Course setup', hint: 'Build and edit courses', icon: BookOpen },
    { id: 'cohorts', to: '/cohorts', label: 'Cohorts', hint: 'Class groups and dates', icon: Calendar },
    { id: 'exams', to: '/exams', label: 'Exam setup', hint: 'Exams and questions', icon: FileQuestion },
    { id: 'events', to: '/events', label: 'Ongoing events', hint: 'Events people can join', icon: Calendar },
];

/** Everything that is not in the four main places. One big card per page, plus the account actions. */
const AdminMore: React.FC<{ onSwitchDashboard: () => void; onStudentSite: () => void; onSignOut: () => void }> = ({ onSwitchDashboard, onStudentSite, onSignOut }) => (
    <div className="flex flex-col gap-5 max-w-[900px]">
        <div>
            <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em]">More</h1>
            <p className="m-0 mt-1 text-[14px] text-[#6B6680] dark:text-slate-400">Everything else, in one place.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ITEMS.map(it => (
                <Link key={it.id} to={it.to} className="press no-underline text-inherit block bg-white dark:bg-night-2 rounded-[22px] p-4 min-h-[112px]">
                    <span className="w-10 h-10 rounded-[12px] bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 inline-flex items-center justify-center"><it.icon size={20} /></span>
                    <p className="m-0 mt-2 text-[15px] font-extrabold leading-tight">{it.label}</p>
                    <p className="m-0 mt-0.5 text-[13px] text-[#6B6680] dark:text-slate-400 leading-snug">{it.hint}</p>
                </Link>
            ))}
        </div>

        <section className="bg-white dark:bg-night-2 rounded-[22px] p-4">
            <h2 className="m-0 mb-2 text-[17px] font-extrabold">Your account</h2>
            <div className="flex flex-col">
                <button onClick={onSwitchDashboard} className="press min-h-[52px] flex items-center gap-3 text-left text-[15px] font-bold bg-transparent border-0 cursor-pointer text-inherit"><LayoutGrid size={19} className="text-brand dark:text-violet-300" />Switch dashboard</button>
                <button onClick={onStudentSite} className="press min-h-[52px] flex items-center gap-3 text-left text-[15px] font-bold bg-transparent border-0 cursor-pointer text-inherit border-t border-[#F4F2F9] dark:border-night-3"><Globe size={19} className="text-brand dark:text-violet-300" />Student site</button>
                <button onClick={onSignOut} className="press min-h-[52px] flex items-center gap-3 text-left text-[15px] font-bold bg-transparent border-0 cursor-pointer text-[#A3321F] border-t border-[#F4F2F9] dark:border-night-3"><LogOut size={19} />Sign out</button>
            </div>
        </section>
    </div>
);

export default AdminMore;
