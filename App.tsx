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
import { supabase } from './src/lib/supabase';
import { useCourses } from './src/hooks/useCourses';
import { UserRole } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { courses, loading: coursesLoading } = useCourses(isAuthenticated ? session?.user?.id : undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
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
            <Route path="/dashboard" element={<DashboardHome courses={courses} userId={session?.user?.id} />} />
            
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
                />
            } />
            
            <Route path="/courses" element={<MyCourses courses={isAuthenticated ? courses : []} />} />
            <Route path="/career" element={<Certificates courses={isAuthenticated ? courses : []} />} />
            <Route path="/profile" element={<Profile user={{} as any} onUpgradeClick={() => window.location.href = '/plans'} />} />
            <Route path="/plans" element={<PlansPage currentPlan={UserRole.INDIVIDUAL} onUpgrade={() => {}} onBack={() => window.location.href = '/profile'} />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Default fallback route inside Layout */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;