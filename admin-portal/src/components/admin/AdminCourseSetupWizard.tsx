import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { Course, CourseSection, CourseModule, ModuleType } from '../../types';
import { Plus, X, ArrowRight, ArrowLeft, Save, Video, FileText, Trash2, GripVertical, Headphones, File, HelpCircle, AlertTriangle, CheckCircle2, Link, Image, Folder, Pin, User, School, Loader2 } from 'lucide-react';
import { formatAmount, getCurrencyPreference, CurrencyType } from '../../lib/currency';
import { supabaseClient } from '../../lib/supabaseClient';
import { generateCurriculumFromNotes } from '../../services/aiGenerationService';

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
    const tutors: any[] = [];
    const partners: any[] = [];
    const { courses, loading, addCourse, updateCourse, deleteCourse } = useAdmin(true);
    const navigate = useNavigate();

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

    const instructorEmail = localStorage.getItem('instructor-email') || '';

    const filteredCourses = isInstructor 
        ? courses.filter(c => c.instructorEmail?.trim().toLowerCase() === instructorEmail.trim().toLowerCase())
        : courses;

    const [isWizardOpen, setIsWizardOpen] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Wizard State
    const [step, setStep] = useState(1);
    const [courseNotesFile, setCourseNotesFile] = useState<File | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [newCourse, setNewCourse] = useState<Partial<Course>>({
        title: '', instructor: '', instructorEmail: '', instructorAvatar: '', duration: '', category: '', accessTier: 'FREE', price: 0, platform: 'Welile', image: '', sections: [], description: '', outcomes: []
    });

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

    const handleNext = () => {
        setStep(s => Math.min(s + 1, 5));
    };
    const handlePrev = () => setStep(s => Math.max(s - 1, 1));
    
    const addSection = () => {
        const newSection: CourseSection = {
            id: Math.random().toString(36).substring(7),
            title: `Module ${newCourse.sections?.length ? newCourse.sections.length + 1 : 1}`,
            lessons: []
        };
        setNewCourse({ ...newCourse, sections: [...(newCourse.sections || []), newSection] });
    };


    const addFinalExam = () => {
        const examSection = {
            id: 'final-exam-' + Math.random().toString(36).substring(7),
            title: 'Final Examination',
            lessons: [{
                id: Math.random().toString(36).substring(7),
                title: 'Final Exam (50 Questions)',
                description: '',
                type: 'quiz',
                duration: '60 mins',
                isFinalExam: true,
                quizTimer: 60,
                quizQuestions: Array(50).fill(null).map((_, i) => ({
                    id: Math.random().toString(36).substring(7),
                    text: 'Final Exam Question ' + (i + 1),
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswer: 0
                }))
            }]
        };
        setNewCourse({ ...newCourse, sections: [...(newCourse.sections || []), examSection] });
    };

    const generateAIModules = async () => {
        if (!courseNotesFile) {
            alert("Please upload a Course Notes file first.");
            return;
        }

        setIsGeneratingAI(true);
        try {
            const rawSections = await generateCurriculumFromNotes(courseNotesFile);
            
            // Map the API response to our CourseSection / CourseModule types
            const generatedSections: CourseSection[] = rawSections.map((sec: any, sIdx: number) => ({
                id: Math.random().toString(36).substring(7),
                title: sec.title || `Generated Module ${sIdx + 1}`,
                lessons: (sec.lessons || []).map((les: any, lIdx: number) => ({
                    id: Math.random().toString(36).substring(7),
                    title: les.title || `Lesson ${lIdx + 1}`,
                    type: les.type || 'video',
                    duration: les.duration || '15m',
                    description: les.description || '',
                    classType: 'none'
                }))
            }));
            
            setNewCourse(prev => ({ 
                ...prev, 
                sections: [...(prev.sections || []), ...generatedSections] 
            }));
            
            alert("Curriculum generated successfully!");
        } catch (error: any) {
            alert("AI Generation failed: " + (error?.message || error));
        } finally {
            setIsGeneratingAI(false);
        }
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

    const addLesson = (sectionId: string, type: ModuleType) => {
        const newLesson: CourseModule = {
            id: Math.random().toString(36).substring(7),
            title: type === 'quiz' ? 'Module Quiz' : `New ${type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : type === 'document' ? 'Document' : 'Reading'}`,
            description: '',
            type,
            duration: type === 'quiz' ? '5 mins' : '10 mins',
            classType: 'none',
            lessonNotesUrl: '',
            presentationUrl: '',
            scheduledDate: '',
            scheduledStartTime: '',
            scheduledEndTime: '',
            meetLink: '',
            videoUrl: '',
            audioUrl: '',
            fileUrl: '',
            content: '',
            quizTimer: type === 'quiz' ? 5 : undefined,
            quizQuestions: type === 'quiz' ? [
                {
                    id: Math.random().toString(36).substring(7),
                    text: 'What is the correct answer to this question?',
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswer: 0
                }
            ] : undefined
        };
        setNewCourse({
            ...newCourse,
            sections: newCourse.sections?.map(s => {
                if (s.id === sectionId) {
                    return { ...s, lessons: [...s.lessons, newLesson] };
                }
                return s;
            })
        });
    };

    const removeLesson = (sectionId: string, lessonId: string) => {
        setNewCourse({
            ...newCourse,
            sections: newCourse.sections?.map(s => {
                if (s.id === sectionId) {
                    return { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) };
                }
                return s;
            })
        });
    };

    const updateLesson = (sectionId: string, lessonId: string, updates: Partial<CourseModule>) => {
        setNewCourse({
            ...newCourse,
            sections: newCourse.sections?.map(s => {
                if (s.id === sectionId) {
                    return {
                        ...s,
                        lessons: s.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
                    };
                }
                return s;
            })
        });
    };

    const handleSave = async (publish: boolean = true) => {
        // Validate fields only when publishing
        if (publish) {
            // Validate Step 1 & Step 2 fields
            if (!newCourse.title?.trim() || !newCourse.instructor?.trim() || !newCourse.instructorEmail?.trim() || !newCourse.instructorAvatar?.trim() || !newCourse.description?.trim()) {
                alert('Please complete all fields in Step 1 (Basic Information) before publishing.');
                setStep(1);
                return;
            }
            if (!newCourse.category?.trim() || !newCourse.duration?.trim() || !newCourse.image?.trim()) {
                alert('Please complete all fields in Step 2 (Details & Categorization) before publishing.');
                setStep(2);
                return;
            }
            const filteredOutcomes = newCourse.outcomes?.filter(o => o.trim() !== '') || [];
            if (filteredOutcomes.length === 0) {
                alert('Please complete learning outcomes in Step 2 before publishing.');
                setStep(2);
                return;
            }

            // Validate Step 4 curriculum
            if (!newCourse.sections || newCourse.sections.length === 0) {
                alert('Please add at least one module/section to publish the course.');
                return;
            }
            for (const section of newCourse.sections) {
                if (!section.title?.trim()) {
                    alert('Please enter a title for all modules.');
                    return;
                }
                if (!section.lessons || section.lessons.length === 0) {
                    alert(`Please add at least one lesson or quiz to the module: "${section.title}"`);
                    return;
                }
                for (const lesson of section.lessons) {
                    if (!lesson.title?.trim()) {
                        alert(`Please enter a title for all lessons in "${section.title}".`);
                        return;
                    }
                    if (!lesson.duration?.trim()) {
                        alert(`Please specify a duration for the lesson "${lesson.title}".`);
                        return;
                    }
                    if (lesson.type === 'video' && !lesson.videoUrl?.trim()) {
                        alert(`Please specify a video URL for the lesson "${lesson.title}".`);
                        return;
                    }
                    if (lesson.type === 'audio' && !lesson.audioUrl?.trim()) {
                        alert(`Please specify an audio URL for the lesson "${lesson.title}".`);
                        return;
                    }
                    if (lesson.type === 'document' && !lesson.content?.trim() && !lesson.fileUrl?.trim()) {
                        alert(`Please enter document content or upload a document file for "${lesson.title}".`);
                        return;
                    }
                    if (lesson.type === 'article' && !lesson.content?.trim()) {
                        alert(`Please type the article content for the lesson "${lesson.title}".`);
                        return;
                    }
                    if (lesson.type === 'quiz') {
                        if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) {
                            alert(`Please add at least one question to the quiz "${lesson.title}".`);
                            return;
                        }
                        for (const q of lesson.quizQuestions) {
                            if (!q.text?.trim()) {
                                alert(`Please enter the question text for all questions in the quiz "${lesson.title}".`);
                                return;
                            }
                            if (!q.options || q.options.some((o: string) => !o?.trim())) {
                                alert(`Please fill in all options for the question: "${q.text || 'Untitled'}"`);
                                return;
                            }
                        }
                    }
                }
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
                duration: newCourse.duration?.trim() || '0h',
                category: newCourse.category?.trim() || 'Uncategorized',
                image: newCourse.image?.trim() || '',
                isDraft: !publish,
                isVerified: isInstructor 
                    ? (publish ? false : (newCourse.isVerified || false)) 
                    : (isEditMode ? (newCourse.isVerified !== undefined ? newCourse.isVerified : true) : true),
                price: newCourse.accessTier === 'FREE' ? 0 : (newCourse.price || 0),
                platform: newCourse.platform || 'Welile'
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
            setNewCourse({ title: '', instructor: '', instructorEmail: '', instructorAvatar: '', duration: '', category: '', accessTier: 'FREE', price: 0, platform: 'Welile', image: '', sections: [], description: '', outcomes: [] });
            navigate(isInstructor ? '/instructor/courses' : '/courses');
        } catch (e: any) {
            alert(`Error saving course: ${e?.message || e}`);
            console.error('Save error:', e);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

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
                        { num: 4, title: 'Curriculum Builder' },
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

            {/* Right Form Content */}
            <div className="flex-1 bg-transparent overflow-y-auto pb-24 md:pr-4">
                <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-slate-800 pb-4 max-w-2xl mx-auto w-full">
                    <button 
                        onClick={() => navigate(isInstructor ? '/instructor/courses' : '/courses')}
                        className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditMode ? 'Edit Course Settings' : 'New Course Setup'}</h2>
                </div>
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
                                    {tutors.map(t => (
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
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Category</label>
                                    <select 
                                        value={newCourse.category || ''} 
                                        onChange={e => setNewCourse({...newCourse, category: e.target.value})} 
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                    >
                                        <option value="" disabled>Select a Category...</option>
                                        <option value="AI">AI</option>
                                        <option value="Education">Education</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Business">Business</option>
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
                                    </select>
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
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-semibold">Step 4: Curriculum Builder</h3>
                                <button onClick={addSection} className="text-sm bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-200 font-bold flex items-center gap-1">
                                    <Plus size={16} /> Add Module
                                </button>
                            </div>
                                    
                                    
                                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm mb-6 space-y-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Course Materials & AI Generation</h4>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Course Introduction Video (URL)</label>
                                            <input 
                                                value={newCourse.courseIntroVideoUrl || ''} 
                                                onChange={e => setNewCourse({...newCourse, courseIntroVideoUrl: e.target.value})} 
                                                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none" 
                                                placeholder="e.g. https://youtube.com/watch?v=..." 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Upload Course Notes (For AI Module Generation)</label>
                                            <div className="flex gap-4">
                                                <input 
                                                    type="file" 
                                                    accept=".pdf,text/plain"
                                                    onChange={e => setCourseNotesFile(e.target.files?.[0] || null)}
                                                    className="flex-1 p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl" 
                                                />
                                                <button 
                                                    onClick={generateAIModules} 
                                                    disabled={isGeneratingAI || !courseNotesFile}
                                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2"
                                                >
                                                    {isGeneratingAI ? <Loader2 className="animate-spin" size={16} /> : '✨'} 
                                                    {isGeneratingAI ? 'Generating...' : 'Generate Modules with AI'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {(!newCourse.sections || newCourse.sections.length === 0) && (
                                        <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
                                            Your curriculum is empty. Click "Add Module" to get started.
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {newCourse.sections?.map((section, sIdx) => (
                                            <div key={section.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                                                <div className="bg-gray-50 dark:bg-slate-850 p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <GripVertical className="text-gray-400 cursor-move" size={20} />
                                                        <input 
                                                            value={section.title}
                                                            onChange={e => updateSectionTitle(section.id, e.target.value)}
                                                            className="bg-transparent font-bold text-gray-900 dark:text-white outline-none focus:border-b-2 focus:border-violet-500 py-1 flex-1"
                                                            placeholder="e.g. Module 1: Introduction"
                                                        />
                                                    </div>
                                                    <div className="w-full mt-3 px-8 flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                                                        <input 
                                                            value={section.explainerVideoUrl || ''}
                                                            onChange={e => {
                                                                setNewCourse({
                                                                    ...newCourse,
                                                                    sections: newCourse.sections?.map(s => s.id === section.id ? { ...s, explainerVideoUrl: e.target.value } : s)
                                                                });
                                                            }}
                                                            className="text-xs bg-transparent border-b border-gray-200 dark:border-slate-700 focus:border-violet-500 outline-none flex-1 text-gray-600 dark:text-slate-300"
                                                            placeholder="Module Explainer YouTube URL"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-3 justify-end w-full">

                                                        <button onClick={() => addLesson(section.id, 'article')} className="text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-100 flex items-center gap-1"><FileText size={12} /> Add Lesson</button>
                                                        <button onClick={() => addLesson(section.id, 'video')} className="text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1"><Video size={12} /> Add Video</button>
                                                        <button onClick={() => addLesson(section.id, 'audio')} className="text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-1 rounded hover:bg-amber-100 flex items-center gap-1"><Headphones size={12} /> Add Audio</button>
                                                        <button onClick={() => addLesson(section.id, 'document')} className="text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1"><File size={12} /> Add Document</button>
                                                        <button onClick={() => addLesson(section.id, 'quiz')} className="text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded hover:bg-purple-100 flex items-center gap-1"><HelpCircle size={12} /> Add Quiz</button>
                                                        <button onClick={() => removeSection(section.id)} className="text-gray-400 hover:text-red-650 p-1"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>

                                                <div className="p-4 space-y-3">
                                                    {section.lessons.length === 0 && (
                                                        <p className="text-sm text-gray-405 dark:text-slate-500 text-center py-4">No lessons in this module yet.</p>
                                                    )}
                                                    {section.lessons.map((lesson, lIdx) => (
                                                        <div key={lesson.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col gap-3 group">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <div className={`p-2 rounded-lg ${
                                                                        lesson.type === 'video' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 
                                                                        lesson.type === 'audio' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 
                                                                        lesson.type === 'document' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 
                                                                        lesson.type === 'quiz' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' :
                                                                        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                                                                        {lesson.type === 'video' ? <Video size={18} /> : 
                                                                         lesson.type === 'audio' ? <Headphones size={18} /> : 
                                                                         lesson.type === 'document' ? <File size={18} /> : 
                                                                         lesson.type === 'quiz' ? <HelpCircle size={18} /> :
                                                                         <FileText size={18} />}
                                                                    </div>
                                                                    <input 
                                                                        value={lesson.title}
                                                                        onChange={e => updateLesson(section.id, lesson.id, { title: e.target.value })}
                                                                        className="font-medium text-gray-800 dark:text-slate-205 bg-transparent flex-1 outline-none border-b border-transparent focus:border-gray-300 focus:dark:border-slate-700"
                                                                        placeholder="Lesson Title"
                                                                    />
                                                                </div>
                                                                <button onClick={() => removeLesson(section.id, lesson.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                            
                                                            <div className="pl-12 flex flex-col gap-3">
                                                                <div className="flex gap-4 items-start">
                                                                <input 
                                                                    value={lesson.duration}
                                                                    onChange={e => updateLesson(section.id, lesson.id, { duration: e.target.value })}
                                                                    className="text-xs border border-gray-200 dark:border-slate-750 bg-transparent text-gray-900 dark:text-white rounded p-1.5 w-24 outline-none focus:border-violet-400"
                                                                    placeholder="e.g. 10m"
                                                                />
                                                                
                                                                {lesson.type === 'video' && (
                                                                    <div className="flex-1 flex flex-col gap-1">
                                                                        <div className="flex gap-2">
                                                                            {/* video block */}
                                                                            <input 
                                                                                type="text"
                                                                                value={lesson.videoUrl?.startsWith('blob:') ? '' : (lesson.videoUrl || '')}
                                                                                onChange={e => updateLesson(section.id, lesson.id, { videoUrl: e.target.value })}
                                                                                className="flex-1 text-sm border border-gray-200 dark:border-slate-750 bg-transparent text-gray-900 dark:text-white rounded p-1.5 outline-none focus:border-blue-400"
                                                                                placeholder="Paste raw MP4 URL (e.g. https://example.com/video.mp4)"
                                                                            />
                                                                            <label className="cursor-pointer bg-gray-100 dark:bg-slate-800 border border-transparent dark:border-slate-750 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs px-3 py-1.5 rounded font-medium flex items-center">
                                                                                <span>Browse MP4...</span>
                                                                                <input 
                                                                                    type="file" 
                                                                                    accept="video/mp4" 
                                                                                    className="hidden" 
                                                                                    onChange={e => {
                                                                                        const file = e.target.files?.[0];
                                                                                        if (file) {
                                                                                            const url = URL.createObjectURL(file);
                                                                                            updateLesson(section.id, lesson.id, { videoUrl: url, fileName: file.name });
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </label>
                                                                        </div>
                                                                        {lesson.fileName && (
                                                                            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Uploaded file: {lesson.fileName}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                
                                                                {lesson.type === 'audio' && (
                                                                    <div className="flex-1 flex flex-col gap-1">
                                                                        <div className="flex gap-2">
                                                                            <input 
                                                                                type="text"
                                                                                value={lesson.audioUrl?.startsWith('blob:') ? '' : (lesson.audioUrl || '')}
                                                                                onChange={e => updateLesson(section.id, lesson.id, { audioUrl: e.target.value })}
                                                                                className="flex-1 text-sm border border-gray-200 dark:border-slate-750 bg-transparent text-gray-900 dark:text-white rounded p-1.5 outline-none focus:border-amber-400"
                                                                                placeholder="Paste raw Audio URL (e.g. https://example.com/audio.mp3)"
                                                                            />
                                                                            <label className="cursor-pointer bg-gray-100 dark:bg-slate-800 border border-transparent dark:border-slate-750 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs px-3 py-1.5 rounded font-medium flex items-center">
                                                                                <span>Browse Audio...</span>
                                                                                <input 
                                                                                    type="file" 
                                                                                    accept="audio/*" 
                                                                                    className="hidden" 
                                                                                    onChange={e => {
                                                                                        const file = e.target.files?.[0];
                                                                                        if (file) {
                                                                                            const url = URL.createObjectURL(file);
                                                                                            updateLesson(section.id, lesson.id, { audioUrl: url, fileName: file.name });
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </label>
                                                                        </div>
                                                                        {lesson.fileName && (
                                                                            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Uploaded file: {lesson.fileName}</span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {lesson.type === 'document' && (
                                                                    <div className="flex-1 flex flex-col gap-2">
                                                                        <div className="flex gap-2">
                                                                            <input 
                                                                                type="text"
                                                                                value={lesson.fileUrl?.startsWith('blob:') ? '' : (lesson.fileUrl || '')}
                                                                                onChange={e => updateLesson(section.id, lesson.id, { fileUrl: e.target.value })}
                                                                                className="flex-1 text-sm border border-gray-200 dark:border-slate-750 bg-transparent text-gray-900 dark:text-white rounded p-1.5 outline-none focus:border-indigo-400"
                                                                                placeholder="Paste Document/File URL (e.g. https://example.com/doc.pdf)"
                                                                            />
                                                                            <label className="cursor-pointer bg-gray-100 dark:bg-slate-800 border border-transparent dark:border-slate-750 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs px-3 py-1.5 rounded font-medium flex items-center">
                                                                                <span>Browse File...</span>
                                                                                <input 
                                                                                    type="file" 
                                                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" 
                                                                                    className="hidden" 
                                                                                    onChange={e => {
                                                                                        const file = e.target.files?.[0];
                                                                                        if (file) {
                                                                                            const url = URL.createObjectURL(file);
                                                                                            updateLesson(section.id, lesson.id, { fileUrl: url, fileName: file.name });
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </label>
                                                                        </div>
                                                                        {lesson.fileName && (
                                                                            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Uploaded file: {lesson.fileName}</span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                </div> {/* Close flex gap-4 items-start */}

                                                                <textarea 
                                                                    value={lesson.description || ''}
                                                                    onChange={e => updateLesson(section.id, lesson.id, { description: e.target.value })}
                                                                    className="w-full text-xs p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-violet-400 resize-y min-h-[60px]"
                                                                    placeholder="Brief lesson description..."
                                                                />

                                                                {lesson.type !== 'quiz' && (
                                                                    <div className="flex-1 mt-1">
                                                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Lesson Notes</label>
                                                                        <RichTextEditor 
                                                                            value={lesson.content || ''}
                                                                            onChange={val => updateLesson(section.id, lesson.id, { content: val })}
                                                                            accentColorClass="border-gray-200 dark:border-slate-800 focus-within:border-emerald-400"
                                                                            placeholder="Type your lesson notes or article content here..."
                                                                        />
                                                                    </div>
                                                                )}

                                                                {lesson.type === 'quiz' && (
                                                                    <div className="flex-1 space-y-4 bg-gray-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-gray-150 dark:border-slate-800">
                                                                        <div className="flex items-center gap-4 justify-between">
                                                                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Quiz Settings</span>
                                                                            <button onClick={() => {
                                                                                alert("Mock: AI generating 20 questions...");
                                                                                updateLesson(section.id, lesson.id, {
                                                                                    quizQuestions: Array(20).fill(null).map((_, i) => ({
                                                                                        id: Math.random().toString(), text: 'Generated Q' + (i+1), options: ['A','B','C','D'], correctAnswer: 0
                                                                                    }))
                                                                                });
                                                                            }} className="bg-purple-100 text-purple-700 text-[10px] px-2 py-1 rounded font-bold hover:bg-purple-200">✨ Auto-Generate 20 Qs</button>
                                                                            <div className="flex items-center gap-2">
                                                                                <label className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Timer (minutes):</label>
                                                                                <input 
                                                                                    type="number"
                                                                                    value={lesson.quizTimer || 5}
                                                                                    onChange={e => updateLesson(section.id, lesson.id, { quizTimer: Math.max(1, parseInt(e.target.value) || 5) })}
                                                                                    className="text-xs border border-gray-250 dark:border-slate-700 rounded p-1.5 w-16 outline-none focus:border-purple-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-bold"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {(lesson.quizQuestions || []).map((q: any, qIdx: number) => (
                                                                                <div key={q.id || qIdx} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-lg shadow-sm space-y-3 relative group/q">
                                                                                    <div className="flex justify-between items-start gap-4">
                                                                                        <span className="text-xs font-bold text-purple-700 dark:text-purple-400 font-mono">Question {qIdx + 1}</span>
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                const updatedQs = (lesson.quizQuestions || []).filter((_: any, idx: number) => idx !== qIdx);
                                                                                                updateLesson(section.id, lesson.id, { quizQuestions: updatedQs });
                                                                                            }}
                                                                                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover/q:opacity-100 transition-opacity cursor-pointer"
                                                                                            title="Delete Question"
                                                                                        >
                                                                                            <Trash2 size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                    <input 
                                                                                        type="text"
                                                                                        value={q.text}
                                                                                        onChange={e => {
                                                                                            const updatedQs = [...(lesson.quizQuestions || [])];
                                                                                            updatedQs[qIdx] = { ...updatedQs[qIdx], text: e.target.value };
                                                                                            updateLesson(section.id, lesson.id, { quizQuestions: updatedQs });
                                                                                        }}
                                                                                        className="w-full text-xs font-medium border-b border-gray-100 dark:border-slate-800 focus:border-purple-400 pb-1 outline-none bg-transparent text-gray-900 dark:text-white"
                                                                                        placeholder="Type your question..."
                                                                                    />
                                                                                    <div className="grid grid-cols-2 gap-2 pl-4">
                                                                                        {['A', 'B', 'C', 'D'].map((optionLetter, oIdx) => {
                                                                                            const options = q.options || ['', '', '', ''];
                                                                                            const isCorrect = q.correctAnswer === oIdx;
                                                                                            return (
                                                                                                <div key={oIdx} className="flex items-center gap-2">
                                                                                                    <input 
                                                                                                        type="radio"
                                                                                                        name={`q-${section.id}-${lesson.id}-${qIdx}`}
                                                                                                        checked={isCorrect}
                                                                                                        onChange={() => {
                                                                                                            const updatedQs = [...(lesson.quizQuestions || [])];
                                                                                                            updatedQs[qIdx] = { ...updatedQs[qIdx], correctAnswer: oIdx };
                                                                                                            updateLesson(section.id, lesson.id, { quizQuestions: updatedQs });
                                                                                                        }}
                                                                                                        className="text-purple-600 focus:ring-purple-400 h-3 w-3 cursor-pointer"
                                                                                                    />
                                                                                                    <input 
                                                                                                        type="text"
                                                                                                        value={options[oIdx] || ''}
                                                                                                        onChange={e => {
                                                                                                            const updatedOptions = [...options];
                                                                                                            updatedOptions[oIdx] = e.target.value;
                                                                                                            const updatedQs = [...(lesson.quizQuestions || [])];
                                                                                                            updatedQs[qIdx] = { ...updatedQs[qIdx], options: updatedOptions };
                                                                                                            updateLesson(section.id, lesson.id, { quizQuestions: updatedQs });
                                                                                                        }}
                                                                                                        className={`text-xs border rounded p-1 flex-1 outline-none bg-transparent text-gray-900 dark:text-white ${isCorrect ? 'border-purple-305 bg-purple-50/10 font-medium' : 'border-gray-100 dark:border-slate-800 focus:border-gray-300 focus:dark:border-slate-700'}`}
                                                                                                        placeholder={`Option ${optionLetter}`}
                                                                                                    />
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        <button 
                                                                            onClick={() => {
                                                                                const newQ = {
                                                                                    id: Date.now().toString(),
                                                                                    text: '',
                                                                                    options: ['', '', '', ''],
                                                                                    correctAnswer: 0
                                                                                };
                                                                                updateLesson(section.id, lesson.id, { 
                                                                                    quizQuestions: [...(lesson.quizQuestions || []), newQ] 
                                                                                });
                                                                            }}
                                                                            className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 flex items-center gap-1 mt-2 cursor-pointer"
                                                                        >
                                                                            + Add Objective Question
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                <div className="w-full mt-2 flex flex-col gap-3 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                                                    <div className="flex gap-4">
                                                                        <div className="flex-1 flex flex-col gap-1">
                                                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Presentation</label>
                                                                            <div className="flex gap-2">
                                                                                <input type="text" value={lesson.presentationUrl?.startsWith('blob:') ? '' : (lesson.presentationUrl || '')} onChange={e => updateLesson(section.id, lesson.id, {presentationUrl: e.target.value})} className="flex-1 text-xs p-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white" placeholder="Upload or link slides..." />
                                                                                <label className="cursor-pointer bg-gray-100 dark:bg-slate-700 border border-transparent hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs px-3 py-2 rounded font-medium flex items-center whitespace-nowrap">
                                                                                    <span>Browse...</span>
                                                                                    <input type="file" accept=".ppt,.pptx,.pdf" className="hidden" onChange={e => {
                                                                                        const file = e.target.files?.[0];
                                                                                        if (file) {
                                                                                            updateLesson(section.id, lesson.id, { presentationUrl: URL.createObjectURL(file), presentationFileName: file.name });
                                                                                        }
                                                                                    }} />
                                                                                </label>
                                                                            </div>
                                                                            {lesson.presentationFileName && <span className="text-[10px] text-gray-500">File: {lesson.presentationFileName}</span>}
                                                                        </div>
                                                                        <div className="flex-1 flex flex-col gap-1">
                                                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Class Schedule Type</label>
                                                                            <select value={lesson.classType || 'none'} onChange={e => updateLesson(section.id, lesson.id, {classType: e.target.value})} className="text-xs p-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white h-9">
                                                                                <option value="none">No Live Class</option>
                                                                                <option value="online">Online (Google Meet)</option>
                                                                                <option value="physical">Physical/In-person</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    {lesson.classType && lesson.classType !== 'none' && (
                                                                        <div className="flex gap-2 items-center flex-wrap">
                                                                            <input type="date" value={lesson.scheduledDate || ''} onChange={e => updateLesson(section.id, lesson.id, {scheduledDate: e.target.value})} className="text-xs p-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900" />
                                                                            <input type="time" value={lesson.scheduledStartTime || ''} onChange={e => updateLesson(section.id, lesson.id, {scheduledStartTime: e.target.value})} className="text-xs p-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900" />
                                                                            <span className="text-xs text-gray-500">to</span>
                                                                            <input type="time" value={lesson.scheduledEndTime || ''} onChange={e => updateLesson(section.id, lesson.id, {scheduledEndTime: e.target.value})} className="text-xs p-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900" />
                                                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Repeats Weekly</span>
                                                                        </div>
                                                                    )}
                                                                    {lesson.classType === 'online' && (
                                                                        <div className="flex items-center gap-2">
                                                                            <button onClick={() => {
                                                                                alert('Mock: Integrating with Google Meet to create link...');
                                                                                updateLesson(section.id, lesson.id, {meetLink: 'https://meet.google.com/mock-link-abc'});
                                                                            }} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-bold">Generate Meet Link</button>
                                                                            {lesson.meetLink && <span className="text-xs text-blue-600 underline">{lesson.meetLink}</span>}
                                                                            {lesson.meetLink && <span className="text-[10px] text-gray-500">(Host: {newCourse.instructorEmail || 'Tutor'})</span>}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className="flex justify-center pt-4">
                                            <button onClick={addFinalExam} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform">
                                                📝 Add Final Examination
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            )}

                    {step === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto pb-10">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-4">Step 5: Course Overview</h3>
                            
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                <div>
                                    <h4 className="font-bold text-green-800">Ready to Publish!</h4>
                                    <p className="text-green-700 text-sm mt-1">Review the details below before publishing your course.</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <h4 className="text-sm font-bold uppercase text-gray-500 mb-4 tracking-wider">Basic Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Course Title</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{newCourse.title || 'Untitled'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Instructor</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{newCourse.instructor || 'Not assigned'} ({newCourse.instructorEmail})</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Category & Level</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{newCourse.category || 'N/A'} - {newCourse.level || 'Beginner'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Duration</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{newCourse.duration || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <h4 className="text-sm font-bold uppercase text-gray-500 mb-4 tracking-wider">Curriculum Summary</h4>
                                <p className="font-medium text-gray-900 dark:text-white mb-2">{(newCourse.sections || []).length} Modules</p>
                                <ul className="space-y-2">
                                    {(newCourse.sections || []).map((sec, i) => (
                                        <li key={i} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-3 rounded-lg text-sm">
                                            <span className="font-medium text-gray-800 dark:text-slate-200">{sec.title}</span>
                                            <span className="text-gray-500 text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm">{sec.lessons.length} lessons</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <h4 className="text-sm font-bold uppercase text-gray-500 mb-4 tracking-wider">Pricing</h4>
                                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                    {newCourse.accessTier === 'FREE' ? 'Free Course' : `${formatAmount(newCourse.price || 0, currency.symbol, currency.rate)} ${currency.code}`}
                                </p>
                            </div>
                        </div>
                    )}

                <div className="pt-6 mt-8 border-t border-gray-200 dark:border-slate-800 flex justify-between max-w-2xl mx-auto w-full">
                    <button 
                        onClick={handlePrev}
                        disabled={step === 1}
                        className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
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
                                className="px-6 py-2.5 bg-welile-purple text-white rounded-xl font-medium flex items-center gap-2 hover:bg-purple-700 shadow-md shadow-purple-200 dark:shadow-none transition-colors"
                            >
                                Next Step <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleSave(true)}
                                disabled={isSaving}
                                className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors ${isSaving ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200 dark:shadow-none cursor-pointer'}`}
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {isSaving ? 'Publishing...' : 'Finish & Publish'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Adjustment Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 border border-gray-100 dark:border-slate-800 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 dark:text-white">Adjust Cover Image</h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="text-gray-400 hover:text-gray-650 dark:hover:text-slate-300 p-1 cursor-pointer">
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
                            {/* Zoom Slider */}
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

                            {/* X position Slider */}
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

                            {/* Y position Slider */}
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
                        <p className="text-gray-500 dark:text-slate-400 text-center text-sm">Please wait while we set up the curriculum, save all modules, and finalize the course...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourseSetupWizard;
