import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock, Check, Play, BookOpen, ChevronDown, ChevronUp, Send, FileText, CheckCircle2, PlayCircle, Volume2, Download, ExternalLink } from 'lucide-react';
import { Course, CourseStatus } from '../types';

interface StudentAssignmentsProps {
    courses: Course[];
    userId?: string;
}

export const StudentAssignments: React.FC<StudentAssignmentsProps> = ({ courses, userId = 'guest' }) => {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
    const [statuses, setStatuses] = useState<{ [key: string]: string }>({});
    const [submissions, setSubmissions] = useState<{ [key: string]: string }>({});
    const [submissionTexts, setSubmissionTexts] = useState<{ [key: string]: string }>({});
    const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

    // Get actually enrolled courses
    const enrolledCourses = courses.filter(c => c.status === CourseStatus.IN_PROGRESS || c.status === CourseStatus.COMPLETED);

    useEffect(() => {
        // Load student-specific statuses and submissions
        const storedStatuses = localStorage.getItem(`student-assignments-status-${userId}`);
        if (storedStatuses) {
            try {
                setStatuses(JSON.parse(storedStatuses));
            } catch (e) {
                console.error('Error parsing statuses', e);
            }
        }
        const storedSubmissions = localStorage.getItem(`student-assignments-submissions-${userId}`);
        if (storedSubmissions) {
            try {
                setSubmissions(JSON.parse(storedSubmissions));
            } catch (e) {
                console.error('Error parsing submissions', e);
            }
        }
    }, [userId]);

    useEffect(() => {
        const loadAssignments = () => {
            const stored = localStorage.getItem('admin-assignments');
            let list: any[] = [];
            const enrolledIds = enrolledCourses.map(c => c.id);
            
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    // Filter assignments for courses student is enrolled in, or global assignments
                    list = parsed.filter((asg: any) =>
                        asg.courseId === 'global' || enrolledIds.includes(asg.courseId)
                    );
                } catch (e) {
                    console.error('Error parsing assignments', e);
                }
            }
            
            // If the filtered list is empty, pre-populate fallback detailed assignments matching student's actual enrollments
            if (list.length === 0) {
                const targetCourses = enrolledCourses.length > 0 ? enrolledCourses : courses.slice(0, 2);
                
                list = targetCourses.map((course, idx) => ({
                    id: `mock-asg-${course.id}-${idx}`,
                    title: `${course.title} - Final Case Study Project`,
                    courseId: course.id,
                    dueDate: new Date(Date.now() + (3 + idx) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'In Progress',
                    points: 100,
                    weight: '25% of total grade',
                    resourceType: 'pdf',
                    resourceName: 'class_project_framework_and_cases.pdf',
                    resourceSize: '2.4 MB',
                    description: `This comprehensive assignment covers the fundamental concepts taught in ${course.title}. 
                    
                    Instructions:
                    1. Review all course lecture slides, study guides, and module resources.
                    2. Write a 3-page summary report answering the core syllabus prompt.
                    3. Draw practical architecture diagrams or flowcharts explaining your chosen case study.
                    4. Submit your completed PDF report or project GitHub repository link below.`
                }));

                // Also add one global onboarding assignment if they are new
                list.push({
                    id: 'mock-asg-global-welcome',
                    title: 'Welile School Student Onboarding Assignment',
                    courseId: 'global',
                    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'In Progress',
                    points: 50,
                    weight: 'Completion required',
                    resourceType: 'audio',
                    resourceName: 'dean_welcome_briefing.wav',
                    resourceSize: '4.8 MB',
                    description: `Welcome to Welile School of AI! Please complete this short task to set up your profile and wallet settings.
                    
                    Instructions:
                    1. Navigate to the "My Profile" tab and configure your career goal and name.
                    2. Visit your security settings page to enable 2FA if desired.
                    3. Submit a short 2-sentence note below introducing yourself and what you hope to learn.`
                });
            }
            setAssignments(list);
        };

        loadAssignments();
        window.addEventListener('storage', loadAssignments);
        window.addEventListener('admin-assignments-update', loadAssignments);
        return () => {
            window.removeEventListener('storage', loadAssignments);
            window.removeEventListener('admin-assignments-update', loadAssignments);
        };
    }, [courses, enrolledCourses.length]);

    const getCourseTitle = (courseId: string) => {
        if (courseId === 'global') return 'Global (All Students)';
        const course = courses.find(c => c.id === courseId);
        return course ? course.title : 'Unknown Course';
    };

    const toggleAssignmentStatus = (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
        const updatedStatuses = { ...statuses, [id]: nextStatus };
        setStatuses(updatedStatuses);
        localStorage.setItem(`student-assignments-status-${userId}`, JSON.stringify(updatedStatuses));
        
        // Dispatch event to update DashboardHome dynamically
        window.dispatchEvent(new Event('admin-assignments-update'));
    };

    const handleFormSubmit = (e: React.FormEvent, asgId: string) => {
        e.preventDefault();
        const text = submissionTexts[asgId] || '';
        if (!text.trim()) return;

        const updatedSubmissions = { ...submissions, [asgId]: text };
        setSubmissions(updatedSubmissions);
        localStorage.setItem(`student-assignments-submissions-${userId}`, JSON.stringify(updatedSubmissions));

        // Mark as completed automatically on submission
        const updatedStatuses = { ...statuses, [asgId]: 'Completed' };
        setStatuses(updatedStatuses);
        localStorage.setItem(`student-assignments-status-${userId}`, JSON.stringify(updatedStatuses));

        window.dispatchEvent(new Event('admin-assignments-update'));
    };

    const getStatus = (asg: any) => {
        if (statuses[asg.id]) {
            return statuses[asg.id];
        }
        return asg.status || 'In Progress';
    };

    const getFormattedDate = (dateStr: string) => {
        try {
            const dateObj = new Date(dateStr);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            }
        } catch (e) {}
        return dateStr;
    };

    const isOverdue = (dueDateStr: string) => {
        if (!dueDateStr) return false;
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(dueDateStr);
            due.setHours(23, 59, 59, 999);
            return today > due;
        } catch (e) {
            return false;
        }
    };

    // Filter assignments
    const filteredAssignments = assignments.filter(asg => {
        const status = getStatus(asg);
        if (filter === 'PENDING') return status !== 'Completed';
        if (filter === 'COMPLETED') return status === 'Completed';
        return true;
    });

    // Counts
    const totalCount = assignments.length;
    const completedCount = assignments.filter(asg => getStatus(asg) === 'Completed').length;
    const pendingCount = totalCount - completedCount;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h2>
                <p className="text-gray-500 dark:text-slate-400">View tasks, complete project case studies, and submit grading answers.</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 rounded-2xl flex items-center justify-center shrink-0">
                        <ClipboardList size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Total Tasks</p>
                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">{totalCount}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                        <Clock size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Pending</p>
                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">{pendingCount}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center shrink-0">
                        <CheckCircle size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Completed</p>
                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">{completedCount}</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100/80 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800/80 rounded-2xl w-fit">
                <button
                    onClick={() => setFilter('ALL')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        filter === 'ALL'
                            ? 'bg-white dark:bg-slate-850 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    All ({totalCount})
                </button>
                <button
                    onClick={() => setFilter('PENDING')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        filter === 'PENDING'
                            ? 'bg-white dark:bg-slate-850 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    Pending ({pendingCount})
                </button>
                <button
                    onClick={() => setFilter('COMPLETED')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        filter === 'COMPLETED'
                            ? 'bg-white dark:bg-slate-850 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    Completed ({completedCount})
                </button>
            </div>

            {/* Main Assignments List */}
            {filteredAssignments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-12 text-center text-gray-500">
                    <ClipboardList size={48} className="mx-auto text-gray-300 dark:text-slate-700 mb-3" />
                    <p className="font-semibold text-gray-700 dark:text-slate-350">No assignments found</p>
                    <p className="text-xs text-gray-400 mt-1">There are no assignments matching your current filter.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAssignments.map((asg) => {
                        const status = getStatus(asg);
                        const isCompleted = status === 'Completed';
                        const isExpanded = expandedAssignmentId === asg.id;
                        const hasSubmittedText = submissions[asg.id];
                        
                        return (
                            <div 
                                key={asg.id} 
                                className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${
                                    isCompleted 
                                        ? 'border-green-100 dark:border-green-950/20 bg-green-50/5 dark:bg-green-950/2' 
                                        : 'border-gray-100 dark:border-slate-800'
                                }`}
                            >
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <h3 className={`font-bold text-base leading-snug break-words ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                {asg.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 text-xs pt-1">
                                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full font-medium">
                                                    <BookOpen size={12} className="text-slate-500" />
                                                    <span className="truncate max-w-[200px]">{getCourseTitle(asg.courseId)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full font-medium">
                                                    <Clock size={12} />
                                                    <span>Due {getFormattedDate(asg.dueDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-medium">
                                                    <span>{asg.points || 100} Points</span>
                                                </div>
                                                {asg.weight && (
                                                    <div className="flex items-center gap-1 bg-violet-50 dark:bg-violet-955/20 text-violet-600 dark:text-violet-400 px-2.5 py-1 rounded-full font-medium">
                                                        <span>{asg.weight}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shrink-0 ${
                                            isCompleted
                                                ? 'bg-green-100/60 dark:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-200/30'
                                                : 'bg-amber-100/60 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border border-amber-200/30'
                                        }`}>
                                            {status}
                                        </span>
                                    </div>

                                    {/* Action row (Toggle Detail / Mark completion) */}
                                    <div className="flex items-center justify-between border-t border-gray-50 dark:border-slate-800/60 pt-4 mt-2">
                                        <button
                                            onClick={() => setExpandedAssignmentId(isExpanded ? null : asg.id)}
                                            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp size={15} />
                                                    Hide Details
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown size={15} />
                                                    View Details & Submit
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (isOverdue(asg.dueDate)) {
                                                    alert("This assignment's due date has passed. You cannot modify its status.");
                                                    return;
                                                }
                                                toggleAssignmentStatus(asg.id, status);
                                            }}
                                            disabled={isOverdue(asg.dueDate)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                                                isOverdue(asg.dueDate)
                                                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 border border-gray-200/50 dark:border-slate-850/80 cursor-not-allowed opacity-60'
                                                    : isCompleted
                                                        ? 'bg-amber-50 dark:bg-amber-955/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100/60 cursor-pointer shadow-none'
                                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-sm cursor-pointer'
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <>
                                                    <Play size={13} />
                                                    Reopen Task
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={13} />
                                                    Mark Completed
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Collapsible Details Area */}
                                    {isExpanded && (
                                        <div className="animate-in slide-in-from-top-4 duration-300 border-t border-gray-50 dark:border-slate-800/60 pt-4 mt-2 space-y-4">
                                            <div className="bg-gray-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 space-y-3">
                                                <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <FileText size={14} />
                                                    Assignment Prompt & Instructions
                                                </h4>
                                                <p className="text-sm text-gray-700 dark:text-slate-350 leading-relaxed whitespace-pre-line">
                                                    {asg.description || 'No instructions provided.'}
                                                </p>
                                            </div>

                                            {/* Attached Resource Section */}
                                            {asg.resourceType && asg.resourceType !== 'none' && (
                                                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
                                                    <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                        {asg.resourceType === 'pdf' && <FileText size={15} className="text-red-500" />}
                                                        {asg.resourceType === 'video' && <PlayCircle size={15} className="text-blue-500" />}
                                                        {asg.resourceType === 'audio' && <Volume2 size={15} className="text-green-500" />}
                                                        Attached {asg.resourceType.toUpperCase()} Resource
                                                    </h4>

                    <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-slate-950/40 p-3 rounded-xl">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate">{asg.resourceName || `assignment_resource.${asg.resourceType}`}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{asg.resourceSize || '2.0 MB'}</p>
                        </div>
                         <a
                             href={asg.resourceUrl && asg.resourceUrl !== 'simulated-local-file' ? asg.resourceUrl : '#'}
                             download={asg.resourceUrl && asg.resourceUrl.startsWith('data:') ? asg.resourceName : undefined}
                             target={asg.resourceUrl && asg.resourceUrl.startsWith('http') ? '_blank' : undefined}
                             rel={asg.resourceUrl && asg.resourceUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                             onClick={(e) => {
                                 if (!asg.resourceUrl || asg.resourceUrl === 'simulated-local-file') {
                                     e.preventDefault();
                                     alert(`Simulated Download of: ${asg.resourceName || `assignment_resource.${asg.resourceType}`}`);
                                 }
                             }}
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-gray-700 dark:text-slate-300 cursor-pointer shrink-0 transition-colors"
                         >
                             <Download size={13} />
                             Download
                         </a>
                     </div>

                     {/* Multimedia Previews */}
                     {asg.resourceType === 'video' && (
                         <div className="space-y-1.5">
                             <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Attached Video Lesson Lecture Preview:</p>
                             <div className="rounded-xl overflow-hidden aspect-video bg-black border border-gray-150 dark:border-slate-800 relative">
                                 <video
                                     src={
                                         asg.resourceUrl && asg.resourceUrl !== 'simulated-local-file'
                                             ? asg.resourceUrl
                                             : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                                     }
                                     controls
                                     className="w-full h-full object-contain"
                                     poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60"
                                 />
                             </div>
                         </div>
                     )}

                     {asg.resourceType === 'audio' && (
                         <div className="space-y-1.5">
                             <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Instructor Audio Briefing Notes:</p>
                             <div className="bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800/85 rounded-xl p-3.5 flex flex-col gap-3">
                                 <audio
                                     src={
                                         asg.resourceUrl && asg.resourceUrl !== 'simulated-local-file'
                                             ? asg.resourceUrl
                                             : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                                     }
                                     controls
                                     className="w-full"
                                 />
                                 <div className="flex items-end justify-between h-8 px-4 opacity-40">
                                     {[40, 20, 60, 80, 50, 70, 30, 90, 45, 65, 85, 35, 75, 55, 95, 25, 45, 65, 80, 40, 20, 60].map((h, i) => (
                                         <div key={i} className="w-1.5 bg-violet-600 rounded-full" style={{ height: `${h}%` }}></div>
                                     ))}
                                 </div>
                             </div>
                         </div>
                     )}

                     {asg.resourceType === 'pdf' && (
                         <div className="space-y-1.5">
                             <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Attached PDF Reading Document Preview:</p>
                             <div className="bg-slate-100/50 dark:bg-slate-950/30 border border-gray-150 dark:border-slate-800/60 rounded-xl p-6 text-center space-y-4">
                                 <FileText size={48} className="mx-auto text-red-500/70" />
                                 <div className="space-y-1 max-w-sm mx-auto">
                                     <p className="text-xs font-bold text-gray-800 dark:text-slate-200">
                                         {asg.resourceName}
                                     </p>
                                     <p className="text-[10px] text-gray-400 dark:text-slate-500">
                                         {asg.resourceUrl && asg.resourceUrl.startsWith('http')
                                             ? "Internet PDF document resource link attached"
                                             : "Simulated PDF viewer loading successfully (1 of 4 pages)"}
                                     </p>
                                 </div>
                                 {asg.resourceUrl && asg.resourceUrl.startsWith('http') ? (
                                     <a
                                         href={asg.resourceUrl}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm mx-auto w-fit"
                                     >
                                         <ExternalLink size={13} />
                                         Open PDF in New Tab
                                     </a>
                                 ) : (
                                     <div className="max-w-md mx-auto h-24 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg p-3 text-[9px] text-gray-450 dark:text-slate-400 text-left overflow-hidden select-none font-mono">
                                         SECTION 1: COURSE METHODOLOGY OVERVIEW
                                         --------------------------------------------------
                                         This handbook details the research framework, metrics parameters, and analytical goals for class project submissions. Students are required to review pages 12-24 carefully before formulating case study responses...
                                     </div>
                                 )}
                             </div>
                         </div>
                     )}
                 </div>
             )}

                                            {/* Submission form */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                    Your Answer / Submission
                                                </h4>
                                                {hasSubmittedText ? (
                                                    <div className="bg-green-50/40 dark:bg-green-950/10 border border-green-200/50 dark:border-green-900/40 rounded-2xl p-4 space-y-2">
                                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs">
                                                            <CheckCircle2 size={16} />
                                                            Submitted successfully!
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                                                            "{hasSubmittedText}"
                                                        </p>
                                                        {isOverdue(asg.dueDate) ? (
                                                            <p className="text-[11px] text-red-500 font-bold mt-1">
                                                                Due date passed. Submission locked.
                                                             </p>
                                                        ) : (
                                                            <button 
                                                                onClick={() => {
                                                                    const updated = { ...submissions };
                                                                    delete updated[asg.id];
                                                                    setSubmissions(updated);
                                                                    localStorage.setItem(`student-assignments-submissions-${userId}`, JSON.stringify(updated));
                                                                }}
                                                                className="text-xs text-red-500 hover:text-red-650 hover:underline cursor-pointer"
                                                            >
                                                                Remove and Resubmit
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : isOverdue(asg.dueDate) ? (
                                                    <div className="bg-red-50/50 dark:bg-red-950/15 border border-red-200/50 dark:border-red-900/40 rounded-2xl p-4 text-center space-y-1">
                                                        <p className="text-xs font-bold text-red-650 dark:text-red-400 flex items-center justify-center gap-1.5 animate-none">
                                                            <span>⚠️ Due Date Passed: Submissions Closed</span>
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                            This task was due on {getFormattedDate(asg.dueDate)} and is no longer accepting answers.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <form onSubmit={(e) => handleFormSubmit(e, asg.id)} className="space-y-3">
                                                        <textarea
                                                            value={submissionTexts[asg.id] || ''}
                                                            onChange={(e) => setSubmissionTexts({ ...submissionTexts, [asg.id]: e.target.value })}
                                                            placeholder="Type your response here or paste your submission link..."
                                                            rows={4}
                                                            className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                                            required
                                                        />
                                                        <button
                                                            type="submit"
                                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto"
                                                        >
                                                            <Send size={12} />
                                                            Submit Project
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
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
export default StudentAssignments;
