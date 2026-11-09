import { supabase } from './supabaseClient';

export const OUTREACH_QUEUE_KEY = 'outreach_pending_registrations';
export const OUTREACH_LOCAL_CACHE_KEY = 'outreach_registrations_local_cache';
export const OUTREACH_CAMPAIGNS_CACHE_KEY = 'welile_outreach_campaigns_v1';
export const OUTREACH_STAFF_CACHE_KEY = 'welile_outreach_staff_v1';
export const ACTIVE_STAFF_SESSION_KEY = 'welile_active_registrar_staff_v1';
export const DEVICE_AUDIT_ID_KEY = 'welile_device_audit_id_v1';

// ============================================================================
// 1. OFFICIAL COURSES & MONTHLY PRICING CATALOG
// ============================================================================
export interface OfficialCoursePricing {
    title: string;
    usdPerMonth: number;
    ugxPerMonth: number;
    ugxWeekly: number;
    displayFee: string;
    shortBadge: string;
    shortDescription?: string;
}

export const OFFICIAL_COURSE_CATALOG: OfficialCoursePricing[] = [
    {
        title: 'Fundamentals of AI',
        usdPerMonth: 0,
        ugxPerMonth: 0,
        ugxWeekly: 0,
        displayFee: 'Free (UGX 0)',
        shortBadge: 'Free (0 UGX)',
        shortDescription: 'Core AI foundations, prompting & everyday productivity workflows — 100% Free'
    },
    {
        title: 'Advanced Vibe Coding',
        usdPerMonth: 25,
        ugxPerMonth: 100000,
        ugxWeekly: 25000,
        displayFee: '$25 | 100,000 UGX per month',
        shortBadge: '$25 / 100,000 UGX mo',
        shortDescription: 'Build full-stack web & mobile apps rapidly with AI coding assistants'
    },
    {
        title: 'Document with AI',
        usdPerMonth: 25,
        ugxPerMonth: 100000,
        ugxWeekly: 25000,
        displayFee: '$25 | 100,000 UGX per month',
        shortBadge: '$25 / 100,000 UGX mo',
        shortDescription: 'Master AI-powered research, reports, proposals & business documentation'
    },
    {
        title: 'Agentic AI',
        usdPerMonth: 50,
        ugxPerMonth: 200000,
        ugxWeekly: 50000,
        displayFee: '$50 | 200,000 UGX per month',
        shortBadge: '$50 / 200,000 UGX mo',
        shortDescription: 'Design autonomous AI agents, multi-step workflows & tool integrations'
    },
    {
        title: 'AI Security and Safety',
        usdPerMonth: 35,
        ugxPerMonth: 150000,
        ugxWeekly: 37500,
        displayFee: '$35 | 150,000 UGX per month',
        shortBadge: '$35 / 150,000 UGX mo',
        shortDescription: 'Secure AI deployments, governance, red-teaming & data privacy'
    }
];

export function getCoursePricing(courseTitle: string): OfficialCoursePricing {
    const clean = (courseTitle || '').trim().toLowerCase();
    const matched = OFFICIAL_COURSE_CATALOG.find(
        c => c.title.toLowerCase() === clean || clean.includes(c.title.toLowerCase())
    );
    if (matched) return matched;
    return {
        title: courseTitle || 'Advanced Vibe Coding',
        usdPerMonth: 25,
        ugxPerMonth: 100000,
        ugxWeekly: 25000,
        displayFee: '$25 | 100,000 UGX per month',
        shortBadge: '$25 / 100,000 UGX mo'
    };
}

