import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

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
    /** true when the profile role is INSTRUCTOR (older servers do not send it) */
    is_instructor?: boolean;
    staff_slug?: string | null;
    staff_code?: string | null;
    staff_role?: string | null;
    role_count: number;
    default_path: string;
}

const DEFAULT_ROLES: PortalRoles = {
    authenticated: false,
    is_student: true,
    is_agent: false,
    agent_type: null,
    is_supervisor: false,
    is_admin: false,
    is_corporate: false,
    is_instructor: false,
    role_count: 1,
    default_path: '/dashboard',
};

const DASHBOARDS_CACHE_KEY = 'welile_dashboards_v1';
const LAST_DASHBOARD_KEY = 'welile_last_dashboard';
const DASHBOARDS_TTL_MS = 10 * 60 * 1000;

let cachedUid: string | null = null;
let cachedRoles: PortalRoles | null = null;

export function clearPortalRolesCache(): void {
    cachedUid = null;
    cachedRoles = null;
    try { sessionStorage.removeItem(DASHBOARDS_CACHE_KEY); } catch { /* storage blocked: nothing to clear */ }
}

export async function fetchMyPortalRoles(uid?: string | null, force = false): Promise<PortalRoles> {
    if (!uid) {
        clearPortalRolesCache();
        return DEFAULT_ROLES;
    }
    if (!force && cachedUid === uid && cachedRoles) {
        return cachedRoles;
    }
    try {
        const { data, error } = await supabase.rpc('my_portal_roles');
        if (error || !data) {
            return { ...DEFAULT_ROLES, authenticated: true, user_id: uid };
        }
        const parsed = data as PortalRoles;
        cachedUid = uid;
        cachedRoles = parsed;
        return parsed;
    } catch {
        return { ...DEFAULT_ROLES, authenticated: true, user_id: uid };
    }
}

export function adminConsoleUrl(): string {
    if (typeof window === 'undefined') return '/admin/';
    return window.location.hostname.includes('localhost')
        ? `${window.location.protocol}//admin.localhost:4002`
        : `${window.location.origin}/admin/`;
}

/** Where the Front desk dashboard lives: /admin/desk on the main site, /desk on the local admin host. */
export function frontDeskConsoleUrl(): string {
    if (typeof window === 'undefined') return '/admin/desk';
    return window.location.hostname.includes('localhost')
        ? `${window.location.protocol}//admin.localhost:4002/desk`
        : `${window.location.origin}/admin/desk`;
}

/** Where the instructor console lives: /admin/instructor/courses on the main site, /instructor/courses on the local admin host. */
export function instructorConsoleUrl(): string {
    if (typeof window === 'undefined') return '/admin/instructor/courses';
    return window.location.hostname.includes('localhost')
        ? `${window.location.protocol}//admin.localhost:4002/instructor/courses`
        : `${window.location.origin}/admin/instructor/courses`;
}

// ---------------------------------------------------------------------------
// Dashboards a person can switch between (one consistent switcher everywhere)
// ---------------------------------------------------------------------------

export type DashboardId = 'student' | 'agent' | 'supervision' | 'admin' | 'frontdesk' | 'instructor' | 'corporate';

export interface DashboardOption {
    id: DashboardId;
    /** Short name shown on the switch button and in the list, for example "Admin" */
    label: string;
    /** One plain line saying what the dashboard is for */
    hint: string;
    href: string;
    /** true when the dashboard is a different app (the admin console): open it with a full page load */
    external: boolean;
}

