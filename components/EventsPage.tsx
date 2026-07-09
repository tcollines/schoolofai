import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, Users, Check, ExternalLink, ArrowRight, Loader } from 'lucide-react';
import { useTranslation } from './translations';
import { Course, CourseStatus } from '../types';

interface EventItem {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    type: 'Workshop' | 'Webinar' | 'Panel';
    speaker: string;
    tags: string[];
    courseId?: string;
    isAnnouncement?: boolean;
    attendeeCount: number;
    meetLink?: string;
    medium?: 'Online' | 'Physical';
    location?: string;
}

interface EventsPageProps {
    courses?: Course[];
}

const defaultAdminEvents = [
    {
        id: 'ev-1',
        title: 'Generative AI Hackathon: Building with LLMs',
        description: 'Join WSAI instructors and mentors for an intensive hackathon where you will build and deploy functional GenAI projects using OpenAI API, LangChain, and Streamlit.',
        date: '2026-07-15',
        time: '14:00 - 17:00 (SAST)',
        type: 'Workshop' as const,
        speaker: 'Dr. Sarah Jenkins, Head of Generative AI Research',
        tags: ['LLMs', 'LangChain', 'GenAI'],
        courseId: 'global',
        attendeeCount: 142,
        medium: 'Online' as const,
        meetLink: 'https://meet.google.com/zgd-bexr-jfy'
    },
    {
        id: 'ev-3',
        title: 'AI Ethics & Compliance Forum: Navigating Future Policies',
        description: 'A curated expert panel discussion exploring global policies, bias mitigation strategies, and commercial transparency guidelines for enterprise machine learning products.',
        date: '2026-08-05',
        time: '16:00 - 18:00 (SAST)',
        type: 'Panel' as const,
        speaker: 'Panel of Legal Counsel and AI Ethicists',
        tags: ['Ethics', 'Compliance', 'Policy'],
        courseId: 'global',
        attendeeCount: 206,
        medium: 'Physical' as const,
        location: 'Main Auditorium, Campus A, Cape Town'
    }
];

