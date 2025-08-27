import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { account, ID } from '@/lib/appwrite';
import type { Models } from 'react-native-appwrite';
import * as Linking from 'expo-linking';
import { isSJCEMEmail } from '@/utils/validation';
import { signInWithGoogle as doGoogleSignIn, parseOAuthCallbackUrl } from '@/features/auth/google';
import { Alert, View, Text, Platform } from 'react-native';

export type AuthUser = Models.User<Models.Preferences> | null;

type AuthContextType = {
  user: AuthUser;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  sendVerificationEmail: (redirectUrl?: string) => Promise<void>;
  verifyEmail: (userId: string, secret: string) => Promise<void>;
  signInWithGoogle: () => Promise<AuthUser>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Defensive ProviderGuard to prevent blank screens in development if context missing
export const ProviderGuard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3E0' }}>
        <Text style={{ color: '#E65100', padding: 16, textAlign: 'center' }}>
          AuthProvider is not mounted. This is a development-only fallback.
        </Text>
      </View>
    );
  }
  return <>{children}</>;
};

// Export a colocated hook to avoid multiple module instances
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Mount/unmount diagnostics
  useEffect(() => {
    console.debug('[AuthProvider] mounted');
    return () => console.debug('[AuthProvider] unmounted');
  }, []);

  const getCurrent = useCallback(async () => {
    try {
      const current = await account.get<Models.User<Models.Preferences>>();
      setUser(current);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Initialize auth state on mount
    (async () => {
      setInitializing(true);
      await getCurrent();
      setInitializing(false);
    })();
  }, [getCurrent]);

  const login = useCallback(async (email: string, password: string) => {
    // Create a session, then fetch the user
    await account.createEmailPasswordSession(email, password);
    await getCurrent();
  }, [getCurrent]);

  const sendVerificationEmail = useCallback(async (redirectUrl?: string) => {
    // Build a deep link redirect URL to our verify-email screen
    // Explicitly set scheme to ensure voxcampus://verify-email is used in emails
    const url = redirectUrl ?? Linking.createURL('verify-email', { scheme: 'voxcampus' });
    await account.createVerification(url);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    // Restrict to campus email domain
    if (!isSJCEMEmail(email)) {
      throw new Error('Please use your campus email ending with @sjcem.edu.in');
    }
    // Create account then session
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    // Trigger verification email immediately
    await sendVerificationEmail();
    await getCurrent();
  }, [getCurrent, sendVerificationEmail]);

  const verifyEmail = useCallback(async (userId: string, secret: string) => {
    await account.updateVerification(userId, secret);
    await getCurrent();
  }, [getCurrent]);

  const logout = useCallback(async () => {
    try {
      // Delete only current session for safety
      await account.deleteSession('current');
    } finally {
      setUser(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    await getCurrent();
  }, [getCurrent]);

  // Deep link handler for auth-callback (supports manual testing and cold/warm starts)
  const handlingRef = useRef(false);
  const suppressAuthCallbackRef = useRef(false);
  const handleAuthCallbackUrl = useCallback(async (url: string) => {
    if (!url || handlingRef.current) return;
    if (!url.includes('auth-callback')) return;
    // Skip handling on web where /auth-callback page manages it
    if (Platform.OS === 'web') return;
    // Suppress during in-flight native sign-in to prevent double consumption
    if (suppressAuthCallbackRef.current) {
      console.log('[AuthContext] Suppressing deep link handling during in-flight sign-in');
      return;
    }
    try {
      handlingRef.current = true;
      console.log('[AuthContext] Received URL:', url);
      const { userId, secret } = parseOAuthCallbackUrl(url);
      if (!userId || !secret) {
        console.log('[AuthContext] Missing userId/secret in URL');
        return;
      }
      console.log('[AuthContext] Creating session from deep link...');
      await account.createSession(userId, secret);
      const me = await account.get<Models.User<Models.Preferences>>();
      console.log('[AuthContext] Session created. User:', { id: me.$id, email: me.email });
      if (!isSJCEMEmail(me.email)) {
        await account.deleteSession('current');
        Alert.alert('Access denied', 'Only sjcem.edu.in accounts are allowed.');
        setUser(null);
        return;
      }
      setUser(me);
    } catch (e) {
      console.log('[AuthContext] Deep link session error:', e);
    } finally {
      handlingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleAuthCallbackUrl(url);
    });
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleAuthCallbackUrl(initialUrl);
      }
    })();
    return () => {
      // @ts-ignore older expo-linking types
      sub?.remove?.();
    };
  }, [handleAuthCallbackUrl]);

  const signInWithGoogle = useCallback(async () => {
    console.log('[AuthContext] signInWithGoogle start');
    suppressAuthCallbackRef.current = true;
    try {
      const { user: me } = await doGoogleSignIn(account);
      if (!isSJCEMEmail(me.email)) {
        await account.deleteSession('current');
        throw new Error('Only sjcem.edu.in accounts are allowed.');
      }
      // Set local state and return the authenticated user
      setUser(me);
      return me;
    } finally {
      suppressAuthCallbackRef.current = false;
    }
  }, []);

  const value = useMemo(() => ({ user, initializing, login, register, logout, refresh, sendVerificationEmail, verifyEmail, signInWithGoogle }), [user, initializing, login, register, logout, refresh, sendVerificationEmail, verifyEmail, signInWithGoogle]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
