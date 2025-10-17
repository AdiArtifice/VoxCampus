import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { account, ID, databases, Query, storage } from '@/lib/appwrite';
import * as FileSystem from 'expo-file-system';
import { APPWRITE } from '@/lib/config';
import type { Models } from 'react-native-appwrite';
import * as Linking from 'expo-linking';
import { isSJCEMEmail } from '@/utils/validation';
import { signInWithGoogle as doGoogleSignIn, parseOAuthCallbackUrl } from '@/features/auth/google';
import { Alert, View, Text, Platform } from 'react-native';
import { 
  resetDemoUserSession, 
  isDemoUser,
  initDemoSessionTracking,
  trackFileUpload,
  trackDocumentChange,
  trackProfileUpdate
} from '@/utils/demoSessionTracker';
import { setupDemoDefaultPreferences } from '@/utils/demoDefaultPrefs';

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

export interface ProfileEducation {
  program?: string;
  department?: string;
  year?: string;
}

export interface ProfileProject {
  title: string;
  description?: string;
  link?: string;
}

export interface ProfileSocialLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface ProfileAvatar {
  bucketId: string;
  fileId: string;
  url: string;
}

export interface ProfilePreferences {
  bio?: string;
  education?: ProfileEducation;
  skills?: string[];
  projects?: ProfileProject[];
  socialLinks?: ProfileSocialLinks;
  achievements?: string[];
  avatar?: ProfileAvatar;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  education?: ProfileEducation;
  skills?: string[];
  projects?: ProfileProject[];
  socialLinks?: ProfileSocialLinks;
  achievements?: string[];
  avatar?: ProfileAvatar | null;
}

