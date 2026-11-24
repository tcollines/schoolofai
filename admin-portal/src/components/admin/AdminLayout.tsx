import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
    LayoutDashboard, Users, BookOpen, UserCheck, 
    Settings, LogOut, FileQuestion, Calendar, Mail, CheckCircle, Shield,
    Bell, Search, Handshake, Menu, X, Sun, Moon, MessageSquare, ClipboardList, Wallet, GraduationCap, Video, UserCog, Home, Activity, BarChart3, UsersRound, LayoutGrid
} from 'lucide-react';
import { getCurrencyPreference, setCurrencyPreference, CurrencyType } from '../../lib/currency';
import AdminOverview from './AdminOverview';
import AdminDashboard from './AdminDashboard';
import AdminEnrollments from './AdminEnrollments';
import AdminWallet from './AdminWallet';
import AdminCourses from './AdminCourses';
import AdminCourseSetupWizard from './AdminCourseSetupWizard';
import CohortScheduler from './CohortScheduler';
import AdminInstructors from './AdminInstructors';
import AdminPartners from './AdminPartners';
import AdminExams from './AdminExams';
import AdminEvents from './AdminEvents';
import AdminLoginPage from './AdminLoginPage';
import AdminMails from './AdminMails';
import AdminRegistrations from './AdminRegistrations';
import AdminFreeCourse from './AdminFreeCourse';
import AdminLiveSessions from './AdminLiveSessions';
import AdminStaff from './AdminStaff';
import AdminAgents from './AdminAgents';
import AdminAnalytics from './AdminAnalytics';
import AdminPeople from './AdminPeople';
import { supabaseClient } from '../../lib/supabaseClient';
import { verifyConsoleSession, clearConsoleFlags } from '../../lib/consoleAuth';

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
        : location.pathname.includes('/admin/')
        ? (location.pathname.split('/')[2] || 'enrollments')
        : (location.pathname.split('/')[1] || (isInstructor ? 'courses' : 'dashboard'));

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
    const [navOpen, setNavOpen] = useState(false);
    useEffect(() => { setNavOpen(false); }, [location.pathname]);

    useEffect(() => {
        const loadUserData = async () => {
            if (isInstructor) {
                const name = localStorage.getItem('instructor-name') || 'Instructor';
                const email = (localStorage.getItem('instructor-email') || '').trim().toLowerCase();
                setUserName(name);
                setUserEmail(email);
                
                if (email) {
                    const { data: profData } = await supabaseClient.from('profiles').select('*').eq('email', email);
                    if (profData && profData.length > 0) {
                        const prof = profData[0];
                        setUserName(prof.full_name || name);
                        setUserAvatar(prof.avatar_url || '');
                    } else {
                        const { data: courseData } = await supabaseClient.from('courses').select('instructor, instructor_avatar').eq('instructor_email', email);
                        if (courseData && courseData.length > 0) {
                            setUserName(courseData[0].instructor || name);
                            setUserAvatar(courseData[0].instructor_avatar || '');
                        }
                    }
                }
            } else {
                const email = localStorage.getItem('admin-email') || '';
                setUserEmail(email);
                
                // Find admin profile in database
                const { data } = await supabaseClient.from('profiles').select('*').eq('email', email.trim().toLowerCase());
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

    // Honest gate: the console is only open while a LIVE Supabase session with the right role exists.
    // Checked on mount and on every auth state change; localStorage flags are only UI hints.
    const [sessionChecked, setSessionChecked] = useState(false);
    useEffect(() => {
        let cancelled = false;
        const sessionKey = isInstructor ? 'instructor-session' : 'admin-session';
        const revalidate = async () => {
            const res = await verifyConsoleSession(!!isInstructor);
            if (cancelled) return;
            if (res.ok) {
                if (isInstructor) {
                    localStorage.setItem('instructor-session', 'true');
                    localStorage.setItem('instructor-email', res.email);
                    localStorage.setItem('instructor-name', res.name);
                } else {
                    localStorage.setItem('admin-session', 'true');
                    localStorage.setItem('admin-email', res.email);
                }
                setIsAdminAuthenticated(true);
            } else if (res.reason === 'error' && localStorage.getItem(sessionKey) === 'true') {
                // Transient lookup failure: keep the current state rather than logging out on a network blip.
            } else {
                clearConsoleFlags();
                setIsAdminAuthenticated(false);
            }
            setSessionChecked(true);
        };
        revalidate();
        const { data: sub } = supabaseClient.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                clearConsoleFlags();
                setIsAdminAuthenticated(false);
                return;
            }
            // Defer: never call supabase from inside the auth callback synchronously.
            setTimeout(revalidate, 0);
        });
        return () => { cancelled = true; sub?.subscription?.unsubscribe(); };
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

    const handleExitConsole = async () => {
        clearConsoleFlags();
        try { await supabaseClient.auth.signOut(); } catch (e) { console.warn('Sign-out failed:', e); }
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

    // The page where a person picks which dashboard to open (student, agent, supervision, admin...), on the main site
    const handleSwitchDashboard = () => {
        if (isAdminSubdomain) {
            const { protocol, host } = window.location;
            const mainHost = host.replace('admin.', '').replace('instructor.', '').replace('instructors.', '');
            window.location.href = `${protocol}//${mainHost}/portal`;
        } else {
            window.location.href = '/portal';
        }
    };

    if (!sessionChecked && isAdminAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-panel dark:bg-night">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
        );
    }

    if (!isAdminAuthenticated) {
        return (
            <AdminLoginPage 
                isInstructor={isInstructor}
                onLoginSuccess={() => {
                    setIsAdminAuthenticated(true);
                    setSessionChecked(true);
                }}
                onBackToStudentPortal={handleBackToStudentPortal}
            />
        );
    }

    const menuItems = isInstructor 
        ? ([
            { id: 'courses', label: 'Course Setup', icon: BookOpen },
            { id: 'cohorts', label: 'Cohorts', icon: Calendar },
            { id: 'exams', label: 'Exam Setup', icon: FileQuestion },
            { id: 'events', label: 'Ongoing Events', icon: Calendar },
          ] as const)
        : ([
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'people', label: 'All People', icon: UsersRound },
            { id: 'enrollments', label: 'Enrollments', icon: Users },
            { id: 'registrations', label: 'Registrations', icon: ClipboardList },
            { id: 'free-course', label: 'Free Course', icon: GraduationCap },
            { id: 'live-classes', label: 'Live Classes', icon: Video },
            { id: 'agents', label: 'Agent Monitoring', icon: Activity },
            { id: 'analytics', label: 'Traffic & Clicks', icon: BarChart3 },
            { id: 'staff', label: 'Staff & Links', icon: UserCog },
            { id: 'wallet', label: 'Wallet & Ledger', icon: Wallet },
            { id: 'courses', label: 'Course Setup', icon: BookOpen },
            { id: 'cohorts', label: 'Cohorts', icon: Calendar },
            { id: 'instructors', label: 'Instructors', icon: UserCheck },
            { id: 'partners', label: 'Partners', icon: Handshake },
            { id: 'exams', label: 'Exam Setup', icon: FileQuestion },
            { id: 'events', label: 'Ongoing Events', icon: Calendar },
            { id: 'mails', label: 'Mails', icon: Mail },
          ] as const);

    const renderContent = () => {
        return (
            <Routes>
                <Route path="/" element={<Navigate to={isInstructor ? "courses" : "dashboard"} replace />} />
                {!isInstructor && <Route path="dashboard" element={<AdminDashboard />} />}
                {!isInstructor && <Route path="people" element={<AdminPeople />} />}
                {!isInstructor && <Route path="enrollments" element={<AdminEnrollments />} />}
                {!isInstructor && <Route path="registrations" element={<AdminRegistrations />} />}
                {!isInstructor && <Route path="free-course" element={<AdminFreeCourse />} />}
                {!isInstructor && <Route path="live-classes" element={<AdminLiveSessions />} />}
                {!isInstructor && <Route path="agents" element={<AdminAgents />} />}
                {!isInstructor && <Route path="analytics" element={<AdminAnalytics />} />}
                {!isInstructor && <Route path="staff" element={<AdminStaff />} />}
                {!isInstructor && <Route path="wallet" element={<AdminWallet />} />}
                <Route path="courses" element={<AdminCourses isInstructor={isInstructor} />} />
                <Route path="courses/setup" element={<AdminCourseSetupWizard isInstructor={isInstructor} />} />
                <Route path="cohorts" element={<CohortScheduler />} />
                {!isInstructor && <Route path="instructors" element={<AdminInstructors />} />}
                {!isInstructor && <Route path="partners" element={<AdminPartners />} />}
                <Route path="exams" element={<AdminExams isInstructor={isInstructor} />} />
                <Route path="events" element={<AdminEvents />} />
                {!isInstructor && <Route path="mails" element={<AdminMails />} />}
                {/* Fallback support if user typed /admin/... while on subdomain */}
                {!isInstructor && <Route path="admin/wallet" element={<Navigate to="/wallet" replace />} />}
                {!isInstructor && <Route path="admin/enrollments" element={<Navigate to="/enrollments" replace />} />}
                <Route path="admin/courses" element={<Navigate to="/courses" replace />} />
                <Route path="admin/*" element={<Navigate to={isInstructor ? "/courses" : "/enrollments"} replace />} />
            </Routes>
        );
    };

    const initialsOf = (n: string) => (n ? n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'A');
    const go = (id: string) => {
        if (isAdminSubdomain) navigate(isInstructor ? `/instructor/${id}` : `/${id}`);
        else navigate(isInstructor ? `/instructor/${id}` : `/admin/${id}`);
    };
    const activeLabel = menuItems.find(i => i.id === activeTab)?.label || (activeTab === 'courses' ? 'Course Setup' : '');

    return (
        <div className="flex min-h-screen bg-panel dark:bg-night text-ink dark:text-slate-100 font-sans transition-colors duration-200">
            {/* Admin sidebar (night) */}
            {navOpen && <div className="fixed inset-0 z-40 bg-night/60 lg:hidden" onClick={() => setNavOpen(false)} aria-hidden="true" />}
            <aside aria-label={isInstructor ? 'Instructor navigation' : 'Admin navigation'} className={`w-[240px] max-w-[85vw] bg-night text-white flex flex-col fixed inset-y-0 left-0 z-50 overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-5 pt-6 pb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-[11px] bg-brand inline-flex items-center justify-center font-extrabold">W</span>
                        <span className="leading-tight">
                            <span className="block text-[14px] font-extrabold">{isInstructor ? 'Welile Instructor' : 'Welile Admin'}</span>
                            <span className="block text-[11px] text-[#B9B2CC]">School of AI</span>
                        </span>
                    </div>
                    <button onClick={() => setNavOpen(false)} aria-label="Close menu" className="lg:hidden w-10 h-10 rounded-[11px] inline-flex items-center justify-center text-[#B9B2CC] hover:bg-night-3"><X size={19} /></button>
                </div>

                <nav className="flex-1 px-3 pb-4 flex flex-col gap-0.5">
                    {menuItems.map((item) => {
                        const on = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => go(item.id)}
                                aria-current={on ? 'page' : undefined}
                                className={`press relative w-full flex items-center gap-3 px-3 min-h-[40px] rounded-[11px] text-[13px] text-left transition-colors ${on ? 'bg-night-3 text-white font-extrabold' : 'text-[#B9B2CC] font-semibold hover:bg-night-2 hover:text-white'}`}
                            >
                                {on && <span aria-hidden="true" className="absolute -left-3 top-2.5 bottom-2.5 w-1 rounded-full bg-lime-200" />}
                                <item.icon size={17} className={on ? 'text-lime-200' : ''} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="mx-3 mb-3 pt-3 border-t border-night-3">
                    <button onClick={handleSwitchDashboard} className="press w-full flex items-center gap-3 px-3 min-h-[40px] rounded-[11px] text-[13px] text-left bg-night-3 hover:bg-night-2 transition-colors">
                        <LayoutGrid size={17} className="text-lime-200" />
                        Switch dashboard
                    </button>
                </div>
                <div className="mx-3 mb-4 pt-3 border-t border-night-3 flex items-center gap-2.5 px-2">
                    {userAvatar && (userAvatar.startsWith('http') || userAvatar.startsWith('data:')) ? (
                        <img src={userAvatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                        <span className="w-8 h-8 rounded-full bg-lime-200 text-ink text-[12px] font-extrabold inline-flex items-center justify-center shrink-0">{userAvatar || initialsOf(userName)}</span>
                    )}
                    <span className="flex-1 min-w-0 leading-tight">
                        <span className="block text-[12px] font-extrabold truncate">{userName || (isInstructor ? 'Instructor' : 'Admin')}</span>
                        <span className="block text-[11px] text-[#B9B2CC]">{isInstructor ? 'Instructor' : 'Administrator'}</span>
                    </span>
                    <button onClick={handleExitConsole} aria-label="Sign out" title="Sign out" className="press w-9 h-9 rounded-[10px] inline-flex items-center justify-center text-[#B9B2CC] hover:bg-night-3 hover:text-white"><LogOut size={16} /></button>
                </div>
            </aside>

            {/* Main content area */}
            <main className="flex-1 lg:ml-[240px] min-w-0 flex flex-col min-h-screen">
                <header className="frost sticky top-0 z-30 shrink-0">
                    <div className="h-[64px] px-3 sm:px-6 lg:px-7 flex items-center gap-2 sm:gap-3">
                        <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="press lg:hidden w-11 h-11 rounded-[12px] bg-white dark:bg-night-2 inline-flex items-center justify-center"><Menu size={20} /></button>
                        {/* each page shows its own title; the bar only repeats it on phones, where the menu is hidden */}
                        <div className="min-w-0 flex-1 leading-tight">
                            <p className="m-0 text-[11px] font-extrabold tracking-[0.12em] uppercase text-brand dark:text-violet-300">{isInstructor ? 'Instructor' : 'Admin'}</p>
                            <p className="m-0 text-[17px] font-extrabold tracking-[-0.01em] truncate lg:hidden">{activeLabel}</p>
                        </div>
                        <button onClick={handleSwitchDashboard} title="Switch dashboard" aria-label="Switch dashboard" className="press h-10 px-3 rounded-[12px] bg-white dark:bg-night-2 inline-flex items-center gap-2 text-[13px] font-bold text-ink dark:text-white">
                            <LayoutGrid size={16} /><span className="hidden sm:inline">Switch dashboard</span>
                        </button>
                        <button onClick={toggleCurrency} title="Switch currency" aria-label={`Currency: ${currency}. Switch currency`} className="press h-10 px-3 rounded-[12px] bg-white dark:bg-night-2 inline-flex items-center gap-1.5 text-[12px] font-extrabold">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />{currency}
                        </button>
                        <button onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} className="press w-10 h-10 rounded-[12px] bg-white dark:bg-night-2 inline-flex items-center justify-center text-[#6B6680] dark:text-slate-300">
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <div className="relative">
                            <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} aria-haspopup="menu" aria-expanded={showProfileDropdown} className="press h-10 pl-1 pr-3 rounded-full bg-white dark:bg-night-2 inline-flex items-center gap-2">
                                {userAvatar && (userAvatar.startsWith('http') || userAvatar.startsWith('data:')) ? (
                                    <img src={userAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                    <span className="w-8 h-8 rounded-full bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 text-[12px] font-extrabold inline-flex items-center justify-center">{userAvatar || initialsOf(userName)}</span>
                                )}
                                <span className="hidden sm:block text-[13px] font-bold max-w-[140px] truncate">{userName}</span>
                            </button>
                            {showProfileDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)} />
                                    <div role="menu" className="absolute right-0 mt-2 w-56 bg-white dark:bg-night-2 rounded-[18px] shadow-xl p-2 z-20">
                                        <div className="px-3 py-2">
                                            <p className="m-0 text-[11px] font-semibold text-[#6B6680]">Signed in as</p>
                                            <p className="m-0 text-[13px] font-bold truncate">{userEmail}</p>
                                        </div>
                                        <button role="menuitem" onClick={() => { setShowProfileDropdown(false); handleSwitchDashboard(); }} className="w-full text-left px-3 h-10 rounded-[11px] text-[13px] font-semibold hover:bg-panel dark:hover:bg-night-3">Switch dashboard</button>
                                        <button role="menuitem" onClick={() => { setShowProfileDropdown(false); handleBackToStudentPortal(); }} className="w-full text-left px-3 h-10 rounded-[11px] text-[13px] font-semibold hover:bg-panel dark:hover:bg-night-3">Student site</button>
                                        <button role="menuitem" onClick={() => { setShowProfileDropdown(false); handleExitConsole(); }} className="w-full text-left px-3 h-10 rounded-[11px] text-[13px] font-bold text-[#A3321F] hover:bg-[#FDECE8] dark:hover:bg-red-950/20 flex items-center gap-2"><LogOut size={15} />Sign out</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="admin-content px-3 sm:px-6 lg:px-7 pt-2 pb-10 flex-1 min-w-0 overflow-x-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
