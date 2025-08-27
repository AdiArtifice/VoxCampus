import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Account, OAuthProvider } from 'react-native-appwrite';

// Debug helper
const log = (...args: any[]) => console.log('[GoogleAuth]', ...args);

export type OAuthCallbackParams = {
  userId?: string | null;
  secret?: string | null;
};

export const ALLOWED_DOMAIN = 'sjcem.edu.in';

export function buildRedirectUrl() {
  // Platform-aware deep link. On native uses configured app scheme; on web becomes an http(s) route handled by Expo Router.
  const url = Linking.createURL('auth-callback');
  log('Built redirect URL:', url);
  return url;
}

export function parseOAuthCallbackUrl(url: string): OAuthCallbackParams {
  try {
    const parsed = Linking.parse(url);
    const params = (parsed.queryParams ?? {}) as Record<string, string | string[] | undefined>;
    const coerce = (val: string | string[] | undefined | null): string | null => {
      if (Array.isArray(val)) return val[0] ?? null;
      return val ?? null;
    };
    const rawUserId = (params as any).userId ?? (params as any).userID;
    const rawSecret = (params as any).secret;
    const userId = coerce(rawUserId);
    const secret = coerce(rawSecret);
    log('Parsed callback params:', { userId, hasSecret: !!secret });
    return { userId, secret };
  } catch (e) {
    log('Failed to parse callback URL', e);
    return { userId: null, secret: null };
  }
}

export async function signInWithGoogle(account: Account) {
  // 1) Compute redirect URL (must exactly match Google Console + Appwrite provider)
  const success = buildRedirectUrl();
  const failure = success; // pass the same URL for success/failure

  // Use redirectUri directly for WebBrowser return URL (must match exactly)
  log('OAuth redirect URL:', success);
  log('Using redirectUri for WebBrowser return URL:', success);

  // 2) Ask Appwrite for the provider login URL
  log('Creating OAuth2 token with Appwrite...');
  const provider = (OAuthProvider as any)?.Google ?? 'google';
  const token = await account.createOAuth2Token(provider as any, success, failure);
  const loginUrl: string = (token as any)?.url ?? (token as unknown as string);
  if (!loginUrl) {
    throw new Error('Failed to obtain OAuth URL');
  }
  log('Opening OAuth URL in browser:', loginUrl);

  // 3) Prepare deep-link listener to catch the redirect regardless of platform behavior
  let receivedUrl: string | undefined;
  const listener = ({ url }: { url: string }) => {
    log('Deep link event URL:', url);
    receivedUrl = url;
  };
  const sub = Linking.addEventListener('url', listener as any);

  try {
    // 4) Open the system browser session and wait for return to our app
    const result = await WebBrowser.openAuthSessionAsync(loginUrl, success);
    log('WebBrowser result:', result);

    // Handle user cancellation
    if (result.type === 'cancel') {
      throw new Error('Sign-in canceled');
    }

    // On success, we should receive the redirect URL with query params
    let redirectUrl = (result as any)?.url as string | undefined;
    if (!redirectUrl) {
      // Fallbacks: url event captured or initial URL (warm/cold start)
      redirectUrl = receivedUrl ?? (await Linking.getInitialURL()) ?? undefined;
      log('Fallback redirect URL:', redirectUrl);
    }

    if (!redirectUrl) {
      throw new Error('No redirect URL received from OAuth flow');
    }
    log('Received redirect URL:', redirectUrl);

    const { userId, secret } = parseOAuthCallbackUrl(redirectUrl);
    log('Parsed credentials:', { userId, hasSecret: !!secret });
    if (!userId || !secret) {
      // Show a friendly message and abort gracefully
      try {
        // Lazy import to avoid RN web env warnings if any
        const { Alert } = await import('react-native');
        Alert.alert('Authentication failed', 'Authentication failed, please try again');
      } catch {}
      log('Missing userId or secret in redirect URL. Full URL:', redirectUrl);
      throw new Error('Authentication failed, please try again');
    }

    // 5) Complete login by creating a session
    log('Creating Appwrite session with userId/secret...');
    const session = await account.createSession(userId, secret);
    log('Session created:', { sessionId: (session as any)?.$id, userId: (session as any)?.userId });

    // 6) Fetch the authenticated user and return
    const me = await account.get();
    log('Fetched account:', { id: (me as any)?.$id, email: (me as any)?.email, name: (me as any)?.name });
    log('Navigating to Home (via protected root)...');
    return { session, user: me };
  } finally {
    // Clean up the deep link listener to avoid memory leaks
    // @ts-ignore older expo-linking types
    sub?.remove?.();
  }
}
