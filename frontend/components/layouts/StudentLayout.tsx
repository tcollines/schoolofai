import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { AuthModal } from '../AuthModal';
import { useProfile } from '../../src/hooks/useProfile';
import { UserRole, Course } from '../../types';
import { CheckCircle, Sparkles, X, PartyPopper, LayoutDashboard, Compass, BookOpen, Calendar, User } from 'lucide-react';
import { useTranslation } from '../translations';

interface StudentLayoutProps {
    session: any;
    isAuthenticated: boolean;
    isAdminMode: boolean;
    courses: Course[];
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ session, isAuthenticated, isAdminMode, courses }) => {
    const { t } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [verificationAlert, setVerificationAlert] = useState<{
        isOpen: boolean;
        planName: string;
        recommendation: string;
    } | null>(null);

    React.useEffect(() => {
        const handleAlert = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail) {
                setVerificationAlert({
                    isOpen: true,
                    planName: customEvent.detail.planName,
                    recommendation: customEvent.detail.recommendation
                });
            }
        };
        window.addEventListener('payment-verified-alert', handleAlert);
        return () => {
            window.removeEventListener('payment-verified-alert', handleAlert);
        };
    }, []);

    const { profile } = useProfile(isAuthenticated ? session : null);

    const displayUser = profile || {
        id: 'guest',
        name: 'Guest',
        email: '',
        role: UserRole.INDIVIDUAL,
        avatar: 'https://via.placeholder.com/150',
        walletBalance: 0,
        skills: []
    };

    React.useEffect(() => {
        if (displayUser && displayUser.id !== 'guest') {
            localStorage.setItem(`student-profile-${displayUser.id}`, JSON.stringify({
                name: displayUser.name,
                email: displayUser.email
            }));
        }
    }, [displayUser]);

    // Derived state for Header visibility based on current route
    const currentPath = location.pathname.split('/')[1] || '';
    const hideHeaderWidgets = ['courses', 'career', 'profile', 'plans', 'discover', 'settings', 'discussions', 'corporate'].includes(currentPath);
    const profilePosition = ['courses', 'discover', 'settings', 'discussions'].includes(currentPath) ? 'left' : 'right';

    const activeSidebarTab = currentPath === 'plans' ? 'profile' : (currentPath || 'dashboard');
    const isCorporate = displayUser?.role === UserRole.SPONSORED || Boolean(displayUser?.companyName);

    return (
        <div className="flex min-h-screen bg-[#faf8f5] dark:bg-slate-950 text-[#1c1917] dark:text-slate-100 transition-colors duration-200">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeSidebarTab}
                setActiveTab={(tab) => {
                    navigate(`/${tab}`);
                    setIsMobileMenuOpen(false);
                }}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                isAdmin={isAdminMode || displayUser?.role === UserRole.ADMIN}
                isCorporate={isCorporate}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                <Header
                    user={displayUser}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                    showWelcome={false}
                    showSearch={!hideHeaderWidgets}
                    showNotifications={!hideHeaderWidgets}
                    showProfile={!hideHeaderWidgets}
                    profilePosition={profilePosition}
                    courses={courses}
                />

                <main className="flex-1 w-full p-4 pb-28 lg:px-8 lg:pb-10 max-w-7xl transition-all duration-200">
                    <div className="animate-in fade-in duration-500">
                        <Outlet context={{ displayUser, setShowAuthModal }} />
                    </div>
                </main>
            </div>


            {/* Phone navigation: the five things students use most */}
            <nav
                aria-label="Quick navigation"
                className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-stone-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]"
            >
                {[
                    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
                    { id: 'discover', label: t('discover'), icon: Compass },
                    { id: 'courses', label: t('my_courses'), icon: BookOpen },
                    { id: 'events', label: 'Live', icon: Calendar },
                    { id: 'profile', label: 'Profile', icon: User }
                ].map(item => {
                    const active = activeSidebarTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/${item.id}`)}
                            aria-current={active ? 'page' : undefined}
                            className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[11px] font-semibold ${active ? 'text-violet-800 dark:text-violet-300' : 'text-stone-500 dark:text-slate-400'}`}
                        >
                            <item.icon size={22} />
                            <span className="truncate max-w-full px-1">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Global Auth Modal for Guest Users hitting restricted actions */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onLogin={() => {
                    setShowAuthModal(false);
                    // Reload to pick up session, or just let App state catch it
                }}
            />

            {verificationAlert && verificationAlert.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setVerificationAlert(null)} />
                    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white text-center">
                        <button 
                            type="button" 
                            onClick={() => setVerificationAlert(null)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="mx-auto w-16 h-16 bg-green-50 dark:bg-green-950/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={36} className="text-green-500" />
                        </div>

                        <h3 className="text-xl font-bold mb-2">Payment Verified Successfully! <PartyPopper className="inline-block w-4 h-4 mr-1 align-middle" /></h3>
                        <p className="text-sm text-gray-600 dark:text-slate-350 mb-6">
                            Thank you for upgrading! Your transaction has been successfully verified. We appreciate your support.
                            <span className="block mt-3 p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl text-xs text-gray-700 dark:text-slate-300 font-medium">
                                {verificationAlert.recommendation}
                            </span>
                        </p>

                        <div className="flex flex-col gap-2">
                            {verificationAlert.planName === 'PLUS' && (
                                <button 
                                    onClick={() => {
                                        setVerificationAlert(null);
                                        navigate('/plans');
                                    }}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Sparkles size={16} />
                                    Explore Pro Plan
                                </button>
                            )}
                            <button 
                                onClick={() => setVerificationAlert(null)}
                                className="w-full py-3 rounded-xl border border-gray-250 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentLayout;
