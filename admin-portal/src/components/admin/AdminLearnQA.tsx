import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { ALL_ITEMS, COURSE } from '../../content/aiFundamentals';
import { Globe2, Lock, MessageCircle, Star, Trash2 } from 'lucide-react';

interface Answer { id: string; body: string; author_name: string | null; created_at: string }
interface Question { id: string; user_id: string; item_id: string; asker_name: string | null; body: string; is_public: boolean; created_at: string; learn_answers: Answer[] }
interface RatingRow { course_slug: string; rating: number; comment: string | null; created_at: string }

const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm';
const itemTitle = (id: string) => ALL_ITEMS.find(i => i.id === id)?.title || id;
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Q&A inbox and per-lesson rating summary for the free course. Shown inside AdminFreeCourse. */
const AdminLearnQA: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [ratings, setRatings] = useState<RatingRow[]>([]);
    const [qaMissing, setQaMissing] = useState(false);
    const [filter, setFilter] = useState<'open' | 'all'>('open');
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [openComments, setOpenComments] = useState<string | null>(null);

    const load = useCallback(async () => {
        const q = await supabaseClient
            .from('learn_questions')
            .select('id,user_id,item_id,asker_name,body,is_public,created_at,learn_answers(id,body,author_name,created_at)')
            .eq('course_slug', COURSE.slug).order('created_at', { ascending: false }).limit(300);
        if (q.error) {
            setQaMissing(/could not find|does not exist|PGRST205/i.test(`${q.error.message} ${q.error.code || ''}`));
            if (!/could not find|does not exist|PGRST205/i.test(q.error.message)) setError(q.error.message);
        } else { setQaMissing(false); setQuestions((q.data || []) as Question[]); }

        const r = await supabaseClient.from('learn_ratings').select('course_slug,rating,comment,created_at')
            .like('course_slug', `${COURSE.slug}#%`).limit(5000);
        if (!r.error) setRatings((r.data || []) as RatingRow[]);
    }, []);

    useEffect(() => { void load(); }, [load]);

    const shown = useMemo(
        () => questions.filter(q => filter === 'all' || q.learn_answers.length === 0),
        [questions, filter]
    );
    const unanswered = questions.filter(q => q.learn_answers.length === 0).length;

    const answer = async (q: Question) => {
        const body = (drafts[q.id] || '').trim();
        if (!body) return;
        setBusy(q.id); setError('');
        const { error: err } = await supabaseClient.from('learn_answers').insert({ question_id: q.id, body, author_name: 'Welile School of AI team' });
        setBusy(null);
        if (err) { setError(err.message); return; }
        setDrafts(d => ({ ...d, [q.id]: '' }));
        void load();
    };

    const togglePublic = async (q: Question) => {
        setBusy(q.id); setError('');
        const { error: err } = await supabaseClient.from('learn_questions').update({ is_public: !q.is_public }).eq('id', q.id);
        setBusy(null);
        if (err) setError(err.message); else void load();
    };

    const remove = async (q: Question) => {
        if (!window.confirm('Delete this question and its answers? This cannot be undone.')) return;
        setBusy(q.id);
        const { error: err } = await supabaseClient.from('learn_questions').delete().eq('id', q.id);
        setBusy(null);
        if (err) setError(err.message); else void load();
    };

    const perLesson = useMemo(() => {
        const m = new Map<string, RatingRow[]>();
        ratings.forEach(r => {
            const id = r.course_slug.split('#')[1];
            if (id) m.set(id, [...(m.get(id) || []), r]);
        });
        return ALL_ITEMS.filter(i => m.has(i.id)).map(i => {
            const rows = m.get(i.id)!;
            return { id: i.id, title: i.title, count: rows.length, avg: rows.reduce((s, r) => s + r.rating, 0) / rows.length, comments: rows.filter(r => r.comment) };
        }).sort((a, b) => a.avg - b.avg);
    }, [ratings]);

    return (
        <>
            <div className={`${card} p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-bold flex items-center gap-2"><MessageCircle size={18} /> Q&amp;A ({unanswered} waiting)</h2>
                    <div className="flex gap-1 text-sm">
                        {(['open', 'all'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg font-medium ${filter === f ? 'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-200' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                                {f === 'open' ? 'Unanswered' : 'All'}
                            </button>
                        ))}
                    </div>
                </div>
                {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
                {qaMissing ? (
                    <p className="mt-3 text-sm text-gray-500">The Q&amp;A tables are not in the database yet. Apply migration 20261112000000_learn_qa.sql.</p>
                ) : shown.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">{filter === 'open' ? 'No unanswered questions.' : 'No questions yet.'}</p>
                ) : (
                    <ul className="mt-4 space-y-4">
                        {shown.map(q => (
                            <li key={q.id} className="rounded-xl border border-gray-100 dark:border-slate-800 p-4">
                                <p className="text-xs text-gray-500">{itemTitle(q.item_id)} · {q.asker_name || 'Learner'} · {when(q.created_at)}</p>
                                <p className="mt-1.5 text-sm whitespace-pre-wrap">{q.body}</p>
                                {q.learn_answers.map(a => (
                                    <div key={a.id} className="mt-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 p-3 text-sm">
                                        <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">{a.author_name || 'Team'} · {when(a.created_at)}</p>
                                        <p className="mt-0.5 whitespace-pre-wrap">{a.body}</p>
                                    </div>
                                ))}
                                <textarea
                                    rows={2}
                                    value={drafts[q.id] || ''}
                                    onChange={e => setDrafts(d => ({ ...d, [q.id]: e.target.value }))}
                                    placeholder={q.learn_answers.length ? 'Add another answer' : 'Write an answer'}
                                    aria-label="Answer"
                                    className="mt-3 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm"
                                />
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <button onClick={() => void answer(q)} disabled={busy === q.id || !(drafts[q.id] || '').trim()} className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold disabled:opacity-50">Post answer</button>
                                    <button onClick={() => void togglePublic(q)} disabled={busy === q.id} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800">
                                        {q.is_public ? <><Lock size={14} /> Make private</> : <><Globe2 size={14} /> Share with all learners</>}
                                    </button>
                                    <button onClick={() => void remove(q)} disabled={busy === q.id} aria-label="Delete question" className="ml-auto p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800"><Trash2 size={16} /></button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">{q.is_public ? 'Visible to every learner on this lesson.' : 'Visible only to the person who asked.'}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className={`${card} p-5`}>
                <h2 className="font-bold flex items-center gap-2"><Star size={18} className="text-amber-500" /> Lesson ratings (lowest first)</h2>
                {perLesson.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">No lesson ratings yet.</p>
                ) : (
                    <ul className="mt-3 divide-y divide-gray-100 dark:divide-slate-800">
                        {perLesson.map(l => (
                            <li key={l.id} className="py-2.5 text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="flex-1 min-w-0 truncate">{l.title}</span>
                                    <span className="font-semibold">{l.avg.toFixed(1)} / 5</span>
                                    <span className="text-gray-500 w-16 text-right">{l.count} rating{l.count === 1 ? '' : 's'}</span>
                                    {l.comments.length > 0 && (
                                        <button onClick={() => setOpenComments(openComments === l.id ? null : l.id)} className="text-violet-700 dark:text-violet-300 font-medium">{l.comments.length} comment{l.comments.length === 1 ? '' : 's'}</button>
                                    )}
                                </div>
                                {openComments === l.id && (
                                    <ul className="mt-2 space-y-1.5 pl-3 border-l-2 border-violet-200 dark:border-violet-900">
                                        {l.comments.map((c, i) => <li key={i} className="text-gray-600 dark:text-slate-300">{c.rating}★ {c.comment}</li>)}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
};

export default AdminLearnQA;
