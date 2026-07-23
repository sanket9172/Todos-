import * as Haptics from 'expo-haptics';

import { useStore } from '@/store/useStore';

function enabled(): boolean {
  try {
    return useStore.getState().settings.hapticsEnabled;
  } catch {
    return true;
  }
}

export function hapticSelection() {
  if (!enabled()) return;
  Haptics.selectionAsync().catch(() => {});
}

export function hapticSuccess() {
  if (!enabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticLight() {
  if (!enabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticWarning() {
  if (!enabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
