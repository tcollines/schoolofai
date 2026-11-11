import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download, Linkedin, Loader2, MessageCircle, Share2, Star, CheckCircle2 } from 'lucide-react';
import { COURSE } from '../../src/content/aiFundamentals';
import { completionState, issueCertificate, loadRating, saveRating } from '../../src/lib/learnApi';
import { useLearn } from './learnContext';
import CertificateDocument from './CertificateDocument';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, MUTED } from './learnUi';

const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 0; }
  body * { visibility: hidden !important; }
  .cert-print-area, .cert-print-area * { visibility: visible !important; }
  .cert-print-area { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; }
}`;

const CertificatePage: React.FC = () => {
    const { uid, progress, fullName, cert, setCert } = useLearn();
    const state = completionState(progress, uid);
    const base = `/learn/${COURSE.slug}`;

    const [name, setName] = useState(fullName || '');
    const [rating, setRating] = useState(loadRating(uid)?.rating || 0);
    const [comment, setComment] = useState(loadRating(uid)?.comment || '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const eligible = state.allItemsDone && state.finalPassed;

    const issue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 2) { setError('Please enter your full name as it should appear on the certificate.'); return; }
        setBusy(true);
        setError(null);
        try {
            if (rating > 0) await saveRating(uid, rating, comment.trim());
            const c = await issueCertificate(uid, name.trim());
            setCert(c);
        } catch (err: any) {
            setError(err?.message || 'Could not issue the certificate. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    if (!cert && !eligible) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 text-center">
                <Award className="mx-auto text-stone-400" size={44} />
                <h1 className="font-serif text-2xl font-semibold mt-4">Your certificate is not ready yet</h1>
                <p className={`mt-2 ${MUTED}`}>Finish every lesson, pass each module quiz and the final assessment to earn it.</p>
                <Link to={base} className={`${BTN_PRIMARY} mt-6`}>Back to the course</Link>
            </div>
        );
    }

    if (!cert) {
        return (
            <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
                <h1 className="font-serif text-3xl font-semibold">Congratulations!</h1>
                <p className={`mt-2 ${MUTED}`}>You have finished AI Fundamentals. Confirm how your name should appear. Please check the spelling, because it cannot be changed after the certificate is issued.</p>
                <form onSubmit={issue} className={`${CARD} rounded-2xl p-6 mt-6 space-y-5`}>
                    <div>
                        <label htmlFor="cert-name" className="block text-sm font-semibold mb-1.5">Full name on certificate</label>
                        <input
                            id="cert-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name"
                            className="w-full rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        />
                    </div>
                    <div>
                        <p className="block text-sm font-semibold mb-1.5">How was the course? <span className={`font-normal ${MUTED}`}>(optional)</span></p>
                        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="p-1">
                                    <Star size={30} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-slate-600'} />
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="What worked well? What could be better?"
                            className="mt-3 w-full rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        />
                    </div>
                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={busy} className={`${BTN_PRIMARY} w-full`}>
                        {busy ? <><Loader2 className="animate-spin" size={18} /> Issuing...</> : <><Award size={18} /> Issue my certificate</>}
                    </button>
                </form>
            </div>
        );
    }

    // ---- issued ----
    const verifyUrl = `${window.location.origin}/verify/${cert.id}`;
    const issued = new Date(cert.issuedAt);
    const linkedIn = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(COURSE.title)}&organizationName=${encodeURIComponent('Welile School of AI')}&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(cert.id)}`;
    const shareText = `I just completed "${COURSE.title}", a free course by Welile School of AI. Verify my certificate: ${verifyUrl}`;
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    const copy = async () => {
        try { await navigator.clipboard.writeText(verifyUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <style>{PRINT_CSS}</style>
            <h1 className="font-serif text-3xl font-semibold">Your certificate</h1>
            <p className={`mt-1 ${MUTED}`}>Well done. Anyone can check it is genuine at the link below.</p>

            <div className="mt-6 rounded-2xl overflow-hidden border border-stone-200 dark:border-slate-800 shadow-lg">
                <CertificateDocument name={cert.name} courseTitle={cert.courseTitle} issuedAt={cert.issuedAt} certId={cert.id} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => window.print()} className={BTN_PRIMARY}><Download size={18} /> Download / print (PDF)</button>
                <a href={linkedIn} target="_blank" rel="noreferrer" className={BTN_SECONDARY}><Linkedin size={18} /> Add to LinkedIn</a>
                <a href={whatsapp} target="_blank" rel="noreferrer" className={BTN_SECONDARY}><MessageCircle size={18} /> WhatsApp</a>
                <button onClick={copy} className={BTN_SECONDARY}>{copied ? <><CheckCircle2 size={18} /> Copied</> : <><Share2 size={18} /> Copy verify link</>}</button>
            </div>
            <p className={`mt-3 text-sm ${MUTED}`}>Tip: in the print window choose "Save as PDF", landscape, and turn background graphics on.</p>

            <div className={`${CARD} rounded-2xl p-6 mt-10`}>
                <h2 className="font-serif text-xl font-semibold">What next?</h2>
                <p className={`mt-1 ${MUTED}`}>Keep going with one real task a week, and explore our programmes to go deeper.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link to="/discover" className={BTN_PRIMARY}>Explore more courses</Link>
                    <Link to={base} className={BTN_SECONDARY}>Back to the course</Link>
                </div>
            </div>
        </div>
    );
};

export default CertificatePage;
