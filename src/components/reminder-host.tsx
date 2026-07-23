import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { ReminderPopup } from '@/components/reminder-popup';
import { reminderFireDate, taskIdFromNotification } from '@/lib/notifications';
import { useStore } from '@/store/useStore';
import { useUI } from '@/store/useUI';

/** Tracks which due reminders already popped this session (avoids spam). */
const shownKeys = new Set<string>();

function fireKey(taskId: string, fireMs: number) {
  // Bucket to the minute so the same due minute only pops once
  return `${taskId}:${Math.floor(fireMs / 60_000)}`;
}

/**
 * Listens for local notifications + polls due times while the app is open,
 * then shows the ReminderPopup with beep.
 */
export function ReminderHost() {
  const showReminder = useUI((s) => s.showReminder);
  const hydrated = useStore((s) => s._hasHydrated);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const taskId = taskIdFromNotification(notification.request.content.data);
      if (taskId) {
        const task = useStore.getState().tasks.find((t) => t.id === taskId);
        const fire = task ? reminderFireDate(task) : null;
        if (task && fire) shownKeys.add(fireKey(taskId, fire.getTime()));
        showReminder(taskId);
      }
    });

    const response = Notifications.addNotificationResponseReceivedListener((res) => {
      const taskId = taskIdFromNotification(res.notification.request.content.data);
      if (taskId) {
        const task = useStore.getState().tasks.find((t) => t.id === taskId);
        const fire = task ? reminderFireDate(task) : null;
        if (task && fire) shownKeys.add(fireKey(taskId, fire.getTime()));
        showReminder(taskId);
      }
    });

    return () => {
      received.remove();
      response.remove();
    };
  }, [showReminder]);

  // While app is active, catch due times even if OS notification is delayed.
  useEffect(() => {
    if (!hydrated) return;

    const tick = () => {
      if (appState.current !== 'active') return;
      const { tasks } = useStore.getState();
      const now = Date.now();
      for (const task of tasks) {
        if (task.completed) continue;
        const fire = reminderFireDate(task);
        if (!fire) continue;
        const ms = fire.getTime();
        // Fire window: due in the last 90s (covers poll interval + clock skew)
        if (ms > now || now - ms > 90_000) continue;
        const key = fireKey(task.id, ms);
        if (shownKeys.has(key)) continue;
        shownKeys.add(key);
        showReminder(task.id);
        break; // one popup at a time
      }
    };

    tick();
    const id = setInterval(tick, 15_000);
    const sub = AppState.addEventListener('change', (next) => {
      appState.current = next;
      if (next === 'active') tick();
    });

    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [hydrated, showReminder]);

  return <ReminderPopup />;
}
