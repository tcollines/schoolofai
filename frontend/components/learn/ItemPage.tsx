import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, HelpCircle, Lightbulb, PlayCircle, PenLine, MessageCircle, ScrollText } from 'lucide-react';
import { COURSE, findItem, moduleOfItem, nextItemId, prevItemId } from '../../src/content/aiFundamentals';
import { submitAttempt, bestScore } from '../../src/lib/learnApi';
import { getTranscript } from '../../src/content/transcripts';
import { useLearn } from './learnContext';
import VideoPlayer from './VideoPlayer';
import QuizView from './QuizView';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, MUTED, usePlayerPrefs } from './learnUi';
import { LessonQA, LessonRating, PlayerPrefsBar, TranscriptView } from './LessonExtras';

const ItemPage: React.FC = () => {
    const { itemId = '' } = useParams();
    const item = findItem(itemId);
    const mod = moduleOfItem(itemId);
    const { uid, fullName, progress, markProgress, markComplete, bump } = useLearn();
    const navigate = useNavigate();

    const { prefs, update: updatePrefs } = usePlayerPrefs();
    const transcript = getTranscript(itemId);
    const [tab, setTab] = useState<'overview' | 'transcript' | 'qa' | 'notes'>('overview');
    const [note, setNote] = useState('');
    const lastSaved = useRef(0);
    const completing = useRef(false);

    const noteKey = `welile_learn_note_${uid}_${itemId}`;
    useEffect(() => {
        try { setNote(localStorage.getItem(noteKey) || ''); } catch { setNote(''); }
        setTab(prefs.audioOnly && transcript ? 'transcript' : 'overview');
        lastSaved.current = 0;
        completing.current = false;
        window.scrollTo({ top: 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId, noteKey]);

    useEffect(() => {
        if (itemId && item && !progress[itemId]) void markProgress(itemId, { status: 'in_progress' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId]);

    if (!item || !mod) return <Navigate to={`/learn/${COURSE.slug}`} replace />;

    const done = progress[item.id]?.status === 'completed';
    const hasVideo = !!(item.videoId || item.videoUrl);
    const next = nextItemId(item.id);
    const prev = prevItemId(item.id);
    const base = `/learn/${COURSE.slug}`;
    const goNext = () => navigate(next ? `${base}/item/${next}` : `${base}/final`);
    const goPrev = () => prev && navigate(`${base}/item/${prev}`);

    const onVideoProgress = (pos: number, dur: number) => {
        if (!dur) return;
        const now = Date.now();
        if (now - lastSaved.current > 10000) {
            lastSaved.current = now;
            void markProgress(item.id, { seconds: pos, last: pos });
        }
        if (pos / dur >= 0.9 && !done && !completing.current) {
            completing.current = true;
            void markComplete(item.id);
        }
    };

    const kindLabel = item.kind === 'video' ? 'Video' : item.kind === 'quiz' ? 'Quiz' : 'Reading';
    const KindIcon = item.kind === 'video' ? PlayCircle : item.kind === 'quiz' ? HelpCircle : FileText;

    return (
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <p className={`text-sm ${MUTED}`}>
                <Link to={base} className="hover:underline">Course</Link> / Module {mod.number}: {mod.title}
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">{item.title}</h1>
                {done && <span className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 size={18} /> Done</span>}
            </div>
            <p className={`mt-2 text-sm flex items-center gap-2 ${MUTED}`}>
                <KindIcon size={16} /> {kindLabel} · {item.minutes} min
                {item.kind === 'quiz' && bestScore(uid, item.id) !== null && <span>· Best score {bestScore(uid, item.id)}%</span>}
            </p>

            {/* VIDEO */}
            {item.kind === 'video' && (
                <div className="mt-5">
                    <VideoPlayer
                        key={item.id}
                        videoId={item.videoId}
                        videoUrl={item.videoUrl}
                        audioUrl={item.audioUrl}
                        title={item.title}
                        startAt={progress[item.id]?.last || 0}
                        onProgress={onVideoProgress}
                        onEnded={() => { if (!done) void markComplete(item.id); }}
                        dataSaver={prefs.dataSaver}
                        audioOnly={prefs.audioOnly}
                    />
                    <PlayerPrefsBar prefs={prefs} onChange={p => { updatePrefs(p); if (p.audioOnly && transcript) setTab('transcript'); }} />
                </div>
            )}

            {/* QUIZ */}
            {item.kind === 'quiz' && item.questions && (
                <div className="mt-6">
                    <QuizView
                        key={item.id}
                        heading="Check what you have learned"
                        questions={item.questions}
                        passMark={COURSE.passModule}
                        onSubmit={async (score, total, answers) => {
                            await submitAttempt(uid, item.id, score, total, COURSE.passModule, answers);
                            bump();
                        }}
                        onPassed={() => { void markComplete(item.id); }}
                        passedLabel={`Well done, you passed the Module ${mod.number} quiz!`}
                    />
                </div>
            )}

            {/* NOTES TABS (video + reading) */}
            {item.kind !== 'quiz' && (
                <div className="mt-6">
                    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-stone-200 dark:border-slate-800">
                        {([
                            ['overview', 'Lesson notes', FileText],
                            ...(transcript ? [['transcript', 'Transcript', ScrollText] as const] : []),
                            ['qa', 'Q&A', MessageCircle],
                            ['notes', 'My notes', PenLine]
                        ] as const).map(([id, label, Icon]) => (
                            <button
                                key={id}
                                role="tab"
                                aria-selected={tab === id}
                                onClick={() => setTab(id)}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === id ? 'border-violet-700 text-violet-800 dark:text-violet-300' : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'}`}
                            >
                                <Icon size={16} /> {label}
                            </button>
                        ))}
                    </div>

                    {tab === 'overview' && (
                        <div className="pt-5 space-y-5">
                            {item.summary && <p className="text-[16px] leading-relaxed">{item.summary}</p>}

                            {item.points && item.points.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">{item.kind === 'reading' ? 'Remember' : 'Key points'}</h2>
                                    <ul className="mt-2 space-y-2">
                                        {item.points.map(p => <li key={p} className="flex gap-2 leading-snug"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-violet-700 dark:text-violet-400" />{p}</li>)}
                                    </ul>
                                </div>
                            )}

                            {item.glossary && (
                                <div className={`${CARD} rounded-2xl overflow-hidden`}>
                                    <dl className="divide-y divide-stone-100 dark:divide-slate-800">
                                        {item.glossary.map(g => (
                                            <div key={g.term} className="p-4 grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-4">
                                                <dt className="font-semibold">{g.term}</dt>
                                                <dd className="text-[15px]">{g.meaning}<span className={`block mt-1 text-sm ${MUTED}`}>Example: {g.example}</span></dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            )}

                            {item.tryIt && (
                                <div className="rounded-2xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/30 p-5">
                                    <p className="flex items-center gap-2 font-semibold text-violet-900 dark:text-violet-200"><Lightbulb size={18} /> Try it now: {item.tryIt.title}</p>
                                    <ol className="mt-3 space-y-2 list-decimal list-inside text-[15px] leading-snug marker:text-violet-700 dark:marker:text-violet-300">
                                        {item.tryIt.steps.map(s => <li key={s}>{s}</li>)}
                                    </ol>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'transcript' && transcript && <TranscriptView paragraphs={transcript} />}

                    {tab === 'qa' && <LessonQA key={item.id} uid={uid} itemId={item.id} fullName={fullName} />}

                    {tab === 'notes' && (
                        <div className="pt-5">
                            <label htmlFor="note" className="sr-only">My notes</label>
                            <textarea
                                id="note"
                                value={note}
                                onChange={e => { setNote(e.target.value); try { localStorage.setItem(noteKey, e.target.value); } catch { /* ignore */ } }}
                                rows={8}
                                placeholder="Write your own notes here. They are saved on this device."
                                className="w-full rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Complete + navigation */}
            {item.kind !== 'quiz' && (
                <div className="mt-8">
                    {!done && (item.kind === 'reading' || !hasVideo) && (
                        <button onClick={() => void markComplete(item.id)} className={`${BTN_PRIMARY} w-full sm:w-auto`}>
                            <CheckCircle2 size={18} /> Mark as complete
                        </button>
                    )}
                    {!done && hasVideo && item.kind === 'video' && (
                        <p className={`text-sm ${MUTED}`}>This lesson completes automatically when you have watched at least 90% of the video.</p>
                    )}
                </div>
            )}

            {item.kind !== 'quiz' && (item.kind === 'reading' || done || !hasVideo) && <LessonRating uid={uid} itemId={item.id} />}

            <div className="mt-8 pt-6 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button onClick={goPrev} disabled={!prev} className={BTN_SECONDARY}><ArrowLeft size={16} /> Previous</button>
                <button onClick={goNext} className={done || item.kind === 'quiz' ? BTN_PRIMARY : BTN_SECONDARY}>
                    {next ? 'Next' : 'Final assessment'} <ArrowRight size={16} />
                </button>
            </div>
        </article>
    );
};

export default ItemPage;
