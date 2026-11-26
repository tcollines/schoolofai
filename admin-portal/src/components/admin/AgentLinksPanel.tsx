import React, { useState } from 'react';
import { Check, Copy, Link2, MessageCircle } from 'lucide-react';

export interface LinkAgent {
    name: string;
    slug?: string | null;
    staff_code?: string | null;
    agent_type?: 'student_agent' | 'field_only';
    active?: boolean;
    role?: string | null;
}

// Pages an agent's personal link can send people to (same list agents see in their own portal)
const PAGES = [
    { label: 'Fundamentals of AI (free online course)', to: '/free/ai-fundamentals' },
    { label: 'Home page', to: '/' },
    { label: 'Course catalogue', to: '/discover' },
    { label: 'Official registration form', to: '/register' },
];

/** The student site's address, even when this is opened from the admin console subdomain. */
const publicOrigin = () => window.location.origin.replace('//admin.', '//www.');

const joinUrl = (slug: string) => `${publicOrigin()}/join/${slug}`;
const personalUrl = (slug: string, to: string) => {
    const base = `${publicOrigin()}/r/${slug}`;
    return to === '/free/ai-fundamentals' ? base : `${base}?to=${encodeURIComponent(to)}`;
};
const whatsapp = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/**
 * Every link one agent has, ready to copy or share. Shown to admins when they open an agent (the QR code is on the agent's own portal and in Agent Supervision).
 * Every agent (student agent or field agent) gets a link when they are created.
 */
const AgentLinksPanel: React.FC<{ agent: LinkAgent }> = ({ agent }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [page, setPage] = useState(PAGES[0].to);
    const slug = (agent.slug || '').trim();
    const quick = slug ? joinUrl(slug) : '';
    const personal = slug ? personalUrl(slug, page) : '';

    const copy = async (text: string, key: string) => {
        try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1800); } catch { /* ignore */ }
    };

    const isField = agent.agent_type === 'field_only';
    const btn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800';

    const Row: React.FC<{ title: string; hint: string; url: string; k: string; message: string }> = ({ title, hint, url, k, message }) => (
        <div className="rounded-xl border border-stone-200 dark:border-slate-800 p-3.5 space-y-2">
            <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-stone-500 dark:text-slate-400">{hint}</p>
            </div>
            <div className="rounded-lg bg-stone-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-mono break-all">{url}</div>
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void copy(url, k)} className={btn}>
                    {copied === k ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
                </button>
                <a href={whatsapp(message)} target="_blank" rel="noreferrer" className={btn}><MessageCircle size={13} /> Share on WhatsApp</a>
            </div>
        </div>
    );

    return (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 p-5 space-y-4" aria-label={`Links for ${agent.name}`}>
            <div className="flex flex-wrap items-center gap-2">
                <Link2 size={16} className="text-violet-600" />
                <h3 className="font-bold text-lg">{agent.name}'s links</h3>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isField ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300'}`}>
                    {isField ? 'Field agent' : 'Student agent'}
                </span>
                {agent.staff_code && <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800">{agent.staff_code}</span>}
                {agent.active === false && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">Paused</span>}
            </div>

            {!slug ? (
                <p className="text-sm text-stone-500 dark:text-slate-400">This agent's link is not available yet. Refresh the page; if it still does not show, the agent profile is missing a link code.</p>
            ) : (
                <div className="grid gap-4 items-start">
                    <div className="space-y-3 min-w-0">
                        <Row
                            title="Quick sign-up link"
                            hint="A short form where someone opens their own free account. They are counted for this agent automatically."
                            url={quick} k="quick"
                            message={`Open your free Welile School of AI account here (takes one minute): ${quick}`}
                        />
                        <div className="rounded-xl border border-stone-200 dark:border-slate-800 p-3.5 space-y-2">
                            <div>
                                <p className="text-sm font-bold">Personal link</p>
                                <p className="text-xs text-stone-500 dark:text-slate-400">Sends people to the page you choose. Anyone who joins through it is counted for this agent.</p>
                            </div>
                            <select value={page} onChange={e => setPage(e.target.value)} aria-label="Page this link opens"
                                className="w-full rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm">
                                {PAGES.map(p => <option key={p.to} value={p.to}>{p.label}</option>)}
                            </select>
                            <div className="rounded-lg bg-stone-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-mono break-all">{personal}</div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => void copy(personal, 'personal')} className={btn}>
                                    {copied === 'personal' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
                                </button>
                                <a href={whatsapp(`Study AI for free with Welile School of AI: ${personal}`)} target="_blank" rel="noreferrer" className={btn}><MessageCircle size={13} /> Share on WhatsApp</a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AgentLinksPanel;
