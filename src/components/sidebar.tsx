import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { formatIdentifier } from '@/lib/auth';
import { PROJECT_COLORS } from '@/lib/colors';
import { hapticSelection } from '@/lib/haptics';
import { quickCounts } from '@/lib/selectors';
import { useAuth } from '@/store/useAuth';
import { useStore } from '@/store/useStore';
import { useUI } from '@/store/useUI';
import type { QuickFilter } from '@/types';

const PANEL_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 320);

const QUICK: {
  filter: QuickFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
}[] = [
  { filter: 'inbox', label: 'Inbox', icon: 'file-tray-outline', tint: '#4A667A' },
  { filter: 'today', label: 'Today', icon: 'sunny-outline', tint: '#1A7AE8' },
  { filter: 'upcoming', label: 'Upcoming', icon: 'calendar-outline', tint: '#12A36A' },
  { filter: 'overdue', label: 'Overdue', icon: 'alert-circle-outline', tint: '#E04848' },
  { filter: 'flagged', label: 'Priority', icon: 'flag-outline', tint: '#0FA3B1' },
  { filter: 'completed', label: 'Completed', icon: 'checkmark-done-outline', tint: '#12A36A' },
];

export function Sidebar() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const open = useUI((s) => s.sidebarOpen);
  const closeSidebar = useUI((s) => s.closeSidebar);
  const jumpToFilter = useUI((s) => s.jumpToFilter);
  const jumpToLabel = useUI((s) => s.jumpToLabel);
  const jumpToSavedView = useUI((s) => s.jumpToSavedView);

  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const labels = useStore((s) => s.labels);
  const savedViews = useStore((s) => s.savedViews);
  const addProject = useStore((s) => s.addProject);
  const addLabel = useStore((s) => s.addLabel);
  const addSavedView = useStore((s) => s.addSavedView);
  const sessionId = useAuth((s) => s.sessionAccountId);
  const accounts = useAuth((s) => s.accounts);
  const account = accounts.find((a) => a.id === sessionId) ?? null;

  const slide = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slide, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slide, {
          toValue: -PANEL_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, fade, slide]);

  const counts = useMemo(() => quickCounts(tasks), [tasks]);
  const countFor = (f: QuickFilter) => {
    if (f === 'inbox') return counts.inbox;
    if (f === 'today') return counts.today;
    if (f === 'upcoming') return counts.upcoming;
    if (f === 'overdue') return counts.overdue;
    if (f === 'flagged') return counts.flagged;
    if (f === 'completed') return tasks.filter((t) => t.completed).length;
    return 0;
  };

  const projectCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.projectId && !t.completed) map[t.projectId] = (map[t.projectId] ?? 0) + 1;
    }
    return map;
  }, [tasks]);

  const labelCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.completed) continue;
      for (const name of t.labels) map[name] = (map[name] ?? 0) + 1;
    }
    return map;
  }, [tasks]);

  function goTasks() {
    closeSidebar();
    // navigate (not push) so an already-open Tasks tab still receives the jump
    setTimeout(() => router.navigate('/tasks'), 40);
  }

  function onQuick(filter: QuickFilter) {
    hapticSelection();
    jumpToFilter(filter);
    goTasks();
  }

  function createProject() {
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length];
    closeSidebar();
    setTimeout(() => {
      if (Platform.OS === 'ios' && Alert.prompt) {
        Alert.prompt('New project', undefined, (text) => {
          if (text?.trim()) {
            const id = addProject(text.trim(), color);
            router.push({ pathname: '/project/[id]', params: { id } });
          }
        });
      } else {
        const id = addProject(`Project ${projects.length + 1}`, color);
        router.push({ pathname: '/project/[id]', params: { id } });
      }
    }, 280);
  }

  function createLabel() {
    closeSidebar();
    setTimeout(() => {
      if (Platform.OS === 'ios' && Alert.prompt) {
        Alert.prompt('New label', 'Name without #', (text) => {
          if (text?.trim()) addLabel(text.trim());
        });
      } else {
        addLabel(`label${labels.length + 1}`);
      }
    }, 280);
  }

  function createSavedView() {
    closeSidebar();
    setTimeout(() => {
      if (Platform.OS === 'ios' && Alert.prompt) {
        Alert.prompt('Save a view', 'Name for this Today filter', (text) => {
          if (text?.trim()) {
            addSavedView(text.trim(), { kind: 'quick', quick: 'today' });
          }
        });
      } else {
        addSavedView(`View ${savedViews.length + 1}`, { kind: 'quick', quick: 'today' });
      }
    }, 280);
  }

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={closeSidebar}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              width: PANEL_WIDTH,
              backgroundColor: c.background,
              paddingTop: insets.top + 4,
              paddingBottom: insets.bottom + 8,
              transform: [{ translateX: slide }],
              borderRightColor: c.separator,
            },
          ]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brand, { color: c.text }]}>Todos</Text>
              <Text style={[styles.sub, { color: c.textSecondary }]}>On this device</Text>
            </View>
            <Pressable
              onPress={closeSidebar}
              hitSlop={10}
              accessibilityLabel="Close menu"
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: c.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}>
              <Ionicons name="close" size={18} color={c.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Spacing.four }}>
            <Text style={[styles.section, { color: c.textSecondary }]}>QUICK VIEWS</Text>
            <View style={[styles.group, { backgroundColor: c.card }]}>
              {QUICK.map((q, i) => (
                <Pressable
                  key={q.filter}
                  onPress={() => onQuick(q.filter)}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && { borderTopColor: c.separator, borderTopWidth: StyleSheet.hairlineWidth },
                    pressed && { backgroundColor: c.backgroundElement },
                  ]}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: (q.tint ?? c.textSecondary) + '18' },
                    ]}>
                    <Ionicons name={q.icon} size={17} color={q.tint ?? c.textSecondary} />
                  </View>
                  <Text style={[styles.rowLabel, { color: c.text }]}>{q.label}</Text>
                  <Text style={[styles.count, { color: c.textSecondary }]}>{countFor(q.filter)}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.section, { color: c.textSecondary }]}>PROJECTS</Text>
            <View style={[styles.group, { backgroundColor: c.card }]}>
              {projects.map((p, i) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    hapticSelection();
                    closeSidebar();
                    setTimeout(
                      () => router.push({ pathname: '/project/[id]', params: { id: p.id } }),
                      40,
                    );
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && {
                      borderTopColor: c.separator,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                    pressed && { backgroundColor: c.backgroundElement },
                  ]}>
                  <View style={[styles.dot, { backgroundColor: p.color }]} />
                  <Text style={[styles.rowLabel, { color: c.text }]}>{p.name}</Text>
                  <Text style={[styles.count, { color: c.textSecondary }]}>
                    {projectCounts[p.id] ?? 0}
                  </Text>
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
                <Ionicons name="add-circle-outline" size={20} color={c.tint} />
                <Text style={[styles.rowLabel, { color: c.tint }]}>New project</Text>
              </Pressable>
            </View>

            <Text style={[styles.section, { color: c.textSecondary }]}>LABELS</Text>
            <View style={[styles.group, { backgroundColor: c.card }]}>
              {labels.length === 0 && (
                <Text style={[styles.emptyHint, { color: c.textSecondary }]}>
                  No labels yet
                </Text>
              )}
              {labels.map((l, i) => (
                <Pressable
                  key={l.id}
                  onPress={() => {
                    hapticSelection();
                    jumpToLabel(l.name);
                    goTasks();
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && {
                      borderTopColor: c.separator,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                    pressed && { backgroundColor: c.backgroundElement },
                  ]}>
                  <Text style={{ color: l.color, fontWeight: '700', width: 18 }}>#</Text>
                  <Text style={[styles.rowLabel, { color: c.text }]}>{l.name}</Text>
                  <Text style={[styles.count, { color: c.textSecondary }]}>
                    {labelCounts[l.name] ?? 0}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={createLabel}
                style={({ pressed }) => [
                  styles.row,
                  labels.length > 0 && {
                    borderTopColor: c.separator,
                    borderTopWidth: StyleSheet.hairlineWidth,
                  },
                  pressed && { backgroundColor: c.backgroundElement },
                ]}>
                <Ionicons name="add-circle-outline" size={20} color={c.tint} />
                <Text style={[styles.rowLabel, { color: c.tint }]}>New label</Text>
              </Pressable>
            </View>

            <Text style={[styles.section, { color: c.textSecondary }]}>SAVED VIEWS</Text>
            <View style={[styles.group, { backgroundColor: c.card }]}>
              {savedViews.length === 0 && (
                <Text style={[styles.emptyHint, { color: c.textSecondary }]}>
                  Save filters from Tasks
                </Text>
              )}
              {savedViews.map((v, i) => (
                <Pressable
                  key={v.id}
                  onPress={() => {
                    hapticSelection();
                    jumpToSavedView(v.id);
                    goTasks();
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && {
                      borderTopColor: c.separator,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                    pressed && { backgroundColor: c.backgroundElement },
                  ]}>
                  <Ionicons name="bookmark-outline" size={18} color={c.textSecondary} />
                  <Text style={[styles.rowLabel, { color: c.text }]}>{v.name}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={createSavedView}
                style={({ pressed }) => [
                  styles.row,
                  savedViews.length > 0 && {
                    borderTopColor: c.separator,
                    borderTopWidth: StyleSheet.hairlineWidth,
                  },
                  pressed && { backgroundColor: c.backgroundElement },
                ]}>
                <Ionicons name="add-circle-outline" size={20} color={c.tint} />
                <Text style={[styles.rowLabel, { color: c.tint }]}>Save a view</Text>
              </Pressable>
            </View>

            <Text style={[styles.section, { color: c.textSecondary }]}>APP</Text>
            <View style={[styles.group, { backgroundColor: c.card }]}>
              <Pressable
                onPress={() => {
                  closeSidebar();
                  setTimeout(() => router.push('/settings'), 40);
                }}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: c.backgroundElement },
                ]}>
                <Ionicons name="settings-outline" size={20} color={c.textSecondary} />
                <Text style={[styles.rowLabel, { color: c.text }]}>Settings</Text>
                <Ionicons name="chevron-forward" size={16} color={c.separator} />
              </Pressable>
              <Pressable
                onPress={() => {
                  hapticSelection();
                  closeSidebar();
                  setTimeout(() => router.push(account ? '/settings' : '/login'), 40);
                }}
                style={({ pressed }) => [
                  styles.row,
                  styles.loginRow,
                  {
                    borderTopColor: c.separator,
                    backgroundColor: pressed ? c.accent + '22' : c.accent + '14',
                  },
                ]}>
                <View style={[styles.loginIcon, { backgroundColor: c.accent + '28' }]}>
                  <Ionicons
                    name={account ? 'person' : 'log-in-outline'}
                    size={18}
                    color={c.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: c.accent, fontWeight: '700' }]}>
                    {account ? account.displayName || 'Account' : 'Login'}
                  </Text>
                  {account ? (
                    <Text style={{ color: c.accent, fontSize: 12, opacity: 0.85, marginTop: 1 }}>
                      {formatIdentifier(account.kind, account.identifier)}
                    </Text>
                  ) : (
                    <Text style={{ color: c.accent, fontSize: 12, opacity: 0.85, marginTop: 1 }}>
                      Email or mobile
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.accent} />
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  brand: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  group: {
    marginHorizontal: Spacing.one,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  count: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    minWidth: 20,
    textAlign: 'right',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
    marginRight: 4,
  },
  emptyHint: {
    fontSize: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  loginRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  loginIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
