"use client";

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors, Spacing, Typography } from '@/constants/design';
import { useAuth } from '@/contexts/auth-context';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { setSession } = useAuth();
  const params = useLocalSearchParams<{
    code?: string;
    token?: string;
    email?: string;
    name?: string;
    _id?: string;
    verified?: string;
  }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = typeof params.code === 'string' ? params.code : '';
    const token = typeof params.token === 'string' ? params.token : '';
    const email = typeof params.email === 'string' ? params.email : '';
    const name = typeof params.name === 'string' ? params.name : '';
    const id = typeof params._id === 'string' ? params._id : undefined;
    const verified =
      typeof params.verified === 'string' ? params.verified === 'true' : undefined;

    if (code) {
      let cancelled = false;
      const run = async () => {
        try {
          const apiBase =
            process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
            'http://localhost:3001';
          const res = await fetch(`${apiBase}/api/auth/mobile/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            token?: string;
            user?: { _id?: string; name?: string; email?: string; verified?: boolean };
            error?: string;
          };
          if (!res.ok) {
            throw new Error(data?.error || 'Sign-in failed.');
          }
          if (!data.token || !data.user?.email) {
            throw new Error(data?.error || 'Invalid response from server.');
          }
          if (cancelled) return;
          setSession(
            {
              _id: data.user._id,
              name: data.user.name || data.user.email.split('@')[0],
              email: data.user.email,
              verified: data.user.verified,
            },
            data.token
          );
          router.replace('/(tabs)');
        } catch (err) {
          if (cancelled) return;
          setError((err as Error).message);
        }
      };
      run();
      return () => {
        cancelled = true;
      };
    }

    if (!token || !email) {
      setError('Missing login details. Please try signing in again.');
      return;
    }

    setSession(
      {
        _id: id,
        name: name || email.split('@')[0],
        email,
        verified,
      },
      token
    );
    router.replace('/(tabs)');
  }, [params, setSession, router]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.linkButton} onPress={() => router.replace('/login')}>
          <Text style={styles.linkText}>Back to login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.primary} />
      <Text style={styles.label}>Completing sign-in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  linkButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  linkText: {
    ...Typography.body,
    color: Colors.primary,
  },
});
