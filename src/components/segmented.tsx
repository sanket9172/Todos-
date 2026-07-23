import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { hapticSelection } from '@/lib/haptics';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const c = useColors();
  return (
    <View style={[styles.wrap, { backgroundColor: c.backgroundElement }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              hapticSelection();
              onChange(opt.value);
            }}
            style={[
              styles.item,
              active && {
                backgroundColor: c.card,
                borderColor: c.tint + '55',
                borderWidth: 1,
              },
            ]}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={[
                styles.label,
                {
                  color: active ? c.tint : c.textSecondary,
                  fontWeight: active ? '700' : '500',
                },
              ]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 3,
    gap: 2,
    minHeight: 36,
  },
  item: {
    flex: 1,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 0,
  },
  label: {
    fontSize: 13,
    textAlign: 'center',
  },
});
