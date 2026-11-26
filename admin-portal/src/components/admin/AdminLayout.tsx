import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogOut, Sun, Moon, LayoutGrid, CalendarDays, BarChart3, Handshake, Mail, Wallet, ConciergeBell } from 'lucide-react';
import { getCurrencyPreference, setCurrencyPreference, CurrencyType } from '../../lib/currency';
import { ADMIN_PRIMARY, INSTRUCTOR_PRIMARY, groupOf, PAGE_TITLES } from './adminNav';
import AdminBottomNav, { BOTTOM_NAV_SPACE } from './AdminBottomNav';
import FrontDeskShell from './FrontDeskShell';
import AdminToday from './AdminToday';
import AdminMore from './AdminMore';
import AdminWeek from './AdminWeek';
import PeopleHub from './PeopleHub';
import LearningHub from './LearningHub';
import TeamHub from './TeamHub';
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
import DashboardSwitcher from './DashboardSwitcher';
import { clearDashboardsCache } from '../../lib/dashboards';
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
        ? (location.pathname.split('/')[2] || 'today')
        : (location.pathname.split('/')[1] || (isInstructor ? 'courses' : 'today'));

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
        clearDashboardsCache();
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

    const primary = isInstructor ? INSTRUCTOR_PRIMARY : ADMIN_PRIMARY;
    // Desktop sidebar: the five main places, then the less-used pages grouped under a heading.
    const sidebarMore = [
        { id: 'week', label: 'My week', icon: CalendarDays },
        { id: 'analytics', label: 'Traffic and clicks', icon: BarChart3 },
        { id: 'partners', label: 'Partners', icon: Handshake },
        { id: 'mails', label: 'Mails', icon: Mail },
        { id: 'wallet', label: 'Wallet and ledger', icon: Wallet },
    ];
    const bottomActive = isInstructor ? activeTab : groupOf(activeTab);

    const renderContent = () => {
        return (
            <Routes>
                <Route path="/" element={<Navigate to={isInstructor ? "courses" : "today"} replace />} />
                {!isInstructor && <Route path="today" element={<AdminToday firstName={userName ? userName.split(' ')[0] : undefined} />} />}
                {!isInstructor && <Route path="week" element={<AdminWeek />} />}
                {!isInstructor && <Route path="more" element={<AdminMore onSwitchDashboard={handleSwitchDashboard} onStudentSite={handleBackToStudentPortal} onSignOut={handleExitConsole} />} />}
                {!isInstructor && <Route path="desk" element={<FrontDeskShell firstName={userName ? userName.split(' ')[0] : undefined} onAdminDashboard={() => go('today')} onChooseDashboard={handleSwitchDashboard} onSignOut={handleExitConsole} />} />}
                {!isInstructor && <Route path="people" element={<PeopleHub />} />}
                {!isInstructor && <Route path="learning" element={<LearningHub />} />}
                {!isInstructor && <Route path="team" element={<TeamHub />} />}
                {!isInstructor && <Route path="dashboard" element={<AdminDashboard />} />}
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
                <Route path="admin/*" element={<Navigate to={isInstructor ? "/courses" : "/today"} replace />} />
            </Routes>
        );
    };

    const initialsOf = (n: string) => (n ? n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'A');
    const go = (id: string) => {
        if (isAdminSubdomain) navigate(isInstructor ? `/instructor/${id}` : `/${id}`);
        else navigate(isInstructor ? `/instructor/${id}` : `/admin/${id}`);
    };
    const activeLabel = PAGE_TITLES[activeTab] || '';
    const bottomItems = primary.map(p => ({
        id: p.id, label: p.label, icon: <p.icon size={22} />, onSelect: () => go(p.id),
    }));

    // The Front desk dashboard is its own simple screen: no admin sidebar, top bar or bottom bar
    if (!isInstructor && activeTab === 'desk') return renderContent();

    return (
        <div className="flex min-h-screen bg-panel dark:bg-night text-ink dark:text-slate-100 font-sans transition-colors duration-200">
            {/* Desktop sidebar (night). On a phone the bottom bar replaces it. */}
            <aside aria-label={isInstructor ? 'Instructor navigation' : 'Admin navigation'} className="hidden lg:flex w-[240px] bg-night text-white flex-col fixed inset-y-0 left-0 z-50 overflow-y-auto">
                <div className="px-5 pt-6 pb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-[11px] bg-brand inline-flex items-center justify-center font-extrabold">W</span>
                        <span className="leading-tight">
                            <span className="block text-[14px] font-extrabold">{isInstructor ? 'Welile Instructor' : 'Welile Admin'}</span>
                            <span className="block text-[12px] text-[#B9B2CC]">School of AI</span>
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-3 pb-4 flex flex-col gap-0.5">
                    {primary.map((item) => {
                        const on = bottomActive === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => go(item.id)}
                                aria-current={on ? 'page' : undefined}
                                className={`press relative w-full flex items-center gap-3 px-3 min-h-[44px] rounded-[11px] text-[14px] text-left transition-colors ${on ? 'bg-night-3 text-white font-extrabold' : 'text-[#B9B2CC] font-semibold hover:bg-night-2 hover:text-white'}`}
                            >
                                {on && <span aria-hidden="true" className="absolute -left-3 top-2.5 bottom-2.5 w-1 rounded-full bg-lime-200" />}
                                <item.icon size={18} className={on ? 'text-lime-200' : ''} />
                                {item.label}
                            </button>
                        );
                    })}
                    {!isInstructor && (
                        <>
                            <p className="m-0 mt-4 mb-1 px-3 text-[11px] font-extrabold tracking-[0.12em] uppercase text-[#8F87A8]">Also</p>
                            {sidebarMore.map((item) => {
                                const on = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => go(item.id)}
                                        aria-current={on ? 'page' : undefined}
                                        className={`press relative w-full flex items-center gap-3 px-3 min-h-[44px] rounded-[11px] text-[14px] text-left transition-colors ${on ? 'bg-night-3 text-white font-extrabold' : 'text-[#B9B2CC] font-semibold hover:bg-night-2 hover:text-white'}`}
                                    >
                                        <item.icon size={18} className={on ? 'text-lime-200' : ''} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </>
                    )}
                </nav>

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
                        {/* each page shows its own title; the bar only repeats it on phones */}
                        <div className="min-w-0 flex-1 leading-tight">
                            <p className="m-0 text-[11px] font-extrabold tracking-[0.12em] uppercase text-brand dark:text-violet-300">{isInstructor ? 'Instructor' : 'Admin'}</p>
                            <p className="m-0 text-[17px] font-extrabold tracking-[-0.01em] truncate lg:hidden">{activeLabel}</p>
                        </div>
                        <DashboardSwitcher current={isInstructor ? 'instructor' : 'admin'} variant="pill" />
                        <button onClick={toggleCurrency} title="Switch currency" aria-label={`Currency: ${currency}. Switch currency`} className="press hidden sm:inline-flex h-11 px-3 rounded-[12px] bg-white dark:bg-night-2 items-center gap-1.5 text-[12px] font-extrabold">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />{currency}
                        </button>
                        <button onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} className="press w-11 h-11 rounded-[12px] bg-white dark:bg-night-2 inline-flex items-center justify-center text-[#6B6680] dark:text-slate-300">
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <div className="relative">
                            <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} aria-haspopup="menu" aria-expanded={showProfileDropdown} className="press h-11 pl-1.5 pr-3 rounded-full bg-white dark:bg-night-2 inline-flex items-center gap-2">
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
                                        <button role="menuitem" onClick={() => { setShowProfileDropdown(false); handleBackToStudentPortal(); }} className="w-full text-left px-3 h-11 rounded-[11px] text-[14px] font-semibold hover:bg-panel dark:hover:bg-night-3">Student site</button>
                                        <button role="menuitem" onClick={() => { setShowProfileDropdown(false); handleExitConsole(); }} className="w-full text-left px-3 h-10 rounded-[11px] text-[13px] font-bold text-[#A3321F] hover:bg-[#FDECE8] dark:hover:bg-red-950/20 flex items-center gap-2"><LogOut size={15} />Sign out</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className={`admin-content px-3 sm:px-6 lg:px-7 pt-2 pb-10 flex-1 min-w-0 overflow-x-auto ${BOTTOM_NAV_SPACE}`}>
                    {renderContent()}
                </div>
            </main>
            <AdminBottomNav items={bottomItems} activeId={bottomActive} ariaLabel={isInstructor ? 'Instructor' : 'Admin'} />
        </div>
    );
};

export default AdminLayout;
