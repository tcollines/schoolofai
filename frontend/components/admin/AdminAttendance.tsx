import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { mysqlClient } from '../../src/lib/mysqlClient';
import { Search, Calendar, CheckCircle2, XCircle, AlertCircle, RefreshCw, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AdminAttendanceProps {
    isInstructor?: boolean;
}

interface AttendanceRecord {
    id?: number;
    user_id: string;
    course_id: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    date: string;
    fullName?: string;
    email?: string;
}

interface StatDay {
    name: string;
    Present: number;
    Absent: number;
    Late: number;
}

export const AdminAttendance: React.FC<AdminAttendanceProps> = ({ isInstructor = false }) => {
    const { courses, users, enrollments, loading: adminLoading } = useAdmin(true);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
    const [chartData, setChartData] = useState<StatDay[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Set first course as selected by default when courses load
    useEffect(() => {
        if (courses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(courses[0].id);
        }
    }, [courses, selectedCourseId]);

    // Fetch attendance list and stats for selected course & date
    const fetchAttendanceAndStats = async () => {
        if (!selectedCourseId) return;
        setStatsLoading(true);
        try {
            // 1. Fetch attendance records for this course & date
            const { data: attendanceData, error: attendanceError } = await mysqlClient
                .from('attendance')
                .select('*')
                .eq('course_id', selectedCourseId)
                .eq('date', selectedDate);
            
            if (attendanceError) throw attendanceError;
            setAttendanceList((attendanceData as AttendanceRecord[]) || []);

            // 2. Fetch weekly chart stats
            const res = await fetch(`/api/attendance/stats?courseId=${selectedCourseId}`);
            if (res.ok) {
                const stats = await res.json();
                
                // If backend returns empty array, generate mock days to keep chart beautiful
                if (stats.length === 0) {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const zeroStats = Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        return {
                            name: days[d.getDay()],
                            Present: 0,
                            Absent: 0,
                            Late: 0,
                            dateOrder: d.getTime()
                        };
                    }).sort((a, b) => a.dateOrder - b.dateOrder);
                    setChartData(zeroStats);
                } else {
                    setChartData(stats);
                }
            }
        } catch (e) {
            console.error('Error fetching attendance:', e);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceAndStats();
    }, [selectedCourseId, selectedDate]);

    // Filter enrolled students for the selected course
    const courseEnrollments = enrollments.filter(e => e.course_id === selectedCourseId);
    
    // Get full student profiles for those enrollments
    const enrolledStudents = courseEnrollments.map(e => {
        const profile = users.find(u => u.id === e.user_id);
        const record = attendanceList.find(r => r.user_id === e.user_id);
        return {
            id: e.user_id,
            name: profile?.name || 'Student',
            email: profile?.email || '',
            avatar: profile?.avatar || '',
            nationality: profile?.nationality || 'Not specified',
            status: record?.status || null // PRESENT, ABSENT, LATE, or null
        };
    }).filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleUpdateStatus = async (userId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
        setUpdatingUserId(userId);
        try {
            const { error } = await mysqlClient.from('attendance').insert([
                {
                    user_id: userId,
                    course_id: selectedCourseId,
                    status,
                    date: selectedDate
                }
            ]);

            if (error) throw error;

            showToast(`Marked ${enrolledStudents.find(s => s.id === userId)?.name} as ${status}`);
            
            // Reload attendance and stats in background
            await fetchAttendanceAndStats();
        } catch (err: any) {
            console.error('Error updating attendance:', err);
            alert('Failed to update attendance status.');
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleMarkAll = async (status: 'PRESENT' | 'ABSENT') => {
        if (enrolledStudents.length === 0) return;
        setStatsLoading(true);
        try {
            const promises = enrolledStudents.map(student => 
                mysqlClient.from('attendance').insert([
                    {
                        user_id: student.id,
                        course_id: selectedCourseId,
                        status,
                        date: selectedDate
                    }
                ])
            );
            await Promise.all(promises);
            showToast(`Marked all as ${status}`);
            await fetchAttendanceAndStats();
        } catch (err) {
            console.error('Error marking all:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Calculate quick stats
    const totalEnrolled = enrolledStudents.length;
    const presentCount = enrolledStudents.filter(s => s.status === 'PRESENT').length;
    const absentCount = enrolledStudents.filter(s => s.status === 'ABSENT').length;
    const lateCount = enrolledStudents.filter(s => s.status === 'LATE').length;
    const attendanceRate = totalEnrolled > 0 
        ? Math.round(((presentCount + lateCount) / totalEnrolled) * 100) 
        : 100;

    return (
        <div className="space-y-8 p-6 pb-12 max-w-7xl mx-auto">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 bg-slate-900 dark:bg-violet-650 text-white text-sm px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 dark:border-violet-500/30 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Top Bar with Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200/80 dark:border-slate-800/80 shadow-sm">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Attendance Manager</h1>
                    <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-1">Track and manage student daily presence</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Course Selector */}
                    <div className="flex flex-col text-left">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1.5">Course</label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all cursor-pointer"
                        >
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Selector */}
                    <div className="flex flex-col text-left">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all cursor-pointer"
                            />
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchAttendanceAndStats}
                        className="mt-5 p-3 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-gray-200 dark:border-slate-700/80 rounded-xl cursor-pointer transition-colors"
                        title="Refresh Stats"
                    >
                        <RefreshCw className={`w-4.5 h-4.5 text-gray-500 dark:text-slate-400 ${statsLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Quick Metrics & Analytics Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Statistics Cards */}
                <div className="lg:col-span-1 flex flex-col gap-5">
                    {/* Attendance Rate */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden flex flex-col justify-between h-[160px]">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest block">Attendance Rate</span>
                                <span className="text-4xl font-extrabold tracking-tight mt-2 block">{attendanceRate}%</span>
                            </div>
                            <div className="w-10 h-10 bg-violet-500/10 dark:bg-violet-500/5 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-violet-500" />
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-violet-500 to-indigo-650 h-full rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }}></div>
                        </div>
                    </div>

                    {/* Counts Summary */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200/80 dark:border-slate-800/80 shadow-sm flex-1 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest block mb-4">Attendance Summary</span>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-850 pb-2">
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Present</span>
                                </div>
                                <span className="text-sm font-bold">{presentCount}</span>
                            </div>
                            
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-850 pb-2">
                                <div className="flex items-center gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                    <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Late</span>
                                </div>
                                <span className="text-sm font-bold">{lateCount}</span>
                            </div>

                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-850 pb-2">
                                <div className="flex items-center gap-2.5">
                                    <XCircle className="w-4 h-4 text-rose-500" />
                                    <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Absent</span>
                                </div>
                                <span className="text-sm font-bold">{absentCount}</span>
                            </div>
                            
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs font-bold text-gray-400">Total Enrolled</span>
                                <span className="text-sm font-extrabold">{totalEnrolled}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recharts Weekly Attendance Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest block">Weekly Analytics</span>
                            <h2 className="text-md font-bold mt-0.5">Attendance Overview</h2>
                        </div>
                    </div>

                    <div className="h-[230px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/60" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: '#1e293b', color: '#fff', fontSize: 12 }} 
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                                <Bar dataKey="Present" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Student list section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
                {/* Table Header Filter */}
                <div className="p-6 border-b border-gray-150 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleMarkAll('PRESENT')}
                            className="px-4 py-2 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                        >
                            Mark All Present
                        </button>
                        <button
                            onClick={() => handleMarkAll('ABSENT')}
                            className="px-4 py-2 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                        >
                            Mark All Absent
                        </button>
                    </div>
                </div>

                {/* Table Body */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-150 dark:border-slate-850 text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Nationality</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-850">
                            {adminLoading || statsLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10">
                                        <div className="flex justify-center items-center gap-3 text-gray-400 font-semibold text-sm">
                                            <RefreshCw className="w-5 h-5 animate-spin text-violet-500" />
                                            Loading student data...
                                        </div>
                                    </td>
                                </tr>
                            ) : enrolledStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-400 font-semibold text-sm">
                                        No students enrolled in this course.
                                    </td>
                                </tr>
                            ) : (
                                enrolledStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                        {/* Profile */}
                                        <td className="px-6 py-4.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center font-bold text-violet-650 text-sm overflow-hidden border border-gray-200 dark:border-slate-700/80">
                                                    {student.avatar ? (
                                                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        student.name.split(' ').map(n => n[0]).join('').toUpperCase()
                                                    )}
                                                </div>
                                                <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{student.name}</span>
                                            </div>
                                        </td>
                                        
                                        {/* Email */}
                                        <td className="px-6 py-4.5 text-sm text-gray-500 dark:text-slate-400 font-medium">
                                            {student.email}
                                        </td>
                                        
                                        {/* Nationality */}
                                        <td className="px-6 py-4.5 text-sm text-gray-500 dark:text-slate-400 font-medium">
                                            {student.nationality}
                                        </td>

                                        {/* Status badge */}
                                        <td className="px-6 py-4.5 text-center">
                                            {student.status === 'PRESENT' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-250 dark:border-emerald-900/30">
                                                    ● Present
                                                </span>
                                            ) : student.status === 'LATE' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-250 dark:border-amber-900/30">
                                                    ● Late
                                                </span>
                                            ) : student.status === 'ABSENT' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full border border-rose-250 dark:border-rose-900/30">
                                                    ● Absent
                                                </span>
                                            ) : (
                                                <span className="text-xs font-semibold text-gray-400">Not Marked</span>
                                            )}
                                        </td>

                                        {/* Action buttons */}
                                        <td className="px-6 py-4.5 text-center">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(student.id, 'PRESENT')}
                                                    disabled={updatingUserId === student.id}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                        student.status === 'PRESENT'
                                                            ? 'bg-emerald-500 text-white border-transparent shadow-sm'
                                                            : 'bg-transparent border-gray-200 dark:border-slate-750 text-gray-450 hover:bg-gray-50 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    P
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(student.id, 'LATE')}
                                                    disabled={updatingUserId === student.id}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                        student.status === 'LATE'
                                                            ? 'bg-amber-500 text-white border-transparent shadow-sm'
                                                            : 'bg-transparent border-gray-200 dark:border-slate-750 text-gray-450 hover:bg-gray-50 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    L
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(student.id, 'ABSENT')}
                                                    disabled={updatingUserId === student.id}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                        student.status === 'ABSENT'
                                                            ? 'bg-rose-500 text-white border-transparent shadow-sm'
                                                            : 'bg-transparent border-gray-200 dark:border-slate-750 text-gray-450 hover:bg-gray-50 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    A
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
