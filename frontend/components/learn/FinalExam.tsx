import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Lock } from 'lucide-react';
import { COURSE, drawFinalQuestions } from '../../src/content/aiFundamentals';
import { completionState, finalAttemptsLast24h, loadAttempts, submitAttempt } from '../../src/lib/learnApi';
import { useLearn } from './learnContext';
import QuizView from './QuizView';
import { BTN_PRIMARY, CARD, MUTED } from './learnUi';

const FinalExam: React.FC = () => {
    const { uid, progress, markComplete, bump, attemptsTick, cert } = useLearn();
    const navigate = useNavigate();
    const base = `/learn/${COURSE.slug}`;
    const state = completionState(progress, uid);

    // a fresh set of questions for every attempt
    const attemptCount = useMemo(() => loadAttempts(uid).filter(a => a.quizId === 'final').length, [uid, attemptsTick]);
    const questions = useMemo(() => drawFinalQuestions(attemptCount * 977 + 31 + uid.length), [attemptCount, uid]);
    const recent = finalAttemptsLast24h(uid);
    const blocked = !state.finalPassed && recent.length >= COURSE.finalAttemptsPer24h;

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

    if (state.finalPassed) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 text-center">
                <Award className="mx-auto text-violet-700" size={44} />
                <h1 className="font-serif text-3xl font-semibold mt-4">You passed the final assessment</h1>
                <p className={`mt-2 ${MUTED}`}>{cert ? 'Your certificate is ready.' : 'One last step: confirm your name and collect your certificate.'}</p>
                <Link to={`${base}/certificate`} className={`${BTN_PRIMARY} mt-6`}>{cert ? 'View certificate' : 'Get your certificate'}</Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <div className={`${CARD} rounded-2xl p-5 mb-6`}>
                <p className="font-semibold">Before you begin</p>
                <ul className={`mt-2 text-sm space-y-1 ${MUTED} list-disc list-inside`}>
                    <li>{COURSE.finalQuestions} questions, {COURSE.passFinal}% to pass.</li>
                    <li>You can try {COURSE.finalAttemptsPer24h} times in 24 hours. Each try has a fresh set of questions.</li>
                    <li>You have used {recent.length} of {COURSE.finalAttemptsPer24h} attempts in the last 24 hours.</li>
                </ul>
            </div>

            <QuizView
                key={attemptCount}
                heading="Final assessment"
                questions={questions}
                passMark={COURSE.passFinal}
                disabledReason={blocked ? 'You have used all attempts for today. Come back in 24 hours.' : null}
                onSubmit={async (score, total, answers) => {
                    const attempt = await submitAttempt(uid, 'final', score, total, COURSE.passFinal, answers);
                    if (attempt.passed) await markComplete('final');
                    bump();
                }}
                onPassed={() => setTimeout(() => navigate(`${base}/certificate`), 2500)}
                passedLabel="You passed the final assessment! Taking you to your certificate..."
            />
        </div>
    );
};

export default FinalExam;
