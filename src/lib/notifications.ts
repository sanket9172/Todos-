import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Task } from '@/types';
import { toDate } from '@/lib/date';

let handlerConfigured = false;

/** Configure how notifications are presented while the app is foregrounded. */
export function configureNotifications() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    // Custom in-app popup handles presentation; still play system sound.
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Ask for notification permission. Returns true if granted. Never throws. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
}

/** Compute the fire date for a task reminder given its due date + offset. */
export function reminderFireDate(task: Task): Date | null {
  const due = toDate(task.dueAt);
  if (!due) return null;
  // Timed tasks without an explicit reminder still alert at due time.
  const offset =
    task.reminderOffsetMin != null
      ? task.reminderOffsetMin
      : task.dueHasTime
        ? 0
        : null;
  if (offset == null) return null;
  return new Date(due.getTime() - offset * 60_000);
}

function shouldSchedule(task: Task): boolean {
  if (task.completed || !task.dueAt) return false;
  if (task.reminderOffsetMin != null) return true;
  return !!task.dueHasTime;
}

/**
 * Schedule (or reschedule) a local reminder for a task.
 * Returns the notification id, or null if nothing was scheduled.
 */
export async function scheduleReminder(task: Task): Promise<string | null> {
  try {
    if (!shouldSchedule(task)) return null;
    const fireDate = reminderFireDate(task);
    if (!fireDate || fireDate.getTime() <= Date.now() + 1500) return null;

    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: task.title || 'Task reminder',
        body: task.notes?.trim() ? task.notes : 'Your task is due now.',
        data: { taskId: task.id, kind: 'task-reminder' },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : null),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
        channelId: Platform.OS === 'android' ? 'reminders' : undefined,
      },
    });
    return id;
  } catch {
    return null;
  }
}

/** Snooze a reminder for N minutes from now. */
export async function scheduleSnooze(task: Task, minutes: number): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;
    const when = new Date(Date.now() + Math.max(1, minutes) * 60_000);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: task.title || 'Task reminder',
        body: task.notes?.trim() ? task.notes : 'Snoozed reminder.',
        data: { taskId: task.id, kind: 'task-reminder' },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : null),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: Platform.OS === 'android' ? 'reminders' : undefined,
      },
    });
    return id;
  } catch {
    return null;
  }
}

/** Cancel a previously scheduled reminder. Never throws. */
export async function cancelReminder(reminderId?: string | null) {
  if (!reminderId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
  } catch {
    // ignore
  }
}

/** iOS shows an Android channel warning otherwise; harmless no-op on iOS. */
export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 120, 250],
      sound: 'default',
      enableVibrate: true,
    });
  } catch {
    // ignore
  }
}

export function taskIdFromNotification(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const taskId = (data as { taskId?: unknown }).taskId;
  return typeof taskId === 'string' ? taskId : null;
}
