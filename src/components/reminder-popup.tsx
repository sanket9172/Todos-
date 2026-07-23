import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { formatDue } from '@/lib/date';
import { playReminderAlert, stopReminderAlert } from '@/lib/reminder-alert';
import { useStore } from '@/store/useStore';
import { useUI } from '@/store/useUI';

const SNOOZE_MINUTES = 10;

/** Full-screen reminder popup with beep, task details, Remember + Later. */
export function ReminderPopup() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const taskId = useUI((s) => s.reminderTaskId);
  const dismissReminder = useUI((s) => s.dismissReminder);
  const task = useStore((s) => s.tasks.find((t) => t.id === taskId) ?? null);
  const project = useStore((s) =>
    task?.projectId ? s.projects.find((p) => p.id === task.projectId) ?? null : null,
  );
  const snoozeReminder = useStore((s) => s.snoozeReminder);

  useEffect(() => {
    if (!taskId || !task) return;
    playReminderAlert();
    return () => {
      stopReminderAlert();
    };
  }, [taskId, task?.id]);

  if (!taskId || !task) return null;

  const dueLabel = formatDue(task.dueAt, task.dueHasTime) || 'No due time';
  const priorityLabel =
    task.priority === 'none' ? null : task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

  async function onLater() {
    stopReminderAlert();
    await snoozeReminder(task!.id, SNOOZE_MINUTES);
    dismissReminder();
  }

  function onRemember() {
    stopReminderAlert();
    dismissReminder();
    router.push({ pathname: '/task/[id]', params: { id: task!.id } });
  }

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onLater}>
      <View
        style={[
          styles.backdrop,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.separator }]}>
          <View style={[styles.badge, { backgroundColor: c.tint + '18' }]}>
            <Ionicons name="alarm" size={28} color={c.tint} />
          </View>

          <Text style={[styles.kicker, { color: c.tint }]}>REMINDER</Text>
          <Text style={[styles.title, { color: c.text }]}>{task.title}</Text>

          {task.notes?.trim() ? (
            <Text style={[styles.notes, { color: c.textSecondary }]} numberOfLines={4}>
              {task.notes.trim()}
            </Text>
          ) : null}

          <View style={[styles.metaBox, { backgroundColor: c.backgroundElement }]}>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color={c.textSecondary} />
              <Text style={[styles.metaText, { color: c.text }]}>{dueLabel}</Text>
            </View>
            {project ? (
              <View style={styles.metaRow}>
                <View style={[styles.dot, { backgroundColor: project.color }]} />
                <Text style={[styles.metaText, { color: c.text }]}>{project.name}</Text>
              </View>
            ) : null}
            {priorityLabel ? (
              <View style={styles.metaRow}>
                <Ionicons name="flag-outline" size={16} color={c.danger} />
                <Text style={[styles.metaText, { color: c.text }]}>{priorityLabel} priority</Text>
              </View>
            ) : null}
            {task.labels.length > 0 ? (
              <View style={styles.metaRow}>
                <Ionicons name="pricetag-outline" size={16} color={c.textSecondary} />
                <Text style={[styles.metaText, { color: c.text }]}>
                  {task.labels.map((l) => `#${l}`).join('  ')}
                </Text>
              </View>
            ) : null}
            {task.subtasks.length > 0 ? (
              <View style={styles.metaRow}>
                <Ionicons name="checkbox-outline" size={16} color={c.textSecondary} />
                <Text style={[styles.metaText, { color: c.text }]}>
                  {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} subtasks
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onLater}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: c.backgroundElement,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons name="time-outline" size={18} color={c.text} />
              <Text style={[styles.btnText, { color: c.text }]}>Later</Text>
              <Text style={[styles.btnHint, { color: c.textSecondary }]}>+{SNOOZE_MINUTES} min</Text>
            </Pressable>

            <Pressable
              onPress={onRemember}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: c.tint, opacity: pressed ? 0.9 : 1 },
              ]}>
              <Ionicons name="checkmark-circle" size={18} color={c.onTint} />
              <Text style={[styles.btnText, { color: c.onTint }]}>Remember</Text>
              <Text style={[styles.btnHint, { color: c.onTint, opacity: 0.85 }]}>Open task</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: 10,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  kicker: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  notes: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
  },
  metaBox: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: 10,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    flex: 1,
    fontSize: 15,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 3,
    marginRight: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.two,
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  btnHint: {
    fontSize: 12,
    fontWeight: '500',
  },
});
