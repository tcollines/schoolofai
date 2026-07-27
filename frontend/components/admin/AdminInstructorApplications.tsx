import React, { useState, useEffect } from 'react';
import { Check, X, FileText, Image, Loader, User, Eye, AlertCircle } from 'lucide-react';

const AdminInstructorApplications: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const email = localStorage.getItem('admin-email') || localStorage.getItem('auth_logged_in_email') || '';
            const res = await fetch('http://localhost:5001/api/instructor-applications', {
                headers: {
                    'X-User-Email': email
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch instructor applications.');
            setApplications(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleProcess = async (id: number, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this application?`)) return;
        setActionLoadingId(id);
        try {
            const email = localStorage.getItem('admin-email') || localStorage.getItem('auth_logged_in_email') || '';
            const res = await fetch(`http://localhost:5001/api/instructor-applications/${id}/${action}`, {
                method: 'POST',
                headers: {
                    'X-User-Email': email
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Failed to ${action} application.`);
            alert(`Application ${action}ed successfully!`);
            fetchApplications();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="p-6 space-y-6 text-left">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Instructor Requests</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Review and verify applications for instructor privileges.</p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 p-4 rounded-2xl text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/30">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center p-12">
                    <Loader className="animate-spin text-violet-600 dark:text-violet-400" size={32} />
                    <p className="text-xs text-gray-500 mt-2">Loading applications...</p>
                </div>
            ) : applications.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                    <p className="text-sm text-gray-400">No instructor applications found.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-850 border-b border-gray-150 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-bold">
                                    <th className="px-6 py-4">Applicant</th>
                                    <th className="px-6 py-4">Syllabus / Courses</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Applied On</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-855">
                                {applications.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                            <div className="flex flex-col">
                                                <span>{app.username}</span>
                                                <span className="text-xs text-gray-400 font-medium">{app.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-350 max-w-xs truncate font-medium">
                                            {app.courses}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                app.status === 'APPROVED'
                                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400'
                                                    : app.status === 'REJECTED'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-455'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-455'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-400 text-xs font-semibold">
                                            {formatDate(app.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedApp(app)}
                                                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                                                    title="View Files"
                                                >
                                                    <Eye size={14} />
                                                    View Files
                                                </button>

                                                {app.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            disabled={actionLoadingId === app.id}
                                                            onClick={() => handleProcess(app.id, 'approve')}
                                                            className="p-2 bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-950/20 dark:text-green-400 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            <Check size={14} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            disabled={actionLoadingId === app.id}
                                                            onClick={() => handleProcess(app.id, 'reject')}
                                                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold disabled:opacity-50"
                                                            title="Reject"
                                                        >
                                                            <X size={14} />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
                    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-lg font-bold">Verification Documents</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Submitted by {selectedApp.username} ({selectedApp.email})</p>
                            </div>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Passport Photo</span>
                                    <div className="border border-gray-150 dark:border-slate-850 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center min-h-[220px]">
                                        {selectedApp.passport_photo ? (
                                            <img src={selectedApp.passport_photo} alt="Passport Photo" className="w-full h-auto max-h-[300px] object-contain" />
                                        ) : (
                                            <p className="text-xs text-gray-400">No passport photo uploaded</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">National ID</span>
                                    <div className="border border-gray-150 dark:border-slate-850 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center min-h-[220px]">
                                        {selectedApp.national_id ? (
                                            <img src={selectedApp.national_id} alt="National ID" className="w-full h-auto max-h-[300px] object-contain" />
                                        ) : (
                                            <p className="text-xs text-gray-400">No National ID uploaded</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="px-6 py-2.5 border border-gray-250 dark:border-slate-800 rounded-xl text-gray-700 dark:text-slate-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInstructorApplications;
