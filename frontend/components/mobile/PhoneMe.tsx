import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../src/lib/supabaseClient';
import { useFreeCourse } from '../../src/hooks/useFreeCourse';
import { ALL_ITEMS } from '../../src/content/aiFundamentals';
import { usePlayerPrefs } from '../learn/learnUi';
import { adminConsoleUrl, fetchMyPortalRoles, frontDeskConsoleUrl, instructorConsoleUrl, type PortalRoles } from '../../src/lib/roles';
import { Avatar, Ico, PageTitle, PhonePage, Toggle, useProgressMap } from './phoneKit';

/**
 * Phone · Me (canvas board MobileMe). Also holds everything the side menu had on computers:
 * agent portal, corporate portal, admin console, discussions.
 */

const LANGS: Record<string, string> = { en: 'English', es: 'Español', fr: 'Français', zu: 'isiZulu', sw: 'Kiswahili', lg: 'Luganda' };
const GROUP = 'mt-0 mb-2 ml-1.5 text-[12px] font-bold tracking-[0.08em] uppercase text-[#6B6680] dark:text-slate-400';
const BOX = 'bg-white dark:bg-night-2 rounded-[20px] overflow-hidden';
const LINE = 'border-b border-solid border-x-0 border-t-0 border-[#F1EFF6] dark:border-night-3';

const IconTile: React.FC<{ tone: string; children: React.ReactNode }> = ({ tone, children }) => (
    <span className={`w-8 h-8 rounded-[9px] inline-flex items-center justify-center shrink-0 ${tone}`}>{children}</span>
);

const NavRow: React.FC<{ to: string; label: string; value?: string; sub?: string; icon?: React.ReactNode; last?: boolean }> = ({ to, label, value, sub, icon, last }) => (
    <Link to={to} className={`flex items-center gap-3 min-h-[56px] px-3.5 py-2 text-ink dark:text-white no-underline hover:bg-[#FAF9FE] dark:hover:bg-night-3 ${last ? '' : LINE}`}>
        {icon}
        <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold">{label}</span>
            {sub && <span className="block text-[12px] text-[#6B6680] dark:text-slate-400 truncate">{sub}</span>}
        </span>
        {value && <span className="text-[14px] text-[#6B6680] dark:text-slate-400">{value}</span>}
        <span className="text-[#A39DB5]">{Ico.chevron()}</span>
    </Link>
);

const ExtRow: React.FC<{ href: string; label: string; sub?: string; icon?: React.ReactNode; last?: boolean }> = ({ href, label, sub, icon, last }) => (
    <a href={href} className={`flex items-center gap-3 min-h-[56px] px-3.5 py-2 text-ink dark:text-white no-underline hover:bg-[#FAF9FE] dark:hover:bg-night-3 ${last ? '' : LINE}`}>
        {icon}
        <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold">{label}</span>
            {sub && <span className="block text-[12px] text-[#6B6680] dark:text-slate-400 truncate">{sub}</span>}
        </span>
        <span className="text-[#A39DB5]">{Ico.chevron()}</span>
    </a>
);

const SwitchRow: React.FC<{ label: string; sub?: string; icon?: React.ReactNode; on: boolean; onChange: () => void; last?: boolean }> = ({ label, sub, icon, on, onChange, last }) => (
    <div className={`flex items-center gap-3 min-h-[58px] px-3.5 ${last ? '' : LINE}`}>
        {icon}
        <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold">{label}</span>
            {sub && <span className="block text-[12px] text-[#6B6680] dark:text-slate-400">{sub}</span>}
        </span>
        <Toggle on={on} onChange={onChange} label={label} />
    </div>
);

