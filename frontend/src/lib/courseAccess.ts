// Launch gate for the free AI Fundamentals course.
// Until the start date everyone can register and watch the welcome video; the rest opens on Monday 16 November 2026 (East Africa Time).
// Staff accounts below, and administrators, can open everything straight away.

export const LESSONS_OPEN_AT = new Date('2026-11-16T00:00:00+03:00');
export const LESSONS_OPEN_LABEL = 'Monday 16th November';
export const OPEN_ITEM_IDS = ['m0-l1'];
export const EARLY_ACCESS_EMAILS = ['tcwaniaye@gmail.com', 'tkwaniaye17@gmail.com', 'pexpert46@gmail.com'];

/** Live classes (East Africa Time): every Monday, Wednesday and Friday at 2:00 pm. */
export const LIVE_SCHEDULE = [
    { day: 'Monday', time: '2:00 pm' },
    { day: 'Wednesday', time: '2:00 pm' },
    { day: 'Friday', time: '2:00 pm' }
];

export const hasFullAccess = (email?: string | null, role?: string | null): boolean => {
    if (String(role || '').toUpperCase() === 'ADMIN') return true;
    return !!email && EARLY_ACCESS_EMAILS.includes(email.trim().toLowerCase());
};

export const lessonsAreOpen = (now = Date.now()): boolean => now >= LESSONS_OPEN_AT.getTime();

export const isItemOpen = (itemId: string, fullAccess: boolean, now = Date.now()): boolean =>
    fullAccess || lessonsAreOpen(now) || OPEN_ITEM_IDS.includes(itemId);
