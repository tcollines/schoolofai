import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { shuffleOptions } from '../../src/content/aiFundamentals';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, MUTED } from './learnUi';

export interface QuizQ {
    id: string;
    text: string;
    options: string[];
    /** present for locally marked module quizzes; never present for the server-marked final */
    correct?: number;
    explanation?: string;
}

export interface GradeResult {
    score: number;
    total: number;
    pct: number;
    passed: boolean;
    wrongIds: string[];
    /** answers and explanations, revealed by the server only after a pass */
    review?: { id: string; correct: number; explanation: string }[];
}

interface Props {
    questions: QuizQ[];
    passMark: number;
    heading: string;
    /** Module quizzes: marked here in the browser, then reported through onSubmit. */
    onSubmit?: (score: number, total: number, answers: Record<string, number>) => Promise<void> | void;
    /** Final assessment: marked by the server. Options arrive already shuffled. */
    grade?: (answers: Record<string, number>) => Promise<GradeResult>;
    /** Server mode: how to get a fresh attempt after a failed one. */
    onRetry?: () => void;
    onPassed?: () => void;
    disabledReason?: string | null;
    passedLabel?: string;
}

const QuizView: React.FC<Props> = ({ questions, passMark, heading, onSubmit, grade, onRetry, onPassed, disabledReason, passedLabel }) => {
    const [seed, setSeed] = useState(() => Date.now() % 100000);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [result, setResult] = useState<GradeResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const shown = useMemo(
        () => (grade ? questions : questions.map((qq, i) => shuffleOptions(qq as any, seed + i * 7919) as QuizQ)),
        [questions, seed, grade]
    );
    const allAnswered = shown.every(qq => answers[qq.id] !== undefined);

    const submit = async () => {
        if (!allAnswered || busy) return;
        setBusy(true);
        setError(null);
        try {
            let res: GradeResult;
            if (grade) {
                res = await grade(answers);
            } else {
                const wrongIds = shown.filter(qq => answers[qq.id] !== qq.correct).map(qq => qq.id);
                const score = shown.length - wrongIds.length;
                const pct = Math.round((score / shown.length) * 100);
                res = {
                    score, total: shown.length, pct, passed: pct >= passMark, wrongIds,
                    review: shown.map(qq => ({ id: qq.id, correct: qq.correct as number, explanation: qq.explanation || '' }))
                };
                await onSubmit?.(score, shown.length, answers);
            }
            setResult(res);
            if (res.passed) onPassed?.();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e: any) {
            setError(e?.message || 'Something went wrong. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const retake = () => {
        setAnswers({});
        setResult(null);
        setError(null);
        if (grade) { onRetry?.(); return; }
        setSeed(Date.now() % 100000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const wrong = new Set(result?.wrongIds || []);
    const review = new Map((result?.review || []).map(r => [r.id, r]));

    return (
        <div>
            <h2 className="font-serif text-2xl font-semibold">{heading}</h2>
            <p className={`mt-1 text-sm ${MUTED}`}>{shown.length} questions · {passMark}% to pass</p>

            {result && (
                <div
                    role="status"
                    className={`mt-5 rounded-2xl p-5 border ${result.passed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900'
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'}`}
                >
                    <div className="flex items-start gap-3">
                        {result.passed ? <Trophy className="text-emerald-600 shrink-0 mt-0.5" /> : <RotateCcw className="text-amber-600 shrink-0 mt-0.5" />}
                        <div>
                            <p className="font-semibold">{result.passed ? (passedLabel || 'Well done, you passed!') : 'Not quite there yet'}</p>
                            <p className="text-sm mt-1">
                                You scored {result.score} out of {result.total} ({result.pct}%).{' '}
                                {result.passed ? '' : `You need ${passMark}% to pass. ${grade ? 'The questions you missed are marked below. Review the lessons and try again.' : 'Read the explanations below and try again.'}`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <ol className="mt-6 space-y-5">
                {shown.map((qq, qi) => {
                    const isWrong = !!result && wrong.has(qq.id);
                    const rev = review.get(qq.id);
                    return (
                        <li key={qq.id}>
                            <fieldset className={`${CARD} rounded-2xl p-5`} disabled={!!result}>
                                <legend className="sr-only">Question {qi + 1}</legend>
                                <p className="font-medium leading-snug"><span className="text-violet-700 dark:text-violet-400 font-semibold">{qi + 1}.</span> {qq.text}</p>
                                {result && isWrong && !rev && <p className="mt-2 text-sm font-medium text-red-600">Not correct</p>}
                                <div className="mt-3 space-y-2">
                                    {qq.options.map((opt, oi) => {
                                        const chosen = answers[qq.id] === oi;
                                        const isCorrectOption = !!result && !!rev && rev.correct === oi;
                                        const chosenRight = !!result && chosen && !isWrong;
                                        const chosenWrong = !!result && chosen && isWrong;
                                        return (
                                            <label
                                                key={oi}
                                                className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer text-[15px] leading-snug transition-colors min-h-[48px]
                                                    ${isCorrectOption || chosenRight ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                                                        : chosenWrong ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
                                                            : chosen ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40'
                                                                : 'border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={qq.id}
                                                    checked={chosen}
                                                    onChange={() => setAnswers(a => ({ ...a, [qq.id]: oi }))}
                                                    className="mt-1 accent-violet-700 shrink-0"
                                                />
                                                <span className="flex-1">{opt}</span>
                                                {(isCorrectOption || chosenRight) && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
                                                {chosenWrong && <XCircle size={18} className="text-red-500 shrink-0" />}
                                            </label>
                                        );
                                    })}
                                </div>
                                {rev?.explanation && <p className={`mt-3 text-sm ${MUTED}`}><span className="font-semibold text-[#1c1917] dark:text-slate-100">Why: </span>{rev.explanation}</p>}
                            </fieldset>
                        </li>
                    );
                })}
            </ol>

            {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {!result ? (
                    <>
                        <button onClick={submit} disabled={!allAnswered || busy || !!disabledReason} className={BTN_PRIMARY}>
                            {busy ? 'Submitting...' : 'Submit answers'}
                        </button>
                        {!allAnswered && <span className={`text-sm self-center ${MUTED}`}>Answer every question to submit.</span>}
                        {disabledReason && <span className="text-sm self-center text-amber-700 dark:text-amber-400">{disabledReason}</span>}
                    </>
                ) : (
                    !result.passed && <button onClick={retake} className={BTN_SECONDARY}><RotateCcw size={16} /> Try again</button>
                )}
            </div>
        </div>
    );
};

export default QuizView;
