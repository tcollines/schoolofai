import React, { useState } from 'react';
import CourseCard from './CourseCard';
import { Course, CourseStatus, CourseModule, CourseSection } from '../types';
import { Search, Filter, Clock, ArrowLeft, PlayCircle, Youtube, BookOpen, FileText, ChevronDown } from 'lucide-react';
import CoursePlayer from './CoursePlayer';
import ExamPlayer from './ExamPlayer';
import RatingModal from './RatingModal';
import { Star } from 'lucide-react';

interface MyCoursesProps {
    courses: Course[];
}

const MyCourses: React.FC<MyCoursesProps> = ({ courses }) => {
    const [filter, setFilter] = useState('ALL'); // ALL, IN_PROGRESS, COMPLETED
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
    const [takingExam, setTakingExam] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [hasRated, setHasRated] = useState(false);

    // Only show enrolled courses for "My Learning"
    const myCourses = courses.filter(c => c.status === CourseStatus.IN_PROGRESS || c.status === CourseStatus.COMPLETED);

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

    const handleNextModule = () => {
        const allModules = getAllModules();
        const currentIndex = getModuleIndex();
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
                    className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={18} /> Back to My Courses
                </button>

                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 md:flex mb-8">
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
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <BookOpen size={18} className="text-welile-purple" />
                                <span className="font-medium">{selectedCourse.lessonsTotal} Lessons</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock size={18} className="text-welile-purple" />
                                <span className="font-medium">{selectedCourse.duration}</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="font-medium text-gray-600">
                                    {selectedCourse.lessonsCompleted} / {selectedCourse.lessonsTotal} Completed
                                </span>
                                <span className="font-bold text-welile-purple">
                                    {Math.round((selectedCourse.lessonsCompleted / selectedCourse.lessonsTotal) * 100)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-welile-purple transition-all duration-1000"
                                    style={{ width: `${(selectedCourse.lessonsCompleted / selectedCourse.lessonsTotal) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {selectedCourse.quiz && (
                            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-indigo-900">Final Exam Available</h4>
                                    <p className="text-xs text-indigo-700">Test your knowledge to earn your certificate.</p>
                                </div>
                                <button 
                                    onClick={() => setTakingExam(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700"
                                >
                                    Start Exam
                                </button>
                            </div>
                        )}

                        {/* Rating Prompt - Show if completed or near completion */}
                        {((selectedCourse.status === CourseStatus.COMPLETED) || (selectedCourse.lessonsTotal > 0 && selectedCourse.lessonsCompleted >= selectedCourse.lessonsTotal)) && !hasRated && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-yellow-900 flex items-center gap-2">
                                        <Star size={18} className="text-yellow-500 fill-yellow-500" />
                                        Rate this Course
                                    </h4>
                                    <p className="text-xs text-yellow-700 mt-1">Share your experience to help other students.</p>
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
                            <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-green-900 flex items-center gap-2">
                                        <Star size={18} className="text-green-500 fill-green-500" />
                                        Thank you for your review!
                                    </h4>
                                    <p className="text-xs text-green-700 mt-1">Your feedback helps us improve.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 max-w-3xl">
                    <h3 className="text-xl font-bold text-gray-900">Course Content</h3>
                    <div className="grid gap-4">
                        {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
                            selectedCourse.sections.map((section: CourseSection) => (
                                <div key={section.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                    <button 
                                        onClick={() => setExpandedSections(prev => ({...prev, [section.id]: !prev[section.id]}))}
                                        className="w-full bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
                                    >
                                        <h4 className="font-bold text-gray-900">{section.title}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded border border-gray-200">{section.lessons.length} Lessons</span>
                                            <ChevronDown size={20} className={`text-gray-500 transition-transform ${expandedSections[section.id] ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    
                                    {expandedSections[section.id] && (
                                        <div className="p-4 space-y-3">
                                            {section.lessons.length === 0 && (
                                                <div className="text-center py-4 text-sm text-gray-400">No content available.</div>
                                            )}
                                            {section.lessons.map((lesson: CourseModule) => (
                                                <div key={lesson.id} onClick={() => setActiveModule(lesson)} className="p-4 rounded-xl border border-gray-100 hover:border-violet-300 hover:bg-violet-50 transition-colors cursor-pointer flex gap-4 items-start group">
                                                    <div className={`p-3 rounded-xl shrink-0 ${lesson.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {lesson.type === 'video' ? <Youtube size={24} /> : <FileText size={24} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-gray-900 group-hover:text-violet-900 transition-colors">{lesson.title}</h5>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            <Clock size={12} /> {lesson.duration}
                                                        </div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-violet-600 bg-white rounded-full shadow-sm">
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
                                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div className="w-24 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden relative group cursor-pointer border border-gray-200" onClick={() => setActiveModule(module)}>
                                        {module.thumbnail ? (
                                            <img src={module.thumbnail} alt={module.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                                <Youtube size={20} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <PlayCircle size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 text-base mb-1 truncate" title={module.title}>{module.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
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
                    <h2 className="text-2xl font-bold text-gray-900">My Learning</h2>
                    <p className="text-gray-500">Track your progress and continue learning.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {['ALL', 'IN_PROGRESS', 'COMPLETED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${filter === tab
                                ? 'bg-welile-purple text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {tab === 'ALL' ? 'All Courses' : tab === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                        {myCourses.length}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Total Enrolled</p>
                        <p className="font-bold text-gray-900">Courses</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-welile-purple flex items-center justify-center font-bold text-lg">
                        {inProgressCount}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Active Now</p>
                        <p className="font-bold text-gray-900">In Progress</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-lg">
                        {completedCount}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Completed</p>
                        <p className="font-bold text-gray-900">Certificates</p>
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
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Search size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">No courses found</h3>
                    <p className="text-gray-500 text-sm">Try changing the filter or explore new courses.</p>
                </div>
            )}
        </div>
    );
};

export default MyCourses;
