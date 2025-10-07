import { useState, useEffect, useCallback } from 'react';
import { databases, Query } from '@/lib/appwrite';

export interface UserProfile {
  $id?: string;
  user_id?: string;
  name?: string;
  avatar_bucket_id?: string;
  avatar_file_id?: string;
  avatar_url?: string;
  avatarUrl?: string;
  [key: string]: any; // Allow additional properties from Document
}

interface UseUserProfileOptions {
  userId: string;
  autoRefresh?: boolean;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook to fetch and manage user profile data from the public_users collection
 * 
 * This hook automatically fetches the user's profile information including
 * their avatar URL from the Appwrite database. It provides real-time updates
 * and error handling.
 */
export function useUserProfile({ 
  userId, 
  autoRefresh = true 
}: UseUserProfileOptions): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getConfig = useCallback(() => {
    const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '68c58e83000a2666b4d9';
    const collectionId = process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_USERS_COLLECTION_ID || 'public_users';
    return { databaseId, collectionId };
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const config = getConfig();
      const documentId = `user_${userId}`;

      console.debug('[useUserProfile] Fetching profile for user:', userId);

      // Try to get the specific document first
      try {
        const document = await databases.getDocument(
          config.databaseId,
          config.collectionId,
          documentId
        );
        
        setProfile(document as UserProfile);
        console.debug('[useUserProfile] Found profile document:', document);
        return;
      } catch (getError) {
        console.debug('[useUserProfile] Direct document fetch failed, trying query:', getError);
      }

      // If direct fetch fails, try querying by user_id
      const response = await databases.listDocuments(
        config.databaseId,
        config.collectionId,
        [Query.equal('user_id', userId), Query.limit(1)]
      );

      if (response.documents.length > 0) {
        setProfile(response.documents[0] as UserProfile);
        console.debug('[useUserProfile] Found profile via query:', response.documents[0]);
      } else {
        setProfile(null);
        console.debug('[useUserProfile] No profile found for user:', userId);
      }

    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to fetch profile';
      console.error('[useUserProfile] Fetch error:', fetchError);
      setError(errorMessage);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, getConfig]);

  // Auto-fetch on mount and when userId changes
  useEffect(() => {
    if (userId && autoRefresh) {
      fetchProfile();
    }
  }, [userId, autoRefresh, fetchProfile]);

  const refresh = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refresh,
    clearError,
  };
}

/**
 * Hook to get avatar URL with fallback logic
 */
export function useAvatarUrl(profile: UserProfile | null): string | undefined {
  return profile?.avatarUrl || profile?.avatar_url || undefined;
}

/**
 * Hook to get multiple user profiles by their user IDs
 */
export function useUserProfiles(userIds: string[]) {
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    if (userIds.length === 0) {
      setProfiles({});
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '68c58e83000a2666b4d9';
      const collectionId = process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_USERS_COLLECTION_ID || 'public_users';

      console.debug('[useUserProfiles] Fetching profiles for users:', userIds);

      // Query for all user profiles
      const response = await databases.listDocuments(
        databaseId,
        collectionId,
        [
          Query.equal('user_id', userIds),
          Query.limit(userIds.length)
        ]
      );

      // Convert to lookup map
      const profileMap: Record<string, UserProfile> = {};
      response.documents.forEach((doc) => {
        const profile = doc as UserProfile;
        if (profile.user_id) {
          profileMap[profile.user_id] = profile;
        }
      });

      setProfiles(profileMap);
      console.debug('[useUserProfiles] Fetched profiles:', profileMap);

    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to fetch profiles';
      console.error('[useUserProfiles] Fetch error:', fetchError);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userIds]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    isLoading,
    error,
    refresh: fetchProfiles,
  };
}