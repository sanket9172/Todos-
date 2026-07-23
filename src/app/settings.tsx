import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { OptionSheet } from '@/components/option-sheet';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Segmented } from '@/components/segmented';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { formatIdentifier } from '@/lib/auth';
import { requestNotificationPermission } from '@/lib/notifications';
import { useAuth } from '@/store/useAuth';
import { useStore } from '@/store/useStore';
import type { ThemePreference } from '@/types';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const c = useColors();
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const clearCompleted = useStore((s) => s.clearCompleted);
  const tasks = useStore((s) => s.tasks);
  const sessionId = useAuth((s) => s.sessionAccountId);
  const accounts = useAuth((s) => s.accounts);
  const signOut = useAuth((s) => s.signOut);
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const account = accounts.find((a) => a.id === sessionId) ?? null;
  const [hourSheet, setHourSheet] = useState(false);

  async function enableReminders() {
    const granted = await requestNotificationPermission();
    Alert.alert(
      granted ? 'Reminders enabled' : 'Reminders disabled',
      granted
        ? 'You’ll be notified before tasks are due.'
        : 'Enable notifications for Todos in the iOS Settings app to get reminders.',
    );
  }

  function resetData() {
    Alert.alert('Delete all data', 'This removes every task and project on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: () =>
          useStore.setState({ tasks: [], projects: [], labels: [], savedViews: [] }),
      },
    ]);
  }

  function confirmSignOut() {
    Alert.alert('Sign out', 'You’ll stay signed out until you log in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', onPress: () => signOut() },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Remove account',
      'Deletes your login from this device. Your tasks are not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteAccount() },
      ],
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader title="Account" />
        <View style={[styles.group, { backgroundColor: c.card }]}>
          {account ? (
            <>
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: c.tint + '18' }]}>
                  <Ionicons name="person" size={18} color={c.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: c.text }]}>
                    {account.displayName || 'Signed in'}
                  </Text>
                  <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 2 }}>
                    {formatIdentifier(account.kind, account.identifier)}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={confirmSignOut}
                style={({ pressed }) => [
                  styles.row,
                  styles.divider,
                  { borderTopColor: c.separator },
                  pressed && { backgroundColor: c.backgroundElement },
                ]}>
                <Ionicons name="log-out-outline" size={20} color={c.textSecondary} />
                <Text style={[styles.rowLabel, { color: c.text }]}>Sign out</Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteAccount}
                style={({ pressed }) => [
                  styles.row,
                  styles.divider,
                  { borderTopColor: c.separator },
                  pressed && { backgroundColor: c.backgroundElement },
                ]}>
                <Ionicons name="trash-outline" size={20} color={c.danger} />
                <Text style={[styles.rowLabel, { color: c.danger }]}>Remove account</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => router.push('/login')}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: c.backgroundElement },
              ]}>
              <View style={[styles.avatar, { backgroundColor: c.tint + '18' }]}>
                <Ionicons name="log-in-outline" size={18} color={c.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: c.text }]}>Sign in or create account</Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 2 }}>
                  Email or mobile · password · remember me
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.separator} />
            </Pressable>
          )}
        </View>

        <SectionHeader title="Appearance" />
        <View style={[styles.group, { backgroundColor: c.card }]}>
          <View style={styles.rowColumn}>
            <Text style={[styles.rowLabel, { color: c.text }]}>Theme</Text>
            <Segmented
              options={THEME_OPTIONS}
              value={settings.themePreference}
              onChange={(v) => updateSettings({ themePreference: v })}
            />
          </View>
          <View style={[styles.row, styles.divider, { borderTopColor: c.separator }]}>
            <Text style={[styles.rowLabel, { color: c.text }]}>Haptics</Text>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
              trackColor={{ true: c.tint }}
            />
          </View>
        </View>

        <SectionHeader title="Reminders" />
        <View style={[styles.group, { backgroundColor: c.card }]}>
          <Pressable
            onPress={enableReminders}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.backgroundElement }]}>
            <Ionicons name="notifications-outline" size={20} color={c.tint} />
            <Text style={[styles.rowLabel, { color: c.text }]}>Enable notifications</Text>
            <Ionicons name="chevron-forward" size={16} color={c.separator} />
          </Pressable>
          <Pressable
            onPress={() => setHourSheet(true)}
            style={({ pressed }) => [
              styles.row,
              styles.divider,
              { borderTopColor: c.separator },
              pressed && { backgroundColor: c.backgroundElement },
            ]}>
            <Ionicons name="time-outline" size={20} color={c.textSecondary} />
            <Text style={[styles.rowLabel, { color: c.text }]}>Default reminder time</Text>
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>
              {String(settings.defaultReminderHour).padStart(2, '0')}:00
            </Text>
          </Pressable>
        </View>

        <SectionHeader title="Data" />
        <View style={[styles.group, { backgroundColor: c.card }]}>
          <Pressable
            onPress={() => clearCompleted()}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.backgroundElement }]}>
            <Ionicons name="checkmark-done-outline" size={20} color={c.textSecondary} />
            <Text style={[styles.rowLabel, { color: c.text }]}>Clear completed</Text>
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>{completedCount}</Text>
          </Pressable>
          <Pressable
            onPress={resetData}
            style={({ pressed }) => [
              styles.row,
              styles.divider,
              { borderTopColor: c.separator },
              pressed && { backgroundColor: c.backgroundElement },
            ]}>
            <Ionicons name="trash-outline" size={20} color={c.danger} />
            <Text style={[styles.rowLabel, { color: c.danger }]}>Delete all data</Text>
          </Pressable>
        </View>

        <SectionHeader title="About" />
        <View style={[styles.group, { backgroundColor: c.card }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: c.text }]}>Todos</Text>
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>v1.0.0</Text>
          </View>
        </View>
        <Text style={[styles.footer, { color: c.separator }]}>
          Offline-first · your data stays on this device
        </Text>
      </ScrollView>

      <OptionSheet
        visible={hourSheet}
        title="Default reminder time"
        onClose={() => setHourSheet(false)}
        onSelect={(key) => {
          updateSettings({ defaultReminderHour: Number(key) });
          setHourSheet(false);
        }}
        options={[7, 8, 9, 10, 12, 18].map((h) => ({
          key: String(h),
          label: `${String(h).padStart(2, '0')}:00`,
          icon: 'time-outline',
          selected: settings.defaultReminderHour === h,
        }))}
      />
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
    paddingVertical: 14,
  },
  rowColumn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: Spacing.four,
  },
});
