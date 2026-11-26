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

let cachedUid: string | null = null;
let cachedRoles: PortalRoles | null = null;

export function clearPortalRolesCache(): void {
    cachedUid = null;
    cachedRoles = null;
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
