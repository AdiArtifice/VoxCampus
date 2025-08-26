import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';

// Diagnostics helper
const log = (...args: any[]) => console.debug('[VerifyEmail]', ...args);

function parseParamsFromUrl(url: string | null | undefined): { userId?: string | null; secret?: string | null } {
  if (!url) return { userId: null, secret: null };
  try {
    const parsed = Linking.parse(url);
    const qp = (parsed.queryParams || {}) as Record<string, any>;
    const userId = (qp.userId ?? qp.userID ?? qp.user_id ?? null) as string | null;
    const secret = (qp.secret ?? null) as string | null;
    log('Parsed from URL', { path: parsed.path, userId, hasSecret: !!secret });
    return { userId, secret };
  } catch (e) {
    log('Failed parsing URL', e);
    return { userId: null, secret: null };
  }
}

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ userId?: string; secret?: string }>();
  const { verifyEmail, sendVerificationEmail, refresh, user } = useAuth();

  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null | undefined>(params.userId);
  const [currentSecret, setCurrentSecret] = useState<string | null | undefined>(params.secret);
  const [resending, setResending] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const listenerRef = useRef<{ remove?: () => void } | null>(null);
  const verifyingRef = useRef(false);

  const canVerify = useMemo(() => !!currentUserId && !!currentSecret, [currentUserId, currentSecret]);

  const doVerify = useCallback(async (userId: string, secret: string) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setStatus('pending');
    setMessage(null);
    try {
      log('Calling updateVerification with params', { userId, hasSecret: !!secret });
      await verifyEmail(userId, secret);
      await refresh();
      log('Verification complete. User emailVerification:', user?.emailVerification);
      setStatus('success');
      setMessage('Your email has been verified successfully.');
    } catch (e: any) {
      const msg = e?.message || 'We could not verify your email. The link may be invalid or expired.';
      log('Verification error', e);
      setStatus('error');
      setMessage(msg);
    } finally {
      verifyingRef.current = false;
    }
  }, [refresh, verifyEmail, user?.emailVerification]);

  // Handle URL events (warm start) and initial URL (cold start)
  useEffect(() => {
    log('Screen mounted');

    // If params are already in route, try verifying immediately
    if (params?.userId && params?.secret) {
      log('Params from route', { userId: params.userId, hasSecret: !!params.secret });
      setCurrentUserId(params.userId);
      setCurrentSecret(params.secret);
      doVerify(params.userId, params.secret);
    } else {
      // Cold start fallback
      (async () => {
        const initialUrl = await Linking.getInitialURL();
        log('Initial URL', initialUrl);
        const { userId, secret } = parseParamsFromUrl(initialUrl);
        if (userId && secret) {
          setCurrentUserId(userId);
          setCurrentSecret(secret);
          doVerify(userId, secret);
        }
      })();
    }

    // Warm start listener
    listenerRef.current = Linking.addEventListener('url', ({ url }) => {
      log('Linking event URL', url);
      const { userId, secret } = parseParamsFromUrl(url);
      if (userId && secret) {
        setCurrentUserId(userId);
        setCurrentSecret(secret);
        doVerify(userId, secret);
      }
    }) as any;

    return () => {
      // @ts-ignore RN types differences
      listenerRef.current?.remove?.();
      listenerRef.current = null;
      log('Screen unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onResend = useCallback(async () => {
    try {
      setResending(true);
      setMessage(null);
      await sendVerificationEmail();
      setMessage('Verification email sent. Please check your inbox.');
    } catch (e: any) {
      const msg = e?.message || 'Failed to send verification email.';
      setMessage(msg);
    } finally {
      setResending(false);
    }
  }, [sendVerificationEmail]);

  const onTryAgain = useCallback(async () => {
    if (!canVerify) {
      setMessage('Missing link parameters. Please open the verification link from your email.');
      return;
    }
    try {
      setRetrying(true);
      await doVerify(currentUserId!, currentSecret!);
    } finally {
      setRetrying(false);
    }
  }, [canVerify, currentSecret, currentUserId, doVerify]);

  const onRefresh = useCallback(async () => {
    try {
      setMessage(null);
      await refresh();
      if (user?.emailVerification) {
        setStatus('success');
        setMessage('Your email is verified.');
      } else {
        setMessage('Email not verified yet. Please check your inbox.');
      }
      log('Refresh complete. emailVerification:', user?.emailVerification);
    } catch (e: any) {
      const msg = e?.message || 'Failed to refresh account status.';
      setMessage(msg);
    }
  }, [refresh, user?.emailVerification]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your email</Text>

      {status === 'pending' && (
        <View style={styles.centerRow}>
          <ActivityIndicator />
          <Text style={styles.message}>Verifying your email…</Text>
        </View>
      )}

      {status === 'success' && (
        <Text style={[styles.message, { color: '#1B5E20' }]}>{message || 'Success!'}</Text>
      )}

      {(status === 'idle' || status === 'error') && (
        <Text style={[styles.message, { color: status === 'error' ? '#C62828' : '#333' }]}>
          {message || 'Open the link from your email to verify your account.'}
        </Text>
      )}

      <View style={styles.actions}>
        <Button text={resending ? 'Sending…' : 'Resend email'} onPress={onResend} />
        <View style={{ width: 12 }} />
        <Button text={retrying ? 'Trying…' : 'Try again'} onPress={onTryAgain} />
        <View style={{ width: 12 }} />
        <Button text={'Refresh status'} onPress={onRefresh} />
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={styles.hint}>Debug: userId={String(currentUserId || '')} secret={currentSecret ? '***' : ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FAFAFB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  message: {
    marginTop: 8,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  hint: {
    color: '#5f6368',
    fontSize: 12,
  },
});
