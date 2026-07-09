import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, FileQuestion, LogOut, Sun, Moon, Calendar } from 'lucide-react';
import AdminOverview from './AdminOverview';
import AdminEnrollments from './AdminEnrollments';
import AdminCourses from './AdminCourses';
import AdminExams from './AdminExams';
import AdminEvents from './AdminEvents';
import AdminLoginPage from './AdminLoginPage';

interface AdminLayoutProps {
    onExit: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onExit }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const activeTab = location.pathname.split('/')[2] || 'overview';

    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
        return localStorage.getItem('admin-session') === 'true';
    });

    const [isDark, setIsDark] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('theme-change', handleThemeChange);
        return () => {
            window.removeEventListener('theme-change', handleThemeChange);
        };
    }, []);

    const toggleTheme = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('theme-change'));
    };

    const handleExitConsole = () => {
        localStorage.removeItem('admin-session');
        onExit();
    };

    if (!isAdminAuthenticated) {
        return (
            <AdminLoginPage 
                onLoginSuccess={() => {
                    setIsAdminAuthenticated(true);
                }}
                onBackToStudentPortal={() => window.location.href = '/'}
            />
        );
    }

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'enrollments', label: 'Enrollments', icon: Users },
        { id: 'courses', label: 'Course Setup', icon: BookOpen },
        { id: 'exams', label: 'Exam Setup', icon: FileQuestion },
        { id: 'events', label: 'Ongoing Events', icon: Calendar },
    ] as const;

    const renderContent = () => {
        return (
            <Routes>
                <Route path="/" element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<AdminOverview />} />
                <Route path="enrollments" element={<AdminEnrollments />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="exams" element={<AdminExams />} />
                <Route path="events" element={<AdminEvents />} />
            </Routes>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors duration-200">
            {/* Admin Sidebar */}
            <div className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 z-50 shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-white">A</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">Admin<span className="text-violet-400">Portal</span></span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/admin/${item.id}`)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                                activeTab === item.id
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-800">
                    <button 
                        onClick={handleExitConsole}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors text-sm font-medium"
                    >
                        <LogOut size={16} /> Exit Admin Console
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Admin Header */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-8 shadow-sm transition-colors">
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">
                        {menuItems.find(i => i.id === activeTab)?.label}
                    </h1>

                    {/* Theme Toggle Shortcut */}
                    <button 
                        onClick={toggleTheme}
                        className="p-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
                        title="Toggle Theme"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </header>

                <div className="p-8 flex-1 overflow-y-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
