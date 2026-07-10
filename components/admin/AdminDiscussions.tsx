import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { MessageSquare, Trash2, ShieldAlert, Bot, User, Users } from 'lucide-react';

interface Message {
    id: string;
    senderId?: string;
    senderName: string;
    senderAvatar: string;
    role: 'instructor' | 'student' | 'ai';
    content: string;
    timestamp: string;
}

interface ChatGroup {
    id: string;
    name: string;
    description: string;
    isGeneral?: boolean;
    courseId?: string;
    messages: Message[];
}

const INITIAL_GENERAL_CHAT: Message[] = [
    {
        id: 'g1',
        senderName: 'Dr. Kenji Tanaka',
        senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60',
        role: 'instructor',
        content: 'Welcome to the school discussion space! Feel free to ask questions about your modules, career paths, or AI tools.',
        timestamp: '10:14 AM'
    },
    {
        id: 'g2',
        senderName: 'Sarah Jenkins',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
        role: 'student',
        content: 'Hi everyone! Im currently studying the Deep Learning module. Anyone up for a weekend virtual study group?',
        timestamp: '10:30 AM'
    },
    {
        id: 'g3',
        senderName: 'StudyBot AI',
        senderAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&auto=format&fit=crop&q=60',
        role: 'ai',
        content: 'Hello! I am here to help answer academic queries. Type your query or tag me if you need help summarizing concepts.',
        timestamp: '10:32 AM'
    }
];

const INITIAL_AI_CHAT: Message[] = [
    {
        id: 'a1',
        senderName: 'StudyBot AI',
        senderAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&auto=format&fit=crop&q=60',
        role: 'ai',
        content: 'Hello! This is your dedicated AI assistant channel. Paste any lecture notes, quiz questions, or essay drafts here for instant analysis and feedback.',
        timestamp: '09:00 AM'
    }
];

