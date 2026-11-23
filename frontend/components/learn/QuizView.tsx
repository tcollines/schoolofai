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
            <div className="rounded-[22px] bg-lime-200 text-ink p-5 sm:p-6 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                    <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">{heading}</h2>
                    <p className="m-0 mt-1 text-[13px] font-semibold text-lime-900">{shown.length} questions · {passMark}% to pass</p>
                </div>
                {!result && (
                    <div className="shrink-0 text-right">
                        <p className="m-0 text-[22px] font-extrabold tabular-nums">{Object.keys(answers).filter(k => shown.some(q => q.id === k)).length}/{shown.length}</p>
                        <p className="m-0 text-[12px] font-semibold text-lime-900">answered</p>
                    </div>
                )}
            </div>

            {result && (
                <div
                    role="status"
                    className={`mt-4 rounded-[20px] p-5 ${result.passed
                        ? 'bg-mint-soft text-[#0E5A35] dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'bg-[#FFF3D6] text-[#6B4A00] dark:bg-amber-950/30 dark:text-amber-200'}`}
                >
                    <div className="flex items-start gap-3">
                        {result.passed ? <Trophy className="text-mint shrink-0 mt-0.5" /> : <RotateCcw className="text-amber-600 shrink-0 mt-0.5" />}
                        <div>
                            <p className="m-0 text-[16px] font-extrabold">{result.passed ? (passedLabel || 'Well done, you passed!') : 'Not quite there yet'}</p>
                            <p className="text-sm mt-1">
                                You scored {result.score} out of {result.total} ({result.pct}%).{' '}
                                {result.passed ? '' : `You need ${passMark}% to pass. ${grade ? 'The questions you missed are marked below. Review the lessons and try again.' : 'Read the explanations below and try again.'}`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <ol className="mt-4 p-0 list-none space-y-4">
                {shown.map((qq, qi) => {
                    const isWrong = !!result && wrong.has(qq.id);
                    const rev = review.get(qq.id);
                    return (
                        <li key={qq.id}>
                            <fieldset className={`${CARD} p-5`} disabled={!!result}>
                                <legend className="sr-only">Question {qi + 1}</legend>
                                <p className="m-0 text-[16px] font-bold leading-snug"><span className="inline-flex items-center justify-center w-7 h-7 mr-2 rounded-[9px] bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 text-[13px] font-extrabold align-[2px]">{qi + 1}</span>{qq.text}</p>
                                {result && isWrong && !rev && <p className="mt-2 text-sm font-medium text-red-600">Not correct</p>}
                                <div className="mt-4 space-y-2">
                                    {qq.options.map((opt, oi) => {
                                        const chosen = answers[qq.id] === oi;
                                        const isCorrectOption = !!result && !!rev && rev.correct === oi;
                                        const chosenRight = !!result && chosen && !isWrong;
                                        const chosenWrong = !!result && chosen && isWrong;
                                        return (
                                            <label
                                                key={oi}
                                                className={`press flex items-center gap-3 rounded-[14px] border-2 px-3 py-2.5 cursor-pointer text-[15px] leading-snug transition-colors min-h-[52px] focus-within:ring-2 focus-within:ring-brand
                                                    ${isCorrectOption || chosenRight ? 'border-mint bg-mint-soft dark:bg-emerald-950/40'
                                                        : chosenWrong ? 'border-[#F0533A] bg-[#FDECE8] dark:bg-red-950/30'
                                                            : chosen ? 'border-brand bg-brand-soft dark:bg-night-3'
                                                                : 'border-transparent bg-panel dark:bg-night-3/60 hover:border-[#D9D0F5]'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={qq.id}
                                                    checked={chosen}
                                                    onChange={() => setAnswers(a => ({ ...a, [qq.id]: oi }))}
                                                    className="sr-only"
                                                />
                                                <span aria-hidden="true" className={`w-8 h-8 shrink-0 rounded-[10px] inline-flex items-center justify-center text-[13px] font-extrabold ${chosen ? 'bg-brand text-white' : 'bg-white dark:bg-night-2 text-[#6B6680]'}`}>{String.fromCharCode(65 + oi)}</span>
                                                <span className="flex-1">{opt}</span>
                                                {(isCorrectOption || chosenRight) && <CheckCircle2 size={18} className="text-mint shrink-0" />}
                                                {chosenWrong && <XCircle size={18} className="text-red-500 shrink-0" />}
                                            </label>
                                        );
                                    })}
                                </div>
                                {rev?.explanation && <p className={`mt-3 text-sm ${MUTED}`}><span className="font-semibold text-ink dark:text-slate-100">Why: </span>{rev.explanation}</p>}
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
