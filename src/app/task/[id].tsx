import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OptionSheet, type SheetOption } from '@/components/option-sheet';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { PRIORITIES, PRIORITY_STYLES, PROJECT_COLORS } from '@/lib/colors';
import {
  format,
  formatDue,
  presetDueISO,
  recurrenceLabel,
  toDate,
  withHour,
  type DuePreset,
} from '@/lib/date';
import { hapticSuccess, hapticWarning } from '@/lib/haptics';
import { useStore } from '@/store/useStore';
import type { Priority, Recurrence, Subtask } from '@/types';

type SheetKind = 'priority' | 'due' | 'time' | 'reminder' | 'project' | 'repeat' | 'labels' | null;

const REMINDER_OPTIONS: { key: string; label: string; value: number | null }[] = [
  { key: 'none', label: 'None', value: null },
  { key: 'at', label: 'At time of event', value: 0 },
  { key: 'm10', label: '10 minutes before', value: 10 },
  { key: 'm30', label: '30 minutes before', value: 30 },
  { key: 'h1', label: '1 hour before', value: 60 },
  { key: 'd1', label: '1 day before', value: 1440 },
];

const TIME_OPTIONS: { key: string; label: string; hour: number | null }[] = [
  { key: 'allday', label: 'All day', hour: null },
  { key: 'morning', label: 'Morning · 9:00', hour: 9 },
  { key: 'noon', label: 'Noon · 12:00', hour: 12 },
  { key: 'afternoon', label: 'Afternoon · 15:00', hour: 15 },
  { key: 'evening', label: 'Evening · 18:00', hour: 18 },
  { key: 'night', label: 'Night · 21:00', hour: 21 },
];

const REPEAT_OPTIONS: { key: string; label: string; value: Recurrence | null }[] = [
  { key: 'none', label: 'Never', value: null },
  { key: 'daily', label: 'Every day', value: { frequency: 'daily', interval: 1 } },
  { key: 'weekly', label: 'Every week', value: { frequency: 'weekly', interval: 1 } },
  { key: 'monthly', label: 'Every month', value: { frequency: 'monthly', interval: 1 } },
];

