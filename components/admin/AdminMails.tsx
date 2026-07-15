import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Trash2, Mail, MailOpen, Filter, Inbox, Check } from 'lucide-react';

const AdminMails: React.FC = () => {
    const [mails, setMails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'INQUIRY' | 'ENROLLMENT'>('ALL');

    const fetchMails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('mails')
                .select('*');
            if (error) throw error;
            
            // Sort by created_at descending (latest first)
            const sorted = (data || []).sort((a: any, b: any) => {
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
            const { error } = await supabase
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

    const filteredMails = mails.filter(m => {
        if (filter === 'ALL') return true;
        return m.type === filter;
    });

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm transition-colors">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Corporate Inbox</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Review corporate inquiries and enrollment requests</p>
                </div>
                
                {/* Filter Tabs */}
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-xl gap-1.5 self-stretch sm:self-auto">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`flex-1 sm:flex-none text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                            filter === 'ALL'
                                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        All ({mails.length})
                    </button>
                    <button
                        onClick={() => setFilter('INQUIRY')}
                        className={`flex-1 sm:flex-none text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                            filter === 'INQUIRY'
                                ? 'bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Inquiries ({mails.filter(m => m.type === 'INQUIRY').length})
                    </button>
                    <button
                        onClick={() => setFilter('ENROLLMENT')}
                        className={`flex-1 sm:flex-none text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                            filter === 'ENROLLMENT'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Enrollments ({mails.filter(m => m.type === 'ENROLLMENT').length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-500">Loading inbox...</div>
            ) : filteredMails.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm space-y-4 max-w-xl mx-auto transition-colors">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-850 text-gray-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto">
                        <Inbox size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Your inbox is clean</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">No corporate messages found for this filter.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredMails.map((m) => (
                        <div 
                            key={m.id} 
                            className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6 hover:shadow-md transition-all duration-200"
                        >
                            <div className="space-y-4 flex-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border ${
                                        m.type === 'INQUIRY'
                                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50'
                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50'
                                    }`}>
                                        {m.type === 'INQUIRY' ? 'Inquiry' : 'Enrollment Request'}
                                    </span>
                                    
                                    <span className="text-xs text-gray-400">{formatDate(m.created_at)}</span>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                        {m.name}
                                        <span className="text-xs text-gray-400 font-normal">({m.email})</span>
                                    </h3>
                                    {m.company_name && (
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                                            🏢 Company: {m.company_name}
                                        </p>
                                    )}
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-slate-850 rounded-xl border dark:border-slate-800 text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                                    {m.message}
                                </div>
                            </div>

                            <div className="flex md:flex-col justify-end w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 dark:border-slate-850">
                                <button 
                                    onClick={() => handleDeleteMail(m.id)}
                                    className="p-2.5 bg-red-50 hover:bg-red-150 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                                    title="Delete Message"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminMails;
