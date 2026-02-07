import { authApi } from '@/lib/api';
import { Colors, Radius, Spacing, Typography } from '@/constants/design';
import { useRouter } from 'expo-router';
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(8);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 200 });
    cardTranslateY.value = withTiming(0, { duration: 200 });
  }, [cardOpacity, cardTranslateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;
    setLoading(true);
    try {
      await authApi.requestCode(trimmedEmail);
      router.push({
        pathname: '/verify-code',
        params: { email: trimmedEmail, flow: 'forgot-password' },
      } as never);
    } catch (err) {
      Alert.alert('Failed to send code', (err as Error).message);
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
          {/* Header: Forgot Password + Cancel */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap} />
            <Text style={styles.title}>Forgot Password</Text>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>

          {/* Info text */}
          <Text style={styles.infoText}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          {/* Email */}
          <Animated.View style={[styles.formSection, cardStyle]}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />

            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && styles.btnPressed,
                loading && styles.btnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.btnPrimaryText}>Send reset instructions</Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Footer: Log in */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <Pressable
              style={({ pressed }) => [
                styles.footerLinkWrap,
                pressed && styles.btnPressed,
              ]}
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
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  cancelBtnText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 16,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  formSection: {
    marginBottom: Spacing.xxl,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.xl,
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
  btnPrimaryText: {
    ...Typography.button,
    color: Colors.text,
  },
  btnDisabled: { opacity: 0.6 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  footerLinkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  footerLink: {
    ...Typography.body,
    color: Colors.primary,
  },
  btnPressed: { opacity: 0.9 },
});
