import { useCallback, useEffect, useState } from 'react';
import { ALL_ITEMS, COURSE } from '../content/aiFundamentals';
import { Certificate, completionState, loadCertificate, loadProgress } from '../lib/learnApi';

export interface FreeCourseState {
    loading: boolean;
    /** the student has opened the course at least once (so it belongs in "My courses") */
    enrolled: boolean;
    started: boolean;
    pct: number;
    done: number;
    total: number;
    nextItemId: string | null;
    nextItemTitle: string;
    finalPassed: boolean;
    cert: Certificate | null;
}

const empty: FreeCourseState = {
    loading: true, enrolled: false, started: false, pct: 0, done: 0, total: ALL_ITEMS.length,
    nextItemId: null, nextItemTitle: '', finalPassed: false, cert: null
};

/** Progress of the free AI Fundamentals course for the signed-in student. Refreshes when progress changes. */
export function useFreeCourse(uid?: string): FreeCourseState {
    const [state, setState] = useState<FreeCourseState>(empty);

    const load = useCallback(async () => {
        if (!uid || uid === 'guest') { setState({ ...empty, loading: false }); return; }
        const [progress, cert] = await Promise.all([loadProgress(uid), loadCertificate(uid)]);
        const c = completionState(progress, uid);
        const next = ALL_ITEMS.find(i => progress[i.id]?.status !== 'completed');
        let enrolledFlag = false;
        try { enrolledFlag = !!localStorage.getItem(`welile_learn_${COURSE.slug}_enrolled_${uid}`); } catch { /* ignore */ }
        const started = Object.keys(progress).length > 0;
        setState({
            loading: false,
            enrolled: enrolledFlag || started || !!cert,
            started,
            pct: c.pct,
            done: c.done,
            total: c.total,
            nextItemId: next ? next.id : null,
            nextItemTitle: next ? next.title : '',
            finalPassed: c.finalPassed,
            cert
        });
    }, [uid]);

    useEffect(() => {
        void load();
        const onChange = () => void load();
        window.addEventListener('learn-progress-update', onChange);
        window.addEventListener('focus', onChange);
        return () => {
            window.removeEventListener('learn-progress-update', onChange);
            window.removeEventListener('focus', onChange);
        };
    }, [load]);

    return state;
}
