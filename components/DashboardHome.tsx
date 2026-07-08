import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle, PlayCircle, BookOpen } from 'lucide-react';
import { Course, CourseStatus } from '../types';

interface DashboardHomeProps {
    courses: Course[];
    userId?: string;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ courses, userId }) => {
    const activeCourse = courses.find(c => c.status === CourseStatus.IN_PROGRESS);
    const enrolledCourses = courses.filter(c => c.status === CourseStatus.IN_PROGRESS || c.status === CourseStatus.COMPLETED);

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

    const assignments = enrolledCourses.slice(0, 3).map((course, idx) => ({
        id: course.id,
        title: `${course.title} - Final Assessment`,
        dueDate: `Tomorrow, ${10 + idx}:00 AM`,
        status: idx === 0 ? 'Completed' : 'In Progress'
    }));

    if (!userId) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Main Stats */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">

                {/* New Courses / Recommended Row */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">New Courses</h3>
                        <button className="text-sm text-welile-purple font-medium hover:underline">View All</button>
                    </div>
                    {courses.filter(c => c.status === CourseStatus.NOT_STARTED).length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center">
                            <p className="text-gray-500 text-sm mb-2">No new courses available right now.</p>
                            <p className="text-xs text-gray-400">Head over to the <span className="font-bold text-welile-purple">Discover</span> tab to find your next adventure!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {courses.filter(c => c.status === CourseStatus.NOT_STARTED).slice(0, 3).map((course) => (
                                <div key={course.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                                            {course.category.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-900 text-sm truncate">{course.title}</h4>
                                            <p className="text-xs text-gray-500">{course.duration}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Rate</p>
                                            <p className="font-bold text-sm text-gray-800">★ {course.rating}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-600">
                                            {course.category}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Activity Chart */}
                <section className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-gray-800">Hours Activity</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <TrendingUp size={14} className="text-green-500" />
                                <p className="text-xs text-gray-500"><span className="text-green-500 font-bold">+3%</span> increase than last week</p>
                            </div>
                        </div>
                        <select className="text-xs bg-gray-50 border-none rounded-lg px-2 py-1 outline-none">
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
                                    fill="#111111"
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
                    <section className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">Course You're Taking</h3>
                            <div className="w-8 h-8 rounded-full bg-welile-lime flex items-center justify-center cursor-pointer hover:bg-lime-300">
                                <PlayCircle size={16} />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <img src={activeCourse.image} alt={activeCourse.title} className="w-full sm:w-16 h-32 sm:h-16 rounded-xl object-cover" />
                            <div className="flex-1 w-full">
                                <h4 className="font-bold text-gray-900">{activeCourse.title}</h4>
                                <p className="text-xs text-gray-500 mb-2">{activeCourse.instructor}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span>Remaining: 8h 45min</span>
                                </div>
                            </div>
                            <div className="w-full sm:w-auto text-right">
                                <div className="flex items-center gap-2 sm:block">
                                    <span className="text-xs font-bold text-gray-600 sm:hidden">Progress:</span>
                                    <div className="radial-progress text-welile-purple text-xs font-bold" style={{ "--value": activeCourse.lessonsCompleted ? (activeCourse.lessonsCompleted / activeCourse.lessonsTotal) * 100 : 0 } as any}>
                                        {Math.round(activeCourse.lessonsCompleted ? (activeCourse.lessonsCompleted / activeCourse.lessonsTotal) * 100 : 0)}%
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
                        <h3 className="font-bold text-xl mb-1">Go Premium</h3>
                        <p className="text-xs text-gray-400 mb-4 max-w-[150px]">Explore 25k+ courses with lifetime membership</p>
                        <button className="bg-welile-lime text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-lime-300 transition-colors">
                            Get Access
                        </button>
                    </div>
                    {/* Abstract illustration circles */}
                    <div className="absolute top-8 right-[-20px] w-24 h-24 rounded-full bg-welile-purple opacity-20"></div>
                    <div className="absolute bottom-[-10px] right-8 w-16 h-16 rounded-full bg-pink-500 opacity-20"></div>
                </div>

                {/* Schedule */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Daily Schedule</h3>
                    {schedule.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No classes scheduled today.</p>
                    ) : (
                        <div className="space-y-4">
                            {schedule.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl ${item.color || 'bg-gray-100 text-gray-600'} flex items-center justify-center font-bold text-sm`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                                            <p className="text-xs text-gray-500">{item.type} • {item.time}</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
                                        ›
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Assignments */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">Assignments</h3>
                        <button className="w-6 h-6 bg-welile-lime rounded-full flex items-center justify-center text-xs font-bold">+</button>
                    </div>
                    {assignments.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No active assignments.</p>
                    ) : (
                        <div className="space-y-3">
                            {assignments.map((assignment, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <CheckCircle size={14} className={assignment.status === 'Completed' ? "text-green-600" : "text-purple-600"} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{assignment.title}</p>
                                            <p className="text-xs text-gray-400">{assignment.dueDate}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${assignment.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                                        {assignment.status}
                                    </span>
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