const AdminDiscussions: React.FC = () => {
    const { courses, loading } = useAdmin();
    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('general');
    const [inputText, setInputText] = useState('');

    const loadChats = () => {
        const generalGroups: ChatGroup[] = [
            {
                id: 'general',
                name: 'General Discussion',
                description: 'Global community chat room for all students and instructors.',
                isGeneral: true,
                messages: INITIAL_GENERAL_CHAT
            },
            {
                id: 'ai-help',
                name: 'AI Study Assistant Help Desk',
                description: 'Interactive AI tutor for direct course guidance.',
                isGeneral: true,
                messages: INITIAL_AI_CHAT
            }
        ];

        const courseGroups: ChatGroup[] = courses.map(course => ({
            id: `course-${course.id}`,
            name: `${course.title} Study Group`,
            description: `Class channel for ${course.instructor}'s course curriculum.`,
            courseId: course.id,
            messages: [
                {
                    id: `c-init-${course.id}`,
                    senderName: course.instructor,
                    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
                    role: 'instructor',
                    content: `Welcome to the class channel for ${course.title}! Post questions here, share resources, and help each other learn.`,
                    timestamp: 'Yesterday'
                }
            ]
        }));

        const deletedGroupIds: string[] = JSON.parse(localStorage.getItem('deleted-chat-groups') || '[]');
        const studentCreated: ChatGroup[] = JSON.parse(localStorage.getItem('student-created-groups') || '[]');
        const allGroups = [...generalGroups, ...courseGroups, ...studentCreated].filter(g => !deletedGroupIds.includes(g.id));
        
        const updated = allGroups.map(g => {
            const saved = localStorage.getItem(`chat-messages-${g.id}`);
            if (saved) {
                return { ...g, messages: JSON.parse(saved) };
            }
            return g;
        });

        setGroups(updated);
    };

    useEffect(() => {
        if (!loading) {
            loadChats();
        }
    }, [courses, loading]);

    useEffect(() => {
        const handleSync = () => {
            loadChats();
        };
        window.addEventListener('storage', handleSync);
        window.addEventListener('chat-messages-update', handleSync);
        return () => {
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('chat-messages-update', handleSync);
        };
    }, [groups]);

    const activeGroup = groups.find(g => g.id === selectedGroupId) || groups[0];

    const handleDeleteMessage = (messageId: string) => {
        if (!activeGroup) return;
        if (!confirm('Are you sure you want to delete this message from the discussion group?')) return;

        const updatedMessages = activeGroup.messages.filter(m => m.id !== messageId);
        
        // Save to localStorage
        localStorage.setItem(`chat-messages-${activeGroup.id}`, JSON.stringify(updatedMessages));
        
        // Dispatch local event for instant UI update in other components
        window.dispatchEvent(new CustomEvent('chat-messages-update', { detail: { groupId: activeGroup.id } }));
        
        // Re-load chats locally
        loadChats();
    };

    const handleDeleteGroup = (groupId: string) => {
        if (!confirm('Are you sure you want to delete this discussion channel and all its messages?')) return;
        const deletedGroupIds: string[] = JSON.parse(localStorage.getItem('deleted-chat-groups') || '[]');
        deletedGroupIds.push(groupId);
        localStorage.setItem('deleted-chat-groups', JSON.stringify(deletedGroupIds));
        
        // Dispatch local event for instant UI update
        window.dispatchEvent(new Event('chat-messages-update'));
        
        // If we deleted the currently selected group, fall back to general
        if (selectedGroupId === groupId) {
            setSelectedGroupId('general');
        }
        
        loadChats();
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeGroup) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const newAdminMessage = {
            id: 'admin-' + Date.now(),
            senderName: 'Dr. Kenji Tanaka',
            senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60',
            role: 'instructor' as const,
            content: inputText,
            timestamp: timeStr
        };

        const updatedMessages = [...activeGroup.messages, newAdminMessage];
        localStorage.setItem(`chat-messages-${activeGroup.id}`, JSON.stringify(updatedMessages));
        setInputText('');

        // Dispatch local event for instant UI update
        window.dispatchEvent(new Event('chat-messages-update'));
        
        loadChats();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-gray-500">
                Loading discussion channels...
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
            {/* Sidebar - Groups list */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 flex flex-col space-y-4 overflow-y-auto">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                    <Users size={18} className="text-violet-600" />
                    <span className="font-bold text-gray-900 dark:text-white">Active Channels ({groups.length})</span>
                </div>
                <div className="flex-1 space-y-2">
                    {groups.map(group => (
                        <div
                            key={group.id}
                            onClick={() => setSelectedGroupId(group.id)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1 cursor-pointer ${
                                selectedGroupId === group.id
                                    ? 'bg-violet-50/50 border-violet-250 dark:bg-violet-955/20 dark:border-violet-900/50 text-gray-900 dark:text-white shadow-sm'
                                    : 'border-gray-50 dark:border-slate-800/40 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 text-gray-600 dark:text-slate-400'
                            }`}
                        >
                            <div className="flex justify-between items-center w-full gap-2">
                                <span className="font-bold text-sm truncate">{group.name}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono font-semibold animate-none">
                                        {group.messages.length}
                                    </span>
                                    {group.id !== 'general' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteGroup(group.id);
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                            title="Delete channel"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <span className="text-[11px] opacity-75 line-clamp-1">{group.description}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat message list area */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col min-h-0">
                {activeGroup ? (
                    <>
                        <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">{activeGroup.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{activeGroup.description}</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-full text-xs font-semibold">
                                <ShieldAlert size={14} /> Admin Mode
                            </div>
                        </div>

                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
                            {activeGroup.messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500 py-10">
                                    <MessageSquare size={36} className="mb-2 opacity-50" />
                                    <p className="text-sm font-medium">No messages in this discussion group.</p>
                                </div>
                            ) : (
                                activeGroup.messages.map(message => (
                                    <div 
                                        key={message.id} 
                                        className="flex items-start justify-between gap-4 p-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-slate-800/60 transition-all"
                                    >
                                        <div className="flex items-start gap-3">
                                            <img 
                                                src={message.senderAvatar} 
                                                alt={message.senderName} 
                                                className="w-9 h-9 rounded-full object-cover shadow-sm flex-shrink-0"
                                            />
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white">{message.senderName}</span>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                        message.role === 'instructor' 
                                                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-955/40 dark:text-violet-300 border border-violet-200' 
                                                            : message.role === 'ai'
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-955/40 dark:text-emerald-300 border border-emerald-200'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}>
                                                        {message.role}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">{message.timestamp}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-slate-350 pr-4 break-words whitespace-pre-wrap leading-relaxed">
                                                    {message.content}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteMessage(message.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-955/30 rounded-xl transition-colors cursor-pointer self-center animate-none"
                                            title="Delete message from channel"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Send Message Input Form */}
                        <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-800/60 flex gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type a message as Instructor (Dr. Kenji Tanaka)..."
                                className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                required
                            />
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-750 text-white rounded-xl text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                            >
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageSquare size={48} className="mb-2 opacity-50" />
                        <p className="font-medium">Select a channel to moderate messages.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDiscussions;
