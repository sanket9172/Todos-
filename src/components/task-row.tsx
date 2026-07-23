import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActionSheetIOS, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { DueChip, LabelChip, PriorityDot, ProjectBadge } from '@/components/chips';
import { TaskCheckbox } from '@/components/task-checkbox';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { hapticLight, hapticWarning } from '@/lib/haptics';
import { useStore } from '@/store/useStore';
import type { Project, Task } from '@/types';

interface Props {
  task: Task;
  project?: Project | null;
}

export function TaskRow({ task, project }: Props) {
  const c = useColors();
  const router = useRouter();
  const toggleComplete = useStore((s) => s.toggleComplete);
  const deleteTask = useStore((s) => s.deleteTask);

  const doneSubtasks = task.subtasks.filter((s) => s.done).length;

  function openActions() {
    hapticLight();
    if (Platform.OS !== 'ios') {
      router.push(`/task/${task.id}`);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', task.completed ? 'Mark incomplete' : 'Complete', 'Edit', 'Delete'],
        destructiveButtonIndex: 3,
        cancelButtonIndex: 0,
        title: task.title,
      },
      (index) => {
        if (index === 1) toggleComplete(task.id);
        else if (index === 2) router.push(`/task/${task.id}`);
        else if (index === 3) {
          hapticWarning();
          deleteTask(task.id);
        }
      },
    );
  }

  return (
    <Swipeable
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <Pressable
          style={[styles.action, { backgroundColor: c.success }]}
          onPress={() => toggleComplete(task.id)}>
          <Ionicons name="checkmark" size={22} color="#fff" />
          <Text style={styles.actionText}>{task.completed ? 'Undo' : 'Done'}</Text>
        </Pressable>
      )}
      renderRightActions={() => (
        <Pressable
          style={[styles.action, { backgroundColor: c.danger }]}
          onPress={() => {
            hapticWarning();
            deleteTask(task.id);
          }}>
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      )}>
      <Pressable
        onPress={() => router.push(`/task/${task.id}`)}
        onLongPress={openActions}
        style={[styles.row, { backgroundColor: c.card }]}
        accessibilityRole="button"
        accessibilityLabel={task.title}>
        <TaskCheckbox
          completed={task.completed}
          priority={task.priority}
          onToggle={() => toggleComplete(task.id)}
        />

        <View style={styles.body}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              { color: task.completed ? c.textSecondary : c.text },
              task.completed && styles.completed,
            ]}>
            {task.title}
          </Text>

          <View style={styles.metaRow}>
            <PriorityDot priority={task.priority} />
            <DueChip dueAt={task.dueAt} hasTime={task.dueHasTime} completed={task.completed} />
            <ProjectBadge project={project} />
            {task.subtasks.length > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="git-branch-outline" size={12} color={c.textSecondary} />
                <Text style={[styles.meta, { color: c.textSecondary }]}>
                  {doneSubtasks}/{task.subtasks.length}
                </Text>
              </View>
            )}
            {task.reminderOffsetMin != null && (
              <Ionicons name="alarm-outline" size={12} color={c.textSecondary} />
            )}
            {task.recurrence && (
              <Ionicons name="repeat" size={12} color={c.textSecondary} />
            )}
          </View>

          {task.labels.length > 0 && (
            <View style={styles.labels}>
              {task.labels.map((l) => (
                <LabelChip key={l} label={l} />
              ))}
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={c.separator} />
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  body: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  completed: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  meta: {
    fontSize: 13,
  },
  labels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  action: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    gap: 2,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