export function formatUgx(amount: number | string | null | undefined): string {
    const num = Number(String(amount ?? 0).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return '0';
    return Math.max(0, Math.round(num)).toLocaleString('en-US');
}

export function sanitizeMoneyInput(raw: string, maxUgx = 20000000): number {
    const digitsOnly = String(raw || '').replace(/[^0-9]/g, '');
    if (!digitsOnly) return 0;
    const parsed = parseInt(digitsOnly, 10);
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.min(parsed, maxUgx);
}

export function formatEquivalentUsd(ugxAmount: number, courseTitle?: string): string {
    const num = Number(ugxAmount) || 0;
    if (num <= 0) return '$0';
    if (courseTitle) {
        const pricing = getCoursePricing(courseTitle);
        if (num === pricing.ugxPerMonth) {
            return `$${pricing.usdPerMonth}`;
        }
    }
    if (num === 100000) return '$25';
    if (num === 150000) return '$35';
    if (num === 200000) return '$50';
    const approx = Math.round((num / 4000) * 10) / 10;
    return `$${approx}`;
}

// ============================================================================
// 2. CLEAN PHONE NUMBER SANITIZATION & VALIDATION (UGANDA & INTL)
// ============================================================================
export interface PhoneValidationResult {
    valid: boolean;
    normalized: string;
    digitCount: number;
    maxDigits: number;
    formatLabel: string;
    message: string;
}

/**
 * Enforces strict digit caps while typing:
 * - Local UG number starting with '0': strictly max 10 digits (e.g. 0772123456)
 * - Intl UG number starting with '+256': strictly max 12 digits (+256772123456)
 * - Intl UG number starting with '256': strictly max 12 digits (256772123456)
 * - Number starting with '7' (missing leading 0): max 9 digits (772123456)
 */
export function sanitizePhoneInput(raw: string): string {
    const trimmed = (raw || '').trimStart();
    const hasLeadingPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/[^0-9]/g, '');

    if (!digits) {
        return hasLeadingPlus ? '+' : '';
    }

    if (hasLeadingPlus) {
        if (digits.startsWith('256')) {
            // +256 + 9 subscriber digits = 12 digits total
            return '+' + digits.slice(0, 12);
        }
        // Standard E.164 max 15 digits
        return '+' + digits.slice(0, 15);
    }

    if (digits.startsWith('0')) {
        // Local Uganda format 07XXXXXXXX = strictly 10 digits maximum
        return digits.slice(0, 10);
    }

    if (digits.startsWith('256')) {
        // 2567XXXXXXXX = strictly 12 digits maximum
        return digits.slice(0, 12);
    }

    if (digits.startsWith('7')) {
        // 7XXXXXXXX = 9 digits (will normalize to 07XXXXXXXX)
        return digits.slice(0, 9);
    }

    return digits.slice(0, 10);
}

export function validateCleanPhone(raw: string): PhoneValidationResult {
    const cleaned = sanitizePhoneInput(raw);
    const digits = cleaned.replace(/[^0-9]/g, '');
    const hasPlus = cleaned.startsWith('+');

    if (!digits) {
        return {
            valid: false,
            normalized: '',
            digitCount: 0,
            maxDigits: 10,
            formatLabel: '0/10 digits',
            message: 'Phone number is required (e.g. 0772123456).'
        };
    }

    // Case 1: Local Uganda format starting with 0 (e.g. 0772123456)
    if (!hasPlus && digits.startsWith('0')) {
        const maxDigits = 10;
        const validPrefix = /^0(7[0-9]|39|20)/.test(digits);
        const isExact = digits.length === 10;
        return {
            valid: validPrefix && isExact,
            normalized: digits,
            digitCount: digits.length,
            maxDigits,
            formatLabel: `${digits.length}/${maxDigits} digits`,
            message: !validPrefix && digits.length >= 2
                ? 'Must start with a valid Uganda prefix (e.g. 070, 074, 075, 076, 077, 078).'
                : !isExact
                ? `Enter all 10 digits (${digits.length}/10 entered).`
                : 'Valid 10-digit phone number ✓'
        };
    }

    // Case 2: User started with 7 (9 digits, e.g. 772123456)
    if (!hasPlus && digits.startsWith('7')) {
        const maxDigits = 9;
        const isExact = digits.length === 9;
        const normalized = isExact ? `0${digits}` : digits;
        return {
            valid: isExact,
            normalized,
            digitCount: digits.length,
            maxDigits,
            formatLabel: `${digits.length}/${maxDigits} digits`,
            message: isExact
                ? `Valid phone number (normalized to ${normalized}) ✓`
                : `Enter 9 digits after 7 or start with 07 (${digits.length}/9 entered).`
        };
    }

    // Case 3: +256 or 256 format (12 digits total: 256 + 9 digits)
    if (digits.startsWith('256')) {
        const maxDigits = 12;
        const validSub = /^256(7[0-9]|39|20)/.test(digits);
        const isExact = digits.length === 12;
        return {
            valid: validSub && isExact,
            normalized: `+${digits}`,
            digitCount: digits.length,
            maxDigits,
            formatLabel: `${digits.length}/${maxDigits} digits`,
            message: !validSub && digits.length >= 4
                ? 'Must be +256 followed by 7X XXX XXXX.'
                : !isExact
                ? `Complete all 12 digits for +256 (${digits.length}/12 entered).`
                : 'Valid +256 Uganda phone number ✓'
        };
    }

    // Case 4: Other international number with +
    if (hasPlus) {
        const isOk = digits.length >= 10 && digits.length <= 15;
        return {
            valid: isOk,
            normalized: `+${digits}`,
            digitCount: digits.length,
            maxDigits: 15,
            formatLabel: `${digits.length} digits`,
            message: isOk ? 'Valid international number ✓' : 'Enter between 10 and 15 digits.'
        };
    }

    return {
        valid: false,
        normalized: cleaned,
        digitCount: digits.length,
        maxDigits: 10,
        formatLabel: `${digits.length}/10 digits`,
        message: 'Start phone number with 07 (10 digits) or +256 (12 digits).'
    };
}

