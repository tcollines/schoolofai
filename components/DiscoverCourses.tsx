import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Compass, BookOpen, Clock, Star, PlayCircle, Eye } from 'lucide-react';
import { Course, CourseStatus } from '../types';
import { useTranslation } from './translations';

interface DiscoverCoursesProps {
    courses: Course[];
    onEnroll: (courseId: string) => void;
    isAuthenticated: boolean;
    onLoginClick: () => void;
}

const DiscoverCourses: React.FC<DiscoverCoursesProps> = ({ courses, onEnroll, isAuthenticated, onLoginClick }) => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialQuery = searchParams.get('q') || '';
    
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Update internal state if URL search query changes
    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            setSearchQuery(query);
        }
    }, [searchParams]);

    // Extract unique categories from available courses
    const categories = ['All', ...Array.from(new Set(courses.map(c => c.category)))];

    const filteredCourses = courses.filter(course => {
        if (course.isDraft) return false;
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 lg:space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Compass className="text-welile-purple" /> {t('discover_courses')}
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{t('explore_catalog')}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-welile-purple transition-shadow"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-3 rounded-2xl whitespace-nowrap text-sm font-bold transition-colors ${
                                selectedCategory === category
                                    ? 'bg-gray-950 dark:bg-slate-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-slate-200'
                                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-350 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Course Grid */}
            {filteredCourses.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No courses found</h3>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <div 
                            key={course.id} 
                            onClick={() => {
                                localStorage.setItem('recent-tapped-course-id', course.id);
                                navigate(`/discover/${course.id}`);
                            }}
                            className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'}
                                    alt={course.title}
                                    className="w-full h-full object-cover transition-transform duration-500"
                                    style={{
                                        objectPosition: `${course.imagePositionX ?? 50}% ${course.imagePositionY ?? 50}%`,
                                        transform: `scale(${course.imageScale ?? 1})`,
                                        transformOrigin: `${course.imagePositionX ?? 50}% ${course.imagePositionY ?? 50}%`
                                    }}
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-900 dark:text-white shadow-sm">
                                        {course.category}
                                    </span>
                                </div>
                                {course.accessTier === 'PAID' && (
                                    <div className="absolute top-4 right-4">
                                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full text-xs font-bold shadow-sm">
                                            Premium
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex items-center gap-2 mb-3">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{course.rating || 'New'}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{course.title}</h3>
                                <div className="flex items-center gap-2 mb-4">
                                     <div className="w-6 h-6 rounded-full border border-gray-100 dark:border-slate-800 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-slate-850 shrink-0">
                                         {course.instructorAvatar ? (
                                             (course.instructorAvatar.startsWith('http') || course.instructorAvatar.startsWith('data:image')) ? (
                                                 <img src={course.instructorAvatar} alt={course.instructor} className="w-full h-full object-cover" />
                                             ) : (
                                                 <span className="text-[10px]">{course.instructorAvatar}</span>
                                             )
                                         ) : (
                                             <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.instructor}`} alt={course.instructor} className="w-full h-full object-cover" />
                                         )}
                                     </div>
                                     <span className="text-sm text-gray-550 dark:text-slate-350 font-medium">{course.instructor}</span>
                                 </div>
                                
                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-slate-450 mb-6 mt-auto">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {course.duration}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4" />
                                        {course.lessonsTotal || 0} Lessons
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                                        {course.price === 0 ? 'Free' : `$${course.price}`}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/discover/${course.id}`);
                                        }}
                                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
                                            course.status !== CourseStatus.NOT_STARTED 
                                                ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 cursor-default'
                                                : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white'
                                        }`}
                                    >
                                        {course.status !== CourseStatus.NOT_STARTED ? (
                                            <>Enrolled</>
                                        ) : (
                                            <><Eye className="w-4 h-4" /> View Details</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DiscoverCourses;
