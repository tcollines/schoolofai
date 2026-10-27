import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { Course, Cohort, CohortSession, CourseModule } from '../../../../frontend/types';
import { Calendar, Save, Plus, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function CohortScheduler() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [cohortName, setCohortName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [orientationEndDate, setOrientationEndDate] = useState('');
    
    // Modules from selected course
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [sessions, setSessions] = useState<Partial<CohortSession>[]>([]);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        const { data } = await supabaseClient.from('courses').select('*');
        if (data) {
            const formatted = data.map((c: any) => {
                const isNewFormat = Array.isArray(c.modules) && c.modules.length > 0 && 'lessons' in c.modules[0];
                const scheduleData = (c.sections && typeof c.sections === 'object' && !Array.isArray(c.sections)) ? c.sections : {};
                const resolvedSections = isNewFormat
                    ? c.modules
                    : (Array.isArray(scheduleData.sections) && scheduleData.sections.length > 0
                        ? scheduleData.sections
                        : (Array.isArray(c.sections) ? c.sections : undefined));
                return {
                    ...c,
                    sections: resolvedSections,
                    modules: !isNewFormat ? c.modules : undefined,
                    scheduleData
                };
            });
            setCourses(formatted as any[]);
        }
        setLoading(false);
    };

    const handleCourseChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const courseId = e.target.value;
        setSelectedCourseId(courseId);
        
        if (courseId) {
            const course = courses.find(c => c.id === courseId);
            if (course) {
                // Flatten modules from sections
                let allModules: CourseModule[] = [];
                if (course.sections) {
                    allModules = course.sections.flatMap(s => s.lessons);
                } else if (course.modules) {
                    allModules = course.modules;
                }
                setModules(allModules);
                
                // Initialize sessions
                setSessions(allModules.map((m, idx) => {
                    let session_date = '';
                    if (startDate) {
                        const baseDate = new Date(startDate);
                        baseDate.setDate(baseDate.getDate() + (idx + 1) * 7);
                        baseDate.setHours(9, 0, 0, 0);
                        const offset = baseDate.getTimezoneOffset() * 60000;
                        session_date = (new Date(baseDate.getTime() - offset)).toISOString().slice(0, 16);
                    }
                    return {
                        module_id: m.id,
                        attendance_code: generateCode(),
                        session_date,
                        location_link: ''
                    };
                }));
            }
        } else {
            setModules([]);
            setSessions([]);
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setStartDate(val);
        if (val) {
            const d = new Date(val);
            d.setDate(d.getDate() + 3);
            setOrientationEndDate(d.toISOString().split('T')[0]);

            // Auto-generate session dates (every 7 days after start date)
            setSessions(prevSessions => {
                const baseDate = new Date(val);
                return prevSessions.map((s, idx) => {
                    const sessionD = new Date(baseDate);
                    sessionD.setDate(baseDate.getDate() + (idx + 1) * 7);
                    sessionD.setHours(9, 0, 0, 0); // Default to 9:00 AM
                    
                    const offset = sessionD.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(sessionD.getTime() - offset)).toISOString().slice(0, 16);
                    
                    return {
                        ...s,
                        session_date: localISOTime
                    };
                });
            });
        }
    };

    const generateCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const updateSession = (index: number, field: keyof CohortSession, value: string) => {
        const newSessions = [...sessions];
        newSessions[index] = { ...newSessions[index], [field]: value };
        setSessions(newSessions);
    };

    const handleSave = async () => {
        if (!selectedCourseId || !cohortName || !startDate || !orientationEndDate) {
            alert('Please fill out all required cohort fields.');
            return;
        }

        setSaving(true);
        try {
            const targetCourse: any = courses.find(c => c.id === selectedCourseId);
            const existingSchedule = (targetCourse?.scheduleData && typeof targetCourse.scheduleData === 'object')
                ? targetCourse.scheduleData
                : {};
            const existingCohorts = Array.isArray(existingSchedule.cohorts) ? existingSchedule.cohorts : [];
            const newCohortEntry = {
                id: 'cohort-' + Date.now(),
                name: cohortName,
                startDate: startDate,
                endDate: orientationEndDate,
                lessonDays: existingSchedule.lessonDays || ['Monday', 'Wednesday', 'Friday'],
                lessonStartTime: existingSchedule.lessonStartTime || '18:00',
                lessonEndTime: existingSchedule.lessonEndTime || '20:00',
                timezone: existingSchedule.timezone || 'EAT (UTC+3)',
                meetingLink: sessions[0]?.location_link || existingSchedule.meetingLink || '',
                attendanceCode: sessions[0]?.attendance_code || existingSchedule.attendanceCode || ''
            };

            const sessionByModuleId = new Map(sessions.map(s => [s.module_id, s]));
            const updatedSections = (targetCourse?.sections || []).map((sec: any) => ({
                ...sec,
                lessons: (sec.lessons || []).map((les: any) => {
                    const matchedSession = sessionByModuleId.get(les.id);
                    if (!matchedSession) return les;
                    return {
                        ...les,
                        meetLink: matchedSession.location_link || les.meetLink || '',
                        attendanceCode: matchedSession.attendance_code || les.attendanceCode || ''
                    };
                })
            }));

            const { error: updateErr } = await supabaseClient
                .from('courses')
                .update({
                    modules: updatedSections,
                    sections: {
                        ...existingSchedule,
                        cohortName,
                        startDate,
                        endDate: orientationEndDate,
                        cohorts: [...existingCohorts, newCohortEntry],
                        sections: updatedSections
                    }
                })
                .eq('id', selectedCourseId);

            if (updateErr) throw updateErr;
            window.dispatchEvent(new Event('courses-update'));

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setCohortName('');
                setStartDate('');
                setOrientationEndDate('');
                setSelectedCourseId('');
                setModules([]);
                setSessions([]);
            }, 3000);

        } catch (error: any) {
            alert('Error creating cohort: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2" /> Loading courses...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cohort Scheduler</h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Schedule new cohorts and manage physical sessions.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cohort Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Curriculum</label>
                        <select 
                            value={selectedCourseId}
                            onChange={handleCourseChange}
                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        >
                            <option value="">-- Choose a Course --</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Cohort Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. September Intake"
                            value={cohortName}
                            onChange={e => setCohortName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Start Date</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={handleStartDateChange}
                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Orientation End Date (Auto +3 Days)</label>
                        <input 
                            type="date" 
                            value={orientationEndDate}
                            onChange={e => setOrientationEndDate(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {selectedCourseId && modules.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Module Sessions & LIVELESSON Codes</h2>
                    <div className="space-y-4">
                        {modules.map((mod, idx) => (
                            <div key={mod.id} className="p-4 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-950/50 flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{idx + 1}. {mod.title}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Session Date & Time</label>
                                            <input 
                                                type="datetime-local" 
                                                value={sessions[idx]?.session_date || ''}
                                                onChange={e => updateSession(idx, 'session_date', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Location / Meet Link</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Room 101 or Zoom Link"
                                                value={sessions[idx]?.location_link || ''}
                                                onChange={e => updateSession(idx, 'location_link', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Attendance Code</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={sessions[idx]?.attendance_code || ''}
                                                    onChange={e => updateSession(idx, 'attendance_code', e.target.value)}
                                                    className="w-full font-mono font-bold text-violet-600 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm uppercase"
                                                    maxLength={6}
                                                />
                                                <button 
                                                    onClick={() => updateSession(idx, 'attendance_code', generateCode())}
                                                    className="px-2 py-1 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 rounded text-xs font-medium transition-colors"
                                                >
                                                    Regen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : (success ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />)}
                            {saving ? 'Saving...' : (success ? 'Saved!' : 'Launch Cohort')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
