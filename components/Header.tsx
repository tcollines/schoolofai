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
    return localStorage.getItem('user-avatar') || user.avatar;
  });
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const handleProfileUpdate = () => {
      const storedAvatar = localStorage.getItem('user-avatar');
      if (storedAvatar) {
        setAvatar(storedAvatar);
        setAvatarError(false);
      }
    };
    window.addEventListener('profile-update', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile-update', handleProfileUpdate);
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
            <img
              src={avatar}
              alt="Profile"
              onError={() => setAvatarError(true)}
              className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0"
            />
          )
        )}
        {showWelcome && (
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              {t('welcome_back')}, {user.name.split(' ')[0]} 👋
            </h1>
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
                     <img src={course.image} alt={course.title} className="w-10 h-10 rounded-lg object-cover" />
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
          <button className="relative p-2 lg:p-2.5 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm">
            <Bell size={20} className="text-gray-700 dark:text-slate-300" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
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
              <img
                src={avatar}
                alt="Profile"
                onError={() => setAvatarError(true)}
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-md shrink-0"
              />
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;