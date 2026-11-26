// Small shared pieces for the Front desk screens: the same classes, date words and phone helpers everywhere.
import { kampalaToday } from '../../lib/physicalAttendance';

export const card = 'bg-white dark:bg-night-2 rounded-[22px]';
export const input = 'w-full min-h-[56px] rounded-[12px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 px-3 text-base';
export const label = 'block mb-1 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400';
export const errorBox = 'm-0 rounded-[12px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300';
export const chip = (on: boolean) => `min-h-[56px] px-4 rounded-[14px] border text-base font-bold ${on ? 'bg-brand border-violet-600 text-white' : 'bg-white dark:bg-night-2 border-stone-300 dark:border-slate-600 text-stone-800 dark:text-slate-100'}`;

export const today = () => kampalaToday();
export const addDays = (iso: string, n: number) => new Date(new Date(`${iso}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);

export const prettyDate = (d?: string | null) => (d ? new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');
export const shortDate = (d?: string | null) => (d ? new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');

/** Phone in the form wa.me and tel: links want (digits only, 256 first). */
export const waNumber = (p: string) => (p.startsWith('0') ? '256' + p.slice(1) : p.replace(/\D/g, ''));

/** A whole number from typed text; empty gives 0. */
export const toNumber = (v: string) => Number(String(v).replace(/[^\d]/g, '')) || 0;
