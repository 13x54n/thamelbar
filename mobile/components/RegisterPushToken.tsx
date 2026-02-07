import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef } from 'react';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * When user is logged in, request push permission, get Expo push token, and register it with the backend.
 */
export default function RegisterPushToken() {
  const { token, isLoggedIn } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !token || !Device.isDevice) return;

    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let final = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          final = status;
        }
        if (final !== 'granted') return;

        const pushTokenData = await Notifications.getExpoPushTokenAsync();
        const pushToken = pushTokenData?.data;
        if (!pushToken || registeredRef.current) return;

        await authApi.registerPushToken(token, pushToken);
        registeredRef.current = true;
      } catch {
        // Ignore: push is optional
      }
    })();
  }, [isLoggedIn, token]);

  return null;
}
