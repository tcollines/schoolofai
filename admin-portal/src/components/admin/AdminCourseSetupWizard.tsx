import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Course, CourseSection, CourseModule, ModuleType } from '../../types';
import { 
    Plus, X, ArrowRight, ArrowLeft, Save, Video, FileText, Trash2, GripVertical, 
    Headphones, File, HelpCircle, AlertTriangle, CheckCircle2, Link, Image, 
    Folder, Pin, User, School, Loader2, Calendar, Clock, Globe, Copy, Send, 
    Key, Sparkles, BookOpen, ExternalLink, Check, Bell, Play, Radio
} from 'lucide-react';
import { formatAmount, getCurrencyPreference, CurrencyType } from '../../lib/currency';
import { supabaseClient } from '../../lib/supabaseClient';
import { generateCurriculumFromNotes } from '../../services/aiGenerationService';

// Helper to broadcast lesson notifications to enrolled students
export const broadcastLessonNotification = (
    courseTitle: string,
    cohortName: string,
    meetLink: string,
    attendanceCode: string,
    days: string[],
    startTime: string,
    endTime: string,
    tz: string,
    customNote?: string
): boolean => {
    try {
        const daysText = days && days.length > 0 ? days.join(', ') : 'Live Lesson Days';
        const title = `🚨 Live Lesson Alert: ${courseTitle} (${cohortName || 'Live Cohort'})`;
        const description = `Live Google Meet: ${meetLink || 'Link to be provided'}\nAttendance PIN: ${attendanceCode || 'N/A'}\nSchedule: ${daysText} at ${startTime} - ${endTime} (${tz})${customNote ? '\nNote: ' + customNote : ''}`;
        
        const notifItem = {
            id: 'notif-lesson-' + Date.now(),
            title,
            description,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'course' as const
        };

        const keys = Object.keys(localStorage);
        keys.forEach(k => {
            if (k.startsWith('portal-notifications-')) {
                try {
                    const raw = localStorage.getItem(k);
                    const list = raw ? JSON.parse(raw) : [];
                    list.unshift(notifItem);
                    localStorage.setItem(k, JSON.stringify(list));
                } catch (e) {
                    console.error('Error broadcasting to', k, e);
                }
            }
        });

        const myEmail = localStorage.getItem('logged_in_email') || 'student@welile.com';
        const myKey = `portal-notifications-${myEmail}`;
        const myRaw = localStorage.getItem(myKey);
        const myList = myRaw ? JSON.parse(myRaw) : [];
        if (!myList.some((n: any) => n.id === notifItem.id)) {
            myList.unshift(notifItem);
            localStorage.setItem(myKey, JSON.stringify(myList));
        }

        window.dispatchEvent(new Event('notifications-update'));
        return true;
    } catch (err) {
        console.error('Broadcast failed:', err);
        return false;
    }
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMEZONES = ['EAT (UTC+3)', 'UTC+0 (GMT)', 'CAT (UTC+2)', 'WAT (UTC+1)', 'EST (UTC-5)', 'PST (UTC-8)', 'IST (UTC+5:30)'];

interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    accentColorClass?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, accentColorClass = "border-gray-200 dark:border-slate-800 focus-within:border-violet-400" }) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
    const [showTableMenu, setShowTableMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);
    const [showImageMenu, setShowImageMenu] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [hoveredCell, setHoveredCell] = useState<{r: number, c: number} | null>(null);

    React.useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const executeCommand = (command: string, arg: string = '') => {
        document.execCommand(command, false, arg);
        editorRef.current?.focus();
        handleInput();
    };

    const closeAllMenus = () => {
        setShowHeadingMenu(false);
        setShowTableMenu(false);
        setShowColorMenu(false);
        setShowImageMenu(false);
    };

    const insertHeading = (tag: string) => {
        executeCommand('formatBlock', tag);
        closeAllMenus();
    };

    const insertTable = (rows: number, cols: number) => {
        let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px;">';
        html += '<thead><tr>';
        for (let c = 0; c < cols; c++) {
            html += '<th style="border:1px solid #d1d5db;padding:8px 12px;background:#f3f4f6;font-weight:600;text-align:left;color:#1e293b;">Header ' + (c + 1) + '</th>';
        }
        html += '</tr></thead><tbody>';
        for (let r = 0; r < rows - 1; r++) {
            const bg = r % 2 === 0 ? '#ffffff' : '#f9fafb';
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                html += `<td style="border:1px solid #e5e7eb;padding:8px 12px;background:${bg};color:#1e293b;">Cell</td>`;
            }
            html += '</tr>';
        }
        html += '</tbody></table><p><br></p>';
        executeCommand('insertHTML', html);
        closeAllMenus();
    };

    const insertImageFromUrl = () => {
        if (!imageUrl.trim()) return;
        const html = `<figure style="margin:12px 0;text-align:center;"><img src="${imageUrl}" alt="Image" style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" /><figcaption style="font-size:11px;color:#9ca3af;margin-top:4px;">Image</figcaption></figure><p><br></p>`;
        executeCommand('insertHTML', html);
        setImageUrl('');
        closeAllMenus();
    };

    const handleImageUpload = (file: globalThis.File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const html = `<figure style="margin:12px 0;text-align:center;"><img src="${dataUrl}" alt="${file.name}" style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" /><figcaption style="font-size:11px;color:#9ca3af;margin-top:4px;">${file.name}</figcaption></figure><p><br></p>`;
            executeCommand('insertHTML', html);
            closeAllMenus();
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleImageUpload(files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const insertHR = () => {
        executeCommand('insertHTML', '<hr style="border:none;border-top:2px solid #e5e7eb;margin:16px 0;" /><p><br></p>');
    };

    const insertCodeBlock = () => {
        executeCommand('insertHTML', '<pre style="background:#1e1e2e;color:#cdd6f4;padding:16px;border-radius:8px;font-family:monospace;font-size:13px;overflow-x:auto;margin:8px 0;"><code>// your code here</code></pre><p><br></p>');
    };

    const insertBlockquote = () => {
        executeCommand('insertHTML', '<blockquote style="border-left:4px solid #a855f7;padding:8px 16px;margin:8px 0;background:#faf5ff;color:#581c87;border-radius:0 8px 8px 0;font-style:italic;">Quote text here</blockquote><p><br></p>');
    };

    const insertCallout = (type: 'info' | 'warning' | 'success') => {
        const styles: Record<string, {bg: string, border: string, color: string, icon: string}> = {
            info: { bg: '#eff6ff', border: '#3b82f6', color: '#1e40af', icon: 'ℹ️' },
            warning: { bg: '#fffbeb', border: '#f59e0b', color: '#92400e', icon: '<AlertTriangle className="inline-block w-4 h-4 mr-1 align-middle" />️' },
            success: { bg: '#ecfdf5', border: '#10b981', color: '#065f46', icon: '<CheckCircle2 className="inline-block w-4 h-4 mr-1 align-middle" />' }
        };
        const s = styles[type];
        executeCommand('insertHTML', `<div style="border:1px solid ${s.border};border-left:4px solid ${s.border};background:${s.bg};padding:12px 16px;border-radius:0 8px 8px 0;margin:8px 0;color:${s.color};font-size:13px;"><strong>${s.icon} ${type.charAt(0).toUpperCase() + type.slice(1)}</strong><br/>Your note here</div><p><br></p>`);
    };

    const colors = ['#000000', '#374151', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777'];

    const ToolButton = ({ onClick, title, children, active }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) => (
        <button
            type="button"
            onClick={onClick}
            className={`p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-xs w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${active ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-slate-400'}`}
            title={title}
        >
            {children}
        </button>
    );

    const Divider = () => <div className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-0.5 shrink-0" />;

    return (
        <div className={`border rounded-xl overflow-hidden bg-white dark:bg-slate-900 ${accentColorClass}`} onClick={() => closeAllMenus()}>
            {/* Toolbar */}
            <div className="bg-gray-50 dark:bg-slate-950 border-b border-gray-150 dark:border-slate-800 p-1.5 flex flex-wrap gap-0.5 items-center relative" onClick={e => e.stopPropagation()}>
                {/* Heading Dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); closeAllMenus(); setShowHeadingMenu(!showHeadingMenu); }}
                        className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-[10px] text-gray-600 dark:text-slate-400 cursor-pointer font-semibold flex items-center gap-0.5 min-w-[52px]"
                        title="Heading"
                    >
                        ¶ Text ▾
                    </button>
                    {showHeadingMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg z-50 min-w-[140px] py-1">
                            <button type="button" onClick={() => insertHeading('p')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-350 cursor-pointer bg-transparent">Paragraph</button>
                            <button type="button" onClick={() => insertHeading('h1')} className="w-full text-left px-3 py-1.5 text-lg font-bold hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-900 dark:text-white cursor-pointer bg-transparent">Heading 1</button>
                            <button type="button" onClick={() => insertHeading('h2')} className="w-full text-left px-3 py-1.5 text-base font-bold hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-200 cursor-pointer bg-transparent">Heading 2</button>
                            <button type="button" onClick={() => insertHeading('h3')} className="w-full text-left px-3 py-1.5 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 cursor-pointer bg-transparent">Heading 3</button>
                        </div>
                    )}
                </div>

                <Divider />

                {/* Text Formatting */}
                <ToolButton onClick={() => executeCommand('bold')} title="Bold (Ctrl+B)"><span className="font-bold">B</span></ToolButton>
                <ToolButton onClick={() => executeCommand('italic')} title="Italic (Ctrl+I)"><span className="italic">I</span></ToolButton>
                <ToolButton onClick={() => executeCommand('underline')} title="Underline (Ctrl+U)"><span className="underline">U</span></ToolButton>
                <ToolButton onClick={() => executeCommand('strikeThrough')} title="Strikethrough"><span className="line-through">S</span></ToolButton>
                
                {/* Text Color */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); closeAllMenus(); setShowColorMenu(!showColorMenu); }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-xs w-6 h-6 flex items-center justify-center cursor-pointer text-gray-600 dark:text-slate-400"
                        title="Text Color"
                    >
                        <span className="font-bold">A</span>
                        <span className="absolute bottom-0.5 left-1 right-1 h-0.5 bg-red-500 rounded" />
                    </button>
                    {showColorMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg z-50 p-2 grid grid-cols-5 gap-1" onClick={e => e.stopPropagation()}>
                            {colors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => { executeCommand('foreColor', color); closeAllMenus(); }}
                                    className="w-5 h-5 rounded-full border border-gray-200 dark:border-slate-700 cursor-pointer hover:scale-125 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <ToolButton onClick={() => executeCommand('hiliteColor', '#fef08a')} title="Highlight">
                    <span className="font-bold bg-yellow-200 px-0.5 rounded text-[9px] text-gray-900">H</span>
                </ToolButton>

                <Divider />

                {/* Alignment */}
                <ToolButton onClick={() => executeCommand('justifyLeft')} title="Align Left">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="0.5"/><rect x="1" y="6" width="10" height="1.5" rx="0.5"/><rect x="1" y="10" width="14" height="1.5" rx="0.5"/><rect x="1" y="14" width="8" height="1.5" rx="0.5"/></svg>
                </ToolButton>
                <ToolButton onClick={() => executeCommand('justifyCenter')} title="Align Center">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="0.5"/><rect x="3" y="6" width="10" height="1.5" rx="0.5"/><rect x="1" y="10" width="14" height="1.5" rx="0.5"/><rect x="4" y="14" width="8" height="1.5" rx="0.5"/></svg>
                </ToolButton>
                <ToolButton onClick={() => executeCommand('justifyRight')} title="Align Right">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="0.5"/><rect x="5" y="6" width="10" height="1.5" rx="0.5"/><rect x="1" y="10" width="14" height="1.5" rx="0.5"/><rect x="7" y="14" width="8" height="1.5" rx="0.5"/></svg>
                </ToolButton>

                <Divider />

                {/* Lists & Indent */}
                <ToolButton onClick={() => executeCommand('insertUnorderedList')} title="Bullet List">•</ToolButton>
                <ToolButton onClick={() => executeCommand('insertOrderedList')} title="Numbered List"><span className="font-bold text-[10px]">1.</span></ToolButton>
                <ToolButton onClick={() => executeCommand('indent')} title="Indent">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="0.5"/><rect x="5" y="6" width="10" height="1.5" rx="0.5"/><rect x="5" y="10" width="10" height="1.5" rx="0.5"/><rect x="1" y="14" width="14" height="1.5" rx="0.5"/><path d="M1 6 L3.5 8 L1 10Z" /></svg>
                </ToolButton>
                <ToolButton onClick={() => executeCommand('outdent')} title="Outdent">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="0.5"/><rect x="5" y="6" width="10" height="1.5" rx="0.5"/><rect x="5" y="10" width="10" height="1.5" rx="0.5"/><rect x="1" y="14" width="14" height="1.5" rx="0.5"/><path d="M3.5 6 L1 8 L3.5 10Z" /></svg>
                </ToolButton>

                <Divider />

                {/* Insert Elements */}
                <ToolButton onClick={insertBlockquote} title="Blockquote">
                    <span className="text-[10px] font-bold" style={{ fontFamily: 'Georgia, serif' }}>"</span>
                </ToolButton>
                <ToolButton onClick={insertCodeBlock} title="Code Block">
                    <span className="text-[10px] font-mono font-bold">&lt;/&gt;</span>
                </ToolButton>
                <ToolButton onClick={insertHR} title="Horizontal Rule">—</ToolButton>

                {/* Link */}
                <ToolButton onClick={() => {
                    const url = prompt('Enter URL:');
                    if (url) executeCommand('createLink', url);
                }} title="Insert Link">
                    <span className="text-[10px]"><Link className="inline-block w-4 h-4 mr-1 align-middle" /></span>
                </ToolButton>

                <Divider />

                {/* Image Insert */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); closeAllMenus(); setShowImageMenu(!showImageMenu); }}
                        className="px-1.5 py-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-[10px] text-gray-600 dark:text-slate-400 cursor-pointer font-semibold flex items-center gap-0.5"
                        title="Insert Image"
                    >
                        <Image className="inline-block w-4 h-4 mr-1 align-middle" /> Image
                    </button>
                    {showImageMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-lg z-50 w-64 p-3" onClick={e => e.stopPropagation()}>
                            <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Insert Image</p>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    placeholder="Paste image URL..."
                                    className="w-full border border-gray-200 dark:border-slate-700 bg-transparent rounded-lg px-2 py-1.5 text-xs outline-none focus:border-violet-400 text-gray-900 dark:text-white"
                                    onKeyDown={e => { if (e.key === 'Enter') insertImageFromUrl(); }}
                                />
                                <button
                                    type="button"
                                    onClick={insertImageFromUrl}
                                    className="w-full bg-violet-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-violet-700 transition-colors cursor-pointer"
                                >
                                    Insert from URL
                                </button>
                                <div className="relative">
                                    <div className="text-center text-[10px] text-gray-400 dark:text-slate-500 font-bold my-1">— OR —</div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg py-3 text-xs text-gray-500 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 transition-colors cursor-pointer font-medium"
                                    >
                                        <Folder className="inline-block w-4 h-4 mr-1 align-middle" /> Upload from device
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(file);
                                            e.target.value = '';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table Insert */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); closeAllMenus(); setShowTableMenu(!showTableMenu); }}
                        className="px-1.5 py-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-[10px] text-gray-600 dark:text-slate-400 cursor-pointer font-semibold flex items-center gap-0.5"
                        title="Insert Table"
                    >
                        ▦ Table
                    </button>
                    {showTableMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-lg z-50 w-48 p-3" onClick={e => e.stopPropagation()}>
                            <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Insert Table</p>
                            <div className="grid grid-cols-6 gap-0.5 mb-2">
                                {Array.from({ length: 6 }).map((_, r) =>
                                    Array.from({ length: 6 }).map((_, c) => (
                                        <button
                                            key={`${r}-${c}`}
                                            type="button"
                                            onMouseEnter={() => setHoveredCell({ r, c })}
                                            onClick={() => insertTable(r + 1, c + 1)}
                                            className={`w-5 h-5 border rounded-sm cursor-pointer transition-colors ${
                                                hoveredCell && r <= hoveredCell.r && c <= hoveredCell.c
                                                    ? 'bg-violet-400 border-violet-500'
                                                    : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-violet-100 dark:hover:bg-violet-950/30'
                                            }`}
                                        />
                                    ))
                                )}
                            </div>
                            <p className="text-[10px] text-center text-gray-500 dark:text-slate-400 font-medium">
                                {hoveredCell ? `${hoveredCell.r + 1} × ${hoveredCell.c + 1}` : 'Select size'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Callout */}
                <div className="relative group/callout">
                    <button
                        type="button"
                        className="px-1.5 py-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-[10px] text-gray-600 dark:text-slate-400 cursor-pointer font-semibold"
                        title="Insert Callout"
                    >
                        <Pin className="inline-block w-4 h-4 mr-1 align-middle" />
                    </button>
                    <div className="hidden group-hover/callout:block absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg z-50 py-1 min-w-[110px]">
                        <button type="button" onClick={() => insertCallout('info')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-350 cursor-pointer bg-transparent">ℹ️ Info</button>
                        <button type="button" onClick={() => insertCallout('warning')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-50 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-350 cursor-pointer bg-transparent"><AlertTriangle className="inline-block w-4 h-4 mr-1 align-middle" />️ Warning</button>
                        <button type="button" onClick={() => insertCallout('success')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-350 cursor-pointer bg-transparent"><CheckCircle2 className="inline-block w-4 h-4 mr-1 align-middle" /> Success</button>
                    </div>
                </div>

                <Divider />

                {/* Undo / Redo */}
                <ToolButton onClick={() => executeCommand('undo')} title="Undo (Ctrl+Z)">↩</ToolButton>
                <ToolButton onClick={() => executeCommand('redo')} title="Redo (Ctrl+Y)">↪</ToolButton>

                <Divider />

                {/* Clear */}
                <button
                    type="button"
                    onClick={() => executeCommand('removeFormat')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-[10px] text-gray-400 cursor-pointer font-semibold"
                    title="Clear Formatting"
                >
                    Clear
                </button>
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="p-4 min-h-[150px] max-h-[400px] overflow-y-auto text-sm text-gray-900 dark:text-slate-100 outline-none bg-white dark:bg-slate-900 whitespace-normal prose prose-sm dark:prose-invert max-w-none"
                data-placeholder={placeholder}
                style={{
                    lineHeight: '1.7'
                }}
            />
        </div>
    );
};


interface AdminCourseSetupWizardProps {
    isInstructor?: boolean;
}

const AdminCourseSetupWizard: React.FC<AdminCourseSetupWizardProps> = ({ isInstructor = false }) => {
    const [tutors, setTutors] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);

    useEffect(() => {
        const loadAux = async () => {
            try {
                const { data: pData } = await supabaseClient.from('partners').select('*');
                if (pData) setPartners(pData);
                const { data: tData } = await supabaseClient.from('instructors').select('*');
                if (tData) setTutors(tData);
            } catch (err) {
                console.error('Error loading partners/tutors:', err);
            }
        };
        loadAux();
    }, []);
    const { courses, loading, addCourse, updateCourse } = useAdmin(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editCourseId = searchParams.get('courseId');

    const [currency, setCurrency] = useState<CurrencyType>(getCurrencyPreference);

    useEffect(() => {
        const handleCurrencyChange = () => {
            setCurrency(getCurrencyPreference());
        };
        window.addEventListener('currency-change', handleCurrencyChange);
        return () => {
            window.removeEventListener('currency-change', handleCurrencyChange);
        };
    }, []);

    const [isWizardOpen, setIsWizardOpen] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Broadcast notification modal state
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [isMeetHostModalOpen, setIsMeetHostModalOpen] = useState(false);
    const [generatingMeetLink, setGeneratingMeetLink] = useState(false);
    const [tempMeetInput, setTempMeetInput] = useState('');
    const [meetError, setMeetError] = useState('');
    const [broadcastNote, setBroadcastNote] = useState('');
    const [broadcastSent, setBroadcastSent] = useState(false);
    const [copiedMeeting, setCopiedMeeting] = useState(false);
    const [copiedPin, setCopiedPin] = useState(false);

    // Wizard State
    const [step, setStep] = useState(1);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [courseNotesFile, setCourseNotesFile] = useState<File | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [expandedQuizIndex, setExpandedQuizIndex] = useState<number | null>(null);

    const [newCourse, setNewCourse] = useState<Partial<Course>>({
        title: '',
        instructor: '',
        instructorEmail: '',
        instructorAvatar: '',
        duration: '',
        category: 'Technology & AI',
        accessTier: 'FREE',
        price: 0,
        platform: 'Welile',
        image: '',
        sections: [
            {
                id: 'mod-1',
                title: 'Module 1: Introduction & Live Orientation',
                lessons: [
                    {
                        id: 'top-1-1',
                        title: 'Topic 1: Course Overview & Live Setup',
                        duration: '45 mins',
                        type: 'article',
                        classType: 'online'
                    }
                ]
            }
        ],
        description: '',
        outcomes: [],
        courseIntroVideoUrl: '',
        startDate: '',
        endDate: '',
        lessonDays: ['Monday', 'Wednesday', 'Friday'],
        lessonStartTime: '18:00',
        lessonEndTime: '20:00',
        timezone: 'EAT (UTC+3)',
        meetingLink: '',
        attendanceCode: '',
        cohortName: '',
        quizDate: '',
        examDate: ''
    });

    // Populate for editing if courseId is passed in URL
    useEffect(() => {
        if (editCourseId && courses && courses.length > 0) {
            const courseToEdit = courses.find(c => c.id === editCourseId);
            if (courseToEdit) {
                setIsEditMode(true);
                setEditingCourseId(courseToEdit.id);
                setNewCourse({
                    ...courseToEdit,
                    imageScale: courseToEdit.imageScale || 1,
                    imagePositionX: courseToEdit.imagePositionX || 50,
                    imagePositionY: courseToEdit.imagePositionY || 50,
                    courseIntroVideoUrl: courseToEdit.courseIntroVideoUrl || '',
                    startDate: courseToEdit.startDate || '2026-11-15',
                    endDate: courseToEdit.endDate || '2026-12-01',
                    lessonDays: courseToEdit.lessonDays || ['Monday', 'Wednesday', 'Friday'],
                    lessonStartTime: courseToEdit.lessonStartTime || '18:00',
                    lessonEndTime: courseToEdit.lessonEndTime || '20:00',
                    timezone: courseToEdit.timezone || 'EAT (UTC+3)',
                    meetingLink: courseToEdit.meetingLink || '',
                    attendanceCode: courseToEdit.attendanceCode || 'WEL-' + Math.floor(1000 + Math.random() * 9000),
                    cohortName: courseToEdit.cohortName || 'Cohort 1',
                    cohorts: courseToEdit.cohorts || [],
                    quizDate: courseToEdit.quizDate || '2026-11-25',
                    examDate: courseToEdit.examDate || '2026-12-01',
                    sections: courseToEdit.sections && courseToEdit.sections.length > 0
                        ? courseToEdit.sections
                        : (courseToEdit.modules ? [{ id: 's1', title: 'Course Modules', lessons: courseToEdit.modules }] : [])
                });
            }
        }
    }, [editCourseId, courses]);

    useEffect(() => {
        if (isWizardOpen && isInstructor && !isEditMode) {
            const loggedInEmail = localStorage.getItem('instructor-email') || '';
            const loggedInName = localStorage.getItem('instructor-name') || '';
            const initials = loggedInName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            setNewCourse(prev => ({
                ...prev,
                instructor: loggedInName,
                instructorEmail: loggedInEmail,
                instructorAvatar: prev.instructorAvatar || initials || 'inst'
            }));
        }
    }, [isWizardOpen, isInstructor, isEditMode]);

    const validateStep = (targetStep: number): { valid: boolean; message?: string } => {
        if (targetStep === 1) {
            const missing = [];
            if (!newCourse.title?.trim()) missing.push('Course Title');
            if (!newCourse.instructor?.trim()) missing.push('Instructor Name (Select or Add Instructor)');
            if (!newCourse.description?.trim()) missing.push('Course Description');
            if (missing.length > 0) {
                return {
                    valid: false,
                    message: `Please complete Step 1 (Basic Information): Missing ${missing.join(', ')}.`
                };
            }
        }

        if (targetStep === 2) {
            const missing = [];
            if (!newCourse.category?.trim()) missing.push('Category');
            if (!newCourse.duration?.trim()) missing.push('Duration (e.g. 4 Weeks, 8 Lessons)');
            if (!newCourse.image?.trim()) missing.push('Course Cover Image');
            if (missing.length > 0) {
                return {
                    valid: false,
                    message: `Please complete Step 2 (Details & Categorization): Missing ${missing.join(', ')}.`
                };
            }
        }

        if (targetStep === 4) {
            if (!newCourse.sections || newCourse.sections.length === 0) {
                return { valid: false, message: 'Please add at least one Module/Section in Step 4 before publishing.' };
            }
            for (let sIdx = 0; sIdx < newCourse.sections.length; sIdx++) {
                const s = newCourse.sections[sIdx];
                if (!s.title?.trim()) {
                    return { valid: false, message: `Module #${sIdx + 1} requires a Title in Step 4.` };
                }
                if (!s.lessons || s.lessons.length === 0) {
                    return { valid: false, message: `Module "${s.title}" needs at least one lesson topic.` };
                }
                for (let lIdx = 0; lIdx < s.lessons.length; lIdx++) {
                    const l = s.lessons[lIdx];
                    if (!l.title?.trim()) {
                        return { valid: false, message: `Topic #${lIdx + 1} inside Module "${s.title}" needs a Title.` };
                    }
                }
            }
        }

        return { valid: true };
    };

    const handleNext = () => {
        setValidationError(null);
        const check = validateStep(step);
        if (!check.valid && step < 5) {
            setValidationError(check.message || 'Please fill in all required fields before continuing.');
            return;
        }
        setStep(s => Math.min(s + 1, 5));
    };

    const handlePrev = () => {
        setValidationError(null);
        setStep(s => Math.max(s - 1, 1));
    };
    
    const addSection = () => {
        const nextNum = (newCourse.sections?.length || 0) + 1;
        const newSection: CourseSection = {
            id: Math.random().toString(36).substring(7),
            title: `Module ${nextNum}: Live Lecture Topics`,
            lessons: [
                {
                    id: Math.random().toString(36).substring(7),
                    title: `Topic ${nextNum}.1: Introduction to Module Concepts`,
                    duration: '45 mins',
                    type: 'article',
                    classType: 'online',
                    meetLink: newCourse.meetingLink || ''
                }
            ]
        };
        setNewCourse({ ...newCourse, sections: [...(newCourse.sections || []), newSection] });
    };

    const addTopic = (sectionId: string) => {
        const targetSection = newCourse.sections?.find(s => s.id === sectionId);
        const nextTopicNum = (targetSection?.lessons?.length || 0) + 1;
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let pinCode = 'WEL-';
        for (let i = 0; i < 4; i++) pinCode += chars.charAt(Math.floor(Math.random() * chars.length));
        const newTopic: CourseModule = {
            id: Math.random().toString(36).substring(7),
            title: `Topic ${nextTopicNum}: `,
            duration: '45 mins',
            type: 'article',
            classType: 'online',
            meetLink: newCourse.meetingLink || '',
            attendanceCode: pinCode,
            description: ''
        };
        setNewCourse({
            ...newCourse,
            sections: newCourse.sections?.map(s => {
                if (s.id === sectionId) {
                    return { ...s, lessons: [...s.lessons, newTopic] };
                }
                return s;
            })
        });
    };

    const removeTopic = (sectionId: string, topicId: string) => {
        setNewCourse({
            ...newCourse,
            sections: newCourse.sections?.map(s => {
                if (s.id === sectionId) {
                    return { ...s, lessons: s.lessons.filter(l => l.id !== topicId) };
                }
                return s;
            })
        });
    };

    const updateTopic = (sectionId: string, topicId: string, updates: Partial<CourseModule>) => {
        setNewCourse({
            ...newCourse,
            sections: newCourse.sections?.map(s => {
                if (s.id === sectionId) {
                    return {
                        ...s,
                        lessons: s.lessons.map(l => l.id === topicId ? { ...l, ...updates } : l)
                    };
                }
                return s;
            })
        });
    };

    const removeSection = (sectionId: string) => {
        setNewCourse({ ...newCourse, sections: newCourse.sections?.filter(s => s.id !== sectionId) });
    };

    const updateSectionTitle = (sectionId: string, title: string) => {
        setNewCourse({
            ...newCourse,
            sections: newCourse.sections?.map(s => s.id === sectionId ? { ...s, title } : s)
        });
    };

    const toggleDay = (day: string) => {
        const currentDays = newCourse.lessonDays || [];
        const updated = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        setNewCourse({ ...newCourse, lessonDays: updated });
    };

    const generateAttendanceCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'WEL-';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewCourse(prev => ({ ...prev, attendanceCode: code }));
    };

    const getEmbedUrl = (url?: string) => {
        if (!url) return '';
        try {
            if (url.includes('youtube.com/watch')) {
                const v = new URL(url).searchParams.get('v');
                if (v) return `https://www.youtube.com/embed/${v}`;
            }
            if (url.includes('youtu.be/')) {
                const id = url.split('youtu.be/')[1]?.split('?')[0];
                if (id) return `https://www.youtube.com/embed/${id}`;
            }
            if (url.includes('vimeo.com/')) {
                const id = url.split('vimeo.com/')[1]?.split('?')[0];
                if (id) return `https://player.vimeo.com/video/${id}`;
            }
            return url;
        } catch {
            return url;
        }
    };

    const generateAIModules = async () => {
        if (!courseNotesFile) {
            alert("Please upload a Course Notes / Syllabus file first.");
            return;
        }

        setIsGeneratingAI(true);
        try {
            const rawSections = await generateCurriculumFromNotes(courseNotesFile);
            
            // Map AI response to clean live topics list
            const generatedSections: CourseSection[] = rawSections.map((sec: any, sIdx: number) => ({
                id: Math.random().toString(36).substring(7),
                title: sec.title || `Module ${sIdx + 1}: Live Concepts`,
                lessons: (sec.lessons || []).map((les: any, lIdx: number) => ({
                    id: Math.random().toString(36).substring(7),
                    title: les.title || `Topic ${sIdx + 1}.${lIdx + 1}: Live Discussion`,
                    type: 'article',
                    duration: les.duration || '45 mins',
                    description: les.description || '',
                    classType: 'online',
                    meetLink: newCourse.meetingLink || ''
                }))
            }));
            
            setNewCourse(prev => ({ 
                ...prev, 
                sections: [...(prev.sections || []), ...generatedSections] 
            }));
            
            alert("Live curriculum topics generated successfully from course notes!");
        } catch (error: any) {
            alert("AI Generation failed: " + (error?.message || error));
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleGenerateTutorMeet = async () => {
        setGeneratingMeetLink(true);
        setMeetError('');
        try {
            const tutorEmail = newCourse.instructorEmail || localStorage.getItem('instructor-email') || 'tutor@welile.com';
            const res = await fetch('http://localhost:3000/api/google-meet/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tutorEmail,
                    courseTitle: newCourse.title || 'Live Cohort Class',
                    startDate: newCourse.startDate || '2026-11-15',
                    startTime: newCourse.lessonStartTime || '18:00',
                    endTime: newCourse.lessonEndTime || '20:00',
                    timezone: newCourse.timezone || 'EAT (UTC+3)'
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.configured && data.meetLink) {
                    setNewCourse(prev => ({ ...prev, meetingLink: data.meetLink }));
                    setIsMeetHostModalOpen(false);
                    return;
                } else {
                    setMeetError(data.message || 'Google Cloud Service Account not configured in backend.');
                }
            } else {
                setMeetError('Backend API unreachable. Please use Method 1 below to launch Google Meet directly.');
            }
        } catch (e: any) {
            setMeetError('Server connection error. Please launch Google Meet directly via Method 1 below.');
        } finally {
            setGeneratingMeetLink(false);
        }
    };

    const handleBroadcastAlert = () => {
        if (!newCourse.meetingLink?.trim()) {
            alert('Please enter a Google Meet link before broadcasting.');
            return;
        }
        const ok = broadcastLessonNotification(
            newCourse.title || 'Untitled Course',
            newCourse.cohortName || 'Live Cohort',
            newCourse.meetingLink || '',
            newCourse.attendanceCode || '',
            newCourse.lessonDays || ['Monday', 'Wednesday', 'Friday'],
            newCourse.lessonStartTime || '18:00',
            newCourse.lessonEndTime || '20:00',
            newCourse.timezone || 'EAT (UTC+3)',
            broadcastNote
        );
        if (ok) {
            setBroadcastSent(true);
            setTimeout(() => {
                setBroadcastSent(false);
                setIsBroadcastModalOpen(false);
                setBroadcastNote('');
            }, 1800);
        }
    };

    const handleSave = async (publish: boolean = true) => {
        setValidationError(null);
        if (publish) {
            // Check Step 1
            const step1Check = validateStep(1);
            if (!step1Check.valid) {
                setValidationError(step1Check.message || 'Please complete Step 1 (Basic Information).');
                setStep(1);
                return;
            }

            // Check Step 2
            const step2Check = validateStep(2);
            if (!step2Check.valid) {
                setValidationError(step2Check.message || 'Please complete Step 2 (Details & Categorization).');
                setStep(2);
                return;
            }

            // Check Step 4
            const step4Check = validateStep(4);
            if (!step4Check.valid) {
                setValidationError(step4Check.message || 'Please complete Step 4 (Curriculum & Schedule).');
                setStep(4);
                return;
            }
        }

        try {
            setIsSaving(true);
            const courseData = {
                ...newCourse,
                title: newCourse.title?.trim() || 'Untitled Course',
                instructor: newCourse.instructor?.trim() || 'Unknown Instructor',
                instructorEmail: newCourse.instructorEmail?.trim() || '',
                instructorAvatar: newCourse.instructorAvatar?.trim() || '',
                duration: newCourse.duration?.trim() || '4 Weeks',
                category: newCourse.category?.trim() || 'General',
                image: newCourse.image?.trim() || '',
                isDraft: !publish,
                isVerified: isInstructor 
                    ? (publish ? false : (newCourse.isVerified || false)) 
                    : (isEditMode ? (newCourse.isVerified !== undefined ? newCourse.isVerified : true) : true),
                price: newCourse.accessTier === 'FREE' ? 0 : (newCourse.price || 0),
                platform: newCourse.platform || 'Welile',
                courseIntroVideoUrl: newCourse.courseIntroVideoUrl || '',
                startDate: newCourse.startDate || new Date().toISOString().split('T')[0],
                endDate: newCourse.endDate || (() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 30);
                    return d.toISOString().split('T')[0];
                })(),
                lessonDays: newCourse.lessonDays && newCourse.lessonDays.length > 0 ? newCourse.lessonDays : ['Monday', 'Wednesday', 'Friday'],
                lessonStartTime: newCourse.lessonStartTime || '18:00',
                lessonEndTime: newCourse.lessonEndTime || '20:00',
                timezone: newCourse.timezone || 'EAT (UTC+3)',
                meetingLink: newCourse.meetingLink || '',
                attendanceCode: newCourse.attendanceCode || 'WEL-' + Math.floor(1000 + Math.random() * 9000),
                cohortName: newCourse.cohortName || `${newCourse.title || 'Course'} Cohort 1`,
                quizDate: newCourse.quizDate || '',
                examDate: newCourse.examDate || ''
            };

            if (isEditMode && editingCourseId) {
                await updateCourse(editingCourseId, courseData);
                alert(publish 
                    ? (isInstructor ? 'Course submitted for admin verification!' : 'Course updated successfully!') 
                    : 'Draft changes saved successfully!');
            } else {
                await addCourse(courseData);
                alert(publish 
                    ? (isInstructor ? 'Course submitted for admin verification!' : 'Course created successfully!') 
                    : 'Draft course saved successfully!');
            }
            setEditingCourseId(null);
            setStep(1);
            navigate(isInstructor ? '/instructor/courses' : '/courses');
        } catch (e: any) {
            setValidationError(`Error saving course: ${e?.message || e}`);
            console.error('Save error:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const embedUrl = getEmbedUrl(newCourse.courseIntroVideoUrl);

    return (
        <div className="flex-1 flex flex-col md:flex-row gap-8 lg:gap-16 w-full max-w-7xl mx-auto p-4 md:p-8 h-[calc(100vh-4rem)] overflow-hidden">
            {/* Left Sidebar Steps */}
            <div className="w-full md:w-64 shrink-0 flex flex-col pt-2">
                <div className="relative flex flex-col">
                    {/* Gray Background Line */}
                    <div className="absolute left-[15px] top-6 bottom-4 w-0.5 bg-gray-200 dark:bg-slate-800 z-0"></div>
                    {/* Green Progress Line */}
                    <div className="absolute left-[15px] top-6 w-0.5 bg-green-500 z-10 transition-all duration-500" style={{ height: `calc(${Math.max(0, step - 1) * 25}% - ${Math.max(0, step - 1) * 4}px)` }}></div>
                    
                    {[
                        { num: 1, title: 'Basic Information' },
                        { num: 2, title: 'Details & Categorization' },
                        { num: 3, title: 'Pricing & Access' },
                        { num: 4, title: 'Curriculum & Live Schedule' },
                        { num: 5, title: 'Course Overview' }
                    ].map(s => {
                        const isCompleted = step > s.num;
                        const isCurrent = step === s.num;
                        return (
                            <div key={s.num} className={`relative z-20 flex items-start gap-4 ${s.num !== 5 ? 'mb-10' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 shrink-0 transition-colors ${
                                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                    isCurrent ? 'bg-white dark:bg-slate-900 border-green-500 text-green-600 dark:text-green-400' :
                                    'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400'
                                }`}>
                                    {isCompleted ? <CheckCircle2 size={16} /> : s.num}
                                </div>
                                <div className="pt-1">
                                    <h4 className={`font-semibold text-sm ${isCurrent ? 'text-green-600 dark:text-green-400' : isCompleted ? 'text-gray-900 dark:text-slate-100' : 'text-gray-500'}`}>{s.title}</h4>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Main Form Area */}
            <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-2 pb-12">
                <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate(isInstructor ? '/instructor/courses' : '/courses')} className="p-2 hover:bg-gray-150 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEditMode ? 'Edit Course Setup' : 'New Course Setup'}
                        </h2>
                    </div>

                    {/* Inline Clear Validation Error Banner */}
                    {validationError && (
                        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start justify-between gap-3 text-amber-800 dark:text-amber-200 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-2.5">
                                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                <span className="font-semibold leading-relaxed">{validationError}</span>
                            </div>
                            <button 
                                onClick={() => setValidationError(null)} 
                                className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 p-1 cursor-pointer"
                                title="Dismiss"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                                                            {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
                            <h3 className="text-lg font-semibold border-b border-gray-100 dark:border-slate-800 pb-2 text-gray-900 dark:text-slate-100">Step 1: Basic Information</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Course Title</label>
                                <input value={newCourse.title || ''} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" placeholder="e.g. Advanced AI Integration" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Instructor</label>
                                <select 
                                    value={newCourse.tutorId || ''} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val !== 'new') {
                                            const t = tutors.find(t => t.id === val);
                                            setNewCourse({...newCourse, tutorId: val, instructor: t?.full_name || '', instructorEmail: t?.email || '', instructorAvatar: t?.avatar || ''});
                                        } else {
                                            setNewCourse({...newCourse, tutorId: 'new', instructor: '', instructorEmail: '', instructorAvatar: ''});
                                        }
                                    }}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                >
                                    <option value="" disabled>Select an instructor...</option>
                                    <option value="new">+ Add New Instructor</option>
                                    {(tutors || []).map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                                    ))}
                                </select>
                            </div>
                            
                            {newCourse.tutorId === 'new' && (
                                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-start">
                                    {/* Left: Avatar Upload */}
                                    <div className="shrink-0 flex flex-col items-center pt-2">
                                        <label className="relative cursor-pointer group">
                                            <div className="w-28 h-28 rounded-full bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-600 shadow-sm overflow-hidden flex items-center justify-center transition-all group-hover:border-violet-500">
                                                {newCourse.instructorAvatar ? (
                                                    <img src={newCourse.instructorAvatar} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center text-gray-400 dark:text-slate-500">
                                                        <Image size={28} className="mb-1 text-gray-400 group-hover:text-violet-500 transition-colors" />
                                                        <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
                                                    </div>
                                                )}
                                            </div>
                                            {newCourse.instructorAvatar && (
                                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Image size={24} className="text-white" />
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                         const reader = new FileReader();
                                                         reader.onloadend = () => {
                                                             setNewCourse({...newCourse, instructorAvatar: reader.result as string});
                                                         };
                                                         reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                
                                    {/* Right: Name and Email */}
                                    <div className="flex-1 space-y-4 w-full">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">New Instructor Name</label>
                                            <input value={newCourse.instructor || ''} onChange={e => setNewCourse({...newCourse, instructor: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" placeholder="e.g. John Doe" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">New Instructor Email</label>
                                            <input value={newCourse.instructorEmail || ''} onChange={e => setNewCourse({...newCourse, instructorEmail: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" placeholder="e.g. j.doe@schoolofai.edu" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">About the Course</label>
                                <textarea value={newCourse.description || ''} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none h-24" placeholder="Enter a comprehensive course description..." />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
                            <h3 className="text-lg font-semibold border-b border-gray-100 dark:border-slate-800 pb-2 text-gray-900 dark:text-slate-100">Step 2: Details & Categorization</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Cover Image (Spans Full Width)</label>
                                <div className="flex flex-col gap-4">
                                    <div className="w-full h-48 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden bg-gray-50 dark:bg-slate-800 relative">
                                        {newCourse.image ? (
                                            <img 
                                                src={newCourse.image} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover" 
                                                style={{
                                                    objectPosition: `${newCourse.imagePositionX ?? 50}% ${newCourse.imagePositionY ?? 50}%`,
                                                    transform: `scale(${newCourse.imageScale ?? 1})`,
                                                    transformOrigin: `${newCourse.imagePositionX ?? 50}% ${newCourse.imagePositionY ?? 50}%`
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 gap-2">
                                                <Image size={32} />
                                                <span className="text-sm">No cover image uploaded</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <label className="cursor-pointer bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm px-6 py-3 rounded-xl font-medium flex items-center justify-center flex-1 transition-colors">
                                            <Folder size={18} className="mr-2" />
                                            <span>Browse Image File</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setNewCourse({...newCourse, image: reader.result as string, imageScale: 1, imagePositionX: 50, imagePositionY: 50});
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {newCourse.image && (
                                            <button 
                                                type="button"
                                                onClick={() => setIsAdjustModalOpen(true)}
                                                className="px-6 py-3 bg-violet-50 text-violet-700 font-bold rounded-xl hover:bg-violet-100 transition-colors"
                                            >
                                                Adjust Image
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Category</label>
                                    <select 
                                        value={newCourse.category || ''} 
                                        onChange={e => setNewCourse({...newCourse, category: e.target.value})} 
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                    >
                                        <option value="" disabled>Select a Category...</option>
                                        <option value="Technology & AI">Technology & AI</option>
                                        <option value="AI">AI</option>
                                        <option value="Education">Education</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Business">Business</option>
                                        <option value="Design">Design</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Level</label>
                                    <select 
                                        value={newCourse.level || ''} 
                                        onChange={e => setNewCourse({...newCourse, level: e.target.value})} 
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                    >
                                        <option value="" disabled>Select Level...</option>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="All Levels">All Levels</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Course Duration</label>
                                    <input 
                                        type="text"
                                        value={newCourse.duration || ''} 
                                        onChange={e => setNewCourse({...newCourse, duration: e.target.value})} 
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                        placeholder="e.g. 4 Weeks, 8 Lessons"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">What You'll Achieve (One per line)</label>
                                <textarea value={newCourse.outcomes?.join('\n') || ''} onChange={e => setNewCourse({...newCourse, outcomes: e.target.value.split('\n')})} className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-950 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none h-24" placeholder="Master foundational concepts...&#10;Build real-world projects...&#10;Earn a certificate..." />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
                            <h3 className="text-lg font-semibold border-b pb-2 text-gray-900 dark:text-slate-100">Step 3: Access, Pricing & Partners</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Access Tier</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setNewCourse({...newCourse, accessTier: 'FREE', price: 0})}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                                            newCourse.accessTier === 'FREE' 
                                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-200 dark:ring-violet-900/40 text-violet-900 dark:text-violet-200' 
                                                : 'border-gray-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-750 bg-transparent text-gray-900 dark:text-slate-200'
                                        }`}
                                    >
                                        <div className={`font-bold mb-1 ${newCourse.accessTier === 'FREE' ? 'text-violet-900 dark:text-violet-200' : 'text-gray-900 dark:text-slate-200'}`}>Free Tier</div>
                                        <div className={`text-xs ${newCourse.accessTier === 'FREE' ? 'text-violet-700 dark:text-violet-300' : 'text-gray-500 dark:text-slate-400'}`}>Accessible to all users</div>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setNewCourse({...newCourse, accessTier: 'PAID'})}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                                            newCourse.accessTier === 'PAID' 
                                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-200 dark:ring-violet-900/40 text-violet-900 dark:text-violet-200' 
                                                : 'border-gray-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-750 bg-transparent text-gray-900 dark:text-slate-200'
                                        }`}
                                    >
                                        <div className={`font-bold mb-1 ${newCourse.accessTier === 'PAID' ? 'text-violet-900 dark:text-violet-200' : 'text-gray-900 dark:text-slate-200'}`}>Premium Tier</div>
                                        <div className={`text-xs ${newCourse.accessTier === 'PAID' ? 'text-violet-700 dark:text-violet-300' : 'text-gray-500 dark:text-slate-400'}`}>Requires Premium</div>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setNewCourse({...newCourse, accessTier: 'CUSTOM'})}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                                            newCourse.accessTier === 'CUSTOM' 
                                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-200 dark:ring-violet-900/40 text-violet-900 dark:text-violet-200' 
                                                : 'border-gray-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-750 bg-transparent text-gray-900 dark:text-slate-200'
                                        }`}
                                    >
                                        <div className={`font-bold mb-1 ${newCourse.accessTier === 'CUSTOM' ? 'text-violet-900 dark:text-violet-200' : 'text-gray-900 dark:text-slate-200'}`}>Custom Price</div>
                                        <div className={`text-xs ${newCourse.accessTier === 'CUSTOM' ? 'text-violet-700 dark:text-violet-300' : 'text-gray-500 dark:text-slate-400'}`}>Set specific price</div>
                                    </button>
                                </div>
                            </div>
                            
                            {newCourse.accessTier === 'CUSTOM' && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Custom Course Price ($)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={newCourse.price ?? 0} 
                                        onChange={e => setNewCourse({...newCourse, price: Math.max(0, Number(e.target.value))})} 
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" 
                                        placeholder="e.g. 49" 
                                    />
                                </div>
                            )}

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Course Partner</label>
                                <select 
                                    value={newCourse.partnerId || ''} 
                                    onChange={e => setNewCourse({...newCourse, partnerId: e.target.value})} 
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                >
                                    <option value="">No Partner</option>
                                    {(partners || []).map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}


                    {/* Step 4: Curriculum, Cohort & Live Schedule */}

                    {/* Step 4: Curriculum, Cohort & Live Schedule */}
                    {step === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 max-w-4xl mx-auto pb-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BookOpen className="text-violet-600" size={22} />
                                        Step 4: Curriculum, Cohort & Live Schedule
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        Configure your introductory video, live Google Meet sessions, topic syllabus, and quiz/exam dates.
                                    </p>
                                </div>
                                <button 
                                    onClick={addSection} 
                                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors self-start cursor-pointer"
                                >
                                    <Plus size={16} /> Add Module
                                </button>
                            </div>

                            {/* Section 1: Course Overview & Introduction Video */}
                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <Video size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-base">Course Introduction Video</h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">Introductory video displayed on the course overview page for prospective students</p>
                                        </div>
                                    </div>
                                    {embedUrl && (
                                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <Play size={10} /> Preview Active
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Introductory Video URL (YouTube, Vimeo, MP4)</label>
                                            <input 
                                                value={newCourse.courseIntroVideoUrl || ''} 
                                                onChange={e => setNewCourse({...newCourse, courseIntroVideoUrl: e.target.value})} 
                                                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm" 
                                                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Optional: Upload Course Notes / Syllabus (For AI Generation)</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="file" 
                                                    accept=".pdf,text/plain"
                                                    onChange={e => setCourseNotesFile(e.target.files?.[0] || null)}
                                                    className="flex-1 p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-xs" 
                                                />
                                                <button 
                                                    onClick={generateAIModules} 
                                                    disabled={isGeneratingAI || !courseNotesFile}
                                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                                                >
                                                    {isGeneratingAI ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} 
                                                    {isGeneratingAI ? 'Generating...' : 'AI Syllabus'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Video Preview Frame */}
                                    <div className="h-44 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center relative">
                                        {embedUrl ? (
                                            embedUrl.endsWith('.mp4') ? (
                                                <video src={embedUrl} controls className="w-full h-full object-cover" />
                                            ) : (
                                                <iframe 
                                                    src={embedUrl} 
                                                    title="Intro Video Preview" 
                                                    className="w-full h-full border-0" 
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                    allowFullScreen
                                                />
                                            )
                                        ) : (
                                            <div className="text-center p-4 text-gray-400">
                                                <Video size={32} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-xs font-semibold">Enter a video URL above to preview</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Supports YouTube, Vimeo, and raw MP4 links</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Live Cohort & Google Meet Class Schedule */}
                            <div className="bg-white dark:bg-slate-900 border border-violet-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                            <Radio size={18} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-base">Live Cohort & Class Schedule</h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">All lessons are conducted live via Google Meet. Set cohort periods, meeting link, and attendance PIN.</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setIsBroadcastModalOpen(true)}
                                        className="px-3.5 py-2 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start"
                                    >
                                        <Bell size={14} /> 📢 Broadcast Lesson Alert
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Cohort Name */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cohort Interval / Name</label>
                                        <input 
                                            value={newCourse.cohortName || ''} 
                                            onChange={e => setNewCourse({...newCourse, cohortName: e.target.value})} 
                                            className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500" 
                                            placeholder="e.g. Cohort 1 (Nov 2026)" 
                                        />
                                    </div>

                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                                            <Calendar size={12} className="text-violet-500" /> Lessons Start Date
                                        </label>
                                        <input 
                                            type="date" 
                                            value={newCourse.startDate || ''} 
                                            onChange={e => setNewCourse({...newCourse, startDate: e.target.value})} 
                                            className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500" 
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                                            <Calendar size={12} className="text-emerald-500" /> Lessons End Date
                                        </label>
                                        <input 
                                            type="date" 
                                            value={newCourse.endDate || ''} 
                                            onChange={e => setNewCourse({...newCourse, endDate: e.target.value})} 
                                            className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500" 
                                        />
                                    </div>
                                </div>

                                {/* Days of the week */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-bold uppercase text-gray-500">Live Lesson Days of the Week</label>
                                        <span className="text-[11px] text-gray-400">Click to select active days</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS_OF_WEEK.map(day => {
                                            const isSelected = (newCourse.lessonDays || []).includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(day)}
                                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        isSelected 
                                                            ? 'bg-violet-600 text-white shadow-sm ring-2 ring-violet-400/30' 
                                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-750'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Lesson Times & Timezone */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-slate-855 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                                            <Clock size={12} /> Class Start Time
                                        </label>
                                        <input 
                                            type="time" 
                                            value={newCourse.lessonStartTime || '18:00'} 
                                            onChange={e => setNewCourse({...newCourse, lessonStartTime: e.target.value})} 
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-semibold outline-none text-gray-900 dark:text-white" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                                            <Clock size={12} /> Class End Time
                                        </label>
                                        <input 
                                            type="time" 
                                            value={newCourse.lessonEndTime || '20:00'} 
                                            onChange={e => setNewCourse({...newCourse, lessonEndTime: e.target.value})} 
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-semibold outline-none text-gray-900 dark:text-white" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                                            <Globe size={12} /> Timezone
                                        </label>
                                        <select 
                                            value={newCourse.timezone || 'EAT (UTC+3)'} 
                                            onChange={e => setNewCourse({...newCourse, timezone: e.target.value})} 
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-semibold outline-none text-gray-900 dark:text-white"
                                        >
                                            {TIMEZONES.map(tz => (
                                                <option key={tz} value={tz}>{tz}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Google Meet Link & Attendance Code */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Google Meet Link */}
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold uppercase text-gray-500 flex items-center justify-between">
                                            <span>Google Meet Live Link</span>
                                            {newCourse.meetingLink && (
                                                <a 
                                                    href={newCourse.meetingLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-violet-600 hover:underline flex items-center gap-0.5 text-[11px] font-bold"
                                                >
                                                    Test Link <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                value={newCourse.meetingLink || ''} 
                                                onChange={e => setNewCourse({...newCourse, meetingLink: e.target.value})} 
                                                className="flex-1 p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 font-mono" 
                                                placeholder="https://meet.google.com/xxx-yyyy-zzz" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={async () => {
                                                    try {
                                                        const text = await navigator.clipboard.readText();
                                                        if (text) {
                                                            setNewCourse(prev => ({ ...prev, meetingLink: text.trim() }));
                                                        }
                                                    } catch {
                                                        const val = prompt('Paste your Google Meet Link:');
                                                        if (val) setNewCourse(prev => ({ ...prev, meetingLink: val.trim() }));
                                                    }
                                                }}
                                                className="px-3 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Paste Google Meet Link from Clipboard"
                                            >
                                                <Copy size={13} className="rotate-180" /> Paste
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    if (newCourse.meetingLink) {
                                                        navigator.clipboard.writeText(newCourse.meetingLink);
                                                        setCopiedMeeting(true);
                                                        setTimeout(() => setCopiedMeeting(false), 1500);
                                                    }
                                                }}
                                                className="px-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Copy Google Meet Link"
                                            >
                                                {copiedMeeting ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                {copiedMeeting ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setTempMeetInput(newCourse.meetingLink || '');
                                                    setMeetError('');
                                                    setIsMeetHostModalOpen(true);
                                                }}
                                                className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1.5 cursor-pointer bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/40 px-3 py-1.5 rounded-lg transition-colors border border-violet-100 dark:border-violet-900/50 shadow-xs"
                                            >
                                                <Sparkles size={11} className="text-violet-600 animate-pulse" /> Generate Real Google Meet with Tutor as Host
                                            </button>
                                            <div className="flex items-center gap-3">
                                                {newCourse.meetingLink && newCourse.meetingLink.includes('meet.google.com') && (
                                                    <a 
                                                        href={newCourse.meetingLink} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                                                    >
                                                        <ExternalLink size={10} /> Test Link ↗
                                                    </a>
                                                )}
                                                <span className="text-[10px] text-gray-400">
                                                    Host: <strong className="text-gray-600 dark:text-slate-300 font-mono">{newCourse.instructorEmail || 'Selected Tutor'}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Lesson Attendance PINs: Auto-Generated */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-bold uppercase text-gray-500">Live Lesson Attendance PINs</label>
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Generated Per Lesson
                                            </span>
                                        </div>
                                        <div className="p-2.5 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-violet-200 dark:border-violet-900/50 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-300 rounded-lg">
                                                    <Key size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-violet-950 dark:text-violet-100">Auto-Generated For Every Live Lesson</p>
                                                    <p className="text-[11px] text-violet-700 dark:text-violet-300">Each live session automatically receives its own unique attendance PIN under your Tutor Dashboard.</p>
                                                </div>
                                            </div>
                                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 bg-white/80 dark:bg-slate-900/80 text-violet-700 dark:text-violet-300 rounded-md font-mono text-[11px] font-bold border border-violet-200 dark:border-violet-800">
                                                WEL-XXXX
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Modules & Topics to Cover (Live Lecture Syllabus) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">Curriculum Modules & Live Topics</h4>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            List the modules and specific topics to cover during live Google Meet classes. No video uploading required.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={addSection} 
                                        className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <Plus size={14} /> Add Module
                                    </button>
                                </div>

                                {(!newCourse.sections || newCourse.sections.length === 0) && (
                                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 text-gray-400">
                                        <BookOpen className="mx-auto mb-2 opacity-50" size={32} />
                                        <p className="font-semibold text-sm">Your live curriculum is empty.</p>
                                        <p className="text-xs mt-1">Click "Add Module" to start listing your live lecture topics.</p>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    {newCourse.sections?.map((section, sIdx) => (
                                        <div key={section.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all">
                                            {/* Module Header */}
                                            <div className="bg-gray-50 dark:bg-slate-850 p-4 border-b border-gray-200 dark:border-slate-800 space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <GripVertical className="text-gray-400 cursor-move shrink-0" size={18} />
                                                        <span className="text-xs font-extrabold uppercase px-2 py-0.5 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 rounded-md">
                                                            Module {sIdx + 1}
                                                        </span>
                                                        <input 
                                                            value={section.title}
                                                            onChange={e => updateSectionTitle(section.id, e.target.value)}
                                                            className="bg-transparent font-bold text-gray-900 dark:text-white outline-none focus:border-b-2 focus:border-violet-500 py-0.5 flex-1 text-base"
                                                            placeholder="e.g. Module Title & Key Concepts"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => addTopic(section.id)} 
                                                            className="text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                                        >
                                                            <Plus size={13} /> Add Topic
                                                        </button>
                                                        <button 
                                                            onClick={() => removeSection(section.id)} 
                                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/30 transition-colors cursor-pointer" 
                                                            title="Delete Module"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Module Quiz Date Setting */}
                                                <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-gray-200/60 dark:border-slate-800">
                                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300 font-semibold">
                                                        <HelpCircle size={14} className="text-purple-500" />
                                                        <span>Module Quiz Date:</span>
                                                        <input 
                                                            type="date" 
                                                            value={section.lessons?.find(l => l.type === 'quiz')?.scheduledDate || newCourse.quizDate || ''} 
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                const quizIdx = section.lessons.findIndex(l => l.type === 'quiz');
                                                                if (quizIdx >= 0) {
                                                                    updateTopic(section.id, section.lessons[quizIdx].id, { scheduledDate: val });
                                                                } else {
                                                                    const newQuiz: CourseModule = {
                                                                        id: Math.random().toString(36).substring(7),
                                                                        title: `Module ${sIdx + 1} Assessment Quiz`,
                                                                        type: 'quiz',
                                                                        duration: '15 mins',
                                                                        scheduledDate: val,
                                                                        quizTimer: 15,
                                                                        quizQuestions: [
                                                                            { id: 'q1', text: 'Core concept check question', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 0 }
                                                                        ]
                                                                    };
                                                                    setNewCourse({
                                                                        ...newCourse,
                                                                        sections: newCourse.sections?.map(s => s.id === section.id ? { ...s, lessons: [...s.lessons, newQuiz] } : s)
                                                                    });
                                                                }
                                                            }}
                                                            className="p-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-xs font-normal" 
                                                        />
                                                    </div>
                                                    <span className="text-gray-300 dark:text-slate-700">•</span>
                                                    <span className="text-gray-500 text-[11px]">
                                                        {section.lessons.filter(l => l.type !== 'quiz').length} Topics to cover in live classes
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Topics List for this Module */}
                                            <div className="p-4 space-y-2.5">
                                                {section.lessons.length === 0 && (
                                                    <p className="text-xs text-gray-400 text-center py-4">No live topics added yet. Click "+ Add Topic" above.</p>
                                                )}

                                                {section.lessons.map((topic, tIdx) => {
                                                    const isQuiz = topic.type === 'quiz';
                                                    return (
                                                        <div 
                                                            key={topic.id} 
                                                            className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 group ${
                                                                isQuiz 
                                                                    ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40' 
                                                                    : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                                                    isQuiz 
                                                                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' 
                                                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                                                                }`}>
                                                                    {isQuiz ? 'Q' : tIdx + 1}
                                                                </span>

                                                                <input 
                                                                    value={topic.title}
                                                                    onChange={e => updateTopic(section.id, topic.id, { title: e.target.value })}
                                                                    className="font-medium text-sm text-gray-800 dark:text-slate-100 bg-transparent flex-1 outline-none border-b border-transparent focus:border-violet-400 py-0.5"
                                                                    placeholder={isQuiz ? "Quiz Title" : "Topic title / live lecture subject"}
                                                                />
                                                                {!isQuiz && (
                                                                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60 shrink-0" title="Auto-generated attendance code for this live lesson">
                                                                        <Key size={10} /> {topic.attendanceCode || 'Auto-PIN'}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <div className="flex items-center gap-1 text-gray-400 text-xs">
                                                                    <Clock size={12} />
                                                                    <input 
                                                                        value={topic.duration || (isQuiz ? '15m' : '45m')}
                                                                        onChange={e => updateTopic(section.id, topic.id, { duration: e.target.value })}
                                                                        className="w-16 text-xs p-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-center text-gray-700 dark:text-slate-300 font-medium outline-none"
                                                                        placeholder="45m"
                                                                    />
                                                                </div>

                                                                <button 
                                                                    onClick={() => removeTopic(section.id, topic.id)} 
                                                                    className="text-gray-300 hover:text-red-500 opacity-60 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                                                    title="Delete Topic"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                <button 
                                                    onClick={() => addTopic(section.id)} 
                                                    className="w-full py-2.5 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-500 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                                                >
                                                    <Plus size={14} /> Add Another Live Topic
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 4: Final Examination Schedule */}
                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-base">Final Examination Schedule</h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">Scheduled date and timer for the comprehensive final exam</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-full">
                                        Official Assessment
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                                            <Calendar size={12} className="text-purple-500" /> Final Exam Date
                                        </label>
                                        <input 
                                            type="date" 
                                            value={newCourse.examDate || '2026-12-01'} 
                                            onChange={e => setNewCourse({...newCourse, examDate: e.target.value})} 
                                            className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                                            <Clock size={12} className="text-purple-500" /> Exam Duration
                                        </label>
                                        <input 
                                            type="text" 
                                            defaultValue="60 mins (50 Questions)"
                                            className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none" 
                                            placeholder="e.g. 60 mins" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Course Overview */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto pb-10">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-4">
                                Step 5: Course Overview & Confirmation
                            </h3>
                            
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 flex items-start gap-3">
                                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={24} />
                                <div>
                                    <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">Ready to Publish Live Cohort Course!</h4>
                                    <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-0.5">
                                        Review the live class schedule, meeting links, attendance code, and syllabus topics below before publishing.
                                    </p>
                                </div>
                            </div>

                            {/* Basic Info Card */}
                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Basic Information</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-[11px] text-gray-400">Course Title</p>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{newCourse.title || 'Untitled'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400">Instructor</p>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{newCourse.instructor || 'Unassigned'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400">Category & Level</p>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{newCourse.category} • {newCourse.level || 'Beginner'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400">Duration</p>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{newCourse.duration}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Live Cohort & Schedule Card */}
                            <div className="bg-white dark:bg-slate-900 border border-violet-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                                    <h4 className="text-xs font-bold uppercase text-violet-600 dark:text-violet-400 tracking-wider flex items-center gap-1.5">
                                        <Radio size={14} className="animate-pulse" /> Live Cohort & Google Meet Schedule
                                    </h4>
                                    <span className="text-[11px] font-bold px-2 py-0.5 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 rounded-md">
                                        {newCourse.cohortName || 'Cohort 1'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-gray-400 block text-[11px]">Period of Lessons</span>
                                            <span className="font-bold text-gray-800 dark:text-slate-200">
                                                {newCourse.startDate || '15 Nov 2026'} till {newCourse.endDate || '01 Dec 2026'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-[11px]">Weekly Lesson Days</span>
                                            <span className="font-bold text-violet-600 dark:text-violet-400">
                                                {(newCourse.lessonDays || []).join(', ') || 'Monday, Wednesday, Friday'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-[11px]">Lesson Timing & Timezone</span>
                                            <span className="font-bold text-gray-800 dark:text-slate-200">
                                                {newCourse.lessonStartTime || '18:00'} - {newCourse.lessonEndTime || '20:00'} ({newCourse.timezone || 'EAT'})
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 bg-gray-50 dark:bg-slate-850 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <div>
                                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Google Meet Link</span>
                                            <span className="font-mono text-xs text-blue-600 dark:text-blue-400 break-all select-all">
                                                {newCourse.meetingLink || 'To be shared with students'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Attendance PIN</span>
                                            <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                                                {newCourse.attendanceCode || 'WEL-8492'}
                                            </span>
                                        </div>
                                        <div className="pt-1 flex gap-2 text-[11px]">
                                            <span className="text-gray-400">Final Exam:</span>
                                            <span className="font-semibold text-gray-700 dark:text-slate-300">{newCourse.examDate || '01 Dec 2026'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Curriculum Summary */}
                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Curriculum Summary</h4>
                                    <span className="text-xs font-bold text-gray-600 dark:text-slate-300">
                                        {(newCourse.sections || []).length} Modules • {(newCourse.sections || []).reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} Topics
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {(newCourse.sections || []).map((sec, i) => (
                                        <div key={i} className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl text-xs space-y-1">
                                            <div className="flex justify-between font-bold text-gray-800 dark:text-slate-200">
                                                <span>{sec.title}</span>
                                                <span className="text-[10px] text-gray-400">{sec.lessons.length} topics</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 line-clamp-1">
                                                {sec.lessons.map(l => l.title).join(' • ')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Access Tier & Pricing</h4>
                                    <p className="font-bold text-gray-900 dark:text-white text-lg mt-0.5">
                                        {newCourse.accessTier === 'FREE' ? 'Free Course' : `${formatAmount(newCourse.price || 0, currency.symbol, currency.rate)} ${currency.code}`}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${newCourse.accessTier === 'FREE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {newCourse.accessTier || 'FREE'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation Buttons */}
                <div className="pt-6 mt-8 border-t border-gray-200 dark:border-slate-800 flex justify-between max-w-2xl mx-auto w-full">
                    <button 
                        onClick={handlePrev}
                        disabled={step === 1}
                        className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer'}`}
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleSave(false)}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl font-medium flex items-center gap-2 transition-colors cursor-pointer"
                        >
                            <Save size={18} /> {isEditMode ? 'Save Changes' : 'Save as Draft'}
                        </button>
                        
                        {step < 5 ? (
                            <button 
                                onClick={handleNext}
                                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-md shadow-violet-200 dark:shadow-none transition-colors cursor-pointer"
                            >
                                Next Step <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleSave(true)}
                                disabled={isSaving}
                                className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors ${isSaving ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 dark:shadow-none cursor-pointer'}`}
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                                {isSaving ? 'Publishing Course...' : 'Finish & Publish Live Course'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Google Meet Host Configuration */}
            {isMeetHostModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 border border-gray-150 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Video className="text-violet-600" size={20} />
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">Generate Real Google Meet (Tutor as Host)</h3>
                            </div>
                            <button onClick={() => setIsMeetHostModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Host Account Indicator */}
                            <div className="p-3.5 bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-900/50 rounded-xl space-y-1">
                                <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 tracking-wider">Designated Meet Host</span>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                            {(newCourse.instructor || 'T')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">{newCourse.instructor || 'Primary Instructor'}</p>
                                            <p className="text-[11px] font-mono text-gray-500 dark:text-slate-400">{newCourse.instructorEmail || 'tutor@welile.com'}</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-lg flex items-center gap-1 border border-emerald-200/60 dark:border-emerald-800/50">
                                        <CheckCircle2 size={11} /> Host Email Assigned
                                    </span>
                                </div>
                            </div>

                            {/* Why Google Server Creation is Required Alert */}
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                                <p className="font-bold flex items-center gap-1.5 mb-0.5">
                                    <AlertTriangle size={14} className="text-amber-600 shrink-0" /> Real Google Meet Links Require Google Server Registration
                                </p>
                                <p className="text-[11px]">
                                    Google Meet rejects randomly generated codes. Every valid room (e.g. <code>meet.google.com/abc-defg-hij</code>) must be initiated through Google's servers by the tutor so that Google assigns them host privileges (admitting students, recording, muting).
                                </p>
                            </div>

                            {/* Option 1: Instant Real Meet Room (Recommended) */}
                            <div className="p-4 bg-gray-50 dark:bg-slate-850 rounded-2xl border border-gray-200 dark:border-slate-750 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <span className="inline-block px-2 py-0.5 bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[10px] font-black uppercase rounded mb-1">Method 1 (Instant & Recommended)</span>
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                            Launch Real Meet Room as Tutor
                                        </h4>
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                                            Opens Google Meet in a new tab. When signed in with the tutor's Google account, Google provisions a genuine meeting room where the tutor is the official Host.
                                        </p>
                                    </div>
                                    <a
                                        href="https://meet.google.com/new"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                        <ExternalLink size={13} /> Launch Meet ↗
                                    </a>
                                </div>

                                <div className="pt-2 border-t border-gray-200 dark:border-slate-750">
                                    <label className="block text-[11px] font-bold text-gray-600 dark:text-slate-300 mb-1">
                                        Copy the link from the browser URL bar and paste here:
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            value={tempMeetInput}
                                            onChange={e => {
                                                setTempMeetInput(e.target.value);
                                                setMeetError('');
                                            }}
                                            placeholder="https://meet.google.com/abc-defg-hij"
                                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    const text = await navigator.clipboard.readText();
                                                    if (text) {
                                                        setTempMeetInput(text.trim());
                                                        setMeetError('');
                                                    }
                                                } catch {
                                                    const text = prompt('Paste Google Meet link:');
                                                    if (text) setTempMeetInput(text.trim());
                                                }
                                            }}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <Copy size={12} /> Paste
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!tempMeetInput.trim()) {
                                                    setMeetError('Please paste a Google Meet link.');
                                                    return;
                                                }
                                                if (!tempMeetInput.includes('meet.google.com/')) {
                                                    setMeetError('Please provide a valid Google Meet URL containing meet.google.com/...');
                                                    return;
                                                }
                                                setNewCourse(prev => ({ ...prev, meetingLink: tempMeetInput.trim() }));
                                                setIsMeetHostModalOpen(false);
                                            }}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                        >
                                            <Check size={13} /> Apply Link
                                        </button>
                                    </div>
                                    {meetError && (
                                        <p className="text-[11px] text-red-500 mt-1 font-medium">{meetError}</p>
                                    )}
                                </div>
                            </div>

                            {/* Option 2: Google Calendar Event (For Recurring Cohorts) */}
                            <div className="p-4 bg-gray-50 dark:bg-slate-850 rounded-2xl border border-gray-200 dark:border-slate-750 flex items-start justify-between gap-3">
                                <div>
                                    <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase rounded mb-1">Method 2 (Recurring Cohort Schedule)</span>
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <Calendar size={13} className="text-blue-600" /> Schedule in Google Calendar
                                    </h4>
                                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                        Pre-fills a calendar invite for <strong>{newCourse.title || 'Course'}</strong> with the tutor as organizer. Click <em>"Add Google Meet video conferencing"</em> in Google Calendar to generate a permanent link valid for every cohort lesson.
                                    </p>
                                </div>
                                <a
                                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent((newCourse.title || 'Live Cohort Class') + ' - Welile School')}&details=${encodeURIComponent('Live Welile School Cohort Lesson\nInstructor: ' + (newCourse.instructorEmail || 'Tutor') + '\nVideo Conferencing: Google Meet')}&location=Google%20Meet&add=${encodeURIComponent(newCourse.instructorEmail || '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                    <Calendar size={13} /> Open Calendar ↗
                                </a>
                            </div>

                            {/* Option 3: Backend API Service Account info */}
                            <div className="p-3 bg-gray-100/70 dark:bg-slate-850/60 rounded-xl border border-gray-200 dark:border-slate-800 text-[11px] text-gray-600 dark:text-slate-400 space-y-1">
                                <p className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1">
                                    <Key size={12} className="text-violet-600" /> Automated API Setup (Google Workspace):
                                </p>
                                <p>
                                    To generate links automatically in the background without opening a browser tab, configure a Google Cloud Service Account with Google Calendar Domain-Wide Delegation in <code>backend/.env</code>.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsMeetHostModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcast Lesson Alert Modal */}
            {isBroadcastModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 border border-gray-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Bell className="text-violet-600" size={20} />
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">Broadcast Live Lesson Notification</h3>
                            </div>
                            <button onClick={() => setIsBroadcastModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        {broadcastSent ? (
                            <div className="py-8 text-center space-y-2">
                                <CheckCircle2 className="mx-auto text-emerald-500 w-12 h-12" />
                                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-base">Lesson Notification Sent!</h4>
                                <p className="text-xs text-gray-500">Google Meet link and attendance PIN broadcasted to student notification feeds.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-slate-850 p-4 rounded-xl border border-gray-100 dark:border-slate-800 text-xs space-y-2">
                                    <div className="flex justify-between font-bold text-gray-800 dark:text-slate-200">
                                        <span>{newCourse.title || 'Course Title'}</span>
                                        <span className="text-violet-600">{newCourse.cohortName || 'Cohort 1'}</span>
                                    </div>
                                    <div className="text-gray-600 dark:text-slate-400 font-mono text-[11px] bg-white dark:bg-slate-900 p-2 rounded border border-gray-100 dark:border-slate-800">
                                        <p><strong>🔗 Meet Link:</strong> {newCourse.meetingLink || 'None provided'}</p>
                                        <p><strong>🔑 Attendance PIN:</strong> {newCourse.attendanceCode || 'None'}</p>
                                        <p><strong>⏰ Schedule:</strong> {(newCourse.lessonDays || []).join(', ')} @ {newCourse.lessonStartTime} ({newCourse.timezone})</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Optional Tutor Message to Students</label>
                                    <textarea 
                                        value={broadcastNote}
                                        onChange={e => setBroadcastNote(e.target.value)}
                                        rows={3}
                                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
                                        placeholder="e.g. Please be on time today with your notebooks ready. We are covering practical prompt engineering!"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                                    <button 
                                        type="button"
                                        onClick={() => setIsBroadcastModalOpen(false)}
                                        className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleBroadcastAlert}
                                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        <Send size={13} /> Confirm & Broadcast
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Image Adjustment Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 border border-gray-100 dark:border-slate-800 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 dark:text-white">Adjust Cover Image</h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="text-gray-400 hover:text-gray-650 p-1 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Live Crop Card Preview */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">Live Card Preview</label>
                            <div className="h-40 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 relative">
                                <img 
                                    src={newCourse.image} 
                                    alt="Live Preview" 
                                    className="w-full h-full object-cover"
                                    style={{
                                        objectPosition: `${newCourse.imagePositionX ?? 50}% ${newCourse.imagePositionY ?? 50}%`,
                                        transform: `scale(${newCourse.imageScale ?? 1})`,
                                        transformOrigin: `${newCourse.imagePositionX ?? 50}% ${newCourse.imagePositionY ?? 50}%`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Adjustments Sliders */}
                        <div className="space-y-3 pt-2">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-slate-300">
                                    <span>Zoom / Scale</span>
                                    <span>{Math.round((newCourse.imageScale ?? 1) * 100)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="3" 
                                    step="0.05" 
                                    value={newCourse.imageScale ?? 1} 
                                    onChange={e => setNewCourse({...newCourse, imageScale: parseFloat(e.target.value)})}
                                    className="w-full accent-violet-600 cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-slate-300">
                                    <span>Horizontal Position (X)</span>
                                    <span>{newCourse.imagePositionX ?? 50}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={newCourse.imagePositionX ?? 50} 
                                    onChange={e => setNewCourse({...newCourse, imagePositionX: parseInt(e.target.value)})}
                                    className="w-full accent-violet-600 cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-slate-300">
                                    <span>Vertical Position (Y)</span>
                                    <span>{newCourse.imagePositionY ?? 50}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={newCourse.imagePositionY ?? 50} 
                                    onChange={e => setNewCourse({...newCourse, imagePositionY: parseInt(e.target.value)})}
                                    className="w-full accent-violet-600 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
                            <button 
                                onClick={() => {
                                    setNewCourse({...newCourse, imageScale: 1, imagePositionX: 50, imagePositionY: 50});
                                }}
                                className="px-4 py-2 border border-gray-250 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Reset Settings
                            </button>
                            <button 
                                onClick={() => setIsAdjustModalOpen(false)}
                                className="px-5 py-2 bg-violet-600 text-xs font-bold text-white rounded-xl hover:bg-violet-750 transition-colors cursor-pointer"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Publishing Overlay */}
            {isSaving && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col items-center shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin mb-6"></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Publishing Course</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-center text-sm">Please wait while we configure the live Google Meet cohort, modules syllabus, and save the course...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourseSetupWizard;
