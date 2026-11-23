import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { AuthModal } from '../AuthModal';
import { useProfile } from '../../src/hooks/useProfile';
import { UserRole, Course } from '../../types';
import { CheckCircle, Sparkles, X, PartyPopper } from 'lucide-react';
import MobileTabBar from './MobileTabBar';
import { supabase } from '../../src/lib/supabaseClient';
import { fetchMyPortalRoles, PortalRoles } from '../../src/lib/roles';
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
    const [portalRoles, setPortalRoles] = React.useState<PortalRoles | null>(null);
    React.useEffect(() => {
        if (!isAuthenticated || !session?.user?.id) { setPortalRoles(null); return; }
        fetchMyPortalRoles(session.user.id).then(r => {
            setPortalRoles(r);
            // Non-student field-only agents belong exclusively in their streamlined Field Agent Portal
            if (!r.is_student && r.is_agent && !r.is_admin && !r.is_supervisor) {
                navigate('/staff', { replace: true });
            }
        });
    }, [isAuthenticated, session?.user?.id, navigate]);
    const hasMultipleRoles = (portalRoles?.role_count || 0) >= 2;

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

        const isCorporate = displayUser?.role === UserRole.SPONSORED || Boolean(displayUser?.companyName);

    const activeKey = currentPath === 'plans' ? 'plans' : (currentPath || 'dashboard');
    const TITLES: Record<string, string> = {
        profile: 'Me', courses: 'My learning', career: 'Certificates', events: 'Live classes', discover: 'Discover',
        plans: 'Plans and payments', settings: 'Settings', notifications: 'Notifications', discussions: 'Discussions',
        corporate: 'Corporate portal'
    };
    // The five phone tabs draw their own header (canvas "Phone ·" boards), so the bar and padding drop away on phones
    const q = location.search;
    const phoneOwn = currentPath === 'dashboard' || currentPath === 'courses' || (currentPath === 'discover' && location.pathname.split('/').length === 2)
        || (currentPath === 'events' && !q.includes('view=all')) || (currentPath === 'profile' && !q.includes('view=details'));
    const mobileTitle = currentPath === 'dashboard' ? undefined : (TITLES[currentPath] || '');
    // Pages opened from the Me screen get a back button on phones
    const mobileBack = ['courses', 'career', 'plans', 'settings', 'notifications', 'discussions', 'corporate'].includes(currentPath) || (currentPath === 'profile' && location.search.includes('view=details')) ? '/profile' : undefined;

    return (
        <div className="min-h-screen bg-panel dark:bg-[#0F0C1D] text-ink dark:text-slate-100 transition-colors duration-200">
            <div className="flex items-start gap-5 lg:p-5 min-h-screen">
                {/* Sidebar: floating card on desktop, drawer on phones */}
                <Sidebar
                    activeTab={activeKey}
                    setActiveTab={() => setIsMobileMenuOpen(false)}
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    isAdmin={isAdminMode || displayUser?.role === UserRole.ADMIN}
                    isCorporate={isCorporate}
                    hasMultipleRoles={hasMultipleRoles}
                    user={displayUser as any}
                />

                {/* Main column */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className={phoneOwn ? 'hidden lg:contents' : 'contents'}>
                    <Header
                        user={displayUser}
                        onMenuClick={() => setIsMobileMenuOpen(true)}
                        mobileTitle={mobileTitle}
                        mobileBack={mobileBack}
                        showWelcome={false}
                        showSearch={!hideHeaderWidgets}
                        showNotifications={true}
                        showProfile={true}
                        profilePosition="right"
                        courses={courses}
                    />
                    </div>

                    <main className={`flex-1 w-full max-w-[1240px] lg:px-0 lg:pt-5 lg:pb-10 ${phoneOwn ? '' : 'px-4 pt-2 pb-32'}`}>
                        <div className="animate-in fade-in duration-500">
                            <Outlet context={{ displayUser, setShowAuthModal }} />
                        </div>
                    </main>
                </div>
            </div>

            <MobileTabBar />

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
                    <div className="fixed inset-0 bg-night/50 backdrop-blur-sm" onClick={() => setVerificationAlert(null)} />
                    <div className="bg-white dark:bg-night-2 w-full max-w-md rounded-[28px] p-7 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-stone-900 dark:text-white text-center">
                        <button 
                            type="button" 
                            onClick={() => setVerificationAlert(null)} 
                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="mx-auto w-16 h-16 bg-mint-soft dark:bg-green-950/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={36} className="text-green-500" />
                        </div>

                        <h3 className="text-xl font-bold mb-2">Payment Verified Successfully! <PartyPopper className="inline-block w-4 h-4 mr-1 align-middle" /></h3>
                        <p className="text-sm text-stone-600 dark:text-slate-350 mb-6">
                            Thank you for upgrading! Your transaction has been successfully verified. We appreciate your support.
                            <span className="block mt-3 p-3 bg-stone-50 dark:bg-slate-800/50 border border-stone-100 dark:border-slate-800 rounded-[22px] text-xs text-stone-700 dark:text-slate-300 font-medium">
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
                                    className="press w-full h-12 rounded-[14px] bg-brand text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Sparkles size={16} />
                                    Explore Pro Plan
                                </button>
                            )}
                            <button 
                                onClick={() => setVerificationAlert(null)}
                                className="press w-full h-12 rounded-[14px] bg-stone-100 dark:bg-night-3 text-ink dark:text-slate-200 font-bold text-sm cursor-pointer"
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
