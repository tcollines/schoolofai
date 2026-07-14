import React, { useState, useEffect } from 'react';
import CourseCard from './CourseCard';
import { Course, CourseStatus, CourseModule, CourseSection } from '../types';
import { Search, Filter, Clock, ArrowLeft, PlayCircle, Youtube, BookOpen, FileText, ChevronDown, Headphones, File, LayoutGrid, LayoutList, Lock, HelpCircle } from 'lucide-react';
import CoursePlayer from './CoursePlayer';
import ExamPlayer from './ExamPlayer';
import RatingModal from './RatingModal';
import { Star } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { useTranslation } from './translations';

interface MyCoursesProps {
    courses: Course[];
}

const MyCourses: React.FC<MyCoursesProps> = ({ courses }) => {
    const { t } = useTranslation();

    const addPortalNotification = (title: string, description: string, type: 'assignment' | 'profile' | 'course' | 'system') => {
        const stored = localStorage.getItem('portal-notifications');
        const list = stored ? JSON.parse(stored) : [];
        const newItem = {
            id: Date.now().toString(),
            title,
            description,
            timestamp: new Date().toISOString(),
            read: false,
            type
        };
        localStorage.setItem('portal-notifications', JSON.stringify([newItem, ...list]));
        window.dispatchEvent(new Event('notifications-update'));
    };

    const [filter, setFilter] = useState('ALL'); // ALL, IN_PROGRESS, COMPLETED
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
    const [takingExam, setTakingExam] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [hasRated, setHasRated] = useState(false);
    const [localCourses, setLocalCourses] = useState<Course[]>(courses);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [lessonsViewMode, setLessonsViewMode] = useState<Record<string, 'list' | 'grid'>>({});
    const [reviewsVersion, setReviewsVersion] = useState(0);

    const getReviews = (courseId: string) => {
        const stored = localStorage.getItem(`course-reviews-${courseId}`);
        if (stored) {
            return JSON.parse(stored);
        }
        
        const defaults = [
            {
                id: 'default-rev-1',
                userName: 'Sarah Jenkins',
                userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
                avatarScale: 1,
                avatarPositionX: 0,
                avatarPositionY: 0,
                rating: 5,
                comment: 'Absolutely brilliant course! The concepts are explained with great clarity, and the module structure is incredibly easy to follow. Highly recommended!',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString()
            },
            {
                id: 'default-rev-2',
                userName: 'Alex Rivera',
                userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
                avatarScale: 1.1,
                avatarPositionX: -5,
                avatarPositionY: 10,
                rating: 4,
                comment: 'Very practical and hands-on. The syllabus covers exactly what is needed for industry application. Loved the final case study project.',
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString()
            }
        ];
        
        localStorage.setItem(`course-reviews-${courseId}`, JSON.stringify(defaults));
        return defaults;
    };

    // Sync localCourses with props changes
    useEffect(() => {
        setLocalCourses(courses);
    }, [courses]);

    useEffect(() => {
        const handleReviewsUpdate = () => {
            setReviewsVersion(prev => prev + 1);
        };
        window.addEventListener('course-reviews-update', handleReviewsUpdate);
        return () => {
            window.removeEventListener('course-reviews-update', handleReviewsUpdate);
        };
    }, []);

    // Only show enrolled courses for "My Learning"
    const myCourses = localCourses.filter(c => c.status === CourseStatus.IN_PROGRESS || c.status === CourseStatus.COMPLETED);

    const filteredCourses = myCourses.filter(course => {
        if (filter === 'ALL') return true;
        if (filter === 'IN_PROGRESS') return course.status === CourseStatus.IN_PROGRESS;
        if (filter === 'COMPLETED') return course.status === CourseStatus.COMPLETED;
        return true;
    });

    // Calculate stats
    const inProgressCount = myCourses.filter(c => c.status === CourseStatus.IN_PROGRESS).length;
    const completedCount = myCourses.filter(c => c.status === CourseStatus.COMPLETED).length;

    // Calculate approx learning time
    const totalDurationMinutes = myCourses.reduce((acc, curr) => {
        const hours = parseInt(curr.duration) || 0;
        return acc + (hours * 60);
    }, 0);
    const totalHours = Math.floor(totalDurationMinutes / 60);
    const totalMinutes = totalDurationMinutes % 60;
    const formattedDuration = `${totalHours}h ${totalMinutes}m`;

    const getModuleIndex = () => {
        if (!activeModule || !selectedCourse) return -1;
        let allModules: CourseModule[] = [];
        if (selectedCourse.sections && selectedCourse.sections.length > 0) {
            selectedCourse.sections.forEach(s => {
                allModules.push(...s.lessons);
            });
        } else if (selectedCourse.modules) {
            allModules = selectedCourse.modules;
        }
        return allModules.findIndex(m => m.id === activeModule.id);
    };

    const getAllModules = () => {
        if (!selectedCourse) return [];
        let allModules: CourseModule[] = [];
        if (selectedCourse.sections && selectedCourse.sections.length > 0) {
            selectedCourse.sections.forEach(s => {
                allModules.push(...s.lessons);
            });
        } else if (selectedCourse.modules) {
            allModules = selectedCourse.modules;
        }
        return allModules;
    };
    const isSectionLocked = (sectionId: string) => {
        if (!selectedCourse || !selectedCourse.sections) return false;
        const sectionIndex = selectedCourse.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex <= 0) return false;

        // Get previous section
        const prevSection = selectedCourse.sections[sectionIndex - 1];
        // Find if previous section has a quiz at the end
        const prevSectionQuiz = prevSection.lessons.find(l => l.type === 'quiz');
        if (!prevSectionQuiz) return false;

        // Find quiz index in all modules list
        const allModules = getAllModules();
        const quizIndex = allModules.findIndex(m => m.id === prevSectionQuiz.id);
        if (quizIndex === -1) return false;

        // If completedCount is less than or equal to quizIndex, it is locked!
        return selectedCourse.lessonsCompleted <= quizIndex;
    };

    const handleNextModule = async () => {
        const allModules = getAllModules();
        const currentIndex = getModuleIndex();

        // Update progress if the lesson completed is newer than current progress
        if (currentIndex !== -1 && selectedCourse) {
            const completedCount = currentIndex + 1;
            if (completedCount > selectedCourse.lessonsCompleted) {
                const hasExam = !!selectedCourse.quiz;
                const newStatus = (completedCount >= selectedCourse.lessonsTotal && !hasExam) 
                    ? CourseStatus.COMPLETED 
                    : CourseStatus.IN_PROGRESS;
                
                // Update local states immediately
                const updatedCourse = {
                    ...selectedCourse,
                    lessonsCompleted: completedCount,
                    status: newStatus
                };
                setSelectedCourse(updatedCourse);
                setLocalCourses(prev => prev.map(c => c.id === selectedCourse.id ? updatedCourse : c));

                // Persist in background Supabase
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase
                            .from('enrollments')
                            .update({ 
                                progress: completedCount,
                                status: newStatus
                            })
                            .eq('user_id', user.id)
                            .eq('course_id', selectedCourse.id);
                    }
                } catch (err) {
                    console.error("Error updating progress in Supabase:", err);
                }
            }
        }

        if (currentIndex !== -1 && currentIndex < allModules.length - 1) {
            setActiveModule(allModules[currentIndex + 1]);
        } else {
            setActiveModule(null); // Finish
        }
    };

    const hasNextModule = () => {
        const allModules = getAllModules();
        const currentIndex = getModuleIndex();
        return currentIndex !== -1 && currentIndex < allModules.length - 1;
    };

    if (activeModule && selectedCourse) {
        return (
            <CoursePlayer
                module={activeModule}
                courseTitle={selectedCourse.title}
                onBack={() => setActiveModule(null)}
                onNext={handleNextModule}
                hasNext={hasNextModule()}
            />
        );
    }

    if (takingExam && selectedCourse && selectedCourse.quiz) {
        return (
            <ExamPlayer 
                quiz={selectedCourse.quiz}
                courseTitle={selectedCourse.title}
                onClose={() => setTakingExam(false)}
                onSubmit={async (score) => {
                    alert(`Exam submitted! You scored ${score}%`);
                    setTakingExam(false);
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.user?.id && selectedCourse) {
                            const { error } = await supabase
                                .from('enrollments')
                                .update({ 
                                    exam_completed: true,
                                    exam_score: score,
                                    status: CourseStatus.COMPLETED
                                })
                                .eq('user_id', session.user.id)
                                .eq('course_id', selectedCourse.id);
                            
                            if (error) throw error;

                            const updatedCourse = {
                                ...selectedCourse,
                                examCompleted: true,
                                examScore: score,
                                status: CourseStatus.COMPLETED
                            };
                            setSelectedCourse(updatedCourse);
                            setLocalCourses(prev => prev.map(c => c.id === selectedCourse.id ? updatedCourse : c));
                            
                            addPortalNotification(
                                "Exam Completed Successfully",
                                `You have finished the final exam for ${selectedCourse.title} with a score of ${score}%. The admin team will verify and issue your certificate soon.`,
                                "course"
                            );

                            window.dispatchEvent(new Event('profile-update'));
                        }
                    } catch (err) {
                        console.error("Error updating exam score:", err);
                    }
                }}
            />
        );
    }

    if (selectedCourse) {
        return (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <button
                    onClick={() => setSelectedCourse(null)}
                    className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} /> {t('back_to_profile')}
                </button>
                <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 md:flex mb-8">
                    <div className="md:w-1/3 min-h-[250px] relative bg-gray-900 overflow-hidden">
                        <img
                            src={selectedCourse.image}
                            alt={selectedCourse.title}
                            className="w-full h-full object-cover opacity-80"
                            style={{
                                objectPosition: `${selectedCourse.imagePositionX ?? 50}% ${selectedCourse.imagePositionY ?? 50}%`,
                                transform: `scale(${selectedCourse.imageScale ?? 1})`,
                                transformOrigin: `${selectedCourse.imagePositionX ?? 50}% ${selectedCourse.imagePositionY ?? 50}%`
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                            <div className="text-white">
                                <span className="text-xs font-bold bg-welile-purple px-2 py-1 rounded-md mb-2 inline-block">MY COURSE</span>
                                <h3 className="text-2xl font-bold mb-1">{selectedCourse.title}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden flex items-center justify-center bg-white/10 shrink-0">
                                        {selectedCourse.instructorAvatar ? (
                                            (selectedCourse.instructorAvatar.startsWith('http') || selectedCourse.instructorAvatar.startsWith('data:image')) ? (
                                                <img src={selectedCourse.instructorAvatar} alt={selectedCourse.instructor} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm">{selectedCourse.instructorAvatar}</span>
                                            )
                                        ) : (
                                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedCourse.instructor}`} alt={selectedCourse.instructor} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold leading-none">{selectedCourse.instructor}</p>
                                        <p className="text-[11px] opacity-80 mt-1 truncate">
                                            <a href={`mailto:${selectedCourse.instructorEmail || `${selectedCourse.instructor.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '.')}@schoolofai.edu`}`} className="hover:underline text-white">
                                                {selectedCourse.instructorEmail || `${selectedCourse.instructor.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '.')}@schoolofai.edu`}
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 md:p-8 md:w-2/3 flex flex-col">
                        <div className="flex flex-wrap items-center gap-6 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                                <BookOpen size={18} className="text-welile-purple" />
                                <span className="font-medium">{selectedCourse.lessonsTotal} {t('lessons')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                                <Clock size={18} className="text-welile-purple" />
                                <span className="font-medium">{selectedCourse.duration}</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="font-medium text-gray-600 dark:text-slate-350">
                                    {selectedCourse.lessonsCompleted} / {selectedCourse.lessonsTotal} Completed
                                </span>
                                <span className="font-bold text-welile-purple">
                                    {Math.round(
                                        (selectedCourse.lessonsTotal > 0 ? (selectedCourse.lessonsCompleted / selectedCourse.lessonsTotal) * 60 : 0) +
                                        (selectedCourse.examCompleted ? 40 : 0)
                                    )}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-welile-purple transition-all duration-1000"
                                    style={{ 
                                        width: `${Math.round(
                                            (selectedCourse.lessonsTotal > 0 ? (selectedCourse.lessonsCompleted / selectedCourse.lessonsTotal) * 60 : 0) +
                                            (selectedCourse.examCompleted ? 40 : 0)
                                        )}%` 
                                    }}
                                ></div>
                            </div>
                        </div>

                        {selectedCourse.quiz && (selectedCourse.status === CourseStatus.COMPLETED || (selectedCourse.lessonsTotal > 0 && selectedCourse.lessonsCompleted >= selectedCourse.lessonsTotal)) && (
                            <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-200">Final Exam Available</h4>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300">Test your knowledge to earn your certificate.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        addPortalNotification(
                                            `Started Final Exam: ${selectedCourse.title}`,
                                            "You have successfully initiated the exam room environment. Avoid minimizing the window or switching tabs.",
                                            "course"
                                        );
                                        setTakingExam(true);
                                    }}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700"
                                >
                                    {t('start_exam')}
                                </button>
                            </div>
                        )}

                        {/* Rating Prompt - Show if completed or near completion */}
                        {((selectedCourse.status === CourseStatus.COMPLETED) || (selectedCourse.lessonsTotal > 0 && selectedCourse.lessonsCompleted >= selectedCourse.lessonsTotal)) && !hasRated && (
                            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/50 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-yellow-900 dark:text-yellow-200 flex items-center gap-2">
                                        <Star size={18} className="text-yellow-500 fill-yellow-500" />
                                        Rate this Course
                                    </h4>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Share your experience to help other students.</p>
                                </div>
                                <button 
                                    onClick={() => setIsRatingModalOpen(true)}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-600 shadow-sm"
                                >
                                    Leave Review
                                </button>
                            </div>
                        )}
                        {hasRated && (
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-green-900 dark:text-green-200 flex items-center gap-2">
                                        <Star size={18} className="text-green-500 fill-green-500" />
                                        Thank you for your review!
                                    </h4>
                                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">Your feedback helps us improve.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 max-w-3xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Course Content</h3>
                        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200/50 dark:border-slate-700">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    viewMode === 'list'
                                        ? 'bg-white dark:bg-slate-900 text-welile-purple dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-950 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                                title="List View"
                            >
                                <LayoutList size={14} /> List
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-900 text-welile-purple dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-950 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                                title="Grid View"
                            >
                                <LayoutGrid size={14} /> Grid
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
                            viewMode === 'list' ? (
                                <div className="grid gap-4">
                                    {selectedCourse.sections.map((section: CourseSection) => {
                                        const isLocked = isSectionLocked(section.id);
                                        return (
                                            <div key={section.id} className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-205 dark:border-slate-800 overflow-hidden shadow-sm ${isLocked ? 'opacity-60' : ''}`}>
                                                <div 
                                                    onClick={() => {
                                                        if (isLocked) {
                                                            alert("Please complete the quiz at the end of the previous module to unlock this section.");
                                                            return;
                                                        }
                                                        setExpandedSections(prev => ({...prev, [section.id]: !prev[section.id]}))
                                                    }}
                                                    className="w-full bg-gray-55 dark:bg-slate-800/50 p-4 border-b border-gray-205 dark:border-slate-800 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-slate-805 transition-colors cursor-pointer"
                                                >
                                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        {isLocked && <Lock size={15} className="text-gray-400 dark:text-slate-500" />}
                                                        {section.title}
                                                    </h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 px-2 py-1 rounded border border-gray-205 dark:border-slate-800">{section.lessons.length} Lessons</span>
                                                        
                                                        {!isLocked && (
                                                            /* Small List/Grid Toggle inside module */
                                                            <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200/50 dark:border-slate-700 items-center">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setLessonsViewMode(prev => ({...prev, [section.id]: 'list'}));
                                                                    }}
                                                                    className={`p-1 rounded-md text-[10px] transition-all cursor-pointer ${
                                                                        (lessonsViewMode[section.id] || 'list') === 'list'
                                                                            ? 'bg-white dark:bg-slate-900 text-welile-purple dark:text-white shadow-sm'
                                                                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
                                                                    }`}
                                                                    title="List Lessons"
                                                                >
                                                                    <LayoutList size={11} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setLessonsViewMode(prev => ({...prev, [section.id]: 'grid'}));
                                                                    }}
                                                                    className={`p-1 rounded-md text-[10px] transition-all cursor-pointer ${
                                                                        (lessonsViewMode[section.id] || 'list') === 'grid'
                                                                            ? 'bg-white dark:bg-slate-900 text-welile-purple dark:text-white shadow-sm'
                                                                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
                                                                    }`}
                                                                    title="Grid Lessons"
                                                                >
                                                                    <LayoutGrid size={11} />
                                                                </button>
                                                            </div>
                                                        )}

                                                        <ChevronDown size={20} className={`text-gray-500 dark:text-slate-400 transition-transform ${expandedSections[section.id] ? 'rotate-180' : ''}`} />
                                                    </div>
                                                </div>
                                                
                                                {expandedSections[section.id] && !isLocked && (
                                                    (lessonsViewMode[section.id] || 'list') === 'list' ? (
                                                        <div className="p-4 space-y-3">
                                                            {section.lessons.length === 0 && (
                                                                <div className="text-center py-4 text-sm text-gray-400 dark:text-slate-500">No content available.</div>
                                                            )}
                                                            {section.lessons.map((lesson: CourseModule) => (
                                                                <div key={lesson.id} onClick={() => setActiveModule(lesson)} className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-800 hover:bg-violet-55 dark:hover:bg-violet-955 transition-colors cursor-pointer flex gap-4 items-start group">
                                                                     <div className={`p-3 rounded-xl shrink-0 ${
                                                                         lesson.type === 'video' ? 'bg-blue-105 dark:bg-blue-955/20 text-blue-600 dark:text-blue-450' : 
                                                                         lesson.type === 'audio' ? 'bg-amber-105 dark:bg-amber-955/20 text-amber-600 dark:text-amber-450' : 
                                                                         lesson.type === 'document' ? 'bg-indigo-105 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-455' : 
                                                                         lesson.type === 'quiz' ? 'bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400' :
                                                                         'bg-emerald-105 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-450'
                                                                     }`}>
                                                                         {lesson.type === 'video' ? <Youtube size={24} /> : 
                                                                          lesson.type === 'audio' ? <Headphones size={24} /> : 
                                                                          lesson.type === 'document' ? <File size={24} /> : 
                                                                          lesson.type === 'quiz' ? <HelpCircle size={24} /> :
                                                                          <FileText size={24} />}
                                                                     </div>
                                                                    <div className="flex-1">
                                                                        <h5 className="font-bold text-gray-905 dark:text-white group-hover:text-violet-900 dark:group-hover:text-violet-300 transition-colors flex items-center gap-2">
                                                                            {lesson.title}
                                                                            {lesson.type === 'quiz' && <span className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Quiz</span>}
                                                                        </h5>
                                                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-slate-400 mt-2">
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock size={12} /> <span>{lesson.duration}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-violet-600 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                                                                        <PlayCircle size={20} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                            {section.lessons.length === 0 && (
                                                                <div className="text-center py-4 text-sm text-gray-400 dark:text-slate-500 col-span-full">No content available.</div>
                                                            )}
                                                            {section.lessons.map((lesson: CourseModule) => (
                                                                <div key={lesson.id} onClick={() => setActiveModule(lesson)} className="p-4 rounded-xl border border-gray-150 dark:border-slate-800 hover:border-violet-350 dark:hover:border-violet-850 hover:bg-violet-55 dark:hover:bg-violet-955 transition-colors cursor-pointer flex flex-col justify-between group">
                                                                    <div>
                                                                        <div className="flex justify-between items-start mb-3">
                                                                            <div className={`p-2 rounded-lg ${
                                                                                lesson.type === 'video' ? 'bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 
                                                                                lesson.type === 'audio' ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' : 
                                                                                lesson.type === 'document' ? 'bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 
                                                                                lesson.type === 'quiz' ? 'bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400' :
                                                                                'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                                                                            }`}>
                                                                                {lesson.type === 'video' ? <Youtube size={16} /> : 
                                                                                 lesson.type === 'audio' ? <Headphones size={16} /> : 
                                                                                 lesson.type === 'document' ? <File size={16} /> : 
                                                                                 lesson.type === 'quiz' ? <HelpCircle size={16} /> :
                                                                                 <FileText size={16} />}
                                                                            </div>
                                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-violet-600 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                                                                                <PlayCircle size={14} />
                                                                            </div>
                                                                        </div>
                                                                        <h5 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-violet-900 dark:group-hover:text-violet-300 transition-colors line-clamp-2">{lesson.title}</h5>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 mt-3 pt-2 border-t border-gray-55 dark:border-slate-800/60">
                                                                        <Clock size={10} /> <span>{lesson.duration}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {selectedCourse.sections.map((section: CourseSection) => {
                                        const isLocked = isSectionLocked(section.id);
                                        return (
                                            <div key={section.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                                                {isLocked && (
                                                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-[1.5px] flex flex-col items-center justify-center z-10 p-4 text-center">
                                                        <div className="bg-gray-105 dark:bg-slate-800 p-3 rounded-full mb-2">
                                                            <Lock size={20} className="text-gray-500 dark:text-slate-400" />
                                                        </div>
                                                        <h5 className="font-bold text-sm text-gray-950 dark:text-white">Module Locked</h5>
                                                        <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 max-w-[200px]">Complete the previous module's quiz to unlock</p>
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="flex justify-between items-center gap-4 mb-4 pb-3 border-b border-gray-50 dark:border-slate-800/80">
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">{section.title}</h4>
                                                        
                                                        {/* Small List/Grid Toggle inside grid module */}
                                                        {!isLocked && (
                                                            <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-205/50 dark:border-slate-700 items-center shrink-0">
                                                                <button
                                                                    onClick={() => setLessonsViewMode(prev => ({...prev, [section.id]: 'list'}))}
                                                                    className={`p-1 rounded-md text-[10px] transition-all cursor-pointer ${
                                                                        (lessonsViewMode[section.id] || 'list') === 'list'
                                                                            ? 'bg-white dark:bg-slate-900 text-welile-purple dark:text-white shadow-sm'
                                                                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
                                                                    }`}
                                                                    title="List Lessons"
                                                                >
                                                                    <LayoutList size={10} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setLessonsViewMode(prev => ({...prev, [section.id]: 'grid'}))}
                                                                    className={`p-1 rounded-md text-[10px] transition-all cursor-pointer ${
                                                                        (lessonsViewMode[section.id] || 'list') === 'grid'
                                                                            ? 'bg-white dark:bg-slate-900 text-welile-purple dark:text-white shadow-sm'
                                                                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
                                                                    }`}
                                                                    title="Grid Lessons"
                                                                >
                                                                    <LayoutGrid size={10} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className={((lessonsViewMode[section.id] || 'list') === 'grid') ? "grid grid-cols-2 gap-2 mt-2" : "space-y-1.5 mt-2"}>
                                                        {section.lessons.length === 0 ? (
                                                            <p className="text-xs text-gray-400 dark:text-slate-500 italic py-2 col-span-2">No content available.</p>
                                                        ) : (
                                                            section.lessons.map((lesson: CourseModule) => (
                                                                <button
                                                                    key={lesson.id}
                                                                    disabled={isLocked}
                                                                    onClick={() => setActiveModule(lesson)}
                                                                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl border border-gray-55 dark:border-slate-850 hover:bg-violet-55 dark:hover:bg-violet-955/20 text-left transition-colors cursor-pointer group ${
                                                                        ((lessonsViewMode[section.id] || 'list') === 'grid') ? "flex-col items-start" : ""
                                                                    }`}
                                                                >
                                                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                                                        lesson.type === 'video' ? 'bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 
                                                                        lesson.type === 'audio' ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' : 
                                                                        lesson.type === 'document' ? 'bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 
                                                                        lesson.type === 'quiz' ? 'bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400' :
                                                                        'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                                                                    }`}>
                                                                        {lesson.type === 'video' ? <Youtube size={14} /> : 
                                                                         lesson.type === 'audio' ? <Headphones size={14} /> : 
                                                                         lesson.type === 'document' ? <File size={14} /> : 
                                                                         lesson.type === 'quiz' ? <HelpCircle size={14} /> :
                                                                         <FileText size={14} />}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-xs font-semibold text-gray-700 dark:text-slate-305 truncate group-hover:text-violet-700 dark:group-hover:text-violet-400 leading-tight">{lesson.title}</p>
                                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{lesson.duration}</p>
                                                                    </div>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        ) : selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                            viewMode === 'list' ? (
                                <div className="grid gap-4">
                                    {selectedCourse.modules.map((module: any, idx: number) => (
                                        <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                            <div className="w-24 h-16 rounded-lg bg-gray-100 dark:bg-slate-800 shrink-0 overflow-hidden relative group cursor-pointer border border-gray-200 dark:border-slate-700" onClick={() => setActiveModule(module)}>
                                                {module.thumbnail ? (
                                                    <img src={module.thumbnail} alt={module.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
                                                        <Youtube size={20} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PlayCircle size={24} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1 truncate" title={module.title}>{module.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mb-1">
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {module.duration}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setActiveModule(module)}
                                                className="shrink-0 flex items-center gap-2 bg-welile-purple text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm cursor-pointer"
                                            >
                                                <PlayCircle size={16} /> Play
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {selectedCourse.modules.map((module: any, idx: number) => (
                                        <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                            <div className="h-32 bg-gray-100 dark:bg-slate-805 relative group cursor-pointer border-b border-gray-100 dark:border-slate-800/80" onClick={() => setActiveModule(module)}>
                                                {module.thumbnail ? (
                                                    <img src={module.thumbnail} alt={module.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
                                                        <Youtube size={24} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PlayCircle size={28} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
                                                <div className="mb-4">
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2" title={module.title}>{module.title}</h4>
                                                    <span className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1"><Clock size={10} /> {module.duration}</span>
                                                </div>
                                                <button
                                                    onClick={() => setActiveModule(module)}
                                                    className="w-full flex items-center justify-center gap-2 bg-welile-purple text-white py-2 rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm cursor-pointer"
                                                >
                                                    <PlayCircle size={14} /> Play
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>No detailed modules available for this course.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Student Reviews Section */}
                <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 md:p-8">
                    <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800/80 pb-6 mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Student Reviews & Feedback</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Read reviews from other students enrolled in this course.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{(selectedCourse.rating || 4.8).toFixed(1)}</span>
                            <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star 
                                        key={s} 
                                        size={16} 
                                        fill={s <= Math.round(selectedCourse.rating || 4.8) ? "currentColor" : "none"} 
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {getReviews(selectedCourse.id).length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-6">No reviews posted yet. Be the first to share your experience!</p>
                        ) : (
                            getReviews(selectedCourse.id).map((r: any) => (
                                <div key={r.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-850/40 border border-gray-100 dark:border-slate-800/60">
                                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100 dark:border-slate-800">
                                        <img 
                                            src={r.userAvatar} 
                                            alt={r.userName} 
                                            className="w-full h-full object-cover" 
                                            style={{
                                                transform: `scale(${r.avatarScale || 1}) translate(${r.avatarPositionX || 0}px, ${r.avatarPositionY || 0}px)`,
                                                transformOrigin: 'center'
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{r.userName}</h4>
                                            <span className="text-[10px] text-gray-400">{r.date}</span>
                                        </div>
                                        <div className="flex text-yellow-400 my-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star 
                                                    key={s} 
                                                    size={12} 
                                                    fill={s <= r.rating ? "currentColor" : "none"} 
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-slate-350 leading-relaxed mt-1">{r.comment}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {isRatingModalOpen && (
                    <RatingModal
                        courseTitle={selectedCourse.title}
                        onClose={() => setIsRatingModalOpen(false)}
                        onSubmit={async (rating, review) => {
                            try {
                                const { data: { session } } = await supabase.auth.getSession();
                                const userId = session?.user?.id || 'guest';
                                
                                let studentName = 'Student';
                                let studentAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
                                let avatarScale = 1;
                                let avatarPositionX = 0;
                                let avatarPositionY = 0;

                                const { data: profileData } = await supabase
                                    .from('profiles')
                                    .select('*')
                                    .eq('id', userId)
                                    .single();
                                
                                if (profileData) {
                                    studentName = profileData.name || studentName;
                                    studentAvatar = profileData.avatar_url || studentAvatar;
                                    avatarScale = profileData.avatar_scale || 1;
                                    avatarPositionX = profileData.avatar_position_x || 0;
                                    avatarPositionY = profileData.avatar_position_y || 0;
                                }

                                const newReview = {
                                    id: Date.now().toString(),
                                    userName: studentName,
                                    userAvatar: studentAvatar,
                                    avatarScale,
                                    avatarPositionX,
                                    avatarPositionY,
                                    rating,
                                    comment: review,
                                    date: new Date().toLocaleDateString()
                                };

                                const key = `course-reviews-${selectedCourse.id}`;
                                const existing = localStorage.getItem(key);
                                const list = existing ? JSON.parse(existing) : [];
                                
                                localStorage.setItem(key, JSON.stringify([newReview, ...list]));
                                setHasRated(true);
                                setIsRatingModalOpen(false);
                                window.dispatchEvent(new Event('course-reviews-update'));
                            } catch (err) {
                                console.error("Error submitting review:", err);
                            }
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header and Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('my_learning')}</h2>
                    <p className="text-gray-500 dark:text-slate-400">{t('ongoing_courses')}</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {['ALL', 'IN_PROGRESS', 'COMPLETED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${filter === tab
                                ? 'bg-welile-purple text-white shadow-md'
                                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {tab === 'ALL' ? t('all_courses') : tab === 'IN_PROGRESS' ? t('in_progress') : t('completed')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                        {myCourses.length}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Total Enrolled</p>
                        <p className="font-bold text-gray-900 dark:text-white">Courses</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/30 text-welile-purple dark:text-purple-400 flex items-center justify-center font-bold text-lg">
                        {inProgressCount}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Active Now</p>
                        <p className="font-bold text-gray-900 dark:text-white">In Progress</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-lg">
                        {completedCount}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Completed</p>
                        <p className="font-bold text-gray-900 dark:text-white">Certificates</p>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(course => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onClick={() => {
                                const scopeKey = localStorage.getItem('mock_logged_in_email') || 'guest';
                                localStorage.setItem(`recent-tapped-course-id-${scopeKey}`, course.id);
                                setSelectedCourse(course);
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-850">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-slate-500">
                        <Search size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">No courses found</h3>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Try changing the filter or explore new courses.</p>
                </div>
            )}
        </div>
    );
};

export default MyCourses;
