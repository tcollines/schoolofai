import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Download, Handshake, UserCheck, UserPlus, Users } from 'lucide-react';
import { CARD, MUTED } from '../../learn/learnUi';
import { downloadCsv, formatEatTime, formatSummaryDate } from './shared';
import { useSupervision } from './SupervisionContext';

/** Page 1: the four headline numbers and the daily registration summary. */
const OverviewPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        agents, totals, convPct, summaryTotals, summaryDate, setSummaryDate, summaryQuickRange, setSummaryQuickRange,
        summaryOfficer, setSummaryOfficer, summaryOfficers, todayYmd, filteredRegSummary, maxSummaryCount,
        openOfficerId, openOfficerRoster,
    } = useSupervision();

    return (
        <div className="space-y-6">
        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`${CARD} rounded-2xl p-4`}>
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${MUTED}`}>Active agents</span>
                    <Handshake size={16} className="text-indigo-600" />
                </div>
                <p className="text-4xl font-extrabold mt-2">{totals.active}</p>
                <p className={`text-xs mt-1 ${MUTED}`}>{totals.fieldOnly} field-only · {agents.length} total</p>
            </div>

            <div className={`${CARD} rounded-2xl p-4`}>
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${MUTED}`}>Total Registered</span>
                    <Users size={16} className="text-violet-600" />
                </div>
                <p className="text-4xl font-extrabold mt-2">{totals.registered.toLocaleString()}</p>
                <p className={`text-xs mt-1 ${MUTED}`}>{totals.today} today · {totals.week} in 7 days</p>
            </div>

            <div className={`${CARD} rounded-2xl p-4`}>
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${MUTED}`}>Accounts Opened</span>
                    <UserCheck size={16} className="text-emerald-600" />
                </div>
                <p className="text-4xl font-extrabold mt-2">{totals.accounts}</p>
                <p className={`text-xs mt-1 ${MUTED}`}>{convPct}% converted · {totals.waiting} waiting</p>
            </div>

            <div className={`${CARD} rounded-2xl p-4 flex flex-col justify-between`}>
                <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${MUTED}`}>Quick Action</p>
                    <p className="text-sm font-bold mt-1.5">Onboard a new agent</p>
                </div>
                <button
                    onClick={() => navigate('/supervision/create-agent')}
                    className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <UserPlus size={16} /> Add agent
                </button>
            </div>
        </div>

        <section className={`${CARD} rounded-2xl overflow-hidden`}>
            <div className="px-5 py-4 border-b border-stone-100 dark:border-slate-800 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-base flex items-center gap-2">
                            <CalendarDays size={18} className="text-indigo-600" />
                            Daily summary
                        </h2>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                            {summaryTotals.total.toLocaleString()} {summaryTotals.total === 1 ? 'person' : 'people'}
                        </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${MUTED}`}>
                        Daily log by date and field officer — captures all field-only &amp; student-agent registrations.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg border border-stone-300 dark:border-slate-700 overflow-hidden text-xs font-semibold">
                        {([['all', 'All'], ['today', 'Today'], ['7d', '7 days']] as const).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => { setSummaryDate(''); setSummaryQuickRange(val); }}
                                className={`px-3 min-h-[44px] ${!summaryDate && summaryQuickRange === val ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <input
                        type="date"
                        value={summaryDate}
                        onChange={e => setSummaryDate(e.target.value)}
                        aria-label="Filter by date"
                        className="rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                    />
                    <select
                        value={summaryOfficer}
                        onChange={e => setSummaryOfficer(e.target.value)}
                        aria-label="Filter by field officer"
                        className="rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold"
                    >
                        <option value="all">All Field Officers</option>
                        {summaryOfficers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                    <button
                        onClick={() => downloadCsv(
                            `welile-supervision-summary-${todayYmd}.csv`,
                            ['Date', 'Field Officer', 'Type', 'People Registered', 'Accounts Opened', 'Waiting', 'Conversion %', 'Locations', 'Field Window (EAT)'],
                            filteredRegSummary.map(r => [
                                r.reg_date, r.field_officer, r.agent_type === 'field_only' ? 'Field-Only' : 'Student Agent',
                                r.total_registered, r.accounts_opened, r.waiting_signup, `${r.conversion_pct}%`,
                                (r.top_locations || []).map(l => `${l.location} (${l.count})`).join('; '),
                                `${formatEatTime(r.first_reg_at)} - ${formatEatTime(r.last_reg_at)}`,
                            ])
                        )}
                        disabled={filteredRegSummary.length === 0}
                        className="inline-flex items-center gap-1 px-3 min-h-[44px] rounded-lg text-sm font-semibold border border-stone-300 dark:border-slate-700 disabled:opacity-50"
                    >
                        <Download size={13} /> CSV
                    </button>
                </div>
            </div>

            {filteredRegSummary.length === 0 ? (
                <p className={`p-6 text-sm text-center ${MUTED}`}>No registrations recorded for this selection.</p>
            ) : (
                <>
                <div className="md:hidden divide-y divide-stone-100 dark:divide-slate-800">
                    {filteredRegSummary.map(row => {
                        const isToday = row.reg_date === todayYmd;
                        return (
                            <button
                                key={`${row.reg_date}-${row.staff_id}`}
                                type="button"
                                onClick={() => { if (openOfficerId !== row.staff_id) void openOfficerRoster(row.staff_id); navigate('/supervision/officers'); }}
                                className="block w-full text-left px-4 py-3.5 min-h-[44px] space-y-1.5"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-semibold text-[15px]">{row.field_officer}</p>
                                    <span className="text-xl font-extrabold shrink-0">{row.total_registered} <span className={`text-sm font-normal ${MUTED}`}>{row.total_registered === 1 ? 'person' : 'people'}</span></span>
                                </div>
                                <p className={`text-sm ${MUTED}`}>
                                    {formatSummaryDate(row.reg_date)}
                                    {isToday && <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Today</span>}
                                    {' · '}{row.agent_type === 'field_only' ? 'Field-Only Agent' : (row.role || 'Student Agent')}{row.staff_code ? ` · ${row.staff_code}` : ''}
                                </p>
                                <p className="text-xs">
                                    <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">{row.accounts_opened} opened</span>{' '}
                                    <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">{row.waiting_signup} waiting</span>
                                </p>
                                {(row.top_locations || []).length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {(row.top_locations || []).map(loc => (
                                            <span key={loc.location} className="px-2 py-0.5 rounded text-xs bg-stone-100 dark:bg-slate-800">{loc.location} <b>{loc.count}</b></span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs font-mono text-stone-500">
                                    {formatEatTime(row.first_reg_at) === formatEatTime(row.last_reg_at) ? `${formatEatTime(row.first_reg_at)} EAT` : `${formatEatTime(row.first_reg_at)} – ${formatEatTime(row.last_reg_at)} EAT`}
                                </p>
                            </button>
                        );
                    })}
                    <p className="px-4 py-3 text-sm font-bold bg-stone-50 dark:bg-slate-800/60">
                        Total: {summaryTotals.total.toLocaleString()} people · {summaryTotals.opened} opened · {summaryTotals.waiting} waiting
                    </p>
                </div>
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[740px]">
                        <thead>
                            <tr className="text-left text-xs uppercase text-stone-500 dark:text-slate-400 bg-stone-50 dark:bg-slate-800/40">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-3">Field Officer</th>
                                <th className="py-3 px-3">People Registered</th>
                                <th className="py-3 px-3">Account Status</th>
                                <th className="py-3 px-3 hidden md:table-cell">Locations</th>
                                <th className="py-3 px-4 text-right hidden lg:table-cell">Field Window</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                            {filteredRegSummary.map(row => {
                                const isToday = row.reg_date === todayYmd;
                                const firstT = formatEatTime(row.first_reg_at);
                                const lastT = formatEatTime(row.last_reg_at);
                                const barPct = Math.max(8, Math.round((row.total_registered / maxSummaryCount) * 100));
                                return (
                                    <tr
                                        key={`${row.reg_date}-${row.staff_id}`}
                                        onClick={() => { if (openOfficerId !== row.staff_id) void openOfficerRoster(row.staff_id); navigate('/supervision/officers'); }}
                                        className="cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-slate-800/40"
                                    >
                                        <td className="py-3 px-4 whitespace-nowrap font-semibold">
                                            {formatSummaryDate(row.reg_date)}
                                            {isToday && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Today</span>}
                                        </td>
                                        <td className="py-3 px-3">
                                            <p className="font-semibold">{row.field_officer}</p>
                                            <p className={`text-xs ${MUTED}`}>
                                                {row.agent_type === 'field_only' ? 'Field-Only Agent' : (row.role || 'Student Agent')}
                                                {row.staff_code ? ` · ${row.staff_code}` : ''}
                                            </p>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="text-lg font-extrabold">{row.total_registered}</span>
                                            <span className={`ml-1.5 text-xs ${MUTED}`}>{row.total_registered === 1 ? 'person' : 'people'}</span>
                                            <div className="h-1.5 w-32 rounded-full bg-stone-200 dark:bg-slate-800 mt-1 overflow-hidden">
                                                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${barPct}%` }} />
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap text-xs">
                                            <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">{row.accounts_opened} opened</span>
                                            {' '}
                                            <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">{row.waiting_signup} waiting</span>
                                        </td>
                                        <td className="py-3 px-3 hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                                                {(row.top_locations || []).map(loc => (
                                                    <span key={loc.location} className="px-2 py-0.5 rounded text-[11px] bg-stone-100 dark:bg-slate-800">
                                                        {loc.location} <b>{loc.count}</b>
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap hidden lg:table-cell text-xs font-mono text-stone-500">
                                            {firstT === lastT ? `${firstT} EAT` : `${firstT} – ${lastT} EAT`}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-stone-50 dark:bg-slate-800/60 border-t-2 border-stone-200 dark:border-slate-700 font-bold text-xs">
                                <td className="py-3 px-4" colSpan={2}>Total ({filteredRegSummary.length} records)</td>
                                <td className="py-3 px-3 text-sm font-extrabold">{summaryTotals.total.toLocaleString()} people</td>
                                <td className="py-3 px-3" colSpan={3}>
                                    {summaryTotals.opened} opened · {summaryTotals.waiting} waiting
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                </>
            )}
        </section>
        </div>
    );
};

export default OverviewPage;
