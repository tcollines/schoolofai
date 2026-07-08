import React, { useState, useEffect } from 'react';
import { Bell, CheckSquare, Trash2, CheckCircle2, FileText, Camera, Shield, ArrowLeft } from 'lucide-react';
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
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

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

        const handleNotificationsUpdate = () => {
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

    const toggleRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
        setNotifications(updated);
        localStorage.setItem('portal-notifications', JSON.stringify(updated));
        window.dispatchEvent(new Event('notifications-update'));
    };

    const markAllRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        localStorage.setItem('portal-notifications', JSON.stringify(updated));
        window.dispatchEvent(new Event('notifications-update'));
    };

    const clearAll = () => {
        setNotifications([]);
        localStorage.setItem('portal-notifications', '[]');
        window.dispatchEvent(new Event('notifications-update'));
    };

    const deleteNotification = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // prevent toggling read state
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        localStorage.setItem('portal-notifications', JSON.stringify(updated));
        window.dispatchEvent(new Event('notifications-update'));
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
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        return true;
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className="text-welile-purple" /> {t('notifications')}
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                        Stay updated with assignments, profile alerts, and portal activity.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={markAllRead}
                        disabled={notifications.every(n => n.read)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                        <CheckSquare size={14} /> Mark all Read
                    </button>
                    <button 
                        onClick={clearAll}
                        disabled={notifications.length === 0}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/45 disabled:opacity-50 transition-colors"
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            filter === 'all' 
                                ? 'bg-welile-purple text-white' 
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilter('unread')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                            filter === 'unread' 
                                ? 'bg-welile-purple text-white' 
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
                    <Bell className="mx-auto w-12 h-12 text-gray-300 dark:text-slate-700 mb-4" />
                    <p className="text-gray-500 dark:text-slate-400 font-semibold mb-1">No notifications found</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">You are all caught up for now!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredNotifications.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => toggleRead(item.id)}
                            className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex gap-4 items-start ${
                                item.read 
                                    ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800/80 opacity-75' 
                                    : 'bg-violet-50/20 dark:bg-violet-950/10 border-violet-100/50 dark:border-violet-900/30 ring-1 ring-violet-500/10'
                            }`}
                        >
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                                item.read 
                                    ? 'bg-gray-50 dark:bg-slate-800' 
                                    : 'bg-violet-50 dark:bg-violet-900/30'
                            }`}>
                                {getIcon(item.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4 mb-1">
                                    <h4 className={`text-sm font-bold text-gray-900 dark:text-white truncate ${
                                        !item.read && 'text-violet-950 dark:text-violet-300'
                                    }`}>
                                        {item.title}
                                    </h4>
                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium whitespace-nowrap">
                                        {formatTimestamp(item.timestamp)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium">
                                    {item.description}
                                </p>
                            </div>

                            <button 
                                onClick={(e) => deleteNotification(e, item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                                title="Delete"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
