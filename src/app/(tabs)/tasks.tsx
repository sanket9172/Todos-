import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { LargeHeader } from '@/components/large-header';
import { QuickAdd } from '@/components/quick-add';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { SectionHeader } from '@/components/section-header';
import { TaskRow } from '@/components/task-row';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import {
  applyQuickFilter,
  applySavedViewFilter,
  filterByLabel,
  groupByDue,
  searchTasks,
} from '@/lib/selectors';
import { useStore } from '@/store/useStore';
import { useUI } from '@/store/useUI';
import type { QuickFilter } from '@/types';

const FILTERS: { value: QuickFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Soon' },
  { value: 'flagged', label: 'Flag' },
  { value: 'completed', label: 'Done' },
];

export default function TasksScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const savedViews = useStore((s) => s.savedViews);
  const addTask = useStore((s) => s.addTask);
  const addSavedView = useStore((s) => s.addSavedView);
  const openSidebar = useUI((s) => s.openSidebar);
  const pendingFilter = useUI((s) => s.pendingTasksFilter);
  const pendingLabel = useUI((s) => s.pendingLabel);
  const pendingView = useUI((s) => s.pendingSavedViewId);
  const jumpSeq = useUI((s) => s.jumpSeq);

  const [filter, setFilter] = useState<QuickFilter>('all');
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [savedViewId, setSavedViewId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Apply sidebar / home jumps immediately — even when Tasks is already focused
  // (useFocusEffect alone misses those taps).
  useEffect(() => {
    if (!pendingFilter && !pendingLabel && !pendingView) return;
    const { consumePendingFilter, consumePendingLabel, consumePendingSavedView } =
      useUI.getState();
    const view = consumePendingSavedView();
    const label = consumePendingLabel();
    const next = consumePendingFilter();
    if (view) {
      setSavedViewId(view);
      setLabelFilter(null);
      setFilter('all');
      return;
    }
    if (label) {
      setLabelFilter(label);
      setSavedViewId(null);
      setFilter('all');
      return;
    }
    if (next) {
      setFilter(next);
      setLabelFilter(null);
      setSavedViewId(null);
    }
  }, [pendingFilter, pendingLabel, pendingView, jumpSeq]);

  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects],
  );

  const activeSavedView = savedViews.find((v) => v.id === savedViewId) ?? null;

  const headerSubtitle = activeSavedView
    ? `View · ${activeSavedView.name}`
    : labelFilter
      ? `#${labelFilter}`
      : filter === 'overdue'
        ? 'Overdue'
        : filter === 'inbox'
          ? 'Inbox'
          : undefined;

  const showSegment = !labelFilter && !savedViewId && filter !== 'overdue' && filter !== 'inbox';

  const sections = useMemo(() => {
    let list = tasks;
    if (activeSavedView) {
      list = applySavedViewFilter(list, activeSavedView.filter);
    } else if (labelFilter) {
      list = filterByLabel(list, labelFilter);
    } else {
      list = applyQuickFilter(list, filter);
    }
    if (query) list = searchTasks(list, query);
    return groupByDue(list);
  }, [tasks, filter, query, labelFilter, activeSavedView]);

  function clearSpecialFilters() {
    setLabelFilter(null);
    setSavedViewId(null);
    setFilter('all');
  }

  function saveCurrentView() {
    const name = labelFilter
      ? `#${labelFilter}`
      : filter === 'all'
        ? 'All tasks'
        : FILTERS.find((f) => f.value === filter)?.label ?? 'My view';
    addSavedView(name, labelFilter
      ? { kind: 'custom', labelName: labelFilter }
      : { kind: 'quick', quick: filter });
  }

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 96 }}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <LargeHeader
              title="Tasks"
              subtitle={headerSubtitle}
              leading={{ icon: 'menu', label: 'Menu', onPress: openSidebar }}
              actions={[
                {
                  icon: 'bookmark-outline',
                  label: 'Save view',
                  onPress: saveCurrentView,
                },
                {
                  icon: showSearch ? 'close' : 'search',
                  label: 'Search',
                  onPress: () => {
                    setShowSearch((v) => !v);
                    setQuery('');
                  },
                },
              ]}
            />
            {(labelFilter || savedViewId || filter === 'overdue' || filter === 'inbox') && (
              <Pressable
                onPress={clearSpecialFilters}
                style={[styles.chipClear, { backgroundColor: c.backgroundElement }]}>
                <Text style={{ color: c.tint, fontWeight: '600' }}>Clear filter</Text>
              </Pressable>
            )}
            {showSearch && (
              <View style={[styles.search, { backgroundColor: c.backgroundElement }]}>
                <Ionicons name="search" size={18} color={c.textSecondary} />
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search title, notes, labels…"
                  placeholderTextColor={c.textSecondary}
                  style={[styles.searchInput, { color: c.text }]}
                />
              </View>
            )}
            {showSegment && (
              <View style={styles.segment}>
                <Segmented
                  options={FILTERS}
                  value={FILTERS.some((f) => f.value === filter) ? filter : 'all'}
                  onChange={(v) => {
                    clearSpecialFilters();
                    setFilter(v);
                  }}
                />
              </View>
            )}
            <View style={styles.quickAdd}>
              <QuickAdd onSubmit={(title) => addTask({ title })} />
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.data.length} />
        )}
        renderItem={({ item }) => (
          <TaskRow task={item} project={projectsById[item.projectId ?? '']} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="file-tray-outline"
            title={query ? 'No matches' : 'No tasks here'}
            subtitle={query ? 'Try a different search.' : 'Add a task to get started.'}
          />
        }
      />
      <Fab onPress={() => router.push({ pathname: '/task/[id]', params: { id: 'new' } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  segment: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  quickAdd: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  chipClear: {
    alignSelf: 'flex-start',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 10,
  },
});
