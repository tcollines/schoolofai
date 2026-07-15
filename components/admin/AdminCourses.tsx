import React, { useState } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { Course, CourseSection, CourseModule, ModuleType } from '../../types';
import { Plus, X, ArrowRight, ArrowLeft, Save, Video, FileText, Trash2, GripVertical, Headphones, File, HelpCircle } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    accentColorClass?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, accentColorClass = "border-gray-200 focus-within:border-violet-400" }) => {
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
            html += '<th style="border:1px solid #d1d5db;padding:8px 12px;background:#f3f4f6;font-weight:600;text-align:left;">Header ' + (c + 1) + '</th>';
        }
        html += '</tr></thead><tbody>';
        for (let r = 0; r < rows - 1; r++) {
            const bg = r % 2 === 0 ? '#ffffff' : '#f9fafb';
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                html += `<td style="border:1px solid #e5e7eb;padding:8px 12px;background:${bg};">Cell</td>`;
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
        executeCommand('insertHTML', '<blockquote style="border-left:4px solid #8b5cf6;padding:8px 16px;margin:8px 0;background:#f5f3ff;color:#4c1d95;border-radius:0 8px 8px 0;font-style:italic;">Quote text here</blockquote><p><br></p>');
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
            className={`p-1 hover:bg-gray-200 rounded text-xs w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${active ? 'bg-violet-100 text-violet-700' : 'text-gray-600'}`}
            title={title}
        >
            {children}
        </button>
    );

    const Divider = () => <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0" />;

    return (
        <div className={`border rounded-xl overflow-hidden bg-white ${accentColorClass}`} onClick={() => closeAllMenus()}>
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-150 p-1.5 flex flex-wrap gap-0.5 items-center relative" onClick={e => e.stopPropagation()}>
                {/* Heading Dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); closeAllMenus(); setShowHeadingMenu(!showHeadingMenu); }}
                        className="px-2 py-1 hover:bg-gray-200 rounded text-[10px] text-gray-600 cursor-pointer font-semibold flex items-center gap-0.5 min-w-[52px]"
                        title="Heading"
                    >
                        ¶ Text ▾
                    </button>
                    {showHeadingMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px] py-1">
                            <button type="button" onClick={() => insertHeading('p')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700 cursor-pointer">Paragraph</button>
                            <button type="button" onClick={() => insertHeading('h1')} className="w-full text-left px-3 py-1.5 text-lg font-bold hover:bg-gray-50 text-gray-900 cursor-pointer">Heading 1</button>
                            <button type="button" onClick={() => insertHeading('h2')} className="w-full text-left px-3 py-1.5 text-base font-bold hover:bg-gray-50 text-gray-800 cursor-pointer">Heading 2</button>
                            <button type="button" onClick={() => insertHeading('h3')} className="w-full text-left px-3 py-1.5 text-sm font-bold hover:bg-gray-50 text-gray-700 cursor-pointer">Heading 3</button>
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
                        className="p-1 hover:bg-gray-200 rounded text-xs w-6 h-6 flex items-center justify-center cursor-pointer text-gray-600"
                        title="Text Color"
                    >
                        <span className="font-bold">A</span>
                        <span className="absolute bottom-0.5 left-1 right-1 h-0.5 bg-red-500 rounded" />
                    </button>
                    {showColorMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 grid grid-cols-5 gap-1" onClick={e => e.stopPropagation()}>
                            {colors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => { executeCommand('foreColor', color); closeAllMenus(); }}
                                    className="w-5 h-5 rounded-full border border-gray-200 cursor-pointer hover:scale-125 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <ToolButton onClick={() => executeCommand('hiliteColor', '#fef08a')} title="Highlight">
                    <span className="font-bold bg-yellow-200 px-0.5 rounded text-[9px]">H</span>
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
                        className="px-1.5 py-1 hover:bg-gray-200 rounded text-[10px] text-gray-600 cursor-pointer font-semibold flex items-center gap-0.5"
                        title="Insert Image"
                    >
                        🖼 Image
                    </button>
                    {showImageMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-64 p-3" onClick={e => e.stopPropagation()}>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Insert Image</p>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    placeholder="Paste image URL..."
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-violet-400"
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
                                    <div className="text-center text-[10px] text-gray-400 font-bold my-1">— OR —</div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-xs text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors cursor-pointer font-medium"
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
                        className="px-1.5 py-1 hover:bg-gray-200 rounded text-[10px] text-gray-600 cursor-pointer font-semibold flex items-center gap-0.5"
                        title="Insert Table"
                    >
                        ▦ Table
                    </button>
                    {showTableMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-48 p-3" onClick={e => e.stopPropagation()}>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Insert Table</p>
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
                                                    : 'bg-gray-100 border-gray-200 hover:bg-violet-100'
                                            }`}
                                        />
                                    ))
                                )}
                            </div>
                            <p className="text-[10px] text-center text-gray-500 font-medium">
                                {hoveredCell ? `${hoveredCell.r + 1} × ${hoveredCell.c + 1}` : 'Select size'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Callout */}
                <div className="relative group/callout">
                    <button
                        type="button"
                        className="px-1.5 py-1 hover:bg-gray-200 rounded text-[10px] text-gray-600 cursor-pointer font-semibold"
                        title="Insert Callout"
                    >
                        📌
                    </button>
                    <div className="hidden group-hover/callout:block absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[110px]">
                        <button type="button" onClick={() => insertCallout('info')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-blue-700 cursor-pointer">ℹ️ Info</button>
                        <button type="button" onClick={() => insertCallout('warning')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-50 text-amber-700 cursor-pointer">⚠️ Warning</button>
                        <button type="button" onClick={() => insertCallout('success')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 text-emerald-700 cursor-pointer">✅ Success</button>
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
                    className="p-1 hover:bg-gray-200 rounded text-[10px] text-gray-400 cursor-pointer font-semibold"
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
                className="p-4 min-h-[150px] max-h-[400px] overflow-y-auto text-sm text-gray-900 outline-none bg-white whitespace-normal prose prose-sm max-w-none"
                data-placeholder={placeholder}
                style={{
                    lineHeight: '1.7'
                }}
            />
        </div>
    );
};

const AdminCourses: React.FC = () => {
    const { courses, loading, addCourse, updateCourse, deleteCourse } = useAdmin(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    
    // Wizard State
    const [step, setStep] = useState(1);
    const [newCourse, setNewCourse] = useState<Partial<Course>>({
        title: '', instructor: '', instructorEmail: '', instructorAvatar: '', duration: '', category: '', accessTier: 'FREE', image: '', sections: [], description: '', outcomes: []
    });

    const handleNext = () => setStep(s => Math.min(s + 1, 4));
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
        try {
            const courseData = {
                ...newCourse,
                isDraft: !publish
            };
            if (isEditMode && editingCourseId) {
                await updateCourse(editingCourseId, courseData);
                alert(publish ? 'Course updated successfully!' : 'Draft changes saved successfully!');
            } else {
                await addCourse(courseData);
                alert(publish ? 'Course created successfully!' : 'Draft course saved successfully!');
            }
            setIsWizardOpen(false);
            setIsEditMode(false);
            setEditingCourseId(null);
            setStep(1);
            setNewCourse({ title: '', instructor: '', instructorEmail: '', instructorAvatar: '', duration: '', category: '', accessTier: 'FREE', image: '', sections: [], description: '', outcomes: [] });
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
                    onClick={() => setIsWizardOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={18} /> New Course Wizard
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(c => (
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
                            <div className="absolute top-3 right-3 flex gap-2">
                                {c.isDraft && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-gray-150 text-gray-700">
                                        DRAFT
                                    </span>
                                )}
                                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${c.accessTier === 'PAID' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {c.accessTier || 'FREE'}
                                </span>
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{c.title}</h3>
                            <p className="text-sm text-gray-500 mb-4">{c.category} • {c.instructor}</p>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-gray-700">{c.duration}</span>
                                <div className="flex items-center gap-3">
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
                                        className="text-red-500 font-medium hover:text-red-700 cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Course Setup Wizard Modal */}
            {isWizardOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Course Settings' : 'Course Setup Wizard'}</h2>
                            <button 
                                onClick={() => {
                                    setIsWizardOpen(false);
                                    setIsEditMode(false);
                                    setEditingCourseId(null);
                                    setStep(1);
                                    setNewCourse({ title: '', instructor: '', instructorEmail: '', instructorAvatar: '', duration: '', category: '', accessTier: 'FREE', image: '', sections: [], description: '', outcomes: [] });
                                }} 
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-gray-100 h-1 w-full">
                            <div className="h-full bg-violet-600 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1">
                            {step === 1 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
                                    <h3 className="text-lg font-semibold border-b pb-2">Step 1: Basic Information</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                                        <input value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" placeholder="e.g. Advanced AI Integration" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name</label>
                                            <input value={newCourse.instructor} onChange={e => setNewCourse({...newCourse, instructor: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" placeholder="e.g. John Doe" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Email</label>
                                            <input value={newCourse.instructorEmail || ''} onChange={e => setNewCourse({...newCourse, instructorEmail: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" placeholder="e.g. j.doe@schoolofai.edu" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Avatar</label>
                                        <div className="flex gap-4 items-center">
                                            <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {newCourse.instructorAvatar ? (
                                                    (newCourse.instructorAvatar.startsWith('http') || newCourse.instructorAvatar.startsWith('data:image')) ? (
                                                        <img src={newCourse.instructorAvatar} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-2xl">{newCourse.instructorAvatar}</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-400 text-xs">No Image</span>
                                                )}
                                            </div>
                                            <div className="flex-1 flex gap-2">
                                                <input 
                                                    value={newCourse.instructorAvatar || ''} 
                                                    onChange={e => setNewCourse({...newCourse, instructorAvatar: e.target.value})} 
                                                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm" 
                                                    placeholder="Paste Image URL, Emoji (e.g. 👨‍🏫), or upload a file" 
                                                />
                                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs px-4 py-2.5 rounded-xl font-bold flex items-center shrink-0 transition-colors">
                                                    <span>Upload File</span>
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
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">About the Course</label>
                                        <textarea value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none h-24" placeholder="Enter a comprehensive course description..." />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
                                    <h3 className="text-lg font-semibold border-b pb-2">Step 2: Details & Categorization</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                            <input value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" placeholder="e.g. Technology" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Duration</label>
                                            <input value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" placeholder="e.g. 12h 30m" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                        <div className="flex gap-4 items-start">
                                            <div className="flex flex-col gap-2 items-center">
                                                <div className="w-20 h-20 rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex-shrink-0 relative">
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
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                                                    )}
                                                </div>
                                                {newCourse.image && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setIsAdjustModalOpen(true)}
                                                        className="text-[11px] font-semibold text-violet-600 hover:text-violet-850 underline cursor-pointer font-sans"
                                                    >
                                                        Adjust Cover Image
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input value={newCourse.image?.startsWith('data:') ? '' : newCourse.image} onChange={e => setNewCourse({...newCourse, image: e.target.value, imageScale: 1, imagePositionX: 50, imagePositionY: 50})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all mb-2 text-sm text-gray-900 dark:text-white" placeholder="Paste URL or upload image..." />
                                                <label className="cursor-pointer bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-750 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm px-4 py-2 rounded-xl font-medium flex items-center justify-center w-full transition-colors">
                                                    <span>Browse Image File...</span>
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
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">What You'll Achieve (One per line)</label>
                                        <textarea value={newCourse.outcomes?.join('\n') || ''} onChange={e => setNewCourse({...newCourse, outcomes: e.target.value.split('\n')})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none h-24" placeholder="Master foundational concepts...&#10;Build real-world projects...&#10;Earn a certificate..." />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
                                    <h3 className="text-lg font-semibold border-b pb-2 text-gray-900 dark:text-slate-100">Step 3: Access & Pricing</h3>
                                    <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-violet-800 dark:text-violet-300">Choose who can access this course. Free courses are available to everyone, while Paid courses require a Premium subscription.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Access Tier</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                onClick={() => setNewCourse({...newCourse, accessTier: 'FREE'})}
                                                className={`p-4 border-2 rounded-xl text-left transition-all ${
                                                    newCourse.accessTier === 'FREE' 
                                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-200 dark:ring-violet-900/40 text-violet-900 dark:text-violet-200' 
                                                        : 'border-gray-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-750 bg-transparent text-gray-900 dark:text-slate-200'
                                                }`}
                                            >
                                                <div className={`font-bold mb-1 ${newCourse.accessTier === 'FREE' ? 'text-violet-900 dark:text-violet-200' : 'text-gray-900 dark:text-slate-200'}`}>Free Tier</div>
                                                <div className={`text-xs ${newCourse.accessTier === 'FREE' ? 'text-violet-700 dark:text-violet-300' : 'text-gray-500 dark:text-slate-400'}`}>Accessible to all registered users</div>
                                            </button>
                                            <button 
                                                onClick={() => setNewCourse({...newCourse, accessTier: 'PAID'})}
                                                className={`p-4 border-2 rounded-xl text-left transition-all ${
                                                    newCourse.accessTier === 'PAID' 
                                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-200 dark:ring-violet-900/40 text-violet-900 dark:text-violet-200' 
                                                        : 'border-gray-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-750 bg-transparent text-gray-900 dark:text-slate-200'
                                                }`}
                                            >
                                                <div className={`font-bold mb-1 ${newCourse.accessTier === 'PAID' ? 'text-violet-900 dark:text-violet-200' : 'text-gray-900 dark:text-slate-200'}`}>Premium Tier</div>
                                                <div className={`text-xs ${newCourse.accessTier === 'PAID' ? 'text-violet-700 dark:text-violet-300' : 'text-gray-500 dark:text-slate-400'}`}>Requires Premium subscription</div>
                                            </button>
                                        </div>
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
                                    
                                    {(!newCourse.sections || newCourse.sections.length === 0) && (
                                        <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
                                            Your curriculum is empty. Click "Add Module" to get started.
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {newCourse.sections?.map((section, sIdx) => (
                                            <div key={section.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <GripVertical className="text-gray-400 cursor-move" size={20} />
                                                        <input 
                                                            value={section.title}
                                                            onChange={e => updateSectionTitle(section.id, e.target.value)}
                                                            className="bg-transparent font-bold text-gray-900 outline-none focus:border-b-2 focus:border-violet-500 py-1"
                                                            placeholder="e.g. Module 1: Introduction"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => addLesson(section.id, 'video')} className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1"><Video size={12} /> Add Video</button>
                                                        <button onClick={() => addLesson(section.id, 'audio')} className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded hover:bg-amber-100 flex items-center gap-1"><Headphones size={12} /> Add Audio</button>
                                                        <button onClick={() => addLesson(section.id, 'article')} className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 flex items-center gap-1"><FileText size={12} /> Add Reading</button>
                                                        <button onClick={() => addLesson(section.id, 'document')} className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1"><File size={12} /> Add Document</button>
                                                        <button onClick={() => addLesson(section.id, 'quiz')} className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 flex items-center gap-1"><HelpCircle size={12} /> Add Quiz</button>
                                                        <button onClick={() => removeSection(section.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>

                                                <div className="p-4 space-y-3">
                                                    {section.lessons.length === 0 && (
                                                        <p className="text-sm text-gray-400 text-center py-4">No lessons in this module yet.</p>
                                                    )}
                                                    {section.lessons.map((lesson, lIdx) => (
                                                        <div key={lesson.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col gap-3 group">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <div className={`p-2 rounded-lg ${
                                                                        lesson.type === 'video' ? 'bg-blue-50 text-blue-600' : 
                                                                        lesson.type === 'audio' ? 'bg-amber-50 text-amber-600' : 
                                                                        lesson.type === 'document' ? 'bg-indigo-50 text-indigo-600' : 
                                                                        lesson.type === 'quiz' ? 'bg-purple-50 text-purple-600' :
                                                                        'bg-emerald-50 text-emerald-600'}`}>
                                                                        {lesson.type === 'video' ? <Video size={18} /> : 
                                                                         lesson.type === 'audio' ? <Headphones size={18} /> : 
                                                                         lesson.type === 'document' ? <File size={18} /> : 
                                                                         lesson.type === 'quiz' ? <HelpCircle size={18} /> :
                                                                         <FileText size={18} />}
                                                                    </div>
                                                                    <input 
                                                                        value={lesson.title}
                                                                        onChange={e => updateLesson(section.id, lesson.id, { title: e.target.value })}
                                                                        className="font-medium text-gray-800 flex-1 outline-none border-b border-transparent focus:border-gray-300"
                                                                        placeholder="Lesson Title"
                                                                    />
                                                                </div>
                                                                <button onClick={() => removeLesson(section.id, lesson.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                            
                                                            <div className="pl-12 flex gap-4">
                                                                <input 
                                                                    value={lesson.duration}
                                                                    onChange={e => updateLesson(section.id, lesson.id, { duration: e.target.value })}
                                                                    className="text-xs border border-gray-200 rounded p-1.5 w-24 outline-none focus:border-violet-400"
                                                                    placeholder="e.g. 10m"
                                                                />
                                                                
                                                                {lesson.type === 'video' && (
                                                                    <div className="flex-1 flex gap-2">
                                                                        {/* Simple file input mock or URL input for MP4 */}
                                                                        <input 
                                                                            type="text"
                                                                            value={lesson.videoUrl || ''}
                                                                            onChange={e => updateLesson(section.id, lesson.id, { videoUrl: e.target.value })}
                                                                            className="flex-1 text-sm border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400"
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
                                                                                        updateLesson(section.id, lesson.id, { videoUrl: url });
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </label>
                                                                    </div>
                                                                )}
                                                                
                                                                {lesson.type === 'audio' && (
                                                                    <div className="flex-1 flex flex-col gap-1">
                                                                        <div className="flex gap-2">
                                                                            <input 
                                                                                type="text"
                                                                                value={lesson.audioUrl || ''}
                                                                                onChange={e => updateLesson(section.id, lesson.id, { audioUrl: e.target.value })}
                                                                                className="flex-1 text-sm border border-gray-200 rounded p-1.5 outline-none focus:border-amber-400"
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
                                                                            <span className="text-[10px] text-gray-500 font-medium">Uploaded file: {lesson.fileName}</span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {lesson.type === 'document' && (
                                                                    <div className="flex-1 flex flex-col gap-2">
                                                                        <div className="flex gap-2">
                                                                            <input 
                                                                                type="text"
                                                                                value={lesson.fileUrl || ''}
                                                                                onChange={e => updateLesson(section.id, lesson.id, { fileUrl: e.target.value })}
                                                                                className="flex-1 text-sm border border-gray-200 rounded p-1.5 outline-none focus:border-indigo-400"
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
                                                                            <span className="text-[10px] text-gray-500 font-medium">Uploaded file: {lesson.fileName}</span>
                                                                        )}
                                                                        <RichTextEditor 
                                                                            value={lesson.content || ''}
                                                                            onChange={val => updateLesson(section.id, lesson.id, { content: val })}
                                                                            accentColorClass="border-gray-200 focus-within:border-indigo-400"
                                                                            placeholder="Type document summary, reading notes, or content here..."
                                                                        />
                                                                    </div>
                                                                )}

                                                                {lesson.type === 'article' && (
                                                                    <div className="flex-1">
                                                                        <RichTextEditor 
                                                                            value={lesson.content || ''}
                                                                            onChange={val => updateLesson(section.id, lesson.id, { content: val })}
                                                                            accentColorClass="border-gray-200 focus-within:border-emerald-400"
                                                                            placeholder="Type your reading notes or article content here..."
                                                                        />
                                                                    </div>
                                                                )}

                                                                {lesson.type === 'quiz' && (
                                                                    <div className="flex-1 space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-150">
                                                                        <div className="flex items-center gap-4 justify-between">
                                                                            <span className="text-xs font-bold text-gray-700">Quiz Settings</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <label className="text-xs text-gray-500 font-semibold">Timer (minutes):</label>
                                                                                <input 
                                                                                    type="number"
                                                                                    value={lesson.quizTimer || 5}
                                                                                    onChange={e => updateLesson(section.id, lesson.id, { quizTimer: Math.max(1, parseInt(e.target.value) || 5) })}
                                                                                    className="text-xs border border-gray-250 rounded p-1.5 w-16 outline-none focus:border-purple-400 bg-white font-bold"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {(lesson.quizQuestions || []).map((q: any, qIdx: number) => (
                                                                                <div key={q.id || qIdx} className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm space-y-3 relative group/q">
                                                                                    <div className="flex justify-between items-start gap-4">
                                                                                        <span className="text-xs font-bold text-purple-700 font-mono">Question {qIdx + 1}</span>
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
                                                                                        className="w-full text-xs font-medium border-b border-gray-100 focus:border-purple-400 pb-1 outline-none"
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
                                                                                                        className={`text-xs border rounded p-1 flex-1 outline-none ${isCorrect ? 'border-purple-305 bg-purple-50/10 font-medium' : 'border-gray-100 focus:border-gray-300'}`}
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
                                                                            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 mt-2 cursor-pointer"
                                                                        >
                                                                            + Add Objective Question
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between">
                            <button 
                                onClick={handlePrev}
                                disabled={step === 1}
                                className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                            
                            {step < 4 ? (
                                <button 
                                    onClick={handleNext}
                                    className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-violet-700 shadow-md shadow-violet-200 transition-colors"
                                >
                                    Next Step <ArrowRight size={18} />
                                </button>
                            ) : (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleSave(false)}
                                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <Save size={18} /> Save as Draft
                                    </button>
                                    <button 
                                        onClick={() => handleSave(true)}
                                        className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-green-700 shadow-md shadow-green-200 transition-colors cursor-pointer"
                                    >
                                        <Save size={18} /> Finish & Publish
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                            <div className="h-40 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-750 bg-gray-100 relative">
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
        </div>
    );
};

export default AdminCourses;
