import { authApi } from '@/lib/api';
import { openGoogleAuth } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/design';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function LoginScreen() {
  const { setSession } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (!trimmedEmail) {
      Alert.alert('Email required', 'Enter your email.');
      return;
    }
    if (!password) {
      Alert.alert('Password required', 'Enter your password.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(trimmedEmail, password);
      if (res.token && res.user) {
        setSession(res.user, res.token);
        router.replace('/(tabs)');
      }
    } catch (err) {
      Alert.alert('Login failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await openGoogleAuth();
      if (result.token && result.user) {
        setSession(result.user, result.token);
        router.replace('/(tabs)');
        return;
      }
      if (!result.cancelled) {
        Alert.alert('Sign-in incomplete', 'Finish Google sign-in in the browser.');
      }
    } catch (err) {
      Alert.alert('Google sign-in failed', (err as Error).message);
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
          {/* Header: Log In + Cancel */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap} />
            <Text style={styles.title}>Log In</Text>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>

          {/* Info text */}
          <Text style={styles.infoText}>
            Log in to earn reward points as you spend at Thamel Bar. Sometimes free shots.🍸
          </Text>

          {/* Social login buttons */}
          {/* <Animated.View style={[styles.socialSection, cardStyle]}>
            <Pressable
              style={({ pressed }) => [
                styles.socialBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={handleGoogleLogin}>
              <Image
                source={require('@/assets/images/google-logo.webp')}
                style={styles.socialIcon}
              />
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </Pressable>
            
          </Animated.View> */}

          {/* OR divider */}
          {/* <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View> */}

          {/* Email + Password */}
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
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
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
                <Text style={styles.btnPrimaryText}>Log in</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.forgotLink,
                pressed && styles.btnPressed,
              ]}
              onPress={() => router.push('/forgot-password' as never)}>
              <Text style={styles.forgotLinkText}>Forgot Password?</Text>
            </Pressable>
          </Animated.View>

          {/* Footer: Create account */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable
              style={({ pressed }) => [
                styles.footerLinkWrap,
                pressed && styles.btnPressed,
              ]}
              onPress={() => router.push('/signup')}>
              <Text style={styles.footerLink}>Create one.</Text>
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
  socialSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialBtnText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    marginBottom: Spacing.md,
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
  forgotLink: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  forgotLinkText: {
    ...Typography.body,
    color: Colors.primary,
  },
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
