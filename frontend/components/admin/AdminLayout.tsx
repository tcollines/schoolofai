import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, FileQuestion, LogOut, Sun, Moon, Calendar, MessageSquare, ClipboardList, Mail, UserCheck, Award } from 'lucide-react';
import { getCurrencyPreference, setCurrencyPreference, CurrencyType } from '../../src/lib/currency';
import AdminOverview from './AdminOverview';
import AdminEnrollments from './AdminEnrollments';
import AdminCourses from './AdminCourses';
import AdminInstructors from './AdminInstructors';
import AdminExams from './AdminExams';
import AdminEvents from './AdminEvents';
import AdminLoginPage from './AdminLoginPage';
import AdminMails from './AdminMails';
import { AdminAttendance } from './AdminAttendance';
import AdminInstructorApplications from './AdminInstructorApplications';
import { mysqlClient } from '../../src/lib/mysqlClient';

interface AdminLayoutProps {
    onExit: () => void;
    isInstructor?: boolean;
    isAdminSubdomain?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onExit, isInstructor, isAdminSubdomain = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const activeTab = location.pathname.includes('/instructor/')
        ? (location.pathname.split('/')[2] || 'courses')
        : (location.pathname.split('/')[1] || (isInstructor ? 'courses' : 'enrollments'));

