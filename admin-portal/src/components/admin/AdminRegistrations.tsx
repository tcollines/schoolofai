import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import {
    Users,
    Sparkles,
    TrendingUp,
    BookOpen,
    Search,
    Download,
    QrCode,
    ChevronDown,
    ChevronUp,
    UserPlus,
    Calendar,
    Phone,
    Mail,
    MapPin,
    Clock,
    CheckCircle2,
    X,
    Copy,
    Check,
    Printer,
    Megaphone,
    ShieldCheck,
    Loader2,
    Filter,
    RefreshCw,
    FileText,
    CreditCard,
    Plus,
    Star,
    Trash2,
    Layers,
    UserCheck,
    Fingerprint,
    Award
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell
} from 'recharts';

export interface OfficialCoursePricing {
    title: string;
    usdPerMonth: number;
    ugxPerMonth: number;
    displayFee: string;
}

export const OFFICIAL_COURSE_CATALOG: OfficialCoursePricing[] = [
    {
        title: 'Advanced Vibe Coding',
        usdPerMonth: 25,
        ugxPerMonth: 100000,
        displayFee: '$25 | 100,000 UGX per month'
    },
    {
        title: 'Document with AI',
        usdPerMonth: 25,
        ugxPerMonth: 100000,
        displayFee: '$25 | 100,000 UGX per month'
    },
    {
        title: 'Agentic AI',
        usdPerMonth: 50,
        ugxPerMonth: 200000,
        displayFee: '$50 | 200,000 UGX per month'
    },
    {
        title: 'AI Security and Safety',
        usdPerMonth: 35,
        ugxPerMonth: 150000,
        displayFee: '$35 | 150,000 UGX per month'
    }
];

export function getCoursePricing(courseTitle?: string | null): OfficialCoursePricing {
    const clean = (courseTitle || '').trim().toLowerCase();
    const matched = OFFICIAL_COURSE_CATALOG.find(
        c => c.title.toLowerCase() === clean || clean.includes(c.title.toLowerCase())
    );
    if (matched) return matched;
    return {
        title: courseTitle || 'Advanced Vibe Coding',
        usdPerMonth: 25,
        ugxPerMonth: 100000,
        displayFee: '$25 | 100,000 UGX per month'
    };
}

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

