import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  format,
  isThisYear,
  isToday,
  isTomorrow,
  isYesterday,
  nextSaturday,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';

import type { Recurrence } from '@/types';

export type DuePreset = 'today' | 'tomorrow' | 'in2' | 'weekend' | 'nextweek';

/** Convert a due preset into an ISO string at the start of that day. */
export function presetDueISO(kind: DuePreset): string {
  const base = startOfDay(new Date());
  switch (kind) {
    case 'today':
      return base.toISOString();
    case 'tomorrow':
      return addDays(base, 1).toISOString();
    case 'in2':
      return addDays(base, 2).toISOString();
    case 'weekend':
      return startOfDay(nextSaturday(base)).toISOString();
    case 'nextweek':
      return addDays(base, 7).toISOString();
  }
}

/** Return a new ISO string with the given hour (minutes zeroed). */
export function withHour(iso: string | null | undefined, hour: number): string {
  const base = toDate(iso) ?? startOfDay(new Date());
  return setMinutes(setHours(base, hour), 0).toISOString();
}

export function toDate(iso?: string | null): Date | null {
  if (!iso) return null;
  try {
    return parseISO(iso);
  } catch {
    return null;
  }
}

/** Human label for a due date, e.g. "Today", "Tomorrow, 5:00 PM", "Mar 12". */
export function formatDue(iso?: string | null, hasTime = false): string {
  const d = toDate(iso);
  if (!d) return '';
  const timePart = hasTime ? `, ${format(d, 'p')}` : '';
  if (isToday(d)) return `Today${timePart}`;
  if (isTomorrow(d)) return `Tomorrow${timePart}`;
  if (isYesterday(d)) return `Yesterday${timePart}`;
  const dayPart = isThisYear(d) ? format(d, 'EEE, MMM d') : format(d, 'MMM d, yyyy');
  return `${dayPart}${timePart}`;
}

/** A short section label used for grouping (Overdue / Today / Tomorrow / This Week / Later). */
export function dueGroup(iso?: string | null): string {
  const d = toDate(iso);
  if (!d) return 'No date';
  const now = new Date();
  const diff = differenceInCalendarDays(startOfDay(d), startOfDay(now));
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return 'This week';
  return 'Later';
}

export function isOverdue(iso?: string | null): boolean {
  const d = toDate(iso);
  if (!d) return false;
  return d.getTime() < Date.now();
}

export function isDueToday(iso?: string | null): boolean {
  const d = toDate(iso);
  return d ? isToday(d) : false;
}

/** Whether a due date falls within the next `days` days (inclusive of today). */
export function isWithinDays(iso: string | null | undefined, days: number): boolean {
  const d = toDate(iso);
  if (!d) return false;
  const diff = differenceInCalendarDays(startOfDay(d), startOfDay(new Date()));
  return diff >= 0 && diff <= days;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function dayHeaderLabel(date: Date): string {
  if (isToday(date)) return `Today · ${format(date, 'EEE, MMM d')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'EEE, MMM d')}`;
  return format(date, 'EEEE, MMM d');
}

/** Next due date ISO after completing a recurring task. */
export function nextDueFromRecurrence(
  dueAt: string | null | undefined,
  recurrence: Recurrence,
): string {
  const base = toDate(dueAt) ?? new Date();
  const n = Math.max(1, recurrence.interval || 1);
  let next: Date;
  switch (recurrence.frequency) {
    case 'daily':
      next = addDays(base, n);
      break;
    case 'weekly':
      next = addWeeks(base, n);
      break;
    case 'monthly':
      next = addMonths(base, n);
      break;
  }
  return next.toISOString();
}

export function recurrenceLabel(r?: Recurrence | null): string {
  if (!r) return 'Never';
  const n = r.interval || 1;
  if (r.frequency === 'daily') return n === 1 ? 'Every day' : `Every ${n} days`;
  if (r.frequency === 'weekly') return n === 1 ? 'Every week' : `Every ${n} weeks`;
  return n === 1 ? 'Every month' : `Every ${n} months`;
}

export { addDays, format, startOfDay };
