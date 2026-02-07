import PullToRefreshScrollView from '@/components/pull-to-refresh-scroll-view';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/design';
import { contentApi, type PromoItem } from '@/lib/api';
import React, { useCallback, useEffect, useState } from 'react';
import Animated from 'react-native-reanimated';
import {
  Dimensions,
  Image,
  ImageBackground,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_PADDING = Spacing.lg;
const CARD_MARGIN = Spacing.md;
const PROMO_CARD_WIDTH = SCREEN_WIDTH - CAROUSEL_PADDING * 2;
const PROMO_CARD_ASPECT = 4 / 4;
const PROMO_CARD_HEIGHT = Math.round(PROMO_CARD_WIDTH / PROMO_CARD_ASPECT);
const CARD_STEP = PROMO_CARD_WIDTH + CARD_MARGIN;

type Props = {
  user: { name: string; points?: number };
  onLogout: () => void;
  heroCardStyle: any;
  progressFillStyle: any;
  onRefresh?: () => Promise<void>;
};

export default function HomeLoggedIn({
  user,
  onLogout,
  heroCardStyle,
  progressFillStyle,
  onRefresh: onRefreshUser,
}: Props) {
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [promoActiveIndex, setPromoActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadPromos = useCallback(() => {
    return contentApi.getPromos().then((res) => setPromos(res.promos)).catch(() => setPromos([]));
  }, []);

  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadPromos(), onRefreshUser?.() ?? Promise.resolve()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadPromos, onRefreshUser]);

  const updatePromoIndex = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / CARD_STEP);
    setPromoActiveIndex(Math.max(0, Math.min(index, Math.max(0, promos.length - 1))));
  }, [promos.length]);

  const handleActivate = (promoId: string) => {
    // TODO: call API to activate offer, then e.g. show toast or navigate
  };

  const handlePromoPress = (promo: PromoItem) => {
    // TODO: e.g. open modal/sheet with full details, or expand in place
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PullToRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image source={require('@/assets/images/thamel-bar.png')} style={styles.thamelBarLogo} />
            <View>
              <Text style={styles.greeting}>Thamel Bar & Karaoke.</Text>
              <Text style={styles.subtitle}>Good Afternoon.</Text>
            </View>
          </View>

          <Animated.View style={[styles.card, styles.heroCard, heroCardStyle]}>
            <ImageBackground
              source={{
                uri: 'https://images.unsplash.com/photo-1650473395434-8674d953ef2f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTh8fGFic3RyYWN0fGVufDB8fDB8fHww',
              }}
              style={styles.heroCardBg}
              imageStyle={styles.heroCardImage}>
              <View style={styles.heroCardOverlay} />
              <View style={styles.heroCardContent}>
                <View style={styles.pointBalanceHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                    <Text style={styles.cardLabel}>Points balance</Text>
                    {/* <EyeOffIcon size={16} color={Colors.text} /> */}
                  </View>
                  <Text style={styles.cardHint}>{user.name}</Text>
                </View>

                <Text style={styles.pointsValue}>{user.points ?? 0}</Text>
                <Text style={styles.cardHint}>Earn 10 pt per $100 spent</Text>
                {/* <View style={styles.progressBar}>
                  <Animated.View style={[styles.progressFill, progressFillStyle]} />
                </View>
                <Text style={styles.progressText}>100 pts to next reward</Text> */}
              </View>
            </ImageBackground>
          </Animated.View>

          {promos.length > 0 && (
            <View style={styles.promosRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.promoCarouselContent}
                snapToInterval={CARD_STEP}
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={updatePromoIndex}
                onScrollEndDrag={updatePromoIndex}>
                {promos.map((promo) => (
                  <Pressable
                    key={promo.id}
                    style={({ pressed }) => [styles.promoCarouselCard, pressed && styles.promoCardPressed]}
                    onPress={() => handlePromoPress(promo)}>
                    <ImageBackground
                      source={{ uri: promo.image }}
                      style={styles.promoCardImage}
                      imageStyle={styles.promoCardImageStyle}>
                      <View style={styles.promoCardOverlay} />
                      <View style={styles.promoCardBottom}>
                        <Text style={styles.promoTitle} numberOfLines={1}>{promo.title}</Text>
                        <Text style={styles.promoDetail} numberOfLines={2}>{promo.detail}</Text>
                      </View>
                    </ImageBackground>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.promoDots}>
                {promos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.promoDot,
                      index === promoActiveIndex ? styles.promoDotActive : styles.promoDotInactive,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </PullToRefreshScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    // paddingHorizontal: Spacing.xl,
    // paddingTop: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,

  },
  greeting: {
    ...Typography.title,
    color: Colors.primary,
    // marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  heroCard: {
    marginBottom: Spacing.xl,
    padding: 0,
    overflow: 'hidden',
  },
  heroCardBg: {
    width: '100%',
  },
  heroCardImage: {
    borderRadius: Radius.lg,
  },
  heroCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  heroCardContent: {
    padding: Spacing.xl,
  },
  cardLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pointBalanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -1,
    marginVertical: Spacing.xs,
  },
  cardHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    // marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    width: '0%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  promosRow: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.titleSmall,
    color: Colors.primary,
    paddingHorizontal: CAROUSEL_PADDING,
  },
  promoCarouselContent: {
    paddingHorizontal: CAROUSEL_PADDING,
    paddingBottom: Spacing.sm,
  },
  promoDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: CAROUSEL_PADDING,
  },
  promoDot: {
    height: 6,
    borderRadius: 3,
  },
  promoDotInactive: {
    width: 6,
    backgroundColor: Colors.textSecondary,
  },
  promoDotActive: {
    width: 16,
    backgroundColor: Colors.text,
  },
  promoCarouselCard: {
    width: PROMO_CARD_WIDTH,
    height: PROMO_CARD_HEIGHT,
    // borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.md,
    marginRight: CARD_MARGIN,
  },
  promoCardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  promoCardImageStyle: {
    // borderRadius: Radius.lg,
  },
  promoCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  promoCardBottom: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  promoCardPressed: {
    opacity: 0.95,
  },
  promoTitle: {
    ...Typography.titleSmall,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  promoDetail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  activateBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
  },
  activateBtnPressed: {
    opacity: 0.9,
  },
  activateBtnText: {
    ...Typography.button,
    fontSize: 14,
    color: Colors.background,
  },
  logoutBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  logoutBtnPressed: { opacity: 0.7 },
  logoutText: {
    ...Typography.button,
    color: Colors.primary,
  },
  thamelBarLogo: {
    width: 70,
    height: 70,
    alignSelf: 'center',
    // marginBottom: Spacing.xl,
    resizeMode: 'contain',
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    paddingHorizontal: CAROUSEL_PADDING,
  },
});
