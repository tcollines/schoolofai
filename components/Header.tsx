import React, { useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Course } from '../types';

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
  const isCompact = !showWelcome;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    <header className={`flex items-center justify-between sticky top-0 bg-[#f3f4f6] z-30 lg:relative lg:top-auto lg:bg-transparent ${isCompact ? 'py-1 mb-1' : 'py-2 lg:py-2 mb-4 lg:mb-6'
      }`}>
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        {showProfile && profilePosition === 'left' && (
          <img
            src={user.avatar}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
          />
        )}
        {showWelcome && (
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Welcome back, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-xs lg:text-sm mt-1 hidden sm:block">
              {user.role === 'SPONSORED' ? 'Company Sponsored • ' + user.companyName : 'Individual Learner'}
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
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleSearch}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
            />
            
            {showSuggestions && searchTerm.trim() && suggestedCourses.length > 0 && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                 {suggestedCourses.map(course => (
                   <div 
                     key={course.id} 
                     className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex items-center gap-3"
                     onClick={() => {
                        navigate(`/discover/${course.id}`);
                        setSearchTerm('');
                        setShowSuggestions(false);
                     }}
                   >
                     <img src={course.image} alt={course.title} className="w-10 h-10 rounded-lg object-cover" />
                     <div>
                        <p className="font-semibold text-sm text-gray-900 line-clamp-1">{course.title}</p>
                        <p className="text-xs text-gray-500">{course.category}</p>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {showNotifications && (
          <button className="relative p-2 lg:p-2.5 bg-white rounded-full border border-gray-100 hover:bg-gray-50 shadow-sm">
            <Bell size={20} className="text-gray-700" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        )}

        {showProfile && profilePosition === 'right' && (
          <div className="flex items-center gap-3 pl-2">
            <img
              src={user.avatar}
              alt="Profile"
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-white shadow-md"
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;