import React from 'react';
import { LayoutDashboard, BookOpen, MessageSquare, CreditCard, User, Award, Settings, LogOut, Briefcase, X, Compass, Calendar, ClipboardList } from 'lucide-react';
import { mysqlClient } from '../src/lib/mysqlClient';

import { useTranslation } from './translations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose, isAdmin }) => {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'discover', label: t('discover'), icon: Compass },
    { id: 'courses', label: t('my_courses'), icon: BookOpen },
    { id: 'events', label: t('events') || 'Upcoming Events', icon: Calendar },
    { id: 'career', label: t('career_growth'), icon: Briefcase },
    { id: 'profile', label: t('my_profile'), icon: User },
    { id: 'plans', label: t('subscription_plans') || 'Upgrade Plan', icon: CreditCard },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 
        bg-slate-900 text-white
        border-r border-slate-800
        flex flex-col h-full overflow-y-auto 
        transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
        lg:translate-x-0 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Placeholder */}
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-black rounded-full"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Welile<span className="text-welile-purple">School</span></span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out text-sm font-medium text-left group hover:translate-x-2 hover:scale-[1.02] active:scale-[0.98] ${activeTab === item.id
                ? 'bg-welile-purple text-white shadow-lg shadow-purple-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={20} className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[8deg]" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={async () => {
              await mysqlClient.auth.signOut();
              window.location.href = '/';
            }}
            className="flex items-center gap-3 text-slate-400 hover:text-white px-4 py-4 w-full mt-2 text-sm"
          >
            <LogOut size={18} />
            {t('sign_out')}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;