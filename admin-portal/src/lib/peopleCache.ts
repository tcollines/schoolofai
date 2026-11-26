// Shared, in-memory copy of the people list so admin pages do not each download it again.
// The list is about 200 KB and is the heaviest regular call in admin.
// Anything that changes people numbers (a call, attendance, a registration, a follow-up) must call invalidatePeople().

export const PEOPLE_TTL_MS = 90_000;

export const peopleCache = new Map<string, { at: number; value: unknown }>();
export const peopleInFlight = new Map<string, Promise<unknown>>();

/** Forget the shared copy so the next load fetches fresh data. */
export function invalidatePeople(): void {
    peopleCache.clear();
}
