import type { Label, Project, SavedView, Task } from '@/types';
import { addDays, nowISO } from '@/lib/date';

function iso(daysFromNow: number, hour?: number): string {
  const d = addDays(new Date(), daysFromNow);
  if (hour != null) {
    d.setHours(hour, 0, 0, 0);
  }
  return d.toISOString();
}

export function makeSeed(): {
  projects: Project[];
  tasks: Task[];
  labels: Label[];
  savedViews: SavedView[];
} {
  const now = nowISO();
  const work: Project = { id: 'p_work', name: 'Work', color: '#208AEF', createdAt: now };
  const personal: Project = { id: 'p_home', name: 'Personal', color: '#31C48D', createdAt: now };

  const labels: Label[] = [
    { id: 'l_errand', name: 'errand', color: '#E8833A', createdAt: now },
    { id: 'l_focus', name: 'focus', color: '#A78BFA', createdAt: now },
  ];

  const savedViews: SavedView[] = [
    {
      id: 'v_work_today',
      name: 'Work focus',
      filter: { kind: 'custom', projectId: work.id, labelName: null },
      createdAt: now,
    },
  ];

  const base = {
    completed: false,
    completedAt: null,
    labels: [] as string[],
    subtasks: [],
    recurrence: null as Task['recurrence'],
    reminderOffsetMin: null,
    reminderId: null,
    createdAt: now,
    updatedAt: now,
  };

  const tasks: Task[] = [
    {
      ...base,
      id: 't1',
      title: 'Welcome to Todos — swipe me to complete',
      notes: 'Swipe right to complete, left for more actions. Tap to edit. Open the menu for sidebar.',
      projectId: null,
      priority: 'none',
      dueAt: iso(0),
      dueHasTime: false,
    },
    {
      ...base,
      id: 't2',
      title: 'Draft the Q3 launch email',
      projectId: work.id,
      priority: 'high',
      dueAt: iso(0, 17),
      dueHasTime: true,
      labels: ['focus'],
      subtasks: [
        { id: 's1', title: 'Outline', done: true },
        { id: 's2', title: 'Write copy', done: false },
        { id: 's3', title: 'Review with team', done: false },
      ],
    },
    {
      ...base,
      id: 't3',
      title: 'Team standup',
      projectId: work.id,
      priority: 'medium',
      dueAt: iso(1, 9),
      dueHasTime: true,
      recurrence: { frequency: 'daily', interval: 1 },
    },
    {
      ...base,
      id: 't4',
      title: 'Buy groceries',
      projectId: personal.id,
      priority: 'low',
      dueAt: iso(1),
      dueHasTime: false,
      labels: ['errand'],
    },
    {
      ...base,
      id: 't5',
      title: 'Pay electricity bill',
      projectId: personal.id,
      priority: 'urgent',
      dueAt: iso(-1, 12),
      dueHasTime: true,
    },
    {
      ...base,
      id: 't6',
      title: 'Plan weekend trip',
      projectId: personal.id,
      priority: 'none',
      dueAt: iso(4),
      dueHasTime: false,
      recurrence: { frequency: 'monthly', interval: 1 },
    },
  ];

  return { projects: [work, personal], tasks, labels, savedViews };
}
