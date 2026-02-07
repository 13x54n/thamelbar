import { useAuth } from '@/contexts/auth-context';
import HomeLoggedIn from '@/components/HomeLoggedIn';
import HomeLoggedOut from '@/components/HomeLoggedOut';
import { authApi } from '@/lib/api';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export default function HomeScreen() {
  const { isLoggedIn, user, token, logout, refreshUser } = useAuth();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (token && isLoggedIn) {
        authApi.getMe(token).then((res) => refreshUser({ points: res.user.points })).catch(() => {});
      }
    }, [token, isLoggedIn, refreshUser])
  );

  // Animated values for logged-in hero card and progress bar
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(12);
  const progress = useSharedValue(0); // 0 → 1

  useEffect(() => {
    if (isLoggedIn && user) {
      heroOpacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      heroTranslateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });

      // TODO: bind to real points / next reward; 0 for now.
      progress.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      heroOpacity.value = 0;
      heroTranslateY.value = 12;
      progress.value = 0;
    }
  }, [isLoggedIn, user, heroOpacity, heroTranslateY, progress]);

  const heroCardStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const progressFillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const refreshUserPoints = useCallback(async () => {
    if (token && isLoggedIn) {
      await authApi.getMe(token).then((res) => refreshUser({ points: res.user.points })).catch(() => {});
    }
  }, [token, isLoggedIn, refreshUser]);

  if (isLoggedIn && user) {
    return (
      <HomeLoggedIn
        user={user}
        onLogout={logout}
        heroCardStyle={heroCardStyle}
        progressFillStyle={progressFillStyle}
        onRefresh={refreshUserPoints}
      />
    );
  }

  return (
    <HomeLoggedOut
      onLogin={() => router.push('/login')}
      onSignup={() => router.push('/signup')}
    />
  );
}