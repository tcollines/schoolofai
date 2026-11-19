import React, { useCallback, useEffect, useState } from 'react';
import {
    ArrowUpRight, Award, BarChart3, Check, Clock, Copy, Download, ExternalLink,
    Globe, Info, Loader2, MapPin, Monitor, MousePointerClick, Printer, RefreshCw,
    Repeat, Smartphone, Tablet, TrendingUp, Users
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabaseClient } from '../../lib/supabaseClient';
import AdminAuthPrompt, { MissingDbNotice } from './AdminAuthPrompt';

interface SiteAnalytics {
    tracking_since?: string;
    history_since?: string;
    overview: {
        total_visits: number;
        web_visits: number;
        app_visits: number;
        total_page_views: number;
        live_page_views?: number;
        unique_visitors: number;
        returning_visitors: number;
        returning_rate_pct: number;
        avg_visits_per_visitor: number;
        avg_views_per_visit: number;
        signed_in_visitors: number;
        guest_visitors?: number;
        website_visitors: number;
        app_visitors: number;
        app_launches: number;
        total_clicks: number;
        welile_tech_clicks: number;
        welile_tech_unique: number;
        whatsapp_clicks: number;
        live_link_clicks: number;
        live_link_unique: number;
        cta_clicks: number;
        hist_app_installed: number;
        hist_app_opened: number;
        hist_referral_clicks: number;
        total_sessions?: number;
    };
    pitch?: {
        total_accounts: number;
        agent_registrations: number;
        outreach_invites: number;
        enrolled_learners: number;
        active_7d: number;
        active_30d: number;
        lessons_completed: number;
        quiz_attempts: number;
        certificates_issued: number;
        total_app_installs: number;
        locations_count: number;
        mobile_share_pct: number;
    };
    repeat_frequency?: { bucket: string; people: number }[];
    top_locations?: { location: string; people: number }[];
    devices: Record<string, number>;
    daily: { day: string; iso: string; visits: number; views: number; visitors: number; app_views: number; clicks: number; welile_clicks: number }[];
    top_pages: { path: string; views: number; unique_visitors: number; app_views: number }[];
    outbound_links: { label: string; target_url: string; category: string; clicks: number; unique_visitors: number }[];
    top_ctas: { label: string; category: string; path: string; clicks: number; unique_visitors: number }[];
    referrers: { referrer: string; visits: number; unique_visitors: number }[];
    recent_clicks: {
        id: string | number;
        created_at: string;
        event_type: string;
        label: string | null;
        category: string | null;
        target_url: string | null;
        path: string | null;
        source: string | null;
        is_app: boolean;
        device_type: string | null;
        user_name: string | null;
    }[];
}

const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm';
const isMissingFn = (m: string) => /schema cache|does not exist|could not find the function/i.test(m);
const isAuthError = (m: string) => /row-level security|permission denied|not authorized/i.test(m);

const CATEGORY_BADGES: Record<string, string> = {
    welile_tech: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
    whatsapp: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    live_class: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    calendar: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    install: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    cta: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    external: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300',
};

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Africa/Kampala',
    });

