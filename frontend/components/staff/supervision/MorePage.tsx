import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, LayoutGrid, LogOut, RefreshCw } from 'lucide-react';
import { CARD, MUTED, ThemeButton } from '../../learn/learnUi';

const ROW = 'flex items-center gap-3 w-full min-h-[56px] px-4 py-3 text-left text-[15px] font-semibold hover:bg-stone-50 dark:hover:bg-slate-800/50';

/** More: the less-used things, as big tappable rows. */
const MorePage: React.FC<{
    canSwitch: boolean;
    loading: boolean;
    onRefresh: () => void;
    onSignOut: () => void;
}> = ({ canSwitch, loading, onRefresh, onSignOut }) => (
    <div className="space-y-4 max-w-xl">
        <h1 className="font-serif text-2xl font-bold">More</h1>
        <div className={`${CARD} rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-slate-800`}>
            <Link to="/supervision/week" className={ROW}>
                <CalendarDays size={22} className="text-indigo-600 shrink-0" />
                <span className="flex-1">My week<span className={`block text-xs font-normal ${MUTED}`}>Your personal timetable</span></span>
                <ChevronRight size={18} className="text-stone-400" />
            </Link>
            {canSwitch && (
                <Link to="/portal" className={ROW}>
                    <LayoutGrid size={22} className="text-violet-600 shrink-0" />
                    <span className="flex-1">Switch dashboard<span className={`block text-xs font-normal ${MUTED}`}>Go to another role</span></span>
                    <ChevronRight size={18} className="text-stone-400" />
                </Link>
            )}
            <button type="button" onClick={onRefresh} className={ROW}>
                <RefreshCw size={22} className={`text-emerald-600 shrink-0 ${loading ? 'animate-spin' : ''}`} />
                <span className="flex-1">Refresh data<span className={`block text-xs font-normal ${MUTED}`}>Load the latest numbers</span></span>
            </button>
            <div className={ROW}>
                <span className="flex-1">Light or dark mode</span>
                <ThemeButton />
            </div>
            <button type="button" onClick={onSignOut} className={`${ROW} text-red-700 dark:text-red-400`}>
                <LogOut size={22} className="shrink-0" />
                <span className="flex-1">Sign out</span>
            </button>
        </div>
    </div>
);

export default MorePage;
