import { useState, useEffect, useCallback } from 'react';
import { databases, Query, ID } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles, type UserProfile } from '@/hooks/useUserProfiles';

const DATABASE_ID = (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string) || '68c58e83000a2666b4d9';
const COMMENTS_COLLECTION = 'comments';

/**
 * Comment data structure for type safety
 */
export interface Comment {
  $id: string;
  postId: string;
  userId: string;
  commentText: string;
  createdAt: string;
  userName?: string; // Populated from user data
  userAvatar?: string; // Populated from user data
}

/**
 * Custom hook to manage comments functionality for posts
 * Handles fetching, creating, and managing comments with real-time updates
 */
export const useComments = (postId: string) => {
  const { user } = useAuth();
  const { getUserProfiles, updateUserProfile } = useUserProfiles();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(false);

  /**
   * Fetch all comments for a specific post
   * Orders by creation date (oldest first for natural conversation flow)
   * Enriches comments with user profile data for proper display
   */
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Fetch comment documents from database
      const result = await databases.listDocuments(DATABASE_ID, COMMENTS_COLLECTION, [
        Query.equal('postId', postId),
        Query.orderAsc('createdAt'),
        Query.limit(100) // Reasonable limit for performance
      ]);

      // Step 2: Extract unique user IDs from comments
      const userIds = [...new Set(result.documents.map(doc => doc.userId))];

      // Step 3: Fetch user profiles for all comment authors
      setLoadingUserData(true);
      let userProfiles = new Map<string, UserProfile>();
      
      if (userIds.length > 0) {
        try {
          userProfiles = await getUserProfiles(userIds);
        } catch (error) {
          console.error('Error fetching user profiles for comments:', error);
        }
      }

      // Step 4: Enrich comments with user data
      const fetchedComments: Comment[] = result.documents.map(doc => {
        const userProfile = userProfiles.get(doc.userId);
        
        // Handle current user's comments with fresh data from auth context
        if (user && doc.userId === user.$id) {
          // Update user profile cache with current user data
          const currentUserProfile: UserProfile = {
            $id: user.$id,
            name: user.name || user.email?.split('@')[0] || 'You',
            email: user.email,
            avatar: undefined // Could be extended to include user avatar
          };
          updateUserProfile(user.$id, currentUserProfile);
          
          return {
            $id: doc.$id,
            postId: doc.postId,
            userId: doc.userId,
            commentText: doc.commentText,
            createdAt: doc.createdAt,
            userName: currentUserProfile.name,
            userAvatar: currentUserProfile.avatar
          };
        }

        // Use fetched user profile data or fallback
        return {
          $id: doc.$id,
          postId: doc.postId,
          userId: doc.userId,
          commentText: doc.commentText,
          createdAt: doc.createdAt,
          userName: userProfile?.name || 'VoxCampus User',
          userAvatar: userProfile?.avatar
        };
      });

      setComments(fetchedComments);
      setCommentsCount(result.total);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
      setCommentsCount(0);
    } finally {
      setLoading(false);
      setLoadingUserData(false);
    }
  }, [postId, getUserProfiles, user, updateUserProfile]);

  /**
   * Create a new comment for the post
   * Optimistically updates UI then syncs with backend
   * Ensures proper user data is attached to new comments
   */
  const addComment = useCallback(async (commentText: string): Promise<boolean> => {
    if (!user || !commentText.trim() || submitting) return false;

    const trimmedText = commentText.trim();
    setSubmitting(true);

    // Ensure current user profile is in cache with latest data
    const currentUserProfile: UserProfile = {
      $id: user.$id,
      name: user.name || user.email?.split('@')[0] || 'You',
      email: user.email,
      avatar: undefined
    };
    updateUserProfile(user.$id, currentUserProfile);

    // Create optimistic comment for immediate UI feedback with proper user data
    const optimisticComment: Comment = {
      $id: `temp-${Date.now()}`,
      postId,
      userId: user.$id,
      commentText: trimmedText,
      createdAt: new Date().toISOString(),
      userName: currentUserProfile.name,
      userAvatar: currentUserProfile.avatar
    };

    // Optimistically add to local state
    setComments(prev => [...prev, optimisticComment]);
    setCommentsCount(prev => prev + 1);

    try {
      // Create comment document in backend
      const newComment = await databases.createDocument(
        DATABASE_ID,
        COMMENTS_COLLECTION,
        ID.unique(),
        {
          postId,
          userId: user.$id,
          commentText: trimmedText,
          createdAt: new Date().toISOString()
        }
      );

      // Replace optimistic comment with real comment from backend, maintaining user data
      setComments(prev => 
        prev.map(comment => 
          comment.$id === optimisticComment.$id 
            ? {
                $id: newComment.$id,
                postId: newComment.postId,
                userId: newComment.userId,
                commentText: newComment.commentText,
                createdAt: newComment.createdAt,
                userName: currentUserProfile.name, // Use cached user profile data
                userAvatar: currentUserProfile.avatar
              }
            : comment
        )
      );

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      
      // Remove optimistic comment on error
      setComments(prev => prev.filter(comment => comment.$id !== optimisticComment.$id));
      setCommentsCount(prev => prev - 1);
      
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, postId, submitting]);

  /**
   * Delete a comment (users can only delete their own comments)
   */
  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    const commentToDelete = comments.find(c => c.$id === commentId);
    if (!commentToDelete || commentToDelete.userId !== user.$id) return false;

    // Optimistically remove from UI
    setComments(prev => prev.filter(comment => comment.$id !== commentId));
    setCommentsCount(prev => prev - 1);

    try {
      await databases.deleteDocument(DATABASE_ID, COMMENTS_COLLECTION, commentId);
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      
      // Restore comment on error
      setComments(prev => [...prev, commentToDelete]);
      setCommentsCount(prev => prev + 1);
      
      return false;
    }
  }, [user, comments]);

  /**
   * Format timestamp for display
   * Returns relative time (e.g., "2 minutes ago", "1 hour ago")
   */
  const formatTimestamp = useCallback((timestamp: string): string => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMs = now.getTime() - commentTime.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    // For older comments, show actual date
    return commentTime.toLocaleDateString();
  }, []);

  /**
   * Initialize comments data when component mounts or postId changes
   * Only re-fetch when postId changes, not when user or other dependencies change
   */
  useEffect(() => {
    fetchComments();
  }, [postId]); // Only depend on postId, not fetchComments function

  return {
    comments,
    commentsCount,
    loading,
    loadingUserData,
    submitting,
    addComment,
    deleteComment,
    formatTimestamp,
    refreshComments: fetchComments
  };
};

export default useComments;