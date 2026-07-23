import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { OptionSheet, type SheetOption } from '@/components/option-sheet';
import { QuickAdd } from '@/components/quick-add';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { TaskRow } from '@/components/task-row';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { PROJECT_COLORS } from '@/lib/colors';
import { groupByDue } from '@/lib/selectors';
import { useStore } from '@/store/useStore';

export default function ProjectScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);

  const project = projects.find((p) => p.id === id);
  const [sheet, setSheet] = useState<'actions' | 'color' | null>(null);

  const sections = useMemo(
    () => groupByDue(tasks.filter((t) => t.projectId === id)),
    [tasks, id],
  );

  if (!project) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Project' }} />
        <EmptyState icon="folder-open-outline" title="Project not found" />
      </Screen>
    );
  }

  function rename() {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt('Rename project', undefined, (text) => {
        if (text?.trim()) updateProject(project!.id, { name: text.trim() });
      }, 'plain-text', project!.name);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete project', 'Tasks will move to your Inbox.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteProject(project!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: project.name,
          headerRight: () => (
            <Pressable onPress={() => setSheet('actions')} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={c.tint} />
            </Pressable>
          ),
        }}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.dot, { backgroundColor: project.color }]} />
            </View>
            <QuickAdd
              placeholder={`Add to ${project.name}…`}
              onSubmit={(title) => addTask({ title, projectId: project.id })}
            />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.data.length} />
        )}
        renderItem={({ item }) => <TaskRow task={item} project={project} />}
        ListEmptyComponent={
          <EmptyState icon="add-circle-outline" title="No tasks yet" subtitle="Add your first task above." />
        }
      />

      <OptionSheet
        visible={sheet === 'actions'}
        title={project.name}
        onClose={() => setSheet(null)}
        onSelect={(key) => {
          setSheet(null);
          if (key === 'rename') setTimeout(rename, 250);
          else if (key === 'color') setTimeout(() => setSheet('color'), 250);
          else if (key === 'delete') setTimeout(confirmDelete, 250);
        }}
        options={[
          { key: 'rename', label: 'Rename', icon: 'pencil' },
          { key: 'color', label: 'Change color', icon: 'color-palette' },
          { key: 'delete', label: 'Delete project', icon: 'trash', destructive: true },
        ]}
      />

      <OptionSheet
        visible={sheet === 'color'}
        title="Project color"
        onClose={() => setSheet(null)}
        onSelect={(key) => {
          updateProject(project.id, { color: key });
          setSheet(null);
        }}
        options={PROJECT_COLORS.map<SheetOption>((color) => ({
          key: color,
          label: color,
          icon: 'ellipse',
          color,
          selected: project.color === color,
        }))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
