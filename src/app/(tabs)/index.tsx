import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { LargeHeader } from '@/components/large-header';
import { OverviewStrip } from '@/components/overview-strip';
import { QuickAdd } from '@/components/quick-add';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { TaskRow } from '@/components/task-row';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { applyQuickFilter, quickCounts, sortTasks } from '@/lib/selectors';
import { useStore } from '@/store/useStore';
import { useUI } from '@/store/useUI';
import type { QuickFilter } from '@/types';

export default function HomeScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const addTask = useStore((s) => s.addTask);
  const jumpToFilter = useUI((s) => s.jumpToFilter);
  const openSidebar = useUI((s) => s.openSidebar);

  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects],
  );
  const counts = useMemo(() => quickCounts(tasks), [tasks]);
  const today = useMemo(() => sortTasks(applyQuickFilter(tasks, 'today')), [tasks]);
  const flagged = useMemo(
    () => sortTasks(applyQuickFilter(tasks, 'flagged')).slice(0, 5),
    [tasks],
  );

  const dateLabel = format(new Date(), 'EEEE, MMM d');
  const summary =
    counts.today + counts.overdue === 0
      ? `${dateLabel} · All clear`
      : counts.overdue > 0
        ? `${dateLabel} · ${counts.today} today · ${counts.overdue} overdue`
        : `${dateLabel} · ${counts.today} due today`;

  function jump(filter: QuickFilter) {
    jumpToFilter(filter);
    router.navigate('/tasks');
  }

  function openNew() {
    router.push({ pathname: '/task/[id]', params: { id: 'new' } });
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}>
        <LargeHeader
          title="Tasks"
          subtitle={summary}
          leading={{ icon: 'menu', label: 'Menu', onPress: openSidebar }}
          actions={[{ icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/settings') }]}
        />

        <View style={styles.topSection}>
          <QuickAdd onSubmit={(title) => addTask({ title })} />
          <OverviewStrip
            items={[
              { key: 'today', label: 'Today', count: counts.today, color: c.tint, onPress: () => jump('today') },
              {
                key: 'overdue',
                label: 'Overdue',
                count: counts.overdue,
                color: c.danger,
                onPress: () => jump('overdue'),
              },
              {
                key: 'upcoming',
                label: 'Soon',
                count: counts.upcoming,
                color: c.accent,
                onPress: () => jump('upcoming'),
              },
              {
                key: 'flagged',
                label: 'Flag',
                count: counts.flagged,
                color: '#0FA3B1',
                onPress: () => jump('flagged'),
              },
            ]}
          />
        </View>

        <SectionHeader title="Today" count={today.length} />
        {today.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" title="You're all caught up" subtitle="Nothing left for today." />
        ) : (
          <View style={[styles.cardList, { backgroundColor: c.card, borderColor: c.separator }]}>
            {today.map((t, i) => (
              <View key={t.id}>
                {i > 0 ? <View style={[styles.divider, { backgroundColor: c.separator }]} /> : null}
                <TaskRow task={t} project={projectsById[t.projectId ?? '']} />
              </View>
            ))}
          </View>
        )}

        {flagged.length > 0 && (
          <>
            <SectionHeader title="Priorities" count={counts.flagged} />
            <View style={[styles.cardList, { backgroundColor: c.card, borderColor: c.separator }]}>
              {flagged.map((t, i) => (
                <View key={t.id}>
                  {i > 0 ? <View style={[styles.divider, { backgroundColor: c.separator }]} /> : null}
                  <TaskRow task={t} project={projectsById[t.projectId ?? '']} />
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={[styles.footer, { color: c.textSecondary }]}>
          {tasks.length} task{tasks.length === 1 ? '' : 's'} total
        </Text>
      </ScrollView>

      <Fab onPress={openNew} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topSection: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  cardList: {
    marginHorizontal: Spacing.three,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: Spacing.four,
  },
});
