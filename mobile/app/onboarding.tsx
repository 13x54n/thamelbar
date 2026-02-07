import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/design';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Onboarding / "How it works" – v1
 */
export default function OnboardingScreen() {
  const router = useRouter();

  const titleOpacity = useSharedValue(0);
  const rulesOpacity = useSharedValue(0);
  const examplesOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaScale = useSharedValue(0.96);

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 180 });
    rulesOpacity.value = withDelay(
      80,
      withTiming(1, { duration: 200 }),
    );
    examplesOpacity.value = withDelay(
      160,
      withTiming(1, { duration: 200 }),
    );
    ctaOpacity.value = withDelay(
      240,
      withTiming(1, { duration: 200 }),
    );
    ctaScale.value = withDelay(
      240,
      withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [titleOpacity, rulesOpacity, examplesOpacity, ctaOpacity, ctaScale]);

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const rulesStyle = useAnimatedStyle(() => ({ opacity: rulesOpacity.value }));
  const examplesStyle = useAnimatedStyle(() => ({ opacity: examplesOpacity.value }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ scale: ctaScale.value }],
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.Text style={[styles.title, titleStyle]}>How it works</Animated.Text>
        <Text style={styles.lead}>
          Simple rules. Real rewards at the bar.
        </Text>

        <Animated.View style={[styles.card, styles.ruleCard, rulesStyle]}>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleNumber}>1</Text>
            <Text style={styles.ruleText}>
              Earn <Text style={styles.highlight}>1 point per $1</Text> spent.
            </Text>
          </View>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleNumber}>2</Text>
            <Text style={styles.ruleText}>
              At <Text style={styles.highlight}>100 points</Text>, get your reward
              (e.g. free drink).
            </Text>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.sectionTitle, examplesStyle]}>
          Examples
        </Animated.Text>
        <Animated.View style={[styles.examples, examplesStyle]}>
          <View style={styles.exampleRow}>
            <Text style={styles.exampleValue}>$20</Text>
            <Text style={styles.exampleArrow}>→</Text>
            <Text style={styles.exampleResult}>20 points</Text>
          </View>
          <View style={styles.exampleRow}>
            <Text style={styles.exampleValue}>$50</Text>
            <Text style={styles.exampleArrow}>→</Text>
            <Text style={styles.exampleResult}>50 points</Text>
          </View>
          <View style={[styles.exampleRow, styles.exampleRowHighlight]}>
            <Text style={styles.exampleResult}>100 points</Text>
            <Text style={styles.exampleArrow}>→</Text>
            <Text style={styles.exampleResultHighlight}>Free drink</Text>
          </View>
        </Animated.View>

        <AnimatedPressable
          style={({ pressed }) => [styles.btn, ctaStyle, pressed && styles.btnPressed]}
          onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.btnText}>Get started</Text>
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    ...Typography.display,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  lead: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  ruleCard: {
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    color: Colors.primaryDark,
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 22,
    marginRight: Spacing.md,
  },
  ruleText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  highlight: {
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  sectionTitle: {
    ...Typography.titleSmall,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  examples: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    ...Shadow.sm,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  exampleRowHighlight: {
    borderBottomWidth: 0,
  },
  exampleValue: {
    ...Typography.titleSmall,
    color: Colors.text,
    width: 56,
  },
  exampleArrow: {
    ...Typography.body,
    color: Colors.textMuted,
    marginHorizontal: Spacing.sm,
  },
  exampleResult: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  exampleResultHighlight: {
    ...Typography.titleSmall,
    color: Colors.primary,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  btnText: {
    ...Typography.button,
    color: Colors.surface,
  },
  btnPressed: { opacity: 0.9 },
});
