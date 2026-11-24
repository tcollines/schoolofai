import React, { useState } from 'react';
import { Check, CheckCircle2, Copy, Loader2, MessageCircle, Search, UserCheck } from 'lucide-react';
import { supabase } from '../../../src/lib/supabaseClient';
import { joinLink, whatsappShare } from '../../../src/lib/staffApi';
import { BTN_PRIMARY, CARD, MUTED } from '../../learn/learnUi';
import { INPUT } from './shared';
import { useSupervision } from './SupervisionContext';

interface StudentHit {
    id: string; name: string; email: string; phone: string | null; location: string | null; joined: string;
    is_agent: boolean; agent_slug: string | null; agent_code: string | null; agent_type: string | null; agent_active: boolean | null;
}

/**
 * Turn someone who is already a student into a sales agent. They keep the same account, profile and progress:
 * the agent profile is attached to their existing login, so nothing is copied and nothing can fall out of step.
 */
const MakeStudentAgent: React.FC = () => {
    const { reload, copyText, copiedKey } = useSupervision();
    const [q, setQ] = useState('');
    const [hits, setHits] = useState<StudentHit[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<{ name: string; slug: string; code: string; existing: boolean } | null>(null);

    const search = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setDone(null);
        if (q.trim().length < 2) { setError('Type at least 2 letters of their name, email, phone or town.'); return; }
        setSearching(true);
        const { data, error: err } = await supabase.rpc('supervisor_student_search', { p_q: q.trim() });
        setSearching(false);
        if (err) { setError(err.message); setHits(null); return; }
        setHits((data || []) as StudentHit[]);
    };

    const makeAgent = async (h: StudentHit) => {
        setBusyId(h.id); setError(null);
        const { data, error: err } = await supabase.rpc('supervisor_make_student_agent', { p_user_id: h.id, p_role: 'Sales agent' });
        setBusyId(null);
        const r: any = data || {};
        if (err || !r.ok) { setError(err?.message || r.message || 'Could not make this student an agent.'); return; }
        setDone({ name: r.name || h.name, slug: r.slug, code: r.staff_code, existing: !!r.existing });
        setHits(prev => (prev || []).map(x => x.id === h.id ? { ...x, is_agent: true, agent_slug: r.slug, agent_code: r.staff_code, agent_type: r.agent_type, agent_active: true } : x));
        await reload();
    };

    const link = done ? joinLink(done.slug) : '';
    return (
        <section className={`${CARD} rounded-2xl p-6 space-y-4 lg:col-span-2`}>
            <div>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">Student agent</span>
                <h2 className="font-serif text-xl font-bold mt-2">Make an existing student an agent</h2>
                <p className={`text-sm mt-1 ${MUTED}`}>
                    Search for a student and make them an agent in one tap. They keep their own account, courses and progress, and get the agent dashboard alongside their student one. They switch between the two with the <b>Switch dashboard</b> button.
                </p>
            </div>

            <form onSubmit={search} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, email, phone or town" className={`${INPUT} pl-10`} aria-label="Search students" />
                </div>
                <button type="submit" disabled={searching} className={`${BTN_PRIMARY} sm:w-40`}>{searching ? <><Loader2 className="animate-spin" size={16} /> Searching...</> : 'Search'}</button>
            </form>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

            {done && (
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="m-0 font-bold text-emerald-900 dark:text-emerald-200">{done.name} {done.existing ? 'is already an agent (now switched on)' : 'is now an agent'}</p>
                            <p className="m-0 text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">Agent code <b>{done.code}</b>. Their sign-up link is ready to share. They will see the agent dashboard the next time they open Welile (use Switch dashboard).</p>
                        </div>
                    </div>
                    <div className="rounded-lg bg-white/70 dark:bg-slate-900/50 px-3 py-2 text-xs font-mono break-all">{link}</div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void copyText(link, 'made-agent-link')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-300 bg-white dark:bg-slate-900">
                            {copiedKey === 'made-agent-link' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
                        </button>
                        <a href={whatsappShare(`Hello ${done.name.split(' ')[0]}, you are now a Welile School of AI agent. Your personal sign-up link: ${link}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-300 bg-white dark:bg-slate-900"><MessageCircle size={13} /> Tell them on WhatsApp</a>
                    </div>
                </div>
            )}

            {hits && hits.length === 0 && <p className={`text-sm ${MUTED}`}>No student matches that search.</p>}
            {hits && hits.length > 0 && (
                <ul className="divide-y divide-stone-100 dark:divide-slate-800 rounded-2xl border border-stone-200 dark:border-slate-800 overflow-hidden">
                    {hits.map(h => (
                        <li key={h.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <div className="flex-1 min-w-[200px]">
                                <p className="m-0 font-semibold">{h.name || '(no name)'}</p>
                                <p className={`m-0 text-xs ${MUTED}`}>{[h.email, h.phone, h.location].filter(Boolean).join(' · ')}</p>
                            </div>
                            {h.is_agent ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                    <UserCheck size={13} /> Already an agent{h.agent_code ? ` (${h.agent_code})` : ''}{h.agent_active === false ? ', switched off' : ''}
                                </span>
                            ) : (
                                <button type="button" onClick={() => void makeAgent(h)} disabled={busyId === h.id} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-violet-700 hover:bg-violet-800 text-white">
                                    {busyId === h.id ? <><Loader2 className="animate-spin" size={14} /> Working...</> : 'Make agent'}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default MakeStudentAgent;
