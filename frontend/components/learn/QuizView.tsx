import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { QuizQuestion, shuffleOptions } from '../../src/content/aiFundamentals';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, MUTED } from './learnUi';

interface Props {
    questions: QuizQuestion[];
    passMark: number;
    heading: string;
    /** Called once per submission. Return nothing; the caller stores the attempt. */
    onSubmit: (score: number, total: number, answers: Record<string, number>) => Promise<void> | void;
    onPassed?: () => void;
    /** hide the answer explanations until after submit (always true) and cap the retries if given */
    disabledReason?: string | null;
    passedLabel?: string;
}

/** One question per screen on phones is friendlier, but a single scrolling list works everywhere and keeps the code simple. */
const QuizView: React.FC<Props> = ({ questions, passMark, heading, onSubmit, onPassed, disabledReason, passedLabel }) => {
    const [seed, setSeed] = useState(() => Date.now() % 100000);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [result, setResult] = useState<{ score: number; total: number; pct: number; passed: boolean } | null>(null);
    const [busy, setBusy] = useState(false);

    const shuffled = useMemo(() => questions.map((qq, i) => shuffleOptions(qq, seed + i * 7919)), [questions, seed]);
    const allAnswered = shuffled.every(qq => answers[qq.id] !== undefined);

    const submit = async () => {
        if (!allAnswered || busy) return;
        setBusy(true);
        const score = shuffled.filter(qq => answers[qq.id] === qq.correct).length;
        const pct = Math.round((score / shuffled.length) * 100);
        const passed = pct >= passMark;
        try {
            await onSubmit(score, shuffled.length, answers);
        } finally {
            setBusy(false);
        }
        setResult({ score, total: shuffled.length, pct, passed });
        if (passed) onPassed?.();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const retake = () => {
        setAnswers({});
        setResult(null);
        setSeed(Date.now() % 100000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div>
            <h2 className="font-serif text-2xl font-semibold">{heading}</h2>
            <p className={`mt-1 text-sm ${MUTED}`}>{shuffled.length} questions · {passMark}% to pass</p>

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
                            <p className="font-semibold">
                                {result.passed ? (passedLabel || 'Well done, you passed!') : 'Not quite there yet'}
                            </p>
                            <p className="text-sm mt-1">
                                You scored {result.score} out of {result.total} ({result.pct}%).{' '}
                                {result.passed ? '' : `You need ${passMark}% to pass. Read the explanations below and try again.`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <ol className="mt-6 space-y-5">
                {shuffled.map((qq, qi) => (
                    <li key={qq.id}>
                        <fieldset className={`${CARD} rounded-2xl p-5`} disabled={!!result}>
                            <legend className="sr-only">Question {qi + 1}</legend>
                            <p className="font-medium leading-snug"><span className="text-violet-700 dark:text-violet-400 font-semibold">{qi + 1}.</span> {qq.text}</p>
                            <div className="mt-3 space-y-2">
                                {qq.options.map((opt, oi) => {
                                    const chosen = answers[qq.id] === oi;
                                    const isCorrect = result && oi === qq.correct;
                                    const isWrongChoice = result && chosen && oi !== qq.correct;
                                    return (
                                        <label
                                            key={oi}
                                            className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer text-[15px] leading-snug transition-colors min-h-[48px]
                                                ${isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                                                    : isWrongChoice ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
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
                                            {isCorrect && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
                                            {isWrongChoice && <XCircle size={18} className="text-red-500 shrink-0" />}
                                        </label>
                                    );
                                })}
                            </div>
                            {result && <p className={`mt-3 text-sm ${MUTED}`}><span className="font-semibold text-[#1c1917] dark:text-slate-100">Why: </span>{qq.explanation}</p>}
                        </fieldset>
                    </li>
                ))}
            </ol>

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
