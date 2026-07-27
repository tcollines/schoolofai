import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle, ChevronRight, Headphones, File, Clock, XCircle } from 'lucide-react';
import { CourseModule } from '../types';

interface CoursePlayerProps {
    module: CourseModule;
    courseTitle: string;
    onBack: () => void;
    onNext?: () => void;
    hasNext?: boolean;
}

const renderFormattedContent = (content?: string) => {
    if (!content) return null;
    // If it already looks like HTML, render it as-is
    if (/<[a-z][\s\S]*>/i.test(content)) {
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
    // Otherwise, convert newlines to line breaks
    const html = content.replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const CoursePlayer: React.FC<CoursePlayerProps> = ({ module, courseTitle, onBack, onNext, hasNext }) => {
    const [isVideoComplete, setIsVideoComplete] = useState(false);
    
    // Quiz Player States
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizPassed, setQuizPassed] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [timerActive, setTimerActive] = useState(false);
    const [quizScore, setQuizScore] = useState<{ score: number; total: number; percentage: number } | null>(null);

    // Playback Speed states & ref
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    const handleSpeedChange = (speed: number) => {
        setPlaybackSpeed(speed);
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
    };

    // Contextual Q&A States
    const [qaTab, setQaTab] = useState<'notes' | 'qa'>('notes');
    const [questionsList, setQuestionsList] = useState<any[]>([]);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [newReplyText, setNewReplyText] = useState('');

    // Personal Notes States
    const [noteText, setNoteText] = useState('');
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

    // Load student's personal notes for this module
    useEffect(() => {
        const currentUserEmail = localStorage.getItem('auth_logged_in_email') || '';
        const storedNote = localStorage.getItem(`student-note-${currentUserEmail}-${module.id}`);
        setNoteText(storedNote || '');
        setSaveStatus('saved');
    }, [module.id]);

    const handleSaveNote = (text: string) => {
        setSaveStatus('saving');
        const currentUserEmail = localStorage.getItem('auth_logged_in_email') || '';
        localStorage.setItem(`student-note-${currentUserEmail}-${module.id}`, text);
        setTimeout(() => {
            setSaveStatus('saved');
        }, 500);
    };

    // Auto-save logic (debounce)
    useEffect(() => {
        if (saveStatus === 'unsaved') {
            const timer = setTimeout(() => {
                handleSaveNote(noteText);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [noteText, saveStatus]);

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNoteText(e.target.value);
        setSaveStatus('unsaved');
    };

    // Load Q&A questions for this module
    useEffect(() => {
        const stored = localStorage.getItem(`module-qa-${module.id}`);
        if (stored) {
            setQuestionsList(JSON.parse(stored));
        } else {
            // Default mock questions for the demo
            const mockQs = [
                {
                    id: 'q-1',
                    author: 'John Doe',
                    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=John+Doe',
                    text: 'Does this module cover the latest GPT-4o architecture changes?',
                    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
                    replies: [
                        {
                            id: 'r-1',
                            author: 'Abraham Chemayek',
                            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
                            text: 'Yes! Slide 4 has some high-level architecture details.',
                            timestamp: new Date(Date.now() - 3600000).toISOString()
                        }
                    ]
                }
            ];
            setQuestionsList(mockQs);
            localStorage.setItem(`module-qa-${module.id}`, JSON.stringify(mockQs));
        }
    }, [module.id]);

    const handleAddQuestion = () => {
        if (!newQuestionText.trim()) return;
        const currentUserName = localStorage.getItem('auth_logged_in_name') || 'Student';
        const currentUserEmail = localStorage.getItem('auth_logged_in_email') || '';
        
        let avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUserName}`;
        if (currentUserEmail === 'chemayekabraham289@gmail.com') {
            avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';
        }

        const newQ = {
            id: 'q-' + Date.now(),
            author: currentUserName,
            avatarUrl: avatar,
            text: newQuestionText.trim(),
            timestamp: new Date().toISOString(),
            replies: []
        };

        const updated = [...questionsList, newQ];
        setQuestionsList(updated);
        localStorage.setItem(`module-qa-${module.id}`, JSON.stringify(updated));
        setNewQuestionText('');
    };

    const handleAddReply = (questionId: string) => {
        if (!newReplyText.trim()) return;
        const currentUserName = localStorage.getItem('auth_logged_in_name') || 'Student';
        const currentUserEmail = localStorage.getItem('auth_logged_in_email') || '';
        
        let avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUserName}`;
        if (currentUserEmail === 'chemayekabraham289@gmail.com') {
            avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';
        }

        const newReply = {
            id: 'r-' + Date.now(),
            author: currentUserName,
            avatarUrl: avatar,
            text: newReplyText.trim(),
            timestamp: new Date().toISOString()
        };

        const updated = questionsList.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    replies: [...q.replies, newReply]
                };
            }
            return q;
        });

        setQuestionsList(updated);
        localStorage.setItem(`module-qa-${module.id}`, JSON.stringify(updated));
        setNewReplyText('');
        setReplyingToId(null);
    };

    const renderRightSidebar = (themeColorClass = 'text-welile-purple', borderThemeClass = 'prose-violet') => {
        return (
            <div className="flex-1 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800 flex flex-col h-full max-w-sm xl:max-w-md w-full shrink-0">
                {/* Tab Switcher Header */}
                <div className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-850 flex p-2 shrink-0 gap-1">
                    <button
                        type="button"
                        onClick={() => setQaTab('notes')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            qaTab === 'notes'
                                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                                : 'text-gray-500 hover:text-gray-800 dark:hover:text-slate-205'
                        }`}
                    >
                        <FileText size={16} />
                        Notes & Materials
                    </button>
                    <button
                        type="button"
                        onClick={() => setQaTab('qa')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            qaTab === 'qa'
                                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                                : 'text-gray-500 hover:text-gray-800 dark:hover:text-slate-205'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Q&A Discussion
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 flex flex-col h-full justify-between">
                    {qaTab === 'notes' ? (
                        <div className="flex flex-col gap-6 h-full text-left">
                            {/* Personal Notes Section */}
                            <div className="flex flex-col gap-2 bg-gray-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-gray-100 dark:border-slate-850">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">My Personal Notes</h4>
                                    <span className="text-[10px] font-medium text-gray-405">
                                        {saveStatus === 'saving' && 'Saving...'}
                                        {saveStatus === 'saved' && 'Saved'}
                                        {saveStatus === 'unsaved' && 'Unsaved changes'}
                                    </span>
                                </div>
                                <textarea
                                    className="w-full h-32 p-3 text-xs bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-slate-205 resize-none"
                                    placeholder="Take notes here while watching the lesson... (Auto-saves as you type)"
                                    value={noteText}
                                    onChange={handleNoteChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleSaveNote(noteText)}
                                    className="mt-1 self-end px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                    Save Note
                                </button>
                            </div>

                            {/* Divider if both exist */}
                            <hr className="border-gray-100 dark:border-slate-800 my-1" />

                            {/* Instructor / Lesson Materials */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Lesson Materials</h4>
                                <div className={`prose ${borderThemeClass} dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-slate-350`}>
                                    {module.content ? renderFormattedContent(module.content) : <span className="text-gray-400 dark:text-slate-500 italic text-xs">No materials provided for this lesson.</span>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full justify-between gap-4">
                            {/* Questions list */}
                            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                                {questionsList.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 dark:text-slate-500 italic text-xs">
                                        No questions yet. Be the first to ask!
                                    </div>
                                ) : (
                                    questionsList.map((q) => (
                                        <div key={q.id} className="space-y-3 bg-gray-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-gray-100 dark:border-slate-850">
                                            <div className="flex items-center gap-2">
                                                <img src={q.avatarUrl} alt={q.author} className="w-6 h-6 rounded-full object-cover" />
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{q.author}</p>
                                                    <p className="text-[9px] text-gray-400">{new Date(q.timestamp).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-semibold text-left">{q.text}</p>
                                            
                                            {/* Replies */}
                                            {q.replies && q.replies.length > 0 && (
                                                <div className="pl-3 border-l border-gray-200 dark:border-slate-800 space-y-3 mt-2">
                                                    {q.replies.map((r: any) => (
                                                        <div key={r.id} className="space-y-1 text-left">
                                                            <div className="flex items-center gap-1.5">
                                                                <img src={r.avatarUrl} alt={r.author} className="w-5 h-5 rounded-full object-cover" />
                                                                <span className="text-[10px] font-bold text-gray-700 dark:text-slate-350">{r.author}</span>
                                                                <span className="text-[8px] text-gray-405">{new Date(r.timestamp).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-600 dark:text-slate-400 pl-6 leading-tight">{r.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reply form */}
                                            <div className="mt-1 pl-3 text-left">
                                                {replyingToId === q.id ? (
                                                    <div className="flex gap-2 items-center mt-1.5">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Write a reply..." 
                                                            value={newReplyText}
                                                            onChange={(e) => setNewReplyText(e.target.value)}
                                                            className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-lg px-2 py-1 text-[11px] text-gray-800 dark:text-white outline-none focus:border-purple-500"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleAddReply(q.id)}
                                                            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                                                        >
                                                            Reply
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setReplyingToId(null)}
                                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-[10px] font-semibold"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            setReplyingToId(q.id);
                                                            setNewReplyText('');
                                                        }}
                                                        className="text-purple-600 dark:text-purple-400 hover:underline text-[9px] font-bold cursor-pointer"
                                                    >
                                                        Reply to this question
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* New Question Box */}
                            <div className="mt-2 pt-3 border-t border-gray-150 dark:border-slate-800 flex gap-2 shrink-0">
                                <input 
                                    type="text"
                                    placeholder="Ask a question..."
                                    value={newQuestionText}
                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                    className="flex-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-gray-850 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddQuestion();
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddQuestion}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md shadow-purple-900/10 cursor-pointer"
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Reset video/audio/quiz completion state when module changes
    useEffect(() => {
        setIsVideoComplete(false);
        // Reading and documents complete immediately, video, audio and quizzes require completion
        if (module.type !== 'video' && module.type !== 'audio' && module.type !== 'quiz') {
            setIsVideoComplete(true);
        }
    }, [module.id, module.type]);

    // Handle quiz timer initialization and resets
    useEffect(() => {
        if (module.type === 'quiz') {
            setTimeRemaining((module.quizTimer || 5) * 60);
            setQuizSubmitted(false);
            setQuizPassed(false);
            setSelectedAnswers({});
            setTimerActive(true);
            setIsVideoComplete(false);
            setQuizScore(null);
        }
    }, [module.id, module.type]);

    // Quiz timer countdown logic
    useEffect(() => {
        if (!timerActive || timeRemaining <= 0 || quizSubmitted) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    // Auto submit on timeout
                    handleQuizSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timerActive, timeRemaining, quizSubmitted]);

    const handleQuizSubmit = (isTimeOut = false) => {
        setTimerActive(false);
        setQuizSubmitted(true);

        const questions = module.quizQuestions || [];
        let correctCount = 0;

        questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.correctAnswer) {
                correctCount++;
            }
        });

        const totalQuestions = questions.length;
        const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        setQuizScore({
            score: correctCount,
            total: totalQuestions,
            percentage
        });

        setQuizPassed(percentage >= 80);
        // Always unlock progression upon quiz submission
        setIsVideoComplete(true);

        // Save grade to localStorage for student dashboard
        try {
            const newGrade = {
                courseId: module.youtubeQuery || 'default-course',
                courseTitle: courseTitle,
                quizId: module.id,
                quizTitle: module.title,
                score: correctCount,
                totalQuestions: totalQuestions,
                percentage,
                submittedAt: new Date().toISOString()
            };
            const scopeKey = localStorage.getItem('auth_logged_in_email') || 'guest';
            const existingGrades = JSON.parse(localStorage.getItem(`quiz-grades-${scopeKey}`) || '[]');
            const updatedGrades = [newGrade, ...existingGrades.filter((g: any) => g.quizId !== module.id)];
            localStorage.setItem(`quiz-grades-${scopeKey}`, JSON.stringify(updatedGrades));
            window.dispatchEvent(new Event('quiz-grades-update'));
        } catch (e) {
            console.error("Error saving quiz grade:", e);
        }

        if (isTimeOut) {
            alert("Time's up! The quiz has been submitted automatically.");
        }
    };

    const handleRetake = () => {
        setSelectedAnswers({});
        setQuizSubmitted(false);
        setQuizPassed(false);
        setTimeRemaining((module.quizTimer || 5) * 60);
        setTimerActive(true);
        setIsVideoComplete(false);
        setQuizScore(null);
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // For youtube iframes, we can't easily track completion without YT API, so we just unlock after 10 seconds for prototype, or immediately if they click. 
    // To make it simple, we'll use a timeout for iframes just for demo purposes.
    useEffect(() => {
        if (module.type === 'video' && module.videoId && !module.videoUrl) {
            const timer = setTimeout(() => setIsVideoComplete(true), 5000); // Mock completion after 5s
            return () => clearTimeout(timer);
        }
        if (module.type === 'audio' && !module.audioUrl) {
            const timer = setTimeout(() => setIsVideoComplete(true), 5000); // Mock completion after 5s
            return () => clearTimeout(timer);
        }
    }, [module]);

    const isLocked = (module.type === 'video' || module.type === 'audio' || module.type === 'quiz') && !isVideoComplete;

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 p-4 flex items-center gap-4 shrink-0 shadow-sm z-10">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{module.title}</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{courseTitle} • {module.duration}</p>
                </div>
                
                <div className="ml-auto flex items-center gap-4">
                    {onNext && (
                        <button
                            onClick={onNext}
                            disabled={isLocked}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all ${
                                isLocked
                                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
                                    : 'bg-welile-purple text-white hover:bg-purple-700 shadow-sm'
                            }`}
                        >
                            {isLocked 
                                ? `${module.type === 'video' ? 'Watch video' : module.type === 'audio' ? 'Listen audio' : 'Complete quiz'} to unlock next` 
                                : hasNext ? 'Next Lesson' : 'Complete'}
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative dark:bg-slate-950">
                {module.type === 'quiz' ? (
                    <div className="flex-1 bg-gray-50 dark:bg-slate-950 overflow-y-auto p-8">
                        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                            {/* Quiz Header */}
                            <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100 dark:border-slate-800">
                                <div>
                                    <span className="bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Module Quiz</span>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{module.title}</h1>
                                </div>
                                
                                {/* Quiz Timer */}
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-bold text-sm ${
                                    timeRemaining < 30 
                                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 text-red-600 dark:text-red-400 animate-pulse' 
                                        : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-700 dark:text-slate-300'
                                }`}>
                                    <Clock size={16} />
                                    <span>Time Left: {formatTime(timeRemaining)}</span>
                                </div>
                            </div>                            {/* Quiz Result Message */}
                            {quizSubmitted && quizScore && (
                                <div className={`p-4 mb-6 rounded-2xl border flex items-start gap-3 ${
                                    quizScore.percentage >= 80
                                        ? 'bg-green-55 dark:bg-green-955/20 border-green-200 text-green-800 dark:text-green-300'
                                        : quizScore.percentage >= 50
                                            ? 'bg-amber-55 dark:bg-amber-955/20 border-amber-200 text-amber-800 dark:text-amber-300'
                                            : 'bg-red-55 dark:bg-red-955/20 border-red-200 text-red-800 dark:text-red-300'
                                }`}>
                                    {quizScore.percentage >= 80 ? (
                                        <CheckCircle className="shrink-0 text-green-600" size={20} />
                                    ) : (
                                        <XCircle className="shrink-0 text-red-600" size={20} />
                                    )}
                                    <div>
                                        <h4 className="font-bold">
                                            {quizScore.percentage >= 80 ? 'Excellent Job!' : quizScore.percentage >= 50 ? 'Nice Effort!' : 'Keep Practicing!'}
                                        </h4>
                                        <p className="text-xs mt-1">
                                            You scored <span className="font-extrabold text-sm">{quizScore.score} / {quizScore.total}</span> ({quizScore.percentage}%).
                                        </p>
                                        <p className="text-[11px] opacity-90 mt-1">
                                            Your marks have been updated on your dashboard. You can proceed to the next module, or retake this quiz if you want to improve your score.
                                        </p>
                                        <button 
                                            onClick={handleRetake}
                                            className={`mt-3 text-xs px-3.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-white ${
                                                quizScore.percentage >= 80
                                                    ? 'bg-green-650 hover:bg-green-700'
                                                    : quizScore.percentage >= 50
                                                        ? 'bg-amber-650 hover:bg-amber-700'
                                                        : 'bg-red-650 hover:bg-red-700'
                                            }`}
                                        >
                                            Retake Quiz
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Questions */}
                            <div className="space-y-6">
                                {(module.quizQuestions || []).map((q, qIdx) => (
                                    <div 
                                        key={q.id || qIdx} 
                                        className={`p-5 rounded-2xl border transition-all ${
                                            quizSubmitted 
                                                ? (selectedAnswers[qIdx] === q.correctAnswer)
                                                    ? 'bg-green-50/10 border-green-200'
                                                    : 'bg-red-50/10 border-red-200'
                                                : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800'
                                        }`}
                                    >
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                                            <span className="text-purple-600 dark:text-purple-400 font-mono mr-2">Q{qIdx + 1}.</span>
                                            {q.text}
                                        </h4>
                                        
                                        <div className="space-y-2">
                                            {(q.options || []).map((option, oIdx) => {
                                                const isSelected = selectedAnswers[qIdx] === oIdx;
                                                const isCorrectAnswer = q.correctAnswer === oIdx;
                                                let optionStyle = 'border-gray-200 dark:border-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300';
                                                
                                                if (quizSubmitted) {
                                                    if (isSelected) {
                                                        optionStyle = isCorrectAnswer 
                                                            ? 'border-green-500 bg-green-500/10 text-green-900 dark:text-green-200' 
                                                            : 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-200';
                                                    } else if (isCorrectAnswer) {
                                                        optionStyle = 'border-green-500/50 bg-green-500/5 text-green-700 dark:text-green-450';
                                                    }
                                                } else if (isSelected) {
                                                    optionStyle = 'border-purple-500 bg-purple-500/10 text-purple-900 dark:text-purple-200';
                                                }

                                                return (
                                                    <button
                                                        key={oIdx}
                                                        disabled={quizSubmitted}
                                                        onClick={() => {
                                                            setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
                                                        }}
                                                        className={`w-full p-3.5 rounded-xl border text-left text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer disabled:cursor-default ${optionStyle}`}
                                                    >
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border font-bold shrink-0 ${
                                                            isSelected 
                                                                ? 'bg-purple-600 text-white border-transparent' 
                                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                                                        }`}>
                                                            {['A', 'B', 'C', 'D'][oIdx]}
                                                        </span>
                                                        <span className="flex-1 leading-tight">{option}</span>
                                                        
                                                        {quizSubmitted && isSelected && (
                                                            isCorrectAnswer ? <CheckCircle size={18} className="text-green-600 shrink-0" /> : <XCircle size={18} className="text-red-600 shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Submit Button */}
                            {!quizSubmitted && (
                                <button
                                    onClick={() => handleQuizSubmit()}
                                    disabled={Object.keys(selectedAnswers).length < (module.quizQuestions || []).length}
                                    className={`w-full py-4 rounded-2xl font-bold transition-all mt-8 cursor-pointer ${
                                        Object.keys(selectedAnswers).length < (module.quizQuestions || []).length
                                            ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed border border-transparent'
                                            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-100'
                                    }`}
                                >
                                    Submit Quiz Answers
                                </button>
                            )}
                        </div>
                    </div>
                ) : module.type === 'video' ? (
                    <>
                        <div className="flex-[2.5] bg-black flex flex-col relative h-full">
                            <div className="flex-1 flex items-center justify-center p-4">
                                {module.videoUrl ? (
                                    <div className="flex flex-col items-center w-full">
                                        <video 
                                            ref={videoRef}
                                            src={module.videoUrl} 
                                            controls 
                                            autoPlay 
                                            onEnded={() => setIsVideoComplete(true)}
                                            className="w-full max-h-[75vh] rounded-xl shadow-2xl object-contain outline-none bg-black"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                        {/* Playback speed controller */}
                                        <div className="mt-3 flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-full border border-slate-800 text-xs text-white shadow-lg">
                                            <span className="text-gray-400 font-medium">Playback Speed:</span>
                                            {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                                                <button
                                                    type="button"
                                                    key={speed}
                                                    onClick={() => handleSpeedChange(speed)}
                                                    className={`px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer ${playbackSpeed === speed ? 'bg-purple-650 text-white shadow-sm font-extrabold' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    {speed}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
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
                        
                        {/* Notes & Q&A Sidebar */}
                        {renderRightSidebar('text-welile-purple', 'prose-violet')}
                    </>
                ) : module.type === 'audio' ? (
                    <>
                        <div className="flex-[2.5] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 relative h-full">
                            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 text-center space-y-6">
                                <div className="mx-auto w-24 h-24 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-md animate-pulse">
                                    <Headphones size={44} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{module.title}</h1>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Audio Lesson • {module.duration}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-850 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                                    {module.audioUrl ? (
                                        <audio 
                                            src={module.audioUrl} 
                                            controls 
                                            autoPlay 
                                            onEnded={() => setIsVideoComplete(true)}
                                            className="w-full focus:outline-none"
                                        >
                                            Your browser does not support the audio element.
                                        </audio>
                                    ) : (
                                        <p className="text-sm text-gray-400 dark:text-slate-500 italic">No audio source file provided.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Transcript & Q&A Sidebar */}
                        {renderRightSidebar('text-amber-500', 'prose-amber')}
                    </>
                ) : module.type === 'document' ? (
                    <div className="flex-1 bg-gray-50 dark:bg-slate-950 overflow-y-auto p-8">
                        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 min-h-full flex flex-col">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-xl">
                                        <File size={28} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{module.title}</h1>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Reference Document & Material</p>
                                    </div>
                                </div>
                                {module.fileUrl && (
                                    <a 
                                        href={module.fileUrl} 
                                        download={module.fileName || 'handout'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-150 dark:shadow-none shrink-0"
                                    >
                                        <File size={14} /> Download Document
                                    </a>
                                )}
                            </div>

                            {/* Embed PDF or show standard file preview */}
                            {module.fileUrl ? (
                                <div className="mb-8 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-950 flex-1 min-h-[450px] flex flex-col">
                                    {module.fileUrl.endsWith('.pdf') || module.fileName?.endsWith('.pdf') ? (
                                        <iframe 
                                            src={module.fileUrl} 
                                            className="w-full h-full flex-1"
                                            title={module.title}
                                        />
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gray-50 dark:bg-slate-850">
                                            <File className="text-indigo-400 dark:text-indigo-500 animate-bounce" size={64} />
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{module.fileName || 'document_file'}</h3>
                                                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto mt-1">This file type cannot be displayed directly in the browser. Please use the download button to view it locally.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                            
                            {module.content && (
                                <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-slate-355 leading-relaxed">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Document Summary & Reading Notes</h3>
                                    {renderFormattedContent(module.content)}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-gray-50 dark:bg-slate-950 overflow-y-auto p-8">
                        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 min-h-full">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{module.title}</h1>
                                        <p className="text-gray-500 dark:text-slate-400 mt-1">Reading Material</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="prose prose-violet dark:prose-invert max-w-none text-gray-700 dark:text-slate-300 leading-relaxed">
                                {module.content ? renderFormattedContent(module.content) : <span className="text-gray-400 dark:text-slate-500 italic">No content provided for this reading material.</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursePlayer;
