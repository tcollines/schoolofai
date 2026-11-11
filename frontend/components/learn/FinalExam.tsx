import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Loader2, Lock } from 'lucide-react';
import { COURSE } from '../../src/content/aiFundamentals';
import { ExamStart, completionState, startFinalExam, submitFinalExam } from '../../src/lib/learnApi';
import { useLearn } from './learnContext';
import QuizView, { GradeResult } from './QuizView';
import { BTN_PRIMARY, CARD, MUTED } from './learnUi';

/** The final assessment is served and marked by the server, so the answers are never in the browser. */
const FinalExam: React.FC = () => {
    const { uid, progress, refresh, cert } = useLearn();
    const base = `/learn/${COURSE.slug}`;
    const state = completionState(progress);

    const [exam, setExam] = useState<ExamStart | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [round, setRound] = useState(0);
    const [justPassed, setJustPassed] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setExam(await startFinalExam());
        } catch (e: any) {
            setExam(null);
            setError(e?.message || 'Could not load the final assessment.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (state.allItemsDone && !state.finalPassed) void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid, state.allItemsDone, state.finalPassed]);

    if (!state.allItemsDone && !state.finalPassed) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 text-center">
                <Lock className="mx-auto text-stone-400" size={40} />
                <h1 className="font-serif text-2xl font-semibold mt-4">The final assessment is locked</h1>
                <p className={`mt-2 ${MUTED}`}>Complete every lesson and pass each module quiz first. You have finished {state.done} of {state.total} items.</p>
                <Link to={base} className={`${BTN_PRIMARY} mt-6`}>Back to the course</Link>
            </div>
        );
    }

    if ((state.finalPassed || exam?.passed) && !justPassed) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 text-center">
                <Award className="mx-auto text-violet-700" size={44} />
                <h1 className="font-serif text-3xl font-semibold mt-4">You passed the final assessment</h1>
                <p className={`mt-2 ${MUTED}`}>{cert ? 'Your certificate is ready.' : 'One last step: confirm your name and collect your certificate.'}</p>
                <Link to={`${base}/certificate`} className={`${BTN_PRIMARY} mt-6`}>{cert ? 'View certificate' : 'Get your certificate'}</Link>
            </div>
        );
    }

    if (loading || (!exam && !error)) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-violet-700" aria-label="Loading the assessment" /></div>;
    }

    if (error || !exam || !exam.attemptId) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 text-center">
                <Lock className="mx-auto text-stone-400" size={40} />
                <h1 className="font-serif text-2xl font-semibold mt-4">Final assessment</h1>
                <p className={`mt-2 ${MUTED}`}>{error || 'The final assessment is not available right now.'}</p>
                <button onClick={() => void load()} className={`${BTN_PRIMARY} mt-6`}>Try again</button>
            </div>
        );
    }

    const attemptId = exam.attemptId;
    const grade = async (answers: Record<string, number>): Promise<GradeResult> => {
        const r = await submitFinalExam(attemptId, answers);
        return { score: r.score, total: r.total, pct: r.pct, passed: r.passed, wrongIds: r.wrongIds, review: r.review };
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <div className={`${CARD} rounded-2xl p-5 mb-6`}>
                <p className="font-semibold">Before you begin</p>
                <ul className={`mt-2 text-sm space-y-1 ${MUTED} list-disc list-inside`}>
                    <li>{exam.questions.length} questions, {exam.passMark}% to pass.</li>
                    <li>You can try {exam.attemptsAllowed} times in 24 hours. Each try has a fresh set of questions.</li>
                    <li>This is attempt {exam.attemptsUsed} of {exam.attemptsAllowed} in the last 24 hours.</li>
                    <li>If you refresh the page you will keep the same questions.</li>
                </ul>
            </div>

            <QuizView
                key={`${attemptId}-${round}`}
                heading="Final assessment"
                questions={exam.questions}
                passMark={exam.passMark}
                grade={grade}
                onRetry={() => { setRound(r => r + 1); void load(); }}
                onPassed={() => { setJustPassed(true); void refresh(); }}
                passedLabel="You passed the final assessment! Review your answers below, then collect your certificate."
            />
            {justPassed && (
                <div className="mt-6">
                    <Link to={`${base}/certificate`} className={BTN_PRIMARY}><Award size={18} /> Get your certificate</Link>
                </div>
            )}
        </div>
    );
}

export default FinalExam;
