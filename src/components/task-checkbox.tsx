import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { PRIORITY_STYLES } from '@/lib/colors';
import { hapticSuccess } from '@/lib/haptics';
import { useColors } from '@/hooks/use-colors';
import type { Priority } from '@/types';

interface Props {
  completed: boolean;
  priority?: Priority;
  onToggle: () => void;
  size?: number;
}

export function TaskCheckbox({ completed, priority = 'none', onToggle, size = 26 }: Props) {
  const c = useColors();
  const accent =
    priority === 'none' ? c.tint : PRIORITY_STYLES[priority].color;

  return (
    <Pressable
      hitSlop={10}
      onPress={() => {
        if (!completed) hapticSuccess();
        onToggle();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={completed ? 'Mark task incomplete' : 'Complete task'}
      style={styles.hit}>
      <Ionicons
        name={completed ? 'checkmark-circle' : 'ellipse-outline'}
        size={size}
        color={completed ? c.success : accent}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
