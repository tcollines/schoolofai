import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import StudentLayout from './components/layouts/StudentLayout';
import AdminLayout from './components/admin/AdminLayout';
import DashboardHome from './components/DashboardHome';
import Profile from './components/Profile';
import PlansPage from './components/PlansPage';
import MyCourses from './components/MyCourses';
import DiscoverCourses from './components/DiscoverCourses';
import CourseOverview from './components/CourseOverview';
import Certificates from './components/Certificates';
import SettingsPage from './components/SettingsPage';
import NotificationsPage from './components/NotificationsPage';
import EventsPage from './components/EventsPage';
import DiscussionsPage from './components/DiscussionsPage';
import { supabase } from './src/lib/supabase';
import { useCourses } from './src/hooks/useCourses';
import { useProfile } from './src/hooks/useProfile';
import { UserRole } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { courses, loading: coursesLoading } = useCourses(isAuthenticated ? session?.user?.id : undefined);
  const { profile: userProfile } = useProfile(isAuthenticated ? session : null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
      
      if (event === 'SIGNED_IN' && session) {
          // Trigger login notification
          const emailAddress = session.user?.email || 'student@test.com';
          const storedNotifs = localStorage.getItem('portal-notifications');
          const notifList = storedNotifs ? JSON.parse(storedNotifs) : [];
          
          // Check if we already registered a login notification for this exact timestamp (within 3 seconds) to avoid duplicate fires on redirects
          const isDuplicate = notifList.some((n: any) => 
              n.title === "New Login Detected" && 
              (Date.now() - new Date(n.timestamp).getTime()) < 3000
          );
          
          if (!isDuplicate) {
              const now = new Date();
              const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              
              const newNotif = {
                  id: 'login-' + Date.now(),
                  title: "New Login Detected",
                  description: `A successful login was registered for ${emailAddress} on ${dateStr} at ${timeStr}.`,
                  timestamp: now.toISOString(),
                  read: false,
                  type: 'system'
              };
              localStorage.setItem('portal-notifications', JSON.stringify([newNotif, ...notifList]));
              window.dispatchEvent(new Event('notifications-update'));
          }
      }

      if (session && window.location.pathname === '/login') {
          window.location.href = '/dashboard';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-welile-purple"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
            !isAuthenticated ? (
                <LandingPage 
                    onGetStarted={() => window.location.href = '/signup'}
                    onLoginClick={() => window.location.href = '/login'}
                    onSignupClick={() => window.location.href = '/signup'}
                    onAdminConsoleClick={() => window.location.href = '/admin'}
                />
            ) : <Navigate to="/dashboard" replace />
        } />
        
        <Route path="/login" element={
            !isAuthenticated ? (
                <LoginPage 
                    onLogin={() => window.location.href = '/dashboard'}
                    onNavigateToSignup={() => window.location.href = '/signup'}
                    onBack={() => window.location.href = '/'}
                />
            ) : <Navigate to="/dashboard" replace />
        } />

        <Route path="/signup" element={
            !isAuthenticated ? (
                <SignupPage 
                    onSignup={() => window.location.href = '/dashboard'}
                    onNavigateToLogin={() => window.location.href = '/login'}
                    onBack={() => window.location.href = '/'}
                />
            ) : <Navigate to="/dashboard" replace />
        } />
        
        {/* Admin Route */}
        <Route path="/admin/*" element={
             <AdminLayout onExit={() => window.location.href = '/dashboard'} />
        } />

        {/* Student Routes wrapper */}
        <Route element={<StudentLayout session={session} isAuthenticated={isAuthenticated} isAdminMode={false} courses={courses} />}>
            <Route path="/dashboard" element={<DashboardHome courses={courses} userId={session?.user?.id || 'guest'} />} />
            
            <Route path="/discover" element={
                <DiscoverCourses 
                  courses={courses} 
                  isAuthenticated={isAuthenticated} 
                  onLoginClick={() => window.location.href = '/login'} 
                  onEnroll={async (courseId) => {
                    if (!session?.user?.id) return;
                    await supabase.from('enrollments').insert({
                      user_id: session.user.id,
                      course_id: courseId,
                      status: 'IN_PROGRESS',
                      progress: 0
                    });
                    window.location.href = '/courses';
                  }}
                />
            } />
            
            <Route path="/discover/:courseId" element={
                <CourseOverview 
                  courses={courses} 
                  isAuthenticated={isAuthenticated} 
                  onLoginClick={() => window.location.href = '/login'} 
                  onEnroll={async (courseId) => {
                    if (!session?.user?.id) return;
                    await supabase.from('enrollments').insert({
                      user_id: session.user.id,
                      course_id: courseId,
                      status: 'IN_PROGRESS',
                      progress: 0
                    });
                    window.location.href = '/courses';
                  }}
                  onUnenroll={async (courseId) => {
                    if (!session?.user?.id) return;
                    await supabase.from('enrollments')
                      .delete()
                      .eq('user_id', session.user.id)
                      .eq('course_id', courseId);
                    window.location.reload();
                  }}
                />
            } />
            
            <Route path="/courses" element={<MyCourses courses={isAuthenticated ? courses : []} />} />
            <Route path="/discussions" element={<DiscussionsPage />} />
            <Route path="/career" element={<Certificates courses={isAuthenticated ? courses : []} />} />
            <Route path="/profile" element={<Profile user={userProfile || ({} as any)} onUpgradeClick={() => window.location.href = '/plans'} />} />
            <Route path="/plans" element={<PlansPage user={userProfile} currentPlan={(userProfile?.role === UserRole.PRO || userProfile?.role === UserRole.ADMIN) ? userProfile.role : UserRole.INDIVIDUAL} onUpgrade={() => {}} onBack={() => window.location.href = '/profile'} />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/events" element={<EventsPage courses={courses} />} />
            
            {/* Default fallback route inside Layout */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;