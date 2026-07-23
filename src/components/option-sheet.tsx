import { Ionicons } from '@expo/vector-icons';
import {
  Dimensions,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { hapticSelection } from '@/lib/haptics';

export interface SheetOption {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  selected?: boolean;
  destructive?: boolean;
}

interface Props {
  visible: boolean;
  title: string;
  options: SheetOption[];
  onSelect: (key: string) => void;
  onClose: () => void;
}

const MAX_RATIO = 0.55;

export function OptionSheet({ visible, title, options, onSelect, onClose }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const maxHeight = Dimensions.get('window').height * MAX_RATIO;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => Keyboard.dismiss()}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: c.card,
              paddingBottom: insets.bottom + 8,
              maxHeight,
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={[styles.grabber, { backgroundColor: c.separator }]} />
          <Text style={[styles.title, { color: c.textSecondary }]}>{title}</Text>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={options.length > 6}
            showsVerticalScrollIndicator={options.length > 8}>
            {options.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => {
                  hapticSelection();
                  onSelect(opt.key);
                }}
                style={({ pressed }) => [
                  styles.row,
                  { borderTopColor: c.separator },
                  pressed && { backgroundColor: c.backgroundElement },
                ]}>
                {opt.icon ? (
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={opt.destructive ? c.danger : opt.color ?? c.text}
                  />
                ) : (
                  <View style={{ width: 20 }} />
                )}
                <Text
                  style={[styles.label, { color: opt.destructive ? c.danger : c.text }]}>
                  {opt.label}
                </Text>
                {opt.selected && <Ionicons name="checkmark" size={20} color={c.tint} />}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingVertical: Spacing.two,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
});
