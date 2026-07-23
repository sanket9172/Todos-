import { create } from 'zustand';

import type { QuickFilter } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  /** When set, the Tasks tab adopts this filter, then clears it. */
  pendingTasksFilter: QuickFilter | null;
  pendingLabel: string | null;
  pendingSavedViewId: string | null;
  /** Bumps on every jump so Tasks re-applies even if the same filter is tapped again. */
  jumpSeq: number;

  jumpToFilter: (filter: QuickFilter) => void;
  jumpToLabel: (labelName: string) => void;
  jumpToSavedView: (viewId: string) => void;

  consumePendingFilter: () => QuickFilter | null;
  consumePendingLabel: () => string | null;
  consumePendingSavedView: () => string | null;

  /** Active in-app reminder popup task id */
  reminderTaskId: string | null;
  showReminder: (taskId: string) => void;
  dismissReminder: () => void;
}

export const useUI = create<UIState>((set, get) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  pendingTasksFilter: null,
  pendingLabel: null,
  pendingSavedViewId: null,
  jumpSeq: 0,

  jumpToFilter: (filter) =>
    set((s) => ({
      pendingTasksFilter: filter,
      pendingLabel: null,
      pendingSavedViewId: null,
      jumpSeq: s.jumpSeq + 1,
    })),
  jumpToLabel: (labelName) =>
    set((s) => ({
      pendingLabel: labelName,
      pendingTasksFilter: null,
      pendingSavedViewId: null,
      jumpSeq: s.jumpSeq + 1,
    })),
  jumpToSavedView: (viewId) =>
    set((s) => ({
      pendingSavedViewId: viewId,
      pendingTasksFilter: null,
      pendingLabel: null,
      jumpSeq: s.jumpSeq + 1,
    })),

  consumePendingFilter: () => {
    const f = get().pendingTasksFilter;
    if (f) set({ pendingTasksFilter: null });
    return f;
  },
  consumePendingLabel: () => {
    const l = get().pendingLabel;
    if (l) set({ pendingLabel: null });
    return l;
  },
  consumePendingSavedView: () => {
    const v = get().pendingSavedViewId;
    if (v) set({ pendingSavedViewId: null });
    return v;
  },

  reminderTaskId: null,
  showReminder: (taskId) => {
    if (!taskId) return;
    if (get().reminderTaskId === taskId) return;
    set({ reminderTaskId: taskId, sidebarOpen: false });
  },
  dismissReminder: () => set({ reminderTaskId: null }),
}));
