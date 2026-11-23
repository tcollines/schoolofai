import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { verifyCertificate } from '../../src/lib/learnApi';
import WelileTechLink from './WelileTechLink';
import { PAPER, INK, MUTED, CARD, BTN_PRIMARY, Logo, ThemeButton } from './learnUi';

const VerifyCertificatePage: React.FC = () => {
    const { id = '' } = useParams();
    const [state, setState] = useState<'loading' | 'valid' | 'revoked' | 'notfound'>('loading');
    const [info, setInfo] = useState<{ name: string; courseTitle: string; issuedAt: string } | null>(null);

    useEffect(() => {
        document.title = 'Verify certificate | Welile School of AI';
        let cancelled = false;
        verifyCertificate(id).then(res => {
            if (cancelled) return;
            if (!res) { setState('notfound'); return; }
            setInfo(res);
            setState(res.status === 'valid' ? 'valid' : 'revoked');
        });
        return () => { cancelled = true; };
    }, [id]);

    return (
        <div className={`min-h-screen ${PAPER} ${INK}`}>
            <header className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                <Logo className="h-11" />
                <ThemeButton />
            </header>
            <main className="max-w-xl mx-auto px-4 py-10">
                <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-center">Certificate verification</h1>
                <p className={`text-center mt-2 text-sm font-mono ${MUTED}`}>{id}</p>

                <div className={`${CARD} p-8 mt-8 text-center`}>
                    {state === 'loading' && <Loader2 className="mx-auto animate-spin text-brand" />}

                    {state === 'valid' && info && (
                        <>
                            <BadgeCheck size={52} className="mx-auto text-mint" />
                            <p className="mt-3 font-semibold text-mint dark:text-emerald-400">This certificate is genuine</p>
                            <p className={`mt-6 text-sm ${MUTED}`}>Awarded to</p>
                            <p className="text-3xl font-extrabold tracking-[-0.02em] mt-1">{info.name}</p>
                            <p className={`mt-4 text-sm ${MUTED}`}>for completing</p>
                            <p className="font-semibold mt-1">{info.courseTitle}</p>
                            <p className={`mt-4 text-sm ${MUTED}`}>
                                Issued {new Date(info.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} by Welile School of AI, sponsored by <WelileTechLink />
                            </p>
                        </>
                    )}

                    {state === 'revoked' && (
                        <>
                            <ShieldAlert size={52} className="mx-auto text-amber-600" />
                            <p className="mt-3 font-semibold">This certificate is no longer valid</p>
                            <p className={`mt-2 text-sm ${MUTED}`}>It was withdrawn by Welile School of AI. Contact us if you think this is a mistake.</p>
                        </>
                    )}

                    {state === 'notfound' && (
                        <>
                            <ShieldAlert size={52} className="mx-auto text-stone-400" />
                            <p className="mt-3 font-semibold">We could not find this certificate</p>
                            <p className={`mt-2 text-sm ${MUTED}`}>Check the ID for typing mistakes, or try again in a moment.</p>
                        </>
                    )}
                </div>

                <div className="text-center mt-8">
                    <Link to="/free/ai-fundamentals" className={BTN_PRIMARY}>Study AI for free</Link>
                </div>
            </main>
        </div>
    );
};

export default VerifyCertificatePage;
