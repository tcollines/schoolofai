import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, MapPin, Video, Users, Clock, Send, X, Edit } from 'lucide-react';
import { useAdmin } from '../../src/hooks/useAdmin';

interface EventItem {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    type: 'Workshop' | 'Webinar' | 'Panel' | 'Meeting' | 'Announcement';
    speaker: string;
    medium?: 'Online' | 'Physical';
    meetLink?: string;
    location?: string;
    courseId: string;
    attendeeCount: number;
    tags?: string[];
    premiered?: boolean;
}

const defaultAdminEvents = [
    {
        id: 'ev-1',
        title: 'Generative AI Hackathon: Building with LLMs',
        description: 'Join WSAI instructors and mentors for an intensive hackathon where you will build and deploy functional GenAI projects using OpenAI API, LangChain, and Streamlit.',
        date: '2026-07-15',
        time: '14:00 - 17:00 (SAST)',
        type: 'Workshop',
        speaker: 'Dr. Sarah Jenkins, Head of Generative AI Research',
        tags: ['LLMs', 'LangChain', 'GenAI'],
        courseId: 'global',
        attendeeCount: 142,
        medium: 'Online',
        meetLink: 'https://meet.google.com/zgd-bexr-jfy',
        premiered: true
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
        courseId: 'global',
        attendeeCount: 206,
        medium: 'Physical',
        location: 'Main Auditorium, Campus A, Cape Town'
    }
];

