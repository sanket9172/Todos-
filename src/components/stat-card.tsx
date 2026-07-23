import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  color: string;
  onPress?: () => void;
}

export function StatCard({ icon, label, count, color, onPress }: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: color + '33',
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: color + '24' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.count, { color }]}>{count}</Text>
      </View>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1.5,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    fontSize: 26,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
