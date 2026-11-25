import type React from 'react';
import { Home, UsersRound, GraduationCap, UserCog, LayoutGrid, BookOpen, Calendar, FileQuestion } from 'lucide-react';

/** One place that says how the admin console is organised. Every old page still exists; this only decides where it is reached from. */
export type NavIcon = React.ComponentType<{ size?: number | string; className?: string }>;

export interface PrimaryNavItem { id: string; label: string; icon: NavIcon; }

/** The five places an admin goes most (phone bottom bar and desktop sidebar). */
export const ADMIN_PRIMARY: PrimaryNavItem[] = [
    { id: 'today', label: 'Today', icon: Home },
    { id: 'people', label: 'People', icon: UsersRound },
    { id: 'learning', label: 'Learning', icon: GraduationCap },
    { id: 'team', label: 'Team', icon: UserCog },
    { id: 'more', label: 'More', icon: LayoutGrid },
];

export const INSTRUCTOR_PRIMARY: PrimaryNavItem[] = [
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'cohorts', label: 'Cohorts', icon: Calendar },
    { id: 'exams', label: 'Exams', icon: FileQuestion },
    { id: 'events', label: 'Events', icon: Calendar },
];

/** Which bottom-bar item a page belongs to, so the right one stays highlighted on every old page. */
const GROUP_OF: Record<string, string> = {
    today: 'today',
    dashboard: 'today',
    people: 'people',
    enrollments: 'people',
    registrations: 'people',
    learning: 'learning',
    'free-course': 'learning',
    'live-classes': 'learning',
    courses: 'learning',
    cohorts: 'learning',
    exams: 'learning',
    events: 'learning',
    instructors: 'learning',
    team: 'team',
    agents: 'team',
    staff: 'team',
};

export const groupOf = (tab: string): string => GROUP_OF[tab] || 'more';

/** Plain titles for the top bar on a phone. */
export const PAGE_TITLES: Record<string, string> = {
    today: 'Today', week: 'My week', more: 'More', dashboard: 'Full dashboard',
    people: 'People', enrollments: 'Enrollments', registrations: 'Registrations',
    learning: 'Learning', 'free-course': 'Free course', 'live-classes': 'Live classes',
    courses: 'Course setup', cohorts: 'Cohorts', exams: 'Exam setup', events: 'Ongoing events', instructors: 'Instructors',
    team: 'Team', agents: 'Agent monitoring', staff: 'Staff and links',
    analytics: 'Traffic and clicks', partners: 'Partners', mails: 'Mails', wallet: 'Wallet and ledger',
};

/** Items that sit on the More page and in the desktop sidebar's "More" section. */
export interface MoreItem { id: string; label: string; hint: string; icon: NavIcon; }
