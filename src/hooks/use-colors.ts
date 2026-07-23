import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';

export type ColorSet = { [K in keyof typeof Colors.light]: string };

/**
 * Resolve the active color set, honoring the user's theme preference
 * (system / light / dark) from settings.
 */
export function useColors(): ColorSet {
  const system = useColorScheme();
  const preference = useStore((s) => s.settings.themePreference);

  let scheme: 'light' | 'dark';
  if (preference === 'system') {
    scheme = system === 'dark' ? 'dark' : 'light';
  } else {
    scheme = preference;
  }
  return Colors[scheme];
}

export function useIsDark(): boolean {
  const system = useColorScheme();
  const preference = useStore((s) => s.settings.themePreference);
  if (preference === 'system') return system === 'dark';
  return preference === 'dark';
}
