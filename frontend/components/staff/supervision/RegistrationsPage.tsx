import React from 'react';
import { Download, Search } from 'lucide-react';
import { CARD, MUTED } from '../../learn/learnUi';
import { downloadCsv, formatEatDateTime, INPUT } from './shared';
import { useSupervision } from './SupervisionContext';

/** Page 4: every registration made by field-only agents and student agents. */
const RegistrationsPage: React.FC = () => {
    const {
        filteredRecentRegs, regSearch, setRegSearch, regOfficerFilter, setRegOfficerFilter, summaryOfficers, todayYmd,
    } = useSupervision();

    return (
        <section className={`${CARD} rounded-2xl p-5 space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-bold text-base">All Field Registrations ({filteredRecentRegs.length})</h2>
                    <p className={`text-xs ${MUTED}`}>Every student registered by field-only agents and student agents.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            value={regSearch}
                            onChange={e => setRegSearch(e.target.value)}
                            placeholder="Search student, phone, location..."
                            className={`${INPUT} pl-8 !py-1.5 text-xs w-56`}
                        />
                    </div>
                    <select
                        value={regOfficerFilter}
                        onChange={e => setRegOfficerFilter(e.target.value)}
                        className="rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold"
                    >
                        <option value="all">All Officers</option>
                        {summaryOfficers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                    <button
                        onClick={() => downloadCsv(
                            `welile-all-registrations-${todayYmd}.csv`,
                            ['Date & Time (EAT)', 'Student', 'Phone', 'Email', 'Location', 'Field Officer', 'Agent Type', 'Programme', 'Status'],
                            filteredRecentRegs.map(r => [
                                formatEatDateTime(r.created_at), r.full_name, r.phone, r.email || '',
                                r.location || '', r.field_officer, r.agent_type === 'field_only' ? 'Field-Only' : 'Student Agent',
                                r.course_title, r.status,
                            ])
                        )}
                        disabled={filteredRecentRegs.length === 0}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 dark:border-slate-700 disabled:opacity-50"
                    >
                        <Download size={13} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                    <thead>
                        <tr className="text-left text-xs uppercase text-stone-500 bg-stone-50 dark:bg-slate-800/40">
                            <th className="py-2.5 px-3">Date &amp; Time (EAT)</th>
                            <th className="py-2.5 px-3">Student</th>
                            <th className="py-2.5 px-3">Phone</th>
                            <th className="py-2.5 px-3">Location</th>
                            <th className="py-2.5 px-3">Field Officer</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                        {filteredRecentRegs.slice(0, 150).map(r => (
                            <tr key={r.id}>
                                <td className="py-2.5 px-3 text-xs text-stone-500 whitespace-nowrap font-mono">{formatEatDateTime(r.created_at)}</td>
                                <td className="py-2.5 px-3 font-medium">{r.full_name}</td>
                                <td className="py-2.5 px-3 text-xs font-mono">{r.phone}</td>
                                <td className="py-2.5 px-3 text-xs">{r.location || '—'}</td>
                                <td className="py-2.5 px-3 text-xs">
                                    <span className="font-semibold">{r.field_officer}</span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                        r.status === 'account_created'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {r.status === 'account_created' ? 'Account opened' : 'Waiting to sign up'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredRecentRegs.length === 0 && (
                            <tr><td colSpan={6} className={`py-8 text-center text-sm ${MUTED}`}>No registrations found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default RegistrationsPage;
