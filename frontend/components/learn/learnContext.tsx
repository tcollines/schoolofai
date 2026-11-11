import { createContext, useContext } from 'react';
import { Certificate, ProgressMap, ItemProgress } from '../../src/lib/learnApi';

export interface LearnCtx {
    uid: string;
    email: string;
    fullName: string;
    progress: ProgressMap;
    markProgress: (itemId: string, patch: Partial<ItemProgress>) => Promise<void>;
    markComplete: (itemId: string) => Promise<void>;
    /** re-read progress from the server (e.g. after the server marks the final assessment) */
    refresh: () => Promise<void>;
    cert: Certificate | null;
    setCert: (c: Certificate | null) => void;
    /** bump after a quiz attempt so dependent screens re-read attempts from storage */
    attemptsTick: number;
    bump: () => void;
}

export const LearnContext = createContext<LearnCtx | null>(null);

export const useLearn = (): LearnCtx => {
    const ctx = useContext(LearnContext);
    if (!ctx) throw new Error('useLearn must be used inside <LearnRoute>');
    return ctx;
};
