import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { Plus, Trash2, ClipboardList, CheckCircle, Calendar, Save, X, Edit } from 'lucide-react';

interface Assignment {
    id: string;
    title: string;
    dueDate: string;
    status: 'In Progress' | 'Completed';
    courseId: string;
    description?: string;
    resourceType?: 'pdf' | 'video' | 'audio' | 'none';
    resourceName?: string;
    resourceSize?: string;
    resourceLinkType?: 'device' | 'url' | 'none';
    resourceUrl?: string;
}

const AdminAssignments: React.FC = () => {
    const { courses, loading } = useAdmin();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

    // Submissions modal state
    const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
    const [submissionsAssignment, setSubmissionsAssignment] = useState<Assignment | null>(null);
    const [submissionsList, setSubmissionsList] = useState<{ studentName: string; email: string; answer: string }[]>([]);

    // Form fields
    const [title, setTitle] = useState('');
    const [courseId, setCourseId] = useState('global');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<'In Progress' | 'Completed'>('In Progress');
    const [description, setDescription] = useState('');
    const [resourceType, setResourceType] = useState<'pdf' | 'video' | 'audio' | 'none'>('none');
    const [resourceName, setResourceName] = useState('');
    const [resourceSize, setResourceSize] = useState('');
    const [resourceLinkType, setResourceLinkType] = useState<'device' | 'url' | 'none'>('none');
    const [resourceUrl, setResourceUrl] = useState('');

    const getSubmissionsCount = (assignmentId: string) => {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('student-assignments-submissions-')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    if (data[assignmentId]) {
                        count++;
                    }
                } catch (e) {}
            }
        }
        return count;
    };

    const openSubmissionsModal = (assignment: Assignment) => {
        setSubmissionsAssignment(assignment);
        const list: { studentName: string; email: string; answer: string }[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('student-assignments-submissions-')) {
                const studentId = key.replace('student-assignments-submissions-', '');
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    if (data[assignment.id]) {
                        // Retrieve student profile details
                        let studentName = 'Student';
                        let email = 'student@schoolofai.edu';

                        const profileKey = `student-profile-${studentId}`;
                        const profileData = localStorage.getItem(profileKey);
                        if (profileData) {
                            const parsed = JSON.parse(profileData);
                            studentName = parsed.name || studentName;
                            email = parsed.email || email;
                        } else if (studentId === 'guest') {
                            studentName = 'Guest Learner';
                            email = 'guest@schoolofai.edu';
                        }
                        list.push({
                            studentName,
                            email,
                            answer: data[assignment.id]
                        });
                    }
                } catch (e) {}
            }
        }
        setSubmissionsList(list);
        setIsSubmissionsModalOpen(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setResourceName(file.name);
            const sizeMB = file.size / (1024 * 1024);
            setResourceSize(sizeMB.toFixed(1) + ' MB');
            setResourceLinkType('device');
            
            // Read as data URL if file size is small (< 800 KB) to store in localStorage preview
            if (file.size < 800 * 1024) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        setResourceUrl(event.target.result as string);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                setResourceUrl('simulated-local-file');
            }
        }
    };

    const loadAssignments = () => {
        const stored = localStorage.getItem('admin-assignments');
        if (stored) {
            setAssignments(JSON.parse(stored));
        } else {
            setAssignments([]);
        }
    };

    useEffect(() => {
        loadAssignments();
    }, []);

    const openCreateModal = () => {
        setEditingAssignment(null);
        setTitle('');
        setCourseId('global');
        setDueDate('');
        setStatus('In Progress');
        setDescription('');
        setResourceType('none');
        setResourceName('');
        setResourceSize('');
        setResourceLinkType('none');
        setResourceUrl('');
        setIsModalOpen(true);
    };

    const openEditModal = (assignment: Assignment) => {
        setEditingAssignment(assignment);
        setTitle(assignment.title);
        setCourseId(assignment.courseId);
        setDueDate(assignment.dueDate);
        setStatus(assignment.status);
        setDescription(assignment.description || '');
        setResourceType(assignment.resourceType || 'none');
        setResourceName(assignment.resourceName || '');
        setResourceSize(assignment.resourceSize || '');
        setResourceLinkType(assignment.resourceLinkType || 'none');
        setResourceUrl(assignment.resourceUrl || '');
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;
        const updated = assignments.filter(a => a.id !== id);
        setAssignments(updated);
        localStorage.setItem('admin-assignments', JSON.stringify(updated));
        window.dispatchEvent(new Event('admin-assignments-update'));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !dueDate) {
            alert('Please fill out all required fields.');
            return;
        }

        const newObj: Assignment = {
            id: editingAssignment ? editingAssignment.id : 'asg-' + Date.now(),
            title,
            courseId,
            dueDate,
            status,
            description,
            resourceType,
            resourceName,
            resourceSize,
            resourceLinkType,
            resourceUrl
        };

        let updatedList: Assignment[];
        if (editingAssignment) {
            updatedList = assignments.map(a => a.id === editingAssignment.id ? newObj : a);
            alert('Assignment updated successfully!');
        } else {
            updatedList = [newObj, ...assignments];
            alert('Assignment created successfully!');
        }

        setAssignments(updatedList);
        localStorage.setItem('admin-assignments', JSON.stringify(updatedList));
        window.dispatchEvent(new Event('admin-assignments-update'));
        setIsModalOpen(false);
    };

    const getCourseTitle = (cId: string) => {
        if (cId === 'global') return 'Global (All Students)';
        return courses.find(c => c.id === cId)?.title || 'Unknown Course';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-gray-500">
                Loading assignment management...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assignment Setup</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Post assignments, set deadlines, and manage tasks</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-colors cursor-pointer"
                >
                    <Plus size={18} /> Add Assignment
                </button>
            </div>

            {/* Assignments List */}
            {assignments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-12 text-center text-gray-500">
                    <ClipboardList size={48} className="mx-auto text-gray-300 dark:text-slate-700 mb-3" />
                    <p className="font-semibold text-gray-700 dark:text-slate-350">No assignments created yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Click the "Add Assignment" button to publish tasks to students.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-800/80 text-xs font-bold text-gray-500 dark:text-slate-300 uppercase bg-gray-50 dark:bg-slate-800/60">
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Target Course</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80 text-sm text-gray-750 dark:text-slate-300">
                                {assignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-gray-50/20 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900 dark:text-white">{assignment.title}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-medium">
                                                {getCourseTitle(assignment.courseId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium">{assignment.dueDate}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                                assignment.status === 'Completed'
                                                    ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/40'
                                                    : 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                                            }`}>
                                                {assignment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                             <div className="flex justify-end gap-2">
                                                 <button 
                                                     onClick={() => openSubmissionsModal(assignment)}
                                                     className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-955/20 rounded-xl transition-all cursor-pointer relative animate-none"
                                                     title="View submissions"
                                                 >
                                                     <ClipboardList size={16} />
                                                     {getSubmissionsCount(assignment.id) > 0 && (
                                                         <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                                                             {getSubmissionsCount(assignment.id)}
                                                         </span>
                                                     )}
                                                 </button>
                                                 <button 
                                                     onClick={() => openEditModal(assignment)}
                                                     className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-955/20 rounded-xl transition-all cursor-pointer"
                                                     title="Edit assignment details"
                                                 >
                                                     <Edit size={16} />
                                                 </button>
                                                 <button 
                                                     onClick={() => handleDelete(assignment.id)}
                                                     className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-xl transition-all cursor-pointer"
                                                     title="Delete assignment"
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
                </div>
            )}

            {/* Assignment Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 border border-gray-100 dark:border-slate-800 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 dark:text-white">
                                {editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Assignment Title</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm"
                                    placeholder="e.g. Practical Neural Network Implementation" 
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Target Course</label>
                                <select 
                                    value={courseId} 
                                    onChange={(e) => setCourseId(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm"
                                >
                                    <option value="global">Global (All Enrolled Students)</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Assignment Description / Instructions</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter instructions, questions, reading materials..."
                                    rows={3}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                                />
                            </div>

                            <div className="space-y-2.5 border-t border-gray-150/40 dark:border-slate-800/80 pt-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Resource Attachment</label>
                                    <select
                                        value={resourceType}
                                        onChange={(e) => {
                                            const type = e.target.value as any;
                                            setResourceType(type);
                                            if (type === 'none') {
                                                setResourceName('');
                                                setResourceSize('');
                                                setResourceLinkType('none');
                                                setResourceUrl('');
                                            } else {
                                                // Default back to device upload
                                                setResourceLinkType('device');
                                                setResourceName('');
                                                setResourceSize('');
                                                setResourceUrl('');
                                            }
                                        }}
                                        className="text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-lg px-2 py-1 outline-none"
                                    >
                                        <option value="none">No Attachment</option>
                                        <option value="pdf">PDF Document</option>
                                        <option value="video">Video Lecture</option>
                                        <option value="audio">Audio Briefing</option>
                                    </select>
                                </div>

                                {resourceType !== 'none' && (
                                    <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-950/20 border border-gray-200 dark:border-slate-800 rounded-2xl animate-in fade-in duration-300">
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="flex gap-1.5 p-0.5 bg-gray-200/50 dark:bg-slate-800 border border-gray-250/30 dark:border-slate-700 rounded-lg text-[10px] font-bold">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setResourceLinkType('device');
                                                        setResourceName('');
                                                        setResourceSize('');
                                                        setResourceUrl('');
                                                    }}
                                                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                                        resourceLinkType !== 'url' 
                                                            ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                                    }`}
                                                >
                                                    Upload File
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setResourceLinkType('url');
                                                        setResourceName('');
                                                        setResourceSize('');
                                                        setResourceUrl('');
                                                    }}
                                                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                                        resourceLinkType === 'url' 
                                                            ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                                    }`}
                                                >
                                                    Internet URL
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setResourceType('none');
                                                    setResourceName('');
                                                    setResourceSize('');
                                                    setResourceLinkType('none');
                                                    setResourceUrl('');
                                                }}
                                                className="text-[11px] text-red-500 hover:text-red-655 font-bold cursor-pointer"
                                            >
                                                Remove Attachment
                                            </button>
                                        </div>

                                        {resourceLinkType !== 'url' ? (
                                            <div className="border border-dashed border-gray-250 dark:border-slate-700/80 rounded-xl p-3 text-center bg-white dark:bg-slate-900 hover:bg-gray-50/50 dark:hover:bg-slate-850/30 transition-colors relative cursor-pointer min-h-16 flex flex-col justify-center">
                                                <input
                                                    type="file"
                                                    accept={
                                                        resourceType === 'pdf' ? '.pdf' :
                                                        resourceType === 'video' ? 'video/*' :
                                                        resourceType === 'audio' ? 'audio/*' : '*'
                                                    }
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                />
                                                {resourceName ? (
                                                    <div className="flex justify-between items-center text-left">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate">{resourceName}</p>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{resourceSize} • Ready to Attach</p>
                                                        </div>
                                                        <span className="text-[9px] text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full border border-green-200">Selected</span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-bold text-gray-650 dark:text-slate-350">Choose file from your device</p>
                                                        <p className="text-[9px] text-gray-400 dark:text-slate-550">Supports {resourceType.toUpperCase()} format</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800">
                                                <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Paste Attachment Web URL</label>
                                                <input
                                                    type="url"
                                                    value={resourceUrl}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setResourceUrl(val);
                                                        const parsedName = val.substring(val.lastIndexOf('/') + 1) || 'Attached Web Resource';
                                                        setResourceName(parsedName.split('?')[0] || 'Attached Web Resource');
                                                        setResourceSize('Remote Web URL');
                                                    }}
                                                    placeholder="e.g. https://example.com/lecture_intro_walkthrough.mp4"
                                                    className="w-full p-2 bg-gray-55 dark:bg-slate-850 border border-gray-250 dark:border-slate-755 rounded-lg text-xs"
                                                    required={resourceType !== 'none'}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Due Date</label>
                                    <input 
                                        type="date" 
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm" 
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Status</label>
                                    <select 
                                        value={status} 
                                        onChange={(e) => setStatus(e.target.value as any)}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm"
                                    >
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-250 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 bg-violet-600 text-xs font-bold text-white rounded-xl hover:bg-violet-750 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <Save size={14} /> Save Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Student Submissions Modal */}
            {isSubmissionsModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 border border-gray-100 dark:border-slate-800 space-y-4 flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800 shrink-0">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                    Student Submissions
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
                                    Assignment: <span className="font-semibold text-gray-700 dark:text-slate-350">{submissionsAssignment?.title}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsSubmissionsModalOpen(false)} className="text-gray-400 hover:text-gray-650 p-1 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 py-2 min-h-0">
                            {submissionsList.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 space-y-2">
                                    <ClipboardList size={40} className="mx-auto text-gray-300 dark:text-slate-700 animate-none" />
                                    <p className="font-semibold text-sm text-gray-600 dark:text-slate-400">No submissions yet</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Students enrolled in this course have not completed the task.</p>
                                </div>
                            ) : (
                                submissionsList.map((sub, idx) => (
                                    <div key={idx} className="bg-gray-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/80 flex gap-3.5 items-start">
                                        <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-955/35 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                                            {sub.studentName.substring(0, 2)}
                                        </div>
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex flex-wrap items-baseline gap-1.5 justify-between">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{sub.studentName}</h4>
                                                <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate font-mono">{sub.email}</span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/50 p-3 rounded-xl">
                                                <p className="text-xs text-gray-700 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">
                                                    {sub.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end shrink-0">
                            <button 
                                onClick={() => setIsSubmissionsModalOpen(false)}
                                className="px-5 py-2 bg-violet-600 text-xs font-bold text-white rounded-xl hover:bg-violet-750 transition-colors cursor-pointer"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAssignments;
