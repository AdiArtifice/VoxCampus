import { useState, useCallback } from 'react';
import { databases } from '@/lib/appwrite';

const DATABASE_ID = (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string) || '68c58e83000a2666b4d9';
// Note: We'll use Appwrite's built-in users API instead of a custom collection

/**
 * User data interface for comments display
 */
export interface UserProfile {
  $id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

/**
 * Custom hook to manage user profile data fetching
 * Provides efficient user data lookup for comments and other features
 */
export const useUserProfiles = () => {
  const [userCache, setUserCache] = useState<Map<string, UserProfile>>(new Map());
  const [loadingUsers, setLoadingUsers] = useState(new Set<string>());

  /**
   * Get user profile data by userId
   * Uses caching to avoid repeated API calls for the same user
   * Since Appwrite doesn't allow client-side user lookups, we use intelligent fallbacks
   */
  const getUserProfile = useCallback(async (userId: string): Promise<UserProfile> => {
    // Return cached user if available
    if (userCache.has(userId)) {
      return userCache.get(userId)!;
    }

    // Avoid duplicate requests for the same user
    if (loadingUsers.has(userId)) {
      // Wait for ongoing request by polling cache
      return new Promise((resolve) => {
        const checkCache = () => {
          if (userCache.has(userId)) {
            resolve(userCache.get(userId)!);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    // Mark user as being fetched
    setLoadingUsers(prev => new Set(prev).add(userId));

    try {
      // Since Appwrite doesn't allow direct user lookup by ID from client,
      // we create a meaningful fallback profile that's better than "Anonymous"
      
      // Extract potential name from userId if it's an email-based ID
      let displayName = 'VoxCampus User';
      
      // If userId looks like it might contain email pattern, extract username part
      if (userId.includes('@') || userId.includes('.')) {
        const emailMatch = userId.match(/([a-zA-Z0-9._%+-]+)@?/);
        if (emailMatch && emailMatch[1]) {
          // Convert email username to display name (e.g., "john.doe" -> "John Doe")
          displayName = emailMatch[1]
            .replace(/[._]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        }
      }

      const userProfile: UserProfile = {
        $id: userId,
        name: displayName,
        email: undefined,
        avatar: undefined
      };

      // Cache the result
      setUserCache(prev => new Map(prev).set(userId, userProfile));
      
      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      
      // Return fallback profile on error
      const errorProfile: UserProfile = {
        $id: userId,
        name: 'VoxCampus User',
        email: undefined,
        avatar: undefined
      };

      // Cache the error result to avoid repeated failures
      setUserCache(prev => new Map(prev).set(userId, errorProfile));
      
      return errorProfile;
    } finally {
      // Remove from loading set
      setLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [userCache, loadingUsers]);

  /**
   * Batch fetch multiple user profiles efficiently
   * Useful for loading comments with multiple users
   */
  const getUserProfiles = useCallback(async (userIds: string[]): Promise<Map<string, UserProfile>> => {
    const uniqueIds = [...new Set(userIds)];
    const profiles = new Map<string, UserProfile>();

    // Fetch profiles concurrently
    const fetchPromises = uniqueIds.map(async (userId) => {
      const profile = await getUserProfile(userId);
      profiles.set(userId, profile);
    });

    await Promise.all(fetchPromises);
    return profiles;
  }, [getUserProfile]);

  /**
   * Clear user cache (useful for memory management)
   */
  const clearUserCache = useCallback(() => {
    setUserCache(new Map());
    setLoadingUsers(new Set());
  }, []);

  /**
   * Update user profile in cache (useful when user data is available from context)
   */
  const updateUserProfile = useCallback((userId: string, profile: UserProfile) => {
    setUserCache(prev => new Map(prev).set(userId, profile));
  }, []);

  return {
    getUserProfile,
    getUserProfiles,
    clearUserCache,
    updateUserProfile,
    userCache,
    isLoadingUser: (userId: string) => loadingUsers.has(userId)
  };
};

export default useUserProfiles;