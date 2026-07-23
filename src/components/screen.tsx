import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';

/** Full-bleed screen background. Pair with a scroll view using
 *  `contentInsetAdjustmentBehavior="automatic"` for native large titles. */
export function Screen({ children }: { children: ReactNode }) {
  const c = useColors();
  return <View style={[styles.screen, { backgroundColor: c.background }]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
