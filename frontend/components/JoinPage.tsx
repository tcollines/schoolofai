import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';
import { setReferral, logReferralClick, setFreeCourseIntent } from '../src/lib/acquisition';
import { OFFICIAL_COURSE_CATALOG } from '../src/lib/outreachSync';
import { BTN_PRIMARY, CARD, INK, Logo, MUTED, PAPER, ThemeButton } from './learn/learnUi';

const FREE_TITLE = 'AI Fundamentals (free)';
const FREE_SLUG = 'ai-fundamentals';
const INPUT = 'w-full rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';

/** Very short sign-up form behind a sales agent's personal link: /join/<agent>. Free course first, other courses selectable. */
const JoinPage: React.FC = () => {
    const { slug = '' } = useParams();
    const navigate = useNavigate();
    const [agent, setAgent] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', password: '', course: FREE_TITLE, consent: false, emailOptIn: true });
    const [show, setShow] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exists, setExists] = useState(false);
    const courses = [FREE_TITLE, ...OFFICIAL_COURSE_CATALOG.filter(c => c.title !== 'Fundamentals of AI').map(c => c.title)];
    const isFree = form.course === FREE_TITLE;

    useEffect(() => {
        if (!slug) return;
        setReferral(slug);
        void logReferralClick(slug.toLowerCase(), '/join');
        supabase.rpc('agent_public_name', { p_slug: slug.toLowerCase() }).then(({ data }) => { if (typeof data === 'string' && data) setAgent(data); });
    }, [slug]);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setExists(false);
        const email = form.email.trim().toLowerCase();
        if (form.name.trim().length < 2) return setError('Please enter your full name.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError('Please enter a valid email address.');
        if (form.phone.replace(/\D/g, '').length < 9) return setError('Please enter a valid phone number.');
        if (form.location.trim().length < 2) return setError('Please tell us where you are based (town or district).');
        if (form.password.length < 8) return setError('Your password needs at least 8 characters.');
        if (!form.consent) return setError('Please agree to be contacted about your programme.');
        setBusy(true);
        try {
            if (isFree) setFreeCourseIntent(FREE_SLUG);
            const { data, error: err } = await supabase.auth.signUp({
                email, password: form.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/continue`,
                    data: {
                        full_name: form.name.trim(), phone: form.phone.trim(), location: form.location.trim(), email_opt_in: form.emailOptIn, ref_code: slug.toLowerCase(),
                        signup_source: 'agent_link', interested_course: form.course,
                        ...(isFree ? { enroll_course: FREE_SLUG } : {})
                    }
                }
            });
            const already = (data?.user && (!data.user.identities || data.user.identities.length === 0)) || (err && /already|registered|exists/i.test(err.message));
            if (already) { setExists(true); return; }
            if (err) throw err;
            if (data?.session) { navigate('/continue'); return; }
            navigate('/onboarding/verify', { state: { email } });
        } catch (er: any) {
            setError(er?.message || 'Something went wrong. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={`min-h-screen ${PAPER} ${INK}`}>
            <header className="max-w-md mx-auto px-4 pt-5 flex items-center justify-between"><Logo className="h-10" /><ThemeButton /></header>
            <main className="max-w-md mx-auto px-4 py-6">
                <h1 className="font-serif text-3xl font-semibold leading-tight">Open your free account</h1>
                <p className={`mt-2 ${MUTED}`}>{agent ? <>{agent} invited you. </> : null}It takes one minute. Start with <b>AI Fundamentals</b>, free, on any phone, with a free certificate.</p>

                <form onSubmit={submit} className={`${CARD} rounded-2xl p-5 mt-5 space-y-4`} noValidate>
                    <div><label htmlFor="j-name" className="block text-sm font-semibold mb-1.5">Full name</label><input id="j-name" value={form.name} onChange={set('name')} autoComplete="name" className={INPUT} /></div>
                    <div><label htmlFor="j-email" className="block text-sm font-semibold mb-1.5">Email</label><input id="j-email" type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" className={INPUT} /></div>
                    <div><label htmlFor="j-phone" className="block text-sm font-semibold mb-1.5">Phone (WhatsApp)</label><input id="j-phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="07XX XXX XXX" className={INPUT} /></div>
                    <div><label htmlFor="j-loc" className="block text-sm font-semibold mb-1.5">Where are you based?</label><input id="j-loc" value={form.location} onChange={set('location')} autoComplete="address-level2" placeholder="Town or district, e.g. Kampala" className={INPUT} /></div>
                    <div>
                        <label htmlFor="j-pass" className="block text-sm font-semibold mb-1.5">Create a password</label>
                        <div className="relative">
                            <input id="j-pass" type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} autoComplete="new-password" className={`${INPUT} pr-12`} />
                            <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-500">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="j-course" className="block text-sm font-semibold mb-1.5">I want to learn</label>
                        <select id="j-course" value={form.course} onChange={set('course')} className={INPUT}>{courses.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        {!isFree && <p className={`mt-2 text-sm ${MUTED}`}>You will get the free AI Fundamentals course too. Our team will contact you about {form.course}.</p>}
                    </div>
                    <label className="flex items-start gap-3 text-sm cursor-pointer"><input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-0.5 accent-violet-700 w-5 h-5 shrink-0" /><span>Welile School of AI may contact me about my programme.</span></label>

                    <label className="flex items-start gap-3 text-sm cursor-pointer"><input type="checkbox" checked={form.emailOptIn} onChange={set('emailOptIn')} className="mt-0.5 accent-violet-700 w-5 h-5 shrink-0" /><span>Email me live-class reminders and course updates. You can change this any time.</span></label>

                    {exists && <p role="alert" className="text-sm rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3">This email already has an account. <a href="/login" className="font-semibold underline">Sign in</a> and open your free course.</p>}
                    {error && <p role="alert" className="text-sm text-red-600 flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{error}</p>}
                    <button type="submit" disabled={busy} className={`${BTN_PRIMARY} w-full`}>{busy ? <><Loader2 className="animate-spin" size={18} /> Creating...</> : <><UserPlus size={18} /> Create my account</>}</button>
                    <p className={`text-xs text-center ${MUTED}`}>You will get an email to confirm your address. Already registered? <a href="/login" className="underline">Sign in</a></p>
                </form>
            </main>
        </div>
    );
};

export default JoinPage;
