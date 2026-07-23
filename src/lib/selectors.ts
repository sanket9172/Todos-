import type { QuickFilter, SavedViewFilter, Task } from '@/types';
import { PRIORITY_ORDER } from '@/types';
import { dueGroup, isDueToday, isOverdue, isWithinDays, toDate } from '@/lib/date';

/** Sort: incomplete first, then by priority, then by soonest due date, then newest. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pa = PRIORITY_ORDER[a.priority];
    const pb = PRIORITY_ORDER[b.priority];
    if (pa !== pb) return pa - pb;
    const da = toDate(a.dueAt)?.getTime() ?? Infinity;
    const db = toDate(b.dueAt)?.getTime() ?? Infinity;
    if (da !== db) return da - db;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function applyQuickFilter(tasks: Task[], filter: QuickFilter): Task[] {
  switch (filter) {
    case 'today':
      return tasks.filter(
        (t) => !t.completed && (isDueToday(t.dueAt) || isOverdue(t.dueAt)),
      );
    case 'upcoming':
      return tasks.filter((t) => !t.completed && isWithinDays(t.dueAt, 7));
    case 'overdue':
      return tasks.filter((t) => !t.completed && isOverdue(t.dueAt));
    case 'flagged':
      return tasks.filter(
        (t) => !t.completed && (t.priority === 'high' || t.priority === 'urgent'),
      );
    case 'completed':
      return tasks.filter((t) => t.completed);
    case 'inbox':
      return tasks.filter((t) => !t.completed && !t.projectId);
    case 'all':
    default:
      return tasks;
  }
}

export function applySavedViewFilter(tasks: Task[], filter: SavedViewFilter): Task[] {
  let list = tasks;
  if (filter.kind === 'quick' && filter.quick) {
    list = applyQuickFilter(list, filter.quick);
  } else {
    list = list.filter((t) => !t.completed);
    if (filter.projectId) list = list.filter((t) => t.projectId === filter.projectId);
    if (filter.labelName) {
      list = list.filter((t) => t.labels.includes(filter.labelName!));
    }
  }
  return list;
}

export function filterByLabel(tasks: Task[], labelName: string): Task[] {
  return tasks.filter((t) => !t.completed && t.labels.includes(labelName));
}

export interface Section {
  title: string;
  data: Task[];
}

const GROUP_ORDER = ['Overdue', 'Today', 'Tomorrow', 'This week', 'Later', 'No date'];

/** Group tasks into ordered date sections (Overdue / Today / …). */
export function groupByDue(tasks: Task[]): Section[] {
  const buckets = new Map<string, Task[]>();
  for (const t of tasks) {
    const g = t.completed ? 'Completed' : dueGroup(t.dueAt);
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g)!.push(t);
  }
  const sections: Section[] = [];
  for (const key of GROUP_ORDER) {
    const data = buckets.get(key);
    if (data && data.length) sections.push({ title: key, data: sortTasks(data) });
  }
  const completed = buckets.get('Completed');
  if (completed && completed.length) {
    sections.push({ title: 'Completed', data: sortTasks(completed) });
  }
  return sections;
}

export function searchTasks(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q) ||
      t.labels.some((l) => l.toLowerCase().includes(q)) ||
      (t.recurrence && 'repeat'.includes(q)),
  );
}

export interface QuickCounts {
  today: number;
  overdue: number;
  upcoming: number;
  flagged: number;
  completedToday: number;
  inbox: number;
}

export function quickCounts(tasks: Task[]): QuickCounts {
  return {
    today: applyQuickFilter(tasks, 'today').length,
    overdue: applyQuickFilter(tasks, 'overdue').length,
    upcoming: applyQuickFilter(tasks, 'upcoming').length,
    flagged: applyQuickFilter(tasks, 'flagged').length,
    completedToday: tasks.filter(
      (t) => t.completed && t.completedAt && isDueToday(t.completedAt),
    ).length,
    inbox: applyQuickFilter(tasks, 'inbox').length,
  };
}
