import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

interface Action {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
}

interface Props {
  title: string;
  subtitle?: string;
  /** Shown before the title (e.g. hamburger) */
  leading?: Action;
  actions?: Action[];
}

export function LargeHeader({ title, subtitle, leading, actions = [] }: Props) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        {leading ? (
          <Pressable
            onPress={leading.onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={leading.label}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: c.backgroundElement, opacity: pressed ? 0.6 : 1 },
            ]}>
            <Ionicons name={leading.icon} size={20} color={c.tint} />
          </Pressable>
        ) : null}

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: c.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: c.backgroundElement, opacity: pressed ? 0.6 : 1 },
              ]}>
              <Ionicons name={a.icon} size={20} color={c.accent} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
