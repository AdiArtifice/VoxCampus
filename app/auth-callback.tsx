import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { account } from '@/lib/appwrite';
import { Button } from '@/components/Button';

const log = (...args: any[]) => console.log('[AuthCallbackWeb]', ...args);

export default function AuthCallback() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      try {
        setProcessing(true);
        // If already authenticated, just go home
        if (user) {
          log('User already authenticated, navigating home');
          router.replace('/');
          return;
        }

        // Determine current URL (web), fallback to Linking on native if ever used
        let href: string | null = null;
        if (typeof window !== 'undefined' && window.location?.href) {
          href = window.location.href;
        }

        if (!href) {
          // As a safety net, try to read from document location (web only)
          try {
            href = (document as any)?.location?.href ?? null;
          } catch {}
        }

        if (!href) {
          setError('No callback URL detected.');
          log('Missing href; cannot parse callback.');
          return;
        }

        log('Full callback URL:', href);
        const url = new URL(href);
        const params = url.searchParams;
        const userId = params.get('userId') || params.get('userID');
        const secret = params.get('secret');
        log('Parsed params:', { userId, hasSecret: !!secret });

        // First, try refresh in case another handler already created the session
        try {
          await refresh();
        } catch {}

        // If user became available, navigate home
        if (!!user) {
          log('Session appears active after refresh; navigating home');
          router.replace('/');
          return;
        }

        if (!userId || !secret) {
          setError('Authentication failed. Missing credentials.');
          return;
        }

        log('Creating session from web callback...');
        await account.createSession(userId, secret);
        log('Session created. Refreshing user...');
        await refresh();
        log('Navigation to Home');
        router.replace('/');
      } catch (e: any) {
        const msg = e?.message || 'Authentication failed. Please try again.';
        log('Error handling auth-callback:', e);
        setError(msg);
      } finally {
        setProcessing(false);
      }
    };

    run();
    // We want to run this only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (processing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Completing sign-in…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#C62828', marginBottom: 12, textAlign: 'center' }}>{error}</Text>
        <Button text="Go to Home" onPress={() => router.replace('/')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text>Redirecting…</Text>
    </View>
  );
}
