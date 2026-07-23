import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

export function SectionHeader({ title, count }: { title: string; count?: number }) {
  const c = useColors();
  const danger = title === 'Overdue' || title.toLowerCase().startsWith('overdue');
  return (
    <View style={[styles.wrap, { backgroundColor: c.background }]}>
      <Text style={[styles.text, { color: danger ? c.danger : c.textSecondary }]}>
        {title.toUpperCase()}
      </Text>
      {count != null && (
        <Text style={[styles.count, { color: danger ? c.danger : c.textSecondary }]}>{count}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
