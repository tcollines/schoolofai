import React, { useState, useEffect, useRef } from 'react';
import { Quiz } from '../types';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface ExamPlayerProps {
    quiz: Quiz;
    courseTitle: string;
    onClose: () => void;
    onSubmit: (score: number) => void;
}

const ExamPlayer: React.FC<ExamPlayerProps> = ({ quiz, courseTitle, onClose, onSubmit }) => {
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : 0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const submittingRef = useRef(false);
    const answersRef = useRef(answers);

    // Keep answersRef up to date to prevent stale closures in event listeners
    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    // Enter full screen when starting
    const startExam = async () => {
        if (containerRef.current) {
            try {
                if (containerRef.current.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                } else if ((containerRef.current as any).webkitRequestFullscreen) {
                    await (containerRef.current as any).webkitRequestFullscreen();
                }
            } catch (err) {
                console.error("Fullscreen failed:", err);
                alert("Fullscreen is required for this exam.");
                return;
            }
        }
        setStarted(true);
    };

    // Auto submit function
    const autoSubmit = () => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setIsSubmitting(true);

        if (document.fullscreenElement) {
            document.exitFullscreen().catch((err) => console.error("Error exiting fullscreen:", err));
        }

        // Simple scoring for now: just count selected correct answers for multiple choice
        let correctCount = 0;
        quiz.questions.forEach((q) => {
            if (answersRef.current[q.id] === q.correctAnswer) correctCount++;
        });
        const score = Math.round((correctCount / Math.max(quiz.questions.length, 1)) * 100);
        onSubmit(score);
    };

    // Timer and Anti-Cheat Listeners
    useEffect(() => {
        if (!started || isSubmitting) return;

        // 1. Timer
        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    autoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // 2. Tab Change/Minimize Detection
        const handleVisibilityChange = () => {
            if (document.hidden && !submittingRef.current) {
                alert("Strict Mode Violation: You left the exam environment (tab switched or minimized). Your exam has been automatically submitted.");
                autoSubmit();
            }
        };

        // 3. Fullscreen Exit Detection
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !submittingRef.current) {
                alert("Strict Mode Violation: You exited full screen mode. Your exam has been automatically submitted.");
                autoSubmit();
            }
        };

        // 4. Focus Loss Detection (e.g., another window in front of it)
        const handleWindowBlur = () => {
            if (!submittingRef.current) {
                alert("Strict Mode Violation: Lost focus on the exam window. Your exam has been automatically submitted.");
                autoSubmit();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            clearInterval(timerId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [started, isSubmitting]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div ref={containerRef} className={`fixed inset-0 z-[100] flex flex-col h-screen ${started ? 'bg-gray-50' : 'bg-slate-900 items-center justify-center p-4'}`}>
            {!started ? (
                <div className="bg-white rounded-3xl max-w-2xl w-full p-8 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                    <p className="text-gray-500 mb-8">{courseTitle}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="text-gray-500 text-sm mb-1 font-medium">Questions</div>
                            <div className="font-bold text-xl">{quiz.questions.length}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="text-gray-500 text-sm mb-1 font-medium">Time Limit</div>
                            <div className="font-bold text-xl">{quiz.timeLimit} Minutes</div>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-left mb-8 flex gap-3">
                        <AlertTriangle className="text-red-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-red-900 mb-1">Strict Exam Rules</h4>
                            <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                                <li>The exam will run in full screen.</li>
                                <li>Do not exit full screen or minimize the browser.</li>
                                <li>Do not switch tabs or open other applications.</li>
                                <li>Do not click outside of or blur the exam window (no other windows in front).</li>
                                <li>Violations will result in immediate automatic submission.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                            Cancel
                        </button>
                        <button onClick={startExam} className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                            Start Exam Now
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0 shadow-sm">
                        <div>
                            <h2 className="font-bold text-lg text-gray-900">{quiz.title}</h2>
                            <p className="text-xs text-gray-500">{courseTitle}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="bg-red-100 text-red-700 px-3 py-1 text-xs font-bold uppercase rounded-full flex items-center gap-1">
                                <AlertTriangle size={14} /> Strict Mode
                            </span>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
                                <Clock size={20} />
                                {formatTime(timeLeft)}
                            </div>
                            <button onClick={autoSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                                Submit
                            </button>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                        <div className="max-w-3xl mx-auto space-y-8 pb-20">
                            {quiz.questions.map((q, idx) => (
                                <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg mb-4 text-gray-900">
                                        <span className="text-indigo-600 mr-2">{idx + 1}.</span>
                                        {q.text}
                                    </h3>

                                    {q.type === 'multiple_choice' && (
                                        <div className="space-y-3">
                                            {q.options?.map((opt: string, optIdx: number) => (
                                                <label key={optIdx} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${answers[q.id] === optIdx ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                    <input 
                                                        type="radio" 
                                                        name={q.id}
                                                        className="w-5 h-5 text-indigo-600"
                                                        checked={answers[q.id] === optIdx}
                                                        onChange={() => setAnswers({...answers, [q.id]: optIdx})}
                                                    />
                                                    <span className="font-medium text-gray-700">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'true_false' && (
                                        <div className="flex gap-4">
                                            <label className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${answers[q.id] === true ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                <input type="radio" className="hidden" checked={answers[q.id] === true} onChange={() => setAnswers({...answers, [q.id]: true})} />
                                                <span className="font-bold text-gray-700">True</span>
                                            </label>
                                            <label className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${answers[q.id] === false ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                <input type="radio" className="hidden" checked={answers[q.id] === false} onChange={() => setAnswers({...answers, [q.id]: false})} />
                                                <span className="font-bold text-gray-700">False</span>
                                            </label>
                                        </div>
                                    )}

                                    {q.type === 'short_answer' && (
                                        <textarea 
                                            className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[120px]"
                                            placeholder="Type your answer here..."
                                            value={answers[q.id] || ''}
                                            onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExamPlayer;
