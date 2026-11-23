import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';
import { CARD, INK, Logo, MUTED, PAPER } from './learn/learnUi';

/** One-click opt-out from live-class reminder emails (the link in every reminder). No sign-in needed. */
const UnsubscribePage: React.FC = () => {
    const [params] = useSearchParams();
    const [state, setState] = useState<'working' | 'done' | 'bad'>('working');
    useEffect(() => {
        const u = params.get('u'), t = params.get('t');
        if (!u || !t) { setState('bad'); return; }
        supabase.rpc('reminder_unsubscribe', { p_user: u, p_token: t }).then(({ data, error }) => setState(!error && data === true ? 'done' : 'bad'));
    }, [params]);
    return (
        <div className={`min-h-screen ${PAPER} ${INK} flex flex-col items-center px-4 pt-10`}>
            <Logo className="h-10" />
            <div className={`${CARD} rounded-2xl p-6 mt-8 max-w-md w-full text-center`}>
                {state === 'working' && <Loader2 className="animate-spin mx-auto text-violet-700" />}
                {state === 'done' && <><h1 className="tracking-[-0.02em] text-2xl font-semibold">Reminders turned off</h1><p className={`mt-2 ${MUTED}`}>We will not email you about live classes any more. You can turn them back on any time from the Live classes page of your course.</p><a href="/learn/ai-fundamentals" className="mt-4 inline-block font-semibold text-violet-800 underline">Go to my course</a></>}
                {state === 'bad' && <><h1 className="tracking-[-0.02em] text-2xl font-semibold">This link did not work</h1><p className={`mt-2 ${MUTED}`}>Sign in and turn reminders off from the Live classes page of your course.</p><a href="/login" className="mt-4 inline-block font-semibold text-violet-800 underline">Sign in</a></>}
            </div>
        </div>
    );
};
export default UnsubscribePage;
