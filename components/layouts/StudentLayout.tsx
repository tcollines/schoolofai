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

    // Derived state for Header visibility based on current route
    const currentPath = location.pathname.split('/')[1] || '';
    const hideHeaderWidgets = ['courses', 'career', 'profile', 'plans', 'discover'].includes(currentPath);
    const profilePosition = ['courses', 'discover'].includes(currentPath) ? 'left' : 'right';

    return (
        <div className="flex min-h-screen bg-[#f3f4f6]">
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
            <main className="flex-1 w-full lg:ml-64 p-4 lg:px-8 lg:pb-8 lg:pt-4 max-w-7xl transition-all duration-200">
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

                <div className="animate-in fade-in duration-500">
                    <Outlet context={{ displayUser, setShowAuthModal }} />
                </div>
            </main>

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
