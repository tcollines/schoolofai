import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckSquare, Trash2, CheckCircle2, FileText, Camera, Shield, ArrowLeft, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useTranslation } from './translations';

export interface NotificationItem {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    read: boolean;
    type: 'assignment' | 'profile' | 'course' | 'system';
}

const NotificationsPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null);

    const getNotifications = (): NotificationItem[] => {
        const stored = localStorage.getItem('portal-notifications');
        if (stored) {
            return JSON.parse(stored);
        }
        const defaults: NotificationItem[] = [
            {
                id: '1',
                title: 'New Assignment Added: AI Ethics Research Paper',
                description: 'A new assignment has been posted by Welile for the course "Introduction to Artificial Intelligence". Due in 5 days.',
                timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
                read: false,
                type: 'assignment'
            },
            {
                id: '2',
                title: 'Profile Picture Updated Successfully',
                description: 'Your profile avatar was successfully updated across the schoolofai portal.',
                timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
                read: true,
                type: 'profile'
            },
            {
                id: '3',
                title: 'Welcome to Welile School of AI!',
                description: 'Explore the Discover tab to find your first study course and start learning.',
                timestamp: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
                read: true,
                type: 'system'
            }
        ];
        localStorage.setItem('portal-notifications', JSON.stringify(defaults));
        return defaults;
    };

    useEffect(() => {
        setNotifications(getNotifications());

        const handleNotificationsUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.origin === 'NotificationsPage') {
                return;
            }
            const stored = localStorage.getItem('portal-notifications');
            if (stored) {
                setNotifications(JSON.parse(stored));
            }
        };
        window.addEventListener('notifications-update', handleNotificationsUpdate);
        return () => {
            window.removeEventListener('notifications-update', handleNotificationsUpdate);
        };
    }, []);

    const handleNotificationClick = (item: NotificationItem) => {
        // Toggle expansion
        setExpandedNotificationId(expandedNotificationId === item.id ? null : item.id);
        
        // Mark as read
        if (!item.read) {
            const updated = notifications.map(n => n.id === item.id ? { ...n, read: true } : n);
            setNotifications(updated);
            localStorage.setItem('portal-notifications', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('notifications-update', { detail: { origin: 'NotificationsPage' } }));
        }
    };

    const toggleRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
        setNotifications(updated);
        localStorage.setItem('portal-notifications', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('notifications-update', { detail: { origin: 'NotificationsPage' } }));
    };

    const markAllRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        localStorage.setItem('portal-notifications', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('notifications-update', { detail: { origin: 'NotificationsPage' } }));
    };

    const clearAll = () => {
        setNotifications([]);
        localStorage.setItem('portal-notifications', '[]');
        window.dispatchEvent(new CustomEvent('notifications-update', { detail: { origin: 'NotificationsPage' } }));
    };

    const deleteNotification = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // prevent toggling read/expansion
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        localStorage.setItem('portal-notifications', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('notifications-update', { detail: { origin: 'NotificationsPage' } }));
        if (expandedNotificationId === id) {
            setExpandedNotificationId(null);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'assignment':
                return <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
            case 'profile':
                return <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
            case 'course':
                return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
            default:
                return <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
        }
    };

    const formatTimestamp = (isoString: string) => {
        try {
            const date = new Date(isoString);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        } catch (e) {}
        return isoString;
    };

    const getActionLink = (type: string) => {
        switch (type) {
            case 'assignment':
                return { label: 'Go to Assignments', path: '/assignments' };
            case 'course':
                return { label: 'Go to My Courses', path: '/courses' };
            case 'profile':
                return { label: 'View Profile Settings', path: '/profile' };
            default:
                return { label: 'Go to Dashboard', path: '/dashboard' };
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        return true;
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Back Button */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold cursor-pointer transition-colors w-fit"
            >
                <ArrowLeft size={14} /> Back to Dashboard
            </button>

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className="text-purple-600" /> {t('notifications')}
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                        Stay updated with assignments, profile alerts, and portal activity.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={markAllRead}
                        disabled={notifications.every(n => n.read)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        <CheckSquare size={14} /> Mark all Read
                    </button>
                    <button 
                        onClick={clearAll}
                        disabled={notifications.length === 0}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/45 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        <Trash2 size={14} /> Clear All
                    </button>
                </div>
            </div>

            {/* Filter Tabs and Count */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            filter === 'all' 
                                ? 'bg-purple-600 text-white shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilter('unread')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                            filter === 'unread' 
                                ? 'bg-purple-600 text-white shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Unread
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full font-bold">
                                {notifications.filter(n => !n.read).length}
                            </span>
                        )}
                    </button>
                </div>
                <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                    Total: {notifications.length}
                </span>
            </div>

            {/* List */}
            {filteredNotifications.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-gray-100 dark:border-slate-800 text-center">
                    <Bell className="mx-auto w-12 h-12 text-gray-300 dark:text-slate-700 mb-4 animate-none" />
                    <p className="text-gray-500 dark:text-slate-400 font-semibold mb-1">No notifications found</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">You are all caught up for now!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredNotifications.map((item) => {
                        const isExpanded = expandedNotificationId === item.id;
                        const action = getActionLink(item.type);
                        
                        return (
                            <div 
                                key={item.id}
                                onClick={() => handleNotificationClick(item)}
                                className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col gap-3 shadow-sm hover:shadow-md ${
                                    item.read 
                                        ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800/80 opacity-80' 
                                        : 'bg-violet-50/15 dark:bg-violet-955/5 border-violet-100 dark:border-violet-950/60 ring-1 ring-violet-500/5'
                                }`}
                            >
                                <div className="flex gap-4 items-start w-full">
                                    {/* Icon Container */}
                                    <div className={`p-2.5 rounded-2xl shrink-0 ${
                                        item.read 
                                            ? 'bg-gray-50 dark:bg-slate-800' 
                                            : 'bg-violet-50 dark:bg-violet-950/40'
                                    }`}>
                                        {getIcon(item.type)}
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {!item.read && (
                                                    <span className="w-1.5 h-1.5 bg-violet-600 dark:bg-violet-400 rounded-full shrink-0"></span>
                                                )}
                                                <h4 className={`text-sm font-bold text-gray-900 dark:text-white leading-snug break-words ${
                                                    isExpanded ? '' : 'truncate'
                                                }`}>
                                                    {item.title}
                                                </h4>
                                            </div>
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium whitespace-nowrap">
                                                {formatTimestamp(item.timestamp)}
                                            </span>
                                        </div>
                                        <p className={`text-xs text-gray-500 dark:text-slate-400 leading-relaxed ${
                                            isExpanded ? '' : 'line-clamp-2'
                                        }`}>
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Expand/Delete Buttons */}
                                    <div className="flex items-center gap-1.5 shrink-0 self-start">
                                        <button 
                                            type="button"
                                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                            title={isExpanded ? 'Collapse' : 'Expand'}
                                        >
                                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                        </button>
                                        <button 
                                            onClick={(e) => deleteNotification(e, item.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-955/30 rounded-lg transition-colors cursor-pointer animate-none"
                                            title="Delete"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded details actions drawer */}
                                {isExpanded && (
                                    <div className="pl-14 border-t border-gray-50 dark:border-slate-800/60 pt-3 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
                                        <div className="text-[11px] text-gray-400 dark:text-slate-500 font-medium flex items-center gap-1">
                                            <span>Type: <strong className="capitalize">{item.type} Notification</strong></span>
                                            <span>•</span>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleRead(item.id);
                                                }}
                                                className="hover:underline text-violet-600 dark:text-violet-400 font-semibold cursor-pointer"
                                            >
                                                Mark as {item.read ? 'Unread' : 'Read'}
                                            </button>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(action.path);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-650 hover:bg-violet-750 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm self-end"
                                        >
                                            <span>{action.label}</span>
                                            <ExternalLink size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
