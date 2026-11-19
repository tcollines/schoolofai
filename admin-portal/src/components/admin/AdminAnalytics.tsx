import React, { useCallback, useEffect, useState } from 'react';
import {
    ArrowUpRight, BarChart3, Clock, Download, ExternalLink, Globe, Info,
    Loader2, Monitor, MousePointerClick, RefreshCw, Smartphone, Tablet
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabaseClient } from '../../lib/supabaseClient';
import AdminAuthPrompt, { MissingDbNotice } from './AdminAuthPrompt';

interface SiteAnalytics {
    tracking_since?: string;
    history_since?: string;
    overview: {
        total_page_views: number;
        live_page_views?: number;
        unique_visitors: number;
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
    devices: Record<string, number>;
    daily: { day: string; iso: string; views: number; visitors: number; app_views: number; clicks: number; welile_clicks: number }[];
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
    const [days, setDays] = useState<number | null>(30);
    const [data, setData] = useState<SiteAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [missingDb, setMissingDb] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const exportCsv = () => {
        if (!data) return;
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = [
            ['Day', 'Page Views', 'Unique Visitors', 'App Views', 'Total Clicks', 'Welile Technologies Clicks'],
            ...data.daily.map(d => [d.iso, d.views, d.visitors, d.app_views, d.clicks, d.welile_clicks]),
        ];
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv' }));
        a.download = `welile-traffic-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const ov = data?.overview;
    const totalDevices = Object.values(data?.devices || {}).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="text-violet-600" size={24} />
                        Traffic, App &amp; Link Clicks
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                        Track everyone visiting the website or installed app, clicking live links, and checking out the wider Welile Technologies site (welile.com).
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                        onClick={exportCsv}
                        disabled={!data}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        <Download size={15} /> Export
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
                    <Loader2 className="animate-spin" size={18} /> Loading traffic analytics...
                </div>
            )}

            {data && ov && (
                <>
                    {/* Transparent History vs Live-Click Tracking Banner */}
                    <div className="rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-900/60 px-4 py-3 text-xs text-violet-900 dark:text-violet-200 flex items-start gap-2.5">
                        <Info size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                            <strong>Historical + Live Data:</strong> Visitor totals, daily trends, mobile/desktop devices, app installs, and top pages combine all recorded platform activity since <strong>{data.history_since || '27 Oct 2026'}</strong>. Anonymous visitor page views and outbound link clicks (such as <strong>Welile Technologies / welile.com</strong>) began live capture on <strong>19 Nov 2026</strong> — past external clicks were never stored before then.
                        </p>
                    </div>

                    {/* Top KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className={`${card} p-4`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Unique Visitors &amp; Users</span>
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-600 bg-violet-50 dark:bg-violet-950/40">
                                    <Globe size={16} />
                                </span>
                            </div>
                            <p className="text-3xl font-extrabold mt-2">{ov.unique_visitors}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                <b>{ov.total_page_views}</b> visits/views · {ov.signed_in_visitors} signed in{ov.guest_visitors ? ` · ${ov.guest_visitors} guests` : ''}
                            </p>
                        </div>

                        <div className={`${card} p-4`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Installed App</span>
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                                    <Smartphone size={16} />
                                </span>
                            </div>
                            <p className="text-3xl font-extrabold mt-2">{Math.max(ov.app_visitors, ov.hist_app_installed)}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                {ov.hist_app_installed} installs · {ov.app_launches + ov.hist_app_opened} app opens
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
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Tracked Clicks</span>
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sky-600 bg-sky-50 dark:bg-sky-950/40">
                                    <MousePointerClick size={16} />
                                </span>
                            </div>
                            <p className="text-3xl font-extrabold mt-2">{ov.total_clicks}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                {ov.live_link_clicks} live links · {ov.whatsapp_clicks} WhatsApp · {ov.cta_clicks} CTAs
                            </p>
                        </div>
                    </div>

                    {/* Daily Traffic Trend + Platform & Device Split */}
                    <div className="grid xl:grid-cols-3 gap-4">
                        <div className={`${card} p-5 xl:col-span-2`}>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <h2 className="font-bold">Daily Visits &amp; Unique Visitors</h2>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">Website + Installed App activity by day (EAT).</p>
                                </div>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.daily} margin={{ left: -12, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="views" name="Page Views" stroke="#7c3aed" fill="#ddd6fe" />
                                        <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="#0284c7" fill="#bae6fd" />
                                        <Area type="monotone" dataKey="app_views" name="App Views" stroke="#10b981" fill="#a7f3d0" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={`${card} p-5 space-y-5`}>
                            <div>
                                <h2 className="font-bold">Website vs Installed App</h2>
                                <div className="mt-3 space-y-2.5 text-sm">
                                    {[
                                        { label: 'Website browser visitors', n: ov.website_visitors, color: 'bg-violet-500' },
                                        { label: 'Installed app visitors', n: ov.app_visitors, color: 'bg-emerald-500' },
                                        { label: 'App installs (recorded)', n: ov.hist_app_installed, color: 'bg-sky-500' },
                                        { label: 'Agent referral link clicks', n: ov.hist_referral_clicks, color: 'bg-amber-500' },
                                    ].map(row => {
                                        const max = Math.max(1, ov.website_visitors, ov.app_visitors, ov.hist_app_installed, ov.hist_referral_clicks);
                                        return (
                                            <div key={row.label}>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600 dark:text-slate-300">{row.label}</span>
                                                    <span className="font-bold">{row.n}</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 mt-1">
                                                    <div className={`h-1.5 rounded-full ${row.color}`} style={{ width: `${Math.min(100, (row.n / max) * 100)}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">Devices</h3>
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

                    {/* Outbound Links (Welile Tech, WhatsApp, Live Meet) + Most Visited Pages */}
                    <div className="grid xl:grid-cols-2 gap-4">
                        <div className={`${card} p-5`}>
                            <h2 className="font-bold flex items-center gap-2">
                                <ExternalLink size={17} className="text-violet-600" />
                                Outbound &amp; External Links Clicked
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                Includes Welile Technologies (welile.com), WhatsApp shares, Google Meet live joins, and calendar links.
                            </p>
                            {data.outbound_links.length === 0 ? (
                                <p className="mt-4 text-sm text-gray-500">No external link clicks recorded in this period yet. Tracking is active and updates live.</p>
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
                                Pages viewed across the School of AI website and installed app.
                            </p>
                            {data.top_pages.length === 0 ? (
                                <p className="mt-4 text-sm text-gray-500">No page views recorded in this period yet. Tracking is active and updates live.</p>
                            ) : (
                                <div className="overflow-x-auto mt-3">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-100 dark:border-slate-800">
                                                <th className="py-2">Page</th>
                                                <th className="py-2 text-right">Views</th>
                                                <th className="py-2 text-right">Unique</th>
                                                <th className="py-2 text-right">In App</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {data.top_pages.map(p => (
                                                <tr key={p.path}>
                                                    <td className="py-2 pr-2 font-mono text-xs truncate max-w-[240px]">{p.path}</td>
                                                    <td className="py-2 text-right font-bold">{p.views}</td>
                                                    <td className="py-2 text-right text-gray-500">{p.unique_visitors}</td>
                                                    <td className="py-2 text-right text-emerald-600 font-semibold">{p.app_views}</td>
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
                            <h2 className="font-bold">Where Visitors Came From (Referrers)</h2>
                            {data.referrers.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-500">No referrer data yet.</p>
                            ) : (
                                <div className="overflow-x-auto mt-3">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-100 dark:border-slate-800">
                                                <th className="py-2">Referrer</th>
                                                <th className="py-2 text-right">Visits</th>
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
                            Recent Link Clicks, Welile Tech Visits &amp; Live Joins
                        </h2>
                        {data.recent_clicks.length === 0 ? (
                            <p className="mt-3 text-sm text-gray-500">As visitors click Welile Technologies, WhatsApp, live class links, or launch the app, events will appear here in real time.</p>
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
