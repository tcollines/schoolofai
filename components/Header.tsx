import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Course } from '../types';
import { useTranslation } from './translations';

const DefaultAvatar = () => (
  <svg viewBox="0 0 128 128" className="w-full h-full text-gray-400 dark:text-slate-500 fill-current bg-gray-100 dark:bg-slate-800">
    <path d="M64 8a26 26 0 100 52 26 26 0 000-52zm0 60c-29.07 0-52.61 20.62-55.77 48h111.54C116.61 88.62 93.07 68 64 68z" />
  </svg>
);

interface HeaderProps {
  user: UserProfile;
  onMenuClick: () => void;
  showWelcome?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  profilePosition?: 'left' | 'right';
  courses?: Course[];
}

const Header: React.FC<HeaderProps> = ({
  user,
  onMenuClick,
  showWelcome = true,
  showSearch = true,
  showNotifications = true,
  showProfile = true,
  profilePosition = 'right',
  courses = []
}) => {
  const { t } = useTranslation();
  const isCompact = !showWelcome;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
    };
  }, []);

  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem(`user-avatar-${user.id}`) || user.avatar;
  });
  const [avatarScale, setAvatarScale] = useState(() => {
    const s = localStorage.getItem(`user-avatar-scale-${user.id}`);
    return s ? Number(s) : (user.avatarScale || 1);
  });
  const [avatarPosX, setAvatarPosX] = useState(() => {
    const x = localStorage.getItem(`user-avatar-pos-x-${user.id}`);
    return x ? Number(x) : (user.avatarPositionX || 0);
  });
  const [avatarPosY, setAvatarPosY] = useState(() => {
    const y = localStorage.getItem(`user-avatar-pos-y-${user.id}`);
    return y ? Number(y) : (user.avatarPositionY || 0);
  });
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatar(localStorage.getItem(`user-avatar-${user.id}`) || user.avatar);
    const s = localStorage.getItem(`user-avatar-scale-${user.id}`);
    setAvatarScale(s ? Number(s) : (user.avatarScale || 1));
    const x = localStorage.getItem(`user-avatar-pos-x-${user.id}`);
    setAvatarPosX(x ? Number(x) : (user.avatarPositionX || 0));
    const y = localStorage.getItem(`user-avatar-pos-y-${user.id}`);
    setAvatarPosY(y ? Number(y) : (user.avatarPositionY || 0));
    setAvatarError(false);
  }, [user.avatar, user.avatarScale, user.avatarPositionX, user.avatarPositionY, user.id]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      const storedAvatar = localStorage.getItem(`user-avatar-${user.id}`);
      if (storedAvatar) {
        setAvatar(storedAvatar);
      }
      const s = localStorage.getItem(`user-avatar-scale-${user.id}`);
      setAvatarScale(s ? Number(s) : 1);
      const x = localStorage.getItem(`user-avatar-pos-x-${user.id}`);
      setAvatarPosX(x ? Number(x) : 0);
      const y = localStorage.getItem(`user-avatar-pos-y-${user.id}`);
      setAvatarPosY(y ? Number(y) : 0);
      setAvatarError(false);
    };
    window.addEventListener('profile-update', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile-update', handleProfileUpdate);
    };
  }, [user.id]);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnreadCount = () => {
      const userEmail = localStorage.getItem('logged_in_email') || 'student@test.com';
      const stored = localStorage.getItem(`portal-notifications-${userEmail}`);
      if (stored) {
        const list = JSON.parse(stored);
        setUnreadCount(list.filter((n: any) => !n.read).length);
      } else {
        setUnreadCount(0);
      }
    };
    updateUnreadCount();
    window.addEventListener('notifications-update', updateUnreadCount);
    return () => {
      window.removeEventListener('notifications-update', updateUnreadCount);
    };
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

  const suggestedCourses = courses
    .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 5);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  return (
    <header className="flex items-center justify-between sticky top-0 bg-[#f3f4f6]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-gray-200/30 dark:border-slate-800/30 z-30 w-full px-4 lg:px-8 py-3.5 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-250 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        {showProfile && profilePosition === 'left' && (
          !avatar || avatarError ? (
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <DefaultAvatar />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden shrink-0">
              <img
                src={avatar}
                alt="Profile"
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${avatarScale}) translate(${avatarPosX}px, ${avatarPosY}px)`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
          )
        )}
        {showWelcome && (
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {t('welcome_back')}, {user.name.split(' ')[0]} 👋
              </h1>
              <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border shadow-xs tracking-wider shrink-0 ${
                user.role === 'PRO' 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-955/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/30'
                  : user.role === 'PLUS'
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-955/40 dark:text-violet-300 border-violet-200 dark:border-violet-900/30'
                  : user.role === 'SPONSORED'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-250 dark:border-emerald-900/30'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}>
                {user.role === 'PRO' ? 'Pro Plan' : user.role === 'PLUS' ? 'Plus Plan' : user.role === 'SPONSORED' ? 'Sponsored' : 'Basic Plan'}
              </span>
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-xs lg:text-sm mt-1 hidden sm:block">
              {user.role === 'SPONSORED' ? 'Company Sponsored • ' + user.companyName : t('individual_learner')}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {showSearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('search_courses')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleSearch}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
            />
            
            {showSuggestions && searchTerm.trim() && suggestedCourses.length > 0 && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                 {suggestedCourses.map(course => (
                   <div 
                     key={course.id} 
                     className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-gray-50 dark:border-slate-800/30 last:border-0 transition-colors flex items-center gap-3"
                     onClick={() => {
                        navigate(`/discover/${course.id}`);
                        setSearchTerm('');
                        setShowSuggestions(false);
                     }}
                   >
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-50 dark:bg-slate-800">
                        <img 
                            src={course.image} 
                            alt={course.title} 
                            className="w-full h-full object-cover" 
                            style={{
                                objectPosition: `${course.imagePositionX ?? 50}% ${course.imagePositionY ?? 50}%`,
                                transform: `scale(${course.imageScale ?? 1})`,
                                transformOrigin: `${course.imagePositionX ?? 50}% ${course.imagePositionY ?? 50}%`
                            }}
                        />
                      </div>
                     <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{course.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{course.category}</p>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {/* Theme Toggle Shortcut */}
        <button 
          onClick={toggleTheme}
          className="p-2 lg:p-2.5 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm text-gray-700 dark:text-slate-300 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {showNotifications && (
          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-2 lg:p-2.5 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm cursor-pointer"
            title="Notifications"
          >
            <Bell size={20} className="text-gray-700 dark:text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>
        )}

        {showProfile && profilePosition === 'right' && (
          <div className="flex items-center gap-2.5 pl-2 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user.name}</p>
              <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 capitalize">{user.role.toLowerCase()}</p>
            </div>
            {!avatar || avatarError ? (
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-md overflow-hidden bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <DefaultAvatar />
              </div>
            ) : (
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-md overflow-hidden shrink-0">
                <img
                  src={avatar}
                  alt="Profile"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${avatarScale}) translate(${avatarPosX}px, ${avatarPosY}px)`,
                    transformOrigin: 'center center'
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;