import React, { useEffect, useRef, useState } from 'react';
import { Video, Headphones, PlayCircle } from 'lucide-react';

declare global {
    interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void; }
}

let ytPromise: Promise<any> | null = null;
const loadYouTube = (): Promise<any> => {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (!ytPromise) {
        ytPromise = new Promise(resolve => {
            const previous = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT); };
            const s = document.createElement('script');
            s.src = 'https://www.youtube.com/iframe_api';
            s.async = true;
            document.head.appendChild(s);
        });
    }
    return ytPromise;
};

interface Props {
    videoId?: string;
    videoUrl?: string;
    title: string;
    startAt?: number;
    /** called about every 2s while playing: position and total duration, in seconds */
    onProgress: (position: number, duration: number) => void;
    onEnded: () => void;
    /** do not preload; YouTube loads only after a tap, with a low-quality hint */
    dataSaver?: boolean;
    /** hide the picture; play sound only when a direct video URL exists */
    audioOnly?: boolean;
}

const VideoPlayer: React.FC<Props> = ({ videoId, videoUrl, title, startAt = 0, onProgress, onEnded, dataSaver = false, audioOnly = false }) => {
    const [armed, setArmed] = useState(false);
    const mountRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const timerRef = useRef<number | null>(null);
    const cb = useRef({ onProgress, onEnded });
    cb.current = { onProgress, onEnded };

    useEffect(() => {
        if (!videoId || audioOnly || (dataSaver && !armed) || !mountRef.current) return;
        let cancelled = false;
        const holder = document.createElement('div');
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(holder);

        loadYouTube().then(YT => {
            if (cancelled) return;
            playerRef.current = new YT.Player(holder, {
                host: 'https://www.youtube-nocookie.com',
                videoId,
                width: '100%',
                height: '100%',
                playerVars: { rel: 0, modestbranding: 1, playsinline: 1, cc_load_policy: 1, autoplay: dataSaver ? 1 : 0, start: Math.floor(startAt) },
                events: {
                    onStateChange: (e: any) => {
                        if (e.data === YT.PlayerState.PLAYING) {
                            if (dataSaver) { try { playerRef.current?.setPlaybackQuality?.('small'); } catch { /* hint only */ } }
                            if (timerRef.current) window.clearInterval(timerRef.current);
                            timerRef.current = window.setInterval(() => {
                                const p = playerRef.current;
                                if (p?.getCurrentTime) cb.current.onProgress(p.getCurrentTime(), p.getDuration() || 0);
                            }, 2000);
                        } else if (timerRef.current) {
                            window.clearInterval(timerRef.current);
                            timerRef.current = null;
                        }
                        if (e.data === YT.PlayerState.ENDED) {
                            const p = playerRef.current;
                            cb.current.onProgress(p?.getDuration?.() || 0, p?.getDuration?.() || 0);
                            cb.current.onEnded();
                        }
                    }
                }
            });
        });

        return () => {
            cancelled = true;
            if (timerRef.current) window.clearInterval(timerRef.current);
            try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
            playerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId, audioOnly, dataSaver, armed]);

    const mediaHandlers = (el: 'audio' | 'video') => ({
        controls: true as const,
        preload: dataSaver ? 'none' as const : 'metadata' as const,
        src: videoUrl,
        title,
        onLoadedMetadata: (e: React.SyntheticEvent<HTMLMediaElement>) => { if (startAt > 0) e.currentTarget.currentTime = startAt; },
        onTimeUpdate: (e: React.SyntheticEvent<HTMLMediaElement>) => {
            const v = e.currentTarget;
            if (Math.floor(v.currentTime) % 2 === 0) cb.current.onProgress(v.currentTime, v.duration || 0);
        },
        onEnded: (e: React.SyntheticEvent<HTMLMediaElement>) => { cb.current.onProgress(e.currentTarget.duration, e.currentTarget.duration); cb.current.onEnded(); },
        'data-kind': el
    });

    if (audioOnly) {
        return (
            <div className="w-full rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <p className="flex items-center gap-2 font-semibold text-sm"><Headphones size={18} className="text-violet-700 dark:text-violet-400" /> Audio only</p>
                {videoUrl ? (
                    <audio key={videoUrl} className="w-full mt-3" playsInline {...mediaHandlers('audio')} />
                ) : (
                    <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">{videoId ? 'Audio-only playback is not available for this video. Read the transcript below, or turn audio only off to watch.' : 'The recording for this lesson is not ready yet. Read the transcript or the lesson notes below.'}</p>
                )}
            </div>
        );
    }

    if (videoUrl && /\.(mp3|m4a|mpeg|wav|ogg)(\?|$)/i.test(videoUrl)) {
        // Voice lesson: presenter photo with a simple audio player (no large video download)
        return (
            <div className="w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6">
                    <img src="/instructor/timothy.webp" alt="Timothy Christian Waniaye" className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl object-cover shrink-0" />
                    <div className="w-full min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">Voice lesson</p>
                        <p className="font-serif text-xl font-semibold mt-1">{title}</p>
                        <p className="text-sm text-stone-600 dark:text-slate-400 mt-0.5">With Timothy Christian Waniaye, Welile School of AI</p>
                        <audio key={videoUrl} className="w-full mt-4" playsInline {...mediaHandlers('audio')} />
                    </div>
                </div>
            </div>
        );
    }

    if (videoUrl) {
        return (
            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden">
                <video
                    key={videoUrl}
                    className="w-full h-full"
                    controls
                    playsInline
                    preload={dataSaver ? 'none' : 'metadata'}
                    src={videoUrl}
                    title={title}
                    onLoadedMetadata={e => { if (startAt > 0) e.currentTarget.currentTime = startAt; }}
                    onTimeUpdate={e => {
                        const v = e.currentTarget;
                        // report roughly every 2 seconds
                        if (Math.floor(v.currentTime) % 2 === 0) cb.current.onProgress(v.currentTime, v.duration || 0);
                    }}
                    onEnded={e => { cb.current.onProgress(e.currentTarget.duration, e.currentTarget.duration); cb.current.onEnded(); }}
                />
            </div>
        );
    }

    if (videoId && dataSaver && !armed) {
        return (
            <button type="button" onClick={() => setArmed(true)} className="aspect-video w-full rounded-2xl border border-stone-200 dark:border-slate-800 bg-stone-100 dark:bg-slate-900 flex flex-col items-center justify-center text-center px-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                <PlayCircle size={40} className="text-violet-700 dark:text-violet-400" />
                <span className="mt-2 font-semibold">Tap to load the video</span>
                <span className="mt-1 text-sm text-stone-600 dark:text-slate-400">Data saver is on, so nothing is downloaded until you tap.</span>
            </button>
        );
    }

    if (videoId) {
        return <div ref={mountRef} className="aspect-video w-full bg-black rounded-2xl overflow-hidden [&_iframe]:w-full [&_iframe]:h-full" aria-label={title} />;
    }

    return (
        <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-slate-900 dark:to-slate-800 border border-stone-200 dark:border-slate-800 flex flex-col items-center justify-center text-center px-6">
            <Video size={36} className="text-violet-700 dark:text-violet-400" />
            <p className="mt-3 font-semibold">The video for this lesson is being recorded</p>
            <p className="mt-1 text-sm text-stone-600 dark:text-slate-400 max-w-sm">Read the lesson notes below and try the hands-on task. You can mark the lesson complete when you are done.</p>
        </div>
    );
};

export default VideoPlayer;