export function cleanPersonName(raw: string): string {
    return (raw || '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

// ============================================================================
// 3. STAFF / MOBILIZER AUDIT & PROVENANCE SYSTEM
// ============================================================================
export interface OutreachStaffMember {
    id: string;
    name: string;
    staffCode: string;
    role: string;
    phone?: string;
    isActive: boolean;
}

export const DEFAULT_OUTREACH_STAFF: OutreachStaffMember[] = [
    {
        id: 'stf-coo-timothy',
        name: 'Timothy Christian Waniaye',
        staffCode: 'WSI-COO-001',
        role: 'COO',
        phone: '0772000000',
        isActive: true
    },
    {
        id: 'stf-001',
        name: 'Collines T.',
        staffCode: 'WSI-STF-001',
        role: 'Outreach Team Lead',
        phone: '0772000001',
        isActive: true
    },
    {
        id: 'stf-002',
        name: 'Nkumba Mobilizer 1 (Booth Desk A)',
        staffCode: 'WSI-STF-002',
        role: 'Outreach Mobilizer',
        phone: '0772000002',
        isActive: true
    },
    {
        id: 'stf-003',
        name: 'Nkumba Mobilizer 2 (Booth Desk B)',
        staffCode: 'WSI-STF-003',
        role: 'Outreach Mobilizer',
        phone: '0772000003',
        isActive: true
    },
    {
        id: 'stf-004',
        name: 'Katabi Admissions Office',
        staffCode: 'WSI-STF-004',
        role: 'Admissions Officer',
        phone: '0700000004',
        isActive: true
    },
    {
        id: 'stf-005',
        name: 'Welile Campus Ambassador',
        staffCode: 'WSI-STF-005',
        role: 'Campus Mobilizer',
        phone: '0750000005',
        isActive: true
    },
    {
        id: 'stf-self',
        name: 'Self-Registered (Student Direct)',
        staffCode: 'SELF-WEB',
        role: 'Student Self-Service',
        isActive: true
    }
];

export function ensureRequiredStaffPresent(list: OutreachStaffMember[]): OutreachStaffMember[] {
    const map = new Map<string, OutreachStaffMember>();
    // Always guarantee Timothy Christian Waniaye (COO) is at the top of the mobilization roster
    const timothy = DEFAULT_OUTREACH_STAFF[0];
    map.set(timothy.name.toLowerCase(), timothy);

    for (const item of list || []) {
        if (item && item.name) {
            const key = item.name.trim().toLowerCase();
            if (key === timothy.name.toLowerCase()) {
                map.set(key, { ...item, role: item.role || 'COO', staffCode: item.staffCode || 'WSI-COO-001' });
            } else {
                map.set(key, item);
            }
        }
    }

    for (const def of DEFAULT_OUTREACH_STAFF) {
        const key = def.name.toLowerCase();
        if (!map.has(key)) {
            map.set(key, def);
        }
    }
    return Array.from(map.values());
}

export interface AuditLogEntry {
    timestamp: string;
    actor: string;
    role: string;
    action: string;
    device_id: string;
    details?: string;
}

export function getOrCreateDeviceAuditInfo(): { deviceId: string; deviceSummary: string } {
    let deviceId = 'DEV-LOCAL';
    try {
        const existing = localStorage.getItem(DEVICE_AUDIT_ID_KEY);
        if (existing) {
            deviceId = existing;
        } else {
            const rand = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Date.now().toString(36).slice(-4).toUpperCase();
            deviceId = `DEV-${rand}`;
            localStorage.setItem(DEVICE_AUDIT_ID_KEY, deviceId);
        }
    } catch {
        // ignore storage errors
    }

    let deviceSummary = 'Web Browser';
    if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent || '';
        const os = /iPhone|iPad|iPod/i.test(ua)
            ? 'iOS (iPhone/iPad)'
            : /Android/i.test(ua)
            ? 'Android Phone'
            : /Mac/i.test(ua)
            ? 'MacOS'
            : /Win/i.test(ua)
            ? 'Windows'
            : 'Linux/Other';
        const browser = /CriOS|Chrome/i.test(ua) && !/Edg/i.test(ua)
            ? 'Chrome'
            : /Safari/i.test(ua) && !/Chrome/i.test(ua)
            ? 'Safari'
            : /Firefox/i.test(ua)
            ? 'Firefox'
            : /Edg/i.test(ua)
            ? 'Edge'
            : 'Browser';
        deviceSummary = `${os} • ${browser}`;
    }

    return { deviceId, deviceSummary };
}

export async function fetchOutreachStaff(): Promise<OutreachStaffMember[]> {
    try {
        // 1. Try dedicated outreach_staff table first
        const { data: staffRows, error: staffErr } = await supabase
            .from('outreach_staff')
            .select('*')
            .order('created_at', { ascending: true });

        if (!staffErr && staffRows && staffRows.length > 0) {
            const mapped: OutreachStaffMember[] = ensureRequiredStaffPresent(
                staffRows.map((s: any) => ({
                    id: String(s.id),
                    name: s.name,
                    staffCode: s.staff_code || 'WSI-STF',
                    role: s.role || 'Outreach Mobilizer',
                    phone: s.phone || undefined,
                    isActive: s.is_active !== false
                }))
            );
            localStorage.setItem(OUTREACH_STAFF_CACHE_KEY, JSON.stringify(mapped));
            return mapped;
        }

        // 2. Check live Supabase system config row in public.courses
        const { data: configRows } = await supabase
            .from('courses')
            .select('id, sections')
            .eq('category', '__OUTREACH_CONFIG__')
            .limit(1);

        if (configRows && configRows.length > 0 && configRows[0].sections?.staff) {
            const parsed = configRows[0].sections.staff;
            if (Array.isArray(parsed) && parsed.length > 0) {
                const merged = ensureRequiredStaffPresent(parsed);
                localStorage.setItem(OUTREACH_STAFF_CACHE_KEY, JSON.stringify(merged));
                return merged;
            }
        }
    } catch {
        // fallback to cache
    }

    try {
        const cached = localStorage.getItem(OUTREACH_STAFF_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const merged = ensureRequiredStaffPresent(parsed);
                localStorage.setItem(OUTREACH_STAFF_CACHE_KEY, JSON.stringify(merged));
                return merged;
            }
        }
    } catch {
        // ignore
    }

    return DEFAULT_OUTREACH_STAFF;
}

