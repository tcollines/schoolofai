import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ExternalLink, Loader2, Video } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { getDeviceType, getVisitorId } from '../../src/lib/analytics';
import { isStandalone } from '../../src/lib/pwa';

interface JoinResult {
    ok: boolean;
    message?: string;
    title?: string;
    host_name?: string | null;
    meet_link?: string | null;
    recording_url?: string | null;
    tracked_as_user?: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Tracked redirect route: /live/join/:sessionId?u=<userId>&src=<email|whatsapp|calendar|app|outreach|direct>
 * Records the live join (both identified student attendance and total/guest clicks) before forwarding
 * straight into Google Meet so learners joining from emails, calendars, or WhatsApp are always counted.
 */
const LiveJoinRedirect: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [params] = useSearchParams();
    const [state, setState] = useState<{ loading: boolean; result: JoinResult | null; error: string | null }>({
        loading: true,
        result: null,
        error: null,
    });

    useEffect(() => {
        let alive = true;
        let redirectTimer: number | undefined;

        const run = async () => {
            if (!sessionId || !UUID_RE.test(sessionId)) {
                setState({ loading: false, result: null, error: 'That live class link is not valid.' });
                return;
            }
            const rawUser = params.get('u');
            const userId = rawUser && UUID_RE.test(rawUser) ? rawUser : null;
            const source = (params.get('src') || 'direct').toLowerCase().slice(0, 40);

            try {
                const { data, error } = await supabase.rpc('resolve_and_track_live_join', {
                    p_session_id: sessionId,
                    p_user_id: userId,
                    p_source: source,
                    p_visitor_id: getVisitorId(),
                    p_device: getDeviceType(),
                    p_is_app: isStandalone(),
                });
                if (!alive) return;
                if (error) {
                    setState({ loading: false, result: null, error: error.message });
                    return;
                }
                const res = (data || {}) as JoinResult;
                if (!res.ok) {
                    setState({ loading: false, result: null, error: res.message || 'Live class not found.' });
                    return;
                }
                setState({ loading: false, result: res, error: null });
                const destination = res.meet_link || res.recording_url;
                if (destination) {
                    redirectTimer = window.setTimeout(() => {
                        window.location.replace(destination);
                    }, 350);
                }
            } catch (e: any) {
                if (!alive) return;
                setState({ loading: false, result: null, error: e?.message || 'Could not open the live class.' });
            }
        };

        void run();
        return () => {
            alive = false;
            if (redirectTimer) window.clearTimeout(redirectTimer);
        };
    }, [sessionId, params]);

    const destination = state.result?.meet_link || state.result?.recording_url || null;

    return (
        <div className="min-h-screen bg-[#faf8f5] dark:bg-slate-950 text-[#1c1917] dark:text-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-lg p-6 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                    {state.loading ? <Loader2 size={28} className="animate-spin" /> : <Video size={28} />}
                </div>

                {state.loading && (
                    <>
                        <h1 className="font-serif text-xl font-semibold">Opening your live class...</h1>
                        <p className="text-sm text-stone-600 dark:text-slate-400">
                            Recording your attendance and taking you straight to the classroom.
                        </p>
                    </>
                )}

                {!state.loading && state.error && (
                    <>
                        <h1 className="font-serif text-xl font-semibold">Could not open live class</h1>
                        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
                        <Link
                            to="/learn/ai-fundamentals/live"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-semibold text-sm"
                        >
                            Open Live Classes Timetable
                        </Link>
                    </>
                )}

                {!state.loading && state.result && (
                    <>
                        <h1 className="font-serif text-xl font-semibold">{state.result.title || 'Welile Live Class'}</h1>
                        {state.result.host_name && (
                            <p className="text-sm text-stone-500 dark:text-slate-400">With {state.result.host_name}</p>
                        )}
                        {destination ? (
                            <>
                                <p className="text-sm text-stone-600 dark:text-slate-300">
                                    Taking you into the session now. If it doesn&apos;t open automatically, tap below:
                                </p>
                                <a
                                    href={destination}
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-semibold text-sm shadow-sm"
                                >
                                    <Video size={17} />
                                    {state.result.meet_link ? 'Join Google Meet Now' : 'Watch Session Replay'}
                                    <ExternalLink size={14} />
                                </a>
                            </>
                        ) : (
                            <p className="text-sm text-stone-600 dark:text-slate-400">
                                The meeting link has not been posted yet. Check the Live Classes tab shortly before class starts.
                            </p>
                        )}
                        <div className="pt-2">
                            <Link to="/learn/ai-fundamentals/live" className="text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline">
                                Back to AI Fundamentals course
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LiveJoinRedirect;
