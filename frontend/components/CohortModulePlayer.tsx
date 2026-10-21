import React, { useState, useEffect } from 'react';
import { CourseModule, CourseNote, CohortSession } from '../types';
import { submitAttendanceCode, checkModuleCompletionStatus } from '../src/utils/progression';
import { Video, List, FileText, Calendar, Key, CheckCircle, Lock, PlayCircle, Loader2 } from 'lucide-react';
import { supabaseClient } from '../src/lib/supabaseClient';

interface CohortModulePlayerProps {
    module: CourseModule;
    userId: string;
    cohortId: string;
    onComplete: () => void;
}

export default function CohortModulePlayer({ module, userId, cohortId, onComplete }: CohortModulePlayerProps) {
    const [step, setStep] = useState<number>(1);
    
    // Data States
    const [courseNotes, setCourseNotes] = useState<CourseNote[]>([]);
    const [sessionData, setSessionData] = useState<CohortSession | null>(null);
    
    // Progression States
    const [attendanceCode, setAttendanceCode] = useState('');
    const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
    const [submittingCode, setSubmittingCode] = useState(false);
    const [quizPassed, setQuizPassed] = useState(false);

    useEffect(() => {
        const loadModuleData = async () => {
            // Load Course Notes
            const { data: notesData } = await supabaseClient
                .from('course_notes')
                .select('*')
                .eq('course_id', cohortId); // Assuming we can derive course_id or just fetch global notes
            if (notesData) setCourseNotes(notesData);

            // Load Session Data
            const { data: sessData } = await supabaseClient
                .from('cohort_sessions')
                .select('*')
                .eq('cohort_id', cohortId)
                .eq('module_id', module.id)
                .single();
            if (sessData) setSessionData(sessData);

            // Load Completion Status
            const status = await checkModuleCompletionStatus(userId, module.id);
            setAttendanceSubmitted(status.attendanceSubmitted);
            setQuizPassed(status.quizPassed);
            
            // Auto-advance step if attendance already submitted
            if (status.attendanceSubmitted && step < 6) {
                setStep(6);
            }
        };
        loadModuleData();
    }, [module.id, userId, cohortId]);

    const handleCodeSubmit = async () => {
        setSubmittingCode(true);
        const success = await submitAttendanceCode(userId, module.id, cohortId, attendanceCode);
        setSubmittingCode(false);
        
        if (success) {
            setAttendanceSubmitted(true);
            setStep(6); // Move to Quiz
        } else {
            alert('Invalid attendance code. Please check with your instructor.');
        }
    };

    const handleQuizComplete = async (score: number, passed: boolean) => {
        if (passed) {
            setQuizPassed(true);
            // Optionally update module_completions to set quiz_passed = true
            await supabaseClient.from('module_completions')
                .update({ quiz_passed: true })
                .eq('user_id', userId)
                .eq('module_id', module.id);
                
            onComplete();
        }
    };

    const getYoutubeVideoId = (url?: string) => {
        if (!url) return null;
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        return match ? match[1] : null;
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{module.title}</h1>
            
            {/* Step Navigation */}
            <div className="flex flex-wrap gap-2 mb-8">
                {[
                    { s: 1, label: 'Intro Video', icon: Video },
                    { s: 2, label: 'Outline', icon: List },
                    { s: 3, label: 'Notes', icon: FileText },
                    { s: 4, label: 'Live Session', icon: Calendar },
                    { s: 5, label: 'Attendance', icon: Key },
                    { s: 6, label: 'Quiz', icon: CheckCircle }
                ].map((item) => (
                    <button
                        key={item.s}
                        onClick={() => {
                            if (item.s === 6 && !attendanceSubmitted) return; // Locked
                            setStep(item.s);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
                            ${step === item.s 
                                ? 'bg-violet-600 text-white' 
                                : item.s === 6 && !attendanceSubmitted
                                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed opacity-50'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        <item.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                        {item.s === 6 && !attendanceSubmitted && <Lock className="w-3 h-3 ml-1" />}
                    </button>
                ))}
            </div>

            {/* Step Content */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-sm border border-gray-200 dark:border-slate-800">
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2"><Video className="text-violet-500" /> Module Introduction</h2>
                        {(() => {
                            const ytId = getYoutubeVideoId(module.introVideoUrl);
                            if (ytId) {
                                return (
                                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                                            title="Module Intro"
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                );
                            } else if (module.introVideoUrl) {
                                return (
                                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
                                        <video src={module.introVideoUrl} controls className="w-full h-full object-cover" />
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="aspect-video bg-gray-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-gray-500">
                                        <PlayCircle className="w-16 h-16 mb-4 opacity-50" />
                                        <p>No intro video provided for this module.</p>
                                    </div>
                                );
                            }
                        })()}
                        <button onClick={() => setStep(2)} className="mt-6 px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700">Continue to Outline</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2"><List className="text-violet-500" /> Course Outline</h2>
                        <div className="bg-gray-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                            {module.courseOutline && module.courseOutline.length > 0 ? (
                                <ul className="space-y-4">
                                    {module.courseOutline.map((topic, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs mt-0.5 shrink-0">{i + 1}</div>
                                            <span className="text-gray-700 dark:text-slate-300 leading-relaxed">{typeof topic === 'string' ? topic : JSON.stringify(topic)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">No outline provided.</p>
                            )}
                        </div>
                        <button onClick={() => setStep(3)} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700">Continue to Notes</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="text-violet-500" /> Global Course Notes</h2>
                        {courseNotes.length > 0 ? (
                            <div className="space-y-6">
                                {courseNotes.map(note => (
                                    <div key={note.id} className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-100 dark:border-slate-800" dangerouslySetInnerHTML={{ __html: note.content }} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No course notes available.</p>
                        )}
                        <button onClick={() => setStep(4)} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700">Continue to Live Session</button>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="text-violet-500" /> Physical Lesson</h2>
                        {sessionData ? (
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-8 rounded-3xl border border-violet-100 dark:border-violet-900/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Calendar className="w-48 h-48" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div>
                                        <p className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">Scheduled Time</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {new Date(sessionData.session_date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                    {sessionData.location_link && (
                                        <div>
                                            <p className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">Location / Link</p>
                                            <a href={sessionData.location_link.startsWith('http') ? sessionData.location_link : undefined} target="_blank" rel="noreferrer" className="text-lg font-medium text-gray-800 dark:text-slate-200 hover:text-violet-600 underline decoration-violet-300 underline-offset-4">
                                                {sessionData.location_link}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No live session scheduled for this module yet.</p>
                        )}
                        <button onClick={() => setStep(5)} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700">Continue to Attendance</button>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 max-w-lg">
                        <h2 className="text-2xl font-bold flex items-center gap-2"><Key className="text-violet-500" /> Attendance Code</h2>
                        {attendanceSubmitted ? (
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 p-6 rounded-2xl flex items-start gap-4">
                                <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
                                <div>
                                    <h3 className="text-lg font-bold text-green-800 dark:text-green-400">Attendance Verified</h3>
                                    <p className="text-green-600 dark:text-green-500 mt-1">You have successfully submitted the attendance code for this module. The quiz is now unlocked!</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 dark:text-slate-400">Please enter the 6-character attendance code provided by your instructor during the live session.</p>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        maxLength={6}
                                        value={attendanceCode}
                                        onChange={e => setAttendanceCode(e.target.value)}
                                        placeholder="Enter Code"
                                        className="flex-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-2xl tracking-[0.5em] font-mono font-bold text-center uppercase focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleCodeSubmit}
                                    disabled={submittingCode || attendanceCode.length < 3}
                                    className="w-full px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {submittingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Code'}
                                </button>
                            </>
                        )}
                        {attendanceSubmitted && (
                            <button onClick={() => setStep(6)} className="w-full px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700">Take Module Quiz</button>
                        )}
                    </div>
                )}

                {step === 6 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2"><CheckCircle className="text-violet-500" /> Module Quiz</h2>
                        {!attendanceSubmitted ? (
                            <div className="bg-amber-50 dark:bg-amber-950/30 p-8 rounded-3xl text-center border border-amber-200 dark:border-amber-900/50">
                                <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-2">Quiz Locked</h3>
                                <p className="text-amber-600 dark:text-amber-500">You must submit the LIVELESSON attendance code before taking the quiz.</p>
                                <button onClick={() => setStep(5)} className="mt-6 px-6 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600">Go to Attendance</button>
                            </div>
                        ) : (
                            <div className="text-center p-12 bg-gray-50 dark:bg-slate-950 rounded-3xl border border-gray-100 dark:border-slate-800">
                                {/* Normally we'd render the Quiz component here. Using a placeholder for integration */}
                                <h3 className="text-xl font-bold mb-4">Ready for the Quiz?</h3>
                                <p className="text-gray-500 mb-8">This quiz will test your knowledge on {module.title}.</p>
                                <button 
                                    onClick={() => handleQuizComplete(100, true)}
                                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                                >
                                    Start Quiz (Mock Pass)
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
