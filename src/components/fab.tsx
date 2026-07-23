import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/use-colors';
import { hapticLight } from '@/lib/haptics';

export function Fab({ onPress }: { onPress: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add task"
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: c.tint,
          bottom: insets.bottom + 16,
          opacity: pressed ? 0.88 : 1,
          shadowColor: c.tint,
        },
      ]}>
      <Ionicons name="add" size={30} color={c.onTint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
