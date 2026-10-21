import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { Course, CourseSection, CourseModule, ModuleType } from '../../types';
import { Plus, X, ArrowRight, ArrowLeft, Save, Video, FileText, Trash2, GripVertical, Headphones, File, HelpCircle } from 'lucide-react';
import { formatAmount, getCurrencyPreference, CurrencyType } from '../../lib/currency';

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
            warning: { bg: '#fffbeb', border: '#f59e0b', color: '#92400e', icon: '⚠️' },
            success: { bg: '#ecfdf5', border: '#10b981', color: '#065f46', icon: '✅' }
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
                    <span className="text-[10px]">🔗</span>
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
                        🖼 Image
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
                                        📁 Upload from device
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
                        📌
                    </button>
                    <div className="hidden group-hover/callout:block absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg z-50 py-1 min-w-[110px]">
                        <button type="button" onClick={() => insertCallout('info')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-350 cursor-pointer bg-transparent">ℹ️ Info</button>
                        <button type="button" onClick={() => insertCallout('warning')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-50 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-350 cursor-pointer bg-transparent">⚠️ Warning</button>
                        <button type="button" onClick={() => insertCallout('success')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-350 cursor-pointer bg-transparent">✅ Success</button>
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

interface AdminCoursesProps {
    isInstructor?: boolean;
}

const AdminCourses: React.FC<AdminCoursesProps> = ({ isInstructor = false }) => {
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

    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    
    // Wizard State
    const [step, setStep] = useState(1);
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
        setStep(s => Math.min(s + 1, 4));
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
                if (!section.title.trim()) {
                    alert('Please enter a title for all modules.');
                    return;
                }
                if (!section.lessons || section.lessons.length === 0) {
                    alert(`Please add at least one lesson or quiz to the module: "${section.title}"`);
                    return;
                }
                for (const lesson of section.lessons) {
                    if (!lesson.title.trim()) {
                        alert(`Please enter a title for all lessons in "${section.title}".`);
                        return;
                    }
                    if (!lesson.duration.trim()) {
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
                            if (!q.text.trim()) {
                                alert(`Please enter the question text for all questions in the quiz "${lesson.title}".`);
                                return;
                            }
                            if (!q.options || q.options.some((o: string) => !o.trim())) {
                                alert(`Please fill in all options for the question: "${q.text || 'Untitled'}"`);
                                return;
                            }
                        }
                    }
                }
            }
        }

        try {
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
            setIsWizardOpen(false);
            setIsEditMode(false);
            setEditingCourseId(null);
            setStep(1);
            setNewCourse({ title: '', instructor: '', instructorEmail: '', instructorAvatar: '', duration: '', category: '', accessTier: 'FREE', price: 0, platform: 'Welile', image: '', sections: [], description: '', outcomes: [] });
        } catch (e: any) {
            alert(`Error saving course: ${e?.message || e}`);
            console.error('Save error:', e);
        }
    };

    if (loading) return <div>Loading courses...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Course Management</h2>
                    <p className="text-sm text-gray-500">Create and manage your curriculum</p>
                </div>
                <button 
                    onClick={() => navigate(isInstructor ? '/instructor/courses/setup' : '/courses/setup')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={18} /> New Course Wizard
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
                        {isInstructor ? "You haven't uploaded any courses yet. Click 'New Course Wizard' to add your first course!" : "No courses available."}
                    </div>
                )}
                {filteredCourses.map(c => (
                    <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:transform hover:-translate-y-1 hover:border-welile-purple dark:hover:border-purple-600 transition-all duration-300">
                        <div className="h-40 bg-gray-200 relative">
                            {c.image && (
                                <img 
                                    src={c.image} 
                                    alt={c.title} 
                                    className="w-full h-full object-cover" 
                                    style={{
                                        objectPosition: `${c.imagePositionX ?? 50}% ${c.imagePositionY ?? 50}%`,
                                        transform: `scale(${c.imageScale ?? 1})`,
                                        transformOrigin: `${c.imagePositionX ?? 50}% ${c.imagePositionY ?? 50}%`
                                    }}
                                />
                            )}
                            <div className="absolute top-3 right-3 flex flex-wrap gap-2 justify-end">
                                {c.isDraft && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-gray-150 text-gray-700">
                                        DRAFT
                                    </span>
                                )}
                                {!c.isDraft && (
                                    c.isVerified === false ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-amber-100 text-amber-800 border border-amber-200">
                                            PENDING VERIFICATION
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-emerald-100 text-emerald-800 border border-emerald-250">
                                            VERIFIED
                                        </span>
                                    )
                                )}
                                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${c.accessTier === 'PAID' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {c.accessTier || 'FREE'}
                                </span>
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{c.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">{c.category} • {c.instructor}</p>
                            <div className="flex gap-2 items-center mb-4 flex-wrap">
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-[11px] font-semibold text-gray-600 dark:text-slate-400 rounded-md">
                                    Platform: {c.platform || 'Welile'}
                                </span>
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-[11px] font-semibold text-gray-600 dark:text-slate-400 rounded-md">
                                    Price: {c.accessTier === 'PAID' ? formatAmount(c.price || 0) : 'Free'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-gray-700 dark:text-slate-300">{c.duration}</span>
                                <div className="flex items-center gap-3">
                                    {!isInstructor && c.isVerified === false && (
                                        <button 
                                            onClick={async () => {
                                                if (window.confirm(`Are you sure you want to verify and publish: "${c.title}"?`)) {
                                                    try {
                                                        const updatedData = {
                                                            ...c,
                                                            isVerified: true
                                                        };
                                                        await updateCourse(c.id, updatedData);
                                                        alert('Course verified and published successfully!');
                                                    } catch (err: any) {
                                                        alert(`Error verifying course: ${err.message || err}`);
                                                    }
                                                }
                                            }}
                                            className="text-emerald-650 dark:text-emerald-450 font-bold hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer text-xs uppercase tracking-wider"
                                        >
                                            Approve & Verify
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => {
                                            setIsEditMode(true);
                                            setEditingCourseId(c.id);
                                            setNewCourse({
                                                title: c.title,
                                                instructor: c.instructor,
                                                duration: c.duration,
                                                category: c.category,
                                                accessTier: c.accessTier,
                                                price: c.price || 0,
                                                platform: c.platform || 'Welile',
                                                isVerified: c.isVerified,
                                                image: c.image,
                                                sections: c.sections || (c.modules ? [{ id: 's1', title: 'Course Content', lessons: c.modules }] : []),
                                                description: c.description || '',
                                                outcomes: c.outcomes || [],
                                                imageScale: c.imageScale || 1,
                                                imagePositionX: c.imagePositionX || 50,
                                                imagePositionY: c.imagePositionY || 50,
                                                isDraft: c.isDraft,
                                                instructorEmail: c.instructorEmail || '',
                                                instructorAvatar: c.instructorAvatar || ''
                                            });
                                            setStep(1);
                                            setIsWizardOpen(true);
                                        }}
                                        className="text-violet-600 font-medium hover:text-violet-850 cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (window.confirm(`Are you sure you want to delete the course: "${c.title}"?`)) {
                                                try {
                                                    await deleteCourse(c.id);
                                                    alert('Course deleted successfully!');
                                                } catch (err: any) {
                                                    alert(`Error deleting course: ${err.message || err}`);
                                                }
                                            }
                                        }}
                                        className="text-red-550 font-medium hover:text-red-700 cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default AdminCourses;