const AdminEvents: React.FC = () => {
    const { courses } = useAdmin();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [timeHour, setTimeHour] = useState('12');
    const [timeMinute, setTimeMinute] = useState('00');
    const [timePeriod, setTimePeriod] = useState('PM');
    const [type, setType] = useState<'Workshop' | 'Webinar' | 'Panel'>('Workshop');
    const [speaker, setSpeaker] = useState('Admin Team');
    const [courseId, setCourseId] = useState('global');
    const [medium, setMedium] = useState<'Online' | 'Physical'>('Online');
    const [meetLink, setMeetLink] = useState('');
    const [location, setLocation] = useState('');
    const [premiered, setPremiered] = useState(false);

    // Sync timeHour, timeMinute, and timePeriod back to time string
    useEffect(() => {
        setTime(`${timeHour}:${timeMinute} ${timePeriod}`);
    }, [timeHour, timeMinute, timePeriod]);

    const openCreateModal = () => {
        setEditingEvent(null);
        setTitle('');
        setDescription('');
        setDate('');
        setTimeHour('12');
        setTimeMinute('00');
        setTimePeriod('PM');
        setTime('12:00 PM');
        setType('Workshop');
        setSpeaker('Admin Team');
        setCourseId('global');
        setMedium('Online');
        setMeetLink('');
        setLocation('');
        setPremiered(false);
        setIsModalOpen(true);
    };

    const openEditModal = (event: EventItem) => {
        setEditingEvent(event);
        setTitle(event.title);
        setDescription(event.description);
        setDate(event.date);
        
        let initialHour = '12';
        let initialMinute = '00';
        let initialPeriod = 'PM';
        try {
            const cleanTime = event.time.trim();
            const firstPart = cleanTime.split(' ')[0]; // "14:00" or "02:00"
            let [h, m] = firstPart.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                const isPM = cleanTime.toLowerCase().includes('pm') || h >= 12;
                initialPeriod = isPM ? 'PM' : 'AM';
                if (h > 12) {
                    h -= 12;
                } else if (h === 0) {
                    h = 12;
                }
                initialHour = String(h).padStart(2, '0');
                initialMinute = String(m).padStart(2, '0');
            }
        } catch (e) {
            console.error("Failed to parse time:", e);
        }
        
        setTimeHour(initialHour);
        setTimeMinute(initialMinute);
        setTimePeriod(initialPeriod);
        setTime(event.time);
        
        setType(event.type as any);
        setSpeaker(event.speaker);
        setCourseId(event.courseId);
        setMedium(event.medium || 'Online');
        setMeetLink(event.meetLink || '');
        setLocation(event.location || '');
        setPremiered(!!event.premiered);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const loadEvents = () => {
            const stored = localStorage.getItem('admin-events');
            if (!stored) {
                localStorage.setItem('admin-events', JSON.stringify(defaultAdminEvents));
                setEvents(defaultAdminEvents as any);
            } else {
                setEvents(JSON.parse(stored));
            }
        };

        loadEvents();
        window.addEventListener('admin-events-update', loadEvents);
        return () => {
            window.removeEventListener('admin-events-update', loadEvents);
        };
    }, []);

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        const updated = events.filter(e => e.id !== id);
        setEvents(updated);
        localStorage.setItem('admin-events', JSON.stringify(updated));
        window.dispatchEvent(new Event('admin-events-update'));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !date || !time) {
            alert('Please fill out all fields.');
            return;
        }

        // Validate that event is scheduled at least 30 minutes in the future
        try {
            const cleanTime = time.trim();
            const timePart = cleanTime.split(' ')[0]; // "14:00" or "02:30"
            let [hours, minutes] = timePart.split(':').map(Number);
            const [year, month, day] = date.split('-').map(Number);
            
            if (isNaN(hours) || isNaN(minutes) || isNaN(year) || isNaN(month) || isNaN(day)) {
                alert('Please enter a valid date (YYYY-MM-DD) and a start time.');
                return;
            }
            
            const isPM = cleanTime.toLowerCase().includes('pm');
            const isAM = cleanTime.toLowerCase().includes('am');
            if (isPM && hours < 12) {
                hours += 12;
            } else if (isAM && hours === 12) {
                hours = 0;
            }
        } catch (err) {
            alert('Please check the date and time format.');
            return;
        }

        if (medium === 'Online') {
            if (!meetLink) {
                alert('Please provide a Google Meet link for the online session.');
                return;
            }
            if (!meetLink.includes('meet.google.com') && !meetLink.startsWith('http')) {
                alert('Please enter a valid Google Meet link.');
                return;
            }
        } else {
            if (!location) {
                alert('Please provide a physical location.');
                return;
            }
        }

        let updated: EventItem[];
        if (editingEvent) {
            updated = events.map(e => e.id === editingEvent.id ? {
                ...e,
                title,
                description,
                date,
                time,
                type,
                speaker,
                courseId,
                medium,
                meetLink: medium === 'Online' ? meetLink : undefined,
                location: medium === 'Physical' ? location : undefined,
                tags: courseId === 'global' ? ['Global'] : [courses.find(c => c.id === courseId)?.title || 'Course'],
                premiered
            } : e);
        } else {
            const newEvent: EventItem = {
                id: 'admin-' + Date.now(),
                title,
                description,
                date,
                time,
                type,
                speaker,
                courseId,
                attendeeCount: 0,
                medium,
                meetLink: medium === 'Online' ? meetLink : undefined,
                location: medium === 'Physical' ? location : undefined,
                tags: courseId === 'global' ? ['Global'] : [courses.find(c => c.id === courseId)?.title || 'Course'],
                premiered
            };
            updated = [newEvent, ...events];
        }

        setEvents(updated);
        localStorage.setItem('admin-events', JSON.stringify(updated));
        window.dispatchEvent(new Event('admin-events-update'));

        // Trigger notification
        const storedNotifs = localStorage.getItem('portal-notifications');
        const notifList = storedNotifs ? JSON.parse(storedNotifs) : [];
        const newNotif = {
            id: Date.now().toString(),
            title: editingEvent ? `Event Updated: ${title}` : `New Event: ${title}`,
            description: description,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'system'
        };
        localStorage.setItem('portal-notifications', JSON.stringify([newNotif, ...notifList]));
        window.dispatchEvent(new Event('notifications-update'));

        // Reset
        setIsModalOpen(false);
        setEditingEvent(null);
        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setSpeaker('Admin Team');
        setCourseId('global');
        setMeetLink('');
        setMedium('Online');
        setLocation('');
        setPremiered(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ongoing & Upcoming Events</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage and publish live events or workshops for students</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer shadow-md shadow-violet-200 dark:shadow-none"
                >
                    <Plus size={16} /> Add Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-slate-900 p-12 text-center text-gray-500 dark:text-slate-400 rounded-2xl border border-gray-100 dark:border-slate-800">
                        No upcoming events scheduled. Click "Add Event" to schedule one.
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between transition-colors relative group">
                            <div className="absolute top-4 right-4 flex gap-1 z-10">
                                <button
                                    onClick={() => openEditModal(event)}
                                    className="text-gray-400 hover:text-violet-600 p-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/20 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                                    title="Edit Event"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(event.id)}
                                    className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                                    title="Delete Event"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2.5 py-1 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-full text-xs font-bold uppercase tracking-wider">
                                        {event.type}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        event.medium === 'Online' 
                                            ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400' 
                                            : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                                    }`}>
                                        {event.medium || 'Online'}
                                    </span>
                                </div>

                                <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mb-2 text-left">
                                    {event.title}
                                </h3>

                                <p className="text-gray-500 dark:text-slate-400 text-sm line-clamp-3 mb-4 text-left">
                                    {event.description}
                                </p>

                                <div className="space-y-2.5 text-xs text-gray-600 dark:text-slate-350 border-t border-gray-50 dark:border-slate-800/50 pt-4">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-violet-500 shrink-0" />
                                        <span>{event.date} @ {event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-violet-500 shrink-0" />
                                        <span>Speaker: <strong className="text-gray-800 dark:text-gray-200">{event.speaker}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {event.medium === 'Online' ? (
                                            <>
                                                <Video size={14} className="text-green-500 shrink-0" />
                                                <a href={event.meetLink} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline line-clamp-1">
                                                    {event.meetLink}
                                                </a>
                                            </>
                                        ) : (
                                            <>
                                                <MapPin size={14} className="text-blue-500 shrink-0" />
                                                <span className="line-clamp-1 text-gray-800 dark:text-gray-200">{event.location}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-800/50 flex justify-between items-center text-xs">
                                <span className="text-gray-400 dark:text-slate-500">
                                    Target Group: <strong className="text-gray-600 dark:text-slate-300 capitalize">{event.courseId === 'global' ? 'Global' : 'Course specific'}</strong>
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create / Edit Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar size={20} className="text-violet-600" /> {editingEvent ? 'Edit Scheduled Event' : 'Create New Event'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer border-0 bg-transparent">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-left">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Event Type</label>
                                    <select 
                                        value={type} 
                                        onChange={(e) => setType(e.target.value as any)}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm"
                                    >
                                        <option value="Workshop">Workshop</option>
                                        <option value="Webinar">Webinar</option>
                                        <option value="Panel">Panel Discussion</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Host / Speaker</label>
                                    <input 
                                        type="text" 
                                        value={speaker} 
                                        onChange={(e) => setSpeaker(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm"
                                        placeholder="e.g. Dr. Sarah Jenkins" 
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Event Title</label>
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm"
                                    placeholder="Enter event title..." 
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Description</label>
                                <textarea 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm h-24"
                                    placeholder="Enter event details and what students will learn..." 
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Date</label>
                                    <input 
                                        type="date" 
                                        value={date} 
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm" 
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Time</label>
                                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl p-2.5 w-full text-sm">
                                        <select
                                            value={timeHour}
                                            onChange={(e) => setTimeHour(e.target.value)}
                                            className="bg-transparent text-gray-800 dark:text-slate-200 outline-none cursor-pointer flex-1 text-center"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                                <option key={h} value={h} className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200">{h}</option>
                                            ))}
                                        </select>
                                        <span className="text-gray-400 dark:text-slate-500 font-bold">:</span>
                                        <select
                                            value={timeMinute}
                                            onChange={(e) => setTimeMinute(e.target.value)}
                                            className="bg-transparent text-gray-800 dark:text-slate-200 outline-none cursor-pointer flex-1 text-center"
                                        >
                                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                                <option key={m} value={m} className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200">{m}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={timePeriod}
                                            onChange={(e) => setTimePeriod(e.target.value)}
                                            className="bg-transparent text-gray-800 dark:text-slate-200 font-semibold outline-none cursor-pointer flex-1 text-center"
                                        >
                                            <option value="AM" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200">AM</option>
                                            <option value="PM" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200">PM</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Target Group (Visibility)</label>
                                <select 
                                    value={courseId} 
                                    onChange={(e) => setCourseId(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm"
                                >
                                    <option value="global">Global (All Students)</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Event Medium</label>
                                <select 
                                    value={medium} 
                                    onChange={(e) => setMedium(e.target.value as any)}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm"
                                >
                                    <option value="Online">Online / Virtual Meeting</option>
                                    <option value="Physical">Physical / In-Person Campus</option>
                                </select>
                            </div>

                            {medium === 'Online' ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Google Meet Link</label>
                                    <input 
                                        type="text" 
                                        value={meetLink} 
                                        onChange={(e) => setMeetLink(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm"
                                        placeholder="https://meet.google.com/abc-defg-hij" 
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Physical Location / Room</label>
                                    <input 
                                        type="text" 
                                        value={location} 
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl text-sm"
                                        placeholder="e.g. Main Auditorium, Cape Town" 
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2 text-left">
                                <input 
                                    type="checkbox" 
                                    id="premiered" 
                                    checked={premiered} 
                                    onChange={(e) => setPremiered(e.target.checked)}
                                    className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500 cursor-pointer"
                                />
                                <label htmlFor="premiered" className="text-xs font-semibold text-gray-700 dark:text-slate-350 cursor-pointer select-none">
                                    Premiere Event (Always show ticking countdown on student portal)
                                </label>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-350 bg-transparent rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-violet-200 dark:shadow-none"
                                >
                                    <Send size={14} /> {editingEvent ? 'Save Changes' : 'Schedule Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEvents;
