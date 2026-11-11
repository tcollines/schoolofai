import React, { useEffect, useRef } from 'react';
import { Video } from 'lucide-react';

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
}

const VideoPlayer: React.FC<Props> = ({ videoId, videoUrl, title, startAt = 0, onProgress, onEnded }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const timerRef = useRef<number | null>(null);
    const cb = useRef({ onProgress, onEnded });
    cb.current = { onProgress, onEnded };

    useEffect(() => {
        if (!videoId || !mountRef.current) return;
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
                playerVars: { rel: 0, modestbranding: 1, playsinline: 1, cc_load_policy: 1, start: Math.floor(startAt) },
                events: {
                    onStateChange: (e: any) => {
                        if (e.data === YT.PlayerState.PLAYING) {
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
    }, [videoId]);

    if (videoUrl) {
        return (
            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden">
                <video
                    key={videoUrl}
                    className="w-full h-full"
                    controls
                    playsInline
                    preload="metadata"
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
