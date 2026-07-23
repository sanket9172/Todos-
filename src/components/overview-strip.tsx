import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

export interface OverviewItem {
  key: string;
  label: string;
  count: number;
  color: string;
  onPress?: () => void;
}

/** Single professional overview strip — Today / Overdue / Soon / Flag. */
export function OverviewStrip({ items }: { items: OverviewItem[] }) {
  const c = useColors();
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.separator }]}>
      {items.map((item, i) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.cell,
            i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.separator },
            pressed && { backgroundColor: c.backgroundElement },
          ]}>
          <Text style={[styles.count, { color: item.color }]}>{item.count}</Text>
          <Text style={[styles.label, { color: c.textSecondary }]} numberOfLines={1}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 4,
  },
  count: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
