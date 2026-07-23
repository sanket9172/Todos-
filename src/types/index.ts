export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface Recurrence {
  frequency: RecurrenceFrequency;
  /** every N days / weeks / months */
  interval: number;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  /** null = personal / inbox task */
  projectId?: string | null;
  priority: Priority;
  /** ISO string, or null when no due date */
  dueAt?: string | null;
  /** false = all-day (time component ignored) */
  dueHasTime: boolean;
  completed: boolean;
  completedAt?: string | null;
  /** label names (synced with Label registry) */
  labels: string[];
  subtasks: Subtask[];
  recurrence?: Recurrence | null;
  /** minutes before dueAt to fire a reminder; null = no reminder */
  reminderOffsetMin?: number | null;
  /** id of the scheduled local notification, if any */
  reminderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  themePreference: ThemePreference;
  /** default hour (0-23) used for reminders on all-day tasks */
  defaultReminderHour: number;
  hapticsEnabled: boolean;
}

/** Local device account — optional, for remembering who uses this phone. */
export type AccountIdentifierKind = 'email' | 'phone';

export interface Account {
  id: string;
  kind: AccountIdentifierKind;
  /** Normalized email or phone digits */
  identifier: string;
  displayName?: string;
  /** SHA-256(salt + password) */
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string;
}

export type QuickFilter =
  | 'today'
  | 'upcoming'
  | 'overdue'
  | 'flagged'
  | 'completed'
  | 'all'
  | 'inbox';

export interface SavedViewFilter {
  kind: 'quick' | 'custom';
  quick?: QuickFilter;
  projectId?: string | null;
  labelName?: string | null;
}

export interface SavedView {
  id: string;
  name: string;
  filter: SavedViewFilter;
  createdAt: string;
}
