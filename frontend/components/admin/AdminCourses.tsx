import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { Course } from '../../types';
import { 
    Plus, X, Edit3, Trash2, Calendar, Clock, Globe, Copy, Send, 
    Key, ExternalLink, Check, Bell, Radio, CheckCircle2, ShieldCheck, 
    BookOpen, HelpCircle, Save, Loader2, RefreshCw, Sparkles, Share2, 
    ArrowRight, MessageSquare
} from 'lucide-react';
import { formatAmount, getCurrencyPreference, CurrencyType } from '../../src/lib/currency';
import { broadcastLessonNotification } from './AdminCourseSetupWizard';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMEZONES = ['EAT (UTC+3)', 'UTC+0 (GMT)', 'CAT (UTC+2)', 'WAT (UTC+1)', 'EST (UTC-5)', 'PST (UTC-8)', 'IST (UTC+5:30)'];

// Helper to calculate exact calendar date for a scheduled lesson
export const calculateLessonSchedule = (
    startDateStr?: string,
    lessonDays: string[] = ['Monday', 'Wednesday', 'Friday'],
    lessonIndex: number = 0,
    startTime: string = '18:00',
    endTime: string = '20:00',
    tz: string = 'EAT (UTC+3)'
): { dateStr: string; timeStr: string } => {
    if (!startDateStr) {
        return {
            dateStr: `Session ${lessonIndex + 1}`,
            timeStr: `${startTime} - ${endTime} (${tz})`
        };
    }

    const dayNameToNum: Record<string, number> = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
    };

    const targetDayNums = (lessonDays && lessonDays.length > 0 ? lessonDays : ['Monday', 'Wednesday', 'Friday'])
        .map(d => dayNameToNum[d] ?? 1);

    const base = new Date(startDateStr);
    if (isNaN(base.getTime())) {
        return {
            dateStr: `Session ${lessonIndex + 1}`,
            timeStr: `${startTime} - ${endTime} (${tz})`
        };
    }

    let current = new Date(base);
    let matchedCount = 0;
    let guard = 0;

    while (guard < 180) {
        const dayOfWeek = current.getDay();
        if (targetDayNums.includes(dayOfWeek)) {
            if (matchedCount === lessonIndex) {
                break;
            }
            matchedCount++;
        }
        current.setDate(current.getDate() + 1);
        guard++;
    }

    const dateStr = current.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return {
        dateStr,
        timeStr: `${startTime} - ${endTime} (${tz})`
    };
};

export const generateRandomPin = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WEL-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

interface AdminCoursesProps {
    isInstructor?: boolean;
}