function ensureRequiredStaffPresent(list: OutreachStaffMember[]): OutreachStaffMember[] {
    const map = new Map<string, OutreachStaffMember>();
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

const STAFF_STORAGE_KEY = 'welile_outreach_staff_v1';

export interface AuditLogEntry {
    timestamp: string;
    actor: string;
    role: string;
    action: string;
    device_id: string;
    details?: string;
}

export interface OutreachCampaign {
    id: string;
    name: string;
    event_date: string;
    location: string;
    category: 'OUTREACH' | 'GENERAL';
    is_active: boolean;
    is_default: boolean;
}

export const DEFAULT_OUTREACH_CAMPAIGNS: OutreachCampaign[] = [
    {
        id: 'nkumba-2026-11-06',
        name: 'Nkumba University Outreach (Fri, 6th Nov 2026)',
        event_date: '2026-11-06',
        location: 'Nkumba University, Entebbe',
        category: 'OUTREACH',
        is_active: true,
        is_default: true
    },
    {
        id: 'general-website',
        name: 'General / Website Registration',
        event_date: '2026-11-05',
        location: 'Online / Direct',
        category: 'GENERAL',
        is_active: true,
        is_default: false
    },
    {
        id: 'katabi-walkin',
        name: 'Katabi Campus Walk-in (Entebbe)',
        event_date: '2026-11-05',
        location: 'Katabi, Entebbe, Uganda',
        category: 'GENERAL',
        is_active: true,
        is_default: false
    },
    {
        id: 'makerere-career-fair',
        name: 'Makerere Career Fair Nov 2026',
        event_date: '2026-11-15',
        location: 'Makerere University, Kampala',
        category: 'OUTREACH',
        is_active: true,
        is_default: false
    }
];

const CAMPAIGNS_STORAGE_KEY = 'welile_outreach_campaigns_v1';

export interface OutreachRegistrationRecord {
    id: string;
    created_at: string;
    registration_date?: string | null;
    student_reg_no?: string | null;
    full_name: string;
    email: string | null;
    phone: string;
    age_range: string | null;
    class_level_year?: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    location: string | null;
    course_interest: string;
    course_fee_usd?: number | null;
    course_fee_display?: string | null;
    level: string | null;
    mode_of_study_text?: string | null;
    mode_preference: string | null;
    expected_start_date?: string | null;
    expected_completion_date?: string | null;
    preferred_study_days: string[] | null;
    preferred_time_slot: string | null;
    study_hours_per_session?: string | null;
    sessions_per_week?: string | null;
    alternative_study_time?: string | null;
    total_course_fee?: number | null;
    registration_fee?: string | null;
    amount_paid?: number | null;
    outstanding_balance?: number | null;
    payment_plan?: string | null;
    agreed_payment_amount?: number | null;
    next_payment_date?: string | null;
    payment_due_date?: string | null;
    payment_method?: string | null;
    payment_reference?: string | null;
    commitments_accepted?: string[] | boolean | null;
    commitments_list?: string[] | null;
    student_signature?: string | null;
    student_declaration_date?: string | null;
    guardian_signature?: string | null;
    guardian_consent_date?: string | null;
    how_heard: string | null;
    outreach_event: string | null;
    registered_by_staff?: string | null;
    registered_by_staff_id?: string | null;
    registered_by_role?: string | null;
    registration_mode?: string | null;
    device_audit_id?: string | null;
    device_info?: string | null;
    audit_trail?: AuditLogEntry[] | null;
    consent_contact: boolean;
    status: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'NOT_INTERESTED';
    approved_by?: string | null;
    approver_position?: string | null;
    assigned_instructor?: string | null;
    confirmed_schedule?: string | null;
    admin_payment_status?: string | null;
    admin_signature_date?: string | null;
    admin_remarks?: string | null;
    admin_notes: string | null;
    converted_profile_id: string | null;
    submitted_from: string | null;
}

const STATUS_OPTIONS: Array<OutreachRegistrationRecord['status']> = [
    'NEW',
    'CONTACTED',
    'ENROLLED',
    'NOT_INTERESTED'
];

const STATUS_STAGE_LABELS: Record<OutreachRegistrationRecord['status'], string> = {
    NEW: 'Pre-Registered (Follow-Up Needed)',
    CONTACTED: 'Followed Up (Confirming Study)',
    ENROLLED: 'Confirmed & Enrolled Student',
    NOT_INTERESTED: 'Deferred / Declined'
};

const STATUS_SHORT_LABELS: Record<OutreachRegistrationRecord['status'], string> = {
    NEW: 'Pre-Registered',
    CONTACTED: 'Followed Up',
    ENROLLED: 'Confirmed Student',
    NOT_INTERESTED: 'Deferred'
};

const STATUS_BADGE_STYLES: Record<OutreachRegistrationRecord['status'], string> = {
    NEW: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    CONTACTED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
    ENROLLED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    NOT_INTERESTED: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
};

const CHART_COLORS = ['#a855f7', '#7c3aed', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

const APPROVER_PRESETS = [
    'Timothy Christian Waniaye — COO',
    'Admissions Office — Katabi Campus',
    'Academic Registrar — Welile School of AI',
    'Outreach Lead — Nkumba Campaign',
    'Centre Director — Entebbe'
];

const POSITION_PRESETS = [
    'COO',
    'Chief Operating Officer',
    'Admissions Officer',
    'Academic Registrar',
    'Outreach Coordinator',
    'Centre Manager',
    'Lead AI Instructor'
];

const INSTRUCTOR_CLASS_PRESETS = [
    'Cohort 1 — Morning Lab (Katabi Campus)',
    'Cohort 1 — Afternoon Hybrid (Katabi / Online)',
    'Cohort 1 — Evening Live Online',
    'Weekend Intensive Cohort (Sat & Sun)',
    'Nkumba University Fast-Track Cohort'
];

const ADMIN_PAYMENT_STATUS_OPTIONS = [
    'Pending',
    'Payment Plan',
    'Partially Paid',
    'Fully Paid'
];

interface Section8Draft {
    approved_by: string;
    approver_position: string;
    assigned_instructor: string;
    confirmed_schedule: string;
    admin_payment_status: string;
    admin_signature_date: string;
    admin_notes: string;
}

const AdminRegistrations: React.FC = () => {
    const [registrations, setRegistrations] = useState<OutreachRegistrationRecord[]>([]);
    const [campaigns, setCampaigns] = useState<OutreachCampaign[]>(DEFAULT_OUTREACH_CAMPAIGNS);
    const [staffRoster, setStaffRoster] = useState<OutreachStaffMember[]>(DEFAULT_OUTREACH_STAFF);
    const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
    const [loading, setLoading] = useState(true);

    // TOP-LEVEL DASHBOARD SIEVE (Sieves KPIs, Charts, Table, and CSV Export!)
    // Values: 'ALL' | 'OUTREACH_ONLY' | 'GENERAL_ONLY' | specific campaign name
    const [dashboardSieve, setDashboardSieve] = useState<string>('ALL');

    // STAFF / MOBILIZER AUDIT SIEVE (Sieves KPIs, Charts, Table, and CSV Export!)
    // Values: 'ALL' | 'STAFF_ONLY' | 'SELF_ONLY' | specific staff member name
    const [staffSieve, setStaffSieve] = useState<string>('ALL');

    // Table-level secondary filters & sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [courseFilter, setCourseFilter] = useState<string>('ALL');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [sortBy, setSortBy] = useState<'created_at' | 'full_name' | 'course_interest' | 'status'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Workspace View & Right Slide-Over Inspector Drawer states
    const [activeWorkspaceView, setActiveWorkspaceView] = useState<'TABLE' | 'BOARD' | 'ANALYTICS' | 'AUDIT'>('TABLE');
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [drawerTab, setDrawerTab] = useState<'OVERVIEW' | 'CONFIRMATION' | 'AUDIT'>('CONFIRMATION');
    const [section8Drafts, setSection8Drafts] = useState<Record<string, Section8Draft>>({});
    const [savingSection8Id, setSavingSection8Id] = useState<string | null>(null);
    const [savedSection8Id, setSavedSection8Id] = useState<string | null>(null);

    // Printable Official 8-Section Form Modal
    const [printingRecord, setPrintingRecord] = useState<OutreachRegistrationRecord | null>(null);

    // Outreach Campaign Manager Modal
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newCampaignDate, setNewCampaignDate] = useState('2026-11-06');
    const [newCampaignLocation, setNewCampaignLocation] = useState('Entebbe / Kampala');
    const [newCampaignCategory, setNewCampaignCategory] = useState<'OUTREACH' | 'GENERAL'>('OUTREACH');
    const [newCampaignIsDefault, setNewCampaignIsDefault] = useState(false);
    const [savingCampaigns, setSavingCampaigns] = useState(false);

    // Outreach Staff & Mobilizers Audit Manager Modal
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [newStaffName, setNewStaffName] = useState('');
    const [newStaffRole, setNewStaffRole] = useState('Outreach Mobilizer');
    const [newStaffPhone, setNewStaffPhone] = useState('');
    const [savingStaff, setSavingStaff] = useState(false);

    // Convert to Student modal state
    const [convertingLead, setConvertingLead] = useState<OutreachRegistrationRecord | null>(null);
    const [convertName, setConvertName] = useState('');
    const [convertEmail, setConvertEmail] = useState('');
    const [convertPhone, setConvertPhone] = useState('');
    const [convertCourseId, setConvertCourseId] = useState('');
    const [convertRole, setConvertRole] = useState('INDIVIDUAL');
    const [isConverting, setIsConverting] = useState(false);
    const [convertFeedback, setConvertFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Shareable QR Code Modal state
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrEventName, setQrEventName] = useState('Nkumba University Outreach (Fri, 6th Nov 2026)');
    const [qrStaffName, setQrStaffName] = useState('');
    const [copiedLink, setCopiedLink] = useState(false);

    // Unified Outreach Activation, Website Button & Mobilizer Team Control Modal state
    const [showLaunchControlModal, setShowLaunchControlModal] = useState(false);
    const [websiteButtonVisible, setWebsiteButtonVisible] = useState<boolean>(false);
    const [websiteButtonLabel, setWebsiteButtonLabel] = useState<string>('Join an Outreach Event');
    const [activeOutreachName, setActiveOutreachName] = useState<string>('Nkumba University Outreach (Fri, 6th Nov 2026)');
    const [defaultRegistrarName, setDefaultRegistrarName] = useState<string>('Timothy Christian Waniaye');
    const [activeStaffIds, setActiveStaffIds] = useState<string[]>(() => DEFAULT_OUTREACH_STAFF.map(s => s.id));
    const [savingLaunchSettings, setSavingLaunchSettings] = useState(false);
    const [savedLaunchSettings, setSavedLaunchSettings] = useState(false);

    const loadPortalSettings = (coursesData?: any[]) => {
        try {
            const configCourse = (coursesData || []).find((c: any) => c.category === '__OUTREACH_CONFIG__');
            const ps = configCourse?.sections?.portal_settings;
            if (ps && typeof ps === 'object') {
                setWebsiteButtonVisible(Boolean(ps.website_button_visible));
                if (ps.website_button_label) setWebsiteButtonLabel(String(ps.website_button_label));
                if (ps.active_campaign_name) setActiveOutreachName(String(ps.active_campaign_name));
                if (ps.default_registrar_name) setDefaultRegistrarName(String(ps.default_registrar_name));
                if (Array.isArray(ps.active_staff_ids) && ps.active_staff_ids.length > 0) {
                    setActiveStaffIds(ps.active_staff_ids.map(String));
                }
                localStorage.setItem('welile_outreach_portal_settings_v1', JSON.stringify(ps));
                return;
            }

            const cached = localStorage.getItem('welile_outreach_portal_settings_v1');
            if (cached) {
                const parsed = JSON.parse(cached);
                setWebsiteButtonVisible(Boolean(parsed.website_button_visible));
                if (parsed.website_button_label) setWebsiteButtonLabel(String(parsed.website_button_label));
                if (parsed.active_campaign_name) setActiveOutreachName(String(parsed.active_campaign_name));
                if (parsed.default_registrar_name) setDefaultRegistrarName(String(parsed.default_registrar_name));
                if (Array.isArray(parsed.active_staff_ids) && parsed.active_staff_ids.length > 0) {
                    setActiveStaffIds(parsed.active_staff_ids.map(String));
                }
            }
        } catch {
            // fallback to defaults
        }
    };

    const handleSaveLaunchSettings = async (overrideButtonVisible?: boolean) => {
        setSavingLaunchSettings(true);
        const nextVisible = typeof overrideButtonVisible === 'boolean' ? overrideButtonVisible : websiteButtonVisible;
        if (typeof overrideButtonVisible === 'boolean') {
            setWebsiteButtonVisible(overrideButtonVisible);
        }

        const nextPortalSettings = {
            website_button_visible: nextVisible,
            website_button_label: websiteButtonLabel.trim() || 'Join an Outreach Event',
            active_campaign_name: activeOutreachName,
            default_registrar_name: defaultRegistrarName,
            active_staff_ids: activeStaffIds,
            updated_at: new Date().toISOString()
        };

        const updatedCampaigns = campaigns.map(c => ({
            ...c,
            is_default: c.name === activeOutreachName
        }));
        setCampaigns(updatedCampaigns);

        const activeSet = new Set(activeStaffIds);
        const updatedStaff = staffRoster.map(s => ({
            ...s,
            isActive: activeSet.has(s.id) || s.id === 'stf-self'
        }));
        setStaffRoster(updatedStaff);

        try {
            localStorage.setItem('welile_outreach_portal_settings_v1', JSON.stringify(nextPortalSettings));
            localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(updatedCampaigns));
            localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(updatedStaff));
            window.dispatchEvent(new Event('outreach-portal-settings-update'));
        } catch {
            // ignore
        }

        try {
            const { data: existingConfig } = await supabaseClient
                .from('courses')
                .select('id, sections')
                .eq('category', '__OUTREACH_CONFIG__')
                .limit(1);

            if (existingConfig && existingConfig.length > 0) {
                const currentSections = existingConfig[0].sections || {};
                await supabaseClient
                    .from('courses')
                    .update({
                        sections: {
                            ...currentSections,
                            campaigns: updatedCampaigns,
                            staff: updatedStaff,
                            portal_settings: nextPortalSettings
                        }
                    })
                    .eq('id', existingConfig[0].id);
            } else {
                await supabaseClient.from('courses').insert([{
                    title: '__OUTREACH_SYSTEM_CONFIG__',
                    category: '__OUTREACH_CONFIG__',
                    instructor: 'Welile System',
                    duration: 'System',
                    description: 'Outreach Campaigns, Staff Roster & Website Button Configuration',
                    price: 0,
                    status: 'SYSTEM_CONFIG',
                    is_draft: true,
                    is_verified: false,
                    platform: 'Welile',
                    accessTier: 'FREE',
                    sections: {
                        campaigns: updatedCampaigns,
                        staff: updatedStaff,
                        portal_settings: nextPortalSettings
                    }
                }]);
            }
            setSavedLaunchSettings(true);
            setTimeout(() => setSavedLaunchSettings(false), 2500);
        } catch (err) {
            console.error('Error saving outreach launch settings:', err);
        } finally {
            setSavingLaunchSettings(false);
        }
    };

    const toggleStaffIdInLaunch = (id: string) => {
        setActiveStaffIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const loadStaffRoster = async (coursesData?: any[]) => {
        try {
            // 1. Check dedicated outreach_staff table first
            const { data: staffRows, error: staffErr } = await supabaseClient
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
                setStaffRoster(mapped);
                localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(mapped));
                return;
            }

            // 2. Check live Supabase system config row in public.courses
            const configCourse = (coursesData || []).find((c: any) => c.category === '__OUTREACH_CONFIG__');
            if (configCourse && Array.isArray(configCourse.sections?.staff) && configCourse.sections.staff.length > 0) {
                const merged = ensureRequiredStaffPresent(configCourse.sections.staff);
                setStaffRoster(merged);
                localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(merged));
                return;
            }

            const cached = localStorage.getItem(STAFF_STORAGE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const merged = ensureRequiredStaffPresent(parsed);
                    setStaffRoster(merged);
                    return;
                }
            }
        } catch {
            // fallback to default staff roster
        }
        setStaffRoster(DEFAULT_OUTREACH_STAFF);
    };

    const persistStaffRoster = async (nextStaff: OutreachStaffMember[]) => {
        const merged = ensureRequiredStaffPresent(nextStaff);
        setSavingStaff(true);
        setStaffRoster(merged);
        try {
            localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(merged));
        } catch {
            // ignore
        }

        try {
            const { data: existingConfig } = await supabaseClient
                .from('courses')
                .select('id, sections')
                .eq('category', '__OUTREACH_CONFIG__')
                .limit(1);

            if (existingConfig && existingConfig.length > 0) {
                const currentSections = existingConfig[0].sections || {};
                await supabaseClient
                    .from('courses')
                    .update({
                        sections: {
                            ...currentSections,
                            staff: merged
                        }
                    })
                    .eq('id', existingConfig[0].id);
            } else {
                await supabaseClient.from('courses').insert([{
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
                        staff: merged
                    }
                }]);
            }
        } catch (err) {
            console.error('Error persisting outreach staff roster:', err);
        } finally {
            setSavingStaff(false);
        }
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newStaffName.trim();
        if (!trimmed) return;
        const codeNum = String(staffRoster.length + 1).padStart(3, '0');
        const newMember: OutreachStaffMember = {
            id: `stf-${Date.now()}`,
            name: trimmed,
            staffCode: `WSI-STF-${codeNum}`,
            role: newStaffRole.trim() || 'Outreach Mobilizer',
            phone: newStaffPhone.trim() || undefined,
            isActive: true
        };
        const filtered = staffRoster.filter(s => s.name.toLowerCase() !== trimmed.toLowerCase());
        await persistStaffRoster([newMember, ...filtered]);
        setNewStaffName('');
        setNewStaffPhone('');
    };

    const handleDeleteStaff = async (id: string, name?: string) => {
        if (staffRoster.length <= 1) return;
        const remaining = staffRoster.filter(s => s.id !== id);
        await persistStaffRoster(remaining);
        if (name && staffSieve === name) {
            setStaffSieve('ALL');
        }
    };

    const ensureOfficialCoursesSeededInDb = async (existingCourses: any[]) => {
        try {
            const realCourses = (existingCourses || []).filter(
                (c: any) => !String(c.category || '').startsWith('__OUTREACH_')
            );
            const existingTitles = new Set(
                realCourses.map((c: any) => String(c.title || '').trim().toLowerCase())
            );
            let addedAny = false;
            for (const c of OFFICIAL_COURSE_CATALOG) {
                if (!existingTitles.has(c.title.toLowerCase())) {
                    const { error } = await supabaseClient.from('courses').insert([{
                        title: c.title,
                        description: `Official Welile School of AI Course — ${c.displayFee}. Hands-on practical AI training at Katabi, Entebbe & Online.`,
                        category: 'Artificial Intelligence',
                        duration: '8 Weeks',
                        price: c.usdPerMonth,
                        instructor: 'Welile AI Faculty',
                        platform: 'Welile',
                        accessTier: 'PAID',
                        status: 'Published',
                        is_draft: false,
                        is_verified: true
                    }]);
                    if (!error) addedAny = true;
                }
            }
            if (addedAny) {
                const { data: refreshed } = await supabaseClient
                    .from('courses')
                    .select('id, title, is_draft, category');
                if (refreshed) {
                    setCourses(
                        refreshed
                            .filter((c: any) => !c.is_draft && c.title && !String(c.category || '').startsWith('__OUTREACH_'))
                            .map((c: any) => ({ id: c.id, title: c.title }))
                    );
                }
            }
        } catch {
            // ignore
        }
    };

    const loadCampaigns = async (coursesData?: any[]) => {
        try {
            const { data: campRows, error: campErr } = await supabaseClient
                .from('outreach_campaigns')
                .select('*')
                .order('is_default', { ascending: false })
                .order('event_date', { ascending: false });

            if (!campErr && campRows && campRows.length > 0) {
                const mapped: OutreachCampaign[] = campRows.map((r: any) => ({
                    id: String(r.id),
                    name: r.name,
                    event_date: r.event_date || '2026-11-06',
                    location: r.location || 'Entebbe, Uganda',
                    category: r.category === 'GENERAL' ? 'GENERAL' : 'OUTREACH',
                    is_active: r.is_active !== false,
                    is_default: Boolean(r.is_default)
                }));
                setCampaigns(mapped);
                localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(mapped));
                return;
            }

            const configCourse = (coursesData || []).find((c: any) => c.category === '__OUTREACH_CONFIG__');
            if (configCourse && Array.isArray(configCourse.sections?.campaigns) && configCourse.sections.campaigns.length > 0) {
                const parsed = configCourse.sections.campaigns.map((c: any) => ({
                    id: String(c.id || c.name),
                    name: c.name,
                    event_date: c.event_date || c.date || '2026-11-06',
                    location: c.location || 'Entebbe, Uganda',
                    category: c.category === 'GENERAL' ? 'GENERAL' : 'OUTREACH',
                    is_active: c.is_active !== false && c.isActive !== false,
                    is_default: Boolean(c.is_default ?? c.isDefault)
                }));
                setCampaigns(parsed);
                localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(parsed));
                return;
            }

            const cached = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setCampaigns(parsed);
                    return;
                }
            }
        } catch {
            // fallback to default campaigns
        }
    };

    const persistCampaigns = async (nextCampaigns: OutreachCampaign[]) => {
        setSavingCampaigns(true);
        setCampaigns(nextCampaigns);
        try {
            localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(nextCampaigns));
        } catch {
            // ignore storage errors
        }

        try {
            const { data: existingConfig } = await supabaseClient
                .from('courses')
                .select('id, sections')
                .eq('category', '__OUTREACH_CONFIG__')
                .limit(1);

            if (existingConfig && existingConfig.length > 0) {
                const currentSections = existingConfig[0].sections || {};
                await supabaseClient
                    .from('courses')
                    .update({
                        sections: {
                            ...currentSections,
                            campaigns: nextCampaigns
                        }
                    })
                    .eq('id', existingConfig[0].id);
            } else {
                await supabaseClient.from('courses').insert([{
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
                        campaigns: nextCampaigns,
                        staff: staffRoster
                    }
                }]);
            }
        } catch (err) {
            console.error('Error persisting outreach campaigns:', err);
        } finally {
            setSavingCampaigns(false);
        }
    };

    const handleAddCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newCampaignName.trim();
        if (!trimmedName) return;

        const newEntry: OutreachCampaign = {
            id: `camp-${Date.now()}`,
            name: trimmedName,
            event_date: newCampaignDate || '2026-11-06',
            location: newCampaignLocation.trim() || 'Entebbe, Uganda',
            category: newCampaignCategory,
            is_active: true,
            is_default: newCampaignIsDefault
        };

        const updated = nextCampaignListWithDefault(campaigns, newEntry, newCampaignIsDefault);
        await persistCampaigns(updated);
        setNewCampaignName('');
        setNewCampaignIsDefault(false);
    };

    const nextCampaignListWithDefault = (
        list: OutreachCampaign[],
        added: OutreachCampaign,
        makeDefault: boolean
    ): OutreachCampaign[] => {
        const filtered = list.filter(c => c.name.toLowerCase() !== added.name.toLowerCase());
        if (makeDefault) {
            return [
                { ...added, is_default: true },
                ...filtered.map(c => ({ ...c, is_default: false }))
            ];
        }
        return [...filtered, added];
    };

    const handleSetDefaultCampaign = async (name: string) => {
        const updated = campaigns.map(c => ({
            ...c,
            is_default: c.name === name
        }));
        await persistCampaigns(updated);
    };

    const handleDeleteCampaign = async (name: string) => {
        if (campaigns.length <= 1) return;
        const remaining = campaigns.filter(c => c.name !== name);
        if (!remaining.some(c => c.is_default) && remaining.length > 0) {
            remaining[0].is_default = true;
        }
        await persistCampaigns(remaining);
        if (dashboardSieve === name) {
            setDashboardSieve('ALL');
        }
    };

    const fetchRegistrations = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [{ data: regData, error: regErr }, { data: coursesData }] = await Promise.all([
                supabaseClient
                    .from('outreach_registrations')
                    .select('*')
                    .order('created_at', { ascending: false }),
                supabaseClient
                    .from('courses')
                    .select('id, title, category, status, price, is_draft, created_at, sections')
                    .order('created_at', { ascending: false })
            ]);

            loadPortalSettings(coursesData || []);
            await Promise.all([
                loadCampaigns(coursesData || []),
                loadStaffRoster(coursesData || []),
                ensureOfficialCoursesSeededInDb(coursesData || [])
            ]);

            const byIdMap = new Map<string, OutreachRegistrationRecord>();

            // 1. Load records stored in live Supabase courses ledger (`category === '__OUTREACH_REGISTRATION__'`)
            if (coursesData && coursesData.length > 0) {
                coursesData.forEach((c: any) => {
                    if (
                        c.category === '__OUTREACH_REGISTRATION__' ||
                        c.sections?.is_outreach_registration === true
                    ) {
                        const obj = c.sections?.outreach_record || {};
                        const id = String(c.id || obj.id);
                        if (id && obj.full_name) {
                            byIdMap.set(id, {
                                ...obj,
                                id,
                                created_at: c.created_at || obj.created_at || new Date().toISOString(),
                                status: (c.status && ['NEW', 'CONTACTED', 'ENROLLED', 'NOT_INTERESTED'].includes(c.status)
                                    ? c.status
                                    : obj.status || 'NEW') as OutreachRegistrationRecord['status'],
                                admin_notes: obj.admin_notes || obj.admin_remarks || null,
                                converted_profile_id: obj.converted_profile_id || null
                            });
                        }
                    }
                });
            }

            // 2. Merge records from dedicated outreach_registrations table if present
            if (!regErr && regData && regData.length > 0) {
                regData.forEach((row: any) => {
                    const id = String(row.id);
                    const existing = byIdMap.get(id);
                    byIdMap.set(id, {
                        ...(existing || {}),
                        ...row,
                        id
                    });
                });
            }

            const combinedList = Array.from(byIdMap.values()).sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setRegistrations(combinedList);

            const initialDrafts: Record<string, Section8Draft> = {};
            combinedList.forEach((r: OutreachRegistrationRecord) => {
                const defaultSchedule = `${(r.preferred_study_days || []).join(', ') || 'Mon, Wed, Fri'} • ${r.preferred_time_slot || 'Flexible'}`;
                const defaultCourseFee = r.total_course_fee ?? getCoursePricing(r.course_interest).ugxPerMonth;
                const autoPayStatus =
                    r.admin_payment_status ||
                    ((r.amount_paid || 0) >= defaultCourseFee
                        ? 'Fully Paid'
                        : (r.amount_paid || 0) > 0
                        ? 'Partially Paid'
                        : r.payment_plan && r.payment_plan !== 'Full'
                        ? 'Payment Plan'
                        : 'Pending');

                initialDrafts[r.id] = {
                    approved_by: r.approved_by || (r.registered_by_staff ? `${r.registered_by_staff} (Outreach Capture)` : APPROVER_PRESETS[0]),
                    approver_position: r.approver_position || r.registered_by_role || POSITION_PRESETS[0],
                    assigned_instructor: r.assigned_instructor || INSTRUCTOR_CLASS_PRESETS[0],
                    confirmed_schedule: r.confirmed_schedule || defaultSchedule,
                    admin_payment_status: autoPayStatus,
                    admin_signature_date: r.admin_signature_date || new Date().toISOString().split('T')[0],
                    admin_notes: r.admin_notes || r.admin_remarks || ''
                };
            });
            setSection8Drafts(prev => ({ ...initialDrafts, ...prev }));

            if (coursesData) {
                setCourses(
                    coursesData
                        .filter((c: any) => !c.is_draft && c.title && !String(c.category || '').startsWith('__OUTREACH_'))
                        .map((c: any) => ({ id: c.id, title: c.title }))
                );
            }
        } catch (err) {
            console.error('Error loading outreach registrations:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();

        const handleUpdate = () => fetchRegistrations(true);
        window.addEventListener('outreach-registration-update', handleUpdate);
        window.addEventListener('focus', handleUpdate);

        const channel = supabaseClient
            .channel('outreach-registrations-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'outreach_registrations' },
                () => {
                    fetchRegistrations(true);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'courses' },
                () => {
                    fetchRegistrations(true);
                }
            )
            .subscribe();

        return () => {
            window.removeEventListener('outreach-registration-update', handleUpdate);
            window.removeEventListener('focus', handleUpdate);
            supabaseClient.removeChannel(channel);
        };
    }, []);

    // Helper to classify whether a registration belongs to an OUTREACH event vs GENERAL walk-in/website
    const isGeneralRegistration = (r: OutreachRegistrationRecord): boolean => {
        const ev = (r.outreach_event || '').trim();
        if (!ev) return true;
        const matchedCamp = campaigns.find(c => c.name.toLowerCase() === ev.toLowerCase());
        if (matchedCamp) {
            return matchedCamp.category === 'GENERAL';
        }
        const lower = ev.toLowerCase();
        return lower.includes('general') || lower.includes('website') || lower.includes('walk-in') || lower.includes('direct');
    };

    const getEffectiveRegistrar = (r: OutreachRegistrationRecord): string => {
        if (r.registered_by_staff && r.registered_by_staff.trim()) {
            return r.registered_by_staff.trim();
        }
        if (r.approved_by && !r.approved_by.toLowerCase().includes('pending')) {
            return r.approved_by.replace(/\s*\(Outreach Capture\)/i, '').trim();
        }
        return 'Self-Registered (Student Direct)';
    };

    const isSelfRegistered = (r: OutreachRegistrationRecord): boolean => {
        const regBy = getEffectiveRegistrar(r).toLowerCase();
        const mode = (r.registration_mode || '').toLowerCase();
        return regBy.includes('self-registered') || mode.includes('self');
    };

    // 1. FIRST-STAGE SIEVE: Sieves the entire dashboard (KPIs, Charts, Table, CSV) by Outreach AND by Staff/Mobilizer Audit
    const sievedRegistrations = useMemo(() => {
        return registrations.filter(r => {
            // Campaign / Outreach Sieve
            if (dashboardSieve === 'OUTREACH_ONLY' && isGeneralRegistration(r)) return false;
            if (dashboardSieve === 'GENERAL_ONLY' && !isGeneralRegistration(r)) return false;
            if (
                dashboardSieve !== 'ALL' &&
                dashboardSieve !== 'OUTREACH_ONLY' &&
                dashboardSieve !== 'GENERAL_ONLY' &&
                (r.outreach_event || '').trim() !== dashboardSieve
            ) {
                return false;
            }

            // Staff / Mobilizer Audit Sieve
            if (staffSieve === 'STAFF_ONLY' && isSelfRegistered(r)) return false;
            if (staffSieve === 'SELF_ONLY' && !isSelfRegistered(r)) return false;
            if (
                staffSieve !== 'ALL' &&
                staffSieve !== 'STAFF_ONLY' &&
                staffSieve !== 'SELF_ONLY' &&
                getEffectiveRegistrar(r) !== staffSieve
            ) {
                return false;
            }

            return true;
        });
    }, [registrations, dashboardSieve, staffSieve, campaigns]);

    // Distinct filter options
    const distinctCourses = useMemo(() => {
        const official = OFFICIAL_COURSE_CATALOG.map(c => c.title);
        const fromRegs = registrations.map(r => r.course_interest).filter(Boolean);
        const fromCourses = courses.map(c => c.title).filter(Boolean);
        return Array.from(new Set([...official, ...fromRegs, ...fromCourses]));
    }, [registrations, courses]);

    const distinctEvents = useMemo(() => {
        const fromCampaigns = campaigns.map(c => c.name);
        const fromRegs = registrations
            .map(r => (r.outreach_event || '').trim())
            .filter(Boolean);
        return Array.from(new Set([...fromCampaigns, ...fromRegs]));
    }, [registrations, campaigns]);

    const distinctStaff = useMemo(() => {
        const fromRoster = staffRoster.map(s => s.name);
        const fromRegs = registrations.map(r => getEffectiveRegistrar(r)).filter(Boolean);
        return Array.from(new Set([...fromRoster, ...fromRegs]));
    }, [registrations, staffRoster]);

    // Staff & Mobilizer Audit Leaderboard (computed across current Outreach sieve)
    const staffAuditLeaderboard = useMemo(() => {
        const map: Record<
            string,
            {
                staffName: string;
                role: string;
                total: number;
                enrolled: number;
                collectedUgx: number;
                devices: Set<string>;
                lastActive: string;
            }
        > = {};

        registrations
            .filter(r => {
                if (dashboardSieve === 'ALL') return true;
                if (dashboardSieve === 'OUTREACH_ONLY') return !isGeneralRegistration(r);
                if (dashboardSieve === 'GENERAL_ONLY') return isGeneralRegistration(r);
                return (r.outreach_event || '').trim() === dashboardSieve;
            })
            .forEach(r => {
                const name = getEffectiveRegistrar(r);
                const rosterMatch = staffRoster.find(s => s.name === name);
                if (!map[name]) {
                    map[name] = {
                        staffName: name,
                        role: r.registered_by_role || rosterMatch?.role || (name.includes('Self') ? 'Student Direct' : 'Outreach Staff'),
                        total: 0,
                        enrolled: 0,
                        collectedUgx: 0,
                        devices: new Set<string>(),
                        lastActive: r.created_at
                    };
                }
                map[name].total += 1;
                if (r.status === 'ENROLLED') map[name].enrolled += 1;
                map[name].collectedUgx += Number(r.amount_paid ?? 0);
                if (r.device_audit_id) map[name].devices.add(r.device_audit_id);
                if (new Date(r.created_at).getTime() > new Date(map[name].lastActive).getTime()) {
                    map[name].lastActive = r.created_at;
                }
            });

        return Object.values(map)
            .map(item => ({
                ...item,
                deviceList: Array.from(item.devices)
            }))
            .sort((a, b) => b.total - a.total);
    }, [registrations, dashboardSieve, staffRoster, campaigns]);

    // Sieve counts for quick pill badges
    const sieveCounts = useMemo(() => {
        const all = registrations.length;
        let outreachOnly = 0;
        let generalOnly = 0;
        let staffAssisted = 0;
        let selfService = 0;
        const byEvent: Record<string, number> = {};
        const byStaff: Record<string, number> = {};

        registrations.forEach(r => {
            const ev = (r.outreach_event || '').trim();
            if (ev) {
                byEvent[ev] = (byEvent[ev] || 0) + 1;
            }
            if (isGeneralRegistration(r)) {
                generalOnly++;
            } else {
                outreachOnly++;
            }
            const stf = getEffectiveRegistrar(r);
            byStaff[stf] = (byStaff[stf] || 0) + 1;
            if (isSelfRegistered(r)) {
                selfService++;
            } else {
                staffAssisted++;
            }
        });

        return { all, outreachOnly, generalOnly, staffAssisted, selfService, byEvent, byStaff };
    }, [registrations, campaigns]);

    // KPI computations (computed from sievedRegistrations!)
    const kpis = useMemo(() => {
        const total = sievedRegistrations.length;
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const newThisWeek = sievedRegistrations.filter(
            r => new Date(r.created_at).getTime() >= oneWeekAgo
        ).length;

        const awaitingFollowUpCount = sievedRegistrations.filter(r => r.status === 'NEW').length;
        const followedUpCount = sievedRegistrations.filter(r => r.status === 'CONTACTED').length;
        const enrolledCount = sievedRegistrations.filter(r => r.status === 'ENROLLED').length;
        const deferredCount = sievedRegistrations.filter(r => r.status === 'NOT_INTERESTED').length;
        const conversionRate = total > 0 ? Math.round((enrolledCount / total) * 100) : 0;

        let totalFeePipeline = 0;
        let totalCollectedFees = 0;
        let totalOutstanding = 0;

        const courseCounts: Record<string, number> = {};
        sievedRegistrations.forEach(r => {
            if (r.course_interest) {
                courseCounts[r.course_interest] = (courseCounts[r.course_interest] || 0) + 1;
            }
            const defaultFee = getCoursePricing(r.course_interest).ugxPerMonth;
            const fee = Number(r.total_course_fee ?? defaultFee);
            const paid = Number(r.amount_paid ?? 0);
            const bal = Number(r.outstanding_balance ?? Math.max(0, fee - paid));
            totalFeePipeline += fee;
            totalCollectedFees += paid;
            totalOutstanding += bal;
        });

        let topCourse = 'Advanced Vibe Coding';
        let topCourseCount = 0;
        Object.entries(courseCounts).forEach(([course, count]) => {
            if (count > topCourseCount) {
                topCourse = course;
                topCourseCount = count;
            }
        });

        return {
            total,
            newThisWeek,
            awaitingFollowUpCount,
            followedUpCount,
            enrolledCount,
            deferredCount,
            conversionRate,
            topCourse,
            topCourseCount,
            totalFeePipeline,
            totalCollectedFees,
            totalOutstanding
        };
    }, [sievedRegistrations]);

    // Chart 1: Registrations per day over the last 30 days (sieved)
    const dailyTrendData = useMemo(() => {
        const days: Array<{ dateKey: string; label: string; count: number }> = [];
        const now = new Date();
        const countsByDate: Record<string, number> = {};

        sievedRegistrations.forEach(r => {
            if (!r.created_at) return;
            const d = new Date(r.created_at);
            if (!isNaN(d.getTime())) {
                const key = d.toISOString().split('T')[0];
                countsByDate[key] = (countsByDate[key] || 0) + 1;
            }
        });

        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            days.push({
                dateKey,
                label,
                count: countsByDate[dateKey] || 0
            });
        }
        return days;
    }, [sievedRegistrations]);

    // Chart 2: Breakdown by Outreach Campaign / Event (or Course Interest)
    const outreachBreakdownData = useMemo(() => {
        const counts: Record<string, number> = {};
        sievedRegistrations.forEach(r => {
            const key = r.outreach_event || 'General / Unspecified';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({
                name: name.length > 26 ? name.slice(0, 24) + '…' : name,
                fullName: name,
                count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 7);
    }, [sievedRegistrations]);

    // Chart 3: Breakdown by Payment Plan & Study Mode
    const paymentPlanChartData = useMemo(() => {
        const counts: Record<string, number> = {};
        sievedRegistrations.forEach(r => {
            const key = r.payment_plan ? `${r.payment_plan} Plan` : r.how_heard || 'Unspecified';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [sievedRegistrations]);

    // Filtered & Sorted Table Rows (applies secondary table filters on top of sievedRegistrations)
    const filteredRegistrations = useMemo(() => {
        return sievedRegistrations
            .filter(r => {
                if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
                if (courseFilter !== 'ALL' && r.course_interest !== courseFilter) return false;
                if (paymentStatusFilter !== 'ALL') {
                    const effectivePayStatus =
                        section8Drafts[r.id]?.admin_payment_status || r.admin_payment_status || 'Pending';
                    if (effectivePayStatus !== paymentStatusFilter) return false;
                }

                if (dateFrom) {
                    const fromTime = new Date(dateFrom + 'T00:00:00').getTime();
                    if (new Date(r.created_at).getTime() < fromTime) return false;
                }
                if (dateTo) {
                    const toTime = new Date(dateTo + 'T23:59:59').getTime();
                    if (new Date(r.created_at).getTime() > toTime) return false;
                }

                if (searchQuery.trim()) {
                    const q = searchQuery.trim().toLowerCase();
                    const matchName = (r.full_name || '').toLowerCase().includes(q);
                    const matchPhone = (r.phone || '').toLowerCase().includes(q);
                    const matchEmail = (r.email || '').toLowerCase().includes(q);
                    const matchEvent = (r.outreach_event || '').toLowerCase().includes(q);
                    const matchRegNo = (r.student_reg_no || '').toLowerCase().includes(q);
                    if (!matchName && !matchPhone && !matchEmail && !matchEvent && !matchRegNo) return false;
                }

                return true;
            })
            .sort((a, b) => {
                let cmp = 0;
                if (sortBy === 'created_at') {
                    cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                } else if (sortBy === 'full_name') {
                    cmp = (a.full_name || '').localeCompare(b.full_name || '');
                } else if (sortBy === 'course_interest') {
                    cmp = (a.course_interest || '').localeCompare(b.course_interest || '');
                } else if (sortBy === 'status') {
                    cmp = (a.status || '').localeCompare(b.status || '');
                }
                return sortOrder === 'asc' ? cmp : -cmp;
            });
    }, [sievedRegistrations, statusFilter, courseFilter, paymentStatusFilter, section8Drafts, dateFrom, dateTo, searchQuery, sortBy, sortOrder]);

    const updateLiveCourseFallbackRecord = async (id: string, patch: Partial<OutreachRegistrationRecord>) => {
        try {
            const { data: courseRow } = await supabaseClient
                .from('courses')
                .select('id, status, sections')
                .eq('id', id)
                .single();

            if (courseRow && courseRow.sections) {
                const currentRecord = courseRow.sections.outreach_record || {};
                const nextRecord = { ...currentRecord, ...patch };
                const updateBody: Record<string, any> = {
                    sections: {
                        ...courseRow.sections,
                        is_outreach_registration: true,
                        outreach_record: nextRecord
                    }
                };
                if (patch.status) {
                    updateBody.status = patch.status;
                }
                await supabaseClient
                    .from('courses')
                    .update(updateBody)
                    .eq('id', id);
            }
        } catch {
            // ignore fallback update error
        }
    };

    const handleStatusChange = async (id: string, newStatus: OutreachRegistrationRecord['status']) => {
        setRegistrations(prev =>
            prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
        );
        try {
            await Promise.all([
                updateLiveCourseFallbackRecord(id, { status: newStatus }),
                supabaseClient
                    .from('outreach_registrations')
                    .update({ status: newStatus })
                    .eq('id', id)
            ]);
        } catch (err) {
            console.error('Failed to update status:', err);
            fetchRegistrations(true);
        }
    };

    const updateSection8Field = (id: string, key: keyof Section8Draft, value: string) => {
        setSection8Drafts(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || {
                    approved_by: APPROVER_PRESETS[0],
                    approver_position: POSITION_PRESETS[0],
                    assigned_instructor: INSTRUCTOR_CLASS_PRESETS[0],
                    confirmed_schedule: '',
                    admin_payment_status: 'Pending',
                    admin_signature_date: new Date().toISOString().split('T')[0],
                    admin_notes: ''
                }),
                [key]: value
            }
        }));
    };

    const handleSaveSection8 = async (id: string) => {
        const draft = section8Drafts[id];
        if (!draft) return;

        setSavingSection8Id(id);
        const patch: Partial<OutreachRegistrationRecord> = {
            approved_by: draft.approved_by,
            approver_position: draft.approver_position,
            assigned_instructor: draft.assigned_instructor,
            confirmed_schedule: draft.confirmed_schedule,
            admin_payment_status: draft.admin_payment_status,
            admin_signature_date: draft.admin_signature_date,
            admin_notes: draft.admin_notes
        };

        try {
            await Promise.all([
                updateLiveCourseFallbackRecord(id, patch),
                supabaseClient
                    .from('outreach_registrations')
                    .update(patch)
                    .eq('id', id)
            ]);

            setRegistrations(prev =>
                prev.map(r => (r.id === id ? { ...r, ...patch } : r))
            );
            setSavedSection8Id(id);
            setTimeout(() => {
                setSavedSection8Id(prev => (prev === id ? null : prev));
            }, 2500);
        } catch (err) {
            console.error('Error saving Section 8 official record:', err);
        } finally {
            setSavingSection8Id(null);
        }
    };

    const openConvertModal = (lead: OutreachRegistrationRecord) => {
        setConvertingLead(lead);
        setConvertName(lead.full_name);
        const fallbackEmail =
            lead.email ||
            `${lead.full_name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '')}.${lead.phone.slice(-4)}@student.welile.com`;
        setConvertEmail(fallbackEmail);
        setConvertPhone(lead.phone);
        const matchedCourse = courses.find(
            c => c.title.toLowerCase() === (lead.course_interest || '').toLowerCase()
        );
        setConvertCourseId(matchedCourse ? matchedCourse.id : courses[0]?.id || '');
        setConvertRole('INDIVIDUAL');
        setConvertFeedback(null);
    };

    const handleConvertToStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!convertingLead) return;

        setIsConverting(true);
        setConvertFeedback(null);
        try {
            const cleanEmail = convertEmail.trim().toLowerCase();
            let profileId: string | null = null;

            const { data: existingProfiles } = await supabaseClient
                .from('profiles')
                .select('id, email')
                .eq('email', cleanEmail);

            if (existingProfiles && existingProfiles.length > 0) {
                profileId = existingProfiles[0].id;
                await supabaseClient
                    .from('profiles')
                    .update({
                        full_name: convertName.trim(),
                        role: convertRole
                    })
                    .eq('id', profileId);
            } else {
                const newId =
                    typeof crypto !== 'undefined' && crypto.randomUUID
                        ? crypto.randomUUID()
                        : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`;

                const { data: insertedProf, error: insertProfErr } = await supabaseClient
                    .from('profiles')
                    .insert([
                        {
                            id: newId,
                            full_name: convertName.trim(),
                            email: cleanEmail,
                            role: convertRole,
                            bio: `Converted from Outreach Registration (${convertingLead.outreach_event || convertingLead.how_heard || 'Direct'}) • Reg No: ${convertingLead.student_reg_no || 'N/A'} • Phone: ${convertPhone}`
                        }
                    ])
                    .select('id')
                    .single();

                if (!insertProfErr && insertedProf) {
                    profileId = insertedProf.id;
                }
            }

            if (profileId && convertCourseId) {
                const { data: existingEnr } = await supabaseClient
                    .from('enrollments')
                    .select('id')
                    .eq('user_id', profileId)
                    .eq('course_id', convertCourseId);

                if (!existingEnr || existingEnr.length === 0) {
                    await supabaseClient.from('enrollments').insert({
                        user_id: profileId,
                        course_id: convertCourseId,
                        status: 'IN_PROGRESS',
                        progress: 0
                    });
                }
            }

            const rawRegNo = convertingLead.student_reg_no || '';
            const confirmedRegNo = rawRegNo.startsWith('Pending (')
                ? rawRegNo.replace(/^Pending \((.+)\)$/, '$1')
                : rawRegNo || `WSI/11/26/${String(Math.floor(100 + Math.random() * 900))}`;

            const updatePayload: Record<string, any> = {
                status: 'ENROLLED',
                student_reg_no: confirmedRegNo
            };
            if (profileId) {
                updatePayload.converted_profile_id = profileId;
            }

            await Promise.all([
                updateLiveCourseFallbackRecord(convertingLead.id, updatePayload),
                supabaseClient
                    .from('outreach_registrations')
                    .update(updatePayload)
                    .eq('id', convertingLead.id)
            ]);

            setRegistrations(prev =>
                prev.map(r =>
                    r.id === convertingLead.id
                        ? { ...r, status: 'ENROLLED', student_reg_no: confirmedRegNo, converted_profile_id: profileId }
                        : r
                )
            );

            window.dispatchEvent(new Event('profile-update'));
            window.dispatchEvent(new Event('courses-update'));

            setConvertFeedback({
                type: 'success',
                message: `${convertName} has been converted to an enrolled student account!`
            });

            setTimeout(() => {
                setConvertingLead(null);
                setConvertFeedback(null);
            }, 1400);
        } catch (err: any) {
            console.error('Error converting lead to student:', err);
            setConvertFeedback({
                type: 'error',
                message: err?.message || 'Could not convert lead. Please verify database permissions.'
            });
        } finally {
            setIsConverting(false);
        }
    };

    const handleExportCSV = () => {
        const headers = [
            'Student Reg No',
            'Registration Date',
            'Outreach Campaign / Channel',
            'Registered By (Staff / Mobilizer Audit)',
            'Registration Mode',
            'Device Audit ID',
            'Device Info',
            'Full Name',
            'Phone',
            'Email',
            'Class / Level / Year',
            'Age Range',
            'Location',
            'Parent/Guardian Name',
            'Parent/Guardian Phone',
            'Course / Programme',
            'Official Monthly Rate',
            'Assigned Level',
            'Mode of Study',
            'Expected Start Date',
            'Expected Completion Date',
            'Preferred Study Days',
            'Chosen Study Time',
            'Study Hours/Session',
            'Sessions/Week',
            'Alternative Study Time',
            'Total Course Fee (UGX)',
            'Registration Fee',
            'Amount Paid (UGX)',
            'Outstanding Balance (UGX)',
            'Payment Plan',
            'Agreed Payment Amount (UGX)',
            'Next Payment Date',
            'Payment Due Date',
            'Payment Method',
            'Payment Reference',
            'Student Signature',
            'Declaration Date',
            'Guardian Signature',
            'Status',
            'Approved By (Sec 8)',
            'Approver Position (Sec 8)',
            'Assigned Class/Instructor (Sec 8)',
            'Confirmed Schedule (Sec 8)',
            'Admin Payment Status (Sec 8)',
            'Admin Remarks (Sec 8)',
            'Submitted At'
        ];

        const escapeCsv = (val: any) => {
            if (val === null || val === undefined) return '""';
            const str = Array.isArray(val) ? val.join('; ') : String(val);
            return `"${str.replace(/"/g, '""')}"`;
        };

        const rows = filteredRegistrations.map(r => {
            const s8 = section8Drafts[r.id];
            const pricing = getCoursePricing(r.course_interest);
            return [
                escapeCsv(r.student_reg_no || 'WSI/11/26/—'),
                escapeCsv(r.registration_date || (r.created_at ? r.created_at.split('T')[0] : '')),
                escapeCsv(r.outreach_event),
                escapeCsv(getEffectiveRegistrar(r)),
                escapeCsv(r.registration_mode || (isSelfRegistered(r) ? 'Student Self-Registration' : 'Staff Assisted')),
                escapeCsv(r.device_audit_id || 'DEV-WEB'),
                escapeCsv(r.device_info || 'Web Browser'),
                escapeCsv(r.full_name),
                escapeCsv(r.phone),
                escapeCsv(r.email),
                escapeCsv(r.class_level_year),
                escapeCsv(r.age_range),
                escapeCsv(r.location),
                escapeCsv(r.guardian_name),
                escapeCsv(r.guardian_phone),
                escapeCsv(r.course_interest),
                escapeCsv(r.course_fee_display || pricing.displayFee),
                escapeCsv(r.level),
                escapeCsv(r.mode_preference),
                escapeCsv(r.expected_start_date),
                escapeCsv(r.expected_completion_date),
                escapeCsv(r.preferred_study_days),
                escapeCsv(r.preferred_time_slot),
                escapeCsv(r.study_hours_per_session),
                escapeCsv(r.sessions_per_week),
                escapeCsv(r.alternative_study_time),
                escapeCsv(r.total_course_fee ?? pricing.ugxPerMonth),
                escapeCsv(r.registration_fee || 'Not Applicable'),
                escapeCsv(r.amount_paid ?? 0),
                escapeCsv(r.outstanding_balance ?? pricing.ugxPerMonth),
                escapeCsv(r.payment_plan),
                escapeCsv(r.agreed_payment_amount ?? pricing.ugxPerMonth),
                escapeCsv(r.next_payment_date),
                escapeCsv(r.payment_due_date),
                escapeCsv(r.payment_method),
                escapeCsv(r.payment_reference),
                escapeCsv(r.student_signature),
                escapeCsv(r.student_declaration_date),
                escapeCsv(r.guardian_signature),
                escapeCsv(r.status),
                escapeCsv(s8?.approved_by || r.approved_by),
                escapeCsv(s8?.approver_position || r.approver_position),
                escapeCsv(s8?.assigned_instructor || r.assigned_instructor),
                escapeCsv(s8?.confirmed_schedule || r.confirmed_schedule),
                escapeCsv(s8?.admin_payment_status || r.admin_payment_status),
                escapeCsv(s8?.admin_notes || r.admin_notes),
                escapeCsv(r.created_at ? new Date(r.created_at).toISOString() : '')
            ];
        });

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const sieveSlug = dashboardSieve === 'ALL' ? 'all' : dashboardSieve.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        a.download = `welile-registrations-${sieveSlug}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getPublicRegisterUrl = () => {
        const { protocol, host } = window.location;
        const cleanHost = host
            .replace('admin.', '')
            .replace('instructor.', '')
            .replace(':4001', ':4002');
        const base = `${protocol}//${cleanHost}/register`;
        const params = new URLSearchParams();
        if (qrEventName.trim()) {
            params.set('event', qrEventName.trim());
        }
        if (qrStaffName.trim()) {
            params.set('staff', qrStaffName.trim());
        }
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
    };

    const publicRegisterUrl = getPublicRegisterUrl();
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(publicRegisterUrl)}`;

    const handleSortToggle = (column: typeof sortBy) => {
        if (sortBy === column) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const defaultCampaign = campaigns.find(c => c.is_default) || campaigns[0];
    const selectedDrawerRecord = useMemo(
        () => registrations.find(r => r.id === expandedRowId) || null,
        [registrations, expandedRowId]
    );

    const buildWhatsAppFollowUpUrl = (reg: OutreachRegistrationRecord) => {
        const cleanDigits = (reg.phone || '').replace(/\D/g, '');
        const intlPhone = cleanDigits.startsWith('0')
            ? `256${cleanDigits.slice(1)}`
            : cleanDigits.startsWith('256')
            ? cleanDigits
            : `256${cleanDigits}`;
        const firstName = (reg.full_name || 'Student').split(' ')[0];
        const pricing = getCoursePricing(reg.course_interest);
        const msg = `Hello ${firstName}, this is Welile School of AI (Katabi, Entebbe) following up on your provisional registration (${reg.student_reg_no || 'WSI'}) for *${reg.course_interest}* (${pricing.displayFee}). Would you like to confirm your study slot and preferred schedule (${(reg.preferred_study_days || []).join(', ') || 'Mon, Wed, Fri'} • ${reg.preferred_time_slot || 'Morning/Afternoon'}) for the upcoming cohort?`;
        return `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
    };

    return (
        <div className="space-y-5">
            {/* Top CRM Header Bar */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
                            Admissions & Outreach Follow-Up CRM
                        </h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Supabase Sync
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50">
                            Provisional Pre-Registration → Follow-Up → Confirmed Student
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        Outreach registrations are <strong className="text-gray-700 dark:text-slate-200">provisional seat reservations</strong> until confirmed via follow-up call/WhatsApp • Active Booth:{' '}
                        <span className="font-semibold text-violet-600 dark:text-violet-400">
                            {defaultCampaign?.name}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowLaunchControlModal(true)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                            websiteButtonVisible
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-900 dark:bg-white text-white dark:text-slate-950 border-gray-900 dark:border-white hover:opacity-90'
                        }`}
                        title="Activate or Hide the Public Website Outreach Button, Configure Active Outreach & Assign Mobilizers"
                    >
                        <span className={`w-2 h-2 rounded-full ${websiteButtonVisible ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
                        {websiteButtonVisible ? 'Website Outreach: LIVE (Manage)' : 'Activate Outreach & Website Button'}
                    </button>

                    <button
                        type="button"
                        onClick={() => fetchRegistrations()}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Refresh Live Database"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowStaffModal(true)}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                        Staff Roster ({staffRoster.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCampaignModal(true)}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Megaphone size={14} className="text-amber-600 dark:text-amber-400" />
                        Outreaches ({campaigns.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <QrCode size={14} className="text-violet-600 dark:text-violet-400" />
                        Booth QR
                    </button>

                    <button
                        type="button"
                        onClick={handleExportCSV}
                        className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                        <Download size={14} />
                        Export CSV ({filteredRegistrations.length})
                    </button>
                </div>
            </div>

            {/* 4 Sleek Attio/Linear KPI Cards (Dynamically Sieved) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => setStatusFilter(statusFilter === 'NEW' ? 'ALL' : 'NEW')}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 border-l-4 border-l-amber-500 cursor-pointer hover:border-amber-400 transition-all"
                >
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
                        <span>1. Pre-Registered Leads</span>
                        <Users size={15} className="text-amber-500" />
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{kpis.total}</span>
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {kpis.awaitingFollowUpCount} awaiting follow-up
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                        +{kpis.newThisWeek} captured this week • Click to filter uncontacted
                    </p>
                </div>

                <div
                    onClick={() => setStatusFilter(statusFilter === 'CONTACTED' ? 'ALL' : 'CONTACTED')}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 border-l-4 border-l-blue-500 cursor-pointer hover:border-blue-400 transition-all"
                >
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
                        <span>2. Follow-Up & Confirmation</span>
                        <Phone size={15} className="text-blue-500" />
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{kpis.followedUpCount}</span>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            in follow-up • {kpis.enrolledCount} confirmed ({kpis.conversionRate}%)
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                        Students confirm study & schedule during follow-up
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 border-l-4 border-l-violet-500">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
                        <span>3. Provisional Monthly Pipeline</span>
                        <BookOpen size={15} className="text-violet-500" />
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                            UGX {kpis.totalFeePipeline.toLocaleString()}
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 truncate" title={kpis.topCourse}>
                        If all {kpis.total} leads confirm • Top: {kpis.topCourse} ({kpis.topCourseCount})
                    </p>
                </div>

                <div
                    onClick={() => setStatusFilter(statusFilter === 'ENROLLED' ? 'ALL' : 'ENROLLED')}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 border-l-4 border-l-emerald-500 cursor-pointer hover:border-emerald-400 transition-all"
                >
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
                        <span>4. Confirmed & Paid Tuition</span>
                        <CreditCard size={15} className="text-emerald-500" />
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            UGX {kpis.totalCollectedFees.toLocaleString()}
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                        Pending on confirmation: UGX {kpis.totalOutstanding.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Single-Row Unified Command Filter & View Switcher Bar */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    {/* Left: Search + Sieve Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                        <div className="relative min-w-[220px] flex-1 max-w-xs">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search student, phone, WSI ref..."
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-violet-500"
                            />
                        </div>

                        {/* Campaign / Outreach Sieve */}
                        <select
                            value={dashboardSieve}
                            onChange={(e) => setDashboardSieve(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer max-w-[230px] truncate"
                            title="Sieve by Outreach Campaign"
                        >
                            <option value="ALL">All Channels ({sieveCounts.all})</option>
                            <option value="Nkumba University Outreach (Fri, 6th Nov 2026)">
                                ★ Nkumba Outreach ({sieveCounts.byEvent['Nkumba University Outreach (Fri, 6th Nov 2026)'] || 0})
                            </option>
                            <option value="OUTREACH_ONLY">All Outreaches ({sieveCounts.outreachOnly})</option>
                            <option value="GENERAL_ONLY">General / Walk-In ({sieveCounts.generalOnly})</option>
                            <optgroup label="Specific Campaigns">
                                {distinctEvents.map(ev => (
                                    <option key={ev} value={ev}>
                                        {ev} ({sieveCounts.byEvent[ev] || 0})
                                    </option>
                                ))}
                            </optgroup>
                        </select>

                        {/* Staff / Mobilizer Audit Sieve */}
                        <select
                            value={staffSieve}
                            onChange={(e) => setStaffSieve(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer max-w-[210px] truncate"
                            title="Audit by Staff / Mobilizer"
                        >
                            <option value="ALL">All Registrars ({sieveCounts.all})</option>
                            <option value="STAFF_ONLY">👤 Staff-Assisted ({sieveCounts.staffAssisted})</option>
                            <option value="SELF_ONLY">🎓 Self-Registered ({sieveCounts.selfService})</option>
                            <optgroup label="Staff & Mobilizers">
                                {distinctStaff.map(stf => (
                                    <option key={stf} value={stf}>
                                        {stf} ({sieveCounts.byStaff[stf] || 0})
                                    </option>
                                ))}
                            </optgroup>
                        </select>

                        {/* Confirmation Stage Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                            title="Filter by Follow-Up Confirmation Stage"
                        >
                            <option value="ALL">All Stages ({sievedRegistrations.length})</option>
                            {STATUS_OPTIONS.map(st => (
                                <option key={st} value={st}>
                                    {STATUS_STAGE_LABELS[st]}
                                </option>
                            ))}
                        </select>

                        {/* Course Filter */}
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer max-w-[180px] truncate"
                        >
                            <option value="ALL">All 4 Courses</option>
                            {distinctCourses.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        {(dateFrom || dateTo || statusFilter !== 'ALL' || courseFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || dashboardSieve !== 'ALL' || staffSieve !== 'ALL' || searchQuery) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setDashboardSieve('ALL');
                                    setStaffSieve('ALL');
                                    setStatusFilter('ALL');
                                    setPaymentStatusFilter('ALL');
                                    setCourseFilter('ALL');
                                    setDateFrom('');
                                    setDateTo('');
                                    setSearchQuery('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Right: Workspace View Switcher Tabs */}
                    <div className="inline-flex items-center bg-gray-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200/70 dark:border-slate-800 shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveWorkspaceView('TABLE')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeWorkspaceView === 'TABLE'
                                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            📋 Pipeline Table ({filteredRegistrations.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveWorkspaceView('BOARD')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeWorkspaceView === 'BOARD'
                                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            🗂️ Follow-Up Board
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveWorkspaceView('ANALYTICS')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeWorkspaceView === 'ANALYTICS'
                                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            📊 Analytics & Courses
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveWorkspaceView('AUDIT')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeWorkspaceView === 'AUDIT'
                                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            🛡️ Staff Audit ({staffAuditLeaderboard.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* WORKSPACE VIEW 2: 4-COLUMN FOLLOW-UP KANBAN BOARD */}
            {activeWorkspaceView === 'BOARD' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {STATUS_OPTIONS.map((stage) => {
                        const stageLeads = filteredRegistrations.filter(r => r.status === stage);
                        return (
                            <div
                                key={stage}
                                className="bg-gray-50/80 dark:bg-slate-900/60 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-3.5 flex flex-col max-h-[72vh]"
                            >
                                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-200/70 dark:border-slate-800">
                                    <div>
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_BADGE_STYLES[stage]}`}>
                                            {STATUS_SHORT_LABELS[stage]}
                                        </span>
                                        <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
                                            {STATUS_STAGE_LABELS[stage]}
                                        </p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-slate-200">
                                        {stageLeads.length}
                                    </span>
                                </div>

                                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                                    {stageLeads.length === 0 ? (
                                        <div className="py-10 text-center text-xs text-gray-400 dark:text-slate-500">
                                            No leads in this stage
                                        </div>
                                    ) : (
                                        stageLeads.map(reg => {
                                            const pricing = getCoursePricing(reg.course_interest);
                                            const registrar = getEffectiveRegistrar(reg);
                                            return (
                                                <div
                                                    key={reg.id}
                                                    onClick={() => {
                                                        setExpandedRowId(reg.id);
                                                        setDrawerTab('CONFIRMATION');
                                                    }}
                                                    className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:border-violet-400 dark:hover:border-violet-600 transition-all cursor-pointer space-y-2"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="font-bold text-xs text-gray-900 dark:text-white">
                                                                {reg.full_name}
                                                            </div>
                                                            <div className="text-[11px] font-mono text-gray-500 dark:text-slate-400">
                                                                {reg.phone} • {reg.class_level_year || 'Student'}
                                                            </div>
                                                        </div>
                                                        <span className="font-mono text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 px-1.5 py-0.5 rounded">
                                                            {(reg.student_reg_no || 'WSI').replace(/^Pending \((.+)\)$/, '$1')}
                                                        </span>
                                                    </div>

                                                    <div className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 truncate">
                                                        {reg.course_interest} ({pricing.displayFee})
                                                    </div>

                                                    <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-800/80">
                                                        <span className="truncate max-w-[130px]" title={registrar}>
                                                            👤 {registrar}
                                                        </span>
                                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                            <a
                                                                href={buildWhatsAppFollowUpUrl(reg)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100"
                                                                title="Send WhatsApp Follow-Up to Confirm Seat"
                                                            >
                                                                WhatsApp
                                                            </a>
                                                            {stage === 'NEW' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStatusChange(reg.id, 'CONTACTED')}
                                                                    className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-100 cursor-pointer"
                                                                >
                                                                    Mark Followed Up
                                                                </button>
                                                            )}
                                                            {stage === 'CONTACTED' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openConvertModal(reg)}
                                                                    className="px-2 py-0.5 rounded bg-violet-600 text-white font-bold hover:bg-violet-700 cursor-pointer"
                                                                >
                                                                    Confirm
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* WORKSPACE VIEW 3: ANALYTICS & OFFICIAL COURSE CATALOG */}
            {activeWorkspaceView === 'ANALYTICS' && (
                <div className="space-y-5">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                                <BookOpen size={14} /> Official 4 Courses & Monthly Fee Structure (Click to Filter)
                            </h3>
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full">
                                No Upfront Payment Required at Outreach • Paid Upon Confirmation
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {OFFICIAL_COURSE_CATALOG.map((c, i) => {
                                const countForCourse = sievedRegistrations.filter(
                                    r => (r.course_interest || '').toLowerCase() === c.title.toLowerCase()
                                ).length;
                                return (
                                    <button
                                        key={c.title}
                                        type="button"
                                        onClick={() => {
                                            setCourseFilter(courseFilter === c.title ? 'ALL' : c.title);
                                            setActiveWorkspaceView('TABLE');
                                        }}
                                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                            courseFilter === c.title
                                                ? 'bg-violet-600 text-white border-violet-600'
                                                : 'bg-gray-50 dark:bg-slate-950/60 border-gray-200 dark:border-slate-800 hover:border-violet-400'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold truncate">
                                                {i + 1}. {c.title}
                                            </div>
                                            <div className={`text-[11px] font-semibold mt-0.5 ${
                                                courseFilter === c.title ? 'text-violet-100' : 'text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                                {c.displayFee}
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold shrink-0 ${
                                            courseFilter === c.title
                                                ? 'bg-white/20 text-white'
                                                : 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                                        }`}>
                                            {countForCourse}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 lg:col-span-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Daily Registration Trend (Last 30 Days)
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                                Active Sieve: <span className="font-semibold text-violet-600 dark:text-violet-400">{dashboardSieve}</span>
                            </p>
                            <div className="h-52 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyTrendData} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="welilePurpleGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.35} />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={4} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderColor: '#334155',
                                                borderRadius: '12px',
                                                color: '#f8fafc',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            name="Registrations"
                                            stroke="#a855f7"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#welilePurpleGrad)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 lg:col-span-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Registrations by Outreach Campaign / Channel
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                                Compare Nkumba Outreach (Fri 6th Nov) against other outreaches & walk-ins
                            </p>
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={outreachBreakdownData} margin={{ top: 5, right: 16, left: -20, bottom: 25 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.35} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-12} textAnchor="end" interval={0} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderColor: '#334155',
                                                borderRadius: '12px',
                                                color: '#f8fafc',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]}>
                                            {outreachBreakdownData.map((_, idx) => (
                                                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Preferred Payment Plan (When Confirmed)
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                                Monthly vs Weekly vs Full billing preference
                            </p>
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={paymentPlanChartData} layout="vertical" margin={{ top: 5, right: 16, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.35} />
                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderColor: '#334155',
                                                borderRadius: '12px',
                                                color: '#f8fafc',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Bar dataKey="count" name="Students" radius={[0, 8, 8, 0]}>
                                            {paymentPlanChartData.map((_, idx) => (
                                                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* WORKSPACE VIEW 4: STAFF & MOBILIZER ACCOUNTABILITY LEADERBOARD */}
            {activeWorkspaceView === 'AUDIT' && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Award size={16} className="text-emerald-600 dark:text-emerald-400" />
                                Staff & Mobilizer Registration Audit (Who Registered Whom)
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Click any staff member to filter the pipeline table to their captured registrations
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowStaffModal(true)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                        >
                            + Add Staff / Generate Staff QR
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {staffAuditLeaderboard.map((stf) => (
                            <div
                                key={stf.staffName}
                                onClick={() => {
                                    setStaffSieve(staffSieve === stf.staffName ? 'ALL' : stf.staffName);
                                    setActiveWorkspaceView('TABLE');
                                }}
                                className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                    staffSieve === stf.staffName
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-gray-50 dark:bg-slate-950/60 border-gray-200 dark:border-slate-800 hover:border-emerald-400'
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="font-bold truncate flex items-center gap-1.5">
                                        <span>{stf.staffName}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                            staffSieve === stf.staffName
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                                        }`}>
                                            {stf.role}
                                        </span>
                                    </div>
                                    <div className={`text-[11px] mt-1 ${
                                        staffSieve === stf.staffName ? 'text-emerald-100' : 'text-gray-500 dark:text-slate-400'
                                    }`}>
                                        Devices: {stf.deviceList.length > 0 ? stf.deviceList.join(', ') : 'Web'} • Deposits: UGX {stf.collectedUgx.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="font-extrabold text-base">{stf.total}</span>
                                    <span className="block text-[10px] opacity-80">{stf.enrolled} confirmed</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* WORKSPACE VIEW 1 (DEFAULT): HIGH-DENSITY PIPELINE TABLE */}
            <div className={`${activeWorkspaceView === 'TABLE' ? 'block' : 'hidden'} bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 overflow-hidden transition-colors`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/80 dark:bg-slate-950/60">
                            <tr className="text-gray-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-200/80 dark:border-slate-800">
                                <th className="py-3 px-4">Ref / Date</th>
                                <th
                                    onClick={() => handleSortToggle('full_name')}
                                    className="py-3 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                                >
                                    Student & Contact {sortBy === 'full_name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th
                                    onClick={() => handleSortToggle('course_interest')}
                                    className="py-3 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                                >
                                    Selected Course & Schedule {sortBy === 'course_interest' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-4">Tuition & Plan</th>
                                <th className="py-3 px-4">Outreach & Registrar</th>
                                <th
                                    onClick={() => handleSortToggle('status')}
                                    className="py-3 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                                >
                                    Confirmation Stage {sortBy === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-4 text-right">Follow-Up & Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
                                        Loading live outreach registrations...
                                    </td>
                                </tr>
                            ) : filteredRegistrations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-slate-400">
                                        No student registrations match your current sieve or search filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRegistrations.map((reg) => {
                                    const isSelected = expandedRowId === reg.id;
                                    const coursePricing = getCoursePricing(reg.course_interest);
                                    const effectiveFee = Number(reg.total_course_fee ?? coursePricing.ugxPerMonth);
                                    const paidAmt = Number(reg.amount_paid ?? 0);
                                    const registrarName = getEffectiveRegistrar(reg);
                                    const cleanRef = (reg.student_reg_no || 'WSI/11/26/—').replace(/^Pending \((.+)\)$/, '$1');
                                    const s8 = section8Drafts[reg.id] || {
                                        approved_by: reg.approved_by || APPROVER_PRESETS[0],
                                        approver_position: reg.approver_position || POSITION_PRESETS[0],
                                        assigned_instructor: reg.assigned_instructor || INSTRUCTOR_CLASS_PRESETS[0],
                                        confirmed_schedule: reg.confirmed_schedule || `${(reg.preferred_study_days || []).join(', ')} • ${reg.preferred_time_slot || ''}`,
                                        admin_payment_status: reg.admin_payment_status || 'Pending',
                                        admin_signature_date: reg.admin_signature_date || new Date().toISOString().split('T')[0],
                                        admin_notes: reg.admin_notes || ''
                                    };

                                    return (
                                        <tr
                                            key={reg.id}
                                            onClick={() => setExpandedRowId(reg.id)}
                                            className={`transition-colors cursor-pointer ${
                                                isSelected
                                                    ? 'bg-violet-50/70 dark:bg-violet-950/30'
                                                    : 'hover:bg-gray-50/80 dark:hover:bg-slate-800/40'
                                            }`}
                                        >
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="font-mono text-[11px] font-bold text-violet-700 dark:text-violet-300">
                                                    {cleanRef}
                                                </div>
                                                <div className="text-[10px] text-gray-400 dark:text-slate-500">
                                                    {reg.registration_date || (reg.created_at ? reg.created_at.split('T')[0] : '')} •{' '}
                                                    {reg.status === 'ENROLLED' ? 'Confirmed ID' : 'Provisional'}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                    <span>{reg.full_name}</span>
                                                    {reg.age_range === 'Under 18' && (
                                                        <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded text-[10px] font-semibold">
                                                            Under 18
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                                    <span className="font-mono font-semibold text-gray-700 dark:text-slate-300">{reg.phone}</span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[160px]">{reg.class_level_year || reg.location || reg.email || '—'}</span>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="font-bold text-gray-900 dark:text-white max-w-[200px] truncate" title={reg.course_interest}>
                                                    {reg.course_interest}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-slate-400">
                                                    {(reg.preferred_study_days || []).join(', ') || 'Mon, Wed, Fri'} • {reg.preferred_time_slot || reg.mode_preference || 'Hybrid'}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {coursePricing.displayFee}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-slate-400">
                                                    {paidAmt > 0 ? (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            Paid: UGX {paidAmt.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span>UGX 0 at booth • Pay on confirm ({reg.payment_plan || 'Monthly'})</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="text-[11px] font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[185px]" title={reg.outreach_event || 'General'}>
                                                    {reg.outreach_event || 'General / Direct'}
                                                </div>
                                                <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                                    <UserCheck size={11} className="shrink-0" />
                                                    <span className="truncate max-w-[165px]">{registrarName}</span>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={reg.status}
                                                    onChange={(e) =>
                                                        handleStatusChange(
                                                            reg.id,
                                                            e.target.value as OutreachRegistrationRecord['status']
                                                        )
                                                    }
                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none ${
                                                        STATUS_BADGE_STYLES[reg.status] || STATUS_BADGE_STYLES.NEW
                                                    }`}
                                                >
                                                    {STATUS_OPTIONS.map(st => (
                                                        <option key={st} value={st} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                                                            {STATUS_SHORT_LABELS[st]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <div className="inline-flex items-center gap-1.5">
                                                    <a
                                                        href={buildWhatsAppFollowUpUrl(reg)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 font-semibold text-[11px] cursor-pointer"
                                                        title="Send Follow-Up WhatsApp Message to Confirm Seat"
                                                    >
                                                        WhatsApp
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedRowId(reg.id)}
                                                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer"
                                                    >
                                                        Inspect
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPrintingRecord({ ...reg, ...s8 })}
                                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 cursor-pointer"
                                                        title="Print Official 8-Section Form"
                                                    >
                                                        <Printer size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openConvertModal(reg)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[11px] inline-flex items-center gap-1 shadow-xs cursor-pointer"
                                                    >
                                                        <UserPlus size={12} />
                                                        {reg.status === 'ENROLLED' ? 'Enrolled' : 'Confirm'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RIGHT SLIDE-OVER STUDENT INSPECTOR & CONFIRMATION DRAWER */}
            {selectedDrawerRecord && (() => {
                const reg = selectedDrawerRecord;
                const coursePricing = getCoursePricing(reg.course_interest);
                const effectiveFee = Number(reg.total_course_fee ?? coursePricing.ugxPerMonth);
                const effectiveBal = Number(reg.outstanding_balance ?? Math.max(0, effectiveFee - Number(reg.amount_paid ?? 0)));
                const registrarName = getEffectiveRegistrar(reg);
                const s8 = section8Drafts[reg.id] || {
                    approved_by: reg.approved_by || APPROVER_PRESETS[0],
                    approver_position: reg.approver_position || POSITION_PRESETS[0],
                    assigned_instructor: reg.assigned_instructor || INSTRUCTOR_CLASS_PRESETS[0],
                    confirmed_schedule: reg.confirmed_schedule || `${(reg.preferred_study_days || []).join(', ')} • ${reg.preferred_time_slot || ''}`,
                    admin_payment_status: reg.admin_payment_status || 'Pending',
                    admin_signature_date: reg.admin_signature_date || new Date().toISOString().split('T')[0],
                    admin_notes: reg.admin_notes || ''
                };

                return (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                            onClick={() => setExpandedRowId(null)}
                        />
                        <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
                            {/* Drawer Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950/60">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-100/80 dark:bg-violet-950/70 px-2 py-0.5 rounded-md">
                                                {reg.student_reg_no || 'WSI/11/26/—'}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_BADGE_STYLES[reg.status]}`}>
                                                {STATUS_STAGE_LABELS[reg.status]}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mt-1.5">
                                            {reg.full_name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            {reg.course_interest} ({coursePricing.displayFee}) • {reg.class_level_year || reg.location || 'Student'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedRowId(null)}
                                        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Quick Follow-Up & Confirmation Bar */}
                                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-200/70 dark:border-slate-800">
                                    <a
                                        href={`tel:${reg.phone}`}
                                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-gray-50"
                                    >
                                        <Phone size={13} className="text-blue-600" /> Call {reg.phone}
                                    </a>
                                    <a
                                        href={buildWhatsAppFollowUpUrl(reg)}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => {
                                            if (reg.status === 'NEW') {
                                                handleStatusChange(reg.id, 'CONTACTED');
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                                    >
                                        💬 WhatsApp Follow-Up
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setPrintingRecord({ ...reg, ...s8 })}
                                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-gray-50"
                                    >
                                        <Printer size={13} /> Print 8-Sec PDF
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openConvertModal(reg)}
                                        className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
                                    >
                                        <UserPlus size={13} />
                                        {reg.status === 'ENROLLED' ? 'Update Enrollment' : 'Confirm & Enroll'}
                                    </button>
                                </div>

                                {/* Drawer Sub-Tabs */}
                                <div className="grid grid-cols-3 gap-1 bg-gray-200/70 dark:bg-slate-900 p-1 rounded-xl mt-4 text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setDrawerTab('CONFIRMATION')}
                                        className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                                            drawerTab === 'CONFIRMATION'
                                                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
                                                : 'text-gray-600 dark:text-slate-400'
                                        }`}
                                    >
                                        1. Follow-Up & Sec 8
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDrawerTab('OVERVIEW')}
                                        className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                                            drawerTab === 'OVERVIEW'
                                                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
                                                : 'text-gray-600 dark:text-slate-400'
                                        }`}
                                    >
                                        2. Sections 1–7 Details
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDrawerTab('AUDIT')}
                                        className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                                            drawerTab === 'AUDIT'
                                                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
                                                : 'text-gray-600 dark:text-slate-400'
                                        }`}
                                    >
                                        3. Staff & Device Audit
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Body */}
                            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
                                {drawerTab === 'CONFIRMATION' && (
                                    <div className="space-y-4">
                                        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200">
                                            <div className="font-bold text-xs mb-1">
                                                Follow-Up Confirmation Workflow
                                            </div>
                                            <p className="text-[11px] leading-relaxed">
                                                At outreach events, students reserve a provisional seat with <strong>UGX 0 upfront</strong>. Call or WhatsApp the student to confirm if they are ready to study, update their stage below, and save Section 8 endorsement.
                                            </p>
                                            <div className="mt-2.5 flex items-center gap-2">
                                                <span className="text-[11px] font-bold">Confirmation Stage:</span>
                                                <select
                                                    value={reg.status}
                                                    onChange={(e) =>
                                                        handleStatusChange(
                                                            reg.id,
                                                            e.target.value as OutreachRegistrationRecord['status']
                                                        )
                                                    }
                                                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-bold text-xs text-gray-900 dark:text-white cursor-pointer"
                                                >
                                                    {STATUS_OPTIONS.map(st => (
                                                        <option key={st} value={st}>{STATUS_STAGE_LABELS[st]}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                                                    <ShieldCheck size={14} /> Section 8: Official Administration Endorsement
                                                </h4>
                                                {savedSection8Id === reg.id && (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                        <CheckCircle2 size={13} /> Saved!
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block font-semibold text-gray-600 dark:text-slate-300 mb-1">
                                                        Registration Approved By
                                                    </label>
                                                    <select
                                                        value={s8.approved_by}
                                                        onChange={(e) => updateSection8Field(reg.id, 'approved_by', e.target.value)}
                                                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 font-semibold"
                                                    >
                                                        {APPROVER_PRESETS.map(ap => (
                                                            <option key={ap} value={ap}>{ap}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block font-semibold text-gray-600 dark:text-slate-300 mb-1">
                                                        Position
                                                    </label>
                                                    <select
                                                        value={s8.approver_position}
                                                        onChange={(e) => updateSection8Field(reg.id, 'approver_position', e.target.value)}
                                                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 font-semibold"
                                                    >
                                                        {POSITION_PRESETS.map(pos => (
                                                            <option key={pos} value={pos}>{pos}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <label className="block font-semibold text-gray-600 dark:text-slate-300 mb-1">
                                                        Assigned Cohort / Instructor
                                                    </label>
                                                    <select
                                                        value={s8.assigned_instructor}
                                                        onChange={(e) => updateSection8Field(reg.id, 'assigned_instructor', e.target.value)}
                                                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 font-semibold"
                                                    >
                                                        {INSTRUCTOR_CLASS_PRESETS.map(cls => (
                                                            <option key={cls} value={cls}>{cls}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block font-semibold text-gray-600 dark:text-slate-300 mb-1">
                                                        Confirmed Study Schedule
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={s8.confirmed_schedule}
                                                        onChange={(e) => updateSection8Field(reg.id, 'confirmed_schedule', e.target.value)}
                                                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 font-semibold"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block font-semibold text-gray-600 dark:text-slate-300 mb-1">
                                                        Official Payment Status
                                                    </label>
                                                    <select
                                                        value={s8.admin_payment_status}
                                                        onChange={(e) => updateSection8Field(reg.id, 'admin_payment_status', e.target.value)}
                                                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 font-bold"
                                                    >
                                                        {ADMIN_PAYMENT_STATUS_OPTIONS.map(st => (
                                                            <option key={st} value={st}>{st}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <label className="block font-semibold text-gray-600 dark:text-slate-300 mb-1">
                                                        Follow-Up Call Notes & Registrar Remarks
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        value={s8.admin_notes}
                                                        onChange={(e) => updateSection8Field(reg.id, 'admin_notes', e.target.value)}
                                                        placeholder="Record outcome of follow-up call, confirmed start date, or payment promise..."
                                                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveSection8(reg.id)}
                                                    disabled={savingSection8Id === reg.id}
                                                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                                                >
                                                    {savingSection8Id === reg.id ? (
                                                        <>
                                                            <Loader2 size={13} className="animate-spin" /> Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check size={13} /> Save Follow-Up & Section 8
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {drawerTab === 'OVERVIEW' && (
                                    <div className="space-y-3">
                                        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 space-y-1.5">
                                            <div className="font-bold uppercase text-[10px] text-violet-600 dark:text-violet-400">
                                                1. Student Information
                                            </div>
                                            <p><strong>Full Name:</strong> {reg.full_name}</p>
                                            <p><strong>Phone:</strong> {reg.phone} • <strong>Email:</strong> {reg.email || '—'}</p>
                                            <p><strong>Class / Level / Year:</strong> {reg.class_level_year || '—'} • <strong>Age:</strong> {reg.age_range || '18–24'}</p>
                                            <p><strong>Location:</strong> {reg.location || 'Entebbe / Kampala'}</p>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 space-y-1.5">
                                            <div className="font-bold uppercase text-[10px] text-violet-600 dark:text-violet-400">
                                                2 & 3. Course & Preferred Schedule
                                            </div>
                                            <p><strong>Programme:</strong> {reg.course_interest} ({coursePricing.displayFee})</p>
                                            <p><strong>Level & Mode:</strong> {reg.level || 'Beginner'} • {reg.mode_preference || 'Hybrid'}</p>
                                            <p><strong>Preferred Days & Time:</strong> {(reg.preferred_study_days || []).join(', ') || 'Mon, Wed, Fri'} • {reg.preferred_time_slot || '—'}</p>
                                            <p><strong>Tentative Dates:</strong> {reg.expected_start_date || '—'} to {reg.expected_completion_date || '—'}</p>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 space-y-1.5">
                                            <div className="font-bold uppercase text-[10px] text-violet-600 dark:text-violet-400">
                                                4, 5, 6 & 7. Provisional Fee Plan & Pledge
                                            </div>
                                            <p><strong>Monthly Course Fee:</strong> UGX {effectiveFee.toLocaleString()}</p>
                                            <p><strong>Paid at Booth:</strong> UGX {Number(reg.amount_paid ?? 0).toLocaleString()} • <strong>Balance on Confirmation:</strong> UGX {effectiveBal.toLocaleString()}</p>
                                            <p><strong>Preferred Billing Plan:</strong> {reg.payment_plan || 'Monthly'} via {reg.payment_method || 'Mobile Money'}</p>
                                            <p><strong>Digital Signature:</strong> <em>{reg.student_signature || reg.full_name}</em> ({reg.student_declaration_date || '—'})</p>
                                            {reg.guardian_name && (
                                                <p><strong>Guardian (Sec 7):</strong> {reg.guardian_name} ({reg.guardian_phone || '—'})</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {drawerTab === 'AUDIT' && (
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                                            <div className="font-bold uppercase text-[10px] text-emerald-700 dark:text-emerald-400">
                                                Staff & Device Provenance Audit
                                            </div>
                                            <p><strong>Registered By:</strong> {registrarName} ({reg.registered_by_role || 'Outreach Capture'})</p>
                                            <p><strong>Capture Mode:</strong> {reg.registration_mode || 'Staff Assisted (Booth/Field)'}</p>
                                            <p><strong>Outreach Channel:</strong> {reg.outreach_event || 'General'}</p>
                                            <p><strong>Device Fingerprint:</strong> <span className="font-mono">{reg.device_audit_id || 'DEV-WEB'}</span> ({reg.device_info || 'Web Browser'})</p>
                                            <p><strong>Submitted Timestamp:</strong> {reg.created_at ? new Date(reg.created_at).toLocaleString() : '—'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}


            {/* MANAGE OUTREACH CAMPAIGNS & DROPDOWNS MODAL */}
            {showCampaignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCampaignModal(false)}
                    />
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative z-10 text-gray-900 dark:text-white max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setShowCampaignModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Megaphone size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Manage Outreach Campaigns & Registration Dropdowns</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Outreaches created here immediately populate the dropdown on <code className="font-mono">/register</code> and the dashboard stats sieve.
                                </p>
                            </div>
                        </div>

                        {/* Add New Outreach Campaign Form */}
                        <form onSubmit={handleAddCampaign} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3 mb-5">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                                <Plus size={14} /> Create New Outreach / Registration Channel
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                        Outreach / Campaign Name (Shown in Dropdown)*
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newCampaignName}
                                        onChange={(e) => setNewCampaignName(e.target.value)}
                                        placeholder="e.g., Uganda Martyrs University Outreach (Fri, 13th Nov 2026)"
                                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                        Event Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newCampaignDate}
                                        onChange={(e) => setNewCampaignDate(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                        Location / Venue
                                    </label>
                                    <input
                                        type="text"
                                        value={newCampaignLocation}
                                        onChange={(e) => setNewCampaignLocation(e.target.value)}
                                        placeholder="e.g., Nkumba University, Entebbe"
                                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                        Sieve Category
                                    </label>
                                    <select
                                        value={newCampaignCategory}
                                        onChange={(e) => setNewCampaignCategory(e.target.value as 'OUTREACH' | 'GENERAL')}
                                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                                    >
                                        <option value="OUTREACH">OUTREACH (Campus / Field Event)</option>
                                        <option value="GENERAL">GENERAL (Website / Walk-in)</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-4">
                                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newCampaignIsDefault}
                                            onChange={(e) => setNewCampaignIsDefault(e.target.checked)}
                                            className="w-4 h-4 accent-violet-600 rounded"
                                        />
                                        Set as Default Pre-selected on /register
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end pt-1">
                                <button
                                    type="submit"
                                    disabled={savingCampaigns}
                                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus size={14} /> Add to Outreach Dropdown
                                </button>
                            </div>
                        </form>

                        {/* Existing Campaigns List */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                Active Dropdown Options ({campaigns.length})
                            </h4>
                            {campaigns.map((camp) => (
                                <div
                                    key={camp.name}
                                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                        camp.is_default
                                            ? 'bg-violet-50/70 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800'
                                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-xs text-gray-900 dark:text-white">
                                                {camp.name}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                camp.category === 'OUTREACH'
                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                            }`}>
                                                {camp.category}
                                            </span>
                                            {camp.is_default && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                                                    <Star size={10} className="fill-current" /> Default Active on Form
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                                            Date: {camp.event_date} • Location: {camp.location} • Leads: {sieveCounts.byEvent[camp.name] || 0}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {!camp.is_default && (
                                            <button
                                                type="button"
                                                onClick={() => handleSetDefaultCampaign(camp.name)}
                                                className="px-2.5 py-1.5 rounded-lg border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-[11px] font-bold hover:bg-violet-50 cursor-pointer"
                                            >
                                                Set Default
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQrEventName(camp.name);
                                                setShowCampaignModal(false);
                                                setShowQrModal(true);
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-[11px] font-bold hover:bg-gray-100 cursor-pointer flex items-center gap-1"
                                        >
                                            <QrCode size={12} /> QR
                                        </button>
                                        {campaigns.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCampaign(camp.name)}
                                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                                                title="Remove Campaign"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* OFFICIAL 8-SECTION PRINTABLE FORM MODAL */}
            {printingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setPrintingRecord(null)}
                    />
                    <div className="bg-white text-gray-900 w-full max-w-3xl rounded-3xl p-8 shadow-2xl relative z-10 max-h-[92vh] overflow-y-auto border border-gray-200">
                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 print:hidden">
                            <h3 className="text-sm font-black uppercase tracking-wider text-violet-700">
                                Official Printable Form Preview (Sections 1 – 8)
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Printer size={14} /> Print / Save PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPrintingRecord(null)}
                                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Printable Document Content */}
                        <div className="space-y-4 text-xs leading-relaxed">
                            <div className="text-center border-b-2 border-gray-900 pb-3">
                                <h1 className="text-lg font-black uppercase tracking-wide">WELILE SCHOOL OF AI</h1>
                                <p className="text-xs font-semibold text-gray-600">Katabi, Entebbe, Uganda</p>
                                <h2 className="text-sm font-extrabold uppercase mt-1 text-violet-800">
                                    STUDENT REGISTRATION, STUDY SCHEDULE & PAYMENT AGREEMENT FORM
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <div><span className="font-bold block text-[10px] uppercase text-gray-500">Registration Date</span>{printingRecord.registration_date || (printingRecord.created_at ? printingRecord.created_at.split('T')[0] : '')}</div>
                                <div><span className="font-bold block text-[10px] uppercase text-gray-500">Student Reg No.</span><span className="font-mono font-bold">{printingRecord.student_reg_no || 'WSI/11/26/001'}</span></div>
                                <div><span className="font-bold block text-[10px] uppercase text-gray-500">Course / Programme</span>{printingRecord.course_interest}</div>
                                <div><span className="font-bold block text-[10px] uppercase text-gray-500">Assigned Level</span>{printingRecord.level || 'Intermediate'}</div>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-3.5">
                                <h3 className="font-black uppercase text-xs border-b border-gray-200 pb-1 mb-2">1. STUDENT INFORMATION</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <p><strong>Full Name:</strong> {printingRecord.full_name}</p>
                                    <p><strong>Email Address:</strong> {printingRecord.email || '—'}</p>
                                    <p><strong>Phone Number:</strong> {printingRecord.phone}</p>
                                    <p><strong>Class / Level / Year:</strong> {printingRecord.class_level_year || '—'}</p>
                                    <p><strong>Parent / Guardian Name:</strong> {printingRecord.guardian_name || 'N/A'}</p>
                                    <p><strong>Parent / Guardian Contact:</strong> {printingRecord.guardian_phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-3.5">
                                <h3 className="font-black uppercase text-xs border-b border-gray-200 pb-1 mb-2">2. COURSE & PROGRAMME INFORMATION</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <p><strong>Course / Programme:</strong> {printingRecord.course_interest}</p>
                                    <p><strong>Level:</strong> {printingRecord.level || 'Intermediate'}</p>
                                    <p><strong>Mode of Study:</strong> {printingRecord.mode_preference || 'Hybrid'}</p>
                                    <p><strong>Outreach Campaign:</strong> {printingRecord.outreach_event || 'General'}</p>
                                    <p><strong>Expected Start Date:</strong> {printingRecord.expected_start_date || '—'}</p>
                                    <p><strong>Expected Completion Date:</strong> {printingRecord.expected_completion_date || '—'}</p>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-3.5">
                                <h3 className="font-black uppercase text-xs border-b border-gray-200 pb-1 mb-2">3. STUDY SCHEDULE</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <p><strong>Preferred Study Days:</strong> {(printingRecord.preferred_study_days || []).join(', ')}</p>
                                    <p><strong>Chosen Study Time:</strong> {printingRecord.preferred_time_slot || '—'}</p>
                                    <p><strong>Study Hours Per Session:</strong> {printingRecord.study_hours_per_session || '2 Hours'}</p>
                                    <p><strong>Number of Sessions Per Week:</strong> {printingRecord.sessions_per_week || '3 Sessions / Week'}</p>
                                    <p className="col-span-2"><strong>Alternative Study Time:</strong> {printingRecord.alternative_study_time || '—'}</p>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-3.5">
                                <h3 className="font-black uppercase text-xs border-b border-gray-200 pb-1 mb-2">4. FEES & PAYMENT AGREEMENT</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <p><strong>Total Course Fee:</strong> UGX {Number(printingRecord.total_course_fee ?? 600000).toLocaleString()}</p>
                                    <p><strong>Registration Fee:</strong> {printingRecord.registration_fee || 'Not Applicable'}</p>
                                    <p><strong>Amount Paid:</strong> UGX {Number(printingRecord.amount_paid ?? 0).toLocaleString()}</p>
                                    <p><strong>Outstanding Balance:</strong> UGX {Number(printingRecord.outstanding_balance ?? 600000).toLocaleString()}</p>
                                    <p><strong>Payment Plan:</strong> {printingRecord.payment_plan || 'Monthly'}</p>
                                    <p><strong>Agreed Payment Amount:</strong> UGX {Number(printingRecord.agreed_payment_amount ?? 0).toLocaleString()}</p>
                                    <p><strong>Next Payment Date:</strong> {printingRecord.next_payment_date || '—'}</p>
                                    <p><strong>Payment Due Date:</strong> {printingRecord.payment_due_date || '—'}</p>
                                    <p><strong>Payment Method:</strong> {printingRecord.payment_method || 'Mobile Money'}</p>
                                    <p><strong>Payment Ref / Receipt No.:</strong> {printingRecord.payment_reference || '—'}</p>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-3.5">
                                <h3 className="font-black uppercase text-xs border-b border-gray-200 pb-1 mb-2">5 & 6. STUDENT COMMITMENT & DECLARATION</h3>
                                <p className="mb-2 text-[11px] text-gray-700">
                                    I confirm that the information provided on this form is true and accurate. I agree to follow the study schedule, rules, and payment terms of Welile School of AI.
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <p><strong>Student Full Name:</strong> {printingRecord.full_name}</p>
                                    <p><strong>Signature:</strong> <em>{printingRecord.student_signature || printingRecord.full_name}</em></p>
                                    <p><strong>Date:</strong> {printingRecord.student_declaration_date || printingRecord.registration_date || '—'}</p>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-3.5">
                                <h3 className="font-black uppercase text-xs border-b border-gray-200 pb-1 mb-2">7. PARENT / GUARDIAN CONSENT</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <p><strong>Parent / Guardian Name:</strong> {printingRecord.guardian_name || 'N/A'}</p>
                                    <p><strong>Phone Number:</strong> {printingRecord.guardian_phone || 'N/A'}</p>
                                    <p><strong>Signature:</strong> <em>{printingRecord.guardian_signature || 'N/A'}</em></p>
                                    <p><strong>Date:</strong> {printingRecord.guardian_consent_date || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="border-2 border-gray-900 rounded-xl p-3.5 bg-gray-50">
                                <h3 className="font-black uppercase text-xs border-b border-gray-300 pb-1 mb-2">8. SCHOOL / ADMINISTRATION USE ONLY</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <p><strong>Registration Approved By:</strong> {printingRecord.approved_by || '—'}</p>
                                    <p><strong>Position:</strong> {printingRecord.approver_position || '—'}</p>
                                    <p><strong>Assigned Class / Instructor:</strong> {printingRecord.assigned_instructor || '—'}</p>
                                    <p><strong>Confirmed Study Schedule:</strong> {printingRecord.confirmed_schedule || '—'}</p>
                                    <p><strong>Payment Status:</strong> {printingRecord.admin_payment_status || 'Pending'}</p>
                                    <p><strong>Admin Signature & Date:</strong> {printingRecord.admin_signature_date || '—'}</p>
                                    <p><strong>Registered By (Staff Audit):</strong> {printingRecord.registered_by_staff || 'Self-Registered (Student)'} ({printingRecord.registered_by_role || 'Student'})</p>
                                    <p><strong>Device Fingerprint:</strong> <span className="font-mono">{printingRecord.device_audit_id || 'N/A'}</span></p>
                                    <p className="col-span-2"><strong>Remarks:</strong> {printingRecord.admin_notes || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MANAGE OUTREACH STAFF & AUDIT ROSTER MODAL */}
            {showStaffModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowStaffModal(false)}
                    />
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 text-gray-900 dark:text-white animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setShowStaffModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold">Manage Staff & Mobilizer Audit Roster</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Staff added here appear in the &ldquo;Registered By (Staff Audit)&rdquo; dropdown on <code className="font-mono text-emerald-600 dark:text-emerald-400">/register</code> and can get personal QR attribution links.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleAddStaff} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950/70 border border-gray-200 dark:border-slate-800 space-y-3 mb-4">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                + Add New Staff / Mobilizer / Ambassador
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStaffName}
                                        onChange={(e) => setNewStaffName(e.target.value)}
                                        placeholder="e.g. Sarah Namukasa"
                                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Role / Title</label>
                                    <select
                                        value={newStaffRole}
                                        onChange={(e) => setNewStaffRole(e.target.value)}
                                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                    >
                                        <option value="COO">COO (Chief Operating Officer)</option>
                                        <option value="Outreach Mobilizer">Outreach Mobilizer</option>
                                        <option value="Lead Coordinator">Lead Coordinator</option>
                                        <option value="Admissions Officer">Admissions Officer</option>
                                        <option value="Campus Ambassador">Campus Ambassador</option>
                                        <option value="Instructor">Instructor</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="tel"
                                    value={newStaffPhone}
                                    onChange={(e) => setNewStaffPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Phone (Optional, max 10 digits)"
                                    maxLength={10}
                                    className="flex-1 p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                                >
                                    <Plus size={14} /> Add to Roster
                                </button>
                            </div>
                        </form>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {staffRoster.map(st => (
                                <div
                                    key={st.id}
                                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-extrabold text-gray-900 dark:text-white">{st.name}</span>
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                                {st.role}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                            ID: {st.id} {st.phone ? `• ${st.phone}` : ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQrStaffName(st.name);
                                                setShowStaffModal(false);
                                                setShowQrModal(true);
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-violet-100"
                                            title="Generate personal QR link for this staff member"
                                        >
                                            <QrCode size={12} /> Staff QR
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteStaff(st.id)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                            title="Remove from roster"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CONVERT TO STUDENT MODAL */}
            {convertingLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setConvertingLead(null)}
                    />
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 text-gray-900 dark:text-white animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setConvertingLead(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                                <UserPlus size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Convert Lead to Enrolled Student</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Creates/links student profile & enrolls them in their chosen course
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleConvertToStudent} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                                    Student Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={convertName}
                                    onChange={(e) => setConvertName(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                                        Student Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={convertEmail}
                                        onChange={(e) => setConvertEmail(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={convertPhone}
                                        onChange={(e) => setConvertPhone(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                                    Enroll in Course (Live Courses Table)
                                </label>
                                <select
                                    value={convertCourseId}
                                    onChange={(e) => setConvertCourseId(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                >
                                    <option value="">— Create Student Profile Only (No Course Yet) —</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.title}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Lead requested: <span className="font-semibold text-violet-500">{convertingLead.course_interest}</span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                                    Account Role
                                </label>
                                <select
                                    value={convertRole}
                                    onChange={(e) => setConvertRole(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                >
                                    <option value="INDIVIDUAL">Individual Learner (INDIVIDUAL)</option>
                                    <option value="CORPORATE">Corporate Sponsored (CORPORATE)</option>
                                </select>
                            </div>

                            {convertFeedback && (
                                <div
                                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                                        convertFeedback.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200'
                                            : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200'
                                    }`}
                                >
                                    <CheckCircle2 size={15} />
                                    {convertFeedback.message}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setConvertingLead(null)}
                                    className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-xs font-bold text-gray-600 dark:text-slate-300 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isConverting}
                                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-60"
                                >
                                    {isConverting ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Converting...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={14} /> Confirm & Enroll Student
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SHAREABLE BOOTH QR CODE MODAL */}
            {showQrModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowQrModal(false)}
                    />
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 text-gray-900 dark:text-white animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setShowQrModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
                                <QrCode size={24} />
                            </div>
                            <h3 className="text-lg font-extrabold">Outreach Booth Registration QR</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Print or display this QR code at the outreach table so students can scan & register with the campaign pre-selected.
                            </p>
                        </div>

                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
                                    Select Outreach Campaign for QR Tag
                                </label>
                                <select
                                    value={qrEventName}
                                    onChange={(e) => setQrEventName(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                >
                                    {distinctEvents.map(ev => (
                                        <option key={ev} value={ev}>{ev}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                                    Select Staff / Mobilizer for QR Audit Attribution (Optional)
                                </label>
                                <select
                                    value={qrStaffName}
                                    onChange={(e) => setQrStaffName(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs font-bold"
                                >
                                    <option value="">— General Booth QR (No Specific Staff Pre-tagged) —</option>
                                    {staffRoster.map(st => (
                                        <option key={st.id} value={st.name}>
                                            👤 {st.name} ({st.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col items-center justify-center shadow-inner">
                                <img
                                    src={qrCodeImageUrl}
                                    alt="Welile Outreach Registration QR Code"
                                    className="w-52 h-52 object-contain"
                                />
                                {qrEventName.trim() && (
                                    <span className="mt-2 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-extrabold">
                                        {qrEventName.trim()}
                                    </span>
                                )}
                                {qrStaffName.trim() && (
                                    <span className="mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                                        👤 Attributed to: {qrStaffName.trim()}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-950 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800">
                                <input
                                    type="text"
                                    readOnly
                                    value={publicRegisterUrl}
                                    className="flex-1 bg-transparent text-[11px] font-mono text-gray-600 dark:text-slate-300 focus:outline-none truncate"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(publicRegisterUrl);
                                        setCopiedLink(true);
                                        setTimeout(() => setCopiedLink(false), 2000);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                    {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                                    {copiedLink ? 'Copied' : 'Copy'}
                                </button>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Printer size={14} /> Print Flyer QR
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowQrModal(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold cursor-pointer"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* UNIFIED OUTREACH ACTIVATION, WEBSITE BUTTON & MOBILIZER TEAM CONTROL MODAL */}
            {showLaunchControlModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        onClick={() => setShowLaunchControlModal(false)}
                    />
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative z-10 text-gray-900 dark:text-white max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 space-y-5">
                        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                                    <Sparkles size={22} />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold">
                                        Outreach Activation, Website Button & Mobilizer Team Control
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                        Control whether the Outreach button appears on the public website, select the active outreach campaign, and assign the staff/mobilizers registering students.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowLaunchControlModal(false)}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* STEP 1: PUBLIC WEBSITE BUTTON VISIBILITY */}
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950/70 border border-gray-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                        Step 1 • Public Website Outreach Button Visibility
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                                        Show &ldquo;{websiteButtonLabel || 'Join an Outreach Event'}&rdquo; Button on Public Website
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                        When OFF, the &ldquo;Join an Outreach Event&rdquo; hero button on the website is hidden, while &ldquo;Register Now&rdquo; in the navbar, the footer link, and <code className="font-mono text-violet-600 dark:text-violet-400">/register</code> remain active as usual.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleSaveLaunchSettings(!websiteButtonVisible)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 cursor-pointer transition-all shadow-xs ${
                                        websiteButtonVisible
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : 'bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200'
                                    }`}
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full ${websiteButtonVisible ? 'bg-white' : 'bg-gray-500'}`} />
                                    {websiteButtonVisible ? 'ON (Visible on Website)' : 'OFF (Hidden on Website)'}
                                </button>
                            </div>

                            {websiteButtonVisible && (
                                <div className="pt-2 border-t border-gray-200/70 dark:border-slate-800">
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1">
                                        Public Website Button Text
                                    </label>
                                    <input
                                        type="text"
                                        value={websiteButtonLabel}
                                        onChange={(e) => setWebsiteButtonLabel(e.target.value)}
                                        placeholder="Join an Outreach Event"
                                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                                    />
                                </div>
                            )}
                        </div>

                        {/* STEP 2: ACTIVE OUTREACH CAMPAIGN */}
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950/70 border border-gray-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        Step 2 • Active Outreach Event
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                                        Select Active Outreach Campaign for Registration Form
                                    </h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLaunchControlModal(false);
                                        setShowCampaignModal(true);
                                    }}
                                    className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                >
                                    + Create / Manage Outreaches
                                </button>
                            </div>

                            <select
                                value={activeOutreachName}
                                onChange={(e) => setActiveOutreachName(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                            >
                                {campaigns.map(c => (
                                    <option key={c.name} value={c.name}>
                                        {c.name} ({c.location} • {c.event_date})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* STEP 3: MOBILIZATION TEAM (PEOPLE REGISTERING STUDENTS) */}
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950/70 border border-gray-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        Step 3 • Active Mobilization Staff (People Registering Students)
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                                        Select Staff & Mobilizers on Duty for This Outreach
                                    </h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLaunchControlModal(false);
                                        setShowStaffModal(true);
                                    }}
                                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                    + Add New Staff Member
                                </button>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1">
                                    Default Pre-selected Booth Registrar on <code className="font-mono">/register</code>
                                </label>
                                <select
                                    value={defaultRegistrarName}
                                    onChange={(e) => setDefaultRegistrarName(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                                >
                                    {staffRoster.map(st => (
                                        <option key={st.id} value={st.name}>
                                            👤 {st.name} — {st.role} ({st.staffCode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 pt-1">
                                {staffRoster.map(st => {
                                    const isChecked = activeStaffIds.includes(st.id);
                                    return (
                                        <div
                                            key={st.id}
                                            onClick={() => toggleStaffIdInLaunch(st.id)}
                                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                                isChecked
                                                    ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800/70'
                                                    : 'bg-gray-100/60 dark:bg-slate-900/40 border-gray-200 dark:border-slate-800 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {}}
                                                    className="rounded text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div>
                                                    <span className="font-bold text-gray-900 dark:text-white">{st.name}</span>
                                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                                                        {st.role}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setQrEventName(activeOutreachName);
                                                    setQrStaffName(st.name);
                                                    setShowLaunchControlModal(false);
                                                    setShowQrModal(true);
                                                }}
                                                className="px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-[10px] font-bold hover:bg-violet-100 cursor-pointer flex items-center gap-1"
                                            >
                                                <QrCode size={11} /> QR Link
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-slate-800">
                            <div className="text-xs">
                                {savedLaunchSettings ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                        <CheckCircle2 size={14} /> Live Outreach & Website Settings Saved!
                                    </span>
                                ) : (
                                    <span className="text-gray-500 dark:text-slate-400">
                                        Direct link: <code className="font-mono text-violet-600 dark:text-violet-400">/register</code> is always active for QR & staff tablets
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowLaunchControlModal(false)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveLaunchSettings()}
                                    disabled={savingLaunchSettings}
                                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                                >
                                    {savingLaunchSettings ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Saving Live...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} /> Save & Apply Live Settings
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRegistrations;
