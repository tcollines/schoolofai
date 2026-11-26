import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FrontDeskData } from './frontDeskData';
import FrontDeskWalkIn, { Prefill } from './FrontDeskWalkIn';
import FrontDeskConsult from './FrontDeskConsult';
import FrontDeskPaperForms from './FrontDeskPaperForms';

type Sub = 'study' | 'consult' | 'paper';
const SUBS: { id: Sub; label: string }[] = [
    { id: 'study', label: 'Register to study' },
    { id: 'consult', label: 'Just consulting' },
    { id: 'paper', label: 'Paper forms' },
];

/** The Register screen: someone who wants to study, someone who only came to ask, or a batch from paper forms. */
const FrontDeskRegister: React.FC<{ data: FrontDeskData; onClass?: () => void; prefill?: Prefill | null; defaultSub?: 'study' | 'consult' | 'paper' }> = ({ data, onClass, prefill: incoming, defaultSub }) => {
    const [params, setParams] = useSearchParams();
    const wanted = params.get('sub');
    const sub: Sub = SUBS.some(s => s.id === wanted) ? (wanted as Sub) : defaultSub || 'study';
    const [prefill, setPrefill] = useState<Prefill | null>(incoming || null);
    // A new prefill from outside (for example "Register now" on a visitor) replaces the form
    useEffect(() => { if (incoming) setPrefill(incoming); }, [incoming]);

    const setSub = (id: Sub) => { const next = new URLSearchParams(params); next.set('sub', id); setParams(next, { replace: true }); };
    const registerFromVisit = (p: Prefill) => { setPrefill(p); setSub('study'); };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Register">
                {SUBS.map(s => (
                    <button key={s.id} role="tab" aria-selected={sub === s.id} onClick={() => setSub(s.id)}
                        className={`min-h-[60px] px-2 rounded-[14px] border text-sm font-extrabold leading-tight ${sub === s.id ? 'bg-brand border-violet-600 text-white' : 'bg-white dark:bg-night-2 border-stone-200 dark:border-slate-700'}`}>{s.label}</button>
                ))}
            </div>
            {sub === 'study' && <FrontDeskWalkIn key={`${prefill?.name || ''}|${prefill?.phone || ''}|${prefill?.email || ''}|${prefill?.enquiryId || ''}`} data={data} prefill={prefill} onClass={onClass} />}
            {sub === 'consult' && <FrontDeskConsult data={data} onRegister={registerFromVisit} />}
            {sub === 'paper' && <FrontDeskPaperForms data={data} />}
        </div>
    );
};

export default FrontDeskRegister;
