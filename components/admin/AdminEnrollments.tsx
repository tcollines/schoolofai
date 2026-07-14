import React, { useState } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { UserRole } from '../../types';
import { Trash2, Check, Edit2, X } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';

const AdminEnrollments: React.FC = () => {
    const { users, courses, enrollments, loading, updateUserRole, deleteUser, verifyAndIssueCertificate, releaseExamMarks, refresh } = useAdmin(true);

    const [editingScores, setEditingScores] = useState<{
        userId: string;
        courseId: string;
        studentName: string;
        courseTitle: string;
        quizScore: number;
        examScore: number;
    } | null>(null);

    const handleSaveScores = async () => {
        if (!editingScores) return;
        try {
            const finalScore = Math.round((editingScores.quizScore + editingScores.examScore) / 2);
            const { error } = await supabase
                .from('enrollments')
                .update({
                    quiz_score: editingScores.quizScore,
                    exam_score: editingScores.examScore,
                    final_score: finalScore
                })
                .eq('user_id', editingScores.userId)
                .eq('course_id', editingScores.courseId);

            if (error) throw error;
            alert("Scores successfully updated and graded!");
            setEditingScores(null);
            await refresh();
        } catch (err) {
            console.error(err);
            alert("Failed to save scores.");
        }
    };

    const handleApproveUpgrade = async (u: any) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    role: u.pending_role,
                    pending_role: null,
                    pending_txid: null,
                    pending_screenshot: null
                })
                .eq('id', u.id);

            if (error) throw error;

            window.dispatchEvent(new Event('profile-update'));

            const notifKey = `portal-notifications-${u.email}`;
            const stored = localStorage.getItem(notifKey);
            const list = stored ? JSON.parse(stored) : [];
            
            const recommendation = u.pending_role === 'PLUS'
                ? "Since you upgraded to Plus, consider checking out the PRO plan to get unlimited AI Tutor support and complete course access!"
                : "You're now on our highest Pro plan! Explore advanced modules and ask our AI Tutor anything.";

            const newItem = {
                id: 'notif-' + Date.now(),
                title: "Payment Verified Successfully!",
                description: `Your payment has been successfully verified by our admin team. Welcome to the ${u.pending_role} plan! We appreciate your support. ${recommendation}`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'payment'
            };
            localStorage.setItem(notifKey, JSON.stringify([newItem, ...list]));
            window.dispatchEvent(new Event('notifications-update'));

            window.dispatchEvent(new CustomEvent('payment-verified-alert', {
                detail: {
                    planName: u.pending_role,
                    recommendation
                }
            }));

            alert(`Upgrade request approved and role updated to ${u.pending_role}!`);
        } catch (err: any) {
            console.error(err);
            alert('Failed to approve upgrade.');
        }
    };

    const handleDeclineUpgrade = async (u: any) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    pending_role: null,
                    pending_txid: null,
                    pending_screenshot: null
                })
                .eq('id', u.id);

            if (error) throw error;

            window.dispatchEvent(new Event('profile-update'));

            const notifKey = `portal-notifications-${u.email}`;
            const stored = localStorage.getItem(notifKey);
            const list = stored ? JSON.parse(stored) : [];
            const newItem = {
                id: 'notif-' + Date.now(),
                title: "Upgrade Request Declined",
                description: `Your upgrade request for plan ${u.pending_role} was declined by admin. Please verify your payment transaction ID or screenshot receipt and try again.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'payment'
            };
            localStorage.setItem(notifKey, JSON.stringify([newItem, ...list]));
            window.dispatchEvent(new Event('notifications-update'));

            alert('Upgrade request declined.');
        } catch (err: any) {
            console.error(err);
            alert('Failed to decline upgrade.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading directory...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Student Directory</h2>
                <div className="text-sm text-gray-500">Total: {users.length} registered</div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-4 px-6 border-b border-gray-200">Name</th>
                            <th className="py-4 px-6 border-b border-gray-200">Email</th>
                            <th className="py-4 px-6 border-b border-gray-200">Subscription Plan</th>
                            <th className="py-4 px-6 border-b border-gray-200 text-right">Wallet Balance</th>
                            <th className="py-4 px-6 border-b border-gray-200 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 shrink-0 flex items-center justify-center text-xs font-bold border border-violet-200 dark:border-violet-850">
                                        {u.avatar ? (
                                            <img 
                                                src={u.avatar} 
                                                alt={u.name} 
                                                className="w-full h-full object-cover" 
                                                style={{
                                                    transform: `scale(${u.avatarScale || 1}) translate(${u.avatarPositionX || 0}px, ${u.avatarPositionY || 0}px)`,
                                                    transformOrigin: 'center center'
                                                }}
                                            />
                                        ) : (
                                            <span>{u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    {u.name}
                                </td>
                                <td className="py-4 px-6 text-gray-500 text-sm">{u.email}</td>
                                <td className="py-4 px-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                                        u.role === UserRole.INDIVIDUAL ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' :
                                        u.role === UserRole.PLUS ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50' :
                                        u.role === UserRole.PRO ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-900/50' :
                                        u.role === UserRole.SPONSORED ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50' :
                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                                    }`}>
                                        {u.role === UserRole.INDIVIDUAL ? 'BASIC' : u.role}
                                    </span>

                                    {u.pending_role && (
                                         <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-450 p-2.5 rounded-xl border border-yellow-100 dark:border-yellow-900/30 flex flex-col gap-1.5 items-start max-w-[190px]">
                                             <span className="font-bold">Pending: {u.pending_role}</span>
                                             <span className="text-[10px] text-gray-550 dark:text-slate-400 font-mono break-all select-all">TxID: {u.pending_txid}</span>
                                             {u.pending_screenshot && u.pending_screenshot.startsWith('data:image') && (
                                                 <a href={u.pending_screenshot} target="_blank" rel="noreferrer" className="text-[10px] text-purple-600 hover:underline flex items-center gap-1 font-semibold">
                                                     View Receipt Image
                                                 </a>
                                             )}
                                             <div className="flex gap-1.5 mt-1 w-full">
                                                 <button 
                                                     onClick={() => handleApproveUpgrade(u)}
                                                     className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold cursor-pointer text-center transition-colors"
                                                 >
                                                     Verify
                                                 </button>
                                                 <button 
                                                     onClick={() => handleDeclineUpgrade(u)}
                                                     className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer text-center transition-colors"
                                                 >
                                                     Decline
                                                 </button>
                                             </div>
                                         </div>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-right font-medium text-gray-700">
                                    ${u.walletBalance?.toFixed(2) || '0.00'}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex items-center justify-center gap-3">
                                        <select
                                            value={u.role}
                                            onChange={async (e) => {
                                                try {
                                                    await updateUserRole(u.id, e.target.value as UserRole);
                                                    alert('Subscription plan updated successfully!');
                                                } catch (err: any) {
                                                    alert('Failed to update subscription plan.');
                                                }
                                            }}
                                            className="text-xs bg-gray-55 border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-750 cursor-pointer"
                                        >
                                            <option value={UserRole.INDIVIDUAL}>BASIC</option>
                                            <option value={UserRole.PRO}>PRO</option>
                                            <option value={UserRole.ADMIN}>ADMIN</option>
                                        </select>
                                        <button
                                            onClick={async () => {
                                                if (u.role === UserRole.ADMIN) {
                                                    const { data: { session } } = await supabase.auth.getSession();
                                                    const currentAdminEmail = session?.user?.email;
                                                    
                                                    const password = prompt(
                                                        `Security Authentication Required\n\nYou are attempting to delete an Administrator account (${u.name || u.email}).\nThis action is high risk and requires password verification.\n\nPlease enter YOUR Admin password to authenticate:`
                                                    );
                                                    
                                                    if (!password) {
                                                        alert("Deletion cancelled.");
                                                        return;
                                                    }

                                                    const { error: authError } = await supabase.auth.signInWithPassword({
                                                        email: currentAdminEmail || '',
                                                        password: password
                                                    });

                                                    if (authError) {
                                                        alert("Authentication failed! Incorrect password. Deletion aborted.");
                                                        return;
                                                    }
                                                } else {
                                                    if (!confirm(`Are you sure you want to delete student ${u.name || u.email}? This action is irreversible.`)) {
                                                        return;
                                                    }
                                                }

                                                try {
                                                    await deleteUser(u.id);
                                                    alert('User deleted successfully!');
                                                    
                                                    const { data: { session } } = await supabase.auth.getSession();
                                                    if (session?.user?.id === u.id) {
                                                        await supabase.auth.signOut();
                                                        window.location.href = '/';
                                                    }
                                                } catch (err: any) {
                                                    alert('Failed to delete user.');
                                                }
                                            }}
                                            className="p-1.5 text-red-500 hover:bg-red-55 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Certificates Management Section */}
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Exam Submissions & Certificates</h2>
                    <div className="text-sm text-gray-500">
                        Total: {enrollments.filter(e => e.exam_completed).length} completed exams
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                            <tr className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                <th className="py-4 px-6 border-b border-gray-200">Student</th>
                                <th className="py-4 px-6 border-b border-gray-200">Course</th>
                                <th className="py-4 px-6 border-b border-gray-200 text-center">Quiz Score</th>
                                <th className="py-4 px-6 border-b border-gray-200 text-center">Exam Score</th>
                                <th className="py-4 px-6 border-b border-gray-200 text-center">Final Score</th>
                                <th className="py-4 px-6 border-b border-gray-200 text-center">Marks Status</th>
                                <th className="py-4 px-6 border-b border-gray-200">Certificate File / URL</th>
                                <th className="py-4 px-6 border-b border-gray-200 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {enrollments.filter(e => e.exam_completed).length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 px-6 text-center text-gray-500 text-sm">
                                        No exam completions or issued certificates found.
                                    </td>
                                </tr>
                            ) : (
                                enrollments.filter(e => e.exam_completed).map(e => {
                                    const student = users.find(u => u.id === e.user_id);
                                    const course = courses.find(c => c.id === e.course_id);
                                    if (!student || !course) return null;

                                    const qScore = e.quiz_score !== undefined ? Number(e.quiz_score) : 0;
                                    const exScore = e.exam_score !== undefined ? Number(e.exam_score) : 100;
                                    const fScore = e.final_score !== undefined ? Number(e.final_score) : Math.round((qScore + exScore) / 2);

                                    return (
                                        <tr key={`${e.user_id}-${e.course_id}`} className="hover:bg-gray-55 transition-colors">
                                            <td className="py-4 px-6 font-medium text-gray-900">
                                                <div className="flex flex-col">
                                                    <span>{student.name}</span>
                                                    <span className="text-xs text-gray-500 font-normal">{student.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-700 text-sm font-medium">{course.title}</td>
                                            
                                            {/* Quiz Score with inline edit trigger */}
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-1.5 group/score">
                                                    <span className="px-2.5 py-1 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-350 font-bold rounded-lg text-xs">
                                                        {qScore}%
                                                    </span>
                                                    <button 
                                                        onClick={() => setEditingScores({
                                                            userId: e.user_id,
                                                            courseId: e.course_id,
                                                            studentName: student.name,
                                                            courseTitle: course.title,
                                                            quizScore: qScore,
                                                            examScore: exScore
                                                        })}
                                                        className="p-1 text-gray-400 hover:text-purple-600 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover/score:opacity-100 focus:opacity-100 cursor-pointer"
                                                        title="Edit Scores"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Exam Score with inline edit trigger */}
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-1.5 group/score">
                                                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-955/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-lg text-xs">
                                                        {exScore}%
                                                    </span>
                                                    <button 
                                                        onClick={() => setEditingScores({
                                                            userId: e.user_id,
                                                            courseId: e.course_id,
                                                            studentName: student.name,
                                                            courseTitle: course.title,
                                                            quizScore: qScore,
                                                            examScore: exScore
                                                        })}
                                                        className="p-1 text-gray-400 hover:text-purple-600 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover/score:opacity-100 focus:opacity-100 cursor-pointer"
                                                        title="Edit Scores"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Calculated Final Score */}
                                            <td className="py-4 px-6 text-center">
                                                <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-955/40 text-purple-700 dark:text-purple-400 font-extrabold rounded-lg text-xs">
                                                    {fScore}%
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-center">
                                                {e.exam_marks_released ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-455 font-bold bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/50">
                                                        <Check size={12} /> Released
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await releaseExamMarks(e.user_id, e.course_id);
                                                                alert("Exam marks released to the student successfully!");
                                                            } catch (err: any) {
                                                                alert("Failed to release exam marks.");
                                                            }
                                                        }}
                                                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 border border-amber-250 dark:border-amber-900/40 rounded-lg text-xs font-bold transition-colors cursor-pointer animate-pulse"
                                                    >
                                                        Release Marks
                                                    </button>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-sm">
                                                {e.is_certificate_verified && e.certificate_url ? (
                                                    <a 
                                                        href={e.certificate_url} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="text-purple-650 hover:underline font-semibold flex items-center gap-1"
                                                    >
                                                        📄 View Issued Certificate
                                                    </a>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <input 
                                                            type="file" 
                                                            accept="application/pdf,image/*"
                                                            onChange={async (event) => {
                                                                const file = event.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = () => {
                                                                        if (typeof reader.result === 'string') {
                                                                            (e as any).uploaded_cert_data = reader.result;
                                                                            alert("Certificate file loaded! Click Verify to save.");
                                                                        }
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                            className="text-xs text-gray-550 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                                                        />
                                                        <span className="text-[10px] text-gray-400">Or paste Certificate URL:</span>
                                                        <input 
                                                            type="text" 
                                                            placeholder="https://..."
                                                            onChange={(event) => {
                                                                (e as any).uploaded_cert_data = event.target.value;
                                                            }}
                                                            className="p-1 border rounded text-xs w-full max-w-[200px]"
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col gap-1.5 items-center justify-center">
                                                    {e.is_certificate_verified ? (
                                                        <span className="text-xs text-green-600 font-bold flex items-center justify-center gap-1">
                                                            ✓ Verified & Issued
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={async () => {
                                                                const certData = (e as any).uploaded_cert_data;
                                                                if (!certData) {
                                                                    alert("Please upload a file or enter a Certificate URL first.");
                                                                    return;
                                                                }
                                                                try {
                                                                    await verifyAndIssueCertificate(e.user_id, e.course_id, certData);
                                                                    alert("Certificate successfully verified and uploaded!");
                                                                } catch (err: any) {
                                                                    alert("Failed to verify certificate.");
                                                                }
                                                            }}
                                                            className="px-3 py-1 bg-purple-600 hover:bg-purple-750 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer w-full"
                                                        >
                                                            Verify & Upload
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setEditingScores({
                                                            userId: e.user_id,
                                                            courseId: e.course_id,
                                                            studentName: student.name,
                                                            courseTitle: course.title,
                                                            quizScore: qScore,
                                                            examScore: exScore
                                                        })}
                                                        className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-250 rounded-lg text-xs font-bold transition-colors cursor-pointer w-full flex items-center justify-center gap-1"
                                                    >
                                                        <Edit2 size={10} /> Edit Grades
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Scores / Grading Dialog Modal */}
            {editingScores && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-150 dark:border-slate-805">
                        <div className="p-6 border-b border-gray-150 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Grade & Edit Scores</h3>
                            <button onClick={() => setEditingScores(null)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-350 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-450 dark:text-slate-450 uppercase tracking-wider">Student</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{editingScores.studentName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-450 dark:text-slate-450 uppercase tracking-wider">Course</p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mt-0.5">{editingScores.courseTitle}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-750 dark:text-slate-300 uppercase tracking-wider mb-2">Quiz Score (%)</label>
                                    <input 
                                        type="number" 
                                        min={0}
                                        max={100}
                                        value={editingScores.quizScore} 
                                        onChange={e => setEditingScores({ ...editingScores, quizScore: Math.min(100, Math.max(0, Number(e.target.value))) })}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-750 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 dark:text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-750 dark:text-slate-300 uppercase tracking-wider mb-2">Exam Score (%)</label>
                                    <input 
                                        type="number" 
                                        min={0}
                                        max={100}
                                        value={editingScores.examScore} 
                                        onChange={e => setEditingScores({ ...editingScores, examScore: Math.min(100, Math.max(0, Number(e.target.value))) })}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-750 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 dark:text-white outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 p-3.5 rounded-2xl flex items-center justify-between mt-2">
                                <span className="text-xs font-bold text-purple-900 dark:text-purple-300">Recalculated Final Score:</span>
                                <span className="text-sm font-extrabold text-purple-700 dark:text-purple-400 font-mono">
                                    {Math.round((editingScores.quizScore + editingScores.examScore) / 2)}%
                                </span>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-150 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                            <button onClick={() => setEditingScores(null)} className="px-4 py-2 bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs cursor-pointer">
                                Cancel
                            </button>
                            <button onClick={handleSaveScores} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs cursor-pointer">
                                Save changes
                            </button>
                        </div>
                    </div>
                </div>
                )}
        </div>
    );
};

export default AdminEnrollments;
