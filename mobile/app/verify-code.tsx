import { useAuth } from '@/contexts/auth-context';
import { authApi } from '@/lib/api';
import { Colors, Radius, Spacing, Typography } from '@/constants/design';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
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

type Flow = 'login' | 'signup' | 'forgot-password';

export default function VerifyCodeScreen() {
  const { setSession, pendingSignup, clearPendingSignup } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    email: string;
    flow: Flow;
    name?: string;
    password?: string;
  }>();
  const email = params.email ?? '';
  const flow = (params.flow ?? 'login') as Flow;
  const name = params.name ?? pendingSignup?.name ?? '';
  const password = params.password ?? pendingSignup?.password ?? '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(8);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 200 });
    cardTranslateY.value = withTiming(0, { duration: 200 });
  }, [cardOpacity, cardTranslateY]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (!trimmed || !email) return;
    if (flow === 'signup' && (!name.trim() || !password.trim())) {
      Alert.alert('Error', 'Missing name or password.');
      return;
    }
    setLoading(true);
    try {
      if (flow === 'login') {
        const res = await authApi.verify(email, trimmed, undefined, undefined, 'login');
        if (res.token && res.user) {
          clearPendingSignup();
          setSession(res.user, res.token);
          router.replace('/(tabs)');
        }
      } else if (flow === 'signup') {
        const res = await authApi.verify(email, trimmed, name, password, 'signup');
        if (res.token && res.user) {
          clearPendingSignup();
          setSession(res.user, res.token);
          router.replace('/(tabs)');
        }
      } else {
        router.push({
          pathname: '/new-password',
          params: { email, code: trimmed },
        } as never);
      }
    } catch (err) {
      Alert.alert('Verification failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await authApi.requestCode(email);
      setResendCooldown(60);
      Alert.alert('Code sent', 'A new verification code has been sent to your email.');
    } catch (err) {
      Alert.alert('Failed to resend', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const title =
    flow === 'signup' ? 'Verify your email' : flow === 'login' ? 'Enter verification code' : 'Verify your email';
  const subtitle =
    flow === 'signup'
      ? `We sent a 6-digit code to ${email}. Enter it below to create your account.`
      : flow === 'login'
        ? `We sent a 6-digit code to ${email}. Enter it below to log in.`
        : `Enter the 6-digit code we sent to ${email}.`;

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
            <Text style={styles.title}>{title}</Text>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>

          <Text style={styles.infoText}>{subtitle}</Text>

          <Animated.View style={[styles.formSection, cardStyle]}>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor={Colors.textMuted}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && styles.btnPressed,
                loading && styles.btnDisabled,
              ]}
              onPress={handleVerify}
              disabled={loading || code.trim().length < 6}>
              {loading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  {flow === 'signup' ? 'Create account' : flow === 'login' ? 'Log in' : 'Continue'}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.resendLink,
                pressed && styles.btnPressed,
                (resendCooldown > 0 || loading) && styles.resendDisabled,
              ]}
              onPress={handleResend}
              disabled={resendCooldown > 0 || loading}>
              <Text style={styles.resendLinkText}>
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Didn't get the code? Resend"}
              </Text>
            </Pressable>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {flow === 'signup' || flow === 'login'
                ? "Already have an account? "
                : 'Remember your password? '}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.footerLinkWrap, pressed && styles.btnPressed]}
              onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>Log in.</Text>
              <ChevronRight size={18} color={Colors.primary} />
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
    fontSize: 20,
    letterSpacing: 8,
    color: Colors.text,
    marginBottom: Spacing.xl,
    textAlign: 'center',
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
  resendLink: { alignItems: 'center', paddingVertical: Spacing.lg },
  resendLinkText: { ...Typography.body, color: Colors.primary },
  resendDisabled: { opacity: 0.5 },
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
