import React, { useState } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { Users, BookOpen, TrendingUp, DollarSign, Calendar, Megaphone, Send } from 'lucide-react';

const AdminOverview: React.FC = () => {
    const { users, courses, loading } = useAdmin(true);

    // Event & Announcement State
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'Meeting' | 'Announcement'>('Meeting');
    const [speaker, setSpeaker] = useState('Admin Team');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [courseId, setCourseId] = useState('global');
    const [meetLink, setMeetLink] = useState('');
    const [medium, setMedium] = useState<'Online' | 'Physical'>('Online');
    const [location, setLocation] = useState('');

    if (loading) return <div>Loading statistics...</div>;

    const totalRevenue = users.filter(u => u.role === 'PLUS' || u.role === 'PRO').length * 29; // Mock calculation
    const paidUsers = users.filter(u => u.role !== 'INDIVIDUAL').length;

    const handlePublish = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !date || !time) {
            alert('Please fill out all fields.');
            return;
        }

        if (type === 'Meeting') {
            if (medium === 'Online') {
                if (!meetLink) {
                    alert('Please provide a Google Meet link for the online session.');
                    return;
                }
                if (!meetLink.includes('meet.google.com') && !meetLink.startsWith('http')) {
                    alert('Please enter a valid Google Meet link (e.g. https://meet.google.com/abc-defg-hij).');
                    return;
                }
            } else {
                if (!location) {
                    alert('Please provide a physical location/address for the session.');
                    return;
                }
            }
        }

        const newEvent = {
            id: 'admin-' + Date.now(),
            title,
            description,
            date,
            time,
            type: type === 'Meeting' ? 'Webinar' : 'Panel',
            isAnnouncement: type === 'Announcement',
            speaker,
            tags: courseId === 'global' ? ['Global'] : [courses.find(c => c.id === courseId)?.title || 'Course'],
            courseId,
            attendeeCount: 0,
            medium: type === 'Meeting' ? medium : undefined,
            meetLink: type === 'Meeting' && medium === 'Online' ? meetLink : undefined,
            location: type === 'Meeting' && medium === 'Physical' ? location : undefined
        };

        const stored = localStorage.getItem('admin-events');
        const list = stored ? JSON.parse(stored) : [];
        localStorage.setItem('admin-events', JSON.stringify([newEvent, ...list]));

        // Add to portal notifications
        const storedNotifs = localStorage.getItem('portal-notifications');
        const notifList = storedNotifs ? JSON.parse(storedNotifs) : [];
        const newNotif = {
            id: Date.now().toString(),
            title: `New Admin ${type}: ${title}`,
            description: description,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'system'
        };
        localStorage.setItem('portal-notifications', JSON.stringify([newNotif, ...notifList]));
        window.dispatchEvent(new Event('notifications-update'));

        alert(`Successfully published ${type}: "${title}"!`);
        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setSpeaker('Admin Team');
        setCourseId('global');
        setMeetLink('');
        setMedium('Online');
        setLocation('');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Active Courses</p>
                        <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Paid Subscriptions</p>
                        <p className="text-2xl font-bold text-gray-900">{paidUsers}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Monthly Rev (Est)</p>
                        <p className="text-2xl font-bold text-gray-900">${totalRevenue}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Publish Events Form */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-violet-600">
                        <Calendar size={18} /> Publish Live Meeting or Announcement
                    </h3>
                    <form onSubmit={handlePublish} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Type</label>
                                <select 
                                    value={type} 
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-xl text-sm"
                                >
                                    <option value="Meeting">Live Meeting / Webinar</option>
                                    <option value="Announcement">Global Announcement</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Host / Speaker</label>
                                <input 
                                    type="text" 
                                    value={speaker} 
                                    onChange={(e) => setSpeaker(e.target.value)}
                                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-xl text-sm"
                                    placeholder="e.g. Admin Team" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Title</label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-250 rounded-xl text-sm"
                                placeholder="Enter title..." 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Details / Description</label>
                            <textarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-250 rounded-xl text-sm h-20"
                                placeholder="Enter details..." 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Date</label>
                                <input 
                                    type="date" 
                                    value={date} 
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-xl text-sm" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Time</label>
                                <input 
                                    type="text" 
                                    value={time} 
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-xl text-sm"
                                    placeholder="e.g. 14:00 - 15:30 (SAST)" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Target Group (Course Specific)</label>
                            <select 
                                value={courseId} 
                                onChange={(e) => setCourseId(e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-250 rounded-xl text-sm"
                            >
                                <option value="global">Global (All Students)</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>

                        {type === 'Meeting' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Event Medium</label>
                                    <select 
                                        value={medium} 
                                        onChange={(e) => setMedium(e.target.value as any)}
                                        className="w-full p-2 bg-gray-50 border border-gray-250 rounded-xl text-sm"
                                    >
                                        <option value="Online">Online / Virtual Meeting</option>
                                        <option value="Physical">Physical / In-Person Campus</option>
                                    </select>
                                </div>

                                {medium === 'Online' ? (
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600">Google Meet Link</label>
                                        <input 
                                            type="text" 
                                            value={meetLink} 
                                            onChange={(e) => setMeetLink(e.target.value)}
                                            className="w-full p-2 bg-gray-50 border border-gray-250 rounded-xl text-sm"
                                            placeholder="https://meet.google.com/abc-defg-hij" 
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600">Physical Location / Room</label>
                                        <input 
                                            type="text" 
                                            value={location} 
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full p-2 bg-gray-50 border border-gray-250 rounded-xl text-sm"
                                            placeholder="e.g. WSAI Campus Hall A, Johannesburg" 
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <button 
                            type="submit" 
                            className="w-full bg-violet-600 hover:bg-violet-750 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Send size={14} /> Publish Event
                        </button>
                    </form>
                </div>

                {/* System Alerts */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-600">
                        <Megaphone size={18} /> System Alerts
                    </h3>
                    <div className="text-gray-500 italic text-sm">No new alerts. System operating normally.</div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