type AuthContextType = {
  user: AuthUser;
  userRoles: UserRole[];
  userMemberships: Membership[];
  initializing: boolean;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string, isDemoLogin?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  sendVerificationEmail: (redirectUrl?: string) => Promise<void>;
  verifyEmail: (userId: string, secret: string) => Promise<void>;
  signInWithGoogle: () => Promise<AuthUser>;
  updateProfile: (updates: UpdateProfileInput) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<ProfileAvatar>;
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
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const resolveDatabaseId = useCallback(() => APPWRITE.DATABASE_ID || '68c58e83000a2666b4d9', []);

  // Mount/unmount diagnostics
  useEffect(() => {
    console.debug('[AuthProvider] mounted');
    return () => console.debug('[AuthProvider] unmounted');
  }, [resolveDatabaseId]);

  const fetchMemberships = useCallback(async (userEmail: string) => {
    try {
      console.debug('[AuthProvider] Fetching user memberships for email:', userEmail);
      setLoading(true);

      const databaseId = resolveDatabaseId();

      // First, let's fetch all memberships to debug
      const allMemberships = await databases.listDocuments(
        databaseId,
        'membership'
      );
      console.debug('[AuthProvider] All memberships in database:', allMemberships.documents.map(doc => ({ userId: doc.userId, orgId: doc.orgId, role: doc.role })));

      // Fetch user memberships from Appwrite using email (since membership.userId stores email addresses)
      let membershipResponse = await databases.listDocuments(
        databaseId,
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
              databaseId,
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
      let hydratedUser = current;

      // Attempt to hydrate avatar from public_users collection if present
      try {
        const PUBLIC_USERS_COLLECTION = 'public_users';
        const deterministicId = `user_${current.$id}`;
        const databaseId = resolveDatabaseId();
        let publicDoc: any | null = null;
        try {
          publicDoc = await databases.getDocument(databaseId, PUBLIC_USERS_COLLECTION, deterministicId);
        } catch {}
        if (publicDoc) {
          const avatarBucket = publicDoc.avatar_bucket_id;
          const avatarFile = publicDoc.avatar_file_id;
            const avatarUrl = publicDoc.avatar_url;
            if (avatarBucket && avatarFile && avatarUrl) {
              const prefs: any = hydratedUser.prefs || {};
              const profile: any = prefs.profile || {};
              if (!profile.avatar || !profile.avatar.url) {
                profile.avatar = { bucketId: avatarBucket, fileId: avatarFile, url: avatarUrl };
                prefs.profile = profile;
                hydratedUser = { ...hydratedUser, prefs };
              }
            }
        }
      } catch (e) {
        console.debug('[AuthProvider] Could not hydrate avatar from public_users (deterministic):', e);
      }

      setUser(hydratedUser);
      
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
  }, [fetchMemberships, resolveDatabaseId]);

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

  const login = useCallback(async (email: string, password: string, isDemoLogin = false) => {
    try {
      // Set demo mode state if it's a demo login
      if (isDemoLogin) {
        console.log('[AuthContext] Demo mode login activated');
        setIsDemoMode(true);
      } else {
        setIsDemoMode(false);
      }
      
      // Step 1: Create a session, then fetch the user
      console.log('[AuthContext] Creating email/password session');
      await account.createEmailPasswordSession(email, password);
      await getCurrent();
      
      // If demo mode, handle the reset and setup AFTER successful login with better rate limit handling
      if (isDemoLogin) {
        try {
          // Using longer delays and better error handling to prevent rate limiting issues
          
          // Step 2: Initialize demo session tracking to ensure the collection exists
          console.log('[AuthContext] Initializing demo session tracking');
          
          // Initial delay before starting API operations
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            await initDemoSessionTracking();
          } catch (err) {
            console.error('[AuthContext] Failed to initialize demo session tracking:', err);
            // Continue anyway as this is not critical
          }
          
          // Longer delay between critical API calls
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          // Step 3: Log the access event (lower priority)
          try {
            console.log('[AuthContext] Logging demo user access');
            await databases.createDocument(
              resolveDatabaseId(),
              'test_user_access_logs',
              ID.unique(),
              {
                userEmail: email,
                action: 'login',
                resource: 'app_login',
                timestamp: new Date().toISOString(),
                ip: 'client-side', 
                userAgent: navigator.userAgent || 'React Native App'
              }
            );
          } catch (logErr) {
            // Just log but continue if this fails - it's not critical
            console.warn('[AuthContext] Could not log demo access (continuing anyway):', logErr);
          }
          
          // Longer delay for resetting user session - this is more important
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Step 4: Reset any previous demo user changes to ensure a clean slate
          // This is critical for proper demo functionality
          console.log('[AuthContext] Resetting previous demo user session');
          try {
            await resetDemoUserSession();
          } catch (resetErr) {
            console.error('[AuthContext] Failed to reset demo user session on login:', resetErr);
          }
          
          // Longest delay before setting up preferences - often where rate limits occur
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Step 5: Set up default preferences AFTER login and reset
          console.log('[AuthContext] Setting up demo user default preferences');
          try {
            await setupDemoDefaultPreferences();
          } catch (prefErr) {
            console.error('[AuthContext] Failed to set up demo user default preferences:', prefErr);
            // Continue even if setting defaults fails
          }
          
          // Step 6: Show a notification to the user about demo mode behavior
          Alert.alert(
            'Demo Mode Active',
            'You are using VoxCampus in demo mode. All changes will be automatically reset when you log out.',
            [{ text: 'Got it' }]
          );
        } catch (logError) {
          console.error('[AuthContext] Failed during demo user setup:', logError);
          // Don't block login if setup fails - user is already authenticated
          
          // Show a more specific alert if setup failed but login succeeded
          Alert.alert(
            'Demo Mode Active',
            'You are using VoxCampus in demo mode. Some demo features might not be fully set up, but you can still explore the app.',
            [{ text: 'Got it' }]
          );
        }
      }
    } catch (error) {
      // Reset demo mode if login failed
      if (isDemoLogin) {
        setIsDemoMode(false);
      }
      throw error;
    }
  }, [getCurrent, resolveDatabaseId]);

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
      // Handle demo user logout if applicable
      if (isDemoMode && user?.email) {
        try {
          // First, log the logout event
          await databases.createDocument(
            resolveDatabaseId(),
            'test_user_access_logs',
            ID.unique(),
            {
              userEmail: user.email,
              action: 'logout',
              resource: 'app_logout',
              timestamp: new Date().toISOString(),
              ip: 'client-side', 
              userAgent: navigator.userAgent || 'React Native App'
            }
          );
          
          // Then reset the demo user session - this will delete all tracked changes
          console.log('[AuthContext] Resetting demo user session before logout');
          await resetDemoUserSession();
          
        } catch (error) {
          console.error('Failed during demo user logout process:', error);
          // Continue with logout even if reset fails
        }
      }
      
      // Delete only current session for safety
      await account.deleteSession('current');
    } finally {
      setUser(null);
      setUserMemberships([]);
      setUserRoles([]);
      setIsDemoMode(false);
    }
  }, [isDemoMode, user, resolveDatabaseId]);

  const refresh = useCallback(async () => {
    await getCurrent();
  }, [getCurrent]);

  const updateProfile = useCallback(async (updates: UpdateProfileInput) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    const trimmedName = updates.name?.trim();

    try {
      if (trimmedName && trimmedName !== user.name) {
        await account.updateName(trimmedName);
      }

      const currentPrefs = await account.getPrefs<Record<string, any>>();
      const existingProfile: ProfilePreferences = (currentPrefs.profile as ProfilePreferences) ?? {};

      const nextProfile: ProfilePreferences = {
        ...existingProfile,
      };

      if ('bio' in updates) {
        nextProfile.bio = updates.bio ?? '';
      }

      if ('education' in updates) {
        nextProfile.education = updates.education ?? {};
      }

      if ('skills' in updates) {
        nextProfile.skills = updates.skills ?? [];
      }

      if ('projects' in updates) {
        nextProfile.projects = updates.projects ?? [];
      }

      if ('socialLinks' in updates) {
        nextProfile.socialLinks = updates.socialLinks ?? {};
      }

      if ('achievements' in updates) {
        nextProfile.achievements = updates.achievements ?? [];
      }

      if ('avatar' in updates) {
        if (updates.avatar) {
          nextProfile.avatar = updates.avatar;
        } else {
          delete nextProfile.avatar;
        }
      }

      const mergedPrefs = {
        ...currentPrefs,
        profile: nextProfile,
      };

      await account.updatePrefs(mergedPrefs);

      // Track profile update for demo user
      if (isDemoMode && user?.email) {
        await trackProfileUpdate(user.$id).catch(err => {
          console.error('Failed to track demo user profile preference update:', err);
        });
      }

      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          name: trimmedName ? trimmedName : prev.name,
          prefs: {
            ...prev.prefs,
            ...mergedPrefs,
          },
        } as Models.User<Models.Preferences>;
      });

      const refreshed = await account.get<Models.User<Models.Preferences>>();
      setUser(refreshed);
    } catch (error) {
      console.error('[AuthProvider] Failed to update profile:', error);
      throw error;
    }
  }, [user]);

  const uploadAvatar = useCallback(async (uri: string): Promise<ProfileAvatar> => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
    const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
    if (!endpoint || !project) {
      throw new Error('Appwrite endpoint or project not configured');
    }

    const bucketId = process.env.EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID || 'user_profile_images';
    const databaseId = resolveDatabaseId();
    const collectionId = process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_USERS_COLLECTION_ID || 'public_users';

    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Selected file is not accessible');
      }

      const extension = uri.split('.').pop()?.toLowerCase();
      const guessedType =
        extension === 'png'
          ? 'image/png'
          : extension === 'heic'
          ? 'image/heic'
          : extension === 'webp'
          ? 'image/webp'
          : 'image/jpeg';
      const fileName = `avatar-${user.$id}-${Date.now()}.${extension ?? 'jpg'}`;

      const filePayload = {
        uri,
        name: fileName,
        type: guessedType,
        size: fileInfo.size ?? 0,
      } as const;

      console.debug('[AuthProvider] Uploading avatar', { fileName, bucketId, size: fileInfo.size });
      
      // Step 1: Upload to Appwrite Storage
      const file = await storage.createFile(bucketId, ID.unique(), filePayload);
      console.debug('[AuthProvider] Avatar file created', { fileId: file.$id, bucketId });
      
      // Track the file upload if demo user
      if (isDemoMode && user?.email) {
        try {
          await trackFileUpload(bucketId, file.$id);
        } catch (error) {
          console.error('Failed to track demo user file upload:', error);
        }
      }

      // Step 2: Generate public URL
      const publicUrl = storage.getFileView(bucketId, file.$id).toString();
      console.debug('[AuthProvider] Generated public avatar URL', { publicUrl });

      // Step 3: Update public_users collection with BOTH avatar_url AND avatarUrl
      const deterministicId = `user_${user.$id}`;
      const profilePayload = {
        user_id: user.$id,
        name: user.name,
        avatar_bucket_id: bucketId,
        avatar_file_id: file.$id,
        avatar_url: publicUrl,  // Legacy field
        avatarUrl: publicUrl,   // New field as requested
      };

      console.debug('[AuthProvider] Updating profile document', { deterministicId, profilePayload });

      try {
        // Try to update existing document first
        await databases.updateDocument(databaseId, collectionId, deterministicId, profilePayload);
        console.debug('[AuthProvider] Updated existing public_users document');
        
        // Track the profile update for demo user
        if (isDemoMode && user?.email) {
          await trackProfileUpdate(user.$id).catch(err => {
            console.error('Failed to track demo user profile update:', err);
          });
        }
      } catch (updateErr) {
        console.debug('[AuthProvider] Update failed, creating new document', updateErr);
        try {
          // If update fails, create new document
          await databases.createDocument(databaseId, collectionId, deterministicId, profilePayload);
          console.debug('[AuthProvider] Created new public_users document');
          
          // Track the new document for demo user
          if (isDemoMode && user?.email) {
            await trackDocumentChange(databaseId, collectionId, deterministicId).catch(err => {
              console.error('Failed to track demo user document creation:', err);
            });
          }
        } catch (createErr) {
          console.error('[AuthProvider] Failed to create profile document:', createErr);
          throw new Error(`Failed to update user profile: ${createErr instanceof Error ? createErr.message : 'Unknown error'}`);
        }
      }

      // Step 4: Update user preferences for immediate UI update
      try {
        const currentPrefs = await account.getPrefs<Record<string, any>>();
        const existingProfile: ProfilePreferences = (currentPrefs.profile as ProfilePreferences) ?? {};
        const nextProfile: ProfilePreferences = {
          ...existingProfile,
          avatar: { bucketId, fileId: file.$id, url: publicUrl },
        };
        
        await account.updatePrefs({ ...currentPrefs, profile: nextProfile });
        
        // Update local state immediately for instant UI feedback
        setUser(prev => {
          if (!prev) return prev;
          return { 
            ...prev, 
            prefs: { 
              ...prev.prefs, 
              profile: nextProfile 
            } 
          } as Models.User<Models.Preferences>;
        });
        
        console.debug('[AuthProvider] Updated user preferences with new avatar');
      } catch (prefsErr) {
        console.warn('[AuthProvider] Failed to update user prefs (non-fatal):', prefsErr);
      }

      const result: ProfileAvatar = { bucketId, fileId: file.$id, url: publicUrl };
      return result;

    } catch (error) {
      console.error('[AuthProvider] Avatar upload failed:', error);
      throw error;
    }
  }, [user, resolveDatabaseId]);

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
    isDemoMode,
    login, 
    register, 
    logout, 
    refresh, 
    refreshMemberships, 
    sendVerificationEmail, 
    verifyEmail, 
    signInWithGoogle,
    updateProfile,
    uploadAvatar,
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
    signInWithGoogle,
    updateProfile,
    uploadAvatar
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
