import React, { useState } from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { Plus, X, ArrowRight, ArrowLeft, Save, AlertTriangle } from 'lucide-react';

const AdminExams: React.FC = () => {
    const { courses, updateCourseQuiz, loading } = useAdmin(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    
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
            id: Math.random().toString(),
            text: '',
            type: 'multiple_choice',
            options: ['', '', '', ''],
            correctAnswer: 0
        }]);
    };

    const handleSave = async () => {
        if (!examCourseId) return alert('Select a course first');
        try {
            await updateCourseQuiz(examCourseId, {
                id: Math.random().toString(),
                title: quizTitle,
                questions,
                timeLimit,
                preventTabChange
            });
            setIsWizardOpen(false);
            setStep(1);
            setQuestions([]);
            setQuizTitle('');
            alert('Exam saved successfully!');
        } catch (e) {
            alert('Error saving exam.');
        }
    };

    const coursesWithExams = courses.filter(c => c.quiz);

    if (loading) return <div>Loading exams...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Examination Management</h2>
                    <p className="text-sm text-gray-500">Configure strict exams with anti-cheat measures</p>
                </div>
                <button 
                    onClick={() => setIsWizardOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={18} /> New Exam Wizard
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesWithExams.length === 0 && (
                    <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                        No exams have been created yet.
                    </div>
                )}
                {coursesWithExams.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                        {c.quiz?.preventTabChange && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                <AlertTriangle size={12} /> Strict Mode
                            </div>
                        )}
                        <h3 className="font-bold text-gray-900 mb-1 pr-16">{c.quiz?.title}</h3>
                        <p className="text-sm text-violet-600 mb-4 font-medium">Course: {c.title}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded">{c.quiz?.questions.length} Questions</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">{c.quiz?.timeLimit} Mins</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Exam Setup Wizard Modal */}
            {isWizardOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Exam Setup Wizard</h2>
                            <button onClick={() => setIsWizardOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-gray-100 h-1 w-full">
                            <div className="h-full bg-violet-600 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1">
                            {step === 1 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-lg font-semibold border-b pb-2">Step 1: Configuration</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                                        <select value={examCourseId} onChange={e => setExamCourseId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all">
                                            <option value="">-- Choose Course --</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                                        <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" placeholder="e.g. Final Certification Exam" />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-lg font-semibold border-b pb-2 text-gray-900 dark:text-slate-100">Step 2: Anti-Cheat Rules</h3>
                                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 p-4 rounded-xl flex gap-3 text-orange-800 dark:text-orange-300">
                                        <AlertTriangle size={24} className="shrink-0" />
                                        <div>
                                            <p className="font-bold mb-1">Strict Exam Environment</p>
                                            <p className="text-sm">Enabling strict mode will force the student's browser into full-screen. If they attempt to switch tabs or minimize the window, the exam will automatically submit their current answers immediately.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-200" onClick={() => setPreventTabChange(!preventTabChange)}>
                                        <div className={`w-6 h-6 rounded flex items-center justify-center border ${preventTabChange ? 'bg-violet-600 border-violet-600' : 'border-gray-300 dark:border-slate-600'}`}>
                                            {preventTabChange && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-950 dark:text-slate-200">Enable Fullscreen & Auto-Submit on Tab Change</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">Highly recommended for certification exams.</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-350 mb-1">Time Limit (Minutes)</label>
                                        <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-lg font-semibold border-b pb-2 flex justify-between items-center">
                                        Step 3: Questions
                                        <button onClick={handleAddQuestion} className="text-sm bg-violet-100 text-violet-700 px-3 py-1 rounded-lg hover:bg-violet-200">+ Add</button>
                                    </h3>
                                    
                                    {questions.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                            No questions added yet.
                                        </div>
                                    )}

                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-gray-700">Question {idx + 1}</h4>
                                                <select value={q.type} onChange={e => {
                                                    const newQ = [...questions];
                                                    newQ[idx].type = e.target.value;
                                                    setQuestions(newQ);
                                                }} className="p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-500">
                                                    <option value="multiple_choice">Multiple Choice</option>
                                                    <option value="true_false">True / False</option>
                                                    <option value="short_answer">Short Answer</option>
                                                    <option value="essay">Essay / Structured</option>
                                                </select>
                                            </div>
                                            <input value={q.text} onChange={e => {
                                                const newQ = [...questions];
                                                newQ[idx].text = e.target.value;
                                                setQuestions(newQ);
                                            }} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4 outline-none focus:border-violet-500" placeholder="Type the question here..." />
                                            
                                            {q.type === 'multiple_choice' && (
                                                <div className="space-y-2">
                                                    {q.options.map((opt: string, optIdx: number) => (
                                                        <div key={optIdx} className="flex items-center gap-3">
                                                            <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === optIdx} onChange={() => {
                                                                const newQ = [...questions];
                                                                newQ[idx].correctAnswer = optIdx;
                                                                setQuestions(newQ);
                                                            }} className="w-4 h-4 text-violet-600" />
                                                            <input value={opt} onChange={e => {
                                                                const newQ = [...questions];
                                                                newQ[idx].options[optIdx] = e.target.value;
                                                                setQuestions(newQ);
                                                            }} className="flex-1 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-violet-500" placeholder={`Option ${optIdx + 1}`} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {q.type === 'true_false' && (
                                                <select className="p-2 border border-gray-200 bg-gray-50 rounded-lg w-full outline-none focus:border-violet-500" value={q.correctAnswer ? 'true' : 'false'} onChange={e => {
                                                    const newQ = [...questions];
                                                    newQ[idx].correctAnswer = e.target.value === 'true';
                                                    setQuestions(newQ);
                                                }}>
                                                    <option value="true">True is Correct</option>
                                                    <option value="false">False is Correct</option>
                                                </select>
                                            )}
                                            {q.type === 'essay' && (
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Grading Guidelines / Sample Answer (Optional)</label>
                                                    <textarea 
                                                        value={q.gradingGuide || ''} 
                                                        onChange={e => {
                                                            const newQ = [...questions];
                                                            newQ[idx].gradingGuide = e.target.value;
                                                            setQuestions(newQ);
                                                        }} 
                                                        className="w-full p-2.5 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:border-violet-500 h-20" 
                                                        placeholder="Enter grading guidelines or sample essay outline for reference..." 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between">
                            <button 
                                onClick={handlePrev}
                                disabled={step === 1}
                                className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                            
                            {step < 3 ? (
                                <button 
                                    onClick={handleNext}
                                    className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-violet-700 shadow-md shadow-violet-200 transition-colors"
                                >
                                    Next Step <ArrowRight size={18} />
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSave}
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-green-700 shadow-md shadow-green-200 transition-colors"
                                >
                                    <Save size={18} /> Save Exam
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExams;