const AdminCourses: React.FC<AdminCoursesProps> = ({ isInstructor = false }) => {
    const { courses, loading, updateCourse, deleteCourse } = useAdmin(true);
    const navigate = useNavigate();
    const [currency, setCurrency] = useState<CurrencyType>(getCurrencyPreference);

    useEffect(() => {
        const handleCurrencyChange = () => {
            setCurrency(getCurrencyPreference());
        };
        window.addEventListener('currency-change', handleCurrencyChange);
        return () => {
            window.removeEventListener('currency-change', handleCurrencyChange);
        };
    }, []);

    const instructorEmail = localStorage.getItem('instructor-email') || '';

    const filteredCourses = isInstructor 
        ? courses.filter(c => c.instructorEmail?.trim().toLowerCase() === instructorEmail.trim().toLowerCase())
        : courses;

    // Modals state
    const [scheduleModalCourse, setScheduleModalCourse] = useState<Course | null>(null);
    const [scheduleFormData, setScheduleFormData] = useState<Partial<Course>>({});
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [scheduleSaveSuccess, setScheduleSaveSuccess] = useState(false);

    // Live Lessons & Attendance Codes Modal State
    const [liveLessonsModalCourse, setLiveLessonsModalCourse] = useState<Course | null>(null);
    const [copiedLessonPin, setCopiedLessonPin] = useState<string | null>(null);
    const [copiedLessonInvite, setCopiedLessonInvite] = useState<string | null>(null);
    const [regeneratingLessonId, setRegeneratingLessonId] = useState<string | null>(null);

    // General Alert Modal State
    const [alertModalCourse, setAlertModalCourse] = useState<Course | null>(null);
    const [alertNote, setAlertNote] = useState('');
    const [alertLessonTitle, setAlertLessonTitle] = useState('');
    const [alertAttendancePin, setAlertAttendancePin] = useState('');
    const [alertSent, setAlertSent] = useState(false);
    const [copiedCardMeet, setCopiedCardMeet] = useState<string | null>(null);

    // Helper: Extract all live lesson topics for a course
    const extractLiveLessons = (course: Course) => {
        const list: Array<{
            id: string;
            sectionId: string;
            sectionTitle: string;
            title: string;
            duration: string;
            attendanceCode: string;
            scheduledDate: string;
            scheduledTime: string;
            lessonIndex: number;
        }> = [];

        const sections = course.sections || [];
        let count = 0;

        sections.forEach((sec: any) => {
            (sec.lessons || []).forEach((les: any) => {
                if (les.type !== 'quiz') {
                    count++;
                    const schedule = calculateLessonSchedule(
                        course.startDate,
                        course.lessonDays,
                        count - 1,
                        course.lessonStartTime || '18:00',
                        course.lessonEndTime || '20:00',
                        course.timezone || 'EAT (UTC+3)'
                    );

                    list.push({
                        id: les.id,
                        sectionId: sec.id,
                        sectionTitle: sec.title || `Module ${sections.indexOf(sec) + 1}`,
                        title: les.title || `Live Topic ${count}`,
                        duration: les.duration || '45 mins',
                        attendanceCode: les.attendanceCode || les.attendance_code || generateRandomPin(),
                        scheduledDate: les.scheduledDate || schedule.dateStr,
                        scheduledTime: schedule.timeStr,
                        lessonIndex: count
                    });
                }
            });
        });

        // Fallback default sessions if curriculum topics have not been detailed yet
        if (list.length === 0) {
            for (let i = 1; i <= 4; i++) {
                const schedule = calculateLessonSchedule(
                    course.startDate,
                    course.lessonDays,
                    i - 1,
                    course.lessonStartTime || '18:00',
                    course.lessonEndTime || '20:00',
                    course.timezone || 'EAT (UTC+3)'
                );
                list.push({
                    id: `fallback-sess-${i}`,
                    sectionId: 'sec-main',
                    sectionTitle: 'Main Curriculum',
                    title: `Live Session ${i}: Core Concepts & Interactive Discussion`,
                    duration: '45 mins',
                    attendanceCode: course.attendanceCode ? `${course.attendanceCode}-${i}` : generateRandomPin(),
                    scheduledDate: schedule.dateStr,
                    scheduledTime: schedule.timeStr,
                    lessonIndex: i
                });
            }
        }

        return list;
    };

    // Regenerate auto attendance code for a specific lesson
    const handleRegenerateLessonPin = async (course: Course, lessonId: string, sectionId: string) => {
        const newPin = generateRandomPin();
        setRegeneratingLessonId(lessonId);

        let sectionsUpdated = false;
        const updatedSections = (course.sections || []).map((sec: any) => {
            if (sec.id === sectionId) {
                const updatedLessons = (sec.lessons || []).map((les: any) => {
                    if (les.id === lessonId) {
                        sectionsUpdated = true;
                        return { ...les, attendanceCode: newPin };
                    }
                    return les;
                });
                return { ...sec, lessons: updatedLessons };
            }
            return sec;
        });

        try {
            const updatedCourse: Course = {
                ...course,
                attendanceCode: newPin, // Also update fallback
                sections: sectionsUpdated ? updatedSections : course.sections
            };
            await updateCourse(course.id, updatedCourse);
            setLiveLessonsModalCourse(updatedCourse);
        } catch (err) {
            console.error('Failed to regenerate lesson PIN:', err);
        } finally {
            setTimeout(() => setRegeneratingLessonId(null), 300);
        }
    };

    // Copy formatted invite message for messaging apps
    const handleCopyLessonInvite = (course: Course, lesson: any) => {
        const inviteText = `🎓 Welile School Live Class: ${lesson.title}\n📅 Date: ${lesson.scheduledDate} (${lesson.scheduledTime})\n🔗 Google Meet Link: ${course.meetingLink || 'Link to be shared'}\n🔑 Student Attendance PIN: ${lesson.attendanceCode}`;
        navigator.clipboard.writeText(inviteText);
        setCopiedLessonInvite(lesson.id);
        setTimeout(() => setCopiedLessonInvite(null), 1800);
    };

    // Open Live Schedule Modal
    const openScheduleModal = (course: Course) => {
        setScheduleModalCourse(course);
        setScheduleFormData({
            cohortName: course.cohortName || 'Cohort 1',
            startDate: course.startDate || '2026-11-15',
            endDate: course.endDate || '2026-12-01',
            lessonDays: course.lessonDays || ['Monday', 'Wednesday', 'Friday'],
            lessonStartTime: course.lessonStartTime || '18:00',
            lessonEndTime: course.lessonEndTime || '20:00',
            timezone: course.timezone || 'EAT (UTC+3)',
            meetingLink: course.meetingLink || '',
            attendanceCode: course.attendanceCode || generateRandomPin(),
            quizDate: course.quizDate || '2026-11-25',
            examDate: course.examDate || '2026-12-01'
        });
        setScheduleSaveSuccess(false);
    };

    const handleSaveSchedule = async () => {
        if (!scheduleModalCourse) return;
        setIsSavingSchedule(true);
        try {
            const updated = {
                ...scheduleModalCourse,
                ...scheduleFormData
            };
            await updateCourse(scheduleModalCourse.id, updated);
            setScheduleSaveSuccess(true);
            setTimeout(() => {
                setScheduleSaveSuccess(false);
                setScheduleModalCourse(null);
            }, 1200);
        } catch (err: any) {
            alert(`Error updating schedule: ${err.message || err}`);
        } finally {
            setIsSavingSchedule(false);
        }
    };

    const handleSendAlert = (course: Course, specificLesson?: any) => {
        setAlertModalCourse(course);
        setAlertLessonTitle(specificLesson ? specificLesson.title : '');
        setAlertAttendancePin(specificLesson ? specificLesson.attendanceCode : (course.attendanceCode || 'WEL-8492'));
        setAlertNote(specificLesson ? `Please join live for ${specificLesson.title}. Class begins on schedule.` : '');
        setAlertSent(false);
    };

    const confirmBroadcastAlert = () => {
        if (!alertModalCourse) return;
        const ok = broadcastLessonNotification(
            alertModalCourse.title,
            alertModalCourse.cohortName || 'Live Cohort',
            alertModalCourse.meetingLink || '',
            alertAttendancePin || alertModalCourse.attendanceCode || 'WEL-8492',
            alertModalCourse.lessonDays || ['Monday', 'Wednesday', 'Friday'],
            alertModalCourse.lessonStartTime || '18:00',
            alertModalCourse.lessonEndTime || '20:00',
            alertModalCourse.timezone || 'EAT (UTC+3)',
            alertLessonTitle ? `${alertLessonTitle} - ${alertNote}` : alertNote
        );
        if (ok) {
            setAlertSent(true);
            setTimeout(() => {
                setAlertSent(false);
                setAlertModalCourse(null);
                setAlertNote('');
                setAlertLessonTitle('');
                setAlertAttendancePin('');
            }, 1500);
        }
    };

    const toggleScheduleDay = (day: string) => {
        const currentDays = scheduleFormData.lessonDays || [];
        const updated = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        setScheduleFormData({ ...scheduleFormData, lessonDays: updated });
    };

    const generateModalPin = () => {
        setScheduleFormData(prev => ({ ...prev, attendanceCode: generateRandomPin() }));
    };

    if (loading) return (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-violet-600" size={32} />
            <p className="font-semibold text-sm">Loading courses and live schedules...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="text-violet-600" size={22} />
                        {isInstructor ? 'Tutor Dashboard & Live Lessons' : 'Course & Live Cohort Management'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Attendance codes are auto-generated for every live lesson. View, copy, or broadcast session PINs directly to students.
                    </p>
                </div>
                <button 
                    onClick={() => navigate(isInstructor ? '/instructor/courses/setup' : '/courses/setup')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-colors shadow-sm cursor-pointer"
                >
                    <Plus size={18} /> New Course Wizard
                </button>
            </div>

            {/* Tutor Live Session Guidance Banner */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                        <Radio className="text-white animate-pulse" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white">Live Lesson Attendance Codes Auto-Generated</h3>
                        <p className="text-xs text-violet-100 mt-0.5">
                            Every live Google Meet lesson has a unique attendance PIN ready for verification. Click <strong>"Live PINs"</strong> on any course card to manage codes or broadcast them to students.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs font-bold border border-white/20">
                        ⚡ Active Cohorts: {filteredCourses.length}
                    </span>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 space-y-2">
                        <Radio size={36} className="mx-auto opacity-40 text-violet-500" />
                        <p className="font-bold text-base text-gray-700 dark:text-slate-300">
                            {isInstructor ? "You haven't uploaded any courses yet." : "No courses available."}
                        </p>
                        <p className="text-xs text-gray-400">
                            Click "New Course Wizard" above to set up a live cohort course with Google Meet schedule.
                        </p>
                    </div>
                )}

                {filteredCourses.map(c => {
                    const daysText = c.lessonDays && c.lessonDays.length > 0 ? c.lessonDays.slice(0, 3).join(', ') : 'Live Days';
                    const hasLiveMeet = Boolean(c.meetingLink);
                    const liveLessonsList = extractLiveLessons(c);

                    return (
                        <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-150 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
                            <div>
                                {/* Cover Image & Status Badges */}
                                <div className="h-44 bg-gray-200 dark:bg-slate-800 relative overflow-hidden">
                                    {c.image ? (
                                        <img 
                                            src={c.image} 
                                            alt={c.title} 
                                            className="w-full h-full object-cover" 
                                            style={{
                                                objectPosition: `${c.imagePositionX ?? 50}% ${c.imagePositionY ?? 50}%`,
                                                transform: `scale(${c.imageScale ?? 1})`,
                                                transformOrigin: `${c.imagePositionX ?? 50}% ${c.imagePositionY ?? 50}%`
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            No Image
                                        </div>
                                    )}

                                    {/* Cohort Badge */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                        <span className="px-2.5 py-1 bg-violet-600/90 text-white text-[11px] font-bold rounded-lg shadow-sm backdrop-blur-sm flex items-center gap-1">
                                            <Radio size={12} className="animate-pulse" />
                                            {c.cohortName || 'Live Cohort'}
                                        </span>
                                        {c.isDraft ? (
                                            <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-md shadow-sm">
                                                Draft
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-md shadow-sm flex items-center gap-0.5">
                                                <CheckCircle2 size={10} /> Published
                                            </span>
                                        )}
                                    </div>

                                    {/* Price Badge */}
                                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-violet-600 dark:text-violet-400 shadow-sm border border-violet-100 dark:border-slate-800">
                                        {c.accessTier === 'FREE' ? 'FREE' : formatAmount(c.price || 0, currency)}
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="p-5 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                                            {c.title}
                                        </h3>
                                    </div>

                                    {/* Google Meet Link Bar */}
                                    {hasLiveMeet && (
                                        <div className="flex items-center justify-between gap-2 bg-emerald-50/70 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs">
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <Radio size={13} className="text-emerald-600 shrink-0 animate-pulse" />
                                                <span className="font-semibold text-emerald-800 dark:text-emerald-300 truncate text-[11px]">
                                                    {c.meetingLink}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (c.meetingLink) {
                                                            navigator.clipboard.writeText(c.meetingLink);
                                                            setCopiedCardMeet(c.id);
                                                            setTimeout(() => setCopiedCardMeet(null), 1500);
                                                        }
                                                    }}
                                                    className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded text-emerald-700 dark:text-emerald-300 cursor-pointer"
                                                    title="Copy Google Meet Link"
                                                >
                                                    {copiedCardMeet === c.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                </button>
                                                <a 
                                                    href={c.meetingLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded text-emerald-700 dark:text-emerald-300"
                                                    title="Open Google Meet"
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Live Schedule Info Box */}
                                    <div className="bg-gray-50 dark:bg-slate-855 p-3 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2 text-xs">
                                        <div className="flex items-center justify-between text-gray-700 dark:text-slate-300">
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <Calendar size={12} className="text-violet-500" /> Period:
                                            </span>
                                            <span className="font-bold">
                                                {c.startDate || '15 Nov 2026'} - {c.endDate || '01 Dec 2026'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-gray-700 dark:text-slate-300">
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <Clock size={12} className="text-emerald-500" /> Timing:
                                            </span>
                                            <span className="font-medium text-[11px]">
                                                {daysText} @ {c.lessonStartTime || '18:00'} ({c.timezone || 'EAT'})
                                            </span>
                                        </div>

                                        {/* Auto Generated Attendance PINs Bar */}
                                        <div className="pt-2 border-t border-gray-200/60 dark:border-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => setLiveLessonsModalCourse(c)}
                                                className="w-full py-1.5 px-2.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <Key size={12} className="text-violet-600 dark:text-violet-400" />
                                                    <span>Live Lesson Attendance PINs</span>
                                                </div>
                                                <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-violet-700 dark:text-violet-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-800">
                                                    <span>{liveLessonsList.length} Lessons</span>
                                                    <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-4 pt-0 border-t border-gray-100 dark:border-slate-800 mt-2 flex flex-col gap-2">
                                <div className="grid grid-cols-3 gap-2 pt-2">
                                    {/* Live PINs Button */}
                                    <button 
                                        type="button"
                                        onClick={() => setLiveLessonsModalCourse(c)}
                                        className="py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                        title="View auto-generated attendance codes for every live lesson"
                                    >
                                        <Key size={13} /> Live PINs
                                    </button>

                                    {/* Broadcast Alert Button */}
                                    <button 
                                        type="button"
                                        onClick={() => handleSendAlert(c)}
                                        className="py-2 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                        title="Broadcast Google Meet link & attendance PIN"
                                    >
                                        <Bell size={13} /> Send Alert
                                    </button>

                                    {/* Live Schedule & Exam Dates Settings */}
                                    <button 
                                        type="button"
                                        onClick={() => openScheduleModal(c)}
                                        className="py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                        title="Edit live schedule, Google Meet link, and exam dates"
                                    >
                                        <Calendar size={13} /> Live Dates
                                    </button>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-1 px-1">
                                    <button 
                                        onClick={() => navigate(isInstructor ? `/instructor/courses/setup?courseId=${c.id}` : `/courses/setup?courseId=${c.id}`)}
                                        className="text-violet-600 dark:text-violet-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        <Edit3 size={12} /> Edit Syllabus
                                    </button>

                                    <button 
                                        onClick={async () => {
                                            if (window.confirm(`Are you sure you want to delete "${c.title}"?`)) {
                                                try {
                                                    await deleteCourse(c.id);
                                                } catch (err: any) {
                                                    alert('Delete error: ' + (err.message || err));
                                                }
                                            }
                                        }}
                                        className="text-red-500 hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal: Live Lessons & Auto-Generated Attendance Codes */}
            {liveLessonsModalCourse && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-150 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2.5 py-0.5 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold text-[11px] rounded-full flex items-center gap-1">
                                        <Radio size={10} className="animate-pulse" /> {liveLessonsModalCourse.cohortName || 'Live Cohort'}
                                    </span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                        {liveLessonsModalCourse.startDate} to {liveLessonsModalCourse.endDate}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {liveLessonsModalCourse.title}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    Auto-generated attendance codes for each live lesson. Share codes with students during live Google Meet lectures to verify presence.
                                </p>
                            </div>
                            <button 
                                onClick={() => setLiveLessonsModalCourse(null)} 
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-1 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Google Meet Info Strip */}
                        <div className="px-6 py-3 bg-violet-50/50 dark:bg-slate-855 border-b border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300">
                                <Radio size={14} className="text-emerald-500" />
                                <span>Live Meet:</span>
                                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                                    {liveLessonsModalCourse.meetingLink || 'No Meet link configured'}
                                </span>
                            </div>
                            {liveLessonsModalCourse.meetingLink && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(liveLessonsModalCourse.meetingLink || '');
                                            setCopiedCardMeet('modal-meet');
                                            setTimeout(() => setCopiedCardMeet(null), 1500);
                                        }}
                                        className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-[11px] font-bold border border-gray-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedCardMeet === 'modal-meet' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                        {copiedCardMeet === 'modal-meet' ? 'Copied' : 'Copy Meet'}
                                    </button>
                                    <a
                                        href={liveLessonsModalCourse.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                                    >
                                        <ExternalLink size={11} /> Join Call
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Lessons List Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {extractLiveLessons(liveLessonsModalCourse).map((lesson, idx) => {
                                const isCopiedPin = copiedLessonPin === lesson.id;
                                const isCopiedInvite = copiedLessonInvite === lesson.id;
                                const isRegenerating = regeneratingLessonId === lesson.id;

                                return (
                                    <div 
                                        key={lesson.id} 
                                        className="bg-gray-50/70 dark:bg-slate-855 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-4 transition-all hover:border-violet-300 dark:hover:border-violet-700/50 space-y-3"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            {/* Lesson Info */}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold text-[11px] rounded-md">
                                                        Lesson {idx + 1}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        {lesson.sectionTitle}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                                    {lesson.title}
                                                </h4>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} className="text-violet-500" />
                                                        {lesson.scheduledDate}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} className="text-emerald-500" />
                                                        {lesson.scheduledTime}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Auto-Generated Attendance Code & Fast Actions */}
                                            <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                            Attendance PIN
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            <span className="font-mono text-base font-extrabold text-violet-700 dark:text-violet-300 tracking-wider">
                                                                {lesson.attendanceCode}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(lesson.attendanceCode);
                                                            setCopiedLessonPin(lesson.id);
                                                            setTimeout(() => setCopiedLessonPin(null), 1500);
                                                        }}
                                                        className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                                        title="Copy this lesson's unique attendance code"
                                                    >
                                                        {isCopiedPin ? <Check size={12} /> : <Copy size={12} />}
                                                        {isCopiedPin ? 'Copied!' : 'Copy PIN'}
                                                    </button>
                                                </div>

                                                {/* Micro action buttons */}
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        disabled={isRegenerating}
                                                        onClick={() => handleRegenerateLessonPin(liveLessonsModalCourse, lesson.id, lesson.sectionId)}
                                                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="Auto-generate a new unique code for this lesson"
                                                    >
                                                        <RefreshCw size={10} className={isRegenerating ? 'animate-spin text-violet-600' : ''} />
                                                        Regenerate
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyLessonInvite(liveLessonsModalCourse, lesson)}
                                                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="Copy full invitation with Meet link and attendance PIN"
                                                    >
                                                        {isCopiedInvite ? <Check size={10} className="text-emerald-500" /> : <Share2 size={10} />}
                                                        {isCopiedInvite ? 'Invite Copied!' : 'Copy Invite'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendAlert(liveLessonsModalCourse, lesson)}
                                                        className="px-2 py-1 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="Broadcast this lesson alert with its auto PIN to student feeds"
                                                    >
                                                        <Bell size={10} /> Alert
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 px-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900 flex items-center justify-between">
                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                💡 Students unlock module quizzes immediately upon submitting their live lesson PIN.
                            </p>
                            <button
                                type="button"
                                onClick={() => setLiveLessonsModalCourse(null)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Live Schedule & Assessment Dates */}
            {scheduleModalCourse && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 border border-gray-150 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                    <Calendar className="text-violet-600" size={18} />
                                    Live Schedule & Assessment Dates
                                </h3>
                                <p className="text-xs text-gray-500">{scheduleModalCourse.title}</p>
                            </div>
                            <button onClick={() => setScheduleModalCourse(null)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        {scheduleSaveSuccess ? (
                            <div className="py-8 text-center space-y-2">
                                <CheckCircle2 className="mx-auto text-emerald-500 w-12 h-12" />
                                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-base">Live Schedule Updated!</h4>
                                <p className="text-xs text-gray-500">Google Meet link, schedule, and exam dates saved.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cohort Interval / Name</label>
                                        <input 
                                            value={scheduleFormData.cohortName || ''} 
                                            onChange={e => setScheduleFormData({...scheduleFormData, cohortName: e.target.value})}
                                            className="w-full p-2.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none font-semibold text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Google Meet Link</label>
                                        <input 
                                            value={scheduleFormData.meetingLink || ''} 
                                            onChange={e => setScheduleFormData({...scheduleFormData, meetingLink: e.target.value})}
                                            placeholder="https://meet.google.com/..."
                                            className="w-full p-2.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-900 dark:text-white font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Lessons Start Date</label>
                                        <input 
                                            type="date" 
                                            value={scheduleFormData.startDate || ''} 
                                            onChange={e => setScheduleFormData({...scheduleFormData, startDate: e.target.value})}
                                            className="w-full p-2.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-900 dark:text-white font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Lessons End Date</label>
                                        <input 
                                            type="date" 
                                            value={scheduleFormData.endDate || ''} 
                                            onChange={e => setScheduleFormData({...scheduleFormData, endDate: e.target.value})}
                                            className="w-full p-2.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-900 dark:text-white font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Days of the Week */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Live Lesson Days</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DAYS_OF_WEEK.map(day => {
                                            const isSel = (scheduleFormData.lessonDays || []).includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleScheduleDay(day)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                        isSel ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Start Time</label>
                                        <input 
                                            type="time" 
                                            value={scheduleFormData.lessonStartTime || '18:00'} 
                                            onChange={e => setScheduleFormData({...scheduleFormData, lessonStartTime: e.target.value})}
                                            className="w-full p-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-900 dark:text-white font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">End Time</label>
                                        <input 
                                            type="time" 
                                            value={scheduleFormData.lessonEndTime || '20:00'} 
                                            onChange={e => setScheduleFormData({...scheduleFormData, lessonEndTime: e.target.value})}
                                            className="w-full p-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-900 dark:text-white font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Timezone</label>
                                        <select 
                                            value={scheduleFormData.timezone || 'EAT (UTC+3)'} 
                                            onChange={e => setScheduleFormData({...scheduleFormData, timezone: e.target.value})}
                                            className="w-full p-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-900 dark:text-white font-semibold"
                                        >
                                            {TIMEZONES.map(tz => (
                                                <option key={tz} value={tz}>{tz}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Default Attendance Code */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-bold uppercase text-gray-500">Default Cohort Attendance PIN</label>
                                        <span className="text-[10px] text-gray-400">Fallback code</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            value={scheduleFormData.attendanceCode || ''} 
                                            onChange={e => setScheduleFormData({...scheduleFormData, attendanceCode: e.target.value.toUpperCase()})}
                                            className="flex-1 p-2 text-xs font-mono font-bold uppercase bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-purple-600 dark:text-purple-400"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={generateModalPin}
                                            className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            <Key size={13} className="inline mr-1" /> New Code
                                        </button>
                                    </div>
                                </div>

                                {/* Assessment Dates */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                                            <HelpCircle size={13} className="text-purple-500" /> Module Quiz Date
                                        </label>
                                        <input 
                                            type="date"
                                            value={scheduleFormData.quizDate || ''} 
                                            onChange={e => setScheduleFormData({...scheduleFormData, quizDate: e.target.value})}
                                            className="w-full p-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-900 dark:text-white font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                                            <Calendar size={13} className="text-emerald-500" /> Final Examination Date
                                        </label>
                                        <input 
                                            type="date" 
                                            value={scheduleFormData.examDate || ''} 
                                            onChange={e => setScheduleFormData({...scheduleFormData, examDate: e.target.value})}
                                            className="w-full p-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-900 dark:text-white font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={() => setScheduleModalCourse(null)} 
                                        className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleSaveSchedule} 
                                        disabled={isSavingSchedule} 
                                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                                    >
                                        {isSavingSchedule ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                        {isSavingSchedule ? 'Saving...' : 'Save Live Schedule'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Broadcast Lesson Alert */}
            {alertModalCourse && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 border border-gray-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Bell className="text-violet-600" size={18} />
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">Broadcast Live Lesson Alert</h3>
                            </div>
                            <button onClick={() => setAlertModalCourse(null)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        {alertSent ? (
                            <div className="py-8 text-center space-y-2">
                                <CheckCircle2 className="mx-auto text-emerald-500 w-12 h-12" />
                                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-base">Lesson Alert Sent!</h4>
                                <p className="text-xs text-gray-500">Google Meet link and attendance PIN broadcasted to students.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-slate-855 p-4 rounded-xl border border-gray-100 dark:border-slate-800 text-xs space-y-2">
                                    <div className="flex justify-between font-bold text-gray-800 dark:text-slate-200">
                                        <span>{alertModalCourse.title}</span>
                                        <span className="text-violet-600">{alertModalCourse.cohortName || 'Active Cohort'}</span>
                                    </div>
                                    {alertLessonTitle && (
                                        <div className="font-bold text-violet-700 dark:text-violet-300">
                                            Lesson: {alertLessonTitle}
                                        </div>
                                    )}
                                    <div className="text-gray-600 dark:text-slate-400 font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800 space-y-1">
                                        <p><strong>🔗 Meet Link:</strong> {alertModalCourse.meetingLink || 'Link not set'}</p>
                                        <p><strong>🔑 Attendance PIN:</strong> <span className="font-bold text-purple-700 dark:text-purple-300">{alertAttendancePin || alertModalCourse.attendanceCode || 'None'}</span></p>
                                        <p><strong>⏰ Schedule:</strong> {(alertModalCourse.lessonDays || []).join(', ')} @ {alertModalCourse.lessonStartTime || '18:00'} ({alertModalCourse.timezone || 'EAT'})</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Optional Message / Lecture Topic</label>
                                    <textarea 
                                        value={alertNote}
                                        onChange={e => setAlertNote(e.target.value)}
                                        rows={3}
                                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
                                        placeholder="e.g. Live class starts in 15 minutes! Please have your environments open."
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={() => setAlertModalCourse(null)} 
                                        className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={confirmBroadcastAlert} 
                                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        <Send size={13} /> Send Notification
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourses;
