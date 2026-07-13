import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle, PlayCircle, BookOpen, MessageSquare, Award } from 'lucide-react';
import { Course, CourseStatus } from '../types';
import { useTranslation } from './translations';

interface DashboardHomeProps {
    courses: Course[];
    userId?: string;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ courses, userId }) => {
    const { t } = useTranslation();
    const activeCourse = courses.find(c => c.status === CourseStatus.IN_PROGRESS);
    const enrolledCourses = courses.filter(c => c.status === CourseStatus.IN_PROGRESS || c.status === CourseStatus.COMPLETED);

    const [recentCourse, setRecentCourse] = useState<Course | null>(null);
    const [quizGrades, setQuizGrades] = useState<any[]>([]);

    useEffect(() => {
        const loadQuizGrades = () => {
            const stored = localStorage.getItem('quiz-grades');
            if (stored) {
                setQuizGrades(JSON.parse(stored));
            }
        };
        loadQuizGrades();
        window.addEventListener('storage', loadQuizGrades);
        window.addEventListener('quiz-grades-update', loadQuizGrades);
        return () => {
            window.removeEventListener('storage', loadQuizGrades);
            window.removeEventListener('quiz-grades-update', loadQuizGrades);
        };
    }, []);

    useEffect(() => {
        const recentId = localStorage.getItem('recent-tapped-course-id');
        if (recentId) {
            const course = courses.find(c => c.id === recentId);
            if (course) {
                setRecentCourse(course);
            }
        }
    }, [courses]);

    // Dynamic stats based on enrolled courses
    const chartData = [
        { name: 'Su', hours: enrolledCourses.length > 0 ? 1 : 0 },
        { name: 'Mo', hours: enrolledCourses.length > 0 ? 2 : 0 },
        { name: 'Tu', hours: enrolledCourses.length > 0 ? 1.5 : 0 },
        { name: 'We', hours: enrolledCourses.length > 0 ? 3 : 0 },
        { name: 'Th', hours: enrolledCourses.length > 0 ? 0.5 : 0 },
        { name: 'Fr', hours: enrolledCourses.length > 0 ? 2 : 0 },
        { name: 'Sa', hours: enrolledCourses.length > 0 ? 4 : 0 }
    ];

    const schedule = enrolledCourses.slice(0, 3).map((course, idx) => ({
        id: course.id,
        title: course.title,
        type: 'Lecture',
        time: `${9 + idx}:00 AM`,
        color: ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600'][idx % 3],
        icon: <BookOpen size={16} />
    }));

    const [assignments, setAssignments] = useState<any[]>([]);
    const enrolledCourseIdsStr = enrolledCourses.map(c => c.id).join(',');

    useEffect(() => {
        const loadAssignments = () => {
            const stored = localStorage.getItem('admin-assignments');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Filter assignments for courses the student is enrolled in, or global assignments
                const filtered = parsed.filter((asg: any) =>
                    asg.courseId === 'global' || enrolledCourses.some(c => c.id === asg.courseId)
                );

                const formatted = filtered.map((asg: any) => {
                    let dispDate = asg.dueDate;
                    try {
                        const dateObj = new Date(asg.dueDate);
                        if (!isNaN(dateObj.getTime())) {
                            dispDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                        }
                    } catch (e) { }
                    return {
                        id: asg.id,
                        title: asg.title,
                        dueDate: `Due ${dispDate}`,
                        status: asg.status
                    };
                });
                setAssignments(formatted);
            } else {
                // Default fallback to mock assignments
                const defaultAssignments = enrolledCourses.slice(0, 3).map((course, idx) => ({
                    id: `default-${course.id}-${idx}`,
                    title: `${course.title} - Final Assessment`,
                    dueDate: `Tomorrow, ${10 + idx}:00 AM`,
                    status: idx === 0 ? 'Completed' : 'In Progress'
                }));
                setAssignments(defaultAssignments);
            }
        };

        loadAssignments();
        window.addEventListener('storage', loadAssignments);
        window.addEventListener('admin-assignments-update', loadAssignments);
        return () => {
            window.removeEventListener('storage', loadAssignments);
            window.removeEventListener('admin-assignments-update', loadAssignments);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enrolledCourseIdsStr]);

    const targetCourse = recentCourse || (enrolledCourses.length > 0 ? enrolledCourses[0] : null);
    const allLessons = targetCourse?.sections?.flatMap(s => s.lessons) || [];
    const nextLessonIndex = targetCourse ? Math.min(targetCourse.lessonsCompleted || 0, Math.max(0, allLessons.length - 1)) : 0;
    const nextLesson = allLessons[nextLessonIndex];

    const frequentGroups = [
        { id: 'general', name: 'General Discussion', desc: 'Global community chat room' },
        { id: 'ai-help', name: 'AI Study Assistant Help Desk', desc: 'Interactive AI tutor guidance' },
        ...enrolledCourses.slice(0, 1).map(c => ({
            id: `course-${c.id}`,
            name: `${c.title} Study Group`,
            desc: 'Course curriculum study channel'
        }))
    ];

    if (!userId) return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Loading dashboard...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <style>{`
                :root {
                    --chart-bar: #111111;
                }
                .dark {
                    --chart-bar: #cbd5e1;
                }
            `}</style>
            {/* Left Column - Main Stats */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">

                {/* New Courses / Recommended Row */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-slate-200">{t('new_courses')}</h3>
                        <button className="text-sm text-welile-purple font-medium hover:underline">{t('view_all')}</button>
                    </div>
                    {courses.filter(c => c.status === CourseStatus.NOT_STARTED && !c.isDraft).length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 text-center">
                            <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">No new courses available right now.</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">Head over to the <span className="font-bold text-welile-purple">Discover</span> tab to find your next adventure!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {courses.filter(c => c.status === CourseStatus.NOT_STARTED && !c.isDraft).slice(0, 3).map((course) => (
                                <div key={course.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                                    <div className="flex gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs shrink-0">
                                            {course.category.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{course.title}</h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{course.duration}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-slate-500">Rate</p>
                                            <p className="font-bold text-sm text-gray-800 dark:text-slate-200">★ {course.rating}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-gray-50 dark:bg-slate-800 rounded-full text-xs font-medium text-gray-600 dark:text-slate-300">
                                            {course.category}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Activity Chart */}
                <section className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-slate-200">{t('learning_activity')}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <TrendingUp size={14} className="text-green-500" />
                                <p className="text-xs text-gray-500 dark:text-slate-400"><span className="text-green-500 font-bold">+3%</span> increase than last week</p>
                            </div>
                        </div>
                        <select className="text-xs bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-none rounded-lg px-2 py-1 outline-none">
                            <option>Weekly</option>
                            <option>Monthly</option>
                        </select>
                    </div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="hours"
                                    fill="var(--chart-bar)"
                                    radius={[6, 6, 6, 6]}
                                    barSize={12}
                                    activeBar={{ fill: '#8b5cf6' }} // Purple on hover
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Active Course Card */}
                {activeCourse && (
                    <section className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-slate-200">Course You're Taking</h3>
                            <div className="w-8 h-8 rounded-full bg-welile-lime flex items-center justify-center cursor-pointer hover:bg-lime-300">
                                <PlayCircle size={16} />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-full sm:w-16 h-32 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-gray-50 dark:bg-slate-800">
                                <img
                                    src={activeCourse.image}
                                    alt={activeCourse.title}
                                    className="w-full h-full object-cover"
                                    style={{
                                        objectPosition: `${activeCourse.imagePositionX ?? 50}% ${activeCourse.imagePositionY ?? 50}%`,
                                        transform: `scale(${activeCourse.imageScale ?? 1})`,
                                        transformOrigin: `${activeCourse.imagePositionX ?? 50}% ${activeCourse.imagePositionY ?? 50}%`
                                    }}
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <h4 className="font-bold text-gray-900 dark:text-white">{activeCourse.title}</h4>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{activeCourse.instructor}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500">
                                    <span>Remaining: 8h 45min</span>
                                </div>
                            </div>
                            <div className="w-full sm:w-auto text-right">
                                <div className="flex items-center gap-2 sm:block">
                                    <span className="text-xs font-bold text-gray-600 dark:text-slate-355 sm:hidden">Progress:</span>
                                    <div className="radial-progress text-welile-purple text-xs font-bold" style={{ "--value": Math.round((activeCourse.lessonsTotal > 0 ? (activeCourse.lessonsCompleted / activeCourse.lessonsTotal) * 60 : 0) + (activeCourse.examCompleted ? 40 : 0)) } as any}>
                                        {Math.round((activeCourse.lessonsTotal > 0 ? (activeCourse.lessonsCompleted / activeCourse.lessonsTotal) * 60 : 0) + (activeCourse.examCompleted ? 40 : 0))}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Right Column */}
            <div className="space-y-6 lg:space-y-8">
                {/* Premium Banner */}
                <div className="bg-[#1a1a2e] p-6 rounded-3xl text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold text-xl mb-1">{t('go_premium')}</h3>
                        <p className="text-xs text-gray-400 mb-4 max-w-[150px]">{t('explore_courses')}</p>
                        <button className="bg-welile-lime text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-lime-300 transition-colors">
                            {t('go_premium')}
                        </button>
                    </div>
                    {/* Abstract illustration circles */}
                    <div className="absolute top-8 right-[-20px] w-24 h-24 rounded-full bg-welile-purple opacity-20"></div>
                    <div className="absolute bottom-[-10px] right-8 w-16 h-16 rounded-full bg-pink-500 opacity-20"></div>
                </div>

                {/* Schedule */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-4">
                        {targetCourse ? 'Your Active Course' : t('daily_schedule')}
                    </h3>
                    <div
                        onClick={() => {
                            if (targetCourse) {
                                localStorage.setItem('recent-tapped-course-id', targetCourse.id);
                                window.location.href = `/courses`;
                            } else {
                                window.location.href = `/discover`;
                            }
                        }}
                        className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/40 p-2 rounded-2xl transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shrink-0">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                                        {targetCourse ? targetCourse.title : 'No Enrolled Courses'}
                                    </h4>
                                    {targetCourse && (
                                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded shrink-0">
                                            {targetCourse.lessonsCompleted} / {targetCourse.lessonsTotal} Completed
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    {targetCourse ? (
                                        targetCourse.lessonsCompleted >= targetCourse.lessonsTotal && targetCourse.lessonsTotal > 0 ? (
                                            'Course Completed! 🎉'
                                        ) : nextLesson ? (
                                            `Next: ${nextLesson.title} (${nextLesson.duration})`
                                        ) : (
                                            'No lessons available'
                                        )
                                    ) : (
                                        'Tap here to discover and enroll in courses'
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-gray-150 dark:border-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 group-hover:bg-gray-105 dark:group-hover:bg-slate-800 transition-colors shrink-0">
                            ›
                        </div>
                    </div>
                </div>

                {/* Frequent Discussion Groups */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-4">Frequent Groups</h3>
                    <div className="space-y-3">
                        {frequentGroups.map((group) => (
                            <div
                                key={group.id}
                                onClick={() => {
                                    localStorage.setItem('selected-discussion-group-id', group.id);
                                    window.location.href = '/discussions';
                                }}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/40 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-violet-100 dark:bg-violet-955/40 text-violet-600 dark:text-violet-400 rounded-xl shrink-0">
                                        <MessageSquare size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">{group.name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{group.desc}</p>
                                    </div>
                                </div>
                                <div className="text-[10px] text-violet-600 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-950/20 px-2.5 py-1 rounded-full shrink-0">
                                    Open
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Assignments */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-slate-200">{t('assignments')}</h3>
                    </div>
                    {assignments.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">No active assignments.</p>
                    ) : (
                        <div className="space-y-3">
                            {assignments.map((assignment, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                            <CheckCircle size={14} className={assignment.status === 'Completed' ? "text-green-600" : "text-purple-600"} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{assignment.title}</p>
                                            <p className="text-xs text-gray-400 dark:text-slate-500">{assignment.dueDate}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${assignment.status === 'Completed' ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400' : 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'}`}>
                                        {assignment.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quiz Grades & Marks */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-slate-200">Quiz Grades & Marks</h3>
                    </div>
                    {quizGrades.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">No quizzes submitted yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {quizGrades.map((grade, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-805/50 rounded-2xl border border-gray-100/30 dark:border-slate-700/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-955/20 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
                                            <Award size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{grade.quizTitle}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{grade.courseTitle}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                                            grade.percentage >= 80 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' 
                                                : grade.percentage >= 50
                                                    ? 'bg-amber-100 text-amber-705 dark:bg-amber-950/30 dark:text-amber-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                        }`}>
                                            {grade.score}/{grade.totalQuestions} ({grade.percentage}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default DashboardHome;