import React from 'react';
import { Award, Download, Share2, Calendar } from 'lucide-react';
import { Course, CourseStatus } from '../types';

interface CertificatesProps {
    courses: Course[];
}

const Certificates: React.FC<CertificatesProps> = ({ courses }) => {
    const completedCourses = courses.filter(course => course.status === CourseStatus.COMPLETED);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Certificates</h2>
                <p className="text-gray-500 dark:text-slate-400">View and download certificates for your completed courses.</p>
            </div>

            {completedCourses.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No certificates yet</h3>
                    <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                        Complete courses to earn certificates and showcase your skills to the world.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completedCourses.map((course) => (
                        <div key={course.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-welile-purple/5 to-welile-pink/5 rounded-bl-full -mr-10 -mt-10"></div>

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="w-12 h-12 bg-welile-lime/20 dark:bg-welile-lime/10 rounded-xl flex items-center justify-center text-welile-purple dark:text-welile-purple">
                                    <Award size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Share">
                                        <Share2 size={18} />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Download PDF">
                                        <Download size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{course.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Instructed by Welile Academy</p>

                                <div className="flex items-center gap-4 text-xs font-medium text-gray-400 border-t border-gray-50 dark:border-slate-800 pt-4">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        <span>Completed on {new Date().toLocaleDateString()}</span>
                                    </div>
                                    <div className="px-2 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded text-[10px] uppercase tracking-wider">
                                        Verified
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Certificates;
