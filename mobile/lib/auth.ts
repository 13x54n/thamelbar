import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { WEB_URL } from './api';

WebBrowser.maybeCompleteAuthSession();

type GoogleAuthSession = {
  token?: string;
  user?: {
    _id?: string;
    name: string;
    email: string;
    verified?: boolean;
  };
  cancelled?: boolean;
};

const getGoogleAuthUrl = () => {
  const explicitUrl = process.env.EXPO_PUBLIC_GOOGLE_AUTH_URL?.trim();
  if (explicitUrl) return explicitUrl;
  if (!WEB_URL) return '';
  return `${WEB_URL.replace(/\/$/, '')}/auth/google`;
};

export async function openGoogleAuth(): Promise<GoogleAuthSession> {
  const authUrl = getGoogleAuthUrl();
  if (!authUrl) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_AUTH_URL or EXPO_PUBLIC_WEB_URL for Google sign-in.'
    );
  }

  // Callback URL the web will redirect to with ?code=... (scheme from app.json → thamelbar://auth-callback)
  const redirectUrl = Linking.createURL('auth-callback');
  let finalAuthUrl = authUrl;
  try {
    const url = new URL(authUrl);
    url.searchParams.set('redirect', redirectUrl);
    url.searchParams.set('redirect_uri', redirectUrl); // some flows expect redirect_uri
    finalAuthUrl = url.toString();
  } catch {
    const joiner = authUrl.includes('?') ? '&' : '?';
    finalAuthUrl = `${authUrl}${joiner}redirect=${encodeURIComponent(redirectUrl)}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
  }

  const result = await WebBrowser.openAuthSessionAsync(finalAuthUrl, redirectUrl);

  if (result.type === 'cancel') {
    return { cancelled: true };
  }

  if (result.type !== 'success' || !result.url) {
    return {};
  }

  const parsed = Linking.parse(result.url);
  const params = parsed.queryParams ?? {};
  let code = typeof params.code === 'string' ? params.code : undefined;
  if (!code && result.url) {
    try {
      const match = result.url.match(/[?&]code=([^&?#]+)/);
      if (match) code = decodeURIComponent(match[1]);
    } catch {
      // ignore
    }
  }
  if (!code) {
    return {};
  }

  // Exchange one-time code for JWT + user via backend
  const apiBase =
    process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3001';
  const res = await fetch(`${apiBase}/api/auth/mobile/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    token?: string;
    user?: { _id?: string; name?: string; email?: string; verified?: boolean };
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data?.error || `Authentication failed (${res.status}).`);
  }
  if (!data.token || !data.user?.email) {
    throw new Error(data?.error || 'Invalid response from server.');
  }

  return {
    token: data.token,
    user: {
      _id: data.user._id,
      name: data.user.name || data.user.email.split('@')[0],
      email: data.user.email,
      verified: data.user.verified,
    },
  };
}
