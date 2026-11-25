import React from 'react';
import { Check, ChevronDown, ChevronUp, Copy, Download, Loader2, X } from 'lucide-react';
import { CARD, MUTED } from '../../learn/learnUi';
import { joinLink } from '../../../src/lib/staffApi';
import AgentLinksPanel from '../AgentLinksPanel';
import { downloadCsv, formatEatDate } from './shared';
import { useSupervision } from './SupervisionContext';

/** Page 2: every field officer and agent, their links, and the students the selected officer registered. */
const OfficersPage: React.FC = () => {
    const {
        sortedAgents, openOfficerId, openOfficerRoster, copiedKey, copyText, openOfficer, setOpenOfficerId,
        officerClients, officerClientsLoading, todayYmd,
    } = useSupervision();

    return (
        <div className="space-y-6">
        {/* All Field Officers Table */}
        <section className={`${CARD} rounded-2xl overflow-hidden`}>
            <div className="px-5 py-4 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-base">Agents</h2>
                    <p className={`text-xs ${MUTED}`}>Tap an agent to view every student they registered. Use Copy link to copy their sign-up link, or All links for every link.</p>
                </div>
                <span className={`text-xs font-semibold ${MUTED}`}>{sortedAgents.length} total</span>
            </div>
            <div className="md:hidden divide-y divide-stone-100 dark:divide-slate-800">
                {sortedAgents.map(a => {
                    const isOpen = openOfficerId === a.id;
                    return (
                        <div key={a.id} className={`px-4 py-3.5 space-y-2 ${isOpen ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : ''} ${a.active ? '' : 'opacity-55'}`}>
                            <button type="button" onClick={() => void openOfficerRoster(a.id)} className="block w-full text-left min-h-[44px]">
                                <p className="font-semibold text-[15px]">{a.name}</p>
                                <p className={`text-sm break-all ${MUTED}`}>{[a.email, a.staff_code].filter(Boolean).join(' · ')}</p>
                                <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                    a.agent_type === 'field_only'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                        : 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300'
                                }`}>
                                    {a.agent_type === 'field_only' ? 'Field-Only (3-Field)' : 'Student Agent'}
                                </span>
                                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                                    <div><p className="text-xl font-extrabold">{a.registered}</p><p className={`text-xs ${MUTED}`}>Registered</p></div>
                                    <div><p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{a.registered_today || 0}</p><p className={`text-xs ${MUTED}`}>Today</p></div>
                                    <div><p className="text-xl font-extrabold">{a.accounts}</p><p className={`text-xs ${MUTED}`}>Accounts</p></div>
                                </div>
                            </button>
                            <div className="flex flex-wrap items-center gap-2">
                                {a.slug ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => void copyText(joinLink(a.slug), `row-${a.id}`)}
                                            className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {copiedKey === `row-${a.id}` ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy link</>}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (openOfficerId !== a.id) void openOfficerRoster(a.id);
                                                setTimeout(() => document.getElementById('agent-links-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
                                            }}
                                            className="px-3 min-h-[44px] text-sm font-semibold underline text-stone-600 dark:text-slate-300"
                                        >
                                            All links
                                        </button>
                                    </>
                                ) : <span className="text-sm text-stone-400">No link yet</span>}
                                <button type="button" onClick={() => void openOfficerRoster(a.id)} className="ml-auto inline-flex items-center gap-1 px-3 min-h-[44px] text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                    {isOpen ? <>Hide students <ChevronUp size={15} /></> : <>View students <ChevronDown size={15} /></>}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[680px]">
                    <thead>
                        <tr className="text-left text-xs uppercase text-stone-500 dark:text-slate-400 bg-stone-50 dark:bg-slate-800/40">
                            <th className="py-3 px-4">Officer</th>
                            <th className="py-3 px-3">Account Type</th>
                            <th className="py-3 px-3 text-right">Registered</th>
                            <th className="py-3 px-3 text-right">Today</th>
                            <th className="py-3 px-3 text-right">Accounts</th>
                            <th className="py-3 px-3 text-right">Link</th>
                            <th className="py-3 px-4 text-right">Roster</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                        {sortedAgents.map(a => {
                            const isOpen = openOfficerId === a.id;
                            return (
                                <tr
                                    key={a.id}
                                    onClick={() => void openOfficerRoster(a.id)}
                                    className={`cursor-pointer ${isOpen ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : 'hover:bg-stone-50 dark:hover:bg-slate-800/40'} ${a.active ? '' : 'opacity-55'}`}
                                >
                                    <td className="py-3 px-4">
                                        <p className="font-semibold">{a.name}</p>
                                        <p className={`text-xs ${MUTED}`}>{[a.email, a.staff_code].filter(Boolean).join(' · ')}</p>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                            a.agent_type === 'field_only'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                : 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300'
                                        }`}>
                                            {a.agent_type === 'field_only' ? 'Field-Only (3-Field)' : 'Student Agent'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-right font-extrabold">{a.registered}</td>
                                    <td className="py-3 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                                        {a.registered_today || 0}
                                    </td>
                                    <td className="py-3 px-3 text-right font-semibold">{a.accounts}</td>
                                    <td className="py-3 px-3 text-right whitespace-nowrap">
                                        {a.slug ? (
                                            <div className="inline-flex flex-col items-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); void copyText(joinLink(a.slug), `row-${a.id}`); }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                                                >
                                                    {copiedKey === `row-${a.id}` ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        if (openOfficerId !== a.id) void openOfficerRoster(a.id);
                                                        setTimeout(() => document.getElementById('agent-links-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
                                                    }}
                                                    className="text-[11px] font-semibold underline text-stone-600 dark:text-slate-300"
                                                >
                                                    All links
                                                </button>
                                            </div>
                                        ) : <span className="text-[11px] text-stone-400">No link yet</span>}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                            {isOpen ? <>Hide <ChevronUp size={13} /></> : <>View <ChevronDown size={13} /></>}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>

        {/* Selected Officer Student Roster */}
        {openOfficer && (
                            <div className="space-y-4">
                            <div id="agent-links-panel" className="scroll-mt-4"><AgentLinksPanel agent={openOfficer} /></div>
                            <section className={`${CARD} rounded-2xl p-5 space-y-4 ring-2 ring-indigo-500/30`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold text-lg">Students Registered by {openOfficer.name}</h3>
                                        <p className={`text-xs ${MUTED}`}>
                                            {openOfficer.registered} registered · {openOfficer.accounts} accounts opened
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {officerClients && officerClients.length > 0 && (
                                            <button
                                                onClick={() => downloadCsv(
                                                    `welile-${openOfficer.slug}-students-${todayYmd}.csv`,
                                                    ['Date', 'Name', 'Phone', 'Email', 'Location', 'Stage'],
                                                    officerClients.map(c => [formatEatDate(c.joined), c.name, c.phone || '', c.email || '', c.location || '', c.stage])
                                                )}
                                                className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg text-sm font-semibold border border-stone-300 dark:border-slate-700"
                                            >
                                                <Download size={15} /> Export CSV
                                            </button>
                                        )}
                                        <button onClick={() => setOpenOfficerId(null)} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-stone-300 dark:border-slate-700" aria-label="Close">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                {officerClientsLoading || !officerClients ? (
                                    <div className={`py-6 flex items-center gap-2 text-sm ${MUTED}`}><Loader2 className="animate-spin" size={16} /> Loading students...</div>
                                ) : officerClients.length === 0 ? (
                                    <p className={`text-sm ${MUTED}`}>No students registered yet.</p>
                                ) : (
                                    <>
                                    <div className="md:hidden divide-y divide-stone-100 dark:divide-slate-800 rounded-xl border border-stone-200 dark:border-slate-800">
                                        {officerClients.map((c, idx) => (
                                            <div key={`${c.phone || c.name}-${idx}`} className="px-3 py-2.5 space-y-0.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-semibold">{c.name || '(no name)'}</p>
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 shrink-0">{c.stage}</span>
                                                </div>
                                                <p className="text-sm font-mono break-all">{c.phone || c.email || '—'}</p>
                                                <p className={`text-xs ${MUTED}`}>{c.location || '—'} · {formatEatDate(c.joined)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="hidden md:block overflow-x-auto rounded-xl border border-stone-200 dark:border-slate-800">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-xs uppercase text-stone-500 bg-stone-50 dark:bg-slate-800/40">
                                                    <th className="py-2.5 px-3">Date</th>
                                                    <th className="py-2.5 px-3">Student</th>
                                                    <th className="py-2.5 px-3">Phone / Email</th>
                                                    <th className="py-2.5 px-3">Location</th>
                                                    <th className="py-2.5 px-3 text-right">Stage</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                                                {officerClients.map((c, idx) => (
                                                    <tr key={`${c.phone || c.name}-${idx}`}>
                                                        <td className="py-2.5 px-3 text-xs text-stone-500 whitespace-nowrap">{formatEatDate(c.joined)}</td>
                                                        <td className="py-2.5 px-3 font-medium">{c.name || '(no name)'}</td>
                                                        <td className="py-2.5 px-3 text-xs font-mono text-stone-600 dark:text-slate-300">
                                                            {c.phone || c.email || '—'}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-xs">{c.location || '—'}</td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                                                                {c.stage}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    </>
                                )}
                            </section>
                            </div>
        )}
        </div>
    );
};

export default OfficersPage;
