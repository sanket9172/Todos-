import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ReminderHost } from '@/components/reminder-host';
import { Sidebar } from '@/components/sidebar';
import { useColors, useIsDark } from '@/hooks/use-colors';
import { configureNotifications, ensureAndroidChannel } from '@/lib/notifications';
import { useStore } from '@/store/useStore';

SplashScreen.preventAutoHideAsync().catch(() => {});
configureNotifications();

export default function RootLayout() {
  const isDark = useIsDark();
  const c = useColors();
  const hydrated = useStore((s) => s._hasHydrated);
  const seedIfEmpty = useStore((s) => s.seedIfEmpty);

  useEffect(() => {
    ensureAndroidChannel();
  }, []);

  useEffect(() => {
    if (hydrated) {
      seedIfEmpty();
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hydrated, seedIfEmpty]);

  if (!hydrated) return null;

  const navTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider
          value={{
            ...navTheme,
            colors: { ...navTheme.colors, primary: c.tint, background: c.background },
          }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="task/[id]" options={{ presentation: 'modal', title: '' }} />
            <Stack.Screen name="project/[id]" options={{ title: 'Project' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="login" options={{ title: 'Account', presentation: 'modal' }} />
          </Stack>
          <Sidebar />
          <ReminderHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
