import { useState, useEffect, useCallback } from 'react';
import { databases, Query, ID } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { useDemoTracker } from '@/hooks/useDemoTracker';

const DATABASE_ID = (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string) || '68c58e83000a2666b4d9';
const LIKES_COLLECTION = 'likes';

/**
 * Custom hook to manage likes functionality for posts
 * Handles like/unlike operations, like counts, and user's like status
 */
export const useLikes = (postId: string) => {
  const { user } = useAuth();
  const { trackDocument, isDemoMode } = useDemoTracker();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch the total likes count for a specific post
   */
  const fetchLikesCount = useCallback(async () => {
    try {
      const result = await databases.listDocuments(DATABASE_ID, LIKES_COLLECTION, [
        Query.equal('postId', postId)
      ]);
      setLikesCount(result.total);
    } catch (error) {
      console.error('Error fetching likes count:', error);
    }
  }, [postId]);

  /**
   * Check if the current user has liked this post
   */
  const checkUserLikedStatus = useCallback(async () => {
    if (!user) {
      setIsLiked(false);
      return;
    }

    try {
      const result = await databases.listDocuments(DATABASE_ID, LIKES_COLLECTION, [
        Query.equal('userId', user.$id),
        Query.equal('postId', postId)
      ]);
      setIsLiked(result.documents.length > 0);
    } catch (error) {
      console.error('Error checking like status:', error);
      setIsLiked(false);
    }
  }, [user, postId]);

  /**
   * Toggle like status for the current post
   * Optimistically updates UI then syncs with backend
   */
  const toggleLike = useCallback(async () => {
    if (!user || loading) return;

    // Optimistic UI update for immediate feedback
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    setLoading(true);

    try {
      if (wasLiked) {
        // Remove like: Find and delete the like document
        const existingLikes = await databases.listDocuments(DATABASE_ID, LIKES_COLLECTION, [
          Query.equal('userId', user.$id),
          Query.equal('postId', postId)
        ]);

        if (existingLikes.documents.length > 0) {
          await databases.deleteDocument(DATABASE_ID, LIKES_COLLECTION, existingLikes.documents[0].$id);
        }
      } else {
        // Add like: Create new like document
        const newDocumentId = ID.unique();
        await databases.createDocument(DATABASE_ID, LIKES_COLLECTION, newDocumentId, {
          postId,
          userId: user.$id,
          createdAt: new Date().toISOString()
        });
        
        // Track document creation if in demo mode
        if (isDemoMode) {
          await trackDocument(DATABASE_ID, LIKES_COLLECTION, newDocumentId);
        }
      }

      // Refresh counts from server to ensure accuracy
      await Promise.all([
        fetchLikesCount(),
        checkUserLikedStatus()
      ]);
    } catch (error) {
      // Revert optimistic update on error
      console.error('Error toggling like:', error);
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setLoading(false);
    }
  }, [user, isLiked, loading, postId, fetchLikesCount, checkUserLikedStatus]);

  /**
   * Initialize likes data when component mounts or dependencies change
   */
  useEffect(() => {
    const initializeLikes = async () => {
      await Promise.all([
        fetchLikesCount(),
        checkUserLikedStatus()
      ]);
    };

    initializeLikes();
  }, [fetchLikesCount, checkUserLikedStatus]);

  return {
    isLiked,
    likesCount,
    toggleLike,
    loading
  };
};

export default useLikes;