const PhoneMe: React.FC<{ user: any }> = ({ user }) => {
    const navigate = useNavigate();
    const uid = user?.id && user.id !== 'guest' ? user.id : undefined;
    const fc = useFreeCourse(uid);
    const progress = useProgressMap(uid);
    const { prefs, update } = usePlayerPrefs();
    const [isStaff, setIsStaff] = useState(false);
    const [roles, setRoles] = useState<PortalRoles | null>(null);
    const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => { document.title = 'Me | Welile School of AI'; }, []);
    useEffect(() => { if (uid) supabase.rpc('is_staff').then(({ data }) => setIsStaff(data === true)); }, [uid]);
    useEffect(() => {
        let live = true;
        if (uid) fetchMyPortalRoles(uid).then(r => { if (live) setRoles(r); }).catch(() => { /* dashboards just stay hidden */ });
        return () => { live = false; };
    }, [uid]);
    useEffect(() => {
        const sync = () => setDark(document.documentElement.classList.contains('dark'));
        window.addEventListener('theme-change', sync);
        return () => window.removeEventListener('theme-change', sync);
    }, []);

    const toggleDark = () => {
        const next = !dark;
        document.documentElement.classList.toggle('dark', next);
        try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
        setDark(next);
        window.dispatchEvent(new Event('theme-change'));
    };
    const signOut = async () => { await supabase.auth.signOut(); window.location.href = '/'; };

    const role = String(user?.role || '').toUpperCase();
    const isCorporate = role === 'SPONSORED' || Boolean(user?.companyName);
    const plan = role === 'PRO' ? 'Pro' : role === 'PREMIUM' ? 'Premium' : isCorporate ? 'Corporate' : role === 'ADMIN' ? 'Admin' : 'Basic';
    const paid = plan !== 'Basic';
    const quizzes = ALL_ITEMS.filter(i => i.kind === 'quiz' && progress[i.id]?.status === 'completed').length;
    const lessons = ALL_ITEMS.filter(i => i.kind !== 'quiz' && progress[i.id]?.status === 'completed').length;
    const lang = LANGS[localStorage.getItem('language') || 'en'] || 'English';
    const tz = localStorage.getItem('timezone');
    const country = user?.country || user?.nationality;
    const features = paid
        ? ['Every Pro course and live cohort', 'Verified certificates', 'Mobile Money billing']
        : ['AI Fundamentals with certificate', 'Free live classes and community'];

    const dashboards: React.ReactElement<any>[] = [];
    if (roles?.is_agent) dashboards.push(<NavRow key="agent" to="/staff" label="Agent portal" sub={isStaff ? 'Register students and track your sign-ups' : 'Your sign-ups and timetable'} icon={<IconTile tone="bg-night text-lime-200">{Ico.handshake()}</IconTile>} />);
    if (roles?.is_supervisor) dashboards.push(<NavRow key="sup" to="/supervision" label="Agent supervision" sub="Your agents, links and weekly numbers" icon={<IconTile tone="bg-brand-soft text-brand">{Ico.users(18)}</IconTile>} />);
    if (roles?.is_admin || role === 'ADMIN') dashboards.push(<ExtRow key="admin" href={adminConsoleUrl()} label="Admin console" sub="Manage the school" icon={<IconTile tone="bg-[#F1EFF6] text-ink">{Ico.shield()}</IconTile>} />);
    if (roles?.is_admin || role === 'ADMIN') dashboards.push(<ExtRow key="desk" href={frontDeskConsoleUrl()} label="Front desk" sub="Walk-ins, calls and who came to HQ" icon={<IconTile tone="bg-mint-soft text-mint">{Ico.check(18)}</IconTile>} />);
    if (roles?.is_instructor) dashboards.push(<ExtRow key="inst" href={instructorConsoleUrl()} label="Instructor console" sub="Your courses and lessons" icon={<IconTile tone="bg-mint-soft text-mint">{Ico.award(18)}</IconTile>} />);
    if (isCorporate) dashboards.push(<NavRow key="corp" to="/corporate" label="Corporate portal" sub={user?.companyName || 'Your team and seats'} icon={<IconTile tone="bg-brand-soft text-brand">{Ico.users(18)}</IconTile>} />);
    if ((roles?.role_count ?? 0) >= 2) dashboards.push(<NavRow key="switch" to="/portal" label="Switch dashboard" sub="Change between your roles" icon={<IconTile tone="bg-[#F1EFF6] text-ink">{Ico.chevron()}</IconTile>} />);

    return (
        <PhonePage>
            <PageTitle>Me</PageTitle>

            <section className="flex items-center gap-3.5">
                <Avatar user={user} size={64} text={22} />
                <div className="flex-1 min-w-0">
                    <p className="m-0 text-[19px] font-extrabold tracking-[-0.01em] truncate">{user?.name || 'Student'}</p>
                    <p className="mt-0.5 mb-0 text-[13px] text-[#6B6680] dark:text-slate-400 truncate">{[user?.email, country].filter(Boolean).join(' · ')}</p>
                </div>
                <Link to="/profile?view=details" className="press h-[34px] px-3.5 rounded-full bg-white dark:bg-night-2 text-ink dark:text-white text-[12px] font-bold inline-flex items-center no-underline">Edit</Link>
            </section>

            <section aria-labelledby="phone-plan" className="relative overflow-hidden rounded-[24px] bg-brand text-white p-5">
                <span aria-hidden="true" className="absolute -right-[50px] -top-[60px] w-[170px] h-[170px] rounded-full bg-brand-mid" />
                <div className="relative flex items-center justify-between gap-3">
                    <div>
                        <p className="m-0 text-[11px] font-bold tracking-[0.12em] uppercase text-[#D9CCFF]">Your plan</p>
                        <h2 id="phone-plan" className="mt-1.5 mb-0 text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em]">{plan}</h2>
                    </div>
                    <span className="px-3 py-1.5 rounded-full bg-white text-brand text-[13px] font-extrabold">{paid ? 'Active' : 'Free'}</span>
                </div>
                <ul className="relative mt-3.5 mb-0 p-0 list-none flex flex-col gap-2 text-[13px] text-[#F1ECFF]">
                    {features.map(f => <li key={f} className="flex items-center gap-2"><span className="text-lime-200">{Ico.check(14)}</span>{f}</li>)}
                </ul>
                {paid ? (
                    <Link to="/plans" className="press relative mt-4 h-[46px] rounded-[14px] bg-white/[0.14] border border-solid border-white/35 text-white text-[14px] font-bold flex items-center justify-center no-underline">Manage plan and payments</Link>
                ) : (
                    <div className="relative mt-4 p-3.5 rounded-[16px] bg-white/[0.12]">
                        <p className="m-0 text-[13px] leading-[1.45] text-white"><strong>Pro · $25/month</strong> adds live cohorts with feedback, every Pro course and verified certificates.</p>
                        <button type="button" onClick={() => navigate('/plans')} className="press mt-3 w-full h-[46px] rounded-[14px] border-0 bg-lime-200 text-ink text-[15px] font-extrabold cursor-pointer">Upgrade to Pro</button>
                    </div>
                )}
            </section>

            <div className="grid grid-cols-3 gap-2.5">
                <Link to="/courses?tab=done" className="press bg-white dark:bg-night-2 rounded-[18px] p-3 text-center text-ink dark:text-white no-underline"><p className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">{lessons}</p><p className="mt-0.5 mb-0 text-[11px] font-semibold text-[#6B6680] dark:text-slate-400">Lessons done</p></Link>
                <Link to="/courses?tab=done" className="press bg-white dark:bg-night-2 rounded-[18px] p-3 text-center text-ink dark:text-white no-underline"><p className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">{quizzes}</p><p className="mt-0.5 mb-0 text-[11px] font-semibold text-[#6B6680] dark:text-slate-400">{quizzes === 1 ? 'Quiz passed' : 'Quizzes passed'}</p></Link>
                <Link to="/courses?tab=certs" className="press bg-white dark:bg-night-2 rounded-[18px] p-3 text-center text-ink dark:text-white no-underline"><p className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">{fc.cert ? 1 : 0}</p><p className="mt-0.5 mb-0 text-[11px] font-semibold text-[#6B6680] dark:text-slate-400">Certificates</p></Link>
            </div>

            <section aria-labelledby="g-learn">
                <h2 id="g-learn" className={GROUP}>My learning</h2>
                <div className={BOX}>
                    <NavRow to="/courses?tab=certs" label="My certificates" sub="Download or share"
                        icon={<IconTile tone="bg-lime-100 text-[#3F4A1C]">{Ico.award(18)}</IconTile>} />
                    <NavRow to="/courses" label="My courses" sub="Pick up where you stopped"
                        icon={<IconTile tone="bg-brand-soft text-brand">{Ico.headphones()}</IconTile>} />
                    <NavRow to="/discussions" label="Discussions" sub="Ask questions and help others"
                        icon={<IconTile tone="bg-mint-soft text-mint">{Ico.users(18)}</IconTile>} />
                    <NavRow to="/events" label="Events" sub="Live classes and meetups"
                        icon={<IconTile tone="bg-[#FCE8DD] text-[#9A3412]">{Ico.calendar(18)}</IconTile>} />
                    <SwitchRow label="Data saver" sub="Videos load only when you tap play" on={prefs.dataSaver} onChange={() => update({ dataSaver: !prefs.dataSaver })}
                        icon={<IconTile tone="bg-lime-100 text-[#3F4A1C]">{Ico.saver()}</IconTile>} />
                    <SwitchRow label="Start lessons in audio only" sub="Uses far less data than video" on={prefs.audioOnly} onChange={() => update({ audioOnly: !prefs.audioOnly })} last
                        icon={<IconTile tone="bg-brand-soft text-brand">{Ico.headphones()}</IconTile>} />
                </div>
            </section>

            <section aria-labelledby="g-acct">
                <h2 id="g-acct" className={GROUP}>My account</h2>
                <div className={BOX}>
                    <NavRow to="/profile?view=details" label="Profile details" />
                    <NavRow to="/plans" label="Plans and payments" value={plan} />
                    <NavRow to="/settings" label="Security and sign-in" />
                    <NavRow to="/notifications" label="Notifications" sub="Class reminders, new lessons and replies" />
                    <NavRow to="/settings" label="Settings" />
                    <NavRow to="/settings" label="Language" value={lang} />
                    <NavRow to="/settings" label="Time zone" value={tz ? tz.replace(/\s*\(.*\)/, '') : 'East Africa Time'} />
                    <div className="flex items-center gap-3 min-h-[56px] px-3.5">
                        <span className="flex-1 text-[15px] font-semibold">Dark mode</span>
                        <Toggle on={dark} onChange={toggleDark} label="Dark mode" />
                    </div>
                </div>
            </section>

            {dashboards.length > 0 && (
                <section aria-labelledby="g-dash">
                    <h2 id="g-dash" className={GROUP}>My dashboards</h2>
                    <div className={BOX}>{dashboards.map((d, i) => React.cloneElement(d, { last: i === dashboards.length - 1 }))}</div>
                </section>
            )}

            <button type="button" onClick={signOut} className="press h-[52px] rounded-[18px] border-0 bg-white dark:bg-night-2 text-[#C2410C] dark:text-[#FF8A75] text-[15px] font-bold cursor-pointer">Sign out</button>
        </PhonePage>
    );
};

export default PhoneMe;
