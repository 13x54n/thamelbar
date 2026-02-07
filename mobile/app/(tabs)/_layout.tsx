import { Home, Mic2, ScanQrCode, User, UtensilsCrossed } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors as DesignColors } from '@/constants/design';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type TabIconProps = {
  focused: boolean;
  color: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
};

function TabBarIcon({ focused, color, Icon }: TabIconProps) {
  const scale = useSharedValue(focused ? 1.08 : 1);

  React.useEffect(() => {
    scale.value = withTiming(focused ? 1.08 : 1, { duration: 180 });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Icon size={24} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isLoggedIn } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: DesignColors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          display: isLoggedIn ? 'flex' : 'none',
          backgroundColor: DesignColors.surface,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: DesignColors.borderLight,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={ScanQrCode} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="karaoke"
        options={{
          title: 'Karaoke',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={Mic2} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={UtensilsCrossed} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
