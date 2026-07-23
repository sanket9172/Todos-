import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { hapticSuccess } from '@/lib/haptics';

interface Props {
  placeholder?: string;
  onSubmit: (title: string) => void;
}

/** Simple add-task field — icon + input, submit with keyboard Done. */
export function QuickAdd({ placeholder = 'Add a task', onSubmit }: Props) {
  const c = useColors();
  const [value, setValue] = useState('');

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    hapticSuccess();
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <View style={[styles.bar, { backgroundColor: c.backgroundElement }]}>
      <Ionicons name="search" size={18} color={c.textSecondary} />
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
        style={[styles.input, { color: c.text }]}
        returnKeyType="done"
        onSubmitEditing={submit}
        blurOnSubmit={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
});