/** The dashboards this person holds, in a fixed friendly order. Empty when signed out. */
export function dashboardsFor(roles: PortalRoles | null | undefined): DashboardOption[] {
    if (!roles || roles.authenticated === false) return [];
    const out: DashboardOption[] = [];
    if (roles.is_student) out.push({ id: 'student', label: 'Student', hint: 'Your courses, live classes and certificates', href: '/dashboard', external: false });
    if (roles.is_agent) out.push({
        id: 'agent', label: roles.agent_type === 'field_only' ? 'Field agent' : 'Agent',
        hint: 'Register students and share your link', href: '/staff', external: false,
    });
    if (roles.is_supervisor) out.push({ id: 'supervision', label: 'Supervision', hint: 'Watch agents and their registrations', href: '/supervision', external: false });
    if (roles.is_admin) {
        out.push({ id: 'admin', label: 'Admin', hint: 'People, learning, team and money', href: adminConsoleUrl(), external: true });
        out.push({ id: 'frontdesk', label: 'Front desk', hint: 'Walk-ins, calls, attendance and exams at HQ', href: frontDeskConsoleUrl(), external: true });
    }
    if (roles.is_instructor) out.push({ id: 'instructor', label: 'Instructor', hint: 'Set up courses, cohorts, exams and events', href: instructorConsoleUrl(), external: true });
    if (roles.is_corporate) out.push({ id: 'corporate', label: 'Corporate', hint: 'Team seats, progress and billing', href: '/corporate', external: false });
    return out;
}

/** Which dashboard a page belongs to, from its path. Anything else is the student site. */
export function currentDashboardFromPath(pathname: string): DashboardId {
    const p = (pathname || '/').toLowerCase();
    if (p.startsWith('/staff')) return 'agent';
    if (p.startsWith('/supervision')) return 'supervision';
    if (p.startsWith('/corporate')) return 'corporate';
    if (p.startsWith('/admin/desk') || p.startsWith('/desk')) return 'frontdesk';
    if (p.startsWith('/admin/instructor') || p.startsWith('/instructor')) return 'instructor';
    if (p.startsWith('/admin')) return 'admin';
    return 'student';
}

/** Remember which dashboard was used last, so /portal can offer "Continue as ...". */
export function rememberDashboard(id: DashboardId): void {
    try { localStorage.setItem(LAST_DASHBOARD_KEY, id); } catch { /* storage blocked: the chooser just shows its normal order */ }
}

export function lastDashboard(): DashboardId | null {
    try {
        const v = localStorage.getItem(LAST_DASHBOARD_KEY);
        return v === 'student' || v === 'agent' || v === 'supervision' || v === 'admin' || v === 'frontdesk' || v === 'instructor' || v === 'corporate' ? v : null;
    } catch { return null; }
}

interface DashboardsCache { uid: string; ts: number; roles: PortalRoles }

const readDashboardsCache = (uid: string): PortalRoles | null => {
    try {
        const raw = sessionStorage.getItem(DASHBOARDS_CACHE_KEY);
        if (!raw) return null;
        const c = JSON.parse(raw) as DashboardsCache;
        return c && c.uid === uid && Date.now() - c.ts < DASHBOARDS_TTL_MS && c.roles ? c.roles : null;
    } catch { return null; }
};

const writeDashboardsCache = (uid: string, roles: PortalRoles): void => {
    try { sessionStorage.setItem(DASHBOARDS_CACHE_KEY, JSON.stringify({ uid, ts: Date.now(), roles } satisfies DashboardsCache)); } catch { /* storage blocked */ }
};

/**
 * The dashboards of the signed-in person. The roles are fetched once and kept for 10 minutes in sessionStorage,
 * so opening more pages never calls the database again (egress on the Supabase plan is limited).
 * A failed or partial answer is not cached, so a hiccup cannot hide the switcher for 10 minutes.
 */
export function useMyDashboards(): { dashboards: DashboardOption[]; loading: boolean; roles: PortalRoles | null } {
    const [roles, setRoles] = useState<PortalRoles | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;
        (async () => {
            try {
                const { data } = await supabase.auth.getSession();
                const uid = data.session?.user?.id;
                if (!uid) { if (live) { setRoles(null); setLoading(false); } return; }
                const hit = readDashboardsCache(uid);
                if (hit) { if (live) { setRoles(hit); setLoading(false); } return; }
                const r = await fetchMyPortalRoles(uid);
                // The server answer always carries the email; the offline fallback does not, so it is never cached
                if (r.email) writeDashboardsCache(uid, r);
                if (live) { setRoles(r); setLoading(false); }
            } catch {
                if (live) setLoading(false);
            }
        })();
        return () => { live = false; };
    }, []);

    return { dashboards: dashboardsFor(roles), loading, roles };
}
