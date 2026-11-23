import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { Trash2, Mail, Inbox, Building, Reply, Search } from 'lucide-react';

const AdminMails: React.FC = () => {
    const [mails, setMails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'INQUIRY' | 'ENROLLMENT'>('ALL');
    const [expandedMailIds, setExpandedMailIds] = useState<Set<string>>(new Set());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const toggleMailExpand = (id: string) => {
        const newExpanded = new Set(expandedMailIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedMailIds(newExpanded);
    };

    const fetchMails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabaseClient
                .from('mails')
                .select('*');
            if (error) throw error;
            
            // Sort by created_at descending (latest first), excluding internal system config rows
            const visibleMails = (data || []).filter(
                (m: any) =>
                    m.type !== 'SYSTEM_CONFIG' &&
                    m.email !== 'outreach-config@system.welile.com' &&
                    m.email !== 'outreach-staff@system.welile.com'
            );
            const sorted = visibleMails.sort((a: any, b: any) => {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            });
            setMails(sorted);
        } catch (err) {
            console.error('Error fetching mails:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMails();
        window.addEventListener('new-mail-notification', fetchMails);
        return () => window.removeEventListener('new-mail-notification', fetchMails);
    }, []);

    const handleDeleteMail = async (id: string) => {
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            const { error } = await supabaseClient
                .from('mails')
                .delete()
                .eq('id', id);
            if (error) throw error;
            alert("Message deleted successfully.");
            fetchMails();
        } catch (err) {
            console.error('Error deleting mail:', err);
            alert("Failed to delete message.");
        }
    };

    const clean = (msg?: string) => (msg || '').replace(/\n?<!--OUTREACH_JSON:[\s\S]*?-->/, '');
    const q = query.trim().toLowerCase();
    const filteredMails = mails.filter(m => (filter === 'ALL' || m.type === filter) && (!q || `${m.name} ${m.email} ${m.company_name || ''} ${clean(m.message)}`.toLowerCase().includes(q)));
    const selected = filteredMails.find(m => m.id === selectedId) || filteredMails[0] || null;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    const kindLabel = (t: string) => (t === 'INQUIRY' ? 'Inquiry' : 'Enrollment request');
    const kindTone = (t: string) => (t === 'INQUIRY' ? 'bg-brand-soft text-brand-ink dark:bg-night-3 dark:text-violet-200' : 'bg-lime-100 text-lime-900');
    const ini = (n?: string) => (n || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const tabs: { id: 'ALL' | 'INQUIRY' | 'ENROLLMENT'; label: string; n: number }[] = [
        { id: 'ALL', label: 'All', n: mails.length },
        { id: 'INQUIRY', label: 'Inquiries', n: mails.filter(m => m.type === 'INQUIRY').length },
        { id: 'ENROLLMENT', label: 'Enrollment requests', n: mails.filter(m => m.type === 'ENROLLMENT').length },
    ];

    return (
        <div className="flex flex-col gap-[18px]">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[260px]">
                    <p className="m-0 text-[12px] font-extrabold tracking-[0.12em] uppercase text-brand dark:text-violet-300">Mails</p>
                    <h1 className="m-0 mt-0.5 text-[28px] font-extrabold tracking-[-0.02em]">Corporate inbox</h1>
                    <p className="m-0 mt-1 text-[13px] text-[#6B6680] dark:text-slate-400">Business quote requests and enrollment messages from the website</p>
                </div>
                <div role="group" aria-label="Filter" className="inline-flex p-[3px] gap-0.5 rounded-[11px] bg-[#F1EFF6] dark:bg-night-3">
                    {tabs.map(t => (
                        <button key={t.id} type="button" aria-pressed={filter === t.id} onClick={() => setFilter(t.id)}
                            className={`h-[34px] px-3 rounded-[9px] text-[12px] ${filter === t.id ? 'bg-white dark:bg-night-2 font-extrabold shadow-[0_1px_3px_rgba(30,27,46,0.12)]' : 'font-semibold text-[#6B6680] dark:text-slate-400'}`}>
                            {t.label} ({t.n})
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-[#6B6680]">Loading inbox…</div>
            ) : filteredMails.length === 0 ? (
                <div className="bg-white dark:bg-night-2 rounded-[22px] p-14 text-center">
                    <span className="mx-auto w-16 h-16 rounded-[20px] bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 flex items-center justify-center"><Inbox size={30} /></span>
                    <h4 className="m-0 mt-4 text-[18px] font-extrabold">Your inbox is clean</h4>
                    <p className="m-0 mt-1 text-[13px] text-[#6B6680] dark:text-slate-400">No messages for this filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-4 items-start">
                    <section aria-label="Messages" className="bg-white dark:bg-night-2 rounded-[22px] overflow-hidden">
                        <div className="p-3.5 border-b border-[#F1EFF6] dark:border-night-3">
                            <label className="flex items-center gap-2.5 h-[42px] px-3.5 rounded-[12px] bg-panel dark:bg-night-3 text-[#6B6680]">
                                <Search size={16} />
                                <input type="search" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search messages" placeholder="Search messages" className="flex-1 min-w-0 border-0 outline-0 bg-transparent text-[13px] text-ink dark:text-white" />
                            </label>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto">
                            {filteredMails.map(m => {
                                const on = selected?.id === m.id;
                                return (
                                    <button key={m.id} type="button" onClick={() => { setSelectedId(m.id); toggleMailExpand(m.id); }} aria-pressed={on}
                                        className={`w-full text-left flex items-start gap-3 p-3.5 border-t border-[#F4F2F9] dark:border-night-3 first:border-t-0 ${on ? 'bg-brand-soft dark:bg-night-3 shadow-[inset_4px_0_0_#5B2BC4]' : 'hover:bg-panel dark:hover:bg-night-3/50'}`}>
                                        <span className="w-10 h-10 rounded-full bg-brand-soft dark:bg-night text-brand dark:text-violet-300 text-[13px] font-extrabold inline-flex items-center justify-center shrink-0">{ini(m.name)}</span>
                                        <span className="flex-1 min-w-0">
                                            <span className="flex items-center gap-2"><span className="flex-1 text-[14px] font-extrabold truncate">{m.name}</span><span className="text-[11px] text-[#6B6680] shrink-0">{formatDate(m.created_at)}</span></span>
                                            <span className="block text-[12px] text-[#4A4560] dark:text-slate-300 truncate">{m.company_name ? `${m.company_name} · ` : ''}{clean(m.message).slice(0, 90) || 'Empty message'}</span>
                                            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${kindTone(m.type)}`}>{kindLabel(m.type)}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {selected && (
                        <section aria-label="Message" className="bg-white dark:bg-night-2 rounded-[22px] p-6 flex flex-col gap-4">
                            <div className="flex items-start gap-3.5">
                                <span className="w-[52px] h-[52px] rounded-full bg-brand text-white text-[17px] font-extrabold inline-flex items-center justify-center shrink-0">{ini(selected.name)}</span>
                                <div className="flex-1 min-w-0">
                                    <h2 className="m-0 text-[20px] font-extrabold tracking-[-0.01em]">{selected.name}</h2>
                                    <p className="m-0 mt-0.5 text-[13px] text-[#6B6680] dark:text-slate-400 break-all">{selected.email} · {formatDate(selected.created_at)}</p>
                                    {selected.company_name && <p className="m-0 mt-1 text-[13px] font-bold text-brand dark:text-violet-300 flex items-center gap-1.5"><Building size={14} />{selected.company_name}</p>}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${kindTone(selected.type)}`}>{kindLabel(selected.type)}</span>
                            </div>
                            <div className="rounded-[18px] bg-panel dark:bg-night-3/60 p-5 text-[14px] leading-relaxed whitespace-pre-wrap">{clean(selected.message) || 'Empty message'}</div>
                            <div className="flex flex-wrap gap-2">
                                <a href={`mailto:${selected.email}?subject=${encodeURIComponent('Re: your message to Welile School of AI')}`} className="press h-11 px-4 rounded-[12px] bg-brand text-white text-[13px] font-extrabold inline-flex items-center gap-2 no-underline"><Reply size={16} />Reply by email</a>
                                <span className="flex-1" />
                                <button type="button" onClick={() => handleDeleteMail(selected.id)} className="press h-11 px-4 rounded-[12px] bg-[#FDECE8] text-[#A3321F] text-[13px] font-bold inline-flex items-center gap-2"><Trash2 size={16} />Delete</button>
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminMails;
