import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Star, PlayCircle, Video, FileText, CheckCircle, Award, Shield, Headphones, File } from 'lucide-react';
import { Course, CourseStatus, UserRole } from '../types';
import { formatAmount, getCurrencyPreference, CurrencyType } from '../src/lib/currency';

interface CourseOverviewProps {
    courses: Course[];
    onEnroll: (courseId: string) => void;
    onUnenroll?: (courseId: string) => void;
    isAuthenticated: boolean;
    userRole?: UserRole;
    onLoginClick: () => void;
    walletBalance?: number;
    onBuyCourse?: (courseId: string) => Promise<boolean>;
}

const CourseOverview: React.FC<CourseOverviewProps> = ({ courses, onEnroll, onUnenroll, isAuthenticated, userRole, onLoginClick, walletBalance, onBuyCourse }) => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
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
    const [isBuying, setIsBuying] = useState(false);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [courseId]);

    const course = courses.find(c => c.id === courseId);

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <BookOpen size={32} className="text-gray-400 dark:text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Course Not Found</h2>
                <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-md">We couldn't find the course you're looking for. It might have been removed or the URL is incorrect.</p>
                <button 
                    onClick={() => navigate('/discover')}
                    className="px-6 py-3 bg-gray-900 dark:bg-white hover:bg-welile-purple text-white dark:text-gray-900 font-bold rounded-xl transition-colors"
                >
                    Back to Discover
                </button>
            </div>
        );
    }

    const isEnrolled = course.status !== CourseStatus.NOT_STARTED;

    // Build unified sections list from either `sections` or `modules`
    const syllabus = course.sections || (course.modules ? [{ id: 's1', title: 'Course Content', lessons: course.modules }] : []);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Back Button */}
            <button 
                onClick={() => navigate(-1)}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm flex items-center gap-2 transition-colors"
            >
                &larr; Back
            </button>

            {/* Hero Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="relative h-64 md:h-80 lg:h-96 w-full">
                    <img 
                        src={course.image} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                        style={{
                            objectPosition: `${course.imagePositionX ?? 50}% ${course.imagePositionY ?? 50}%`,
                            transform: `scale(${course.imageScale ?? 1})`,
                            transformOrigin: `${course.imagePositionX ?? 50}% ${course.imagePositionY ?? 50}%`
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-3/4">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-welile-purple/90 text-white rounded-full text-xs font-bold backdrop-blur-sm">
                                {course.category}
                            </span>
                            {course.accessTier === 'PAID' && (
                                <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                                    <Shield size={12} /> Premium
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                            {course.title}
                        </h1>
                        <p className="text-gray-200 md:text-lg max-w-2xl">
                            Master the fundamentals and advanced concepts taught by {course.instructor}. 
                            Join thousands of students in this comprehensive journey.
                        </p>
                    </div>
                </div>

                {/* Quick Info Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 bg-white dark:bg-slate-900 gap-6">
                    <div className="flex flex-wrap items-center gap-6 md:gap-10 w-full md:w-auto">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-slate-450 font-semibold uppercase tracking-wider mb-0.5">Duration</p>
                                <p className="font-bold text-gray-900 dark:text-white">{course.duration}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-slate-455 font-semibold uppercase tracking-wider mb-0.5">Lessons</p>
                                <p className="font-bold text-gray-900 dark:text-white">{course.lessonsTotal || 0} Total</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                                <Star size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-slate-455 font-semibold uppercase tracking-wider mb-0.5">Rating</p>
                                <p className="font-bold text-gray-900 dark:text-white">{course.rating || 'New'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3 border-t md:border-t-0 pt-6 md:pt-0 border-gray-100 dark:border-slate-800">
                        <div className="text-center md:text-right">
                            <span className={`text-3xl font-black ${course.accessTier === 'PAID' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                                {course.accessTier === 'PAID' ? 'Premium' : course.price === 0 ? 'Free' : `$${course.price}`}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                                {course.accessTier === 'PAID' ? 'Requires Subscription' : 'Lifetime Access'}
                            </p>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            {!isEnrolled && course.accessTier === 'PAID' && userRole !== UserRole.PRO && userRole !== UserRole.SPONSORED && userRole !== UserRole.ADMIN && (
                                <button
                                    onClick={() => {
                                        if (!isAuthenticated) {
                                            onLoginClick();
                                            return;
                                        }
                                        setIsBuyModalOpen(true);
                                    }}
                                    className="w-full md:w-auto px-6 py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center gap-2 shadow-sm bg-violet-600 hover:bg-violet-750 text-white cursor-pointer"
                                >
                                    Buy Course (${course.price || 49})
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (!isEnrolled) {
                                        if (!isAuthenticated) {
                                            onLoginClick();
                                            return;
                                        }
                                        if (course.accessTier === 'PAID' && userRole !== UserRole.PRO && userRole !== UserRole.SPONSORED && userRole !== UserRole.ADMIN) {
                                            navigate('/plans');
                                            return;
                                        }
                                        onEnroll(course.id);
                                    } else {
                                        navigate('/courses');
                                    }
                                }}
                                className={`w-full md:w-auto px-6 py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                                    isEnrolled 
                                        ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                                        : (!isEnrolled && course.accessTier === 'PAID' && userRole !== UserRole.PRO && userRole !== UserRole.SPONSORED && userRole !== UserRole.ADMIN)
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                            : 'bg-gray-900 dark:bg-slate-100 hover:bg-welile-purple text-white dark:text-gray-900 dark:hover:text-white shadow-lg shadow-gray-900/20 dark:shadow-none'
                                }`}
                            >
                                {isEnrolled ? (
                                    <><CheckCircle size={20} /> Continue Learning</>
                                ) : (!isEnrolled && course.accessTier === 'PAID' && userRole !== UserRole.PRO && userRole !== UserRole.SPONSORED && userRole !== UserRole.ADMIN) ? (
                                    <><Shield size={20} /> Upgrade to Pro</>
                                ) : (
                                    <><PlayCircle size={20} /> Enroll Now</>
                                )}
                            </button>
                            
                            {isEnrolled && onUnenroll && (
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Are you sure you want to unenroll from "${course.title}"?`)) {
                                            onUnenroll(course.id);
                                        }
                                    }}
                                    className="w-full md:w-32 py-3.5 bg-white hover:bg-red-50 text-red-500 hover:text-red-650 dark:bg-slate-900 dark:hover:bg-red-950/20 border border-gray-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-transparent rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                >
                                    Unenroll
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Syllabus Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <BookOpen className="text-welile-purple" size={24} />
                            Course Syllabus
                        </h2>
                        
                        {syllabus.length === 0 ? (
                            <p className="text-gray-500 dark:text-slate-400 italic">Syllabus is being updated. Check back soon.</p>
                        ) : (
                            <div className="space-y-6">
                                {syllabus.map((section, idx) => (
                                    <div key={section.id || idx} className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        <div className="bg-gray-50 dark:bg-slate-850 p-4 border-b border-gray-100 dark:border-slate-800">
                                            <h3 className="font-bold text-gray-900 dark:text-white">Module {idx + 1}: {section.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{section.lessons.length} lessons</p>
                                        </div>
                                        <div className="divide-y divide-gray-50 dark:divide-slate-800">
                                            {section.lessons.map((lesson: any, lIdx: number) => (
                                                <div key={lesson.id || lIdx} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                         <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40">
                                                             {lesson.type === 'video' ? <Video size={14} /> : 
                                                              lesson.type === 'audio' ? <Headphones size={14} /> :
                                                              lesson.type === 'document' ? <File size={14} /> :
                                                              lesson.type === 'quiz' ? <Award size={14} /> : 
                                                              <FileText size={14} />}
                                                         </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-welile-purple dark:group-hover:text-purple-300 transition-colors">
                                                                {lIdx + 1}. {lesson.title}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {lesson.duration && (
                                                        <span className="text-xs font-medium text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                            {lesson.duration}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Sidebar Column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">About the Course</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {course.instructorAvatar ? (
                                    (course.instructorAvatar.startsWith('http') || course.instructorAvatar.startsWith('data:image')) ? (
                                        <img src={course.instructorAvatar} alt={course.instructor} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl">{course.instructorAvatar}</span>
                                    )
                                ) : (
                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.instructor}`} alt={course.instructor} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">
                                    {course.instructor}
                                </p>
                                <p className="text-xs text-gray-500 hover:text-welile-purple dark:text-slate-400 dark:hover:text-purple-300">
                                    <a href={`mailto:${course.instructorEmail || `${course.instructor.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '.')}@schoolofai.edu`}`}>
                                        {course.instructorEmail || `${course.instructor.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '.')}@schoolofai.edu`}
                                    </a>
                                </p>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Expert Educator</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {course.description || `${course.instructor} brings years of industry experience and academic excellence to this course. Dedicated to helping students master complex topics with simple, practical examples.`}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-[#111111] p-6 rounded-3xl shadow-sm text-white">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Award className="text-yellow-400" size={20} />
                            What You'll Achieve
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            {course.outcomes && course.outcomes.length > 0 ? (
                                course.outcomes.filter(Boolean).map((outcome, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckCircle className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                                        <span>{outcome}</span>
                                    </li>
                                ))
                            ) : (
                                <>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Master foundational concepts and techniques.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Build real-world projects to showcase your skills.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Earn a verified certificate upon completion.</span>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Purchase Course Modal */}
            {isBuyModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Course Purchase</h3>
                        
                        <div className="space-y-4 mb-6">
                            <div className="bg-gray-50 dark:bg-slate-850 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-bold mb-1">Course Title</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-white">{course.title}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-slate-850 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                                    <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-bold mb-1">Your Balance</p>
                                    <p className="text-lg font-black text-gray-800 dark:text-white">{formatAmount(walletBalance ?? 0)}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-850 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                                    <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-bold mb-1">Course Price</p>
                                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">{formatAmount(course.price || 49)}</p>
                                </div>
                            </div>

                            {(walletBalance ?? 0) < (course.price || 49) ? (
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 text-xs text-red-700 dark:text-red-400 font-medium">
                                    Insufficient funds in your wallet. Please top up your wallet in your Profile dashboard first.
                                </div>
                            ) : (
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                    Remaining balance after purchase: {formatAmount((walletBalance ?? 0) - (course.price || 49))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setIsBuyModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl border border-gray-250 text-gray-700 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-850 text-sm font-semibold cursor-pointer"
                                disabled={isBuying}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if ((walletBalance ?? 0) < (course.price || 49)) {
                                        navigate('/profile');
                                        return;
                                    }
                                    setIsBuying(true);
                                    if (onBuyCourse) {
                                        const success = await onBuyCourse(course.id);
                                        if (success) {
                                            setIsBuyModalOpen(false);
                                            // Redirect
                                            navigate('/courses');
                                        }
                                    }
                                    setIsBuying(false);
                                }}
                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer ${
                                    (walletBalance ?? 0) < (course.price || 49)
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-violet-600 hover:bg-violet-750'
                                }`}
                                disabled={isBuying}
                            >
                                {isBuying ? 'Processing...' : (walletBalance ?? 0) < (course.price || 49) ? 'Top up Wallet' : 'Confirm & Purchase'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseOverview;
