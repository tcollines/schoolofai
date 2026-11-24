// Shared types and helpers for the Agent Supervision pages (moved out of AgentSupervisionPage.tsx unchanged).

export interface AgentSummary {
    id: string;
    name: string;
    slug: string;
    staff_code?: string | null;
    role: string | null;
    agent_type?: 'student_agent' | 'field_only';
    email?: string | null;
    phone?: string | null;
    active: boolean;
    linked: boolean;
    registered: number;
    accounts: number;
    waiting?: number;
    total_students?: number;
    recorded: number;
    live: number;
    completed: number;
    registered_today?: number;
    registered_7d?: number;
    last_activity_at?: string | null;
    by_location?: Record<string, number>;
}

export interface DailyRegSummary {
    reg_date: string;
    staff_id: string;
    field_officer: string;
    staff_code?: string | null;
    role?: string | null;
    agent_type?: 'student_agent' | 'field_only';
    total_registered: number;
    field_registered: number;
    link_signups: number;
    accounts_opened: number;
    waiting_signup: number;
    conversion_pct: number;
    first_reg_at: string;
    last_reg_at: string;
    programmes: string[];
    top_locations: { location: string; count: number }[];
}

export interface AgentClient {
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    stage: string;
    joined: string;
    course?: string | null;
    registered_by?: string | null;
}

export interface RecentReg {
    id: string;
    created_at: string;
    full_name: string;
    phone: string;
    email: string | null;
    location: string | null;
    course_title: string;
    status: string;
    staff_id: string;
    field_officer: string;
    agent_type: 'student_agent' | 'field_only';
}

export const INPUT = 'w-full rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600';

export const formatSummaryDate = (ymd: string) =>
    new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });

export const formatEatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Kampala' });

export const formatEatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Kampala' });

export const formatEatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Kampala' });

export const getTodayEatYmd = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);

const csvEscape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const downloadCsv = (filename: string, headers: string[], rows: unknown[][]) => {
    const csv = [headers.map(csvEscape).join(','), ...rows.map(r => r.map(csvEscape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
