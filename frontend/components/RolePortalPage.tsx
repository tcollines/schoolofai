import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, Building2, ClipboardCheck, ConciergeBell, GraduationCap, Handshake,
    Loader2, LogOut, PencilRuler, Shield, Sparkles
} from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';
import { adminConsoleUrl, clearPortalRolesCache, DashboardId, fetchMyPortalRoles, frontDeskConsoleUrl, instructorConsoleUrl, lastDashboard, PortalRoles, rememberDashboard } from '../src/lib/roles';
import { Logo, ThemeButton } from './learn/learnUi';

interface RoleCard {
    id: string;
    title: string;
    badge: string;
    description: string;
    icon: React.ElementType;
    accent: string;
    badgeTone: string;
    onOpen: () => void;
}

/**
 * Clean workspace launcher for users who hold multiple roles (Student, Agent, Agent Supervision, Admin, Instructor, Corporate).
 * Single-role users are automatically redirected straight to their own portal with zero extra clicks.
 */
const RolePortalPage: React.FC<{ session: any }> = ({ session }) => {
    const navigate = useNavigate();
    const uid = session?.user?.id as string | undefined;
    const [roles, setRoles] = useState<PortalRoles | null>(null);

    useEffect(() => {
        document.title = 'Choose your dashboard | Welile School of AI';
        if (!uid) {
            navigate('/login', { replace: true });
            return;
        }
        let alive = true;
        fetchMyPortalRoles(uid, true).then(r => {
            if (!alive) return;
            // Single-role users bypass this screen automatically
            if (r.role_count <= 1) {
                if (r.default_path === '/admin/') {
                    window.location.href = adminConsoleUrl();
                } else {
                    navigate(r.default_path || '/dashboard', { replace: true });
                }
                return;
            }
            setRoles(r);
        });
        return () => { alive = false; };
    }, [uid, navigate]);

    const handleSignOut = async () => {
        clearPortalRolesCache();
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    if (!roles) {
        return (
            <div className="min-h-screen bg-[#faf8f5] dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-violet-700" size={32} />
                <p className="text-sm text-stone-500 dark:text-slate-400">Loading your dashboards...</p>
            </div>
        );
    }

    const cards: RoleCard[] = [];

    if (roles.is_student) {
        cards.push({
            id: 'student',
            title: 'Student Portal',
            badge: 'Learning',
            description: 'Access your courses, continue AI Fundamentals, join live classes, and download certificates.',
            icon: GraduationCap,
            accent: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
            badgeTone: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
            onOpen: () => navigate('/dashboard'),
        });
    }

    if (roles.is_agent) {
        cards.push({
            id: 'agent',
            title: roles.agent_type === 'field_only' ? 'Field Agent Portal' : 'Agent Portal',
            badge: roles.staff_code || 'Field Ops',
            description: 'Register new students in the field, share your personal sign-up link, and track your registrations.',
            icon: Handshake,
            accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
            badgeTone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
            onOpen: () => navigate('/staff'),
        });
    }

    if (roles.is_supervisor) {
        cards.push({
            id: 'supervision',
            title: 'Agent Supervision',
            badge: 'Supervisor',
            description: 'Monitor all field officers, review daily registration summaries, inspect student lists, and onboard field-only agents.',
            icon: ClipboardCheck,
            accent: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
            badgeTone: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
            onOpen: () => navigate('/supervision'),
        });
    }

    if (roles.is_admin) {
        cards.push({
            id: 'admin',
            title: 'Admin Console',
            badge: 'Administrator',
            description: 'Full platform oversight — enrollments, free course pipeline, agent monitoring, live classes, traffic & analytics.',
            icon: Shield,
            accent: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
            badgeTone: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
            onOpen: () => { window.location.href = adminConsoleUrl(); },
        });
        cards.push({
            id: 'frontdesk',
            title: 'Front desk',
            badge: 'HQ',
            description: 'Register walk-ins, make calls and mark who came to HQ.',
            icon: ConciergeBell,
            accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
            badgeTone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
            onOpen: () => { window.location.href = frontDeskConsoleUrl(); },
        });
    }

    if (roles.is_instructor) {
        cards.push({
            id: 'instructor',
            title: 'Instructor console',
            badge: 'Instructor',
            description: 'Set up courses, cohorts, exams and events.',
            icon: PencilRuler,
            accent: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
            badgeTone: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
            onOpen: () => { window.location.href = instructorConsoleUrl(); },
        });
    }

    if (roles.is_corporate) {
        cards.push({
            id: 'corporate',
            title: 'Corporate Portal',
            badge: 'Organisation',
            description: 'Manage team seats, track employee learning progress, and view organisation billing.',
            icon: Building2,
            accent: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
            badgeTone: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
            onOpen: () => navigate('/corporate'),
        });
    }

    const firstName = (roles.name || 'there').split(/\s+/)[0];

    // The dashboard used last goes first, with a one-tap "Continue as" button on top
    const openCard = (c: RoleCard) => { rememberDashboard(c.id as DashboardId); c.onOpen(); };
    const lastId = lastDashboard();
    const lastCard = cards.find(c => c.id === lastId);
    const orderedCards = lastCard ? [lastCard, ...cards.filter(c => c !== lastCard)] : cards;

    return (
        <div className="min-h-screen bg-[#faf8f5] dark:bg-slate-950 text-[#1c1917] dark:text-slate-100 flex flex-col">
            <header className="border-b border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
                    <Logo className="h-9" />
                    <div className="flex items-center gap-2">
                        <ThemeButton />
                        <button
                            onClick={handleSignOut}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Sign out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-14 flex flex-col justify-center">
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                        <Sparkles size={13} /> Switch dashboard
                    </span>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold mt-3 tracking-tight">
                        Welcome back, {firstName}
                    </h1>
                    <p className="mt-2 text-base text-stone-600 dark:text-slate-400">
                        Pick where you want to go. You can switch any time.
                    </p>
                </div>

                {lastCard && (
                    <button
                        type="button"
                        onClick={() => openCard(lastCard)}
                        className="press mt-5 w-full sm:w-auto min-h-[56px] px-6 rounded-2xl bg-violet-700 hover:bg-violet-800 text-white text-base font-extrabold inline-flex items-center justify-center gap-3 border-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                    >
                        <lastCard.icon size={20} />
                        Continue as {lastCard.title}
                        <ArrowRight size={18} />
                    </button>
                )}

                <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                    {orderedCards.map(c => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => openCard(c)}
                            className="group text-left bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 p-4 sm:p-6 min-h-[88px] shadow-sm hover:shadow-lg hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-200 flex flex-row sm:flex-col items-center sm:items-stretch sm:justify-between gap-4 sm:gap-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                        >
                            <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${c.accent}`}>
                                <c.icon size={26} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <h2 className="text-lg sm:text-xl font-bold text-[#1c1917] dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                                        {c.title}
                                    </h2>
                                    <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-full ${c.badgeTone}`}>
                                        {c.badge}
                                    </span>
                                </div>
                                <p className="m-0 text-sm leading-relaxed text-stone-600 dark:text-slate-400">
                                    {c.description}
                                </p>
                            </div>
                            <div className="shrink-0 sm:flex sm:items-center sm:justify-between sm:pt-3 sm:border-t sm:border-stone-100 sm:dark:border-slate-800 text-sm font-semibold text-violet-700 dark:text-violet-300">
                                <span className="hidden sm:inline">Open {c.title}</span>
                                <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </button>
                    ))}
                </div>

                <p className="mt-8 text-xs text-stone-500 dark:text-slate-500">
                    Signed in as <span className="font-medium text-stone-700 dark:text-slate-300">{roles.email}</span>
                </p>
            </main>
        </div>
    );
};

export default RolePortalPage;
