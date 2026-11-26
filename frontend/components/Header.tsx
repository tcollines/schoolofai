import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, ArrowLeft, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Course } from '../types';
import { useTranslation } from './translations';
import { getCurrencyPreference, setCurrencyPreference, CurrencyType } from '../src/lib/currency';
import DashboardSwitcher from './ui/DashboardSwitcher';

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
  /** Phone header: a page title, or (when undefined) the Home greeting with the student's name. */
  mobileTitle?: string;
  /** Phone header: show a back button to this path. */
  mobileBack?: string;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onMenuClick,
  showWelcome = true,
  showSearch = true,
  showNotifications = true,
  showProfile = true,
  profilePosition = 'right',
  courses = [],
  mobileTitle,
  mobileBack
}) => {
  const { t } = useTranslation();
  const isCompact = !showWelcome;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [currency, setCurrency] = useState<CurrencyType>(getCurrencyPreference);

  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrency(getCurrencyPreference());
    };
    window.addEventListener('currency-change', handleCurrencyChange);
    return () => {
      window.removeEventListener('currency-change', handleCurrencyChange);
    };
  }, []);

  const toggleCurrency = () => {
    setCurrencyPreference(currency === 'USD' ? 'UGX' : 'USD');
  };

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
      const userEmail = localStorage.getItem('logged_in_email') || '';
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

  const activeCompanyName = user.companyName || (user as any).company_name || localStorage.getItem('user_company_name') || (user.role === 'SPONSORED' ? 'Corporate Partner' : '');
  const isCorporateUser = user.role === 'SPONSORED' || localStorage.getItem('user_plan') === 'corporate' || (!!activeCompanyName && user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR');
  const planText = isCorporateUser ? (activeCompanyName || 'Corporate Partner') : user.role === 'ADMIN' ? 'Instructor' : user.role === 'PRO' ? 'Pro plan' : user.role === 'PREMIUM' ? 'Premium plan' : 'Basic plan';
  const initials = (user.name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const AvatarImg = ({ size }: { size: number }) => (!avatar || avatarError) ? (
    <span className="rounded-full bg-brand text-white font-extrabold inline-flex items-center justify-center shrink-0" style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials}</span>
  ) : (
    <span className="rounded-full overflow-hidden shrink-0 inline-block" style={{ width: size, height: size }}>
      <img src={avatar} alt="" onError={() => setAvatarError(true)} className="w-full h-full object-cover"
        style={{ transform: `scale(${avatarScale}) translate(${avatarPosX}px, ${avatarPosY}px)`, transformOrigin: 'center center' }} />
    </span>
  );

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  const iconBtn = 'press relative w-11 h-11 rounded-full bg-white dark:bg-night-2 text-ink dark:text-slate-200 inline-flex items-center justify-center shadow-[0_1px_3px_rgba(30,27,46,0.06)] hover:bg-[#F7F5FD] dark:hover:bg-night-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';

  return (
    <header className="frost sticky top-0 z-30 w-full flex items-center gap-3 px-4 lg:px-0 py-3 lg:py-0 lg:pb-3 lg:pt-0">
      {/* Phone: no menu button. Home shows a greeting, other pages show their title. */}
      <div className="lg:hidden flex items-center gap-3 min-w-0 flex-1">
        {mobileBack && (
          <button type="button" onClick={() => navigate(mobileBack)} aria-label="Back" className={iconBtn}><ArrowLeft size={20} /></button>
        )}
        {mobileTitle === undefined ? (
          <button type="button" onClick={() => navigate('/profile')} aria-label={`Your profile, ${user.name}`} className="press flex items-center gap-3 min-w-0 bg-transparent border-0 p-0 text-left cursor-pointer">
            <AvatarImg size={44} />
            <span className="min-w-0 leading-tight">
              <span className="block text-[12px] font-semibold text-stone-600 dark:text-slate-400">{greeting()}</span>
              <span className="block text-[17px] font-extrabold tracking-[-0.01em] text-ink dark:text-white truncate">{user.name}</span>
            </span>
          </button>
        ) : (
          // Pages already show their own heading, so the bar shows the brand (no repeated title)
          <span className="flex items-center gap-2.5 min-w-0" aria-label={mobileTitle || 'Welile School of AI'}>
            <span className="w-10 h-10 rounded-[12px] bg-brand text-white inline-flex items-center justify-center text-[17px] font-extrabold shrink-0" aria-hidden="true">W</span>
            <span className="leading-tight min-w-0" aria-hidden="true">
              <span className="block text-[14px] font-extrabold tracking-[-0.01em] truncate">Welile</span>
              <span className="block text-[11px] font-semibold text-stone-600 dark:text-slate-400 truncate">School of AI</span>
            </span>
          </span>
        )}
      </div>

      {showWelcome && (
        <div className="hidden md:block">
          <h1 className="m-0 text-xl font-extrabold tracking-tight">{t('welcome_back')}, {user.name.split(' ')[0]}</h1>
          {isCorporateUser && <p className="m-0 text-xs text-stone-600 dark:text-slate-400 flex items-center gap-1"><Building2 size={12} />{activeCompanyName}</p>}
        </div>
      )}

      {showSearch && (
        <div className="relative hidden md:block flex-1 max-w-[560px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" size={18} />
          <input
            type="search"
            aria-label={t('search_courses')}
            placeholder={t('search_courses') || 'Search for a course or lesson'}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
            onKeyDown={handleSearch}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full h-12 pl-11 pr-4 rounded-[14px] border-0 bg-white dark:bg-night-2 text-[14px] text-ink dark:text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand shadow-[0_1px_3px_rgba(30,27,46,0.05)]"
          />
          {showSuggestions && searchTerm.trim() && suggestedCourses.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-night-2 shadow-[0_20px_50px_rgba(30,27,46,0.18)] rounded-[18px] overflow-hidden z-50 max-h-80 overflow-y-auto p-1.5">
              {suggestedCourses.map(course => (
                <button type="button" key={course.id}
                  className="press w-full text-left px-3 py-2.5 rounded-xl hover:bg-panel dark:hover:bg-night-3 flex items-center gap-3"
                  onClick={() => { navigate(`/discover/${course.id}`); setSearchTerm(''); setShowSuggestions(false); }}>
                  <span className="w-10 h-10 rounded-[10px] overflow-hidden shrink-0 bg-panel dark:bg-night-3">
                    <img src={course.image} alt="" className="w-full h-full object-cover"
                      style={{ objectPosition: `${course.imagePositionX ?? 50}% ${course.imagePositionY ?? 50}%`, transform: `scale(${course.imageScale ?? 1})`, transformOrigin: `${course.imagePositionX ?? 50}% ${course.imagePositionY ?? 50}%` }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-sm line-clamp-1">{course.title}</span>
                    <span className="block text-xs text-stone-600 dark:text-slate-400">{course.category}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="hidden lg:block flex-1" />

      <button onClick={toggleCurrency} title="Switch currency" aria-label={`Currency: ${currency}. Switch currency`}
        className="press hidden lg:inline-flex items-center gap-2 h-11 px-4 rounded-full bg-white dark:bg-night-2 text-[13px] font-extrabold text-ink dark:text-slate-200 shadow-[0_1px_3px_rgba(30,27,46,0.06)]">
        <span className="w-2 h-2 rounded-full bg-brand" aria-hidden="true" />{currency}
      </button>

      <button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} className={`${iconBtn} hidden lg:inline-flex`}>
        {isDark ? <Sun size={19} /> : <Moon size={19} />}
      </button>

      {/* Shows only when the person has two or more dashboards */}
      <DashboardSwitcher current="student" variant="icon" className="!rounded-full" />

      {showNotifications && (
        <button onClick={() => navigate('/notifications')} title="Notifications" aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} new` : 'Notifications'} className={iconBtn}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F0533A] text-white text-[10px] font-extrabold inline-flex items-center justify-center border-2 border-panel dark:border-night">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
      )}

      {showProfile && (
        <button type="button" onClick={() => navigate('/profile')} aria-label={`Your profile, ${user.name}`}
          className="press hidden lg:inline-flex items-center gap-2.5 h-11 pl-1 pr-1 sm:pr-3.5 rounded-full bg-white dark:bg-night-2 shadow-[0_1px_3px_rgba(30,27,46,0.06)]">
          <AvatarImg size={36} />
          <span className="hidden sm:block text-left leading-tight">
            <span className="block text-[13px] font-extrabold text-ink dark:text-white max-w-[140px] truncate">{user.name}</span>
            <span className="block text-[11px] font-semibold text-stone-600 dark:text-slate-400 max-w-[140px] truncate">{planText}</span>
          </span>
        </button>
      )}
    </header>
  );
};

export default Header;