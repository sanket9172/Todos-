import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * On web we simply read the system color scheme. (The app targets iOS; this
 * variant only exists so bundling for web stays functional.)
 */
export function useColorScheme() {
  return useRNColorScheme() ?? 'light';
}
