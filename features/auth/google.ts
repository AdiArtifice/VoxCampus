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
  // Force our scheme to ensure native deep linking
  const url = Linking.createURL('auth-callback', { scheme: 'voxcampus' });
  log('Built redirect URL:', url);
  return url;
}

export function parseOAuthCallbackUrl(url: string): OAuthCallbackParams {
  try {
    const parsed = Linking.parse(url);
    const params = parsed.queryParams ?? {} as Record<string, string | undefined>;
    const userId = params.userId ?? params.userID ?? null;
    const secret = params.secret ?? null;
    log('Parsed callback params:', { userId, hasSecret: !!secret });
    return { userId, secret };
  } catch (e) {
    log('Failed to parse callback URL', e);
    return { userId: null, secret: null };
  }
}

export async function signInWithGoogle(account: Account) {
  const success = buildRedirectUrl();
  const failure = success; // same for both success and failure as requested

  // Appwrite RN SDK: create OAuth2 token (mobile flow)
  log('Creating OAuth2 token with Appwrite...');
  const provider = (OAuthProvider as any)?.Google ?? 'google';
  const token = await account.createOAuth2Token(provider as any, success, failure);
  const startUrl: string = (token as any)?.url ?? (token as unknown as string);
  if (!startUrl) {
    throw new Error('Failed to obtain OAuth URL');
  }
  log('Opening OAuth URL in browser:', startUrl);

  // Open the system browser session and wait for redirect back
  const result = await WebBrowser.openAuthSessionAsync(startUrl, success);
  log('WebBrowser result:', result);

  // Handle user cancellation
  if (result.type === 'cancel') {
    throw new Error('Sign-in canceled');
  }

  // On success, we should receive the redirect URL with query params
  let redirectUrl = (result as any)?.url as string | undefined;
  if (!redirectUrl) {
    // Fallback: check if the app was resumed via deep link (warm/cold start)
    redirectUrl = await Linking.getInitialURL() ?? undefined;
    log('Fallback initial URL:', redirectUrl);
  }

  if (!redirectUrl) {
    throw new Error('No redirect URL received from OAuth flow');
  }
  log('Received redirect URL:', redirectUrl);

  const { userId, secret } = parseOAuthCallbackUrl(redirectUrl);
  if (!userId || !secret) {
    throw new Error('Missing userId or secret in redirect URL');
  }

  // Complete login by creating a session
  log('Creating Appwrite session with userId/secret...');
  const session = await account.createSession(userId, secret);
  log('Session created:', { sessionId: session.$id, userId: session.userId });

  // Fetch the authenticated user
  const me = await account.get();
  log('Fetched account:', { id: me.$id, email: me.email, name: me.name });
  return { session, user: me };
}
