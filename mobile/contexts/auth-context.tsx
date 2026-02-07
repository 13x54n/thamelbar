import React, { createContext, useCallback, useContext, useState } from 'react';

type User = {
  _id?: string;
  name: string;
  email: string;
  verified?: boolean;
  points?: number;
};

type AuthContextValue = {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  pendingSignup: { name: string; email: string; password: string } | null;
  setSession: (user: User, token: string) => void;
  refreshUser: (user: Partial<User>) => void;
  setPendingSignup: (data: { name: string; email: string; password: string }) => void;
  clearPendingSignup: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingSignup, setPendingSignupState] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  const setSession = useCallback((u: User, authToken: string) => {
    setUser(u);
    setToken(authToken);
  }, []);

  const refreshUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const setPendingSignup = useCallback(
    (data: { name: string; email: string; password: string }) => {
      setPendingSignupState({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
    },
    []
  );

  const clearPendingSignup = useCallback(() => {
    setPendingSignupState(null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setPendingSignupState(null);
  }, []);

  const value: AuthContextValue = {
    isLoggedIn: user !== null && token !== null,
    user,
    token,
    pendingSignup,
    setSession,
    refreshUser,
    setPendingSignup,
    clearPendingSignup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