const AdminAnalytics: React.FC = () => {
    const [days, setDays] = useState<number | null>(null); // Default to All Time for full pitch numbers
    const [data, setData] = useState<SiteAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [missingDb, setMissingDb] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedPitch, setCopiedPitch] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const { data: res, error: err } = await supabaseClient.rpc('admin_site_analytics', { p_days: days });
        if (err) {
            if (isMissingFn(err.message)) setMissingDb(true);
            else {
                setError(err.message);
                if (isAuthError(err.message)) setNeedsAuth(true);
            }
        } else {
            setError(null);
            setData(res as SiteAnalytics);
        }
        setLoading(false);
    }, [days]);

    useEffect(() => {
        void load();
        const t = window.setInterval(load, 60000);
        return () => window.clearInterval(t);
    }, [load]);

    const periodLabel = days === 1 ? 'Last 24 Hours' : days === 7 ? 'Last 7 Days' : days === 30 ? 'Last 30 Days' : 'All Time';

    const copyPitchSummary = async () => {
        if (!data) return;
        const ov = data.overview;
        const p = data.pitch;
        const topLocs = (data.top_locations || []).slice(0, 6).map(l => l.location).join(', ');
        const lines = [
            `WELILE SCHOOL OF AI — TRACTION & TRAFFIC SNAPSHOT (${periodLabel})`,
            `Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
            ``,
            `TRAFFIC & ENGAGEMENT`,
            `• Total Visits (incl. repeat visits): ${ov.total_visits.toLocaleString()} (${ov.avg_visits_per_visitor} visits/person)`,
            `• Total Page Views & Interactions: ${ov.total_page_views.toLocaleString()} (${ov.avg_views_per_visit} views/visit)`,
            `• Unique Visitors & Users: ${ov.unique_visitors.toLocaleString()} (${ov.returning_rate_pct}% returning visitors)`,
            `• Installed App Adoption: ${Math.max(ov.hist_app_installed, p?.total_app_installs || 0)} app installs · ${ov.app_launches} app opens`,
            `• Mobile-First Reach: ${p?.mobile_share_pct ?? 0}% Mobile`,
            ``,
            `LEARNING & DISTRIBUTION TRACTION`,
            `• Student Accounts: ${p?.total_accounts ?? 0} · Agent Registrations: ${p?.agent_registrations ?? 0}`,
            `• Course Enrollments: ${p?.enrolled_learners ?? 0} · Active (7d / 30d): ${p?.active_7d ?? 0} / ${p?.active_30d ?? 0}`,
            `• Lessons Completed: ${p?.lessons_completed ?? 0} · Quiz Attempts: ${p?.quiz_attempts ?? 0} · Certificates Issued: ${p?.certificates_issued ?? 0}`,
            `• Geographic Reach: ${p?.locations_count ?? 0} towns/districts${topLocs ? ` (${topLocs})` : ''}`,
            ``,
            `ECOSYSTEM & OUTBOUND REACH`,
            `• Welile Technologies (welile.com) Clicks: ${ov.welile_tech_clicks} (${ov.welile_tech_unique} unique)`,
            `• Live Class Join Clicks: ${ov.live_link_clicks} · WhatsApp Clicks: ${ov.whatsapp_clicks}`,
        ].join('\n');
        try {
            await navigator.clipboard.writeText(lines);
            setCopiedPitch(true);
            setTimeout(() => setCopiedPitch(false), 2200);
        } catch { /* ignore */ }
    };

    const exportCsv = () => {
        if (!data) return;
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = [
            ['Day', 'Total Visits (incl. repeat)', 'Page Views & Actions', 'Unique Visitors', 'App Views', 'Total Clicks', 'Welile Technologies Clicks'],
            ...data.daily.map(d => [d.iso, d.visits, d.views, d.visitors, d.app_views, d.clicks, d.welile_clicks]),
        ];
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv' }));
        a.download = `welile-pitch-traffic-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const ov = data?.overview;
    const pitch = data?.pitch;
    const totalDevices = Object.values(data?.devices || {}).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="text-violet-600" size={24} />
                        Traffic, Repeat Visits &amp; Pitch Traction
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                        Comprehensive traffic including multiple repeat visits per person per day, installed app usage, geographic reach, and Welile Technologies (welile.com) clicks.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                    <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-700 overflow-hidden text-xs font-semibold" role="group" aria-label="Time window">
                        {([[1, '24h'], [7, '7 days'], [30, '30 days'], [null, 'All time']] as [number | null, string][]).map(([d, label]) => (
                            <button
                                key={label}
                                onClick={() => setDays(d)}
                                aria-pressed={days === d}
                                className={`px-3 py-2 ${days === d ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={copyPitchSummary}
                        disabled={!data}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 disabled:opacity-50"
                    >
                        {copiedPitch ? <><Check size={15} /> Pitch Summary Copied!</> : <><Copy size={15} /> Copy Pitch Summary</>}
                    </button>
                    <button
                        onClick={() => window.print()}
                        disabled={!data}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        <Printer size={15} /> Print / PDF
                    </button>
                    <button
                        onClick={exportCsv}
                        disabled={!data}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        <Download size={15} /> CSV
                    </button>
                    <button
                        onClick={() => void load()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {missingDb && <MissingDbNotice />}
            {needsAuth && <AdminAuthPrompt onSignedIn={() => { setNeedsAuth(false); setError(null); void load(); }} />}
            {error && !missingDb && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {!data && loading && !error && (
                <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="animate-spin" size={18} /> Loading comprehensive traffic analytics...
                </div>
            )}

            {data && ov && (
                <>
                    {/* Executive Pitch Highlights Banner */}
                    {pitch && (
                        <div className="rounded-2xl bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 text-white p-5 shadow-md">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-violet-200">Welile School of AI · Pitch Traction Highlights ({periodLabel})</p>
                                    <h2 className="text-lg font-bold mt-0.5">Comprehensive Traffic, Retention &amp; Market Reach</h2>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/15 backdrop-blur">
                                    Data since {data.history_since || '27 Oct 2026'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-violet-200 font-semibold">Total Visits</p>
                                    <p className="text-2xl font-extrabold mt-1">{ov.total_visits.toLocaleString()}</p>
                                    <p className="text-[11px] text-violet-100 mt-0.5">{ov.avg_visits_per_visitor}x visits/person</p>
                                </div>
                                <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-violet-200 font-semibold">Views &amp; Actions</p>
                                    <p className="text-2xl font-extrabold mt-1">{ov.total_page_views.toLocaleString()}</p>
                                    <p className="text-[11px] text-violet-100 mt-0.5">{ov.avg_views_per_visit} per visit</p>
                                </div>
                                <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-violet-200 font-semibold">Return Rate</p>
                                    <p className="text-2xl font-extrabold mt-1">{ov.returning_rate_pct}%</p>
                                    <p className="text-[11px] text-violet-100 mt-0.5">{ov.returning_visitors} repeat visitors</p>
                                </div>
                                <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-violet-200 font-semibold">Mobile-First</p>
                                    <p className="text-2xl font-extrabold mt-1">{pitch.mobile_share_pct}%</p>
                                    <p className="text-[11px] text-violet-100 mt-0.5">{pitch.total_app_installs} installed app</p>
                                </div>
                                <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-violet-200 font-semibold">Locations</p>
                                    <p className="text-2xl font-extrabold mt-1">{pitch.locations_count}+</p>
                                    <p className="text-[11px] text-violet-100 mt-0.5">towns &amp; districts</p>
                                </div>
                                <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-violet-200 font-semibold">Learners</p>
                                    <p className="text-2xl font-extrabold mt-1">{pitch.total_accounts + pitch.agent_registrations}</p>
                                    <p className="text-[11px] text-violet-100 mt-0.5">{pitch.enrolled_learners} enrolled · {pitch.certificates_issued} cert</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transparent Methodology Banner */}
                    <div className="rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-900/60 px-4 py-3 text-xs text-violet-900 dark:text-violet-200 flex items-start gap-2.5">
                        <Info size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                            <strong>Repeat Visits Counted:</strong> Every page load, app reopen, and return visit counts as a visit (if one person opens the site or app 100 times in a day, all 100 visits are recorded). Historical visits, sessions, and mobile/desktop devices span back to <strong>{data.history_since || '27 Oct 2026'}</strong>; live anonymous page views and outbound clicks (including <strong>Welile Technologies / welile.com</strong>) are tracked live from <strong>19 Nov 2026</strong> onward.
                        </p>
                    </div>

                    {/* Primary 4 Traffic KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className={`${card} p-4`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Total Visits (Incl. Repeat)</span>
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-600 bg-violet-50 dark:bg-violet-950/40">
                                    <Repeat size={16} />
                                </span>
                            </div>
                            <p className="text-3xl font-extrabold mt-2">{ov.total_visits.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                <b>{ov.web_visits}</b> web · <b>{ov.app_visits}</b> app · {ov.avg_visits_per_visitor}x / person
                            </p>
                        </div>

                        <div className={`${card} p-4`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Unique Visitors</span>
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50 dark:bg-blue-950/40">
                                    <Users size={16} />
                                </span>
                            </div>
                            <p className="text-3xl font-extrabold mt-2">{ov.unique_visitors.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                <b>{ov.returning_visitors}</b> came back 2+ times ({ov.returning_rate_pct}%)
                            </p>
                        </div>

                        <div className={`${card} p-4 ring-1 ring-violet-200 dark:ring-violet-900/60`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Welile Tech (welile.com)</span>
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-700 bg-violet-100 dark:bg-violet-950/60">
                                    <ArrowUpRight size={16} />
                                </span>
                            </div>
                            <p className="text-3xl font-extrabold mt-2 text-violet-700 dark:text-violet-300">{ov.welile_tech_clicks}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                <b>{ov.welile_tech_unique}</b> unique {ov.welile_tech_unique === 1 ? 'person' : 'people'} checked out welile.com
                            </p>
                        </div>

                        <div className={`${card} p-4`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Tracked Clicks &amp; App</span>
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                                    <MousePointerClick size={16} />
                                </span>
                            </div>
                            <p className="text-3xl font-extrabold mt-2">{ov.total_clicks.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                {ov.live_link_clicks} live · {ov.whatsapp_clicks} WhatsApp · {ov.app_launches} app opens
                            </p>
                        </div>
                    </div>

                    {/* Daily Comprehensive Traffic Chart + Repeat-Visit Frequency & Devices */}
                    <div className="grid xl:grid-cols-3 gap-4">
                        <div className={`${card} p-5 xl:col-span-2`}>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <h2 className="font-bold flex items-center gap-2">
                                        <TrendingUp size={17} className="text-violet-600" />
                                        Daily Total Visits, Page Views &amp; Unique Visitors
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        Shows repeat visit volume alongside unique daily visitors across website &amp; installed app (EAT).
                                    </p>
                                </div>
                            </div>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.daily} margin={{ left: -12, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="views" name="Page Views & Actions" stroke="#7c3aed" fill="#ddd6fe" />
                                        <Area type="monotone" dataKey="visits" name="Total Visits (incl. repeat)" stroke="#0284c7" fill="#bae6fd" />
                                        <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="#10b981" fill="#a7f3d0" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={`${card} p-5 space-y-5`}>
                            {/* Repeat Visit Frequency */}
                            <div>
                                <h2 className="font-bold flex items-center gap-1.5">
                                    <Repeat size={16} className="text-violet-600" /> Repeat Visit Depth
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                    How frequently visitors return to Welile School of AI.
                                </p>
                                <div className="mt-3 space-y-2.5">
                                    {(data.repeat_frequency || []).map(b => {
                                        const maxB = Math.max(1, ...(data.repeat_frequency || []).map(x => x.people));
                                        return (
                                            <div key={b.bucket}>
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-medium text-gray-700 dark:text-slate-300">{b.bucket}</span>
                                                    <span className="font-bold">{b.people} {b.people === 1 ? 'person' : 'people'}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 mt-1">
                                                    <div className="h-2 rounded-full bg-violet-500" style={{ width: `${Math.min(100, (b.people / maxB) * 100)}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Devices Split */}
                            <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">Device Mix</h3>
                                <div className="grid grid-cols-3 gap-2 mt-2.5 text-center">
                                    {[
                                        { key: 'mobile', label: 'Mobile', icon: Smartphone },
                                        { key: 'desktop', label: 'Desktop', icon: Monitor },
                                        { key: 'tablet', label: 'Tablet', icon: Tablet },
                                    ].map(d => {
                                        const cnt = data.devices[d.key] || 0;
                                        const pct = totalDevices > 0 ? Math.round((cnt / totalDevices) * 100) : 0;
                                        return (
                                            <div key={d.key} className="rounded-xl bg-gray-50 dark:bg-slate-800/60 p-2.5">
                                                <d.icon size={15} className="mx-auto text-violet-600" />
                                                <p className="text-lg font-extrabold mt-1">{cnt}</p>
                                                <p className="text-[11px] text-gray-500">{d.label} ({pct}%)</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pitch Geographic Reach + Learning Engagement Proof */}
                    {pitch && (
                        <div className="grid xl:grid-cols-2 gap-4">
                            <div className={`${card} p-5`}>
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="font-bold flex items-center gap-2">
                                        <MapPin size={17} className="text-violet-600" />
                                        Geographic Reach ({pitch.locations_count} Towns &amp; Districts)
                                    </h2>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                    Where students and registrants are joining Welile School of AI from.
                                </p>
                                {(data.top_locations || []).length === 0 ? (
                                    <p className="mt-4 text-sm text-gray-500">No location records yet.</p>
                                ) : (
                                    <div className="mt-3 space-y-2">
                                        {(data.top_locations || []).map(l => {
                                            const maxL = Math.max(1, ...(data.top_locations || []).map(x => x.people));
                                            return (
                                                <div key={l.location} className="flex items-center gap-3 text-xs">
                                                    <span className="w-32 truncate font-medium text-gray-700 dark:text-slate-200">{l.location}</span>
                                                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                                                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, (l.people / maxL) * 100)}%` }} />
                                                    </div>
                                                    <span className="w-8 text-right font-bold">{l.people}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className={`${card} p-5`}>
                                <h2 className="font-bold flex items-center gap-2">
                                    <Award size={17} className="text-violet-600" />
                                    Product &amp; Learning Traction (All-Time Proof Points)
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                    Core traction numbers ready for investor decks, grants, and partner proposals.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                                    {[
                                        { label: 'Student Accounts', value: pitch.total_accounts },
                                        { label: 'Agent Registrations', value: pitch.agent_registrations },
                                        { label: 'Enrolled Learners', value: pitch.enrolled_learners },
                                        { label: 'Active (7d / 30d)', value: `${pitch.active_7d} / ${pitch.active_30d}` },
                                        { label: 'Lessons Completed', value: pitch.lessons_completed },
                                        { label: 'Quiz Attempts', value: pitch.quiz_attempts },
                                        { label: 'App Installs (PWA)', value: pitch.total_app_installs },
                                        { label: 'Certificates Issued', value: pitch.certificates_issued },
                                        { label: 'Outreach Invites', value: pitch.outreach_invites },
                                    ].map(item => (
                                        <div key={item.label} className="rounded-xl bg-gray-50 dark:bg-slate-800/60 p-3">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{item.label}</p>
                                            <p className="text-2xl font-extrabold mt-1 text-gray-900 dark:text-white">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Outbound Links (Welile Tech, WhatsApp, Live Meet) + Most Visited Pages */}
                    <div className="grid xl:grid-cols-2 gap-4">
                        <div className={`${card} p-5`}>
                            <h2 className="font-bold flex items-center gap-2">
                                <ExternalLink size={17} className="text-violet-600" />
                                Outbound &amp; External Links Clicked
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                Tracks clicks to Welile Technologies (welile.com), WhatsApp, Google Meet live joins, and calendars.
                            </p>
                            {data.outbound_links.length === 0 ? (
                                <p className="mt-4 text-sm text-gray-500">No external link clicks recorded in this period yet. Live capture is active.</p>
                            ) : (
                                <div className="overflow-x-auto mt-3">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-100 dark:border-slate-800">
                                                <th className="py-2">Destination</th>
                                                <th className="py-2">Type</th>
                                                <th className="py-2 text-right">Clicks</th>
                                                <th className="py-2 text-right">Unique</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {data.outbound_links.map((o, i) => (
                                                <tr key={`${o.target_url}-${i}`}>
                                                    <td className="py-2.5 pr-2">
                                                        <p className="font-medium truncate max-w-[230px]">{o.label}</p>
                                                        {o.target_url && <p className="text-[11px] text-gray-400 truncate max-w-[230px]">{o.target_url}</p>}
                                                    </td>
                                                    <td className="py-2.5 pr-2">
                                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGES[o.category] || CATEGORY_BADGES.external}`}>
                                                            {o.category === 'welile_tech' ? 'Welile Tech' : o.category.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 text-right font-bold">{o.clicks}</td>
                                                    <td className="py-2.5 text-right text-gray-500">{o.unique_visitors}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className={`${card} p-5`}>
                            <h2 className="font-bold">Most Visited Pages</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                Total views (including repeat visits) vs unique visitors per page.
                            </p>
                            {data.top_pages.length === 0 ? (
                                <p className="mt-4 text-sm text-gray-500">No page views recorded in this period yet.</p>
                            ) : (
                                <div className="overflow-x-auto mt-3">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-100 dark:border-slate-800">
                                                <th className="py-2">Page</th>
                                                <th className="py-2 text-right">Total Views</th>
                                                <th className="py-2 text-right">Unique</th>
                                                <th className="py-2 text-right">Avg / Person</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {data.top_pages.map(p => (
                                                <tr key={p.path}>
                                                    <td className="py-2 pr-2 font-mono text-xs truncate max-w-[220px]">{p.path}</td>
                                                    <td className="py-2 text-right font-bold">{p.views}</td>
                                                    <td className="py-2 text-right text-gray-500">{p.unique_visitors}</td>
                                                    <td className="py-2 text-right text-violet-600 font-semibold">
                                                        {p.unique_visitors > 0 ? (p.views / p.unique_visitors).toFixed(1) : '1.0'}x
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top CTAs + Traffic Sources / Referrers */}
                    <div className="grid xl:grid-cols-2 gap-4">
                        <div className={`${card} p-5`}>
                            <h2 className="font-bold">Top Buttons &amp; CTAs Clicked</h2>
                            {data.top_ctas.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-500">No button clicks recorded in this period yet.</p>
                            ) : (
                                <div className="overflow-x-auto mt-3">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-100 dark:border-slate-800">
                                                <th className="py-2">Button / Action</th>
                                                <th className="py-2">On Page</th>
                                                <th className="py-2 text-right">Clicks</th>
                                                <th className="py-2 text-right">Unique</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {data.top_ctas.map((c, i) => (
                                                <tr key={`${c.label}-${i}`}>
                                                    <td className="py-2 pr-2 font-medium">{c.label}</td>
                                                    <td className="py-2 pr-2 font-mono text-xs text-gray-500 truncate max-w-[160px]">{c.path}</td>
                                                    <td className="py-2 text-right font-bold">{c.clicks}</td>
                                                    <td className="py-2 text-right text-gray-500">{c.unique_visitors}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className={`${card} p-5`}>
                            <h2 className="font-bold">Traffic Channels &amp; Referrers</h2>
                            {data.referrers.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-500">No referrer data yet.</p>
                            ) : (
                                <div className="overflow-x-auto mt-3">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-100 dark:border-slate-800">
                                                <th className="py-2">Channel / Referrer</th>
                                                <th className="py-2 text-right">Total Visits</th>
                                                <th className="py-2 text-right">Unique</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {data.referrers.map(r => (
                                                <tr key={r.referrer}>
                                                    <td className="py-2 pr-2 font-medium">{r.referrer}</td>
                                                    <td className="py-2 text-right font-bold">{r.visits}</td>
                                                    <td className="py-2 text-right text-gray-500">{r.unique_visitors}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Notable Clicks & Live Joins Feed */}
                    <div className={`${card} p-5`}>
                        <h2 className="font-bold flex items-center gap-2">
                            <Clock size={17} className="text-violet-600" />
                            Recent Activity, Welile Tech Clicks &amp; Live Joins
                        </h2>
                        {data.recent_clicks.length === 0 ? (
                            <p className="mt-3 text-sm text-gray-500">Recent link clicks, app opens, and live joins appear here in real time.</p>
                        ) : (
                            <div className="overflow-x-auto mt-3">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left uppercase text-gray-500 border-b border-gray-100 dark:border-slate-800">
                                            <th className="py-2 pr-3">Time (EAT)</th>
                                            <th className="pr-3">Action / Destination</th>
                                            <th className="pr-3">Type</th>
                                            <th className="pr-3">Person</th>
                                            <th className="pr-3">Platform</th>
                                            <th>Source</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {data.recent_clicks.map(e => (
                                            <tr key={e.id}>
                                                <td className="py-2 pr-3 whitespace-nowrap text-gray-500 font-mono">{fmtTime(e.created_at)}</td>
                                                <td className="py-2 pr-3">
                                                    <span className="font-semibold text-gray-800 dark:text-slate-100">{e.label || e.event_type}</span>
                                                    {e.target_url && <span className="block text-[11px] text-gray-400 truncate max-w-[260px]">{e.target_url}</span>}
                                                </td>
                                                <td className="py-2 pr-3">
                                                    <span className={`px-2 py-0.5 rounded-full font-semibold ${CATEGORY_BADGES[e.category || ''] || CATEGORY_BADGES.external}`}>
                                                        {e.category === 'welile_tech' ? 'Welile Tech' : (e.category || e.event_type).replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{e.user_name || 'Guest visitor'}</td>
                                                <td className="py-2 pr-3 whitespace-nowrap text-gray-500">
                                                    {e.is_app ? 'Installed App' : 'Website'} · {e.device_type || 'web'}
                                                </td>
                                                <td className="py-2 text-gray-500">{e.source || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminAnalytics;
