import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  Label,
  Priority,
  Project,
  Recurrence,
  SavedView,
  SavedViewFilter,
  Settings,
  Subtask,
  Task,
} from '@/types';
import { nextDueFromRecurrence, nowISO } from '@/lib/date';
import { PROJECT_COLORS } from '@/lib/colors';
import { cancelReminder, scheduleReminder, scheduleSnooze } from '@/lib/notifications';
import { makeSeed } from '@/lib/seed';

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export type NewTaskInput = {
  title: string;
  notes?: string;
  projectId?: string | null;
  priority?: Priority;
  dueAt?: string | null;
  dueHasTime?: boolean;
  labels?: string[];
  reminderOffsetMin?: number | null;
  recurrence?: Recurrence | null;
};

interface StoreState {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  savedViews: SavedView[];
  settings: Settings;
  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  seedIfEmpty: () => void;

  addTask: (input: NewTaskInput) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => void;

  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  addProject: (name: string, color: string) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addLabel: (name: string, color?: string) => string;
  deleteLabel: (id: string) => void;

  addSavedView: (name: string, filter: SavedViewFilter) => string;
  deleteSavedView: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  clearCompleted: () => void;
  /** Snooze the task reminder without resetting the due-date schedule. */
  snoozeReminder: (id: string, minutes: number) => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  themePreference: 'system',
  defaultReminderHour: 9,
  hapticsEnabled: true,
};

function reconcileReminder(get: () => StoreState, set: any, taskId: string) {
  const task = get().tasks.find((t) => t.id === taskId);
  if (!task) return;
  cancelReminder(task.reminderId);
  scheduleReminder({ ...task, reminderId: null }).then((reminderId) => {
    set((state: StoreState) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, reminderId } : t)),
    }));
  });
}

function spawnNextOccurrence(task: Task): Task | null {
  if (!task.recurrence || !task.dueAt) return null;
  const now = nowISO();
  return {
    ...task,
    id: uid('t'),
    completed: false,
    completedAt: null,
    dueAt: nextDueFromRecurrence(task.dueAt, task.recurrence),
    reminderId: null,
    subtasks: task.subtasks.map((s) => ({ ...s, id: uid('s'), done: false })),
    createdAt: now,
    updatedAt: now,
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      labels: [],
      savedViews: [],
      settings: DEFAULT_SETTINGS,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      seedIfEmpty: () => {
        const { tasks, projects, labels } = get();
        if (tasks.length === 0 && projects.length === 0) {
          const seed = makeSeed();
          set({
            tasks: seed.tasks,
            projects: seed.projects,
            labels: seed.labels,
            savedViews: seed.savedViews,
          });
          return;
        }
        // Migrate: invent label registry from task label strings if missing
        if (labels.length === 0) {
          const names = new Set<string>();
          for (const t of get().tasks) for (const n of t.labels) names.add(n);
          if (names.size) {
            const now = nowISO();
            set({
              labels: [...names].map((name, i) => ({
                id: `l_mig_${i}`,
                name,
                color: PROJECT_COLORS[i % PROJECT_COLORS.length],
                createdAt: now,
              })),
            });
          }
        }
      },

      addTask: (input) => {
        const id = uid('t');
        const now = nowISO();
        const task: Task = {
          id,
          title: input.title.trim(),
          notes: input.notes,
          projectId: input.projectId ?? null,
          priority: input.priority ?? 'none',
          dueAt: input.dueAt ?? null,
          dueHasTime: input.dueHasTime ?? false,
          completed: false,
          completedAt: null,
          labels: input.labels ?? [],
          subtasks: [],
          recurrence: input.recurrence ?? null,
          reminderOffsetMin: input.reminderOffsetMin ?? null,
          reminderId: null,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ tasks: [task, ...state.tasks] }));
        reconcileReminder(get, set, id);
        return id;
      },

      updateTask: (id, patch) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: nowISO() } : t,
          ),
        }));
        reconcileReminder(get, set, id);
      },

      toggleComplete: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const completing = !task.completed;
        if (task) cancelReminder(task.reminderId);

        const next = completing ? spawnNextOccurrence(task) : null;

        set((state) => {
          let tasks = state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: completing,
                  completedAt: completing ? nowISO() : null,
                  reminderId: completing ? null : t.reminderId,
                  updatedAt: nowISO(),
                }
              : t,
          );
          if (next) tasks = [next, ...tasks];
          return { tasks };
        });

        if (next) reconcileReminder(get, set, next.id);
        const after = get().tasks.find((t) => t.id === id);
        if (after && !after.completed) reconcileReminder(get, set, id);
      },

      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task) cancelReminder(task.reminderId);
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      addSubtask: (taskId, title) => {
        const sub: Subtask = { id: uid('s'), title: title.trim(), done: false };
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...t.subtasks, sub], updatedAt: nowISO() }
              : t,
          ),
        }));
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, done: !s.done } : s,
                  ),
                  updatedAt: nowISO(),
                }
              : t,
          ),
        }));
      },

      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
              : t,
          ),
        }));
      },

      addProject: (name, color) => {
        const id = uid('p');
        const project: Project = { id, name: name.trim(), color, createdAt: nowISO() };
        set((state) => ({ projects: [...state.projects, project] }));
        return id;
      },

      updateProject: (id, patch) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.map((t) =>
            t.projectId === id ? { ...t, projectId: null } : t,
          ),
          savedViews: state.savedViews.filter((v) => v.filter.projectId !== id),
        }));
      },

      addLabel: (name, color) => {
        const trimmed = name.trim().replace(/^#/, '');
        if (!trimmed) return '';
        const existing = get().labels.find(
          (l) => l.name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (existing) return existing.id;
        const id = uid('l');
        const label: Label = {
          id,
          name: trimmed,
          color: color ?? PROJECT_COLORS[get().labels.length % PROJECT_COLORS.length],
          createdAt: nowISO(),
        };
        set((state) => ({ labels: [...state.labels, label] }));
        return id;
      },

      deleteLabel: (id) => {
        const label = get().labels.find((l) => l.id === id);
        set((state) => ({
          labels: state.labels.filter((l) => l.id !== id),
          tasks: label
            ? state.tasks.map((t) => ({
                ...t,
                labels: t.labels.filter((n) => n !== label.name),
              }))
            : state.tasks,
          savedViews: state.savedViews.filter((v) => v.filter.labelName !== label?.name),
        }));
      },

      addSavedView: (name, filter) => {
        const id = uid('v');
        const view: SavedView = {
          id,
          name: name.trim(),
          filter,
          createdAt: nowISO(),
        };
        set((state) => ({ savedViews: [...state.savedViews, view] }));
        return id;
      },

      deleteSavedView: (id) => {
        set((state) => ({ savedViews: state.savedViews.filter((v) => v.id !== id) }));
      },

      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

      clearCompleted: () => {
        get()
          .tasks.filter((t) => t.completed)
          .forEach((t) => cancelReminder(t.reminderId));
        set((state) => ({ tasks: state.tasks.filter((t) => !t.completed) }));
      },

      snoozeReminder: async (id, minutes) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        await cancelReminder(task.reminderId);
        const reminderId = await scheduleSnooze(task, minutes);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, reminderId, updatedAt: nowISO() } : t,
          ),
        }));
      },
    }),
    {
      name: 'todos-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        projects: state.projects,
        labels: state.labels,
        savedViews: state.savedViews,
        settings: state.settings,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
