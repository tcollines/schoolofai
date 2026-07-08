import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, Users, Check, ExternalLink, ArrowRight, Loader } from 'lucide-react';
import { useTranslation } from './translations';

interface EventItem {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    type: 'Workshop' | 'Webinar' | 'Panel';
    speaker: string;
    tags: string[];
    attendeeCount: number;
}

const initialEvents: EventItem[] = [
    {
        id: 'ev-1',
        title: 'Generative AI Hackathon: Building with LLMs',
        description: 'Join WSAI instructors and mentors for an intensive hackathon where you will build and deploy functional GenAI projects using OpenAI API, LangChain, and Streamlit.',
        date: '2026-07-15',
        time: '14:00 - 17:00 (SAST)',
        type: 'Workshop',
        speaker: 'Dr. Sarah Jenkins, Head of Generative AI Research',
        tags: ['LLMs', 'LangChain', 'GenAI'],
        attendeeCount: 142
    },
    {
        id: 'ev-2',
        title: 'MLOps Masterclass: Deploying Models to Production',
        description: 'Learn how to build production-grade MLOps pipelines. We will cover versioning datasets, model registries with MLflow, and containerizing deployment packages with Docker.',
        date: '2026-07-22',
        time: '10:00 - 12:30 (SAST)',
        type: 'Webinar',
        speaker: 'Marcus Vance, Lead MLOps Engineer',
        tags: ['MLOps', 'Docker', 'Production'],
        attendeeCount: 89
    },
    {
        id: 'ev-3',
        title: 'AI Ethics & Compliance Forum: Navigating Future Policies',
        description: 'A curated expert panel discussion exploring global policies, bias mitigation strategies, and commercial transparency guidelines for enterprise machine learning products.',
        date: '2026-08-05',
        time: '16:00 - 18:00 (SAST)',
        type: 'Panel',
        speaker: 'Panel of Legal Counsel and AI Ethicists',
        tags: ['Ethics', 'Compliance', 'Policy'],
        attendeeCount: 206
    },
    {
        id: 'ev-4',
        title: 'Computer Vision Workshop: Object Detection in Real-time',
        description: 'Step-by-step tutorial on training YOLO model extensions using PyTorch and running real-time object tracking over live video streams.',
        date: '2026-08-18',
        time: '13:00 - 15:30 (SAST)',
        type: 'Workshop',
        speaker: 'Dr. Kenji Tanaka, Senior Computer Vision Scientist',
        tags: ['Computer Vision', 'YOLO', 'PyTorch'],
        attendeeCount: 115
    }
];

