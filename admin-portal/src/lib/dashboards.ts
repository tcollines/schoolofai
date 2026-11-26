// The dashboards a person can switch between, for the admin console. Same rules as frontend/src/lib/roles.ts
// (admin-portal is a separate app and cannot import from frontend/).
// Admin, Front desk and Instructor are routes inside this app (navigate within it); the student site, the agent portal,
// supervision and the corporate portal are on the main site (full page load).
import { useEffect, useState } from 'react';
import { supabaseClient } from './supabaseClient';

export type DashboardId = 'student' | 'agent' | 'supervision' | 'admin' | 'frontdesk' | 'instructor' | 'corporate';

export interface DashboardOption {
    id: DashboardId;
    /** Short name shown on the switch button and in the list, for example "Admin" */
    label: string;
    /** One plain line saying what the dashboard is for */
    hint: string;
    /** In-app path (relative to the admin base) when external is false, otherwise a full URL on the main site */
    href: string;
    /** true when the dashboard lives on the main site: open it with a full page load */
    external: boolean;
}

export interface PortalRoles {
    authenticated: boolean;
    user_id?: string;
    email?: string;
    name?: string;
    is_student: boolean;
    is_agent: boolean;
    agent_type: 'student_agent' | 'field_only' | null;
    is_supervisor: boolean;
    is_admin: boolean;
    is_corporate: boolean;
    is_instructor?: boolean;
    role_count: number;
    default_path: string;
}

const DASHBOARDS_CACHE_KEY = 'welile_dashboards_v1';
const LAST_DASHBOARD_KEY = 'welile_last_dashboard';
const DASHBOARDS_TTL_MS = 10 * 60 * 1000;

/** The main site (student site, agent portal, supervision, corporate). From admin.* hosts, the same host without the admin prefix. */
export function mainSiteUrl(path: string): string {
    if (typeof window === 'undefined') return path;
    const { protocol, host, origin, hostname } = window.location;
    return /^(admin|instructors?)\./.test(hostname)
        ? `${protocol}//${host.replace(/^(admin|instructors?)\./, '')}${path}`
        : `${origin}${path}`;
}

/** The dashboards this person holds, in a fixed friendly order. Empty when signed out. */
export function dashboardsFor(roles: PortalRoles | null | undefined): DashboardOption[] {
    if (!roles || roles.authenticated === false) return [];
    const out: DashboardOption[] = [];
    if (roles.is_student) out.push({ id: 'student', label: 'Student', hint: 'Your courses, live classes and certificates', href: mainSiteUrl('/dashboard'), external: true });
    if (roles.is_agent) out.push({
        id: 'agent', label: roles.agent_type === 'field_only' ? 'Field agent' : 'Agent',
        hint: 'Register students and share your link', href: mainSiteUrl('/staff'), external: true,
    });
    if (roles.is_supervisor) out.push({ id: 'supervision', label: 'Supervision', hint: 'Watch agents and their registrations', href: mainSiteUrl('/supervision'), external: true });
    if (roles.is_admin) {
        out.push({ id: 'admin', label: 'Admin', hint: 'People, learning, team and money', href: '/today', external: false });
        out.push({ id: 'frontdesk', label: 'Front desk', hint: 'Walk-ins, calls, attendance and exams at HQ', href: '/desk', external: false });
    }
    if (roles.is_instructor) out.push({ id: 'instructor', label: 'Instructor', hint: 'Set up courses, cohorts, exams and events', href: '/instructor/courses', external: false });
    if (roles.is_corporate) out.push({ id: 'corporate', label: 'Corporate', hint: 'Team seats, progress and billing', href: mainSiteUrl('/corporate'), external: true });
    return out;
}

/** Which dashboard a path inside the admin app belongs to (paths are relative to the admin base). */
export function currentDashboardFromPath(pathname: string): DashboardId {
    const p = (pathname || '/').toLowerCase();
    if (p.startsWith('/desk')) return 'frontdesk';
    if (p.startsWith('/instructor')) return 'instructor';
    return 'admin';
}

/** Remember which dashboard was used last, so the chooser page can offer "Continue as ...". Same key as the main site. */
export function rememberDashboard(id: DashboardId): void {
    try { localStorage.setItem(LAST_DASHBOARD_KEY, id); } catch { /* storage blocked: nothing to remember */ }
}

interface DashboardsCache { uid: string; ts: number; roles: PortalRoles }

const readCache = (uid: string): PortalRoles | null => {
    try {
        const raw = sessionStorage.getItem(DASHBOARDS_CACHE_KEY);
        if (!raw) return null;
        const c = JSON.parse(raw) as DashboardsCache;
        return c && c.uid === uid && Date.now() - c.ts < DASHBOARDS_TTL_MS && c.roles ? c.roles : null;
    } catch { return null; }
};

const writeCache = (uid: string, roles: PortalRoles): void => {
    try { sessionStorage.setItem(DASHBOARDS_CACHE_KEY, JSON.stringify({ uid, ts: Date.now(), roles } as DashboardsCache)); } catch { /* storage blocked */ }
};

/** Forget the cached roles (call when signing out). */
export function clearDashboardsCache(): void {
    try { sessionStorage.removeItem(DASHBOARDS_CACHE_KEY); } catch { /* nothing to clear */ }
}

/**
 * The dashboards of the signed-in person. The roles are fetched once and kept for 10 minutes in sessionStorage,
 * so opening more pages never calls the database again (egress on the Supabase plan is limited).
 * A failed answer is not cached, so a hiccup cannot hide the switcher for 10 minutes.
 */
export function useMyDashboards(): { dashboards: DashboardOption[]; loading: boolean; roles: PortalRoles | null } {
    const [roles, setRoles] = useState<PortalRoles | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;
        (async () => {
            try {
                const { data } = await supabaseClient.auth.getSession();
                const uid = data.session?.user?.id;
                if (!uid) { if (live) { setRoles(null); setLoading(false); } return; }
                const hit = readCache(uid);
                if (hit) { if (live) { setRoles(hit); setLoading(false); } return; }
                const { data: r, error } = await supabaseClient.rpc('my_portal_roles');
                if (!error && r && (r as PortalRoles).email) {
                    writeCache(uid, r as PortalRoles);
                    if (live) setRoles(r as PortalRoles);
                }
                if (live) setLoading(false);
            } catch {
                if (live) setLoading(false);
            }
        })();
        return () => { live = false; };
    }, []);

    return { dashboards: dashboardsFor(roles), loading, roles };
}
