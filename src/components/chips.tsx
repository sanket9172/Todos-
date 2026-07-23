import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PRIORITY_STYLES } from '@/lib/colors';
import { formatDue, isOverdue } from '@/lib/date';
import { useColors } from '@/hooks/use-colors';
import { Spacing } from '@/constants/theme';
import type { Priority, Project } from '@/types';

export function DueChip({
  dueAt,
  hasTime,
  completed,
}: {
  dueAt?: string | null;
  hasTime?: boolean;
  completed?: boolean;
}) {
  const c = useColors();
  if (!dueAt) return null;
  const overdue = !completed && isOverdue(dueAt);
  const color = completed ? c.textSecondary : overdue ? c.danger : c.textSecondary;
  return (
    <View style={styles.row}>
      <Ionicons name="calendar-outline" size={12} color={color} />
      <Text style={[styles.meta, { color }]}>{formatDue(dueAt, hasTime)}</Text>
    </View>
  );
}

export function PriorityDot({ priority }: { priority: Priority }) {
  if (priority === 'none') return null;
  const style = PRIORITY_STYLES[priority];
  return <Ionicons name={style.icon} size={13} color={style.color} />;
}

export function ProjectBadge({ project }: { project?: Project | null }) {
  const c = useColors();
  if (!project) return null;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: project.color }]} />
      <Text style={[styles.meta, { color: c.textSecondary }]}>{project.name}</Text>
    </View>
  );
}

export function LabelChip({ label }: { label: string }) {
  const c = useColors();
  return (
    <View style={[styles.label, { backgroundColor: c.backgroundElement }]}>
      <Text style={[styles.labelText, { color: c.textSecondary }]}>#{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: 13,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
