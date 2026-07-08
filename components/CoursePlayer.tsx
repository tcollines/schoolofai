import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle, ChevronRight } from 'lucide-react';
import { CourseModule } from '../types';

interface CoursePlayerProps {
    module: CourseModule;
    courseTitle: string;
    onBack: () => void;
    onNext?: () => void;
    hasNext?: boolean;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({ module, courseTitle, onBack, onNext, hasNext }) => {
    const [isVideoComplete, setIsVideoComplete] = useState(false);

    // Reset video completion state when module changes
    useEffect(() => {
        setIsVideoComplete(false);
        // If it's reading material, it's immediately complete
        if (module.type !== 'video') {
            setIsVideoComplete(true);
        }
    }, [module.id, module.type]);

    // For youtube iframes, we can't easily track completion without YT API, so we just unlock after 10 seconds for prototype, or immediately if they click. 
    // To make it simple, we'll use a timeout for iframes just for demo purposes.
    useEffect(() => {
        if (module.type === 'video' && module.videoId && !module.videoUrl) {
            const timer = setTimeout(() => setIsVideoComplete(true), 5000); // Mock completion after 5s
            return () => clearTimeout(timer);
        }
    }, [module]);

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-4 shrink-0 shadow-sm z-10">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{module.title}</h2>
                    <p className="text-xs text-gray-500 line-clamp-1">{courseTitle} • {module.duration}</p>
                </div>
                
                <div className="ml-auto flex items-center gap-4">
                    {onNext && (
                        <button
                            onClick={onNext}
                            disabled={module.type === 'video' && !isVideoComplete}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all ${
                                module.type === 'video' && !isVideoComplete
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-welile-purple text-white hover:bg-purple-700 shadow-sm'
                            }`}
                        >
                            {module.type === 'video' && !isVideoComplete ? 'Watch video to unlock next' : hasNext ? 'Next Lesson' : 'Complete'}
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {module.type === 'video' ? (
                    <>
                        <div className="flex-[2.5] bg-black flex flex-col relative h-full">
                            <div className="flex-1 flex items-center justify-center p-4">
                                {module.videoUrl ? (
                                    <video 
                                        src={module.videoUrl} 
                                        controls 
                                        autoPlay 
                                        onEnded={() => setIsVideoComplete(true)}
                                        className="w-full max-h-[85vh] rounded-xl shadow-2xl object-contain outline-none bg-black"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                ) : module.videoId ? (
                                    <div className="w-full h-full p-4">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${module.videoId}?autoplay=1&rel=0`}
                                            title={module.title}
                                            className="w-full h-full rounded-xl shadow-2xl"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">No video source provided</div>
                                )}
                            </div>
                        </div>
                        
                        {/* Notes Aside */}
                        <div className="flex-1 bg-white border-l border-gray-100 flex flex-col h-full max-w-sm xl:max-w-md">
                            <div className="p-6 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="text-welile-purple" size={20} />
                                    Notes & Materials
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 prose prose-violet prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                {module.content ? module.content : <span className="text-gray-400 italic">No notes provided for this lesson.</span>}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 bg-gray-50 overflow-y-auto p-8">
                        <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-gray-100 min-h-full">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
                                        <p className="text-gray-500 mt-1">Reading Material</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        alert(`Downloading: "${module.title}_Notes.pdf"`);
                                        window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank');
                                    }}
                                    className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                                >
                                    <FileText size={14} /> Download PDF Version
                                </button>
                            </div>
                            
                            <div className="prose prose-violet max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {module.content || <span className="text-gray-400 italic">No content provided for this reading material.</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursePlayer;
