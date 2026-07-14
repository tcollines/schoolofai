import React, { useState } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { Course, Quiz, Question } from '../../types';
import { Plus, X, ArrowRight, ArrowLeft, Save, AlertTriangle, Edit2, Check, RefreshCw } from 'lucide-react';

const AdminExams: React.FC = () => {
    const { courses, updateCourseQuiz, loading } = useAdmin(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // Wizard State
    const [step, setStep] = useState(1);
    const [examCourseId, setExamCourseId] = useState('');
    const [quizTitle, setQuizTitle] = useState('');
    const [timeLimit, setTimeLimit] = useState(30);
    const [preventTabChange, setPreventTabChange] = useState(true);
    const [questions, setQuestions] = useState<any[]>([]);

    const handleNext = () => setStep(s => Math.min(s + 1, 3));
    const handlePrev = () => setStep(s => Math.max(s - 1, 1));
    
    const handleAddQuestion = () => {
        setQuestions([...questions, {
            id: 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            text: '',
            type: 'multiple_choice',
            options: ['', '', '', ''],
            correctAnswer: 0
        }]);
    };

    const handleRemoveQuestion = (idx: number) => {
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const handleNewExam = () => {
        setIsEditing(false);
        setExamCourseId('');
        setQuizTitle('');
        setTimeLimit(30);
        setPreventTabChange(true);
        setQuestions([]);
        setStep(1);
        setIsWizardOpen(true);
    };

    const handleEditExam = (course: Course) => {
        if (!course.quiz) return;
        setIsEditing(true);
        setExamCourseId(course.id);
        setQuizTitle(course.quiz.title || '');
        setTimeLimit(course.quiz.timeLimit || 30);
        setPreventTabChange(course.quiz.preventTabChange !== false);
        setQuestions(course.quiz.questions.map(q => ({
            id: q.id || 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            text: q.text || '',
            type: q.type || 'multiple_choice',
            options: q.options ? [...q.options] : ['', '', '', ''],
            correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
            gradingGuide: q.gradingGuide || ''
        })));
        setStep(1);
        setIsWizardOpen(true);
    };

    const handlePublishDirectly = async (courseId: string, currentQuiz: Quiz) => {
        try {
            await updateCourseQuiz(courseId, {
                ...currentQuiz,
                isDraft: false
            });
            alert('Exam published successfully!');
        } catch (e) {
            alert('Error publishing exam.');
        }
    };

    const handleSave = async (isDraft: boolean) => {
        if (!examCourseId) return alert('Select a course first');
        if (!quizTitle.trim()) return alert('Please enter an exam title');
        if (questions.length === 0) return alert('Please add at least one question');
        
        // Validation check for empty questions or empty options
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) {
                return alert(`Question ${i + 1} has no text.`);
            }
            if (q.type === 'multiple_choice') {
                if (q.options.some((opt: string) => !opt.trim())) {
                    return alert(`Question ${i + 1} (Multiple Choice) has empty options.`);
                }
            }
        }

        try {
            const course = courses.find(c => c.id === examCourseId);
            const quizId = course?.quiz?.id || 'quiz-' + Date.now();
            
            await updateCourseQuiz(examCourseId, {
                id: quizId,
                title: quizTitle,
                questions,
                timeLimit,
                preventTabChange,
                isDraft
            });
            setIsWizardOpen(false);
            setStep(1);
            setQuestions([]);
            setQuizTitle('');
            setExamCourseId('');
            alert(isDraft ? 'Exam saved as draft successfully!' : 'Exam published successfully!');
        } catch (e) {
            alert('Error saving exam.');
        }
    };

    const coursesWithExams = courses.filter(c => c.quiz);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="animate-spin text-violet-600 dark:text-violet-400 w-8 h-8" />
                    <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">Loading exams...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-150 dark:border-slate-800 gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Examination Management</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Configure and publish strict exams with anti-cheat measures</p>
                </div>
                <button 
                    onClick={handleNewExam}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md shadow-violet-200 dark:shadow-none transition-colors cursor-pointer"
                >
                    <Plus size={18} /> New Exam Wizard
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesWithExams.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
                        No exams have been created yet.
                    </div>
                )}
                {coursesWithExams.map(c => (
                    <div key={c.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-150 dark:border-slate-800 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[190px]">
                        <div>
                            <div className="flex justify-between items-start mb-2.5">
                                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border shadow-xs tracking-wider shrink-0 ${
                                    c.quiz?.isDraft 
                                        ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50' 
                                        : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                                }`}>
                                    {c.quiz?.isDraft ? 'Draft' : 'Published'}
                                </span>
                                
                                {c.quiz?.preventTabChange && (
                                    <span className="bg-red-50 text-red-750 dark:bg-red-950/30 dark:text-red-400 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900/50 flex items-center gap-1">
                                        <AlertTriangle size={12} /> Strict Mode
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base mt-2 mb-1 line-clamp-2">{c.quiz?.title}</h3>
                            <p className="text-xs text-violet-650 dark:text-violet-400 mb-4 font-semibold">Course: {c.title}</p>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4 mt-auto">
                            <div className="flex gap-2 text-[11px] text-gray-500 dark:text-slate-400 font-bold">
                                <span className="bg-gray-100 dark:bg-slate-805 px-2 py-1 rounded-md">{c.quiz?.questions.length} Questions</span>
                                <span className="bg-gray-100 dark:bg-slate-805 px-2 py-1 rounded-md">{c.quiz?.timeLimit} Mins</span>
                            </div>
                            
                            <div className="flex gap-1.5">
                                {c.quiz?.isDraft && (
                                    <button
                                        onClick={() => handlePublishDirectly(c.id, c.quiz!)}
                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/50 text-[11px] px-2.5 py-1.5 rounded-xl font-extrabold transition-colors cursor-pointer"
                                    >
                                        Publish
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEditExam(c)}
                                    className="bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 border border-gray-200 dark:border-slate-700 text-[11px] px-2.5 py-1.5 rounded-xl font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <Edit2 size={12} /> Edit
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Exam Setup Wizard Modal */}
            {isWizardOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isEditing ? 'Edit Exam' : 'Exam Setup Wizard'}
                            </h2>
                            <button onClick={() => setIsWizardOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-350 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-gray-100 dark:bg-slate-800 h-1.5 w-full">
                            <div className="h-full bg-violet-600 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 space-y-6">
                            {step === 1 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-lg font-bold border-b border-gray-100 dark:border-slate-800 pb-2 text-gray-805 dark:text-slate-100">Step 1: Configuration</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">Select Course</label>
                                        <select 
                                            value={examCourseId} 
                                            onChange={e => setExamCourseId(e.target.value)} 
                                            disabled={isEditing}
                                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm text-gray-900 dark:text-white transition-all disabled:opacity-60"
                                        >
                                            <option value="">-- Choose Course --</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                        {isEditing && (
                                            <span className="text-[10px] text-gray-500 mt-1 block">Course selection cannot be changed when editing an exam.</span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">Exam Title</label>
                                        <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm text-gray-900 dark:text-white outline-none transition-all" placeholder="e.g. Final Certification Exam" />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-lg font-bold border-b border-gray-100 dark:border-slate-800 pb-2 text-gray-805 dark:text-slate-100">Step 2: Anti-Cheat Rules</h3>
                                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 p-4 rounded-2xl flex gap-3 text-orange-850 dark:text-orange-400">
                                        <AlertTriangle size={24} className="shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold mb-1 text-sm">Strict Exam Environment</p>
                                            <p className="text-xs leading-relaxed">Enabling strict mode will force the student's browser into full-screen. If they attempt to switch tabs or minimize the window, the exam will automatically submit their current answers immediately.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3.5 p-4 border border-gray-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-200" onClick={() => setPreventTabChange(!preventTabChange)}>
                                        <div className={`w-6 h-6 rounded flex items-center justify-center border shrink-0 transition-colors ${preventTabChange ? 'bg-violet-600 border-violet-600' : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                            {preventTabChange && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">Enable Fullscreen & Auto-Submit on Tab Change</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Highly recommended for certification exams.</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">Time Limit (Minutes)</label>
                                        <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-sm text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" min={1} />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-lg font-bold border-b border-gray-100 dark:border-slate-800 pb-2 text-gray-805 dark:text-slate-100 flex justify-between items-center">
                                        Step 3: Questions
                                        <button onClick={handleAddQuestion} className="text-xs bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50 px-3 py-1.5 rounded-xl font-bold hover:bg-violet-200/80 cursor-pointer">+ Add Question</button>
                                    </h3>
                                    
                                    {questions.length === 0 && (
                                        <div className="text-center py-10 text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-250 dark:border-slate-850 rounded-2xl">
                                            No questions added yet.
                                        </div>
                                    )}

                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="p-5 border border-gray-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 shadow-sm relative group/q">
                                            <button 
                                                onClick={() => handleRemoveQuestion(idx)}
                                                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                                                title="Delete Question"
                                            >
                                                <X size={16} />
                                            </button>

                                            <div className="flex justify-between items-center mb-4 pr-8">
                                                <h4 className="font-extrabold text-sm text-gray-700 dark:text-slate-350">Question {idx + 1}</h4>
                                                <select 
                                                    value={q.type} 
                                                    onChange={e => {
                                                        const newQ = [...questions];
                                                        newQ[idx].type = e.target.value;
                                                        // reset answers when type changes
                                                        newQ[idx].correctAnswer = e.target.value === 'true_false' ? true : e.target.value === 'short_answer' ? '' : 0;
                                                        setQuestions(newQ);
                                                    }} 
                                                    className="p-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-gray-900 dark:text-white rounded-lg outline-none focus:border-violet-500"
                                                >
                                                    <option value="multiple_choice">Multiple Choice</option>
                                                    <option value="true_false">True / False</option>
                                                    <option value="short_answer">Short Answer</option>
                                                    <option value="essay">Essay / Structured</option>
                                                </select>
                                            </div>
                                            <input 
                                                value={q.text} 
                                                onChange={e => {
                                                    const newQ = [...questions];
                                                    newQ[idx].text = e.target.value;
                                                    setQuestions(newQ);
                                                }} 
                                                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-sm text-gray-900 dark:text-white rounded-xl mb-4 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" 
                                                placeholder="Type the question here..." 
                                            />
                                            
                                            {q.type === 'multiple_choice' && (
                                                <div className="space-y-2.5">
                                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Configure Options & Select Correct Answer:</label>
                                                    {q.options.map((opt: string, optIdx: number) => (
                                                        <div key={optIdx} className="flex items-center gap-3">
                                                            <input 
                                                                type="radio" 
                                                                name={`correct-${q.id}`} 
                                                                checked={q.correctAnswer === optIdx} 
                                                                onChange={() => {
                                                                    const newQ = [...questions];
                                                                    newQ[idx].correctAnswer = optIdx;
                                                                    setQuestions(newQ);
                                                                }} 
                                                                className="w-4 h-4 text-violet-600 focus:ring-violet-500 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer" 
                                                            />
                                                            <input 
                                                                value={opt} 
                                                                onChange={e => {
                                                                    const newQ = [...questions];
                                                                    newQ[idx].options[optIdx] = e.target.value;
                                                                    setQuestions(newQ);
                                                                }} 
                                                                className="flex-1 p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-sm text-gray-900 dark:text-white rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25" 
                                                                placeholder={`Option ${optIdx + 1}`} 
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {q.type === 'true_false' && (
                                                <div className="space-y-1">
                                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Correct Answer:</label>
                                                    <select 
                                                        className="p-2.5 border border-gray-200 dark:border-slate-750 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white rounded-lg w-full outline-none focus:border-violet-500" 
                                                        value={q.correctAnswer ? 'true' : 'false'} 
                                                        onChange={e => {
                                                            const newQ = [...questions];
                                                            newQ[idx].correctAnswer = e.target.value === 'true';
                                                            setQuestions(newQ);
                                                        }}
                                                    >
                                                        <option value="true">True is Correct</option>
                                                        <option value="false">False is Correct</option>
                                                    </select>
                                                </div>
                                            )}

                                            {q.type === 'short_answer' && (
                                                <div className="space-y-1">
                                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Correct Answer Keyphrase:</label>
                                                    <input 
                                                        value={q.correctAnswer || ''} 
                                                        onChange={e => {
                                                            const newQ = [...questions];
                                                            newQ[idx].correctAnswer = e.target.value;
                                                            setQuestions(newQ);
                                                        }} 
                                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-sm text-gray-900 dark:text-white rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25" 
                                                        placeholder="Enter correct phrase or keywords..." 
                                                    />
                                                </div>
                                            )}

                                            {q.type === 'essay' && (
                                                <div className="space-y-2">
                                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Grading Guidelines / Sample Answer (Optional):</label>
                                                    <textarea 
                                                        value={q.gradingGuide || ''} 
                                                        onChange={e => {
                                                            const newQ = [...questions];
                                                            newQ[idx].gradingGuide = e.target.value;
                                                            setQuestions(newQ);
                                                        }} 
                                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-sm text-gray-900 dark:text-white rounded-xl outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 h-20 resize-y" 
                                                        placeholder="Enter grading guidelines or sample essay outline for reference..." 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <button 
                                onClick={handlePrev}
                                disabled={step === 1}
                                className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm ${step === 1 ? 'opacity-0 cursor-default pointer-events-none' : 'bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 cursor-pointer'}`}
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSave(true)}
                                    className="px-5 py-2.5 bg-gray-150 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-800 dark:text-slate-200 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                                >
                                    Save as Draft
                                </button>
                                
                                {step < 3 ? (
                                    <button 
                                        onClick={handleNext}
                                        className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-violet-700 shadow-md shadow-violet-200 dark:shadow-none transition-colors cursor-pointer text-sm"
                                    >
                                        Next <ArrowRight size={18} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleSave(false)}
                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-md shadow-emerald-200 dark:shadow-none transition-colors cursor-pointer text-sm"
                                    >
                                        <Save size={18} /> Publish Exam
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExams;