export async function saveOutreachStaff(staffList: OutreachStaffMember[]): Promise<void> {
    const mergedList = ensureRequiredStaffPresent(staffList);
    try {
        localStorage.setItem(OUTREACH_STAFF_CACHE_KEY, JSON.stringify(mergedList));
    } catch {
        // ignore
    }

    try {
        const { data: existingConfig } = await supabase
            .from('courses')
            .select('id, sections')
            .eq('category', '__OUTREACH_CONFIG__')
            .limit(1);

        if (existingConfig && existingConfig.length > 0) {
            const currentSections = existingConfig[0].sections || {};
            await supabase
                .from('courses')
                .update({
                    sections: {
                        ...currentSections,
                        staff: mergedList
                    }
                })
                .eq('id', existingConfig[0].id);
        } else {
            await supabase.from('courses').insert([{
                title: '__OUTREACH_SYSTEM_CONFIG__',
                category: '__OUTREACH_CONFIG__',
                instructor: 'Welile System',
                duration: 'System',
                description: 'Outreach Campaigns and Staff Roster Configuration',
                price: 0,
                status: 'SYSTEM_CONFIG',
                is_draft: true,
                is_verified: false,
                platform: 'Welile',
                accessTier: 'FREE',
                sections: {
                    campaigns: DEFAULT_OUTREACH_CAMPAIGNS,
                    staff: mergedList
                }
            }]);
        }
    } catch (e) {
        console.warn('Could not persist outreach staff roster to Supabase:', e);
    }
}

