import { useAuth } from '@/contexts/auth-context';
import { authApi, pointsApi, type PointTransactionItem } from '@/lib/api';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/design';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import PullToRefreshScrollView from '@/components/pull-to-refresh-scroll-view';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Loyalty Wallet – v1: balance, transactions, how points work
 */
export default function WalletScreen() {
  const { isLoggedIn, user, token, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<PointTransactionItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const cardOpacity = useSharedValue(0);

  const loadData = useCallback(() => {
    if (token && isLoggedIn) {
      return Promise.all([
        authApi.getMe(token).then((res) => refreshUser({ points: res.user.points })).catch(() => {}),
        pointsApi.getTransactions(token).then((res) => setTransactions(res.transactions)).catch(() => setTransactions([])),
      ]);
    }
    setTransactions([]);
    return Promise.resolve();
  }, [token, isLoggedIn, refreshUser]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);
  const cardTranslateY = useSharedValue(12);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 200 });
    cardTranslateY.value = withTiming(0, { duration: 200 });
  }, [cardOpacity, cardTranslateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PullToRefreshScrollView refreshing={refreshing} onRefresh={onRefresh}>
        <View style={styles.container}>
          {/* <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Your points and activity</Text>
        </View> */}

          <Animated.View style={[styles.card, styles.balanceCard, cardStyle]}>
            

            {isLoggedIn && user && (
              <View style={styles.qrSection}>
                <Text style={styles.qrLabel}>Your member code</Text>
                <View style={styles.qrBox}>
                  <QRCode
                    value={JSON.stringify({
                      type: 'member',
                      email: user.email,
                    })}
                    size={160}
                  />
                </View>
                <Text style={styles.qrHint}>
                  Show this code when you pay so staff can scan it and add points to your wallet.
                </Text>
              </View>
            )}
            <Text style={styles.cardLabel}>Points balance</Text>
            <Text style={styles.balanceValue}>{user?.points ?? 0}</Text>
            <Text style={styles.cardHint}>Earn 10 pts per $100 • Redeem in Rewards</Text>

            {!isLoggedIn && (
              <Text style={styles.qrHint}>
                Log in or sign up to get your personal QR code for earning points.
              </Text>
            )}
          </Animated.View>

          <Text style={styles.sectionTitle}>Recent activity</Text>
          <View style={styles.activityCard}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>
                  Earn points when you pay at the bar. Redemptions will show here too.
                </Text>
              </View>
            ) : (
              transactions.map((t) => (
                <View key={t.id} style={styles.transactionRow}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionTitle}>
                      {t.type === 'earn' ? 'Earned' : 'Redeemed'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(t.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.transactionRight}>
                    {t.type === 'earn' && t.amount > 0 && (
                      <Text style={styles.transactionAmount}>${t.amount.toFixed(2)}</Text>
                    )}
                    <Text style={[styles.transactionPoints, t.type === 'earn' ? styles.transactionPointsEarn : styles.transactionPointsRedeem]}>
                      {t.type === 'earn' ? '+' : '-'}{t.points} pts
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          
        </View>
      </PullToRefreshScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  balanceCard: {
    marginBottom: Spacing.xl,
  },
  cardLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  cardHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  qrSection: {
    // marginTop: Spacing.xl,
    alignItems: 'center',
  },
  qrLabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  qrBox: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
  },
  qrHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.titleSmall,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  activityCard: {
    // backgroundColor: Colors.surface,
    // borderRadius: Radius.lg,
    // padding: Spacing.xl,
    // marginBottom: Spacing.xl,
    // minHeight: 140,
    // justifyContent: 'center',
    // ...Shadow.sm,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  transactionLeft: {},
  transactionTitle: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },
  transactionDate: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  transactionPoints: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  transactionPointsEarn: {
    color: Colors.primary,
  },
  transactionPointsRedeem: {
    color: Colors.textSecondary,
  },
  howCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  howTitle: {
    ...Typography.titleSmall,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  howBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
