const fs = require('fs');

const adminCoursesCode = `import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { Course } from '../../types';
import { 
    Plus, X, Edit3, Trash2, Calendar, Clock, Globe, Copy, Send, 
    Key, ExternalLink, Check, Bell, Radio, CheckCircle2, ShieldCheck, 
    BookOpen, HelpCircle, Save, Loader2
} from 'lucide-react';
import { formatAmount, getCurrencyPreference, CurrencyType } from '../../lib/currency';
import { broadcastLessonNotification } from './AdminCourseSetupWizard';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMEZONES = ['EAT (UTC+3)', 'UTC+0 (GMT)', 'CAT (UTC+2)', 'WAT (UTC+1)', 'EST (UTC-5)', 'PST (UTC-8)', 'IST (UTC+5:30)'];

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

    const [alertModalCourse, setAlertModalCourse] = useState<Course | null>(null);
    const [alertNote, setAlertNote] = useState('');
    const [alertSent, setAlertSent] = useState(false);
    const [copiedCardMeet, setCopiedCardMeet] = useState<string | null>(null);

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
            attendanceCode: course.attendanceCode || 'WEL-' + Math.floor(1000 + Math.random() * 9000),
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
            alert(\`Error updating schedule: \${err.message || err}\`);
        } finally {
            setIsSavingSchedule(false);
        }
    };

    const handleSendAlert = (course: Course) => {
        setAlertModalCourse(course);
        setAlertNote('');
        setAlertSent(false);
    };

    const confirmBroadcastAlert = () => {
        if (!alertModalCourse) return;
        const ok = broadcastLessonNotification(
            alertModalCourse.title,
            alertModalCourse.cohortName || 'Live Cohort',
            alertModalCourse.meetingLink || '',
            alertModalCourse.attendanceCode || '',
            alertModalCourse.lessonDays || ['Monday', 'Wednesday', 'Friday'],
            alertModalCourse.lessonStartTime || '18:00',
            alertModalCourse.lessonEndTime || '20:00',
            alertModalCourse.timezone || 'EAT (UTC+3)',
            alertNote
        );
        if (ok) {
            setAlertSent(true);
            setTimeout(() => {
                setAlertSent(false);
                setAlertModalCourse(null);
                setAlertNote('');
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
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'WEL-';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setScheduleFormData(prev => ({ ...prev, attendanceCode: code }));
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
                        Course Management
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Manage live Google Meet cohorts, update quiz & exam dates anytime, and broadcast lesson notifications.
                    </p>
                </div>
                <button 
                    onClick={() => navigate(isInstructor ? '/instructor/courses/setup' : '/courses/setup')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-colors shadow-sm cursor-pointer"
                >
                    <Plus size={18} /> New Course Wizard
                </button>
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
                                                objectPosition: \`\${c.imagePositionX ?? 50}% \${c.imagePositionY ?? 50}%\`,
                                                transform: \`scale(\${c.imageScale ?? 1})\`,
                                                transformOrigin: \`\${c.imagePositionX ?? 50}% \${c.imagePositionY ?? 50}%\`
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <BookOpen size={36} opacity={0.4} />
                                        </div>
                                    )}

                                    {/* Badges Overlay */}
                                    <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 justify-end">
                                        {c.isDraft ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm bg-gray-200/90 text-gray-800 backdrop-blur-sm">
                                                DRAFT
                                            </span>
                                        ) : c.isVerified === false ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm bg-amber-100/90 text-amber-800 border border-amber-300 backdrop-blur-sm">
                                                PENDING
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm bg-emerald-100/90 text-emerald-800 border border-emerald-300 backdrop-blur-sm">
                                                VERIFIED
                                            </span>
                                        )}
                                        <span className={\`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm \${c.accessTier === 'PAID' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}\`}>
                                            {c.accessTier || 'FREE'}
                                        </span>
                                    </div>

                                    {/* Cohort interval pill on image */}
                                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                        <Radio size={12} className="text-emerald-400 animate-pulse" />
                                        <span>{c.cohortName || 'Active Cohort'}</span>
                                    </div>
                                </div>

                                {/* Course Card Body */}
                                <div className="p-5 space-y-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">{c.title}</h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{c.category} • {c.instructor}</p>
                                    </div>

                                    {/* Live Schedule Details Box */}
                                    <div className="bg-gray-50 dark:bg-slate-850 p-3 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2 text-xs">
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

                                        <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-slate-800">
                                            <div className="flex items-center gap-1 text-[11px]">
                                                <Key size={12} className="text-purple-500" />
                                                <span className="text-gray-500">PIN:</span>
                                                <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{c.attendanceCode || 'WEL-8492'}</span>
                                            </div>
                                            {c.examDate && (
                                                <span className="text-[10px] text-gray-400">
                                                    Exam: <strong className="text-gray-600 dark:text-slate-300">{c.examDate}</strong>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-4 pt-0 border-t border-gray-100 dark:border-slate-800 mt-2 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-2 pt-2">
                                    {/* Broadcast Alert Button */}
                                    <button 
                                        type="button"
                                        onClick={() => handleSendAlert(c)}
                                        className="flex-1 py-2 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                        title="Broadcast Google Meet link & attendance PIN"
                                    >
                                        <Bell size={13} /> Send Alert
                                    </button>

                                    {/* Live Schedule & Exam Dates Settings */}
                                    <button 
                                        type="button"
                                        onClick={() => openScheduleModal(c)}
                                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                        title="Edit live schedule, Google Meet link, and exam dates"
                                    >
                                        <Calendar size={13} /> Live Dates
                                    </button>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-1 px-1">
                                    <button 
                                        onClick={() => navigate(isInstructor ? \`/instructor/courses/setup?courseId=\${c.id}\` : \`/courses/setup?courseId=\${c.id}\`)}
                                        className="text-violet-600 dark:text-violet-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        <Edit3 size={12} /> Edit Syllabus
                                    </button>

                                    <button 
                                        onClick={async () => {
                                            if (window.confirm(\`Are you sure you want to delete "\${c.title}"?\`)) {
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

            {/* Modal: Live Schedule & Exam Dates Editor (Available Even When Launched) */}
            {scheduleModalCourse && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 border border-gray-100 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                    <Calendar className="text-violet-600" size={18} />
                                    Live Schedule & Exam Dates (Live Course)
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{scheduleModalCourse.title}</p>
                            </div>
                            <button onClick={() => setScheduleModalCourse(null)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        {scheduleSaveSuccess ? (
                            <div className="py-8 text-center space-y-2">
                                <CheckCircle2 className="mx-auto text-emerald-500 w-12 h-12" />
                                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-base">Schedule Updated Successfully!</h4>
                                <p className="text-xs text-gray-500">Live lecture dates, Google Meet link, and exam schedule saved.</p>
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
                                                    className={\`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer \${
                                                        isSel ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                                                    }\`}
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

                                {/* Attendance Code */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Student Attendance PIN</label>
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
                                <div className="bg-gray-50 dark:bg-slate-850 p-4 rounded-xl border border-gray-100 dark:border-slate-800 text-xs space-y-2">
                                    <div className="flex justify-between font-bold text-gray-800 dark:text-slate-200">
                                        <span>{alertModalCourse.title}</span>
                                        <span className="text-violet-600">{alertModalCourse.cohortName || 'Active Cohort'}</span>
                                    </div>
                                    <div className="text-gray-600 dark:text-slate-400 font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800 space-y-1">
                                        <p><strong>🔗 Meet Link:</strong> {alertModalCourse.meetingLink || 'Link not set'}</p>
                                        <p><strong>🔑 Attendance PIN:</strong> {alertModalCourse.attendanceCode || 'None'}</p>
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
`;

fs.writeFileSync('admin-portal/src/components/admin/AdminCourses.tsx', adminCoursesCode, 'utf8');
console.log('Successfully written admin-portal AdminCourses.tsx');

// Write to frontend with adjusted hook import
const frontendCoursesCode = adminCoursesCode.replace(
    "import { useAdmin } from '../../hooks/useAdmin';",
    "import { useAdmin } from '../../src/hooks/useAdmin';"
).replace(
    "import { formatAmount, getCurrencyPreference, CurrencyType } from '../../lib/currency';",
    "import { formatAmount, getCurrencyPreference, CurrencyType } from '../../src/lib/currency';"
);

fs.writeFileSync('frontend/components/admin/AdminCourses.tsx', frontendCoursesCode, 'utf8');
console.log('Successfully written frontend AdminCourses.tsx');