export async function ensureOfficialCoursesSeeded(): Promise<void> {
    try {
        const { data: existing } = await supabase
            .from('courses')
            .select('id, title, category');
        const existingTitles = new Set(
            (existing || [])
                .filter((c: any) => !String(c.category || '').startsWith('__OUTREACH_'))
                .map((c: any) => String(c.title || '').trim().toLowerCase())
        );

        for (const course of OFFICIAL_COURSE_CATALOG) {
            if (!existingTitles.has(course.title.toLowerCase())) {
                await supabase.from('courses').insert([{
                    title: course.title,
                    description: `Official Welile School of AI Programme — ${course.displayFee}. Practical hands-on AI training at Katabi, Entebbe & Online.`,
                    category: 'Artificial Intelligence',
                    duration: '8 Weeks',
                    price: course.usdPerMonth,
                    instructor: 'Welile AI Faculty',
                    platform: 'Welile',
                    accessTier: course.usdPerMonth === 0 ? 'FREE' : 'PAID',
                    status: 'Published',
                    is_draft: false,
                    is_verified: true
                }]);
            }
        }
    } catch {
        // non-blocking
    }
}

// ============================================================================
// 4. OUTREACH CAMPAIGNS & REGISTRATION PAYLOAD
// ============================================================================
export interface OutreachCampaign {
    id: string;
    name: string;
    date: string;
    location: string;
    category: 'OUTREACH' | 'GENERAL';
    isActive: boolean;
    isDefault?: boolean;
}

export const DEFAULT_OUTREACH_CAMPAIGNS: OutreachCampaign[] = [
    {
        id: 'nkumba-2026-11-06',
        name: 'Nkumba University Outreach (Fri, 6th Nov 2026)',
        date: '2026-11-06',
        location: 'Nkumba University, Entebbe',
        category: 'OUTREACH',
        isActive: true,
        isDefault: true
    },
    {
        id: 'general-website',
        name: 'General / Website Registration',
        date: '2026-11-05',
        location: 'Online / Direct Portal',
        category: 'GENERAL',
        isActive: true,
        isDefault: false
    },
    {
        id: 'katabi-walkin',
        name: 'Katabi Campus Walk-in (Entebbe)',
        date: '2026-11-05',
        location: 'Katabi, Entebbe Campus',
        category: 'GENERAL',
        isActive: true,
        isDefault: false
    },
    {
        id: 'makerere-nov-2026',
        name: 'Makerere Career Fair Nov 2026',
        date: '2026-11-14',
        location: 'Makerere University, Kampala',
        category: 'OUTREACH',
        isActive: true,
        isDefault: false
    }
];

export interface OutreachRegistrationPayload {
    id?: string;
    created_at?: string;
    registration_date?: string;
    student_reg_no?: string;

    // 1. STUDENT INFORMATION
    full_name: string;
    email?: string | null;
    phone: string;
    class_level_year?: string | null;
    age_range?: string | null;
    guardian_name?: string | null;
    guardian_phone?: string | null;
    location?: string | null;

    // 2. COURSE & PROGRAMME INFORMATION
    course_interest: string;
    course_fee_usd?: number;
    course_fee_display?: string;
    level?: string | null;
    mode_of_study_text?: string | null;
    mode_preference?: string | null;
    expected_start_date?: string | null;
    expected_completion_date?: string | null;

