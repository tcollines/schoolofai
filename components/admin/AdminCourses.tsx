import React, { useState } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { Course, CourseSection, CourseModule, ModuleType } from '../../types';
import { Plus, X, ArrowRight, ArrowLeft, Save, Video, FileText, Trash2, GripVertical } from 'lucide-react';

const AdminCourses: React.FC = () => {
    const { courses, loading, addCourse, updateCourse, deleteCourse } = useAdmin(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    
    // Wizard State
    const [step, setStep] = useState(1);
    const [newCourse, setNewCourse] = useState<Partial<Course>>({
        title: '', instructor: '', duration: '', category: '', accessTier: 'FREE', image: '', sections: [], description: '', outcomes: []
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
            title: `New ${type === 'video' ? 'Video' : 'Reading'}`,
            description: '',
            type,
            duration: '10 mins',
            videoUrl: '',
            content: ''
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

    const handleSave = async () => {
        try {
            if (isEditMode && editingCourseId) {
                await updateCourse(editingCourseId, newCourse);
                alert('Course updated successfully!');
            } else {
                await addCourse(newCourse);
                alert('Course created successfully!');
            }
            setIsWizardOpen(false);
            setIsEditMode(false);
            setEditingCourseId(null);
            setStep(1);
            setNewCourse({ title: '', instructor: '', duration: '', category: '', accessTier: 'FREE', image: '', sections: [], description: '', outcomes: [] });
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
                    <div key={c.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
                            <div className="absolute top-3 right-3">
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
                                                sections: c.sections || c.modules || [],
                                                description: c.description || '',
                                                outcomes: c.outcomes || [],
                                                imageScale: c.imageScale || 1,
                                                imagePositionX: c.imagePositionX || 50,
                                                imagePositionY: c.imagePositionY || 50
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
                                    setNewCourse({ title: '', instructor: '', duration: '', category: '', accessTier: 'FREE', image: '', sections: [], description: '', outcomes: [] });
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name</label>
                                        <input value={newCourse.instructor} onChange={e => setNewCourse({...newCourse, instructor: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" placeholder="e.g. John Doe" />
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
                                                        <button onClick={() => addLesson(section.id, 'article')} className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 flex items-center gap-1"><FileText size={12} /> Add Reading</button>
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
                                                                    <div className={`p-2 rounded-lg ${lesson.type === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                        {lesson.type === 'video' ? <Video size={18} /> : <FileText size={18} />}
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
                                                                
                                                                {lesson.type === 'video' ? (
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
                                                                ) : (
                                                                    <div className="flex-1">
                                                                        <textarea 
                                                                            value={lesson.content || ''}
                                                                            onChange={e => updateLesson(section.id, lesson.id, { content: e.target.value })}
                                                                            className="w-full text-sm border border-gray-200 rounded p-2 outline-none focus:border-emerald-400 resize-none h-20"
                                                                            placeholder="Type your reading notes or article content here..."
                                                                        />
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
                                <button 
                                    onClick={handleSave}
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-green-700 shadow-md shadow-green-200 transition-colors"
                                >
                                    <Save size={18} /> Finish & Publish
                                </button>
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
                            <button onClick={() => setIsAdjustModalOpen(false)} className="text-gray-400 hover:text-gray-655 dark:hover:text-slate-350 p-1 cursor-pointer">
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
                                className="px-4 py-2 border border-gray-250 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-55 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
