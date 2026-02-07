import { useAuth } from '@/contexts/auth-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/design';
import PullToRefreshScrollView from '@/components/pull-to-refresh-scroll-view';
import { authApi } from '@/lib/api';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Profile / Settings / Auth – v1
 */
export default function ProfileScreen() {
  const { isLoggedIn, user, token, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!token || !isLoggedIn) {
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    try {
      await authApi.getMe(token).then((res) => refreshUser({ points: res.user.points }));
    } finally {
      setRefreshing(false);
    }
  }, [token, isLoggedIn, refreshUser]);

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(8);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 200 });
    headerTranslateY.value = withTiming(0, { duration: 200 });
  }, [headerOpacity, headerTranslateY]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PullToRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}>
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Account and preferences</Text>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            {isLoggedIn && user ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Email</Text>
                  <Text style={styles.rowValue}>{user.email}</Text>
                </View>
                <View style={styles.divider} />
                <Pressable
                  style={({ pressed }) => [
                    styles.row,
                    styles.rowPressable,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={logout}>
                  <Text style={styles.logoutText}>Log out</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.authRow}>
                <Text style={styles.authPrompt}>Log in to sync points and rewards</Text>
                <View style={styles.authButtons}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btnPrimary,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => router.push('/login')}>
                    <Text style={styles.btnPrimaryText}>Log in</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btnSecondary,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => router.push('/signup')}>
                    <Text style={styles.btnSecondaryText}>Sign up</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>App</Text>
          <View style={styles.card}>
            <Pressable
              style={({ pressed }) => [
                styles.row,
                styles.rowPressable,
                pressed && styles.rowPressed,
              ]}
              onPress={() => router.push('/onboarding')}>
              <Text style={styles.rowLabel}>How it works</Text>
              <Text style={styles.linkText}>View</Text>
            </Pressable>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Text style={styles.rowValueMuted}>Coming soon</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Privacy</Text>
          <View style={styles.card}>
            <Text style={styles.privacyText}>
              We use your data to run the loyalty program and send you offers. We
              don’t sell your data. Full policy available on request.
            </Text>
          </View>
        </View>
      </PullToRefreshScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: { marginBottom: Spacing.xl },
  title: {
    ...Typography.display,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  section: { marginBottom: Spacing.xl },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  rowPressable: {
    minHeight: 52,
  },
  rowPressed: { opacity: 0.7 },
  rowLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  rowValue: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  rowValueMuted: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  logoutText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  linkText: {
    ...Typography.body,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.lg,
  },
  authRow: {
    padding: Spacing.lg,
  },
  authPrompt: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  authButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnPrimaryText: {
    ...Typography.button,
    color: Colors.surface,
  },
  btnSecondary: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnSecondaryText: {
    ...Typography.button,
    color: Colors.text,
  },
  btnPressed: { opacity: 0.9 },
  privacyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
    padding: Spacing.lg,
  },
});