function genId() {
  return `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function recurrenceKey(r?: Recurrence | null): string {
  if (!r) return 'none';
  return r.frequency;
}

export default function TaskEditorScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { id } = useLocalSearchParams<{ id: string }>();

  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const labels = useStore((s) => s.labels);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const addLabel = useStore((s) => s.addLabel);

  const existing = useMemo(() => (id === 'new' ? undefined : tasks.find((t) => t.id === id)), [id, tasks]);
  const isNew = id === 'new';

  const [draft, setDraft] = useState(() => ({
    title: existing?.title ?? '',
    notes: existing?.notes ?? '',
    projectId: existing?.projectId ?? null,
    priority: (existing?.priority ?? 'none') as Priority,
    dueAt: existing?.dueAt ?? null,
    dueHasTime: existing?.dueHasTime ?? false,
    reminderOffsetMin: existing?.reminderOffsetMin ?? null,
    labels: existing?.labels ?? [],
    subtasks: (existing?.subtasks ?? []).map((s) => ({ ...s })) as Subtask[],
    recurrence: existing?.recurrence ?? null,
    completed: existing?.completed ?? false,
  }));

  const [sheet, setSheet] = useState<SheetKind>(null);
  const [newSub, setNewSub] = useState('');

  const project = projects.find((p) => p.id === draft.projectId) ?? null;
  const canSave = draft.title.trim().length > 0;

  function patch(p: Partial<typeof draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function openSheet(kind: SheetKind) {
    Keyboard.dismiss();
    setSheet(kind);
  }

  function save() {
    if (!canSave) {
      Alert.alert('Add a title', 'Your task needs a title before saving.');
      return;
    }
    hapticSuccess();
    if (isNew) {
      const newId = addTask({
        title: draft.title,
        notes: draft.notes || undefined,
        projectId: draft.projectId,
        priority: draft.priority,
        dueAt: draft.dueAt,
        dueHasTime: draft.dueHasTime,
        reminderOffsetMin: draft.reminderOffsetMin,
        labels: draft.labels,
        recurrence: draft.recurrence,
      });
      if (draft.subtasks.length) updateTask(newId, { subtasks: draft.subtasks });
    } else if (existing) {
      updateTask(existing.id, {
        title: draft.title.trim(),
        notes: draft.notes || undefined,
        projectId: draft.projectId,
        priority: draft.priority,
        dueAt: draft.dueAt,
        dueHasTime: draft.dueHasTime,
        reminderOffsetMin: draft.reminderOffsetMin,
        labels: draft.labels,
        subtasks: draft.subtasks,
        recurrence: draft.recurrence,
        completed: draft.completed,
        completedAt: draft.completed ? existing.completedAt ?? new Date().toISOString() : null,
      });
    }
    router.back();
  }

  function confirmDelete() {
    Alert.alert('Delete task', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (existing) deleteTask(existing.id);
          hapticWarning();
          router.back();
        },
      },
    ]);
  }

  function toggleLabel(name: string) {
    if (draft.labels.includes(name)) {
      patch({ labels: draft.labels.filter((l) => l !== name) });
    } else {
      patch({ labels: [...draft.labels, name] });
    }
  }

  function createLabelInSheet() {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt('New label', undefined, (text) => {
        if (text?.trim()) {
          addLabel(text.trim());
          patch({ labels: [...draft.labels, text.trim().replace(/^#/, '')] });
        }
      });
    } else {
      const name = `label${labels.length + 1}`;
      addLabel(name);
      patch({ labels: [...draft.labels, name] });
    }
  }

  if (!isNew && !existing) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Task' }} />
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={c.separator} />
          <Text style={{ color: c.textSecondary, fontSize: 16 }}>This task is no longer available.</Text>
        </View>
      </Screen>
    );
  }

  const reminderLabel =
    REMINDER_OPTIONS.find((r) => r.value === draft.reminderOffsetMin)?.label ?? 'None';

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: isNew ? 'New Task' : 'Edit Task',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={{ color: c.tint, fontSize: 17 }}>Cancel</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={save} hitSlop={8} disabled={!canSave}>
              <Text style={{ color: canSave ? c.tint : c.separator, fontSize: 17, fontWeight: '600' }}>
                Save
              </Text>
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            padding: Spacing.three,
            paddingBottom: insets.bottom + 120,
            gap: Spacing.three,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}>
          {!isNew && (
            <Pressable
              onPress={() => patch({ completed: !draft.completed })}
              style={[styles.completeRow, { backgroundColor: c.card }]}>
              <Ionicons
                name={draft.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={draft.completed ? c.success : c.tint}
              />
              <Text style={{ color: c.text, fontSize: 16 }}>
                {draft.completed ? 'Completed' : 'Mark as complete'}
              </Text>
            </Pressable>
          )}

          <TextInput
            value={draft.title}
            onChangeText={(t) => patch({ title: t })}
            placeholder="What needs to be done?"
            placeholderTextColor={c.textSecondary}
            style={[styles.title, { color: c.text, backgroundColor: c.card }]}
            multiline
            autoFocus={isNew}
            onFocus={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          />

          <TextInput
            value={draft.notes}
            onChangeText={(t) => patch({ notes: t })}
            placeholder="Notes"
            placeholderTextColor={c.textSecondary}
            style={[styles.notes, { color: c.text, backgroundColor: c.card }]}
            multiline
            onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: 80, animated: true }), 100)}
          />

          <View style={[styles.group, { backgroundColor: c.card }]}>
            <PropertyRow
              icon="flag"
              iconColor={PRIORITY_STYLES[draft.priority].color}
              label="Priority"
              value={PRIORITY_STYLES[draft.priority].label}
              onPress={() => openSheet('priority')}
            />
            <PropertyRow
              icon="calendar"
              label="Due date"
              value={draft.dueAt ? formatDue(draft.dueAt, false) : 'None'}
              onPress={() => openSheet('due')}
              divider
            />
            {draft.dueAt && (
              <PropertyRow
                icon="time"
                label="Time"
                value={draft.dueHasTime ? format(toDate(draft.dueAt)!, 'p') : 'All day'}
                onPress={() => openSheet('time')}
                divider
              />
            )}
            {draft.dueAt && (
              <PropertyRow
                icon="alarm"
                label="Reminder"
                value={reminderLabel}
                onPress={() => openSheet('reminder')}
                divider
              />
            )}
            <PropertyRow
              icon="repeat"
              label="Repeat"
              value={recurrenceLabel(draft.recurrence)}
              onPress={() => openSheet('repeat')}
              divider
            />
            <PropertyRow
              icon="folder"
              iconColor={project?.color}
              label="Project"
              value={project?.name ?? 'Inbox'}
              onPress={() => openSheet('project')}
              divider
            />
            <PropertyRow
              icon="pricetag"
              label="Labels"
              value={draft.labels.length ? draft.labels.map((l) => `#${l}`).join(' ') : 'None'}
              onPress={() => openSheet('labels')}
              divider
            />
          </View>

          <View style={[styles.group, { backgroundColor: c.card }]}>
            <Text style={[styles.subHeader, { color: c.textSecondary }]}>
              SUBTASKS{' '}
              {draft.subtasks.length > 0
                ? `· ${draft.subtasks.filter((s) => s.done).length}/${draft.subtasks.length}`
                : ''}
            </Text>
            {draft.subtasks.map((s) => (
              <View key={s.id} style={[styles.subRow, { borderTopColor: c.separator }]}>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    patch({
                      subtasks: draft.subtasks.map((x) =>
                        x.id === s.id ? { ...x, done: !x.done } : x,
                      ),
                    })
                  }>
                  <Ionicons
                    name={s.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={s.done ? c.success : c.textSecondary}
                  />
                </Pressable>
                <Text
                  style={[
                    styles.subText,
                    { color: s.done ? c.textSecondary : c.text },
                    s.done && { textDecorationLine: 'line-through' },
                  ]}>
                  {s.title}
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => patch({ subtasks: draft.subtasks.filter((x) => x.id !== s.id) })}>
                  <Ionicons name="close" size={18} color={c.textSecondary} />
                </Pressable>
              </View>
            ))}
            <View style={[styles.subRow, { borderTopColor: c.separator }]}>
              <Ionicons name="add" size={22} color={c.tint} />
              <TextInput
                value={newSub}
                onChangeText={setNewSub}
                placeholder="Add subtask"
                placeholderTextColor={c.textSecondary}
                style={[styles.subText, { color: c.text }]}
                returnKeyType="done"
                onFocus={() =>
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)
                }
                onSubmitEditing={() => {
                  const title = newSub.trim();
                  if (!title) return;
                  patch({ subtasks: [...draft.subtasks, { id: genId(), title, done: false }] });
                  setNewSub('');
                }}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {!isNew && (
            <Pressable onPress={confirmDelete} style={[styles.deleteBtn, { backgroundColor: c.card }]}>
              <Ionicons name="trash-outline" size={20} color={c.danger} />
              <Text style={{ color: c.danger, fontSize: 16, fontWeight: '500' }}>Delete task</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <OptionSheet
        visible={sheet === 'priority'}
        title="Priority"
        onClose={() => setSheet(null)}
        onSelect={(key) => {
          patch({ priority: key as Priority });
          setSheet(null);
        }}
        options={PRIORITIES.map<SheetOption>((p) => ({
          key: p,
          label: PRIORITY_STYLES[p].label,
          icon: PRIORITY_STYLES[p].icon,
          color: PRIORITY_STYLES[p].color,
          selected: draft.priority === p,
        }))}
      />

      <OptionSheet
        visible={sheet === 'due'}
        title="Due date"
        onClose={() => setSheet(null)}
        onSelect={(key) => {
          if (key === 'none') patch({ dueAt: null, dueHasTime: false, reminderOffsetMin: null });
          else patch({ dueAt: presetDueISO(key as DuePreset) });
          setSheet(null);
        }}
        options={[
          { key: 'today', label: 'Today', icon: 'today' },
          { key: 'tomorrow', label: 'Tomorrow', icon: 'arrow-forward' },
          { key: 'in2', label: 'In 2 days', icon: 'calendar-outline' },
          { key: 'weekend', label: 'This weekend', icon: 'sunny' },
          { key: 'nextweek', label: 'Next week', icon: 'calendar' },
          { key: 'none', label: 'No date', icon: 'close-circle', destructive: true },
        ]}
      />

      <OptionSheet
        visible={sheet === 'time'}
        title="Time"
        onClose={() => setSheet(null)}
        onSelect={(key) => {
          const opt = TIME_OPTIONS.find((t) => t.key === key)!;
          if (opt.hour == null) patch({ dueHasTime: false });
          else
            patch({
              dueAt: withHour(draft.dueAt, opt.hour),
              dueHasTime: true,
              // Auto-alert at due time when a clock time is set
              reminderOffsetMin: draft.reminderOffsetMin ?? 0,
            });
          setSheet(null);
        }}
        options={TIME_OPTIONS.map<SheetOption>((t) => ({
          key: t.key,
          label: t.label,
          icon: t.hour == null ? 'sunny-outline' : 'time-outline',
          selected:
            t.hour == null
              ? !draft.dueHasTime
              : draft.dueHasTime && toDate(draft.dueAt)?.getHours() === t.hour,
        }))}
      />

      <OptionSheet
        visible={sheet === 'reminder'}
        title="Reminder"
        onClose={() => setSheet(null)}
        onSelect={(key) => {
          const opt = REMINDER_OPTIONS.find((r) => r.key === key)!;
          patch({ reminderOffsetMin: opt.value });
          setSheet(null);
        }}
        options={REMINDER_OPTIONS.map<SheetOption>((r) => ({
          key: r.key,
          label: r.label,
          icon: 'alarm-outline',
          selected: draft.reminderOffsetMin === r.value,
        }))}
      />

      <OptionSheet
        visible={sheet === 'repeat'}
        title="Repeat"
        onClose={() => setSheet(null)}
        onSelect={(key) => {
          const opt = REPEAT_OPTIONS.find((r) => r.key === key)!;
          patch({ recurrence: opt.value });
          setSheet(null);
        }}
        options={REPEAT_OPTIONS.map<SheetOption>((r) => ({
          key: r.key,
          label: r.label,
          icon: 'repeat',
          selected: recurrenceKey(draft.recurrence) === r.key,
        }))}
      />

      <OptionSheet
        visible={sheet === 'project'}
        title="Project"
        onClose={() => setSheet(null)}
        onSelect={(key) => {
          patch({ projectId: key === 'none' ? null : key });
          setSheet(null);
        }}
        options={[
          { key: 'none', label: 'Inbox', icon: 'file-tray', selected: !draft.projectId },
          ...projects.map<SheetOption>((p) => ({
            key: p.id,
            label: p.name,
            icon: 'folder',
            color: p.color,
            selected: draft.projectId === p.id,
          })),
        ]}
      />

      <OptionSheet
        visible={sheet === 'labels'}
        title="Labels"
        onClose={() => setSheet(null)}
        onSelect={(key) => {
          if (key === '__done') {
            setSheet(null);
            return;
          }
          if (key === '__new') {
            setSheet(null);
            setTimeout(createLabelInSheet, 250);
            return;
          }
          toggleLabel(key);
        }}
        options={[
          {
            key: '__done',
            label: 'Done',
            icon: 'checkmark-circle',
            color: c.tint,
            selected: false,
          },
          ...labels.map<SheetOption>((l, i) => ({
            key: l.name,
            label: `#${l.name}`,
            icon: 'pricetag',
            color: l.color || PROJECT_COLORS[i % PROJECT_COLORS.length],
            selected: draft.labels.includes(l.name),
          })),
          { key: '__new', label: 'Create label…', icon: 'add-circle', color: c.tint },
        ]}
      />
    </Screen>
  );
}

function PropertyRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  divider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value: string;
  onPress: () => void;
  divider?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.propRow,
        divider && { borderTopColor: c.separator, borderTopWidth: StyleSheet.hairlineWidth },
        pressed && { backgroundColor: c.backgroundElement },
      ]}>
      <Ionicons name={icon} size={20} color={iconColor ?? c.textSecondary} />
      <Text style={[styles.propLabel, { color: c.text }]}>{label}</Text>
      <Text style={[styles.propValue, { color: c.textSecondary }]} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={c.separator} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  completeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    padding: Spacing.three,
    borderRadius: 14,
    minHeight: 56,
  },
  notes: {
    fontSize: 16,
    padding: Spacing.three,
    borderRadius: 14,
    minHeight: 80,
  },
  group: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  propLabel: {
    flex: 1,
    fontSize: 16,
  },
  propValue: {
    fontSize: 16,
    maxWidth: '42%',
    textAlign: 'right',
  },
  subHeader: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  subText: {
    flex: 1,
    fontSize: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 14,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
