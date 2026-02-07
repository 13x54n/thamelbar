import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import RegisterPushToken from '@/components/RegisterPushToken';
import { AuthProvider } from '@/contexts/auth-context';
import { Colors as DesignColors } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

const appBackground = DesignColors.background;
const whiteBackgroundTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: appBackground, card: DesignColors.surface },
};
const whiteBackgroundDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: appBackground, card: DesignColors.surface },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <RegisterPushToken />
      <ThemeProvider
        value={colorScheme === 'dark' ? whiteBackgroundDarkTheme : whiteBackgroundTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: appBackground },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="verify-code" options={{ headerShown: false }} />
          <Stack.Screen name="new-password" options={{ headerShown: false }} />
          <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
          <Stack.Screen name="menu-item/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}
