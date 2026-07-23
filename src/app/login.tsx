import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { detectIdentifierKind } from '@/lib/auth';
import { hapticSuccess, hapticWarning } from '@/lib/haptics';
import { useAuth } from '@/store/useAuth';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signIn = useAuth((s) => s.signIn);
  const signUp = useAuth((s) => s.signUp);

  const [mode, setMode] = useState<Mode>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kind = detectIdentifierKind(identifier);
  const kindHint =
    identifier.trim().length === 0
      ? 'Email or mobile number'
      : kind === 'email'
        ? 'Email'
        : kind === 'phone'
          ? 'Mobile number'
          : 'Enter a valid email or mobile';

  async function submit() {
    setError(null);
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match');
      hapticWarning();
      return;
    }

    setBusy(true);
    try {
      const result =
        mode === 'signin'
          ? await signIn({ identifier, password, rememberMe })
          : await signUp({
              identifier,
              password,
              displayName,
              rememberMe,
            });

      if (!result.ok) {
        setError(result.error);
        hapticWarning();
        return;
      }
      hapticSuccess();
      router.back();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: Spacing.three,
            paddingBottom: insets.bottom + 40,
            paddingTop: Spacing.two,
          }}
          showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: c.card, borderColor: c.separator }]}>
            <View style={[styles.iconWrap, { backgroundColor: c.tint + '18' }]}>
              <Ionicons name="person-circle-outline" size={36} color={c.tint} />
            </View>
            <Text style={[styles.heroTitle, { color: c.text }]}>
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </Text>
            <Text style={[styles.heroSub, { color: c.textSecondary }]}>
              Optional local login so this device remembers you. Data stays on your phone.
            </Text>
          </View>

          <View style={styles.modeRow}>
            <Pressable
              onPress={() => {
                setMode('signin');
                setError(null);
              }}
              style={[
                styles.modeBtn,
                {
                  backgroundColor: mode === 'signin' ? c.tint : c.backgroundElement,
                },
              ]}>
              <Text
                style={[
                  styles.modeText,
                  { color: mode === 'signin' ? c.onTint : c.textSecondary },
                ]}>
                Sign in
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('signup');
                setError(null);
              }}
              style={[
                styles.modeBtn,
                {
                  backgroundColor: mode === 'signup' ? c.tint : c.backgroundElement,
                },
              ]}>
              <Text
                style={[
                  styles.modeText,
                  { color: mode === 'signup' ? c.onTint : c.textSecondary },
                ]}>
                Create account
              </Text>
            </Pressable>
          </View>

          <View style={[styles.form, { backgroundColor: c.card, borderColor: c.separator }]}>
            {mode === 'signup' && (
              <View style={[styles.field, { borderBottomColor: c.separator }]}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Name (optional)</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={c.textSecondary}
                  autoCapitalize="words"
                  style={[styles.input, { color: c.text }]}
                />
              </View>
            )}

            <View style={[styles.field, { borderBottomColor: c.separator }]}>
              <Text style={[styles.label, { color: c.textSecondary }]}>{kindHint}</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name={kind === 'phone' ? 'call-outline' : 'mail-outline'}
                  size={18}
                  color={c.textSecondary}
                />
                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="name@email.com or 9876543210"
                  placeholderTextColor={c.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  style={[styles.input, { color: c.text, flex: 1 }]}
                />
              </View>
            </View>

            <View
              style={[
                styles.field,
                mode === 'signup' && { borderBottomColor: c.separator, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={c.textSecondary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={c.textSecondary}
                  secureTextEntry={!showPassword}
                  textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                  style={[styles.input, { color: c.text, flex: 1 }]}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={c.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            {mode === 'signup' && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Confirm password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={c.textSecondary} />
                  <TextInput
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Repeat password"
                    placeholderTextColor={c.textSecondary}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    style={[styles.input, { color: c.text, flex: 1 }]}
                  />
                </View>
              </View>
            )}
          </View>

          <View style={[styles.remember, { backgroundColor: c.card }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: c.text }]}>Remember me</Text>
              <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 2 }}>
                Stay signed in on this device
              </Text>
            </View>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ true: c.tint }}
            />
          </View>

          {error ? (
            <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [
              styles.submit,
              {
                backgroundColor: c.tint,
                opacity: busy ? 0.7 : pressed ? 0.88 : 1,
              },
            ]}>
            {busy ? (
              <ActivityIndicator color={c.onTint} />
            ) : (
              <Text style={[styles.submitText, { color: c.onTint }]}>
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Text>
            )}
          </Pressable>

          <Text style={[styles.note, { color: c.textSecondary }]}>
            Login is stored only on this device. It does not sync to the cloud.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  heroSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  form: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  field: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    fontSize: 16,
    paddingVertical: 2,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  submit: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
  },
  note: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: Spacing.three,
    lineHeight: 18,
  },
});
