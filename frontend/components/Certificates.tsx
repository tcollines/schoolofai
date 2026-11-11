import React, { useState } from 'react';
import { Award, Download, Share2, Calendar, FileText, PenTool, Trophy } from 'lucide-react';
import { Course, CourseStatus } from '../types';

interface CertificatesProps {
    courses: Course[];
}

const Certificates: React.FC<CertificatesProps> = ({ courses }) => {
    const completedCourses = courses.filter(course => course.status === CourseStatus.COMPLETED);
    
    // Download Progress States
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const handleDownload = (course: Course) => {
        if (!course.certificateUrl) return;
        setDownloadingId(course.id);
        setProgress(0);

        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.floor(Math.random() * 15) + 8;
            if (currentProgress >= 100) {
                currentProgress = 100;
                setProgress(100);
                clearInterval(interval);
                
                // Trigger download after showing 100% completion briefly
                setTimeout(() => {
                    const ext = course.certificateUrl?.startsWith('data:image') ? 'png' : 'pdf';
                    const filename = `Certificate_${course.title.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_')}.${ext}`;
                    
                    const link = document.createElement('a');
                    link.href = course.certificateUrl!;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setDownloadingId(null);
                }, 400);
            } else {
                setProgress(currentProgress);
            }
        }, 120);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold text-stone-900 dark:text-white font-serif">Your Certificates</h2>
                <p className="text-stone-600 dark:text-slate-400">View and download certificates for your completed courses.</p>
            </div>

            {completedCourses.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-stone-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-stone-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="text-stone-500" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">No certificates yet</h3>
                    <p className="text-stone-600 dark:text-slate-400 max-w-md mx-auto">
                        Complete courses to earn certificates and showcase your skills to the world.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completedCourses.map((course) => (
                        <div key={course.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-stone-200 dark:border-slate-800 transition-shadow group relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                            <div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-950/40 rounded-xl flex items-center justify-center text-violet-700 dark:text-violet-400">
                                        <Award size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" 
                                            title="Share"
                                            onClick={() => alert("Certificate sharing feature coming soon!")}
                                        >
                                            <Share2 size={18} />
                                        </button>
                                        
                                        {downloadingId === course.id ? (
                                            <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/30 px-2 py-1.5 rounded-lg border border-violet-200 dark:border-violet-900/50">
                                                <div className="w-3.5 h-3.5 rounded-full border-2 border-violet-600 dark:border-violet-400 border-t-transparent animate-spin"></div>
                                                <span className="text-xs font-bold text-violet-700 dark:text-violet-400 font-mono">{progress}%</span>
                                            </div>
                                        ) : (
                                            course.examCompleted && course.isCertificateVerified && course.certificateUrl ? (
                                                <button 
                                                    onClick={() => handleDownload(course)}
                                                    className="p-2 text-violet-700 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-violet-200 dark:hover:border-violet-900/40" 
                                                    title="Download Certificate"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            ) : (
                                                <button 
                                                    disabled 
                                                    className="p-2 text-stone-400 dark:text-slate-700 cursor-not-allowed" 
                                                    title={
                                                        !course.examCompleted 
                                                            ? "Exam not completed yet" 
                                                            : "Pending Admin Upload & Verification"
                                                    }
                                                >
                                                    <Download size={18} />
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1 line-clamp-2">{course.title}</h3>
                                    <p className="text-sm text-stone-600 dark:text-slate-400 mb-4">Instructed by Welile Academy</p>

                                    <div className="flex flex-col gap-2 border-t border-stone-50 dark:border-slate-800 pt-4">
                                        <div className="flex items-center justify-between text-sm font-medium text-stone-600 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                <span>Syllabus Completed</span>
                                            </div>
                                            <span className="text-green-600 dark:text-green-400 font-semibold">100%</span>
                                        </div>

                                        {course.examCompleted && (
                                            <>
                                                <div className="flex items-center justify-between text-sm font-medium text-stone-600 dark:text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm"><FileText className="inline-block w-4 h-4 mr-1 align-middle" /></span>
                                                        <span>Module Quizzes</span>
                                                    </div>
                                                    <span className="text-stone-900 dark:text-white font-bold">
                                                        {course.examMarksReleased && course.quizScore !== undefined ? `${course.quizScore}%` : 'Grading...'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-sm font-medium text-stone-600 dark:text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm"><PenTool className="inline-block w-4 h-4 mr-1 align-middle" />️</span>
                                                        <span>Final Exam</span>
                                                    </div>
                                                    <span className="text-stone-900 dark:text-white font-bold">
                                                        {course.examMarksReleased && course.examScore !== undefined ? `${course.examScore}%` : 'Grading...'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-sm font-medium text-stone-600 dark:text-slate-300 bg-stone-50 dark:bg-slate-800 p-2 rounded-lg border border-stone-100 dark:border-slate-800/80 mt-1">
                                                    <div className="flex items-center gap-1.5 font-bold">
                                                        <span className="text-sm"><Trophy className="inline-block w-4 h-4 mr-1 align-middle" /></span>
                                                        <span>Final Score</span>
                                                    </div>
                                                    <span className="text-violet-700 dark:text-violet-400 font-bold text-sm">
                                                        {course.examMarksReleased && course.finalScore !== undefined ? `${course.finalScore}%` : 'Pending'}
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        <div className="flex items-center justify-between text-sm font-medium text-stone-600 dark:text-slate-400 mt-1 pt-2 border-t border-dashed border-stone-100 dark:border-slate-800">
                                            <span>Certificate Status:</span>
                                            {course.examCompleted && course.isCertificateVerified ? (
                                                <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 rounded text-xs uppercase font-bold tracking-wider">
                                                    Verified & Issued
                                                </span>
                                            ) : course.examCompleted ? (
                                                <span className="px-2 py-0.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 rounded text-xs uppercase font-bold tracking-wider">
                                                    Pending Admin Upload
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs uppercase font-bold tracking-wider">
                                                    Locked
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Download Progress Bar Overlay */}
                            {downloadingId === course.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-100 dark:bg-slate-800">
                                    <div 
                                        className="h-full bg-violet-700 transition-all duration-100 ease-out" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Certificates;