const EventsPage: React.FC<EventsPageProps> = ({ courses = [] }) => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<'All' | 'Workshop' | 'Webinar' | 'Panel'>('All');
    const [rsvps, setRsvps] = useState<Record<string, 'yes' | 'loading' | 'no'>>(() => {
        const stored = localStorage.getItem('event-rsvps');
        return stored ? JSON.parse(stored) : {};
    });
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 42, seconds: 15 });
    const [adminEvents, setAdminEvents] = useState<EventItem[]>([]);

    // Filter enrolled courses
    const enrolledCourses = courses.filter(c => c.status === CourseStatus.IN_PROGRESS || c.status === CourseStatus.COMPLETED);

    // Initial seed & fetch admin events, synced with admin console updates
    useEffect(() => {
        const updateEvents = () => {
            const stored = localStorage.getItem('admin-events');
            let currentAdminList = [];
            if (!stored) {
                localStorage.setItem('admin-events', JSON.stringify(defaultAdminEvents));
                currentAdminList = defaultAdminEvents;
            } else {
                currentAdminList = JSON.parse(stored);
            }

            // Show all admin-published events to students (allows discovery of course events to encourage enrollment)
            setAdminEvents(currentAdminList);
        };

        updateEvents();
        window.addEventListener('admin-events-update', updateEvents);
        return () => {
            window.removeEventListener('admin-events-update', updateEvents);
        };
    }, [courses]);

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
                    return { hours: 2, minutes: 42, seconds: 15 };
                }
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Generate dynamic course meetings for each enrolled course
    const dynamicCourseEvents: EventItem[] = enrolledCourses.flatMap((course, index) => [
        {
            id: `course-qa-${course.id}`,
            title: `Live Q&A Session: ${course.title}`,
            description: `Join your instructor ${course.instructor} for a live interactive question and answer session regarding the latest lessons and modules in ${course.title}.`,
            date: new Date(Date.now() + (3 + index * 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3, 5, 7 days from now
            time: '15:00 - 16:30 (SAST)',
            type: 'Webinar' as const,
            speaker: course.instructor || 'Course Instructor',
            tags: ['Q&A', course.category || 'General'],
            courseId: course.id,
            attendeeCount: 45 + (index * 12),
            medium: 'Online' as const,
            meetLink: `https://meet.google.com/qna-${course.id}ai-edu`
        },
        {
            id: `course-workshop-${course.id}`,
            title: `Hands-on Project Review: ${course.title}`,
            description: `Collaborate with peer students enrolled in ${course.title} to review intermediate coding challenges, project guidelines, and optimization hacks.`,
            date: new Date(Date.now() + (6 + index * 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6, 8, 10 days from now
            time: '11:00 - 13:00 (SAST)',
            type: 'Workshop' as const,
            speaker: 'WSAI Mentor Panel',
            tags: ['Hands-on', course.category || 'General'],
            courseId: course.id,
            attendeeCount: 62 + (index * 8),
            medium: 'Online' as const,
            meetLink: `https://meet.google.com/wkp-${course.id}ai-edu`
        }
    ]);

    const allEvents = [...dynamicCourseEvents, ...adminEvents];

    const handleRSVP = (eventId: string) => {
        setRsvps(prev => ({ ...prev, [eventId]: 'loading' }));
        
        setTimeout(() => {
            setRsvps(prev => {
                const nextState = { ...prev, [eventId]: prev[eventId] === 'yes' ? 'no' : 'yes' };
                localStorage.setItem('event-rsvps', JSON.stringify(nextState));
                
                // Trigger notification in student portal
                const storedNotifs = localStorage.getItem('portal-notifications');
                const list = storedNotifs ? JSON.parse(storedNotifs) : [];
                const matchedEvent = allEvents.find(e => e.id === eventId);
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

    const filteredEvents = allEvents.filter(e => filter === 'All' || e.type === filter);

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
                        Dynamic scheduling synced to your enrolled courses and announcements published by WSAI Admin.
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

            {/* Enrolled Courses Status Callout (If none) */}
            {enrolledCourses.length === 0 && (
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-900/60 dark:to-slate-850/40 p-6 rounded-3xl border border-violet-100/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="font-bold text-sm text-violet-900 dark:text-violet-400">No Course Meetings Scheduled</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Enroll in Python, GenAI or MLOps courses to unlock course-specific live tutor QA webinars and study workshops!
                        </p>
                    </div>
                    <button 
                        onClick={() => window.location.href = '/discover'}
                        className="px-5 py-2 bg-welile-purple text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-900/10 cursor-pointer shrink-0"
                    >
                        Browse Courses
                    </button>
                </div>
            )}

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800/80">
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">No upcoming events found under this category.</p>
                </div>
            ) : (
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

                        const isCourseSpecific = event.courseId && event.courseId !== 'global';
                        const courseName = isCourseSpecific ? courses.find(c => c.id === event.courseId)?.title : null;

                        return (
                            <div 
                                key={event.id} 
                                className={`bg-white dark:bg-slate-900 border-y border-r border-gray-100 dark:border-slate-800/80 border-l-4 ${typeStyles.border} rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between`}
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeStyles.bg}`}>
                                                {event.type}
                                            </span>
                                            {event.medium && (
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                                    event.medium === 'Physical'
                                                        ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                                                        : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                                }`}>
                                                    {event.medium}
                                                </span>
                                            )}
                                            {event.isAnnouncement && (
                                                <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                    Announcement
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 font-medium">
                                            <Users size={13} />
                                            <span>{actualAttendees} registered</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white leading-snug text-base hover:text-welile-purple dark:hover:text-purple-400 cursor-pointer transition-colors">
                                            {event.title}
                                        </h4>
                                        {courseName && (
                                            <p className="text-[10px] font-bold text-welile-purple uppercase tracking-wider">
                                                Course: {courseName}
                                            </p>
                                        )}
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
                                            {event.medium === 'Physical' ? (
                                                <>
                                                    <MapPin size={13} className="text-welile-purple shrink-0" />
                                                    <span className="truncate">Campus: {event.location || 'WSAI Campus'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Video size={13} className="text-welile-purple shrink-0" />
                                                    {isRsvp && event.meetLink ? (
                                                        <a 
                                                            href={event.meetLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-violet-600 dark:text-violet-400 hover:underline font-bold flex items-center gap-1.5"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Join Google Meet
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    ) : (
                                                        <span>Online Meeting (Link provided on RSVP)</span>
                                                    )}
                                                </>
                                            )}
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
                                                if (isRsvp && event.meetLink) {
                                                    navigator.clipboard.writeText(event.meetLink);
                                                    alert(`"${event.title}" Google Meet link copied to clipboard!`);
                                                } else {
                                                    alert(`"${event.title}" invitation link copied to clipboard!`);
                                                }
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
            )}
        </div>
    );
};

export default EventsPage;
