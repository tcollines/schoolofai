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
    FileText
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

export interface OutreachRegistrationRecord {
    id: string;
    created_at: string;
    full_name: string;
    email: string | null;
    phone: string;
    age_range: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    location: string | null;
    course_interest: string;
    level: string | null;
    mode_preference: string | null;
    preferred_study_days: string[] | null;
    preferred_time_slot: string | null;
    how_heard: string | null;
    outreach_event: string | null;
    consent_contact: boolean;
    status: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'NOT_INTERESTED';
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

const STATUS_BADGE_STYLES: Record<OutreachRegistrationRecord['status'], string> = {
    NEW: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60',
    CONTACTED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
    ENROLLED: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    NOT_INTERESTED: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
};

const CHART_COLORS = ['#a855f7', '#7c3aed', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

const DEFAULT_EVENT_PRESETS = [
    'Makerere Career Fair Nov 2026',
    'Kampala Tech Community Meetup',
    'Welile Campus Activation',
    'Kyambogo Innovation Expo',
    'High School ICT Bootcamp'
];

const AdminRegistrations: React.FC = () => {
    const [registrations, setRegistrations] = useState<OutreachRegistrationRecord[]>([]);
    const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
    const [loading, setLoading] = useState(true);

    // Filters & Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [courseFilter, setCourseFilter] = useState<string>('ALL');
    const [eventFilter, setEventFilter] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [sortBy, setSortBy] = useState<'created_at' | 'full_name' | 'course_interest' | 'status'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Expandable row & notes autosave states
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
    const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
    const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

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
    const [qrEventName, setQrEventName] = useState('');
    const [copiedLink, setCopiedLink] = useState(false);

    const fetchRegistrations = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [{ data: regData, error: regErr }, { data: coursesData }, { data: mailsData }] = await Promise.all([
                supabaseClient
                    .from('outreach_registrations')
                    .select('*')
                    .order('created_at', { ascending: false }),
                supabaseClient
                    .from('courses')
                    .select('id, title, is_draft'),
                supabaseClient
                    .from('mails')
                    .select('*')
            ]);

            let combinedList: OutreachRegistrationRecord[] = [];
            if (!regErr && regData && regData.length > 0) {
                combinedList = regData as OutreachRegistrationRecord[];
            } else if (mailsData && mailsData.length > 0) {
                // Fallback parser for outreach registrations stored in `mails` when `outreach_registrations` migration hasn't run yet
                const parsedFromMails: OutreachRegistrationRecord[] = [];
                mailsData.forEach((m: any) => {
                    const msg: string = m.message || '';
                    const match = msg.match(/<!--OUTREACH_JSON:(.+?)-->/);
                    if (match && match[1]) {
                        try {
                            const obj = JSON.parse(match[1]);
                            parsedFromMails.push({
                                ...obj,
                                id: String(m.id),
                                created_at: m.created_at || obj.created_at || new Date().toISOString(),
                                status: obj.status || 'NEW',
                                admin_notes: obj.admin_notes || null,
                                converted_profile_id: obj.converted_profile_id || null
                            });
                        } catch {
                            // ignore malformed json
                        }
                    }
                });
                parsedFromMails.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                combinedList = parsedFromMails;
            }

            setRegistrations(combinedList);
            const initialNotes: Record<string, string> = {};
            combinedList.forEach((r: any) => {
                initialNotes[r.id] = r.admin_notes || '';
            });
            setNotesDrafts(prev => ({ ...initialNotes, ...prev }));

            if (coursesData) {
                setCourses(
                    coursesData
                        .filter((c: any) => !c.is_draft && c.title)
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

        // Real-time subscription to outreach_registrations
        const channel = supabaseClient
            .channel('outreach-registrations-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'outreach_registrations' },
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

    // Distinct filter options
    const distinctCourses = useMemo(() => {
        const fromRegs = registrations.map(r => r.course_interest).filter(Boolean);
        const fromCourses = courses.map(c => c.title).filter(Boolean);
        return Array.from(new Set([...fromRegs, ...fromCourses]));
    }, [registrations, courses]);

    const distinctEvents = useMemo(() => {
        const fromRegs = registrations
            .map(r => (r.outreach_event || '').trim())
            .filter(Boolean);
        return Array.from(new Set([...fromRegs, ...DEFAULT_EVENT_PRESETS]));
    }, [registrations]);

    // KPI computations
    const kpis = useMemo(() => {
        const total = registrations.length;
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const newThisWeek = registrations.filter(
            r => new Date(r.created_at).getTime() >= oneWeekAgo
        ).length;

        const enrolledCount = registrations.filter(r => r.status === 'ENROLLED').length;
        const conversionRate = total > 0 ? Math.round((enrolledCount / total) * 100) : 0;

        const courseCounts: Record<string, number> = {};
        registrations.forEach(r => {
            if (r.course_interest) {
                courseCounts[r.course_interest] = (courseCounts[r.course_interest] || 0) + 1;
            }
        });
        let topCourse = '—';
        let topCourseCount = 0;
        Object.entries(courseCounts).forEach(([course, count]) => {
            if (count > topCourseCount) {
                topCourse = course;
                topCourseCount = count;
            }
        });

        return { total, newThisWeek, enrolledCount, conversionRate, topCourse, topCourseCount };
    }, [registrations]);

    // Chart 1: Registrations per day over the last 30 days
    const dailyTrendData = useMemo(() => {
        const days: Array<{ dateKey: string; label: string; count: number }> = [];
        const now = new Date();
        const countsByDate: Record<string, number> = {};

        registrations.forEach(r => {
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
    }, [registrations]);

    // Chart 2: Breakdown by course_interest
    const courseChartData = useMemo(() => {
        const counts: Record<string, number> = {};
        registrations.forEach(r => {
            const key = r.course_interest || 'Unspecified';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({
                name: name.length > 24 ? name.slice(0, 22) + '…' : name,
                fullName: name,
                count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 7);
    }, [registrations]);

    // Chart 3: Breakdown by how_heard
    const howHeardChartData = useMemo(() => {
        const counts: Record<string, number> = {};
        registrations.forEach(r => {
            const key = r.how_heard || 'Unspecified';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [registrations]);

    // Filtered & Sorted Table Rows
    const filteredRegistrations = useMemo(() => {
        return registrations
            .filter(r => {
                if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
                if (courseFilter !== 'ALL' && r.course_interest !== courseFilter) return false;
                if (eventFilter !== 'ALL' && (r.outreach_event || '') !== eventFilter) return false;

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
                    if (!matchName && !matchPhone && !matchEmail && !matchEvent) return false;
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
    }, [registrations, statusFilter, courseFilter, eventFilter, dateFrom, dateTo, searchQuery, sortBy, sortOrder]);

    const updateMailFallbackRecord = async (id: string, patch: Partial<OutreachRegistrationRecord>) => {
        try {
            const { data: mailRow } = await supabaseClient
                .from('mails')
                .select('id, message')
                .eq('id', id)
                .single();
            if (mailRow && mailRow.message) {
                const match = mailRow.message.match(/<!--OUTREACH_JSON:(.+?)-->/);
                if (match && match[1]) {
                    const parsed = JSON.parse(match[1]);
                    const updatedJson = JSON.stringify({ ...parsed, ...patch });
                    const updatedMessage = mailRow.message.replace(
                        /<!--OUTREACH_JSON:(.+?)-->/,
                        `<!--OUTREACH_JSON:${updatedJson}-->`
                    );
                    await supabaseClient
                        .from('mails')
                        .update({ message: updatedMessage })
                        .eq('id', id);
                }
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
            const { error } = await supabaseClient
                .from('outreach_registrations')
                .update({ status: newStatus })
                .eq('id', id);
            if (error) {
                await updateMailFallbackRecord(id, { status: newStatus });
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            fetchRegistrations(true);
        }
    };

    const handleSaveNotes = async (id: string) => {
        const noteText = notesDrafts[id] ?? '';
        const existing = registrations.find(r => r.id === id);
        if (existing && (existing.admin_notes || '') === noteText) return;

        setSavingNoteId(id);
        try {
            const { error } = await supabaseClient
                .from('outreach_registrations')
                .update({ admin_notes: noteText })
                .eq('id', id);
            if (error) {
                await updateMailFallbackRecord(id, { admin_notes: noteText });
            }

            setRegistrations(prev =>
                prev.map(r => (r.id === id ? { ...r, admin_notes: noteText } : r))
            );
            setSavedNoteId(id);
            setTimeout(() => {
                setSavedNoteId(prev => (prev === id ? null : prev));
            }, 2000);
        } catch (err) {
            console.error('Error saving admin notes:', err);
        } finally {
            setSavingNoteId(null);
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

            // 1. Check if a student profile with this email already exists in `profiles`
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
                            bio: `Converted from Outreach Registration (${convertingLead.outreach_event || convertingLead.how_heard || 'Direct'}) • Phone: ${convertPhone}`
                        }
                    ])
                    .select('id')
                    .single();

                if (!insertProfErr && insertedProf) {
                    profileId = insertedProf.id;
                }
            }

            // 2. If a course is selected and we have a profileId, enroll the student in `enrollments`
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

            // 3. Mark outreach registration as ENROLLED and link converted_profile_id
            const updatePayload: Record<string, any> = {
                status: 'ENROLLED'
            };
            if (profileId) {
                updatePayload.converted_profile_id = profileId;
            }

            const { error: regUpdateErr } = await supabaseClient
                .from('outreach_registrations')
                .update(updatePayload)
                .eq('id', convertingLead.id);

            if (regUpdateErr) {
                await updateMailFallbackRecord(convertingLead.id, updatePayload);
            }

            setRegistrations(prev =>
                prev.map(r =>
                    r.id === convertingLead.id
                        ? { ...r, status: 'ENROLLED', converted_profile_id: profileId }
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
            'Full Name',
            'Phone',
            'Email',
            'Age Range',
            'Guardian Name',
            'Guardian Phone',
            'Location',
            'Course Interest',
            'Level',
            'Mode Preference',
            'Preferred Study Days',
            'Preferred Time Slot',
            'How Heard',
            'Outreach Event',
            'Consent Contact',
            'Status',
            'Admin Notes',
            'Submitted From',
            'Submitted At'
        ];

        const escapeCsv = (val: any) => {
            if (val === null || val === undefined) return '""';
            const str = Array.isArray(val) ? val.join('; ') : String(val);
            return `"${str.replace(/"/g, '""')}"`;
        };

        const rows = filteredRegistrations.map(r => [
            escapeCsv(r.full_name),
            escapeCsv(r.phone),
            escapeCsv(r.email),
            escapeCsv(r.age_range),
            escapeCsv(r.guardian_name),
            escapeCsv(r.guardian_phone),
            escapeCsv(r.location),
            escapeCsv(r.course_interest),
            escapeCsv(r.level),
            escapeCsv(r.mode_preference),
            escapeCsv(r.preferred_study_days),
            escapeCsv(r.preferred_time_slot),
            escapeCsv(r.how_heard),
            escapeCsv(r.outreach_event),
            escapeCsv(r.consent_contact ? 'Yes' : 'No'),
            escapeCsv(r.status),
            escapeCsv(r.admin_notes),
            escapeCsv(r.submitted_from),
            escapeCsv(r.created_at ? new Date(r.created_at).toISOString() : '')
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `welile-outreach-registrations-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Build public /register URL for QR code
    const getPublicRegisterUrl = () => {
        const { protocol, host } = window.location;
        const cleanHost = host
            .replace('admin.', '')
            .replace('instructor.', '')
            .replace(':4001', ':4002');
        const base = `${protocol}//${cleanHost}/register`;
        return qrEventName.trim()
            ? `${base}?event=${encodeURIComponent(qrEventName.trim())}`
            : base;
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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Outreach Registrations & Lead Tracker
                        </h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Sync
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        Track mobile outreach registrations in real time, measure per-event ROI, and convert leads into enrolled students.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => fetchRegistrations()}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Refresh Registrations"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="px-4 py-2.5 rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <QrCode size={15} />
                        Booth QR Code
                    </button>

                    <button
                        type="button"
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                        <Download size={15} />
                        Export CSV ({filteredRegistrations.length})
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards (Matching AdminOverview.tsx style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center shrink-0">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Total Registrations</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.total}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">New This Week</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.newThisWeek}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Conversion Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {kpis.conversionRate}%
                            <span className="text-xs font-normal text-gray-400 dark:text-slate-500 ml-1.5">
                                ({kpis.enrolledCount} enrolled)
                            </span>
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                        <BookOpen size={24} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Top Course by Interest</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={kpis.topCourse}>
                            {kpis.topCourse}
                        </p>
                        {kpis.topCourseCount > 0 && (
                            <p className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold">
                                {kpis.topCourseCount} leads
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recharts Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 30-Day Daily Registrations Area Chart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 lg:col-span-3">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                Daily Outreach Registrations (Last 30 Days)
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Daily volume of captured student leads across events and digital channels
                            </p>
                        </div>
                    </div>
                    <div className="h-56 w-full">
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

                {/* Breakdown by Course Interest Bar Chart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 lg:col-span-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                        Demand by Course Interest
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                        Which programmes attract the most outreach prospects
                    </p>
                    {courseChartData.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-xs text-gray-400">
                            No registrations recorded yet.
                        </div>
                    ) : (
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={courseChartData} margin={{ top: 5, right: 16, left: -20, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.35} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        angle={-15}
                                        textAnchor="end"
                                        interval={0}
                                    />
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
                                    <Bar dataKey="count" name="Leads" radius={[8, 8, 0, 0]}>
                                        {courseChartData.map((_, idx) => (
                                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Breakdown by How Heard / Channel ROI Bar Chart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                        Acquisition Channel ROI (How Heard)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                        Which outreach channel produces the most leads
                    </p>
                    {howHeardChartData.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-xs text-gray-400">
                            No channel data yet.
                        </div>
                    ) : (
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={howHeardChartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 16, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.35} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={100}
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderColor: '#334155',
                                            borderRadius: '12px',
                                            color: '#f8fafc',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Bar dataKey="count" name="Leads" radius={[0, 8, 8, 0]}>
                                        {howHeardChartData.map((_, idx) => (
                                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Filterable, Searchable, Sortable Registrations Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-150 dark:border-slate-800 overflow-hidden transition-colors">
                {/* Filter Bar */}
                <div className="p-5 border-b border-gray-150 dark:border-slate-800 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search
                                size={15}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, phone, email, or event..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-violet-500"
                            />
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Status Filter */}
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs">
                                <Filter size={12} className="text-gray-400" />
                                <span className="text-gray-400 dark:text-slate-500">Status:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent font-bold text-gray-800 dark:text-slate-200 focus:outline-none cursor-pointer dark:bg-slate-950"
                                >
                                    <option value="ALL">All Statuses</option>
                                    {STATUS_OPTIONS.map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Course Filter */}
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs">
                                <span className="text-gray-400 dark:text-slate-500">Course:</span>
                                <select
                                    value={courseFilter}
                                    onChange={(e) => setCourseFilter(e.target.value)}
                                    className="bg-transparent font-bold text-gray-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[160px] truncate dark:bg-slate-950"
                                >
                                    <option value="ALL">All Courses</option>
                                    {distinctCourses.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Outreach Event Filter */}
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs">
                                <span className="text-gray-400 dark:text-slate-500">Event:</span>
                                <select
                                    value={eventFilter}
                                    onChange={(e) => setEventFilter(e.target.value)}
                                    className="bg-transparent font-bold text-gray-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[160px] truncate dark:bg-slate-950"
                                >
                                    <option value="ALL">All Events</option>
                                    {distinctEvents.map(ev => (
                                        <option key={ev} value={ev}>{ev}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Range Filters */}
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                                <Calendar size={12} className="text-gray-400" />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="bg-transparent text-gray-800 dark:text-slate-200 focus:outline-none text-[11px]"
                                    title="From Date"
                                />
                                <span className="text-gray-400">–</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="bg-transparent text-gray-800 dark:text-slate-200 focus:outline-none text-[11px]"
                                    title="To Date"
                                />
                                {(dateFrom || dateTo || statusFilter !== 'ALL' || courseFilter !== 'ALL' || eventFilter !== 'ALL' || searchQuery) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter('ALL');
                                            setCourseFilter('ALL');
                                            setEventFilter('ALL');
                                            setDateFrom('');
                                            setDateTo('');
                                            setSearchQuery('');
                                        }}
                                        className="ml-1 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-slate-950/60">
                            <tr className="text-gray-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-gray-150 dark:border-slate-800">
                                <th
                                    onClick={() => handleSortToggle('full_name')}
                                    className="py-3.5 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                                >
                                    Name {sortBy === 'full_name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3.5 px-4">Phone</th>
                                <th
                                    onClick={() => handleSortToggle('course_interest')}
                                    className="py-3.5 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                                >
                                    Course Interest {sortBy === 'course_interest' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3.5 px-4">Level</th>
                                <th className="py-3.5 px-4">How Heard</th>
                                <th className="py-3.5 px-4">Outreach Event</th>
                                <th
                                    onClick={() => handleSortToggle('status')}
                                    className="py-3.5 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                                >
                                    Status {sortBy === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th
                                    onClick={() => handleSortToggle('created_at')}
                                    className="py-3.5 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                                >
                                    Submitted {sortBy === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-500 dark:text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
                                        Loading outreach registrations...
                                    </td>
                                </tr>
                            ) : filteredRegistrations.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-500 dark:text-slate-400">
                                        No outreach registrations match your current filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRegistrations.map((reg) => {
                                    const isExpanded = expandedRowId === reg.id;
                                    return (
                                        <React.Fragment key={reg.id}>
                                            <tr className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedRowId(isExpanded ? null : reg.id)}
                                                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-violet-600 cursor-pointer"
                                                            title="Toggle full details"
                                                        >
                                                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                        </button>
                                                        <div>
                                                            <div>{reg.full_name}</div>
                                                            {reg.email && (
                                                                <div className="text-[11px] font-normal text-gray-400 dark:text-slate-500">
                                                                    {reg.email}
                                                                </div>
                                                            )}
                                                            {reg.age_range === 'Under 18' && (
                                                                <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded text-[10px] font-bold">
                                                                    Under 18 (Guardian Listed)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-slate-300 whitespace-nowrap">
                                                    <a href={`tel:${reg.phone}`} className="hover:text-violet-600 dark:hover:text-violet-400">
                                                        {reg.phone}
                                                    </a>
                                                </td>
                                                <td className="py-3.5 px-4 font-semibold text-violet-700 dark:text-violet-300 max-w-[200px] truncate" title={reg.course_interest}>
                                                    {reg.course_interest}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-600 dark:text-slate-400">
                                                    {reg.level || 'Beginner'}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-600 dark:text-slate-400">
                                                    {reg.how_heard || '—'}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-600 dark:text-slate-400">
                                                    {reg.outreach_event ? (
                                                        <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-medium">
                                                            {reg.outreach_event}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
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
                                                                {st}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                                    {reg.created_at
                                                        ? new Date(reg.created_at).toLocaleDateString('en-US', {
                                                              month: 'short',
                                                              day: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit'
                                                          })
                                                        : '—'}
                                                </td>
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedRowId(isExpanded ? null : reg.id)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer"
                                                        >
                                                            {isExpanded ? 'Hide' : 'Details'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openConvertModal(reg)}
                                                            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm cursor-pointer"
                                                        >
                                                            <UserPlus size={12} />
                                                            {reg.status === 'ENROLLED' ? 'Re-Enroll' : 'Convert to Student'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expandable Detail Row */}
                                            {isExpanded && (
                                                <tr className="bg-gray-50/90 dark:bg-slate-950/60">
                                                    <td colSpan={9} className="p-5 border-b border-gray-200 dark:border-slate-800">
                                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                            {/* Col 1: Personal & Guardian Info */}
                                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2.5">
                                                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                                                    Applicant & Contact Details
                                                                </h4>
                                                                <div className="space-y-1.5 text-xs">
                                                                    <p className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                                                        <Phone size={13} className="text-gray-400" />
                                                                        <span className="font-semibold">Phone:</span> {reg.phone}
                                                                    </p>
                                                                    <p className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                                                        <Mail size={13} className="text-gray-400" />
                                                                        <span className="font-semibold">Email:</span> {reg.email || 'Not provided'}
                                                                    </p>
                                                                    <p className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                                                        <MapPin size={13} className="text-gray-400" />
                                                                        <span className="font-semibold">Location:</span> {reg.location || 'Not specified'}
                                                                    </p>
                                                                    <p className="text-gray-700 dark:text-slate-300">
                                                                        <span className="font-semibold">Age Range:</span> {reg.age_range || 'Not specified'}
                                                                    </p>
                                                                    {reg.guardian_name && (
                                                                        <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                                                                            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1">
                                                                                <ShieldCheck size={13} /> Parent / Guardian
                                                                            </p>
                                                                            <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                                                                                {reg.guardian_name}
                                                                            </p>
                                                                            <p className="text-gray-600 dark:text-slate-400">
                                                                                Phone: {reg.guardian_phone || 'N/A'}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Col 2: Study Schedule & Attribution */}
                                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2.5">
                                                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                                                    Study Schedule & Attribution
                                                                </h4>
                                                                <div className="space-y-1.5 text-xs text-gray-700 dark:text-slate-300">
                                                                    <p>
                                                                        <span className="font-semibold">Course Interest:</span>{' '}
                                                                        <span className="font-bold text-violet-600 dark:text-violet-400">{reg.course_interest}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="font-semibold">Skill Level & Mode:</span>{' '}
                                                                        {reg.level || 'Beginner'} • {reg.mode_preference || 'Hybrid'}
                                                                    </p>
                                                                    <p className="flex items-center gap-1.5">
                                                                        <Calendar size={13} className="text-gray-400" />
                                                                        <span className="font-semibold">Preferred Days:</span>{' '}
                                                                        {(reg.preferred_study_days || []).join(', ') || 'Flexible'}
                                                                    </p>
                                                                    <p className="flex items-center gap-1.5">
                                                                        <Clock size={13} className="text-gray-400" />
                                                                        <span className="font-semibold">Time Slot:</span>{' '}
                                                                        {reg.preferred_time_slot || 'Flexible'}
                                                                    </p>
                                                                    <p className="flex items-center gap-1.5">
                                                                        <Megaphone size={13} className="text-gray-400" />
                                                                        <span className="font-semibold">Source:</span>{' '}
                                                                        {reg.how_heard || 'Direct'} {reg.outreach_event ? `(${reg.outreach_event})` : ''}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-400">
                                                                        Submitted via: <span className="font-mono">{reg.submitted_from || 'web'}</span> • Consent: {reg.consent_contact ? 'Granted' : 'No'}
                                                                    </p>
                                                                    {reg.converted_profile_id && (
                                                                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                                                            ✓ Linked Student Profile ID: {reg.converted_profile_id}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Col 3: Admin Notes (Autosaves on blur) */}
                                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                                                                            <FileText size={13} /> Admin Follow-up Notes
                                                                        </h4>
                                                                        {savingNoteId === reg.id ? (
                                                                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                                                <Loader2 size={11} className="animate-spin" /> Saving...
                                                                            </span>
                                                                        ) : savedNoteId === reg.id ? (
                                                                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                                                <Check size={12} /> Saved
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] text-gray-400">Autosaves on blur</span>
                                                                        )}
                                                                    </div>
                                                                    <textarea
                                                                        rows={4}
                                                                        value={notesDrafts[reg.id] ?? reg.admin_notes ?? ''}
                                                                        onChange={(e) =>
                                                                            setNotesDrafts(prev => ({
                                                                                ...prev,
                                                                                [reg.id]: e.target.value
                                                                            }))
                                                                        }
                                                                        onBlur={() => handleSaveNotes(reg.id)}
                                                                        placeholder="Add call notes, payment agreement follow-up, or cohort preference..."
                                                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 resize-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
                                    Enroll in Course (Lead requested: <span className="text-violet-600 dark:text-violet-400">{convertingLead.course_interest}</span>)
                                </label>
                                <select
                                    value={convertCourseId}
                                    onChange={(e) => setConvertCourseId(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                >
                                    <option value="">-- Profile only (enroll later) --</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                                    Subscription Plan / Tier
                                </label>
                                <select
                                    value={convertRole}
                                    onChange={(e) => setConvertRole(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                >
                                    <option value="INDIVIDUAL">Basic (Individual)</option>
                                    <option value="PLUS">Plus Plan</option>
                                    <option value="PRO">Pro Plan</option>
                                    <option value="SPONSORED">Sponsored / Business</option>
                                </select>
                            </div>

                            {convertFeedback && (
                                <div
                                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                                        convertFeedback.type === 'success'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                    }`}
                                >
                                    <CheckCircle2 size={15} />
                                    {convertFeedback.message}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setConvertingLead(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isConverting}
                                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                                >
                                    {isConverting ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Converting...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={14} />
                                            Confirm & Enroll
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
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-bold uppercase tracking-wider">
                                <QrCode size={13} className="mr-1.5" /> Event Booth QR Code
                            </div>
                            <h3 className="text-xl font-extrabold">Scan to Register at Welile</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Print or display this QR code at outreach booths so attendees can register on their phones.
                            </p>
                        </div>

                        <div className="mt-4">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
                                Tag QR Code with Event Name (Optional — Auto-fills Form)
                            </label>
                            <input
                                type="text"
                                list="admin-qr-event-presets"
                                value={qrEventName}
                                onChange={(e) => setQrEventName(e.target.value)}
                                placeholder="e.g. Makerere Career Fair Nov 2026"
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
                            />
                            <datalist id="admin-qr-event-presets">
                                {distinctEvents.map(ev => (
                                    <option key={ev} value={ev} />
                                ))}
                            </datalist>
                        </div>

                        <div className="my-5 flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-gray-200 shadow-inner">
                            <img
                                src={qrCodeImageUrl}
                                alt="Outreach Registration QR Code"
                                className="w-56 h-56 object-contain"
                            />
                            <p className="mt-2 text-[11px] font-mono text-gray-500 break-all text-center">
                                {publicRegisterUrl}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(publicRegisterUrl);
                                    setCopiedLink(true);
                                    setTimeout(() => setCopiedLink(false), 2000);
                                }}
                                className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                {copiedLink ? 'Copied!' : 'Copy Link'}
                            </button>

                            <a
                                href={qrCodeImageUrl}
                                download="welile-outreach-qr.png"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2.5 px-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                                <Download size={14} />
                                Save QR
                            </a>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Printer size={14} />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRegistrations;
