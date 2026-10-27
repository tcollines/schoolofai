import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import StudentLayout from './components/layouts/StudentLayout';
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
import CorporateDashboard from './components/corporate/CorporateDashboard';
import CorporateSetupPage from './components/corporate/CorporateSetupPage';
import VerifyEmail from './components/onboarding/VerifyEmail';
import ProfileSetup from './components/onboarding/ProfileSetup';
import PaymentPlanSetup from './components/onboarding/PaymentPlanSetup';
import RecommendedCourses from './components/onboarding/RecommendedCourses';
import { supabase, isSupabaseConfigured } from './src/lib/supabaseClient';
import { useCourses } from './src/hooks/useCourses';
import { useProfile } from './src/hooks/useProfile';
import { UserRole } from './types';

const LandingRoute = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <LandingPage 
      onGetStarted={() => navigate('/signup')}
      onLoginClick={() => navigate('/login')}
      onSignupClick={() => navigate('/signup')}
    />
  );
};

const LoginRoute = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <LoginPage 
      onLogin={() => navigate('/dashboard')}
      onNavigateToSignup={() => navigate('/signup')}
      onBack={() => navigate('/')}
    />
  );
};

const SignupRoute = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <SignupPage 
      onSignup={() => navigate('/dashboard')}
      onNavigateToLogin={() => navigate('/login')}
      onBack={() => navigate('/')}
    />
  );
};

