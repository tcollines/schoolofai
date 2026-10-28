import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle, PlayCircle, BookOpen, MessageSquare, Award, Shield, Star, PartyPopper, ArrowRight, Building2 } from 'lucide-react';
import { Course, CourseStatus } from '../types';
import { useTranslation } from './translations';
import { supabaseClient } from '../src/lib/supabaseClient';
import { getWeeklyLearningActivity, getMonthlyLearningActivity } from '../src/utils/activity';

interface DashboardHomeProps {
    courses: Course[];
    userId?: string;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ courses, userId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const activeCourse = courses.find(c => c.status === CourseStatus.IN_PROGRESS);
    const enrolledCourses = courses.filter(c => c.status === CourseStatus.IN_PROGRESS || c.status === CourseStatus.COMPLETED);

    const [recentCourse, setRecentCourse] = useState<Course | null>(null);
    const [quizGrades, setQuizGrades] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string>(() => {
        if (userId && userId !== 'guest' && localStorage.getItem(`user_company_name_${userId}`)) return 'SPONSORED';
        return 'INDIVIDUAL';
    });
    const [companyName, setCompanyName] = useState<string>(() => {
        if (userId && userId !== 'guest') return localStorage.getItem(`user_company_name_${userId}`) || '';
        return '';
    });

    // Cohort & Orientation Lock State
    const [cohort, setCohort] = useState<any>(null);
    const [isOrientationLocked, setIsOrientationLocked] = useState(false);

    // Tap/Click Animation States
    const [particles, setParticles] = useState<{
        id: number;
        x: number;
        y: number;
        color: string;
        size: number;
        angle: number;
        speed: number;
        type: 'circle' | 'sparkle';
    }[]>([]);
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

    const handleDashboardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent ripple if clicking certain interactive elements if needed, 
        // but it's much better/fun to trigger it everywhere on the dashboard!
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = {
            id: Date.now() + Math.random(),
            x,
            y
        };

        const colors = ['#7c3aed', '#bef264', '#3b82f6', '#ec4899', '#10b981', '#fbbf24'];
        const newParticles = Array.from({ length: 10 }).map((_, i) => {
            const isSparkle = Math.random() > 0.4;
            return {
                id: Date.now() + i + Math.random(),
                x,
                y,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 6,
                angle: (i * 36 + Math.random() * 15) * (Math.PI / 180),
                speed: Math.random() * 3 + 2,
                type: (isSparkle ? 'sparkle' : 'circle') as 'circle' | 'sparkle'
            };
        });

