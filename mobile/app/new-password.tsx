import { authApi } from '@/lib/api';
import { Colors, Radius, Spacing, Typography } from '@/constants/design';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string; code: string }>();
  const email = params.email ?? '';
  const code = params.code ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(8);

  useEffect(() => {
    if (!email || !code) {
      router.replace('/forgot-password' as never);
      return;
    }
    cardOpacity.value = withTiming(1, { duration: 200 });
    cardTranslateY.value = withTiming(0, { duration: 200 });
  }, [email, code, cardOpacity, cardTranslateY, router]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleSubmit = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email, code, password);
      Alert.alert(
        'Password reset',
        'Your password has been updated. You can now log in.',
        [{ text: 'OK', onPress: () => router.replace('/login' as never) }]
      );
    } catch (err) {
      Alert.alert('Reset failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap} />
            <Text style={styles.title}>Create new password</Text>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>

          <Text style={styles.infoText}>
            Enter your new password below. Make sure it's at least 6 characters.
          </Text>

          <Animated.View style={[styles.formSection, cardStyle]}>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="New password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textMuted} />
                ) : (
                  <Eye size={20} color={Colors.textMuted} />
                )}
              </Pressable>
            </View>

            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm password"
                placeholderTextColor={Colors.textMuted}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textMuted} />
                ) : (
                  <Eye size={20} color={Colors.textMuted} />
                )}
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && styles.btnPressed,
                loading && styles.btnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || !password.trim() || !confirm.trim()}>
              {loading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.btnPrimaryText}>Reset password</Text>
              )}
            </Pressable>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <Pressable
              style={({ pressed }) => [styles.footerLinkWrap, pressed && styles.btnPressed]}
              onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>Log in.</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerTitleWrap: { width: 60 },
  title: {
    ...Typography.title,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  cancelBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
  cancelBtnText: { ...Typography.button, color: Colors.text, fontSize: 16 },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  formSection: { marginBottom: Spacing.xxl },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  passwordWrap: { position: 'relative', marginBottom: Spacing.md },
  passwordInput: { paddingRight: 52 },
  eyeBtn: {
    position: 'absolute',
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnPrimaryText: { ...Typography.button, color: Colors.text },
  btnDisabled: { opacity: 0.6 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  footerText: { ...Typography.body, color: Colors.textSecondary },
  footerLinkWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  footerLink: { ...Typography.body, color: Colors.primary },
  btnPressed: { opacity: 0.9 },
});
