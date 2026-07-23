/**
 * Todos color system — blue + green focused, clean and colorful.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1F33',
    background: '#EAF6F1',
    card: '#FFFFFF',
    backgroundElement: '#D7F0E8',
    backgroundSelected: '#C5E8FC',
    textSecondary: '#4A667A',
    tint: '#1A7AE8',
    accent: '#12A36A',
    onTint: '#FFFFFF',
    success: '#12A36A',
    warning: '#E09B1B',
    danger: '#E04848',
    separator: '#C9E2D8',
  },
  dark: {
    text: '#F4FBFF',
    background: '#07141F',
    card: '#0F2433',
    backgroundElement: '#143042',
    backgroundSelected: '#1A3D55',
    textSecondary: '#9BB4C7',
    tint: '#4DA3FF',
    accent: '#2DD48A',
    onTint: '#062018',
    success: '#2DD48A',
    warning: '#F0C04A',
    danger: '#FF6B6B',
    separator: '#1E3A4C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
