import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { LargeHeader } from '@/components/large-header';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { TaskRow } from '@/components/task-row';
import { addDays, dayHeaderLabel, format, isOverdue, startOfDay, toDate } from '@/lib/date';
import { sortTasks } from '@/lib/selectors';
import { useStore } from '@/store/useStore';
import { useUI } from '@/store/useUI';
import type { Task } from '@/types';

const HORIZON_DAYS = 21;

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const openSidebar = useUI((s) => s.openSidebar);

  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects],
  );

  const sections = useMemo(() => {
    const withDue = tasks.filter((t) => !t.completed && t.dueAt);
    const byDay = new Map<string, Task[]>();
    const overdue: Task[] = [];

    for (const t of withDue) {
      if (isOverdue(t.dueAt) && !isSameDay(t.dueAt)) {
        overdue.push(t);
        continue;
      }
      const key = format(toDate(t.dueAt)!, 'yyyy-MM-dd');
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(t);
    }

    const result: { title: string; data: Task[] }[] = [];
    if (overdue.length) result.push({ title: 'Overdue', data: sortTasks(overdue) });

    for (let i = 0; i < HORIZON_DAYS; i++) {
      const day = addDays(startOfDay(new Date()), i);
      const key = format(day, 'yyyy-MM-dd');
      const data = byDay.get(key);
      if (data?.length || i === 0) {
        result.push({ title: dayHeaderLabel(day), data: data ? sortTasks(data) : [] });
      }
    }
    return result;
  }, [tasks]);

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 96 }}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <LargeHeader
            title="Calendar"
            subtitle="Your agenda"
            leading={{ icon: 'menu', label: 'Menu', onPress: openSidebar }}
          />
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.data.length} />
        )}
        renderItem={({ item }) => (
          <TaskRow task={item} project={projectsById[item.projectId ?? '']} />
        )}
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="Nothing scheduled" subtitle="Add due dates to see them here." />
        }
      />
      <Fab onPress={() => router.push({ pathname: '/task/[id]', params: { id: 'new' } })} />
    </Screen>
  );
}

function isSameDay(iso?: string | null): boolean {
  const d = toDate(iso);
  if (!d) return false;
  return format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
}