const AdminRoute = () => {
  useEffect(() => {
    const adminUrl = window.location.hostname.includes('localhost')
      ? `${window.location.protocol}//admin.localhost:4002`
      : `${window.location.protocol}//admin.${window.location.hostname}`;
    window.location.href = adminUrl;
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-slate-900 text-white">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500"></div>
      <p className="text-sm text-slate-400">Redirecting to Admin Portal...</p>
    </div>
  );
};

const InstructorRoute = () => {
  useEffect(() => {
    const instructorUrl = window.location.hostname.includes('localhost')
      ? `${window.location.protocol}//admin.localhost:4002/instructor/courses`
      : `${window.location.protocol}//admin.${window.location.hostname}/instructor/courses`;
    window.location.href = instructorUrl;
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-slate-900 text-white">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500"></div>
      <p className="text-sm text-slate-400">Redirecting to Instructor Portal...</p>
    </div>
  );
};

const ProtectedRoute = ({ isAuthenticated, requireOnboarding = false, userProfile, children }: { isAuthenticated: boolean, requireOnboarding?: boolean, userProfile?: any, children: React.ReactNode }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireOnboarding && userProfile && !userProfile.onboarding_complete) {
     const isAlreadyOnboarding = window.location.pathname.startsWith('/onboarding');
     if (!isAlreadyOnboarding) {
         return <Navigate to="/onboarding/profile" replace />;
     }
  }

  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { courses, loading: coursesLoading } = useCourses(isAuthenticated ? session?.user?.id : undefined);
  const { profile: userProfile } = useProfile(isAuthenticated ? session : null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 2500);

    const checkAuthSession = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        clearTimeout(timer);
        const guestEmail = localStorage.getItem('auth_logged_in_email');
        const activeSession = session || (guestEmail ? {
            user: {
                id: localStorage.getItem('auth_logged_in_id') || 'default-owner',
                email: guestEmail,
                user_metadata: { 
                    full_name: localStorage.getItem('auth_logged_in_name') || 'Corporate Lead', 
                    role: 'SPONSORED' 
                }
            }
        } : null);

        setSession(activeSession);
        setIsAuthenticated(!!activeSession);
        setAuthLoading(false);
      }).catch(err => {
        clearTimeout(timer);
        console.warn("Could not retrieve session:", err);
        setAuthLoading(false);
      });
    };

    checkAuthSession();
    window.addEventListener('profile-update', checkAuthSession);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const guestEmail = localStorage.getItem('auth_logged_in_email');
      const activeSession = session || (guestEmail ? {
          user: {
              id: localStorage.getItem('auth_logged_in_id') || 'default-owner',
              email: guestEmail,
              user_metadata: { full_name: localStorage.getItem('auth_logged_in_name') || 'Corporate Lead', role: 'SPONSORED' }
          }
      } : null);

      setSession(activeSession);
      setIsAuthenticated(!!activeSession);
      
      if (session) {
          localStorage.setItem('logged_in_email', session.user?.email || 'student@test.com');
      } else {
          localStorage.removeItem('logged_in_email');
          // Clear login fired flag from sessionStorage on logout
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && key.startsWith('login_notif_fired_')) {
                  keysToRemove.push(key);
              }
          }
          keysToRemove.forEach(k => sessionStorage.removeItem(k));
      }
      
      if (event === 'SIGNED_IN' && session) {
          const emailAddress = session.user?.email || 'student@test.com';
          const notifKey = `portal-notifications-${emailAddress}`;
          
          // Check if login notification already fired in this tab session to prevent refresh duplicates
          const hasFiredForSession = sessionStorage.getItem(`login_notif_fired_${emailAddress}`);
          
          if (!hasFiredForSession) {
              sessionStorage.setItem(`login_notif_fired_${emailAddress}`, 'true');
              
              const storedNotifs = localStorage.getItem(notifKey);
              const notifList = storedNotifs ? JSON.parse(storedNotifs) : [];
              
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
              localStorage.setItem(notifKey, JSON.stringify([newNotif, ...notifList]));
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
        <Route path="/" element={<LandingRoute isAuthenticated={isAuthenticated} />} />
        <Route path="/login" element={<LoginRoute isAuthenticated={isAuthenticated} />} />
        <Route path="/signup" element={<SignupRoute isAuthenticated={isAuthenticated} />} />
        
        {/* Admin Route - uses its own authentication via AdminLoginPage */}
        <Route path="/admin/*" element={<AdminRoute />} />
        
        {/* Instructor Route - uses its own authentication via AdminLoginPage in instructor mode */}
        <Route path="/instructor/*" element={<InstructorRoute />} />

        {/* Onboarding Routes */}
        <Route path="/onboarding/verify" element={<VerifyEmail />} />
        <Route path="/onboarding/profile" element={<ProtectedRoute isAuthenticated={isAuthenticated} userProfile={userProfile}><ProfileSetup /></ProtectedRoute>} />
        <Route path="/onboarding/plan" element={<ProtectedRoute isAuthenticated={isAuthenticated} userProfile={userProfile}><PaymentPlanSetup /></ProtectedRoute>} />
        <Route path="/onboarding/courses" element={<ProtectedRoute isAuthenticated={isAuthenticated} userProfile={userProfile}><RecommendedCourses /></ProtectedRoute>} />

        {/* Student Routes wrapper */}
        <Route element={<StudentLayout session={session} isAuthenticated={isAuthenticated} isAdminMode={false} courses={courses} />}>
            <Route path="/dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><DashboardHome courses={courses} userId={session?.user?.id || 'guest'} /></ProtectedRoute>} />
            
            <Route path="/discover" element={
                <ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}>
                <DiscoverCourses 
                  courses={courses} 
                  isAuthenticated={isAuthenticated} 
                  userRole={userProfile?.role}
                  onLoginClick={() => window.location.href = '/login'} 
                  onEnroll={async (courseId) => {
                    if (!session?.user?.id) return;
                    // Block enrollment for basic users on premium courses
                    const course = courses.find(c => c.id === courseId);
                    if (course?.accessTier === 'PAID' && userProfile?.role !== UserRole.PRO && userProfile?.role !== UserRole.PREMIUM && userProfile?.role !== UserRole.SPONSORED && userProfile?.role !== UserRole.ADMIN) {
                      window.location.href = '/plans';
                      return;
                    }
                    await supabase.from('enrollments').insert({
                      user_id: session.user.id,
                      course_id: courseId,
                      status: 'IN_PROGRESS',
                      progress: 0
                    });
                    window.location.href = '/courses';
                  }}
                />
                </ProtectedRoute>
            } />
            
            <Route path="/discover/:courseId" element={
                <ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}>
                <CourseOverview 
                  courses={courses} 
                  isAuthenticated={isAuthenticated} 
                  userRole={userProfile?.role}
                  onLoginClick={() => window.location.href = '/login'} 
                  onEnroll={async (courseId) => {
                    if (!session?.user?.id) return;
                    // Block enrollment for basic users on premium courses
                    const course = courses.find(c => c.id === courseId);
                    if (course?.accessTier === 'PAID' && userProfile?.role !== UserRole.PRO && userProfile?.role !== UserRole.PREMIUM && userProfile?.role !== UserRole.SPONSORED && userProfile?.role !== UserRole.ADMIN) {
                      window.location.href = '/plans';
                      return;
                    }
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
                </ProtectedRoute>
            } />
            
            <Route path="/courses" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><MyCourses courses={isAuthenticated ? courses : []} /></ProtectedRoute>} />
            <Route path="/discussions" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><DiscussionsPage /></ProtectedRoute>} />
            <Route path="/career" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><Certificates courses={isAuthenticated ? courses : []} /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><Profile user={userProfile || ({} as any)} onUpgradeClick={() => window.location.href = '/plans'} /></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><PlansPage user={userProfile} currentPlan={userProfile?.role || UserRole.INDIVIDUAL} onUpgrade={() => {}} onBack={() => window.location.href = '/profile'} /></ProtectedRoute>} />
            <Route path="/corporate" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><CorporateDashboard user={userProfile} /></ProtectedRoute>} />
            <Route path="/corporate/setup" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><CorporateSetupPage user={userProfile} /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><SettingsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><NotificationsPage /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute isAuthenticated={isAuthenticated} requireOnboarding={true} userProfile={userProfile}><EventsPage courses={courses} /></ProtectedRoute>} />
            
            {/* Default fallback route inside Layout */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;