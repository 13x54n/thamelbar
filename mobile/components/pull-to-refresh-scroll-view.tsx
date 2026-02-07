import { Colors } from '@/constants/design';
import { RefreshCw } from 'lucide-react-native';
import React from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

const PULL_THRESHOLD = 80;
/** Only show icon after user has pulled down at least this many px (like iOS) */
const PULL_ACTIVATE = 12;
const AnimatedScrollView = Animated.ScrollView;

type PullToRefreshScrollViewProps = React.ComponentProps<typeof AnimatedScrollView> & {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

/**
 * ScrollView with pull-to-refresh that shows a refresh icon while pulling.
 */
export default function PullToRefreshScrollView({
  refreshing,
  onRefresh,
  children,
  style,
  contentContainerStyle,
  ...rest
}: PullToRefreshScrollViewProps) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const pullIconStyle = useAnimatedStyle(() => {
    'worklet';
    const pulled = scrollY.value < -PULL_ACTIVATE;
    const opacity = pulled
      ? interpolate(
          scrollY.value,
          [-PULL_ACTIVATE, -PULL_THRESHOLD],
          [0, 1],
          'clamp'
        )
      : 0;
    const scale = pulled
      ? interpolate(
          scrollY.value,
          [-PULL_ACTIVATE, -PULL_THRESHOLD],
          [0.7, 1],
          'clamp'
        )
      : 0;
    return {
      opacity,
      transform: [{ scale }],
    };
  }, []);

  return (
    <View style={[styles.wrapper, style]}>
      {!refreshing && (
        <Animated.View style={[styles.pullIconContainer, pullIconStyle]} pointerEvents="none">
          <RefreshCw size={28} color={Colors.primary} strokeWidth={2.5} />
        </Animated.View>
      )}
      <AnimatedScrollView
        {...rest}
        style={styles.scroll}
        contentContainerStyle={contentContainerStyle}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }>
        {children}
      </AnimatedScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  pullIconContainer: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
});
