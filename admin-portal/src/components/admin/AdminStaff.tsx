import React, { useCallback, useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { Check, Copy, KeyRound, Loader2, Plus, UserCheck, UserX } from 'lucide-react';
import AdminAuthPrompt, { MissingDbNotice } from './AdminAuthPrompt';

interface Staff { id: string; user_id: string | null; staff_code: string; slug: string; display_name: string; role: string | null; phone: string | null; active: boolean; }
interface Client { name: string; email: string | null; phone: string | null; location: string | null; stage: string; joined: string; }
interface Funnel { id: string; name: string; slug: string; role: string | null; active: boolean; linked: boolean; clicks: number; registered: number; accounts: number; enrolled: number; recorded: number; live: number; completed: number; active_7d: number; by_course: Record<string, number>; by_location: Record<string, number>; }
interface GroupSize { week: string | null; cohort: string | null; learners: number; }
interface Hit { id: string; name: string; email: string; phone?: string | null; location?: string | null; agent_slug: string | null; }
interface Reg { id: string; created_at: string; full_name: string; email: string | null; phone: string; location?: string | null; course_title: string; campaign: string | null; status: string; registered_by_staff_id: string; }

const card = 'bg-white dark:bg-night-2 rounded-[22px]';
const input = 'w-full rounded-[12px] bg-white dark:bg-night-2 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

const slugify = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isMissingTable = (m: string) => /schema cache|does not exist|could not find the table/i.test(m);
const isAuthError = (m: string) => /row-level security|permission denied|not authorized/i.test(m);

const AdminStaff: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [regs, setRegs] = useState<Reg[]>([]);
    const [loading, setLoading] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [missingDb, setMissingDb] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [adding, setAdding] = useState({ name: '', code: '', role: 'Outreach Mobilizer', phone: '' });
    const [linkEmail, setLinkEmail] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [funnel, setFunnel] = useState<Funnel[]>([]);
    const [groups, setGroups] = useState<GroupSize[]>([]);
    const [agentEmail, setAgentEmail] = useState('');
    const [days, setDays] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<'accounts' | 'registered' | 'completed' | 'live' | 'name'>('accounts');
    const [openAgent, setOpenAgent] = useState<string | null>(null);
    const [clients, setClients] = useState<Client[] | null>(null);
    const sinceIso = days ? new Date(Date.now() - days * 86400000).toISOString() : null;
    const totals = funnel.reduce((a, f) => ({ registered: a.registered + f.registered, accounts: a.accounts + f.accounts, recorded: a.recorded + f.recorded, completed: a.completed + f.completed }), { registered: 0, accounts: 0, recorded: 0, completed: 0 });
    const sortedFunnel = [...funnel].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : (b[sortBy] as number) - (a[sortBy] as number));
    const openClients = async (id: string) => {
        if (openAgent === id) { setOpenAgent(null); return; }
        setOpenAgent(id); setClients(null);
        const { data } = await supabaseClient.rpc('admin_agent_clients', { p_staff: id, p_since: sinceIso });
        setClients((data || []) as Client[]);
    };
    const [q, setQ] = useState('');
    const [hits, setHits] = useState<Hit[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        const s = await supabaseClient.from('staff_members').select('*').order('display_name');
        if (s.error) { if (isMissingTable(s.error.message)) setMissingDb(true); else { setError(s.error.message); if (isAuthError(s.error.message)) setNeedsAuth(true); } }
        else { setStaff((s.data || []) as Staff[]); setError(null); }
        const r = await supabaseClient.from('staff_registrations').select('*').order('created_at', { ascending: false }).limit(200);
        if (!r.error) setRegs((r.data || []) as Reg[]);
        const f = await supabaseClient.rpc('admin_agent_funnel', { p_since: days ? new Date(Date.now() - days * 86400000).toISOString() : null });
        if (!f.error && f.data) setFunnel(f.data as Funnel[]);
        const g = await supabaseClient.rpc('admin_group_sizes', { p_course: 'ai-fundamentals' });
        if (!g.error && g.data) setGroups(g.data as GroupSize[]);
        setLoading(false);
    }, [days]);
    useEffect(() => { void load(); }, [load]);

    const origin = window.location.origin.replace('admin.', '');
    const nameOf = (id: string) => staff.find(s => s.id === id)?.display_name || 'Unknown';

    const addStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setMsg(null);
        const name = adding.name.trim();
        const code = (adding.code.trim() || `WSI-STF-${String(staff.length + 1).padStart(3, '0')}`).toUpperCase();
        if (name.length < 2) return setError('Please enter the staff member\'s name.');
        setBusy(true);
        const { error: err } = await supabaseClient.from('staff_members').insert({ display_name: name, staff_code: code, slug: slugify(code), role: adding.role.trim() || 'Staff', phone: adding.phone.trim() || null });
        setBusy(false);
        if (err) {
            if (isAuthError(err.message)) setNeedsAuth(true);
            setError(/duplicate|unique/i.test(err.message) ? 'That staff code is already in use.' : err.message);
            return;
        }
        setAdding({ name: '', code: '', role: 'Outreach Mobilizer', phone: '' });
        setMsg(`${name} added. Link their login below so they can use the staff portal.`);
        await load();
    };

    useEffect(() => {
        if (q.trim().length < 2) { setHits([]); return; }
        const t = setTimeout(async () => {
            const { data, error: err } = await supabaseClient.rpc('admin_student_search', { p_q: q });
            if (!err && data) setHits(data as any);
        }, 300);
        return () => clearTimeout(t);
    }, [q]);

    const makeAgentFor = async (email: string) => {
        setError(null); setMsg(null); setBusy(true);
        const { data, error: err } = await supabaseClient.rpc('admin_make_agent', { p_email: email, p_role: 'Sales agent' });
        setBusy(false);
        if (err) { setError(err.message); return; }
        const d: any = data || {};
        if (!d.ok) { setError(d.message || 'Could not make that person an agent.'); return; }
        setMsg(`${d.name}: sign-up link ${origin}/join/${d.slug}`);
        await load();
        setHits(h => h.map(x => x.email === email ? { ...x, agent_slug: d.slug } : x));
    };

    const makeAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setMsg(null);
        const email = agentEmail.trim();
        if (!email) return setError('Enter the email the student signed up with.');
        setBusy(true);
        const { data, error: err } = await supabaseClient.rpc('admin_make_agent', { p_email: email, p_role: 'Sales agent' });
        setBusy(false);
        if (err) { setError(err.message); if (isAuthError(err.message)) setNeedsAuth(true); return; }
        const d: any = data || {};
        if (!d.ok) { setError(d.message || 'Could not make that person an agent.'); return; }
        setMsg(`${d.name} is ${d.existing ? 'already ' : 'now '}a sales agent. Their sign-up link is ${origin}/join/${d.slug} and they manage clients at ${origin}/staff.`);
        setAgentEmail('');
        await load();
    };

    const toggleActive = async (s: Staff) => {
        const { error: err } = await supabaseClient.from('staff_members').update({ active: !s.active }).eq('id', s.id);
        if (err) { setError(err.message); if (isAuthError(err.message)) setNeedsAuth(true); return; }
        await load();
    };

    const linkLogin = async (s: Staff) => {
        const email = (linkEmail[s.id] || '').trim();
        if (!email) return setError('Enter the email the staff member signed up with.');
        setError(null); setMsg(null);
        const { data, error: err } = await supabaseClient.rpc('admin_link_staff', { p_staff_id: s.id, p_email: email });
        if (err) { setError(err.message); if (isAuthError(err.message)) setNeedsAuth(true); return; }
        const d: any = data || {};
        if (!d.ok) { setError(d.message || 'Could not link that login.'); return; }
        setMsg(`${s.display_name} can now sign in at /staff with ${email}.`);
        setLinkEmail(m => ({ ...m, [s.id]: '' }));
        await load();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">Staff & Referral Links</h1>
                <p className="text-sm text-stone-500 dark:text-slate-400">Manage who can register students and share links. Staff sign in at <span className="font-mono">/staff</span> with their normal login once you link it. Existing outreach registration is not affected.</p>
            </div>

            {missingDb && <MissingDbNotice />}
            {needsAuth && <AdminAuthPrompt onSignedIn={() => { setNeedsAuth(false); setError(null); void load(); }} />}
            {msg && <p role="status" className="text-sm rounded-[12px] bg-mint-soft dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3">{msg}</p>}
            {error && !missingDb && <p role="alert" className="text-sm text-red-600">{error}</p>}

            <form onSubmit={makeAgent} className={`${card} p-5`}>
                <h2 className="m-0 text-[16px] font-extrabold">Make a student a sales agent</h2>
                <p className="text-xs text-stone-500 mt-1">They keep their student account. Enter the email they registered with: they get a personal sign-up link and the agent portal at <span className="font-mono">/staff</span> straight away.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                    <input type="email" value={agentEmail} onChange={e => setAgentEmail(e.target.value)} placeholder="Student's email" className={`${input} max-w-sm`} />
                    <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-semibold bg-brand hover:bg-brand-mid text-white disabled:opacity-60"><UserCheck size={16} /> Make agent</button>
                </div>
            </form>

            <div className={`${card} p-5`}>
                <h2 className="m-0 text-[16px] font-extrabold">Find students and give them a personal link</h2>
                <p className="text-xs text-stone-500 mt-1">Search everyone who has an account. Press <b>Make agent</b> to give that person their own sign-up link and the agent portal.</p>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, email, phone or location" className={`${input} max-w-sm mt-3`} />
                <ul className="mt-2 divide-y divide-stone-100 dark:divide-slate-800">
                    {hits.map(h => (
                        <li key={h.id} className="py-2.5 flex flex-wrap items-center gap-2 justify-between">
                            <div className="min-w-0"><p className="text-sm font-medium truncate">{h.name || '(no name)'}</p><p className="text-xs text-stone-500 truncate">{[h.email, h.phone, h.location].filter(Boolean).join(' · ')}</p></div>
                            {h.agent_slug
                                ? <div className="flex items-center gap-2"><span className="text-xs text-mint">Agent</span><button onClick={async () => { await navigator.clipboard.writeText(`${origin}/join/${h.agent_slug}`); setCopied(h.id); setTimeout(() => setCopied(null), 1500); }} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[12px] text-xs font-medium border border-stone-200 dark:border-slate-700">{copied === h.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}</button></div>
                                : <button onClick={() => makeAgentFor(h.email)} disabled={busy} className="px-3 py-1.5 rounded-[12px] text-xs font-semibold bg-brand hover:bg-brand-mid text-white disabled:opacity-60">Make agent</button>}
                        </li>
                    ))}
                    {q.trim().length >= 2 && hits.length === 0 && <li className="py-2 text-sm text-stone-500">No students found.</li>}
                </ul>
            </div>

            <div className={`${card} p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="m-0 text-[16px] font-extrabold">Agent performance</h2>
                        <p className="text-xs text-stone-500 mt-1">Clients each agent brought in during the period, and where they are now.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="inline-flex rounded-[12px] border border-stone-300 dark:border-slate-700 overflow-hidden text-xs font-semibold" role="group" aria-label="Period">
                            {([[7, '7 days'], [30, '30 days'], [null, 'All time']] as [number | null, string][]).map(([d, l]) => (
                                <button key={l} onClick={() => setDays(d)} aria-pressed={days === d} className={`px-3 py-2 ${days === d ? 'bg-brand text-white' : 'bg-white dark:bg-night-2'}`}>{l}</button>
                            ))}
                        </div>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="rounded-[12px] bg-white dark:bg-night-2 px-2 py-2 text-xs font-semibold" aria-label="Sort agents by">
                            <option value="accounts">Most accounts</option><option value="registered">Most registered</option><option value="completed">Most completed</option><option value="live">Most live attendees</option><option value="name">Name</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {([['Registered', totals.registered], ['Accounts', totals.accounts], ['Studying', totals.recorded], ['Completed', totals.completed]] as [string, number][]).map(([l, n]) => (
                        <div key={l} className="rounded-[14px] bg-violet-50 dark:bg-violet-950/30 p-3"><p className="text-xs text-stone-500">{l} (all agents)</p><p className="text-2xl font-extrabold">{n}</p></div>
                    ))}
                </div>

                <ul className="mt-4 space-y-3">
                    {sortedFunnel.map(f => {
                        const max = Math.max(1, f.registered, f.accounts);
                        const rows: [string, number][] = [['Link clicks', f.clicks], ['Registered', f.registered], ['Accounts', f.accounts], ['In free course', f.enrolled], ['Recorded lessons', f.recorded], ['Joined live', f.live], ['Active 7d', f.active_7d], ['Completed', f.completed]];
                        return (
                            <li key={f.id} className={`rounded-[14px] border border-stone-100 dark:border-slate-800 p-4 ${f.active ? '' : 'opacity-50'}`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="min-w-0"><p className="font-semibold">{f.name} <span className="text-xs font-normal text-stone-500">{f.role}</span></p><p className="text-xs text-stone-500 break-all">{origin}/join/{f.slug}</p></div>
                                    <button onClick={() => openClients(f.id)} className="px-3 py-1.5 rounded-[12px] text-xs font-semibold border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800">{openAgent === f.id ? 'Hide clients' : 'View clients'}</button>
                                </div>
                                <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                                    {rows.map(([l, n]) => (
                                        <div key={l}>
                                            <div className="flex justify-between text-xs"><span className="text-stone-500">{l}</span><span className="font-semibold">{n}</span></div>
                                            <div className="h-1.5 rounded-full bg-stone-100 dark:bg-slate-800 mt-1"><div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${Math.min(100, (n / max) * 100)}%` }} /></div>
                                        </div>
                                    ))}
                                </div>
                                {f.by_location && Object.keys(f.by_location).length > 0 && <p className="mt-2 text-xs text-stone-500">Locations: {Object.entries(f.by_location).map(([c, n]) => `${c} ${n}`).join(' · ')}</p>}
                                {openAgent === f.id && (
                                    <div className="mt-3 border-t border-stone-100 dark:border-slate-800 pt-3">
                                        {clients === null ? <p className="text-sm text-stone-500">Loading...</p> : clients.length === 0 ? <p className="text-sm text-stone-500">No clients in this period.</p> : (
                                            <ul className="divide-y divide-stone-100 dark:divide-slate-800">
                                                {clients.map((c, i) => (
                                                    <li key={i} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                                                        <div className="min-w-0"><p className="font-medium truncate">{c.name || '(no name)'}</p><p className="text-xs text-stone-500 truncate">{[c.email, c.phone, c.location].filter(Boolean).join(' · ')}</p></div>
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">{c.stage}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                    {funnel.length === 0 && <li className="text-sm text-stone-500">No agents yet.</li>}
                </ul>
            </div>

            <div className={`${card} p-5`}>
                <h2 className="m-0 text-[16px] font-extrabold">Cohorts and weekly groups</h2>
                <p className="text-xs text-stone-500 mt-1">A learner joins the first week whose opening class has not started when they enrol. Reminders follow the group; everyone can join any class.</p>
                <ul className="mt-3 text-sm divide-y divide-stone-100 dark:divide-slate-800">
                    {groups.map((g, i) => (
                        <li key={i} className="py-2 flex justify-between"><span>{g.week ? `${g.cohort} · week of ${new Date(g.week + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}` : 'Waiting for the next live week to be scheduled'}</span><span className="font-semibold">{g.learners} learners</span></li>
                    ))}
                    {groups.length === 0 && <li className="py-2 text-stone-500">No data yet.</li>}
                </ul>
            </div>

            <form onSubmit={addStaff} className={`${card} p-5`}>
                <h2 className="m-0 text-[16px] font-extrabold">Add a staff member</h2>
                <div className="grid md:grid-cols-4 gap-3 mt-3">
                    <input value={adding.name} onChange={e => setAdding(a => ({ ...a, name: e.target.value }))} placeholder="Full name *" className={input} />
                    <input value={adding.code} onChange={e => setAdding(a => ({ ...a, code: e.target.value }))} placeholder="Staff code (auto if empty)" className={input} />
                    <input value={adding.role} onChange={e => setAdding(a => ({ ...a, role: e.target.value }))} placeholder="Role" className={input} />
                    <input value={adding.phone} onChange={e => setAdding(a => ({ ...a, phone: e.target.value }))} placeholder="Phone" className={input} />
                </div>
                <button type="submit" disabled={busy} className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-semibold bg-brand hover:bg-brand-mid text-white disabled:opacity-60"><Plus size={16} /> Add staff member</button>
            </form>

            <div className={`${card} p-5`}>
                <h2 className="m-0 text-[16px] font-extrabold">Staff</h2>
                {loading ? <div className="flex items-center gap-2 text-stone-500 mt-3"><Loader2 className="animate-spin" size={18} /> Loading...</div> : (
                    <ul className="divide-y divide-stone-100 dark:divide-slate-800 mt-2">
                        {staff.map(s => {
                            const link = `${origin}/r/${s.slug}`;
                            return (
                                <li key={s.id} className={`py-4 ${s.active ? '' : 'opacity-60'}`}>
                                    <div className="flex flex-wrap items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold">{s.display_name} <span className="text-xs font-normal text-stone-500">{s.staff_code}{s.role ? ` · ${s.role}` : ''}</span></p>
                                            <p className="text-xs text-stone-500 break-all">{link}</p>
                                            <p className="text-xs text-stone-500 break-all">Quick sign-up form: {origin}/join/{s.slug}</p>
                                            <p className="text-xs mt-1">{s.user_id
                                                ? <span className="inline-flex items-center gap-1 text-mint dark:text-emerald-400"><UserCheck size={13} /> Login linked, can use the staff portal</span>
                                                : <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400"><UserX size={13} /> No login linked yet</span>}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(s.id); setTimeout(() => setCopied(null), 1500); }} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[12px] text-xs font-medium border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800">{copied === s.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}</button>
                                            <button onClick={() => toggleActive(s)} className="px-2.5 py-1.5 rounded-[12px] text-xs font-medium border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800">{s.active ? 'Deactivate' : 'Activate'}</button>
                                        </div>
                                    </div>
                                    {s.active && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <input type="email" value={linkEmail[s.id] || ''} onChange={e => setLinkEmail(m => ({ ...m, [s.id]: e.target.value }))} placeholder={s.user_id ? 'Change linked login (email)' : "Staff member's login email"} className={`${input} max-w-xs`} />
                                            <button onClick={() => linkLogin(s)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white"><KeyRound size={15} /> {s.user_id ? 'Re-link login' : 'Link login'}</button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                        {staff.length === 0 && <li className="py-4 text-sm text-stone-500">No staff members yet.</li>}
                    </ul>
                )}
                <p className="text-xs text-stone-500 mt-3">To give someone portal access: they register on the website with their email first, then enter that email here.</p>
            </div>

            <div className={`${card} p-5`}>
                <h2 className="m-0 text-[16px] font-extrabold">Students registered by staff</h2>
                <div className="overflow-x-auto mt-3">
                    <table className="w-full text-sm">
                        <thead><tr className="text-left text-[10px] font-extrabold tracking-[0.08em] uppercase text-[#6B6680] bg-[#FAF9FE] dark:bg-night-3/40"><th className="py-2">Date</th><th>Student</th><th>Contact</th><th>Location</th><th>Programme</th><th>Registered by</th><th>Status</th></tr></thead>
                        <tbody>
                            {regs.map(r => (
                                <tr key={r.id} className="border-t border-stone-100 dark:border-slate-800">
                                    <td className="py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                                    <td className="font-medium">{r.full_name}</td>
                                    <td className="text-stone-500">+{r.phone}{r.email ? <><br />{r.email}</> : null}</td>
                                    <td>{r.location || ''}</td>
                                    <td>{r.course_title}{r.campaign ? <span className="block text-xs text-stone-500">{r.campaign}</span> : null}</td>
                                    <td>{nameOf(r.registered_by_staff_id)}</td>
                                    <td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === 'account_created' ? 'bg-mint-soft text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{r.status === 'account_created' ? 'Account created' : 'Waiting to sign up'}</span></td>
                                </tr>
                            ))}
                            {regs.length === 0 && <tr><td colSpan={7} className="py-4 text-stone-500">No students registered by staff yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminStaff;
