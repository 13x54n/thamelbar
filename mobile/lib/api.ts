/**
 * API client - configure EXPO_PUBLIC_API_URL in .env for production.
 * Default: http://localhost:3001 (iOS simulator) or 10.0.2.2:3001 (Android emulator)
 */
const getBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return 'http://localhost:3001';
};

export const API_URL = getBaseUrl();

const getWebUrl = () => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_WEB_URL) {
    return process.env.EXPO_PUBLIC_WEB_URL.replace(/\/$/, '');
  }
  return '';
};

export const WEB_URL = getWebUrl();

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export const authApi = {
  getMe: (token: string) =>
    apiRequest<{ user: { _id: string; name: string; email: string; verified?: boolean; points: number } }>(
      '/api/auth/me',
      { headers: { Authorization: `Bearer ${token}` } }
    ),
  registerPushToken: (token: string, pushToken: string) =>
    apiRequest<{ success: boolean }>('/api/auth/push-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pushToken }),
    }),
  login: (email: string, password: string) =>
    apiRequest<{
      success: boolean;
      token: string;
      user: { _id: string; name: string; email: string; verified?: boolean; points?: number };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  requestCode: (email: string) =>
    apiRequest<{ success: boolean; message: string }>('/api/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verify: (
    email: string,
    code: string,
    name?: string,
    password?: string,
    flow?: 'login' | 'signup'
  ) =>
    apiRequest<{ success: boolean; token: string; user: { _id: string; name: string; email: string; points?: number } }>(
      '/api/auth/verify',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          code,
          ...(name && { name }),
          ...(password && { password }),
          ...(flow && { flow }),
        }),
      }
    ),
  resetPassword: (email: string, code: string, newPassword: string) =>
    apiRequest<{ success: boolean }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    }),
};

export type PointTransactionItem = {
  id: string;
  type: 'earn' | 'redeem';
  amount: number;
  points: number;
  date: string;
};

export const pointsApi = {
  getTransactions: (token: string) =>
    apiRequest<{ transactions: PointTransactionItem[] }>('/api/points/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export type KaraokeBookingItem = {
  id: string;
  room: string;
  date: string;
  slot: string;
};

export const karaokeApi = {
  getSlots: (room: string, date: string) =>
    apiRequest<{ slots: string[] }>(
      `/api/karaoke/slots?room=${encodeURIComponent(room)}&date=${encodeURIComponent(date)}`
    ),
  getMyBookings: (token: string) =>
    apiRequest<{ bookings: KaraokeBookingItem[] }>('/api/karaoke/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  book: (
    room: string,
    date: string,
    slot: string,
    contactNumber: string,
    token: string
  ) =>
    apiRequest<{
      success: boolean;
      booking: { id: string; room: string; date: string; slot: string; contactNumber: string };
    }>('/api/karaoke/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ room, date, slot, contactNumber }),
    }),
};

export type PromoItem = {
  id: string;
  title: string;
  detail: string;
  image: string;
  order: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  category: string;
  order: number;
  optionGroups?: { label: string; modifier?: boolean; choices: { name: string; price?: number }[] }[];
};

export type MenuCategory = { id: string; title: string };

export const contentApi = {
  getPromos: () =>
    apiRequest<{ promos: PromoItem[] }>('/api/promos'),
  getMenu: () =>
    apiRequest<{ menu: MenuItem[] }>('/api/menu'),
  getMenuCategories: () =>
    apiRequest<{ categories: MenuCategory[] }>('/api/menu-categories'),
};
