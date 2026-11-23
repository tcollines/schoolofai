import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, HelpCircle, Lightbulb, PlayCircle, PenLine, MessageCircle, ScrollText } from 'lucide-react';
import { COURSE, findItem, moduleOfItem, nextItemId, prevItemId } from '../../src/content/aiFundamentals';
import { submitAttempt, bestScore } from '../../src/lib/learnApi';
import { getTranscript } from '../../src/content/transcripts';
import { useLearn } from './learnContext';
import VideoPlayer from './VideoPlayer';
import ComingSoon from './ComingSoon';
import { lockReason } from '../../src/lib/courseAccess';
import { Lock } from 'lucide-react';
import QuizView from './QuizView';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, MUTED, usePlayerPrefs } from './learnUi';
import { LessonQA, LessonRating, PlayerPrefsBar, TranscriptView } from './LessonExtras';

const ItemPage: React.FC = () => {
    const { itemId = '' } = useParams();
    const item = findItem(itemId);
    const mod = moduleOfItem(itemId);
    const { uid, fullName, progress, markProgress, markComplete, bump, fullAccess } = useLearn();
    const reason = item ? lockReason(item.id, progress, fullAccess) : null;
    const locked = !!item && reason !== null;
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
        if (itemId && item && !locked && !progress[itemId]) void markProgress(itemId, { status: 'in_progress' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId]);

    if (!item || !mod) return <Navigate to={`/learn/${COURSE.slug}`} replace />;
    if (reason === 'date') return <ComingSoon firstName={(fullName || '').split(' ')[0]} />;
    if (reason === 'previous') {
        const prevId = prevItemId(item.id);
        const prevItem = prevId ? findItem(prevId) : undefined;
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
                <div className={`${CARD} p-7 sm:p-10 text-center`}>
                    <span className="mx-auto w-16 h-16 rounded-[20px] bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300 flex items-center justify-center"><Lock size={26} /></span>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold tracking-[-0.02em] leading-tight mt-5 mb-0">Finish the previous lesson first</h1>
                    <p className={`mt-3 text-base leading-relaxed ${MUTED}`}>
                        Each lesson opens when you finish the one before it, so everything builds step by step. You can see the whole lineup, and "{item.title}" will open as soon as you complete {prevItem ? `"${prevItem.title}"` : 'the previous lesson'}.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                        {prevId && <Link to={`/learn/${COURSE.slug}/item/${prevId}`} className={BTN_PRIMARY}><ArrowLeft size={18} /> Go to the previous lesson</Link>}
                        <Link to={`/learn/${COURSE.slug}`} className={BTN_SECONDARY}>See the course lineup</Link>
                    </div>
                </div>
            </div>
        );
    }

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
        <article className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-0 py-5 lg:py-0">
            <nav aria-label="Breadcrumb" className={`text-[13px] font-semibold flex items-center gap-1.5 flex-wrap ${MUTED}`}>
                <Link to={base} className="hover:text-brand no-underline">Course</Link>
                <span aria-hidden="true">/</span>
                <span>{mod.number === 0 ? 'Start here' : `Module ${mod.number}`}: {mod.title}</span>
            </nav>
            <div className="mt-2.5 flex items-start justify-between gap-3">
                <h1 className="m-0 text-[24px] sm:text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em]">{item.title}</h1>
                {done && <span className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-mint-soft text-mint text-[13px] font-bold"><CheckCircle2 size={16} /> Done</span>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-bold ${item.kind === 'quiz' ? 'bg-lime-200 text-ink' : 'bg-brand-soft dark:bg-night-3 text-brand dark:text-violet-300'}`}><KindIcon size={14} /> {kindLabel}</span>
                <span className="inline-flex items-center h-8 px-3 rounded-full bg-white dark:bg-night-2 text-[12px] font-bold">{item.minutes} min</span>
                {item.kind === 'quiz' && bestScore(uid, item.id) !== null && <span className="inline-flex items-center h-8 px-3 rounded-full bg-white dark:bg-night-2 text-[12px] font-bold">Best score {bestScore(uid, item.id)}%</span>}
            </div>

            {/* VIDEO */}
            {item.kind === 'video' && (
                <div className="mt-5 rounded-[24px] bg-white dark:bg-night-2 p-2.5 sm:p-3">
                    <VideoPlayer
                        key={item.id}
                        videoId={item.videoId}
                        videoUrl={item.videoUrl}
                        audioUrl={item.audioUrl}
                        poster={item.videoUrl && item.videoUrl.startsWith('/video/') ? `/thumb/${item.id}.jpg` : undefined}
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
                    <div role="tablist" aria-label="Lesson sections" className="no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto p-1 rounded-[16px] bg-white dark:bg-night-2">
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
                                className={`press flex items-center gap-2 px-3.5 sm:px-4 h-10 rounded-[12px] whitespace-nowrap text-[13px] font-bold transition-colors ${tab === id ? 'bg-brand text-white' : 'text-[#6B6680] dark:text-slate-400 hover:text-brand'}`}
                            >
                                <Icon size={16} /> {label}
                            </button>
                        ))}
                    </div>

                    {tab === 'overview' && (
                        <div className="mt-4 rounded-[22px] bg-white dark:bg-night-2 p-5 sm:p-6 space-y-5">
                            {item.summary && <p className="text-[16px] leading-relaxed">{item.summary}</p>}

                            {item.points && item.points.length > 0 && (
                                <div>
                                    <h2 className="m-0 text-[12px] font-bold uppercase tracking-[0.12em] text-brand dark:text-violet-300">{item.kind === 'reading' ? 'Remember' : 'Key points'}</h2>
                                    <ul className="mt-2 space-y-2">
                                        {item.points.map(p => <li key={p} className="flex gap-2 leading-snug"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand dark:text-violet-400" />{p}</li>)}
                                    </ul>
                                </div>
                            )}

                            {item.glossary && (
                                <div className="rounded-[18px] bg-panel dark:bg-night-3/60 overflow-hidden">
                                    <dl className="m-0 divide-y divide-[#E6E1F2] dark:divide-night-3">
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
                                <div className="rounded-[18px] bg-lime-100 p-5 text-lime-900">
                                    <p className="m-0 flex items-center gap-2 font-extrabold text-ink"><Lightbulb size={18} /> Try it now: {item.tryIt.title}</p>
                                    <ol className="mt-3 space-y-2 list-decimal list-inside text-[15px] leading-snug marker:text-lime-800 marker:font-bold">
                                        {item.tryIt.steps.map(s => <li key={s}>{s}</li>)}
                                    </ol>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'transcript' && transcript && <TranscriptView paragraphs={transcript} />}

                    {tab === 'qa' && <LessonQA key={item.id} uid={uid} itemId={item.id} fullName={fullName} />}

                    {tab === 'notes' && (
                        <div className="mt-4">
                            <label htmlFor="note" className="sr-only">My notes</label>
                            <textarea
                                id="note"
                                value={note}
                                onChange={e => { setNote(e.target.value); try { localStorage.setItem(noteKey, e.target.value); } catch { /* ignore */ } }}
                                rows={8}
                                placeholder="Write your own notes here. They are saved on this device."
                                className="w-full rounded-[18px] border-0 bg-white dark:bg-night-2 p-5 text-[15px] leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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

            {!fullAccess && !done && <p className={`mt-6 text-sm ${MUTED}`}>The next lesson opens when you finish this one.</p>}
            <div className="mt-5 p-3 rounded-[20px] bg-white dark:bg-night-2 flex items-center justify-between gap-3">
                <button onClick={goPrev} disabled={!prev} className={BTN_SECONDARY}><ArrowLeft size={16} /> Previous</button>
                <button onClick={goNext} disabled={!fullAccess && !done} title={!fullAccess && !done ? 'Finish this lesson to continue' : undefined} className={`${done || item.kind === 'quiz' ? BTN_PRIMARY : BTN_SECONDARY} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {next ? 'Next' : 'Final assessment'} <ArrowRight size={16} />
                </button>
            </div>
        </article>
    );
};

export default ItemPage;
