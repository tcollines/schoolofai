import React, { useState, useEffect } from 'react';
import CourseCard from './CourseCard';
import { Course, CourseStatus, CourseModule, CourseSection } from '../types';
import { Search, Filter, Clock, ArrowLeft, PlayCircle, Youtube, BookOpen, FileText, ChevronDown } from 'lucide-react';
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
    const [filter, setFilter] = useState('ALL'); // ALL, IN_PROGRESS, COMPLETED
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
    const [takingExam, setTakingExam] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [hasRated, setHasRated] = useState(false);
    const [localCourses, setLocalCourses] = useState<Course[]>(courses);

    // Sync localCourses with props changes
    useEffect(() => {
        setLocalCourses(courses);
    }, [courses]);

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

    const handleNextModule = async () => {
        const allModules = getAllModules();
        const currentIndex = getModuleIndex();

        // Update progress if the lesson completed is newer than current progress
        if (currentIndex !== -1 && selectedCourse) {
            const completedCount = currentIndex + 1;
            if (completedCount > selectedCourse.lessonsCompleted) {
                const newStatus = completedCount >= selectedCourse.lessonsTotal ? CourseStatus.COMPLETED : CourseStatus.IN_PROGRESS;
                
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
                onSubmit={(score) => {
                    alert(`Exam submitted! You scored ${score}%`);
                    setTakingExam(false);
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
                    <div className="md:w-1/3 min-h-[250px] relative bg-gray-900">
                        <img
                            src={selectedCourse.image}
                            alt={selectedCourse.title}
                            className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                            <div className="text-white">
                                <span className="text-xs font-bold bg-welile-purple px-2 py-1 rounded-md mb-2 inline-block">MY COURSE</span>
                                <h3 className="text-2xl font-bold mb-1">{selectedCourse.title}</h3>
                                <p className="text-sm opacity-90">{selectedCourse.instructor}</p>
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
                                    {Math.round((selectedCourse.lessonsCompleted / selectedCourse.lessonsTotal) * 100)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-welile-purple transition-all duration-1000"
                                    style={{ width: `${(selectedCourse.lessonsCompleted / selectedCourse.lessonsTotal) * 100}%` }}
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
                                    onClick={() => setTakingExam(true)}
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
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Course Content</h3>
                    <div className="grid gap-4">
                        {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
                            selectedCourse.sections.map((section: CourseSection) => (
                                <div key={section.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                    <button 
                                        onClick={() => setExpandedSections(prev => ({...prev, [section.id]: !prev[section.id]}))}
                                        className="w-full bg-gray-50 dark:bg-slate-800/50 p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <h4 className="font-bold text-gray-900 dark:text-white">{section.title}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 px-2 py-1 rounded border border-gray-200 dark:border-slate-800">{section.lessons.length} Lessons</span>
                                            <ChevronDown size={20} className={`text-gray-500 dark:text-slate-400 transition-transform ${expandedSections[section.id] ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    
                                    {expandedSections[section.id] && (
                                        <div className="p-4 space-y-3">
                                            {section.lessons.length === 0 && (
                                                <div className="text-center py-4 text-sm text-gray-400 dark:text-slate-500">No content available.</div>
                                            )}
                                            {section.lessons.map((lesson: CourseModule) => (
                                                <div key={lesson.id} onClick={() => setActiveModule(lesson)} className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-955 transition-colors cursor-pointer flex gap-4 items-start group">
                                                    <div className={`p-3 rounded-xl shrink-0 ${lesson.type === 'video' ? 'bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'}`}>
                                                        {lesson.type === 'video' ? <Youtube size={24} /> : <FileText size={24} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-gray-900 dark:text-white group-hover:text-violet-900 dark:group-hover:text-violet-300 transition-colors">{lesson.title}</h5>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                            <Clock size={12} /> {lesson.duration}
                                                        </div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-violet-600 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                                                        <PlayCircle size={20} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                            selectedCourse.modules.map((module: any, idx: number) => (
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
                                        className="shrink-0 flex items-center gap-2 bg-welile-purple text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm"
                                    >
                                        <PlayCircle size={16} /> Play
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>No detailed modules available for this course.</p>
                            </div>
                        )}
                    </div>
                </div>

                {isRatingModalOpen && (
                    <RatingModal
                        courseTitle={selectedCourse.title}
                        onClose={() => setIsRatingModalOpen(false)}
                        onSubmit={(rating, review) => {
                            console.log(`Submitted rating ${rating} for ${selectedCourse.title}: ${review}`);
                            setHasRated(true);
                            setIsRatingModalOpen(false);
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="bg-gradient-to-r from-welile-purple to-purple-600 p-4 rounded-2xl text-white flex items-center justify-between">
                    <div>
                        <p className="text-xs opacity-80 font-medium">Total Learning Time</p>
                        <p className="font-bold text-lg">{formattedDuration}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Clock size={20} />
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
                            onClick={() => setSelectedCourse(course)}
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
