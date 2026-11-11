import React from 'react';
import { LayoutDashboard, BookOpen, CreditCard, User, Settings, LogOut, Briefcase, X, Compass, Calendar, Shield, Building2, GraduationCap } from 'lucide-react';
import { supabaseClient } from '../src/lib/supabaseClient';

import { useTranslation } from './translations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  isCorporate?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose, isAdmin, isCorporate }) => {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'learn/ai-fundamentals', label: 'AI Fundamentals', icon: GraduationCap },
    { id: 'discover', label: t('discover'), icon: Compass },
    { id: 'courses', label: t('my_courses'), icon: BookOpen },
    ...(isCorporate ? [{ id: 'corporate', label: 'Corporate Portal', icon: Building2 }] : []),
    { id: 'events', label: t('events') || 'Upcoming Classes', icon: Calendar },
    { id: 'career', label: t('career_growth'), icon: Briefcase },
    { id: 'profile', label: t('my_profile'), icon: User },
    { id: 'settings', label: t('settings'), icon: Settings },
  ] as { id: string; label: string; icon: React.ComponentType<any>; badge?: string }[];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Main navigation"
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64
          bg-white dark:bg-slate-900 text-[#1c1917] dark:text-slate-100
          border-r border-stone-200 dark:border-slate-800
          flex flex-col h-full overflow-y-auto
          transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <img src="/schoolofai-logo.png" alt="Welile School of AI" className="h-12 w-auto object-contain" />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {menuItems.map((item) => {
            const active = activeTab === item.id || (item.id.startsWith('learn/') && activeTab === 'learn');
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] text-left min-h-[44px] transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600
                  ${active
                    ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-900 dark:text-violet-200 font-semibold'
                    : 'text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 font-medium'}`}
              >
                <item.icon size={20} className={active ? 'text-violet-800 dark:text-violet-300' : 'text-stone-500 dark:text-slate-400'} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-lime-200 text-lime-900">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 mt-auto space-y-1 border-t border-stone-200 dark:border-slate-800">
          {isAdmin && (
            <a
              href="http://admin.localhost:4002"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-violet-900 dark:text-violet-200 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-950/70 transition-colors"
            >
              <Shield size={18} />
              <span>Admin Console</span>
            </a>
          )}
          <button
            onClick={async () => {
              await supabaseClient.auth.signOut();
              window.location.href = '/';
            }}
            className="flex items-center gap-3 text-stone-600 dark:text-slate-400 hover:text-[#1c1917] dark:hover:text-white px-4 py-3 w-full text-[15px] rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            <LogOut size={18} />
            {t('sign_out')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
