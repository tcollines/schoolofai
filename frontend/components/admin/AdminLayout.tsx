import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Users, BookOpen, UserCheck, Handshake, FileQuestion, Calendar, Mail, ClipboardList, Wallet, LogOut, GraduationCap } from 'lucide-react';
import AdminRegistrations from './AdminRegistrations';
import AdminFreeCourse from './AdminFreeCourse';

interface AdminLayoutProps {
    onExit?: () => void;
    isInstructor?: boolean;
    isAdminSubdomain?: boolean;
}

export const menuItems = [
    { id: 'enrollments', label: 'Enrollments', icon: Users },
    { id: 'registrations', label: 'Registrations', icon: ClipboardList },
    { id: 'free-course', label: 'Free Course', icon: GraduationCap },
    { id: 'wallet', label: 'Wallet & Ledger', icon: Wallet },
    { id: 'courses', label: 'Course Setup', icon: BookOpen },
    { id: 'instructors', label: 'Instructors', icon: UserCheck },
    { id: 'partners', label: 'Partners', icon: Handshake },
    { id: 'exams', label: 'Exam Setup', icon: FileQuestion },
    { id: 'events', label: 'Ongoing Events', icon: Calendar },
    { id: 'mails', label: 'Mails', icon: Mail },
] as const;

const AdminLayout: React.FC<AdminLayoutProps> = ({ onExit, isInstructor }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const activeTab = location.pathname.includes('/admin/')
        ? (location.pathname.split('/')[2] || 'registrations')
        : (location.pathname.split('/')[1] || 'registrations');

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans">
            <div className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 z-50 shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-white">{isInstructor ? 'I' : 'A'}</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">
                        {isInstructor ? 'Instructor' : 'Admin'}<span className="text-violet-400">Portal</span>
                    </span>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/admin/${item.id}`)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                                activeTab === item.id
                                    ? 'bg-violet-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>
                {onExit && (
                    <div className="p-4 mt-auto border-t border-slate-800">
                        <button
                            onClick={onExit}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium"
                        >
                            <LogOut size={16} /> Exit Console
                        </button>
                    </div>
                )}
            </div>
            <main className="flex-1 ml-64 p-8">
                <Routes>
                    <Route path="registrations" element={<AdminRegistrations />} />
                    <Route path="free-course" element={<AdminFreeCourse />} />
                    <Route path="*" element={<Navigate to="registrations" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default AdminLayout;
