import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, GraduationCap, BookOpen, Video, Compass, Award, Handshake, Building2, CreditCard, User, SlidersHorizontal,
  LogOut, Shield, PanelLeftClose, PanelLeftOpen, X
} from 'lucide-react';
import { supabaseClient } from '../src/lib/supabaseClient';
import { useFreeCourse } from '../src/hooks/useFreeCourse';
import { COURSE } from '../src/content/aiFundamentals';
import { useTranslation } from './translations';
import { Bar, Initials, cx } from './ui/welile';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  isCorporate?: boolean;
  user?: { id?: string; name?: string; email?: string; role?: string };
}

type Item = { id: string; to: string; label: string; icon: React.ComponentType<any>; badge?: React.ReactNode; match?: string[] };

const OPEN_KEY = 'welile_sidebar_open';

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose, isAdmin, isCorporate, user }) => {
  const { t } = useTranslation();
  const [isStaff, setIsStaff] = useState(false);
  useEffect(() => { supabaseClient.rpc('is_staff').then(({ data }) => setIsStaff(data === true)); }, []);

  // Desktop: open (labels) or collapsed (icons). Remembered on this device.
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(OPEN_KEY) !== '0'; } catch { return true; }
  });
  const toggle = () => setOpen(o => {
    const n = !o;
    try { localStorage.setItem(OPEN_KEY, n ? '1' : '0'); } catch { /* ignore */ }
    return n;
  });

  const uid = user?.id && user.id !== 'guest' ? user.id : undefined;
  const fc = useFreeCourse(uid);
  const base = `/learn/${COURSE.slug}`;
  const role = String(user?.role || '').toUpperCase();
  const isPremium = role === 'PRO' || role === 'PREMIUM' || role === 'ADMIN' || role === 'SPONSORED';
  const planLabel = role === 'PRO' ? 'Pro' : role === 'PREMIUM' ? 'Premium' : role === 'SPONSORED' ? 'Corporate' : role === 'ADMIN' ? 'Admin' : 'Basic';

  const learn: Item[] = [
    { id: 'dashboard', to: '/dashboard', label: t('dashboard') || 'Home', icon: Home },
    { id: 'learn', to: base, label: COURSE.short || 'AI Fundamentals', icon: GraduationCap, badge: fc.enrolled ? <span className="relative px-2 py-0.5 rounded-full bg-lime-200 text-lime-900 text-[11px] font-extrabold">{fc.pct}%</span> : undefined },
    { id: 'courses', to: '/courses', label: t('my_courses') || 'My courses', icon: BookOpen },
    { id: 'events', to: '/events', label: 'Live classes', icon: Video, badge: <span className="relative w-2 h-2 rounded-full bg-[#F0533A]" aria-hidden="true" /> },
    { id: 'discover', to: '/discover', label: t('discover') || 'Discover', icon: Compass },
    { id: 'career', to: '/career', label: 'Certificates', icon: Award },
  ];
  const work: Item[] = [
    ...(isStaff ? [{ id: 'staff', to: '/staff', label: 'Agent portal', icon: Handshake }] : []),
    ...(isCorporate ? [{ id: 'corporate', to: '/corporate', label: 'Corporate portal', icon: Building2 }] : []),
  ];
  const account: Item[] = [
    { id: 'plans', to: '/plans', label: 'Plans and payments', icon: CreditCard, badge: <span className="relative px-2 py-0.5 rounded-full bg-stone-100 dark:bg-night-3 text-stone-600 dark:text-slate-300 text-[11px] font-extrabold">{planLabel}</span> },
    { id: 'profile', to: '/profile', label: t('my_profile') || 'Profile', icon: User },
    { id: 'settings', to: '/settings', label: t('settings') || 'Settings', icon: SlidersHorizontal },
  ];

  const signOut = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/';
  };

  // `expanded` is the label view. Phones always use the labelled drawer.
  const renderNav = (expanded: boolean) => {
    const Row = ({ it }: { it: Item }) => {
      const active = activeTab === it.id || (it.id === 'learn' && activeTab === 'learn');
      return (
        <Link
          to={it.to}
          onClick={() => { setActiveTab(it.to.replace(/^\//, '')); }}
          title={expanded ? undefined : it.label}
          aria-label={expanded ? undefined : it.label}
          aria-current={active ? 'page' : undefined}
          className={cx('press relative flex items-center gap-3 min-h-[46px] rounded-[14px] no-underline hover:bg-[#F7F5FD] dark:hover:bg-night-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            expanded ? 'px-3' : 'w-12 mx-auto justify-center')}
        >
          {active && <>
            <span aria-hidden="true" className="absolute inset-0 rounded-[14px] bg-brand-soft dark:bg-night-3" />
            <span aria-hidden="true" className="absolute -left-3.5 top-3 bottom-3 w-1 rounded bg-brand" />
          </>}
          <it.icon size={22} strokeWidth={1.9} className={cx('relative shrink-0', active ? 'text-brand dark:text-violet-300' : 'text-[#8A85A0]')} />
          {expanded && <span className={cx('relative flex-1 min-w-0 text-[14px] font-bold whitespace-nowrap overflow-hidden text-ellipsis', active ? 'text-brand-ink dark:text-white' : 'text-stone-700 dark:text-slate-300')}>{it.label}</span>}
          {expanded && it.badge}
        </Link>
      );
    };
    const Section = ({ title, items }: { title: string; items: Item[] }) => items.length === 0 ? null : (
      <>
        {expanded
          ? <p className="mt-3.5 mb-1 px-3 text-[11px] font-extrabold tracking-[0.12em] uppercase text-stone-600 dark:text-slate-400">{title}</p>
          : <span aria-hidden="true" className="block w-7 h-px my-3 mx-auto bg-lilac dark:bg-night-3" />}
        {items.map(it => <Row key={it.id} it={it} />)}
      </>
    );

    return (
      <nav aria-label="Main navigation" className="flex flex-col gap-0.5 h-full">
        <Section title="Learn" items={learn} />
        {expanded && uid && fc.enrolled && !fc.cert && (
          <Link to={fc.nextItemId ? `${base}/item/${fc.nextItemId}` : base}
            className="press block mt-3.5 p-3.5 rounded-[18px] bg-panel dark:bg-night-3 text-ink dark:text-white no-underline hover:bg-[#F1EEFB]">
            <span className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-brand dark:text-violet-300">{fc.started ? 'Continue' : 'Start'}</span>
              <span className="text-[11px] font-bold text-stone-600 dark:text-slate-400">{fc.done} of {fc.total}</span>
            </span>
            <span className="block mt-1.5 text-[13px] font-extrabold leading-snug">{COURSE.short}</span>
            {fc.nextItemTitle && <span className="block mt-0.5 text-[12px] text-stone-600 dark:text-slate-400 line-clamp-1">{fc.nextItemTitle}</span>}
            <Bar pct={fc.pct} className="mt-2.5" label="Course progress" />
          </Link>
        )}
        <Section title="Work" items={work} />
        <Section title="Account" items={account} />
        <div className="flex-1 min-h-[20px]" />

        {expanded && uid && !isPremium && (
          <div className="relative overflow-hidden p-4 rounded-[18px] bg-brand text-white mb-3">
            <span aria-hidden="true" className="absolute -right-8 -top-8 w-[100px] h-[100px] rounded-full bg-brand-mid" />
            <p className="relative m-0 text-[14px] font-extrabold">Go Pro</p>
            <p className="relative mt-1 mb-0 text-[12px] leading-relaxed text-violet-100">Live cohorts, every Pro course and verified certificates.</p>
            <Link to="/plans" className="press relative mt-2.5 h-[34px] rounded-[10px] bg-lime-200 text-ink text-[12px] font-extrabold flex items-center justify-center no-underline">Upgrade</Link>
          </div>
        )}

        {isAdmin && (
          <a href={window.location.hostname.includes('localhost') ? 'http://admin.localhost:4002' : '/admin/'}
            title={expanded ? undefined : 'Admin console'} aria-label={expanded ? undefined : 'Admin console'}
            className={cx('press flex items-center gap-3 min-h-[44px] rounded-[14px] text-[13px] font-bold text-brand-ink dark:text-violet-200 bg-brand-soft dark:bg-night-3 mb-2 no-underline', expanded ? 'px-3' : 'w-12 mx-auto justify-center')}>
            <Shield size={18} className="shrink-0" />{expanded && <span>Admin console</span>}
          </a>
        )}

        {uid && (
          <div className={cx('flex items-center gap-2.5', expanded ? 'p-2.5 rounded-2xl bg-panel dark:bg-night-3' : 'justify-center py-1.5 flex-col')}>
            <Initials name={user?.name} size={40} />
            {expanded && (
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-extrabold truncate">{user?.name}</span>
                <span className="block text-[12px] text-stone-600 dark:text-slate-400 truncate">{user?.email}</span>
              </span>
            )}
            <button type="button" onClick={signOut} aria-label={t('sign_out') || 'Sign out'} title={t('sign_out') || 'Sign out'}
              className="press shrink-0 w-9 h-9 rounded-[10px] text-[#C2410C] inline-flex items-center justify-center hover:bg-white dark:hover:bg-night-2">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </nav>
    );
  };

  return (
    <>
      {/* Desktop: floating card that opens and collapses */}
      <aside
        className={cx('sb-anim hidden lg:flex flex-col shrink-0 sticky top-5 self-start bg-white dark:bg-night-2 rounded-[22px] py-[18px] overflow-hidden min-h-[calc(100vh-40px)] max-h-[calc(100vh-40px)] overflow-y-auto no-scrollbar',
          open ? 'w-[264px] px-3.5' : 'w-[76px] px-0')}
      >
        <div className={cx('flex items-center gap-2 mb-1.5', open ? 'pl-2 justify-between' : 'flex-col justify-center')}>
          {open
            ? <Link to="/dashboard" className="flex items-center min-w-0 flex-1"><img src="/schoolofai-logo.png" alt="Welile School of AI" className="h-[30px] w-auto max-w-[170px] object-contain" /></Link>
            : <Link to="/dashboard" aria-label="Welile School of AI home" className="w-11 h-11 rounded-[14px] bg-brand text-white flex items-center justify-center font-extrabold text-[20px] no-underline">W</Link>}
          <button type="button" onClick={toggle} aria-expanded={open} aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'} title={open ? 'Collapse sidebar' : 'Expand sidebar'}
            className="press shrink-0 w-9 h-9 rounded-[10px] bg-[#F4F1FC] dark:bg-night-3 text-brand dark:text-violet-300 inline-flex items-center justify-center">
            {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>
        {renderNav(open)}
      </aside>

      {/* Phones and tablets: labelled drawer */}
      {isOpen && <div className="lg:hidden fixed inset-0 bg-night/40 z-40" onClick={onClose} aria-hidden="true" />}
      <aside
        aria-label="Menu"
        className={cx('lg:hidden fixed top-0 bottom-0 left-0 z-50 w-[284px] bg-white dark:bg-night-2 rounded-r-[24px] px-3.5 py-5 flex flex-col overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full')}
      >
        <div className="flex items-center justify-between pl-2 mb-2">
          <img src="/schoolofai-logo.png" alt="Welile School of AI" className="h-[30px] w-auto" />
          <button type="button" onClick={onClose} aria-label="Close menu" className="press w-10 h-10 rounded-xl bg-[#F4F1FC] dark:bg-night-3 text-brand inline-flex items-center justify-center"><X size={20} /></button>
        </div>
        {renderNav(true)}
      </aside>
    </>
  );
};

export default Sidebar;
