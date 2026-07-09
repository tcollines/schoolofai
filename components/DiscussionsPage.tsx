import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCourses } from '../src/hooks/useCourses';
import { Send, Users, ShieldAlert, MessageSquare, Bot, User, CheckCircle2, ChevronRight, Trash2, MoreVertical, Copy, Edit2 } from 'lucide-react';
import { Course } from '../types';

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
    isEnrolled: boolean;
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

const DiscussionsPage: React.FC = () => {
    const { displayUser } = useOutletContext<{ displayUser: any }>();
    const userId = displayUser?.id || 'guest';
    const { courses } = useCourses(userId === 'guest' ? undefined : userId);

    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('general');
    const [inputText, setInputText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editInputText, setEditInputText] = useState('');
    const [activeDropdownMessageId, setActiveDropdownMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Click outside listener to close dropdowns
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveDropdownMessageId(null);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Initialize groups based on general channels + student's enrolled courses
    useEffect(() => {
        const generalGroups: ChatGroup[] = [
            {
                id: 'general',
                name: 'General Discussion',
                description: 'Global community chat room for all students and instructors.',
                isGeneral: true,
                isEnrolled: true,
                messages: INITIAL_GENERAL_CHAT
            },
            {
                id: 'ai-help',
                name: 'AI Study Assistant Help Desk',
                description: 'Interactive AI tutor for direct course guidance.',
                isGeneral: true,
                isEnrolled: true,
                messages: INITIAL_AI_CHAT
            }
        ];

        const courseGroups: ChatGroup[] = courses.map(course => {
            const isEnrolled = course.status !== 'NOT_STARTED';
            return {
                id: `course-${course.id}`,
                name: `${course.title} Study Group`,
                description: `Class channel for ${course.instructor}'s course curriculum.`,
                courseId: course.id,
                isEnrolled: isEnrolled,
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
            };
        });

        // Load messages from localStorage if they exist to persist user chats
        const allInitialized = [...generalGroups, ...courseGroups];
        const updatedGroups = allInitialized.map(g => {
            const saved = localStorage.getItem(`chat-messages-${g.id}`);
            if (saved) {
                return { ...g, messages: JSON.parse(saved) };
            }
            return g;
        });

        setGroups(updatedGroups);
    }, [courses]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedGroupId, groups]);

    const activeGroup = groups.find(g => g.id === selectedGroupId) || groups[0];

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeGroup) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const newUserMessage: Message = {
            id: 'user-' + Date.now(),
            senderId: userId,
            senderName: displayUser?.name || 'Student',
            senderAvatar: displayUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
            role: 'student',
            content: inputText,
            timestamp: timeStr
        };

        const updatedMessages = [...activeGroup.messages, newUserMessage];
        const updatedGroups = groups.map(g => {
            if (g.id === activeGroup.id) {
                const newG = { ...g, messages: updatedMessages };
                localStorage.setItem(`chat-messages-${newG.id}`, JSON.stringify(updatedMessages));
                return newG;
            }
            return g;
        });

        setGroups(updatedGroups);
        setInputText('');

        // Simulate AI Reply in AI Channel or Course Channels
        if (activeGroup.id === 'ai-help' || activeGroup.courseId) {
            setTimeout(() => {
                const aiReply: Message = {
                    id: 'ai-reply-' + Date.now(),
                    senderName: activeGroup.id === 'ai-help' ? 'StudyBot AI' : 'Class AI Tutor',
                    senderAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&auto=format&fit=crop&q=60',
                    role: 'ai',
                    content: `I received your message: "${inputText}". As an AI learning assistant, I recommend checking the corresponding modules for reference. Let me know if you would like me to compile study summaries!`,
                    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                };

                const finalMessages = [...updatedMessages, aiReply];
                const finalGroups = updatedGroups.map(g => {
                    if (g.id === activeGroup.id) {
                        const newG = { ...g, messages: finalMessages };
                        localStorage.setItem(`chat-messages-${newG.id}`, JSON.stringify(finalMessages));
                        return newG;
                    }
                    return g;
                });
                setGroups(finalGroups);
            }, 1200);
        }
    };

    const handleDeleteMessage = (messageId: string) => {
        if (!activeGroup) return;
        const updatedMessages = activeGroup.messages.filter(m => m.id !== messageId);
        const updatedGroups = groups.map(g => {
            if (g.id === activeGroup.id) {
                const newG = { ...g, messages: updatedMessages };
                localStorage.setItem(`chat-messages-${newG.id}`, JSON.stringify(updatedMessages));
                return newG;
            }
            return g;
        });
        setGroups(updatedGroups);
    };

    const handleSaveEdit = (messageId: string) => {
        if (!activeGroup || !editInputText.trim()) return;
        const updatedMessages = activeGroup.messages.map(m => {
            if (m.id === messageId) {
                return { ...m, content: editInputText, isEdited: true };
            }
            return m;
        });
        const updatedGroups = groups.map(g => {
            if (g.id === activeGroup.id) {
                const newG = { ...g, messages: updatedMessages };
                localStorage.setItem(`chat-messages-${newG.id}`, JSON.stringify(updatedMessages));
                return newG;
            }
            return g;
        });
        setGroups(updatedGroups);
        setEditingMessageId(null);
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'instructor':
                return 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-850';
            case 'ai':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-850';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Class Discussion Groups</h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1">Connect with classmates, ask questions, and chat with AI tutors.</p>
            </div>

            {/* Layout Wrapper */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-230px)] min-h-[500px]">
                {/* Left Sidebar - Channels List */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
                        <Users size={18} className="text-violet-600" />
                        <span className="font-bold text-gray-950 dark:text-white text-sm">Channels & Groups</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {groups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => setSelectedGroupId(group.id)}
                                className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-start gap-3 relative ${
                                    selectedGroupId === group.id
                                        ? 'bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
                                }`}
                            >
                                <div className={`p-2.5 rounded-xl ${
                                    group.isEnrolled 
                                        ? 'bg-violet-100 text-violet-750 dark:bg-violet-950/50 dark:text-violet-300' 
                                        : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-550'
                                }`}>
                                    <MessageSquare size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                        {/* Bolding Requirement: Enrolled channels / General channels are bolded */}
                                        <span className={`truncate text-sm text-gray-900 dark:text-slate-100 ${
                                            group.isEnrolled ? 'font-bold text-violet-900 dark:text-violet-200' : 'font-normal'
                                        }`}>
                                            {group.name}
                                        </span>
                                        {group.isEnrolled && (
                                            <span className="shrink-0 flex items-center gap-0.5 text-[10px] bg-violet-100 text-violet-750 dark:bg-violet-950/40 dark:text-violet-300 px-1.5 py-0.5 rounded-full font-bold">
                                                <CheckCircle2 size={10} /> Yours
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{group.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Chat Board */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 flex flex-col h-full overflow-hidden relative">
                    {/* Chat Header */}
                    {activeGroup && (
                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/30 dark:bg-slate-900/30">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {activeGroup.name}
                                    {activeGroup.isEnrolled && (
                                        <span className="text-[10px] bg-violet-100 text-violet-750 dark:bg-violet-950/40 dark:text-violet-300 px-2 py-0.5 rounded-full font-bold">
                                            My Channel
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{activeGroup.description}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-800 px-2.5 py-1.5 rounded-xl">
                                <Users size={14} className="text-violet-600 animate-pulse" />
                                <span>{activeGroup.isGeneral ? '1,240' : '48'} active</span>
                            </div>
                        </div>
                    )}

                    {/* Chat Message Window */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/20 dark:bg-slate-900/10">
                        {activeGroup?.messages.map((msg) => {
                            const isOwnMessage = msg.senderId === userId || (!msg.senderId && (msg.senderName === displayUser?.name || msg.senderName === 'Student' || msg.senderName === 'Guest'));
                            return (
                                <div key={msg.id} className="flex items-start gap-3">
                                    <img
                                        src={msg.senderAvatar}
                                        alt={msg.senderName}
                                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-150 dark:border-slate-700 shadow-sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                                                {msg.senderName}
                                            </span>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${getRoleBadgeClass(msg.role)}`}>
                                                {msg.role}
                                            </span>
                                            <span className="text-[10px] text-gray-400 ml-auto">
                                                {msg.timestamp}
                                            </span>
                                            {/* Dropdown Options trigger */}
                                            <div className="relative inline-block ml-2 self-center shrink-0">
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdownMessageId(activeDropdownMessageId === msg.id ? null : msg.id);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                    title="Message Actions"
                                                >
                                                    <MoreVertical size={13} />
                                                </button>
                                                
                                                {activeDropdownMessageId === msg.id && (
                                                    <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xl z-50 p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(msg.content);
                                                                setActiveDropdownMessageId(null);
                                                            }}
                                                            className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-305 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                                                        >
                                                            <Copy size={12} />
                                                            <span>Copy Text</span>
                                                        </button>
                                                        
                                                        {isOwnMessage && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingMessageId(msg.id);
                                                                        setEditInputText(msg.content);
                                                                        setActiveDropdownMessageId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-305 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                                                                >
                                                                    <Edit2 size={12} />
                                                                    <span>Edit Message</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleDeleteMessage(msg.id);
                                                                        setActiveDropdownMessageId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 dark:text-red-400 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                                                                >
                                                                    <Trash2 size={12} />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {editingMessageId === msg.id ? (
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                handleSaveEdit(msg.id);
                                            }} className="flex gap-2 items-center mt-1">
                                                <input 
                                                    type="text" 
                                                    value={editInputText} 
                                                    onChange={(e) => setEditInputText(e.target.value)}
                                                    className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none w-64"
                                                    autoFocus
                                                />
                                                <button type="submit" className="text-xs bg-violet-600 hover:bg-violet-750 text-white px-2.5 py-1.5 rounded-lg font-bold cursor-pointer">Save</button>
                                                <button type="button" onClick={() => setEditingMessageId(null)} className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-350 px-2.5 py-1.5 rounded-lg cursor-pointer">Cancel</button>
                                            </form>
                                        ) : (
                                            <p className="text-sm text-gray-700 dark:text-slate-350 bg-white dark:bg-slate-850 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-slate-850 inline-block max-w-full break-words shadow-sm">
                                                {msg.content}
                                                {msg.isEdited && <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-1.5 font-normal italic">(edited)</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Send Message Input Area */}
                    <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={
                                    activeGroup?.isEnrolled 
                                        ? "Type your message here..." 
                                        : "Enroll in this course to participate in this group discussion."
                                }
                                disabled={!activeGroup?.isEnrolled}
                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-750 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || !activeGroup?.isEnrolled}
                                className="bg-violet-600 hover:bg-violet-750 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscussionsPage;