const EventsPage: React.FC = () => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<'All' | 'Workshop' | 'Webinar' | 'Panel'>('All');
    const [rsvps, setRsvps] = useState<Record<string, 'yes' | 'loading' | 'no'>>(() => {
        const stored = localStorage.getItem('event-rsvps');
        return stored ? JSON.parse(stored) : {};
    });
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 42, seconds: 15 });

    // Simple ticking countdown for the next live workshop
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
                } else if (prev.hours > 0) {
                    return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                } else {
                    return { hours: 2, minutes: 42, seconds: 15 }; // Reset mock count
                }
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRSVP = (eventId: string) => {
        setRsvps(prev => ({ ...prev, [eventId]: 'loading' }));
        
        setTimeout(() => {
            setRsvps(prev => {
                const nextState = { ...prev, [eventId]: prev[eventId] === 'yes' ? 'no' : 'yes' };
                localStorage.setItem('event-rsvps', JSON.stringify(nextState));
                
                // Trigger notification in student portal
                const storedNotifs = localStorage.getItem('portal-notifications');
                const list = storedNotifs ? JSON.parse(storedNotifs) : [];
                const matchedEvent = initialEvents.find(e => e.id === eventId);
                if (matchedEvent) {
                    const isRsvpJoin = nextState[eventId] === 'yes';
                    const newItem = {
                        id: Date.now().toString(),
                        title: isRsvpJoin ? "RSVP Confirmed" : "RSVP Cancelled",
                        description: isRsvpJoin 
                            ? `You have successfully registered for: ${matchedEvent.title}. Check your inbox for the invitation link.`
                            : `You cancelled your registration for: ${matchedEvent.title}`,
                        timestamp: new Date().toISOString(),
                        read: false,
                        type: 'system'
                    };
                    localStorage.setItem('portal-notifications', JSON.stringify([newItem, ...list]));
                    window.dispatchEvent(new Event('notifications-update'));
                }
                
                return nextState;
            });
        }, 800);
    };

    const filteredEvents = initialEvents.filter(e => filter === 'All' || e.type === filter);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-welile-lime rounded-full blur-3xl opacity-10"></div>
                <div className="absolute bottom-0 left-10 w-48 h-48 bg-welile-purple rounded-full blur-3xl opacity-20"></div>

                <div className="relative z-10 grid md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-2 space-y-3">
                        <span className="text-xs font-bold bg-welile-lime/20 text-welile-lime px-3 py-1 rounded-full uppercase tracking-wider">
                            Live Masterclass
                        </span>
                        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                            Generative AI Hackathon
                        </h2>
                        <p className="text-sm text-slate-300 max-w-lg">
                            Build live AI apps using LangChain and Streamlit. Receive developer certificates and connect with top tech recruiters.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center space-y-2">
                        <p className="text-xs uppercase font-semibold text-slate-300 tracking-wider">Starts In</p>
                        <div className="flex justify-center gap-3 text-lg font-bold font-mono">
                            <div>
                                <span className="bg-black/45 px-2 py-1 rounded text-welile-lime">
                                    {String(timeLeft.hours).padStart(2, '0')}
                                </span>
                                <span className="text-[10px] block mt-1 font-sans text-slate-400">Hours</span>
                            </div>
                            <span>:</span>
                            <div>
                                <span className="bg-black/45 px-2 py-1 rounded text-welile-lime">
                                    {String(timeLeft.minutes).padStart(2, '0')}
                                </span>
                                <span className="text-[10px] block mt-1 font-sans text-slate-400">Min</span>
                            </div>
                            <span>:</span>
                            <div>
                                <span className="bg-black/45 px-2 py-1 rounded text-welile-lime">
                                    {String(timeLeft.seconds).padStart(2, '0')}
                                </span>
                                <span className="text-[10px] block mt-1 font-sans text-slate-400">Sec</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List & Filters Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 dark:border-slate-800 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('events') || 'Upcoming Events'}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        Accelerate your learning through live interactive program events.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-gray-105 dark:bg-slate-800 p-1 rounded-xl gap-1 shrink-0">
                    {(['All', 'Workshop', 'Webinar', 'Panel'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                (filter === tab)
                                    ? 'bg-white dark:bg-slate-900 text-welile-purple dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {tab === 'All' ? 'All Events' : tab + 's'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEvents.map((event) => {
                    const rsvp = rsvps[event.id] || 'no';
                    const isRsvp = rsvp === 'yes';
                    const isLoading = rsvp === 'loading';
                    const actualAttendees = event.attendeeCount + (isRsvp ? 1 : 0);

                    // Colors based on event type
                    const typeStyles = {
                        Workshop: { border: 'border-l-welile-lime', bg: 'bg-lime-50 dark:bg-lime-950/20 text-lime-700 dark:text-lime-400' },
                        Webinar: { border: 'border-l-welile-purple', bg: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400' },
                        Panel: { border: 'border-l-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400' }
                    }[event.type];

                    return (
                        <div 
                            key={event.id} 
                            className={`bg-white dark:bg-slate-900 border-y border-r border-gray-100 dark:border-slate-800/80 border-l-4 ${typeStyles.border} rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between`}
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeStyles.bg}`}>
                                        {event.type}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 font-medium">
                                        <Users size={13} />
                                        <span>{actualAttendees} registered</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-bold text-gray-900 dark:text-white leading-snug text-base hover:text-welile-purple dark:hover:text-purple-400 cursor-pointer transition-colors">
                                        {event.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                                        Host: {event.speaker}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                                        {event.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-gray-50 dark:border-slate-800 space-y-4">
                                {/* Date and Location */}
                                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-slate-400 font-semibold">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={13} className="text-welile-purple shrink-0" />
                                        <span>{event.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={13} className="text-welile-purple shrink-0" />
                                        <span className="truncate">{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 col-span-2">
                                        <Video size={13} className="text-welile-purple shrink-0" />
                                        <span>Virtual Live Meeting (WSAI Link provided on RSVP)</span>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5">
                                    {event.tags.map((tag) => (
                                        <span key={tag} className="text-[10px] font-bold bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleRSVP(event.id)}
                                        disabled={isLoading}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                            isRsvp
                                                ? 'bg-green-500 text-white shadow-md shadow-green-500/10 hover:bg-green-600'
                                                : 'bg-black dark:bg-slate-800 hover:bg-gray-800 dark:hover:bg-slate-700 text-white'
                                        }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader size={12} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : isRsvp ? (
                                            <>
                                                <Check size={12} />
                                                RSVP'd (Cancel)
                                            </>
                                        ) : (
                                            'RSVP for Event'
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            alert(`"${event.title}" invitation link copied to clipboard!`);
                                        }}
                                        className="px-3.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-gray-500 dark:text-slate-300 transition-colors"
                                        title="Copy Link"
                                    >
                                        <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EventsPage;