    // 3. STUDY SCHEDULE
    preferred_study_days?: string[];
    preferred_time_slot?: string | null;
    study_hours_per_session?: string | null;
    sessions_per_week?: string | null;
    alternative_study_time?: string | null;

    // 4. FEES & PAYMENT AGREEMENT
    total_course_fee?: number;
    registration_fee?: string;
    amount_paid?: number;
    outstanding_balance?: number;
    payment_plan?: string;
    agreed_payment_amount?: number;
    next_payment_date?: string | null;
    payment_due_date?: string | null;
    payment_method?: string;
    payment_reference?: string | null;

    // 5, 6, 7. STUDENT COMMITMENT, DECLARATION & GUARDIAN CONSENT
    commitments_accepted?: boolean;
    commitments_list?: string[];
    student_signature?: string | null;
    student_declaration_date?: string | null;
    guardian_signature?: string | null;
    guardian_consent_date?: string | null;
    consent_contact: boolean;

    // ATTRIBUTION & STAFF AUDIT TRAIL
    how_heard?: string | null;
    outreach_event?: string | null;
    registered_by_staff?: string | null;
    registered_by_staff_id?: string | null;
    registered_by_role?: string | null;
    registration_mode?: 'Staff Assisted (Booth/Field)' | 'Student Self-Registration' | string | null;
    device_audit_id?: string | null;
    device_info?: string | null;
    audit_trail?: AuditLogEntry[];

    // 8. SCHOOL / ADMINISTRATION USE ONLY
    status?: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'NOT_INTERESTED';
    approved_by?: string | null;
    approver_position?: string | null;
    assigned_instructor?: string | null;
    confirmed_schedule?: string | null;
    admin_payment_status?: 'Fully Paid' | 'Partially Paid' | 'Payment Plan' | 'Pending' | string;
    admin_signature_date?: string | null;
    admin_remarks?: string | null;
    admin_notes?: string | null;
    converted_profile_id?: string | null;
    submitted_from?: 'web' | 'offline-sync';
}

export function generateStudentRegNo(seqHint?: number): string {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const num = seqHint
        ? String(seqHint).padStart(3, '0')
        : String(Math.floor(100 + Math.random() * 900));
    return `WSI/${mm}/${yy}/${num}`;
}

