import React, { useState, useEffect } from 'react';
import { mysqlClient } from '../../src/lib/mysqlClient';
import { Trash2, Mail, MailOpen, Filter, Inbox, Check } from 'lucide-react';

const AdminMails: React.FC = () => {
    const [mails, setMails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'INQUIRY' | 'ENROLLMENT' | 'APPLICATION'>('ALL');
    const [expandedMailIds, setExpandedMailIds] = useState<Set<string>>(new Set());

    const toggleMailExpand = (id: string) => {
        const newExpanded = new Set(expandedMailIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedMailIds(newExpanded);
    };

    const [applicationsMap, setApplicationsMap] = useState<Record<string, any>>({});

    const fetchMails = async () => {
        setLoading(true);
        try {
            const { data, error } = await mysqlClient
                .from('mails')
                .select('*');
            if (error) throw error;
            
            // Also fetch instructor applications list to enrich mails with DB document files
            const appMap: Record<string, any> = {};
            try {
                const appRes = await fetch('http://localhost:5001/api/instructor-applications');
                const appsList = await appRes.json();
                if (Array.isArray(appsList)) {
                    appsList.forEach((a: any) => {
                        if (a.email) {
                            appMap[a.email.toLowerCase()] = a;
                        }
                    });
                }
            } catch (e) {}
            setApplicationsMap(appMap);

            // Filter out system auto-reply logs (e.g. subject containing "Application Received")
            const userMails = (data || []).filter((m: any) => {
                if (m.subject && m.subject.includes('Application Received')) return false;
                if (m.body && m.body.includes('Application Received!')) return false;
                return true;
            });

            // Sort by created_at descending (latest first)
            const sorted = userMails.sort((a: any, b: any) => {
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
            const { error } = await mysqlClient
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

    const handleClearInbox = async () => {
        if (!confirm("Are you sure you want to delete all messages in your inbox? This cannot be undone.")) return;
        try {
            const { error } = await mysqlClient
                .from('mails')
                .delete();
            if (error) throw error;
            alert("Inbox cleared successfully.");
            fetchMails();
        } catch (err) {
            console.error('Error clearing inbox:', err);
            alert("Failed to clear inbox.");
        }
    };

    const filteredMails = mails.filter(m => {
        if (filter === 'ALL') return true;
        if (filter === 'APPLICATION') {
            return m.type === 'APPLICATION' || m.subject === 'APPLICATION' || m.subject?.includes('Instructor Request');
        }
        return m.type === filter;
    });

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const subjectIsApp = (subject?: string) => {
        if (!subject) return false;
        const s = subject.toUpperCase();
        return s.includes('APPLICATION') || s.includes('INSTRUCTOR');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm transition-colors">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Corporate Inbox</h2>
                    <p className="text-xs text-gray-550 dark:text-slate-400 mt-1">Review corporate inquiries and enrollment requests</p>
                </div>
                
                {/* Filter Tabs & Clear Inbox */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-stretch sm:self-auto">
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-xl gap-1.5 flex-1 sm:flex-none">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`flex-1 sm:flex-none text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                                filter === 'ALL'
                                    ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                                    : 'text-gray-550 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            All ({mails.length})
                        </button>
                        <button
                            onClick={() => setFilter('INQUIRY')}
                            className={`flex-1 sm:flex-none text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                                filter === 'INQUIRY'
                                    ? 'bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 shadow-sm'
                                    : 'text-gray-550 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Inquiries ({mails.filter(m => m.type === 'INQUIRY').length})
                        </button>
                        <button
                            onClick={() => setFilter('ENROLLMENT')}
                            className={`flex-1 sm:flex-none text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                                filter === 'ENROLLMENT'
                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-550 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Enrollments ({mails.filter(m => m.type === 'ENROLLMENT').length})
                        </button>
                        <button
                            onClick={() => setFilter('APPLICATION')}
                            className={`flex-1 sm:flex-none text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                                filter === 'APPLICATION'
                                    ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                                    : 'text-gray-550 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Applications ({mails.filter(m => m.type === 'APPLICATION').length})
                        </button>
                    </div>

                    {mails.length > 0 && (
                        <button
                            onClick={handleClearInbox}
                            className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/35 border border-red-200 dark:border-red-800/40 text-red-650 dark:text-red-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                        >
                            <Trash2 size={14} /> Clear Inbox
                        </button>
                    )}
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
                        <p className="text-xs text-gray-550 dark:text-slate-400 mt-1">No corporate messages found for this filter.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredMails.map((m) => {
                        const isExpanded = expandedMailIds.has(m.id);
                        
                        let parsedPayload: any = null;
                        try {
                            parsedPayload = typeof m.body === 'string' ? JSON.parse(m.body) : m.body;
                        } catch (e) {
                            parsedPayload = null;
                        }

                        const rawEmail = parsedPayload?.email || m.sender_email || m.email || '';
                        const email = rawEmail.replace(/.*<([^>]+)>.*/, '$1').trim();
                        const matchedApp = applicationsMap[email.toLowerCase()] || applicationsMap[m.sender_email?.toLowerCase()] || null;

                        const name = parsedPayload?.name || matchedApp?.username || m.name || m.sender_email?.split('@')[0] || 'Applicant';
                        const courses = parsedPayload?.courses || matchedApp?.courses || (m.company_name ? m.company_name.replace('Courses: ', '') : '');
                        const passportPhoto = parsedPayload?.passportPhoto || matchedApp?.passport_photo;
                        const nationalId = parsedPayload?.nationalId || matchedApp?.national_id;
                        const appStatus = matchedApp?.status || parsedPayload?.status || 'PENDING';
                        const isAppMail = m.type === 'APPLICATION' || parsedPayload?.type === 'APPLICATION' || subjectIsApp(m.subject) || !!matchedApp;

                        const handleProcessApp = async (action: 'approve' | 'reject') => {
                            if (!confirm(`Are you sure you want to ${action} this instructor application?`)) return;
                            try {
                                // Find application ID if available, or fetch applications list
                                let appId = parsedPayload?.applicationId;
                                if (!appId) {
                                    const appRes = await fetch('http://localhost:5001/api/instructor-applications');
                                    const appsData = await appRes.json();
                                    const match = (appsData || []).find((a: any) => a.email.toLowerCase() === email.toLowerCase());
                                    if (match) appId = match.id;
                                }

                                if (!appId) {
                                    alert('Application record not found in database.');
                                    return;
                                }

                                const res = await fetch(`http://localhost:5001/api/instructor-applications/${appId}/${action}`, {
                                    method: 'POST'
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error || `Failed to ${action} application.`);

                                alert(`Application ${action === 'approve' ? 'approved' : 'declined'} successfully!`);
                                fetchMails();
                            } catch (err: any) {
                                alert(err.message || 'An error occurred.');
                            }
                        };

                        return (
                            <div 
                                key={m.id} 
                                onClick={() => toggleMailExpand(m.id)}
                                className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between items-start gap-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gray-50/30 dark:hover:bg-slate-850/10"
                            >
                                <div className="space-y-4 w-full">
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
                                        <div className="flex items-center gap-2.5">
                                            <div className="text-gray-400 dark:text-slate-500">
                                                {isExpanded ? <MailOpen size={16} className="text-violet-500 dark:text-violet-400" /> : <Mail size={16} />}
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border ${
                                                m.type === 'INQUIRY'
                                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50'
                                                    : isAppMail
                                                    ? 'bg-violet-50 text-violet-750 border-violet-200 dark:bg-violet-955/20 dark:text-violet-400 dark:border-violet-900/50'
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50'
                                            }`}>
                                                {m.type === 'INQUIRY' ? 'Inquiry' : isAppMail ? 'Application' : 'Enrollment Request'}
                                            </span>
                                            
                                            {isAppMail && (
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    appStatus === 'APPROVED'
                                                        ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300'
                                                        : appStatus === 'REJECTED' || appStatus === 'DECLINED'
                                                        ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                                                        : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                                                }`}>
                                                    {appStatus}
                                                </span>
                                            )}

                                            <span className="text-xs text-gray-400">{formatDate(m.created_at)}</span>
                                        </div>

                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {isAppMail && appStatus === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleProcessApp('approve')}
                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Check size={14} /> Approve User
                                                    </button>
                                                    <button
                                                        onClick={() => handleProcessApp('reject')}
                                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                                    >
                                                        Decline
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteMail(m.id)}
                                                className="p-2 bg-red-50 hover:bg-red-150 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                                                title="Delete Message"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap text-sm sm:text-base">
                                            {name}
                                            <span className="text-xs text-gray-500 dark:text-slate-400 font-normal">({email})</span>
                                        </h3>
                                        {courses && (
                                            <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold mt-1">
                                                📚 Courses to teach: {courses}
                                            </p>
                                        )}
                                    </div>

                                    {/* Document Previews Section */}
                                    {isAppMail && (passportPhoto || nationalId) && (
                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-850 rounded-xl border border-gray-150 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                                            {passportPhoto && (
                                                <div className="space-y-1.5">
                                                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                                                        📷 Passport Photo:
                                                    </span>
                                                    <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                                                        <img src={passportPhoto} alt="Passport Photo" className="w-full h-32 object-cover rounded" />
                                                        <a href={passportPhoto} target="_blank" rel="noreferrer" className="mt-1 block text-[11px] text-center font-bold text-violet-600 dark:text-violet-400 hover:underline">
                                                            Open Full Image
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {nationalId && (
                                                <div className="space-y-1.5">
                                                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                                                        🪪 National ID / ID Card:
                                                    </span>
                                                    <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                                                        {nationalId.startsWith('data:image') ? (
                                                            <img src={nationalId} alt="National ID" className="w-full h-32 object-cover rounded" />
                                                        ) : (
                                                            <div className="w-full h-32 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded text-xs font-bold text-gray-600 dark:text-slate-400">
                                                                Document File (PDF / ID)
                                                            </div>
                                                        )}
                                                        <a href={nationalId} target="_blank" rel="noreferrer" className="mt-1 block text-[11px] text-center font-bold text-violet-600 dark:text-violet-400 hover:underline">
                                                            View Document
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isExpanded && (
                                        <div className="p-4 bg-gray-50 dark:bg-slate-850 rounded-xl border dark:border-slate-800 text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap animate-in fade-in duration-200">
                                            {(() => {
                                                const rawMsg = parsedPayload?.message || m.message || m.body || '';
                                                if (rawMsg.trim().startsWith('<')) {
                                                    return rawMsg.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
                                                }
                                                return rawMsg;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminMails;
