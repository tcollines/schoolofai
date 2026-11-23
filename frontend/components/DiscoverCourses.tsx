import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Search, Compass, BookOpen, Clock, Star, PlayCircle, Eye, Lock, Shield } from 'lucide-react';
import { Course, CourseStatus, UserRole } from '../types';
import { useTranslation } from './translations';
import { formatAmount, getCurrencyPreference, CurrencyType } from '../src/lib/currency';
import FreeCourseCard from './learn/FreeCourseCard';

interface DiscoverCoursesProps {
    courses: Course[];
    onEnroll: (courseId: string) => void;
    isAuthenticated: boolean;
    userRole?: UserRole;
    onLoginClick: () => void;
}

const DiscoverCourses: React.FC<DiscoverCoursesProps> = ({ courses, onEnroll, isAuthenticated, userRole, onLoginClick }) => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const outlet = useOutletContext<{ displayUser?: { id?: string } } | undefined>();
    const initialQuery = searchParams.get('q') || '';
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
        if (course.isVerified === false) return false;
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col gap-[22px]">
            {/* banner with search */}
            <section className="relative overflow-hidden rounded-[24px] bg-brand text-white px-6 sm:px-8 py-7 sm:py-8">
                <span aria-hidden="true" className="absolute -right-[60px] -top-20 w-[280px] h-[280px] rounded-full bg-brand-mid" />
                <span aria-hidden="true" className="absolute right-[160px] -bottom-[120px] w-[220px] h-[220px] rounded-full bg-brand-mid" />
                <div className="relative max-w-[640px]">
                    <p className="m-0 text-[12px] font-bold tracking-[0.12em] uppercase text-[#D9CCFF] flex items-center gap-2"><Compass size={14} />{t('discover_courses')}</p>
                    <h1 className="mt-2.5 mb-0 text-[26px] sm:text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em]">{t('explore_catalog')}</h1>
                    <div className="relative mt-5">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A94AE] w-5 h-5 pointer-events-none" />
                        <input
                            type="search"
                            placeholder={t('search_placeholder')}
                            aria-label={t('search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-[52px] bg-white text-ink rounded-[16px] pl-12 pr-4 text-[15px] placeholder-[#9A94AE] focus:outline-none focus:ring-4 focus:ring-lime-200"
                        />
                    </div>
                </div>
            </section>

            {/* categories */}
            <div role="radiogroup" aria-label="Category" className="no-scrollbar flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
                {categories.map(category => {
                    const on = selectedCategory === category;
                    return (
                        <button
                            key={category}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setSelectedCategory(category)}
                            className={`press h-11 px-5 rounded-full whitespace-nowrap text-[14px] font-bold transition-colors ${on ? 'bg-brand text-white' : 'bg-white dark:bg-night-2 text-ink dark:text-slate-300 hover:text-brand'}`}
                        >
                            {category}
                        </button>
                    );
                })}
            </div>

            {/* The free flagship course, with the student's own progress */}
            {selectedCategory === 'All' && (!searchQuery.trim() || 'ai fundamentals free course'.includes(searchQuery.trim().toLowerCase())) && (
                <FreeCourseCard uid={isAuthenticated ? outlet?.displayUser?.id : undefined} variant="featured" />
            )}

            {/* Course Grid */}
            {filteredCourses.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white dark:bg-night-2 rounded-[24px]">
                    <div className="w-16 h-16 bg-brand-soft dark:bg-night-3 rounded-[20px] flex items-center justify-center mx-auto mb-4">
                        <Search className="w-7 h-7 text-brand dark:text-violet-300" />
                    </div>
                    <h3 className="text-[18px] font-extrabold text-ink dark:text-white m-0">No courses found</h3>
                    <p className="text-[#6B6680] dark:text-slate-400 text-[14px] mt-1 mb-0">Try another word or category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => {
                        const isPremiumLocked = course.accessTier === 'PAID' && userRole !== UserRole.PRO && userRole !== UserRole.PREMIUM && userRole !== UserRole.SPONSORED && userRole !== UserRole.ADMIN;
                        const enrolledHere = course.status !== CourseStatus.NOT_STARTED;
                        const open = () => {
                            const scopeKey = localStorage.getItem('auth_logged_in_email') || 'guest';
                            localStorage.setItem(`recent-tapped-course-id-${scopeKey}`, course.id);
                            navigate(`/discover/${course.id}`);
                        };
                        return (
                            <article
                                key={course.id}
                                onClick={open}
                                className="lift bg-white dark:bg-night-2 rounded-[22px] p-2.5 flex flex-col cursor-pointer text-ink dark:text-white"
                            >
                                <div className="relative aspect-video rounded-[16px] overflow-hidden bg-night">
                                    <img
                                        src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'}
                                        alt=""
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                        style={{
                                            objectPosition: `${course.imagePositionX ?? 50}% ${course.imagePositionY ?? 50}%`,
                                            transform: `scale(${course.imageScale ?? 1})`,
                                            transformOrigin: `${course.imagePositionX ?? 50}% ${course.imagePositionY ?? 50}%`
                                        }}
                                    />
                                    {isPremiumLocked && (
                                        <div className="absolute inset-0 bg-night/40 flex items-center justify-center">
                                            <span className="frost-white rounded-full px-3.5 h-9 flex items-center gap-2 text-[12px] font-bold text-ink"><Lock size={14} className="text-brand" />Pro only</span>
                                        </div>
                                    )}
                                    {course.accessTier === 'PAID' && (
                                        <span className="absolute top-3 right-3 h-7 px-2.5 rounded-full bg-lime-200 text-night text-[11px] font-extrabold inline-flex items-center gap-1"><Shield size={11} />Pro</span>
                                    )}
                                </div>
                                <div className="px-1.5 pt-3 pb-1.5 flex flex-col flex-1 gap-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="h-7 px-2.5 rounded-full bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 text-[11px] font-extrabold inline-flex items-center truncate max-w-[70%]">{course.category}</span>
                                        <span className="inline-flex items-center gap-1 text-[12px] font-bold"><Star className="w-3.5 h-3.5 text-[#F5B83D] fill-current" />{course.rating || 'New'}</span>
                                    </div>
                                    <h3 className="m-0 text-[16px] font-extrabold leading-snug line-clamp-2 tracking-[-0.01em]">{course.title}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-brand-soft shrink-0">
                                            {course.instructorAvatar ? (
                                                (course.instructorAvatar.startsWith('http') || course.instructorAvatar.startsWith('data:image')) ? (
                                                    <img src={course.instructorAvatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px]">{course.instructorAvatar}</span>
                                                )
                                            ) : (
                                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.instructor}`} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </span>
                                        <span className="text-[13px] text-[#6B6680] dark:text-slate-400 font-semibold truncate">{course.instructor}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[12px] font-semibold text-[#6B6680] dark:text-slate-400">
                                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{course.duration}</span>
                                        <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{course.lessonsTotal || 0} lessons</span>
                                    </div>
                                    <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                                        <span className="text-[17px] font-extrabold">
                                            {course.accessTier === 'PAID' ? 'Pro' : course.price === 0 ? 'Free' : formatAmount(course.price)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isPremiumLocked) navigate('/plans'); else navigate(`/discover/${course.id}`);
                                            }}
                                            className={`press h-10 px-4 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5 ${
                                                enrolledHere ? 'bg-mint-soft text-mint cursor-default'
                                                    : isPremiumLocked ? 'bg-lime-200 text-night'
                                                        : 'bg-brand text-white'
                                            }`}
                                        >
                                            {enrolledHere ? <>Enrolled</> : isPremiumLocked ? <><Lock className="w-3.5 h-3.5" />Upgrade</> : <><Eye className="w-4 h-4" />View course</>}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DiscoverCourses;
