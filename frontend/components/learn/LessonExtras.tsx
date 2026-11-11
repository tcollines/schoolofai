import React, { useEffect, useState } from 'react';
import { Star, Send, Lock, Globe2, MessageCircle, Wifi, Headphones } from 'lucide-react';
import { askQuestion, loadLessonRating, loadQuestions, saveLessonRating, LessonQuestion } from '../../src/lib/learnApi';
import { BTN_PRIMARY, CARD, MUTED, PlayerPrefs, formatLocal } from './learnUi';

const FIELD = 'w-full rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';

/** Data-saver and audio-only switches. */
export const PlayerPrefsBar: React.FC<{ prefs: PlayerPrefs; onChange: (p: Partial<PlayerPrefs>) => void }> = ({ prefs, onChange }) => (
    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Playback options">
        {([
            ['dataSaver', 'Data saver', Wifi, 'Does not preload video and asks for lower quality'],
            ['audioOnly', 'Audio only', Headphones, 'Hides the video and shows the transcript']
        ] as const).map(([key, label, Icon, hint]) => (
            <button
                key={key}
                type="button"
                role="switch"
                aria-checked={prefs[key]}
                title={hint}
                onClick={() => onChange({ [key]: !prefs[key] })}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${prefs[key] ? 'border-violet-700 bg-violet-50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200' : 'border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300'}`}
            >
                <Icon size={15} /> {label}: {prefs[key] ? 'on' : 'off'}
            </button>
        ))}
    </div>
);

export const TranscriptView: React.FC<{ paragraphs: string[] }> = ({ paragraphs }) => (
    <div className="pt-5 space-y-4 max-w-prose">
        <p className={`text-sm ${MUTED}`}>Everything the presenter says in this lesson, written out. You can read it instead of watching.</p>
        {paragraphs.map((p, i) => <p key={i} className="text-[16px] leading-relaxed">{p}</p>)}
    </div>
);

/** 1 to 5 star rating with an optional comment. */
export const LessonRating: React.FC<{ uid: string; itemId: string }> = ({ uid, itemId }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let live = true;
        setRating(0); setComment(''); setSaved(false);
        void loadLessonRating(uid, itemId).then(r => { if (live && r) { setRating(r.rating); setComment(r.comment); setSaved(true); } });
        return () => { live = false; };
    }, [uid, itemId]);

    const save = async (r = rating) => {
        if (!r) return;
        setBusy(true);
        await saveLessonRating(uid, itemId, r, comment);
        setBusy(false);
        setSaved(true);
    };

    return (
        <section className={`${CARD} rounded-2xl p-5 mt-8`} aria-label="Rate this lesson">
            <h2 className="font-serif text-lg font-semibold">Was this lesson useful?</h2>
            <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating from 1 to 5 stars">
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={rating === n}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => { setRating(n); setSaved(false); void save(n); }}
                        className="p-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                        <Star size={28} className={(hover || rating) >= n ? 'fill-violet-600 text-violet-700 dark:fill-violet-400 dark:text-violet-400' : 'text-stone-300 dark:text-slate-600'} />
                    </button>
                ))}
            </div>
            {rating > 0 && (
                <div className="mt-3">
                    <label htmlFor={`rc-${itemId}`} className="sr-only">Comment (optional)</label>
                    <textarea id={`rc-${itemId}`} rows={2} maxLength={500} value={comment} onChange={e => { setComment(e.target.value); setSaved(false); }} placeholder="Anything we should improve? (optional)" className={FIELD} />
                    <div className="mt-2 flex items-center gap-3">
                        <button type="button" disabled={busy || saved} onClick={() => void save()} className="rounded-lg border border-stone-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-stone-50 dark:hover:bg-slate-800 disabled:opacity-50">
                            {saved ? 'Thank you' : 'Save comment'}
                        </button>
                        {saved && <span className={`text-sm ${MUTED}`}>Saved</span>}
                    </div>
                </div>
            )}
        </section>
    );
};

/** Ask a question about this lesson and read answers. Private to the asker until an admin makes it public. */
export const LessonQA: React.FC<{ uid: string; itemId: string; fullName: string }> = ({ uid, itemId, fullName }) => {
    const [questions, setQuestions] = useState<LessonQuestion[]>([]);
    const [missing, setMissing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const load = async () => {
        const r = await loadQuestions(itemId);
        setQuestions(r.questions); setMissing(r.missing); setLoading(false);
    };
    useEffect(() => { setLoading(true); void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [itemId]);

    const submit = async () => {
        if (!text.trim()) return;
        setBusy(true); setErr('');
        const ok = await askQuestion(uid, itemId, (fullName || '').trim().split(/\s+/)[0], text);
        setBusy(false);
        if (ok) { setText(''); await load(); } else setErr('Your question could not be sent. Check your connection and try again.');
    };

    if (missing) return <p className={`pt-5 text-sm ${MUTED}`}>Questions are not open yet. Please check back soon.</p>;

    return (
        <div className="pt-5 space-y-5">
            <div>
                <label htmlFor={`q-${itemId}`} className="font-semibold text-sm">Ask a question about this lesson</label>
                <textarea id={`q-${itemId}`} rows={3} maxLength={2000} value={text} onChange={e => setText(e.target.value)} placeholder="Type your question. Our team will answer here." className={`${FIELD} mt-2`} />
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <button type="button" onClick={() => void submit()} disabled={busy || !text.trim()} className={BTN_PRIMARY}><Send size={16} /> {busy ? 'Sending…' : 'Send question'}</button>
                    <span className={`text-xs ${MUTED}`}>Only you can see it until our team shares it with everyone.</span>
                </div>
                {err && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">{err}</p>}
            </div>

            {loading ? <p className={`text-sm ${MUTED}`}>Loading…</p> : questions.length === 0 ? (
                <p className={`text-sm ${MUTED} flex items-center gap-2`}><MessageCircle size={16} /> No questions on this lesson yet.</p>
            ) : (
                <ul className="space-y-3">
                    {questions.map(q => {
                        const mine = q.user_id === uid;
                        return (
                            <li key={q.id} className={`${CARD} rounded-2xl p-4`}>
                                <p className={`text-xs flex items-center gap-1.5 ${MUTED}`}>
                                    {q.is_public ? <Globe2 size={13} /> : <Lock size={13} />}
                                    {mine ? 'You' : (q.asker_name || 'A learner')} · {formatLocal(q.created_at)} · {q.is_public ? 'Shared with everyone' : 'Only you'}
                                </p>
                                <p className="mt-1.5 text-[15px] whitespace-pre-wrap">{q.body}</p>
                                {q.answers.length === 0 ? (
                                    <p className={`mt-3 text-sm italic ${MUTED}`}>Waiting for an answer.</p>
                                ) : q.answers.map(a => (
                                    <div key={a.id} className="mt-3 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/30 p-3">
                                        <p className="text-xs font-semibold text-violet-900 dark:text-violet-200">{a.author_name || 'Welile School of AI'} answered</p>
                                        <p className="mt-1 text-[15px] whitespace-pre-wrap">{a.body}</p>
                                    </div>
                                ))}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