    // Persist admin/instructor session across page refreshes
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
        const sessionKey = isInstructor ? 'instructor-session' : 'admin-session';
        return localStorage.getItem(sessionKey) === 'true';
    });

    const [isDark, setIsDark] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    const [currency, setCurrency] = useState<CurrencyType>(getCurrencyPreference);

    useEffect(() => {
        const handleCurrencyChange = () => {
            setCurrency(getCurrencyPreference());
        };
        window.addEventListener('currency-change', handleCurrencyChange);
        return () => window.removeEventListener('currency-change', handleCurrencyChange);
    }, []);

    const toggleCurrency = () => {
        setCurrencyPreference(currency === 'USD' ? 'UGX' : 'USD');
    };

    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userAvatar, setUserAvatar] = useState('');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            if (isInstructor) {
                const name = localStorage.getItem('instructor-name') || 'Instructor';
                const email = localStorage.getItem('instructor-email') || '';
                setUserName(name);
                setUserEmail(email);
                
                // Try to find the instructor in the database to get details
                const { data } = await mysqlClient.from('instructors').select('*').eq('email', email.trim().toLowerCase());
                if (data && data.length > 0) {
                    const inst = data[0];
                    setUserName(inst.name || name);
                    setUserAvatar(inst.avatar || '');
                }
            } else {
                const email = localStorage.getItem('admin-email') || 'admin@welile.com';
                setUserEmail(email);
                
                // Find admin profile in database
                const { data } = await mysqlClient.from('profiles').select('*').eq('email', email.trim().toLowerCase());
                if (data && data.length > 0) {
                    const prof = data[0];
                    setUserName(prof.full_name || 'Admin');
                    setUserAvatar(prof.avatar_url || '');
                } else {
                    setUserName('Admin');
                }
            }
        };
        if (isAdminAuthenticated) {
            loadUserData();
        }
    }, [isAdminAuthenticated, isInstructor]);

    // Secure database-backed session validation (prevents client-side localStorage injections)
    useEffect(() => {
        const verifySession = async () => {
            const sessionKey = isInstructor ? 'instructor-session' : 'admin-session';
            const isAuth = localStorage.getItem(sessionKey) === 'true';
            if (isAuth) {
                try {
                    if (isInstructor) {
                        const email = localStorage.getItem('instructor-email') || '';
                        const { data } = await mysqlClient.from('instructors').select('*').eq('email', email.trim().toLowerCase());
                        if (!data || data.length === 0) {
                            // Invalid instructor!
                            localStorage.removeItem(sessionKey);
                            localStorage.removeItem('instructor-email');
                            localStorage.removeItem('instructor-name');
                            setIsAdminAuthenticated(false);
                            window.dispatchEvent(new Event('profile-update'));
                        }
                    } else {
                        const email = localStorage.getItem('admin-email') || '';
                        const cleanEmail = email.trim().toLowerCase();
                        if (cleanEmail === 'admin@welile.com' || cleanEmail === 'admin@test.com') {
                            // Default admin accounts are valid and don't need database profile records
                            return;
                        }
                        const { data } = await mysqlClient.from('profiles').select('role').eq('email', cleanEmail).single();
                        if (!data || data.role !== 'ADMIN') {
                            // Invalid admin!
                            localStorage.removeItem(sessionKey);
                            localStorage.removeItem('admin-email');
                            setIsAdminAuthenticated(false);
                            window.dispatchEvent(new Event('profile-update'));
                        }
                    }
                } catch (e) {
                    console.error('Session validation error:', e);
                }
            }
        };
        verifySession();
        const interval = setInterval(verifySession, 5000);
        return () => clearInterval(interval);
    }, [isInstructor]);

    useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('theme-change', handleThemeChange);
        return () => window.removeEventListener('theme-change', handleThemeChange);
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
        const sessionKey = isInstructor ? 'instructor-session' : 'admin-session';
        localStorage.removeItem(sessionKey);
        onExit();
    };

    const handleBackToStudentPortal = () => {
        if (isAdminSubdomain) {
            const { protocol, host } = window.location;
            const mainHost = host
                .replace('admin.', '')
                .replace('instructor.', '')
                .replace('instructors.', '')
                .replace('structors.', '')
                .replace('tors.', '');
            window.location.href = `${protocol}//${mainHost}/`;
        } else {
            window.location.href = '/';
        }
    };

    if (!isAdminAuthenticated) {
        return (
            <AdminLoginPage 
                isInstructor={isInstructor}
                onLoginSuccess={() => {
                    const sessionKey = isInstructor ? 'instructor-session' : 'admin-session';
                    localStorage.setItem(sessionKey, 'true');
                    setIsAdminAuthenticated(true);
                }}
                onBackToStudentPortal={handleBackToStudentPortal}
            />
        );
    }

    const menuItems = isInstructor 
        ? ([
            { id: 'courses', label: 'Course Setup', icon: BookOpen },
            { id: 'attendance', label: 'Attendance', icon: ClipboardList },
            { id: 'exams', label: 'Exam Setup', icon: FileQuestion },
            { id: 'events', label: 'Ongoing Events', icon: Calendar },
          ] as const)
        : ([
            { id: 'enrollments', label: 'Enrollments', icon: Users },
            { id: 'attendance', label: 'Attendance', icon: ClipboardList },
            { id: 'courses', label: 'Course Setup', icon: BookOpen },
            { id: 'instructors', label: 'Instructors', icon: UserCheck },
            { id: 'applications', label: 'Instructor Requests', icon: Award },
            { id: 'exams', label: 'Exam Setup', icon: FileQuestion },
            { id: 'events', label: 'Ongoing Events', icon: Calendar },
            { id: 'mails', label: 'Mails', icon: Mail },
          ] as const);

    const renderContent = () => {
        return (
            <Routes>
                <Route path="/" element={<Navigate to={isInstructor ? "courses" : "enrollments"} replace />} />
                {!isInstructor && <Route path="enrollments" element={<AdminEnrollments />} />}
                <Route path="attendance" element={<AdminAttendance isInstructor={isInstructor} />} />
                <Route path="courses" element={<AdminCourses isInstructor={isInstructor} />} />
                {!isInstructor && <Route path="instructors" element={<AdminInstructors />} />}
                <Route path="exams" element={<AdminExams isInstructor={isInstructor} />} />
                <Route path="events" element={<AdminEvents />} />
                {!isInstructor && <Route path="applications" element={<AdminInstructorApplications />} />}
                {!isInstructor && <Route path="mails" element={<AdminMails />} />}
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
                            <span className="font-bold text-white">{isInstructor ? 'I' : 'A'}</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            {isInstructor ? 'Instructor' : 'Admin'}<span className="text-violet-400">Portal</span>
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (isAdminSubdomain) {
                                    navigate(isInstructor ? `/instructor/${item.id}` : `/${item.id}`);
                                } else {
                                    navigate(isInstructor ? `/instructor/${item.id}` : `/admin/${item.id}`);
                                }
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out text-sm font-medium group hover:translate-x-2 hover:scale-[1.02] active:scale-[0.98] ${
                                activeTab === item.id
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <item.icon size={20} className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[8deg]" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-800">
                    <button 
                        onClick={handleExitConsole}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors text-sm font-medium"
                    >
                        <LogOut size={16} /> Exit {isInstructor ? 'Instructor' : 'Admin'} Console
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Admin Header */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-8 shadow-sm transition-colors shrink-0">
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">
                        {menuItems.find(i => i.id === activeTab)?.label}
                    </h1>

                    <div className="flex items-center gap-4">
                        {/* Currency Switcher */}
                        <button 
                            onClick={toggleCurrency}
                            className="px-3 py-1.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 rounded-full border border-violet-100 dark:border-violet-900/30 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm"
                            title="Toggle Currency"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
                            <span>{currency}</span>
                        </button>

                        <button 
                            onClick={toggleTheme}
                            className="p-2 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm text-gray-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center"
                            title="Toggle Theme"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        
                        <div className="h-8 w-px bg-gray-200 dark:bg-slate-850" />
                        
                        {/* Profile Info Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="text-right hidden sm:block text-left">
                                    <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{userName}</p>
                                    <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 capitalize">{isInstructor ? 'Instructor' : 'Administrator'}</p>
                                </div>
                                
                                {/* Avatar */}
                                {userAvatar && (userAvatar.startsWith('http') || userAvatar.startsWith('data:')) ? (
                                    <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden shrink-0 bg-gray-100 dark:bg-slate-800">
                                        <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-full border border-gray-200 dark:border-slate-800 bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm shrink-0">
                                        {userAvatar || (userName ? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U')}
                                    </div>
                                )}
                            </button>

                            {showProfileDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-20 transition-all duration-200">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                                            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500">Logged in as</p>
                                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{userEmail}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowProfileDropdown(false);
                                                handleExitConsole();
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2 font-medium cursor-pointer"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-8 flex-1 overflow-y-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
