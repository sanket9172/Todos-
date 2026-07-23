import type { Priority } from '@/types';

/** Palette offered when creating a project — blue / green / teal focused. */
export const PROJECT_COLORS = [
  '#1A7AE8', // blue
  '#12A36A', // green
  '#0FA3B1', // teal
  '#2B9BFF', // sky
  '#1EBE7A', // mint
  '#E09B1B', // warm accent
  '#E04848', // red
  '#4A667A', // slate
] as const;

interface PriorityStyle {
  label: string;
  color: string;
  icon: 'flag' | 'flag-outline';
}

export const PRIORITY_STYLES: Record<Priority, PriorityStyle> = {
  urgent: { label: 'Urgent', color: '#E04848', icon: 'flag' },
  high: { label: 'High', color: '#E09B1B', icon: 'flag' },
  medium: { label: 'Medium', color: '#0FA3B1', icon: 'flag' },
  low: { label: 'Low', color: '#12A36A', icon: 'flag' },
  none: { label: 'None', color: '#8AA0B2', icon: 'flag-outline' },
};

export const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent'];
