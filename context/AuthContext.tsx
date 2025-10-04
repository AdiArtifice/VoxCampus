import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { account, ID, databases, Query } from '@/lib/appwrite';
import { APPWRITE } from '@/lib/config';
import type { Models } from 'react-native-appwrite';
import * as Linking from 'expo-linking';
import { isSJCEMEmail } from '@/utils/validation';
import { signInWithGoogle as doGoogleSignIn, parseOAuthCallbackUrl } from '@/features/auth/google';
import { Alert, View, Text, Platform } from 'react-native';

export type AuthUser = Models.User<Models.Preferences> | null;

export interface Membership {
  $id: string;
  userId: string;
  orgId: string;
  role: string;
  joinedAt: string;
  // Populated association info (for convenience)
  organization?: {
    $id: string;
    name: string;
    type: string;
    isActive: boolean;
  };
}

export interface UserRole {
  orgId: string;
  role: string;
  organizationName?: string;
}

type AuthContextType = {
  user: AuthUser;
  userRoles: UserRole[];
  userMemberships: Membership[];
  initializing: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
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
  const [userMemberships, setUserMemberships] = useState<Membership[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Mount/unmount diagnostics
  useEffect(() => {
    console.debug('[AuthProvider] mounted');
    return () => console.debug('[AuthProvider] unmounted');
  }, []);

  const fetchMemberships = useCallback(async (userEmail: string) => {
    try {
      console.debug('[AuthProvider] Fetching user memberships for email:', userEmail);
      setLoading(true);

      // First, let's fetch all memberships to debug
      const allMemberships = await databases.listDocuments(
        APPWRITE.DATABASE_ID,
        'membership'
      );
      console.debug('[AuthProvider] All memberships in database:', allMemberships.documents.map(doc => ({ userId: doc.userId, orgId: doc.orgId, role: doc.role })));

      // Fetch user memberships from Appwrite using email (since membership.userId stores email addresses)
      let membershipResponse = await databases.listDocuments(
        APPWRITE.DATABASE_ID,
        'membership',
        [Query.equal('userId', userEmail)]
      );
      
      console.debug('[AuthProvider] Found memberships for exact match', userEmail + ':', membershipResponse.documents.length);
      
      // If no exact match found, try partial matching (in case of email format differences)
      if (membershipResponse.documents.length === 0) {
        console.debug('[AuthProvider] No exact match found, trying partial email matching...');
        
        // Extract the local part of the email (before @)
        const emailLocalPart = userEmail.split('@')[0];
        console.debug('[AuthProvider] Looking for emails containing:', emailLocalPart);
        
        // Find memberships where userId contains the local part of the email
        const allMembershipDocs = allMemberships.documents as any[];
        const partialMatches = allMembershipDocs.filter(doc => 
          doc.userId && doc.userId.toLowerCase().includes(emailLocalPart.toLowerCase())
        );
        
        console.debug('[AuthProvider] Found partial matches:', partialMatches.map(m => m.userId));
        
        membershipResponse = { documents: partialMatches, total: partialMatches.length };
      }

      const memberships = membershipResponse.documents as unknown as Membership[];
      
      // Extract roles for convenience
      const roles: UserRole[] = memberships.map(membership => ({
        orgId: membership.orgId,
        role: membership.role,
      }));

      // Optionally fetch organization details for each membership
      const enhancedMemberships: Membership[] = await Promise.all(
        memberships.map(async (membership) => {
          try {
            const orgResponse = await databases.getDocument(
              APPWRITE.DATABASE_ID,
              'association',
              membership.orgId
            );
            
            return {
              ...membership,
              organization: {
                $id: orgResponse.$id,
                name: (orgResponse as any).name,
                type: (orgResponse as any).type,
                isActive: (orgResponse as any).isActive ?? true,
              },
            };
          } catch (error) {
            console.warn('[AuthProvider] Failed to fetch organization details for:', membership.orgId, error);
            return membership;
          }
        })
      );

      setUserMemberships(enhancedMemberships);
      setUserRoles(roles);
      
      console.debug('[AuthProvider] Memberships loaded:', {
        count: enhancedMemberships.length,
        roles: roles.map(r => r.role),
        organizations: enhancedMemberships.map(m => m.organization?.name || m.orgId),
      });

      // If user has a valid campus email but no memberships, log helpful info
      if (enhancedMemberships.length === 0 && userEmail.endsWith('@sjcem.edu.in')) {
        console.debug('[AuthProvider] User has valid campus email but no memberships. They may need to contact association admins.');
      }

    } catch (error) {
      console.error('[AuthProvider] Failed to fetch memberships:', error);
      setUserMemberships([]);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrent = useCallback(async () => {
    try {
      console.debug('[AuthProvider] Fetching current user session...');
      const current = await account.get<Models.User<Models.Preferences>>();
      console.debug('[AuthProvider] User session found:', { id: current.$id, email: current.email, name: current.name });
      console.debug('[AuthProvider] Full user object:', JSON.stringify(current, null, 2));
      setUser(current);
      
      // Fetch memberships when user is loaded (match by email since membership.userId stores email addresses)
      if (current.email) {
        console.debug('[AuthProvider] About to fetch memberships for email:', current.email);
        await fetchMemberships(current.email);
      } else {
        console.warn('[AuthProvider] No email found in user object - cannot fetch memberships');
      }
    } catch (error) {
      console.debug('[AuthProvider] No active session found or session expired');
      setUser(null);
      setUserMemberships([]);
      setUserRoles([]);
    }
  }, [fetchMemberships]);

  useEffect(() => {
    // Initialize auth state on mount and check for existing session
    (async () => {
      console.debug('[AuthProvider] Initializing authentication state...');
      setInitializing(true);
      try {
        await getCurrent();
        console.debug('[AuthProvider] Authentication state initialized successfully');
      } catch (error) {
        console.debug('[AuthProvider] Failed to initialize auth state:', error);
      } finally {
        setInitializing(false);
      }
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

  const refreshMemberships = useCallback(async () => {
    if (user?.email) {
      await fetchMemberships(user.email);
    }
  }, [user?.email, fetchMemberships]);

  const logout = useCallback(async () => {
    try {
      // Delete only current session for safety
      await account.deleteSession('current');
    } finally {
      setUser(null);
      setUserMemberships([]);
      setUserRoles([]);
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

  const value = useMemo(() => ({ 
    user, 
    userRoles, 
    userMemberships, 
    initializing, 
    loading, 
    login, 
    register, 
    logout, 
    refresh, 
    refreshMemberships, 
    sendVerificationEmail, 
    verifyEmail, 
    signInWithGoogle 
  }), [
    user, 
    userRoles, 
    userMemberships, 
    initializing, 
    loading, 
    login, 
    register, 
    logout, 
    refresh, 
    refreshMemberships, 
    sendVerificationEmail, 
    verifyEmail, 
    signInWithGoogle
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
