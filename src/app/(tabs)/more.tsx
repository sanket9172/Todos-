import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LargeHeader } from '@/components/large-header';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { PROJECT_COLORS } from '@/lib/colors';
import { hapticSelection } from '@/lib/haptics';
import { useStore } from '@/store/useStore';
import { useUI } from '@/store/useUI';
import type { QuickFilter } from '@/types';

const QUICK_VIEWS: { filter: QuickFilter; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { filter: 'today', label: 'Today', icon: 'sunny', color: '#1A7AE8' },
  { filter: 'upcoming', label: 'Upcoming', icon: 'calendar', color: '#12A36A' },
  { filter: 'overdue', label: 'Overdue', icon: 'alert-circle', color: '#E04848' },
  { filter: 'flagged', label: 'Priority', icon: 'flag', color: '#0FA3B1' },
  { filter: 'inbox', label: 'Inbox', icon: 'file-tray', color: '#4A667A' },
  { filter: 'completed', label: 'Completed', icon: 'checkmark-done', color: '#12A36A' },
];

export default function MoreScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const addProject = useStore((s) => s.addProject);
  const jumpToFilter = useUI((s) => s.jumpToFilter);
  const openSidebar = useUI((s) => s.openSidebar);

  const projectCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.projectId && !t.completed) map[t.projectId] = (map[t.projectId] ?? 0) + 1;
    }
    return map;
  }, [tasks]);

  function openFilter(filter: QuickFilter) {
    hapticSelection();
    jumpToFilter(filter);
    router.navigate('/tasks');
  }

  function createProject() {
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length];
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt('New project', 'Give your project a name', (text) => {
        if (text?.trim()) {
          const id = addProject(text.trim(), color);
          router.push({ pathname: '/project/[id]', params: { id } });
        }
      });
    } else {
      const id = addProject(`Project ${projects.length + 1}`, color);
      router.push({ pathname: '/project/[id]', params: { id } });
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}>
        <LargeHeader
          title="More"
          leading={{ icon: 'menu', label: 'Menu', onPress: openSidebar }}
        />

        <SectionHeader title="Quick views" />
        <View style={[styles.group, { backgroundColor: c.card }]}>
          {QUICK_VIEWS.map((v, i) => (
            <Pressable
              key={v.filter}
              onPress={() => openFilter(v.filter)}
              style={({ pressed }) => [
                styles.row,
                i > 0 && { borderTopColor: c.separator, borderTopWidth: StyleSheet.hairlineWidth },
                pressed && { backgroundColor: c.backgroundElement },
              ]}>
              <View style={[styles.iconWrap, { backgroundColor: v.color + '22' }]}>
                <Ionicons name={v.icon} size={17} color={v.color} />
              </View>
              <Text style={[styles.rowLabel, { color: c.text }]}>{v.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={c.separator} />
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Projects" count={projects.length} />
        <View style={[styles.group, { backgroundColor: c.card }]}>
          {projects.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/project/[id]', params: { id: p.id } })}
              style={({ pressed }) => [
                styles.row,
                i > 0 && { borderTopColor: c.separator, borderTopWidth: StyleSheet.hairlineWidth },
                pressed && { backgroundColor: c.backgroundElement },
              ]}>
              <View style={[styles.projectDot, { backgroundColor: p.color }]} />
              <Text style={[styles.rowLabel, { color: c.text }]}>{p.name}</Text>
              <Text style={[styles.count, { color: c.textSecondary }]}>{projectCounts[p.id] ?? 0}</Text>
              <Ionicons name="chevron-forward" size={16} color={c.separator} />
            </Pressable>
          ))}
          <Pressable
            onPress={createProject}
            style={({ pressed }) => [
              styles.row,
              projects.length > 0 && {
                borderTopColor: c.separator,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
              pressed && { backgroundColor: c.backgroundElement },
            ]}>
            <View style={[styles.iconWrap, { backgroundColor: c.tint + '22' }]}>
              <Ionicons name="add" size={18} color={c.tint} />
            </View>
            <Text style={[styles.rowLabel, { color: c.tint }]}>New project</Text>
          </Pressable>
        </View>

        <SectionHeader title="App" />
        <View style={[styles.group, { backgroundColor: c.card }]}>
          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.backgroundElement }]}>
            <View style={[styles.iconWrap, { backgroundColor: c.textSecondary + '22' }]}>
              <Ionicons name="settings-outline" size={17} color={c.textSecondary} />
            </View>
            <Text style={[styles.rowLabel, { color: c.text }]}>Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={c.separator} />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    marginHorizontal: Spacing.three,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: 8,
    marginRight: 8,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  count: {
    fontSize: 15,
  },
});