export async function fetchOutreachCampaigns(): Promise<OutreachCampaign[]> {
    try {
        const { data: campData, error: campErr } = await supabase
            .from('outreach_campaigns')
            .select('*')
            .order('created_at', { ascending: true });

        if (!campErr && campData && campData.length > 0) {
            const mapped: OutreachCampaign[] = campData.map((c: any) => ({
                id: String(c.id),
                name: c.name,
                date: c.event_date || '2026-11-06',
                location: c.location || 'Entebbe / Kampala',
                category: (c.name || '').toLowerCase().includes('general') || (c.name || '').toLowerCase().includes('walk-in')
                    ? 'GENERAL'
                    : 'OUTREACH',
                isActive: c.is_active !== false,
                isDefault: Boolean(c.is_default)
            }));
            localStorage.setItem(OUTREACH_CAMPAIGNS_CACHE_KEY, JSON.stringify(mapped));
            return mapped;
        }

        // Check live Supabase system config row in public.courses
        const { data: configRows } = await supabase
            .from('courses')
            .select('id, sections')
            .eq('category', '__OUTREACH_CONFIG__')
            .limit(1);

        if (configRows && configRows.length > 0 && configRows[0].sections?.campaigns) {
            const rawCamps = configRows[0].sections.campaigns;
            if (Array.isArray(rawCamps) && rawCamps.length > 0) {
                const normalized: OutreachCampaign[] = rawCamps.map((c: any) => ({
                    id: String(c.id || c.name),
                    name: c.name,
                    date: c.date || c.event_date || '2026-11-06',
                    location: c.location || 'Entebbe / Kampala',
                    category: c.category === 'GENERAL' ? 'GENERAL' : 'OUTREACH',
                    isActive: c.isActive !== false && c.is_active !== false,
                    isDefault: Boolean(c.isDefault ?? c.is_default)
                }));
                localStorage.setItem(OUTREACH_CAMPAIGNS_CACHE_KEY, JSON.stringify(normalized));
                return normalized;
            }
        }
    } catch {
        // ignore network errors and use local cache / defaults
    }

    try {
        const cached = localStorage.getItem(OUTREACH_CAMPAIGNS_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {
        // ignore
    }

    return DEFAULT_OUTREACH_CAMPAIGNS;
}

export async function saveOutreachCampaigns(campaigns: OutreachCampaign[]): Promise<void> {
    try {
        localStorage.setItem(OUTREACH_CAMPAIGNS_CACHE_KEY, JSON.stringify(campaigns));
    } catch {
        // ignore
    }

    try {
        const { data: existingConfig } = await supabase
            .from('courses')
            .select('id, sections')
            .eq('category', '__OUTREACH_CONFIG__')
            .limit(1);

        if (existingConfig && existingConfig.length > 0) {
            const currentSections = existingConfig[0].sections || {};
            await supabase
                .from('courses')
                .update({
                    sections: {
                        ...currentSections,
                        campaigns
                    }
                })
                .eq('id', existingConfig[0].id);
        } else {
            await supabase.from('courses').insert([{
                title: '__OUTREACH_SYSTEM_CONFIG__',
                category: '__OUTREACH_CONFIG__',
                instructor: 'Welile System',
                duration: 'System',
                description: 'Outreach Campaigns and Staff Roster Configuration',
                price: 0,
                status: 'SYSTEM_CONFIG',
                is_draft: true,
                is_verified: false,
                platform: 'Welile',
                accessTier: 'FREE',
                sections: {
                    campaigns,
                    staff: DEFAULT_OUTREACH_STAFF
                }
            }]);
        }
    } catch (e) {
        console.warn('Could not persist outreach campaigns to Supabase:', e);
    }
}

export function getQueuedOutreachRegistrations(): OutreachRegistrationPayload[] {
    try {
        const raw = localStorage.getItem(OUTREACH_QUEUE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function setQueuedOutreachRegistrations(items: OutreachRegistrationPayload[]): void {
    try {
        localStorage.setItem(OUTREACH_QUEUE_KEY, JSON.stringify(items));
    } catch (e) {
        console.warn('Could not write outreach queue to localStorage:', e);
    }
}

function ensureValidUuid(candidate?: string): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (candidate && uuidRegex.test(candidate)) return candidate;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    const hex = Date.now().toString(16).padStart(12, '0').slice(-12);
    const rand = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
    return `00000000-0000-4000-8${rand.slice(0, 3)}-${hex}`;
}

export function enqueueOutreachRegistration(item: OutreachRegistrationPayload): OutreachRegistrationPayload {
    const queued = getQueuedOutreachRegistrations();
    const record: OutreachRegistrationPayload = {
        ...item,
        id: ensureValidUuid(item.id),
        created_at: item.created_at || new Date().toISOString(),
        status: item.status || 'NEW'
    };
    const filtered = queued.filter(q => q.id !== record.id);
    setQueuedOutreachRegistrations([...filtered, record]);
    return record;
}

export function removeQueuedOutreachRegistration(id: string): void {
    const queued = getQueuedOutreachRegistrations();
    setQueuedOutreachRegistrations(queued.filter(q => q.id !== id));
}

export async function logOutreachToLiveCoursesDb(record: OutreachRegistrationPayload): Promise<boolean> {
    try {
        const pricing = getCoursePricing(record.course_interest);
        const recordId = ensureValidUuid(record.id);
        const createdAt = record.created_at || new Date().toISOString();
        const fullStructuredRecord: OutreachRegistrationPayload = {
            ...record,
            id: recordId,
            created_at: createdAt,
            status: record.status || 'NEW',
            total_course_fee: record.total_course_fee ?? pricing.ugxPerMonth,
            course_fee_usd: record.course_fee_usd ?? pricing.usdPerMonth,
            course_fee_display: record.course_fee_display || pricing.displayFee
        };

        const courseLedgerRow = {
            id: recordId,
            title: `[OUTREACH_REG] ${record.full_name} — ${record.student_reg_no || 'WSI'}`,
            category: '__OUTREACH_REGISTRATION__',
            instructor: record.registered_by_staff || 'Timothy Christian Waniaye',
            instructor_email: '',
            duration: record.outreach_event || 'Nkumba University Outreach (Fri, 6th Nov 2026)',
            description: `${record.course_interest} (${pricing.displayFee}) | ${record.phone} | Registrar: ${record.registered_by_staff || 'Staff'} (${record.registered_by_role || 'Mobilizer'})`,
            price: Number(record.total_course_fee ?? pricing.ugxPerMonth),
            status: record.status || 'NEW',
            is_draft: true,
            is_verified: false,
            platform: 'Welile',
            accessTier: 'PAID',
            sections: {
                is_outreach_registration: true,
                outreach_record: fullStructuredRecord
            }
        };

        const { error } = await supabase
            .from('courses')
            .upsert([courseLedgerRow], { onConflict: 'id' });

        if (error) throw error;
        window.dispatchEvent(new Event('outreach-registration-update'));
        return true;
    } catch (e) {
        console.warn('Could not persist outreach registration to live Supabase courses ledger:', e);
        return false;
    }
}

export async function insertOutreachRegistrationLive(payload: OutreachRegistrationPayload): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Browser is currently offline');
    }

    const recordId = ensureValidUuid(payload.id);
    const enrichedPayload: OutreachRegistrationPayload = {
        ...payload,
        id: recordId,
        created_at: payload.created_at || new Date().toISOString(),
        status: payload.status || 'NEW'
    };

    const coreDbRow: Record<string, any> = {
        id: recordId,
        full_name: enrichedPayload.full_name,
        email: enrichedPayload.email || null,
        phone: enrichedPayload.phone,
        age_range: enrichedPayload.age_range || null,
        guardian_name: enrichedPayload.guardian_name || null,
        guardian_phone: enrichedPayload.guardian_phone || null,
        location: enrichedPayload.location || null,
        course_interest: enrichedPayload.course_interest,
        level: enrichedPayload.level || 'Intermediate',
        mode_preference: enrichedPayload.mode_preference || 'Hybrid',
        preferred_study_days: enrichedPayload.preferred_study_days || [],
        preferred_time_slot: enrichedPayload.preferred_time_slot || null,
        how_heard: enrichedPayload.how_heard || 'Outreach Event',
        outreach_event: enrichedPayload.outreach_event || 'Nkumba University Outreach (Fri, 6th Nov 2026)',
        consent_contact: Boolean(enrichedPayload.consent_contact),
        status: enrichedPayload.status || 'NEW',
        admin_notes: enrichedPayload.admin_notes || null,
        submitted_from: enrichedPayload.submitted_from || 'web'
    };

    // 1. Always write the full 8-section + staff audit record to the live Supabase DB ledger
    const savedToLiveDb = await logOutreachToLiveCoursesDb(enrichedPayload);

    // 2. Also attempt insert into dedicated outreach_registrations table if present
    const { error } = await supabase
        .from('outreach_registrations')
        .insert([coreDbRow]);

    if (savedToLiveDb || !error) {
        return true;
    }

    throw error;
}

let isFlushing = false;

export async function flushPendingOutreachRegistrations(): Promise<number> {
    if (isFlushing) return 0;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

    const queued = getQueuedOutreachRegistrations();
    if (queued.length === 0) return 0;

    isFlushing = true;
    let syncedCount = 0;

    try {
        for (const item of queued) {
            const payload: OutreachRegistrationPayload = {
                ...item,
                status: item.status || 'NEW',
                submitted_from: 'offline-sync'
            };

            try {
                await insertOutreachRegistrationLive(payload);
                if (item.id) {
                    removeQueuedOutreachRegistration(item.id);
                }
                syncedCount++;
            } catch (err: any) {
                console.warn('Failed to flush queued outreach registration:', err?.message || err);
                break;
            }
        }

        if (syncedCount > 0) {
            window.dispatchEvent(new Event('outreach-registration-update'));
        }
    } catch (err) {
        console.warn('Error flushing offline outreach registrations:', err);
    } finally {
        isFlushing = false;
    }

    return syncedCount;
}
