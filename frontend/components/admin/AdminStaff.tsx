import React, { useCallback, useEffect, useState } from 'react';
import { supabaseClient } from '../../src/lib/supabaseClient';
import { Check, Copy, KeyRound, Loader2, Plus, UserCheck, UserX } from 'lucide-react';
import AdminAuthPrompt, { MissingDbNotice } from './AdminAuthPrompt';

interface Staff { id: string; user_id: string | null; staff_code: string; slug: string; display_name: string; role: string | null; phone: string | null; active: boolean; }
interface Reg { id: string; created_at: string; full_name: string; email: string | null; phone: string; course_title: string; campaign: string | null; status: string; registered_by_staff_id: string; }

const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm';
const input = 'w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';

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

    const load = useCallback(async () => {
        setLoading(true);
        const s = await supabaseClient.from('staff_members').select('*').order('display_name');
        if (s.error) { if (isMissingTable(s.error.message)) setMissingDb(true); else { setError(s.error.message); if (isAuthError(s.error.message)) setNeedsAuth(true); } }
        else { setStaff((s.data || []) as Staff[]); setError(null); }
        const r = await supabaseClient.from('staff_registrations').select('*').order('created_at', { ascending: false }).limit(200);
        if (!r.error) setRegs((r.data || []) as Reg[]);
        setLoading(false);
    }, []);
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
                <h1 className="text-2xl font-bold">Staff & Referral Links</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">Manage who can register students and share links. Staff sign in at <span className="font-mono">/staff</span> with their normal login once you link it. Existing outreach registration is not affected.</p>
            </div>

            {missingDb && <MissingDbNotice />}
            {needsAuth && <AdminAuthPrompt onSignedIn={() => { setNeedsAuth(false); setError(null); void load(); }} />}
            {msg && <p role="status" className="text-sm rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3">{msg}</p>}
            {error && !missingDb && <p role="alert" className="text-sm text-red-600">{error}</p>}

            <form onSubmit={addStaff} className={`${card} p-5`}>
                <h2 className="font-bold">Add a staff member</h2>
                <div className="grid md:grid-cols-4 gap-3 mt-3">
                    <input value={adding.name} onChange={e => setAdding(a => ({ ...a, name: e.target.value }))} placeholder="Full name *" className={input} />
                    <input value={adding.code} onChange={e => setAdding(a => ({ ...a, code: e.target.value }))} placeholder="Staff code (auto if empty)" className={input} />
                    <input value={adding.role} onChange={e => setAdding(a => ({ ...a, role: e.target.value }))} placeholder="Role" className={input} />
                    <input value={adding.phone} onChange={e => setAdding(a => ({ ...a, phone: e.target.value }))} placeholder="Phone" className={input} />
                </div>
                <button type="submit" disabled={busy} className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60"><Plus size={16} /> Add staff member</button>
            </form>

            <div className={`${card} p-5`}>
                <h2 className="font-bold">Staff</h2>
                {loading ? <div className="flex items-center gap-2 text-gray-500 mt-3"><Loader2 className="animate-spin" size={18} /> Loading...</div> : (
                    <ul className="divide-y divide-gray-100 dark:divide-slate-800 mt-2">
                        {staff.map(s => {
                            const link = `${origin}/r/${s.slug}`;
                            return (
                                <li key={s.id} className={`py-4 ${s.active ? '' : 'opacity-60'}`}>
                                    <div className="flex flex-wrap items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold">{s.display_name} <span className="text-xs font-normal text-gray-500">{s.staff_code}{s.role ? ` · ${s.role}` : ''}</span></p>
                                            <p className="text-xs text-gray-500 break-all">{link}</p>
                                            <p className="text-xs mt-1">{s.user_id
                                                ? <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400"><UserCheck size={13} /> Login linked, can use the staff portal</span>
                                                : <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400"><UserX size={13} /> No login linked yet</span>}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(s.id); setTimeout(() => setCopied(null), 1500); }} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">{copied === s.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}</button>
                                            <button onClick={() => toggleActive(s)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">{s.active ? 'Deactivate' : 'Activate'}</button>
                                        </div>
                                    </div>
                                    {s.active && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <input type="email" value={linkEmail[s.id] || ''} onChange={e => setLinkEmail(m => ({ ...m, [s.id]: e.target.value }))} placeholder={s.user_id ? 'Change linked login (email)' : "Staff member's login email"} className={`${input} max-w-xs`} />
                                            <button onClick={() => linkLogin(s)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white"><KeyRound size={15} /> {s.user_id ? 'Re-link login' : 'Link login'}</button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                        {staff.length === 0 && <li className="py-4 text-sm text-gray-500">No staff members yet.</li>}
                    </ul>
                )}
                <p className="text-xs text-gray-500 mt-3">To give someone portal access: they register on the website with their email first, then enter that email here.</p>
            </div>

            <div className={`${card} p-5`}>
                <h2 className="font-bold">Students registered by staff</h2>
                <div className="overflow-x-auto mt-3">
                    <table className="w-full text-sm">
                        <thead><tr className="text-left text-xs uppercase text-gray-500"><th className="py-2">Date</th><th>Student</th><th>Contact</th><th>Programme</th><th>Registered by</th><th>Status</th></tr></thead>
                        <tbody>
                            {regs.map(r => (
                                <tr key={r.id} className="border-t border-gray-100 dark:border-slate-800">
                                    <td className="py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                                    <td className="font-medium">{r.full_name}</td>
                                    <td className="text-gray-500">+{r.phone}{r.email ? <><br />{r.email}</> : null}</td>
                                    <td>{r.course_title}{r.campaign ? <span className="block text-xs text-gray-500">{r.campaign}</span> : null}</td>
                                    <td>{nameOf(r.registered_by_staff_id)}</td>
                                    <td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === 'account_created' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{r.status === 'account_created' ? 'Account created' : 'Waiting to sign up'}</span></td>
                                </tr>
                            ))}
                            {regs.length === 0 && <tr><td colSpan={6} className="py-4 text-gray-500">No students registered by staff yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminStaff;
