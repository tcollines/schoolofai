import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { AuthModal } from '../AuthModal';
import { useProfile } from '../../src/hooks/useProfile';
import { UserRole, Course } from '../../types';

interface StudentLayoutProps {
    session: any;
    isAuthenticated: boolean;
    isAdminMode: boolean;
    courses: Course[];
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ session, isAuthenticated, isAdminMode, courses }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

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
    const hideHeaderWidgets = ['courses', 'career', 'profile', 'plans', 'discover', 'settings', 'discussions', 'assignments'].includes(currentPath);
    const profilePosition = ['courses', 'discover', 'settings', 'discussions', 'assignments'].includes(currentPath) ? 'left' : 'right';

    return (
        <div className="flex min-h-screen bg-[#f3f4f6] dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
            {/* Sidebar */}
            <Sidebar
                activeTab={currentPath || 'dashboard'}
                setActiveTab={(tab) => {
                    navigate(`/${tab}`);
                    setIsMobileMenuOpen(false);
                }}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                isAdmin={isAdminMode || displayUser?.role === UserRole.ADMIN}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                <Header
                    user={displayUser}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                    showWelcome={!hideHeaderWidgets}
                    showSearch={!hideHeaderWidgets}
                    showNotifications={!hideHeaderWidgets}
                    showProfile={!hideHeaderWidgets}
                    profilePosition={profilePosition}
                    courses={courses}
                />

                <main className="flex-1 w-full p-4 lg:px-8 lg:pb-8 max-w-7xl transition-all duration-200">
                    <div className="animate-in fade-in duration-500">
                        <Outlet context={{ displayUser, setShowAuthModal }} />
                    </div>
                </main>
            </div>

            {/* Global Auth Modal for Guest Users hitting restricted actions */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onLogin={() => {
                    setShowAuthModal(false);
                    // Reload to pick up session, or just let App state catch it
                }}
            />
        </div>
    );
};

export default StudentLayout;