        setRipples(prev => [...prev, newRipple]);
        setParticles(prev => [...prev, ...newParticles]);
    };

    const removeParticle = (id: number) => {
        setParticles(prev => prev.filter(p => p.id !== id));
    };

    const removeRipple = (id: number) => {
        setRipples(prev => prev.filter(r => r.id !== id));
    };

    useEffect(() => {
        const fetchRole = async () => {
            if (!userId || userId === 'guest') return;
            try {
                const userSpecificCompany = localStorage.getItem(`user_company_name_${userId}`);
                if (userSpecificCompany) {
                    setCompanyName(userSpecificCompany);
                    setUserRole('SPONSORED');
                }

                const cached = localStorage.getItem(`student-profile-${userId}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed.role && parsed.role !== 'SPONSORED') {
                        setUserRole(parsed.role);
                    }
                    if (parsed.company_name || parsed.companyName) {
                        setCompanyName(parsed.company_name || parsed.companyName);
                        setUserRole('SPONSORED');
                    }
                }
                
                const { data } = await supabaseClient
                    .from('profiles')
                    .select('role, company_name')
                    .eq('id', userId)
                    .single();
                if (data) {
                    if (data.role) setUserRole(data.role);
                    if (data.company_name) {
                        setCompanyName(data.company_name);
                        localStorage.setItem(`user_company_name_${userId}`, data.company_name);
                        localStorage.setItem('user_company_name', data.company_name);
                        setUserRole('SPONSORED');
                    }
                    const storedProfile = localStorage.getItem(`student-profile-${userId}`);
                    const parsedProfile = storedProfile ? JSON.parse(storedProfile) : {};
                    localStorage.setItem(`student-profile-${userId}`, JSON.stringify({
                        ...parsedProfile,
                        role: data.role || parsedProfile.role,
                        company_name: data.company_name || parsedProfile.company_name
                    }));
                }

                // Verify corporate organization endpoint for live corporate accounts
                try {
                    const orgRes = await fetch(`/api/corporate/organization?userId=${encodeURIComponent(userId)}`);
                    if (orgRes.ok) {
                        const orgJson = await orgRes.json();
                        if (orgJson.data?.name && orgJson.data.name !== 'Corporate Partner') {
                            setCompanyName(orgJson.data.name);
                            localStorage.setItem(`user_company_name_${userId}`, orgJson.data.name);
                            localStorage.setItem('user_company_name', orgJson.data.name);
                            localStorage.setItem('user_plan', 'corporate');
                            setUserRole('SPONSORED');
                        } else if (!orgJson?.data && (!data?.role || data.role !== 'SPONSORED') && !data?.company_name) {
                            // Non-corporate account - clear corporate state
                            setCompanyName('');
                            localStorage.removeItem(`user_company_name_${userId}`);
                        }
                    }
                } catch (orgErr) {}
            } catch (e) {
                console.error(e);
            }
        };
        fetchRole();
        window.addEventListener('profile-update', fetchRole);
        return () => {
            window.removeEventListener('profile-update', fetchRole);
        };
    }, [userId]);

    useEffect(() => {
        if (!userId || userId === 'guest') return;
        const enrolledCourseWithCohort = courses.find(
            c => (c.status === CourseStatus.IN_PROGRESS || c.status === CourseStatus.COMPLETED) && (c.startDate || c.cohortName)
        );
        if (enrolledCourseWithCohort && enrolledCourseWithCohort.startDate) {
            const startD = new Date(enrolledCourseWithCohort.startDate);
            if (!isNaN(startD.getTime())) {
                const orientEnd = new Date(startD);
                orientEnd.setDate(orientEnd.getDate() + 3);
                setCohort({
                    id: `cohort-${enrolledCourseWithCohort.id}`,
                    course_id: enrolledCourseWithCohort.id,
                    name: enrolledCourseWithCohort.cohortName || 'Cohort 1',
                    start_date: enrolledCourseWithCohort.startDate,
                    orientation_end_date: orientEnd.toISOString().split('T')[0]
                });
                setIsOrientationLocked(false);
            }
        }
    }, [userId, courses]);

    useEffect(() => {
        if (!userId || userId === 'guest') return;
        const userEmail = localStorage.getItem('auth_logged_in_email') || userId;
        const loadQuizGrades = () => {
            const stored = localStorage.getItem(`quiz-grades-${userEmail}`);
            if (stored) {
                setQuizGrades(JSON.parse(stored));
            } else {
                setQuizGrades([]);
            }
        };
        loadQuizGrades();
        window.addEventListener('storage', loadQuizGrades);
        window.addEventListener('quiz-grades-update', loadQuizGrades);
        return () => {
            window.removeEventListener('storage', loadQuizGrades);
            window.removeEventListener('quiz-grades-update', loadQuizGrades);
        };
    }, [userId]);

    useEffect(() => {
        if (!userId || userId === 'guest') return;
        const userEmail = localStorage.getItem('auth_logged_in_email') || userId;
        const recentId = localStorage.getItem(`recent-tapped-course-id-${userEmail}`);
        if (recentId) {
            const course = courses.find(c => c.id === recentId);
            if (course) {
                setRecentCourse(course);
            }
        } else {
            setRecentCourse(null);
        }
    }, [courses, userId]);

    const [activityTimeframe, setActivityTimeframe] = useState<'Weekly' | 'Monthly'>('Weekly');
    const [activityVersion, setActivityVersion] = useState(0);

    useEffect(() => {
        const handleActivityUpdate = () => setActivityVersion(v => v + 1);
        window.addEventListener('learning-activity-update', handleActivityUpdate);
        return () => window.removeEventListener('learning-activity-update', handleActivityUpdate);
    }, []);

    // Total completed lessons across all enrolled courses
    const totalLessonsCompleted = enrolledCourses.reduce((sum, c) => sum + (c.lessonsCompleted || 0), 0);

    // Live activity metrics (weekly and monthly)
    const weeklyStats = getWeeklyLearningActivity(userId, enrolledCourses.length, totalLessonsCompleted);
    const monthlyStats = getMonthlyLearningActivity(userId, enrolledCourses.length, totalLessonsCompleted);

    const activeChartData = activityTimeframe === 'Weekly' ? weeklyStats.weeklyData : monthlyStats.monthlyData;
    const activePercentChange = activityTimeframe === 'Weekly' ? weeklyStats.percentChange : monthlyStats.percentChange;
    const isIncrease = activityTimeframe === 'Weekly' ? weeklyStats.isIncrease : monthlyStats.isIncrease;

    // Live available courses from database
    const availableCourses = courses.filter(c => !c.isDraft && c.isVerified !== false);
    const sortedAvailableCourses = [...availableCourses].sort((a, b) => {
        const aEnrolled = a.status !== CourseStatus.NOT_STARTED;
        const bEnrolled = b.status !== CourseStatus.NOT_STARTED;
        if (!aEnrolled && bEnrolled) return -1;
        if (aEnrolled && !bEnrolled) return 1;
        return 0;
    });

    const schedule = enrolledCourses.slice(0, 3).map((course, idx) => ({
        id: course.id,
        title: course.title,
        type: 'Lecture',
        time: `${9 + idx}:00 AM`,
        color: ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600'][idx % 3],
        icon: <BookOpen size={16} />
    }));



    // Only show recentCourse in "Your Active Course" if user is actually enrolled in it
    const targetCourse = (recentCourse && recentCourse.status !== CourseStatus.NOT_STARTED) 
        ? recentCourse 
        : (enrolledCourses.length > 0 ? enrolledCourses[0] : null);
    const allLessons = targetCourse?.sections?.flatMap(s => s.lessons) || [];
    const nextLessonIndex = targetCourse ? Math.min(targetCourse.lessonsCompleted || 0, Math.max(0, allLessons.length - 1)) : 0;
    const nextLesson = allLessons[nextLessonIndex];



    if (!userId) return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Loading dashboard...</div>;

    return (
        <div onClick={handleDashboardClick} className="relative w-full min-h-full overflow-hidden pb-10">
            <style>{`
                :root {
                    --chart-bar: #111111;
                }
                .dark {
                    --chart-bar: #cbd5e1;
                }
                @keyframes particle-fade {
                    0% {
                        transform: translate(0, 0) scale(1) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(var(--dx), var(--dy)) scale(0) rotate(180deg);
                        opacity: 0;
                    }
                }
                @keyframes ripple-expand {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0.6;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(2.2);
                        opacity: 0;
                    }
                }
                .tap-particle {
                    position: absolute;
                    pointer-events: none;
                    z-index: 9999;
                    animation: particle-fade 0.7s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
                }
                .tap-particle.circle {
                    border-radius: 50%;
                }
                .tap-particle.sparkle {
                    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
                }
                .tap-ripple {
                    position: absolute;
                    pointer-events: none;
                    border: 3px solid #7c3aed;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    z-index: 9998;
                    animation: ripple-expand 0.5s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
                }
            `}</style>

            {/* Tap/Click ripples & particles */}
            {ripples.map(r => (
                <div 
                    key={r.id}
                    className="tap-ripple"
                    style={{ left: r.x, top: r.y }}
                    onAnimationEnd={() => removeRipple(r.id)}
                />
            ))}
            {particles.map(p => {
                const dx = `${Math.cos(p.angle) * p.speed * 30}px`;
                const dy = `${Math.sin(p.angle) * p.speed * 30}px`;
                return (
                    <div
                        key={p.id}
                        className={`tap-particle ${p.type}`}
                        style={{
                            left: p.x,
                            top: p.y,
                            width: p.size,
                            height: p.size,
                            backgroundColor: p.color,
                            '--dx': dx,
                            '--dy': dy,
                        } as any}
                        onAnimationEnd={() => removeParticle(p.id)}
                    />
                );
            })}

            {isOrientationLocked && cohort && (
                <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 mb-6 rounded-r-xl shadow-sm">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <Shield className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium">Orientation Week Locked</h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>Welcome to {cohort.name}! You are currently in the orientation phase until {new Date(cohort.orientation_end_date).toLocaleDateString()}. Main course modules are locked. Please review the syllabus, intro videos, and join the cohort community chat.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Main Stats */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">

                {/* Available Courses Section */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800 dark:text-slate-200">Available Courses</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                {sortedAvailableCourses.length} Available
                            </span>
                        </div>
                        <button
                            onClick={() => navigate('/discover')}
                            className="text-xs font-semibold text-welile-purple hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            Explore All <ArrowRight size={13} />
                        </button>
                    </div>

                    {sortedAvailableCourses.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 text-center">
                            <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">No courses available right now.</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">Head over to the <span className="font-bold text-welile-purple">Discover</span> tab to browse!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {sortedAvailableCourses.slice(0, 6).map((course) => {
                                const isEnrolled = course.status !== CourseStatus.NOT_STARTED;

                                return (
                                    <div 
                                        key={course.id} 
                                        onClick={() => isEnrolled ? navigate('/courses') : navigate(`/discover/${course.id}`)}
                                        className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:transform hover:-translate-y-1 hover:border-welile-purple dark:hover:border-purple-600 transition-all duration-300 cursor-pointer relative flex flex-col justify-between"
                                    >
                                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
                                            {isEnrolled ? (
                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                                                    Enrolled
                                                </span>
                                            ) : course.accessTier === 'PAID' && userRole === 'INDIVIDUAL' ? (
                                                <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1">
                                                    <Shield size={9} /> Premium
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-bold">
                                                    Free
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex gap-3 mb-3 pr-16">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs shrink-0">
                                                    {course.category ? course.category.substring(0, 2).toUpperCase() : 'AI'}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug">{course.title}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{course.duration} • {course.instructor}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mt-4 pt-2 border-t border-gray-50 dark:border-slate-800/60">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500">Rating</p>
                                                <p className="font-bold text-sm text-gray-800 dark:text-slate-200 flex items-center">
                                                    <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-400" /> {course.rating || '4.8'}
                                                </p>
                                            </div>
                                            <div className="px-2.5 py-1 bg-gray-50 dark:bg-slate-800 rounded-full text-xs font-medium text-gray-600 dark:text-slate-300">
                                                {course.category}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Activity Chart */}
                <section className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-slate-200">{t('learning_activity')}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <TrendingUp size={14} className={isIncrease ? "text-green-500" : "text-amber-500"} />
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    <span className={`${isIncrease ? "text-green-500" : "text-amber-500"} font-bold`}>{activePercentChange}</span> than last week
                                    <span className="ml-1 text-gray-400 dark:text-slate-500">({activityTimeframe === 'Weekly' ? `${weeklyStats.totalThisWeek} hrs studied` : `${monthlyStats.totalThisMonth} hrs total`})</span>
                                </p>
                            </div>
                        </div>
                        <select 
                            value={activityTimeframe}
                            onChange={(e) => setActivityTimeframe(e.target.value as 'Weekly' | 'Monthly')}
                            className="text-xs bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none font-medium cursor-pointer"
                        >
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                        </select>
                    </div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activeChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value: any) => [`${value} hrs`, 'Learning Time']}
                                    labelFormatter={(label) => activityTimeframe === 'Weekly' ? `Day: ${label}` : `Period: ${label}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="hours"
                                    fill="var(--chart-bar)"
                                    radius={[6, 6, 6, 6]}
                                    barSize={14}
                                    activeBar={{ fill: '#a855f7' }}
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
                                    <span>
                                        {activeCourse.duration ? `Duration: ${activeCourse.duration}` : `${activeCourse.lessonsTotal || 0} Lessons`} • {Math.max(0, (activeCourse.lessonsTotal || 0) - (activeCourse.lessonsCompleted || 0))} lessons remaining
                                    </span>
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
                {/* Premium / Corporate Banner */}
                <div className="bg-[#1a1a2e] p-6 rounded-3xl text-white relative overflow-hidden">
                    <div className="relative z-10">
                        {userRole === 'SPONSORED' || companyName ? (
                            <>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-violet-500/30 text-violet-200 border border-violet-400/30 mb-2">
                                    <Building2 size={11} /> Enterprise Plan
                                </span>
                                <h3 className="font-bold text-xl mb-1 text-white">
                                    {companyName || 'Corporate Partner'}
                                </h3>
                                <p className="text-xs text-gray-400 mb-4 max-w-[220px] leading-relaxed">
                                    Your account holds Seat #1 in the enterprise upskilling program with full access to all verified courses.
                                </p>
                                <button 
                                    onClick={() => navigate('/corporate')}
                                    className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shadow-md shadow-violet-500/20"
                                >
                                    <Building2 size={13} />
                                    <span>Corporate Portal</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="font-bold text-xl mb-1">
                                    {userRole === 'PRO' || userRole === 'ADMIN' ? 'Premium Account' : t('go_premium')}
                                </h3>
                                <p className="text-xs text-gray-400 mb-4 max-w-[200px] leading-relaxed">
                                    {userRole === 'PRO' || userRole === 'ADMIN' 
                                        ? 'You have unlocked unlimited access to all courses, 24/7 AI tutor guidance, and verified certificates.' 
                                        : t('explore_courses')}
                                </p>
                                {userRole !== 'PRO' && userRole !== 'ADMIN' && (
                                    <button 
                                        onClick={() => navigate('/plans')}
                                        className="bg-welile-lime text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-lime-300 transition-colors cursor-pointer"
                                    >
                                        {t('go_premium')}
                                    </button>
                                )}
                            </>
                        )}
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
                                localStorage.setItem(`recent-tapped-course-id`, targetCourse.id);
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
                                            <span className="inline-flex items-center gap-1">Course Completed! <PartyPopper className="inline-block w-4 h-4 text-amber-500" /></span>
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
                                <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100/30 dark:border-slate-700/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
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
    </div>
);
};

export default DashboardHome;