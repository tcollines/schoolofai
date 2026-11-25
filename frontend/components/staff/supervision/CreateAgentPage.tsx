import React from 'react';
import { AlertTriangle, Check, CheckCircle2, Copy, KeyRound, Loader2, MessageCircle, UserPlus } from 'lucide-react';
import { BTN_PRIMARY, CARD, MUTED } from '../../learn/learnUi';
import { fieldAgentCredentialsMessage, generateTempPassword, whatsappShare } from '../../../src/lib/staffApi';
import { INPUT } from './shared';
import { useSupervision } from './SupervisionContext';
import MakeStudentAgent from './MakeStudentAgent';

/** Page 3: create a non-student field agent, and activate or deactivate existing agents. */
const CreateAgentPage: React.FC = () => {
    const {
        handleCreateFieldAgent, createdAgent, copyText, copiedKey, newName, setNewName, newEmail, setNewEmail,
        newPhone, setNewPhone, newRole, setNewRole, newPassword, setNewPassword, createError, creating,
        sortedAgents, togglingId, handleToggleActive,
    } = useSupervision();

    return (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
            <MakeStudentAgent />
            <form onSubmit={handleCreateFieldAgent} className={`${CARD} rounded-2xl p-6 space-y-4`}>
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Non-Student Field Agent
                    </span>
                    <h2 className="font-serif text-xl font-bold mt-2">Add agent: Field-Only Agent</h2>
                    <p className={`text-sm mt-1 ${MUTED}`}>
                        Creates a dedicated field officer account (not enrolled as a student). When they sign in, they go straight to an ultra-simple <strong>3-field registration form</strong> (Name, Phone Number, Location) and their personal stats.
                    </p>
                </div>

                {createdAgent && (
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                                    {createdAgent.name} is ready to register students!
                                </p>
                                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                                    Their email is already confirmed — they can log in immediately at <span className="font-mono">{window.location.origin}/login</span>.
                                </p>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 p-3 text-xs space-y-1 font-mono">
                            <div>Email: <b>{createdAgent.email}</b></div>
                            <div>Temporary Password: <b>{createdAgent.password}</b></div>
                            {createdAgent.staff_code && <div>Agent Code: <b>{createdAgent.staff_code}</b></div>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => copyText(fieldAgentCredentialsMessage(createdAgent.name, createdAgent.email, createdAgent.password, createdAgent.staff_code), 'creds')}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                            >
                                {copiedKey === 'creds' ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Login Details</>}
                            </button>
                            <a
                                href={whatsappShare(
                                    fieldAgentCredentialsMessage(createdAgent.name, createdAgent.email, createdAgent.password, createdAgent.staff_code),
                                    createdAgent.phone ? (createdAgent.phone.replace(/\D/g, '').startsWith('0') ? '256' + createdAgent.phone.replace(/\D/g, '').slice(1) : createdAgent.phone.replace(/\D/g, '')) : null
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60"
                            >
                                <MessageCircle size={14} /> Send on WhatsApp
                            </a>
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="fa-name" className="block text-sm font-semibold mb-1">Full Name *</label>
                    <input id="fa-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Sarah Nakato" className={INPUT} required />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="fa-email" className="block text-sm font-semibold mb-1">Login Email *</label>
                        <input id="fa-email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="sarah@example.com" className={INPUT} required />
                    </div>
                    <div>
                        <label htmlFor="fa-phone" className="block text-sm font-semibold mb-1">Phone Number</label>
                        <input id="fa-phone" type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="07XX XXX XXX" className={INPUT} />
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="fa-role" className="block text-sm font-semibold mb-1">Title / Role</label>
                        <input id="fa-role" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Field Agent" className={INPUT} />
                    </div>
                    <div>
                        <label htmlFor="fa-pass" className="block text-sm font-semibold mb-1">Temporary Password *</label>
                        <div className="flex gap-2">
                            <input id="fa-pass" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`${INPUT} font-mono`} required />
                            <button
                                type="button"
                                onClick={() => setNewPassword(generateTempPassword())}
                                className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800"
                            >
                                <KeyRound size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {createError && (
                    <p role="alert" className="text-sm text-red-600 flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {createError}
                    </p>
                )}

                <button type="submit" disabled={creating} className={`${BTN_PRIMARY} w-full`}>
                    {creating ? <><Loader2 className="animate-spin" size={17} /> Creating Field Agent...</> : <><UserPlus size={17} /> Create Field-Only Agent</>}
                </button>
            </form>

            {/* Existing Agents Roster + Activate/Deactivate */}
            <div className={`${CARD} rounded-2xl p-6 space-y-4`}>
                <div>
                    <h2 className="font-serif text-xl font-bold">Manage Field Officers</h2>
                    <p className={`text-xs mt-1 ${MUTED}`}>
                        All active and inactive agents across Welile School of AI.
                    </p>
                </div>
                <ul className="divide-y divide-stone-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
                    {sortedAgents.map(a => (
                        <li key={a.id} className={`py-3 flex items-center justify-between gap-3 ${a.active ? '' : 'opacity-55'}`}>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="font-semibold text-sm truncate">{a.name}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        a.agent_type === 'field_only'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            : 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300'
                                    }`}>
                                        {a.agent_type === 'field_only' ? 'Field-Only' : 'Student Agent'}
                                    </span>
                                </div>
                                <p className={`text-xs truncate ${MUTED}`}>
                                    {[a.email, a.staff_code, `${a.registered} registered`].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={togglingId === a.id}
                                onClick={() => void handleToggleActive(a)}
                                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800"
                            >
                                {togglingId === a.id ? '...' : a.active ? 'Deactivate' : 'Activate'}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CreateAgentPage;
