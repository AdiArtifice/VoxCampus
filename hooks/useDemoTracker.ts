import { useAuth } from '@/hooks/useAuth';
import { 
  trackDocumentChange, 
  trackFileUpload,
  isDemoUser 
} from '@/utils/demoSessionTracker';

/**
 * useDemoTracker
 * 
 * A hook that provides utilities to track changes made by demo users.
 * This hook should be used in components that modify data to ensure
 * that changes made by demo users are tracked and can be reset on logout.
 */
export function useDemoTracker() {
  const { isDemoMode, user } = useAuth();

  /**
   * Track a document creation or update
   */
  const trackDocument = async (databaseId: string, collectionId: string, documentId: string): Promise<void> => {
    if (isDemoMode && user?.email && isDemoUser(user.email)) {
      await trackDocumentChange(databaseId, collectionId, documentId).catch(err => {
        console.error('Failed to track demo user document change:', err);
      });
    }
  };

  /**
   * Track a file upload
   */
  const trackFile = async (bucketId: string, fileId: string): Promise<void> => {
    if (isDemoMode && user?.email && isDemoUser(user.email)) {
      await trackFileUpload(bucketId, fileId).catch(err => {
        console.error('Failed to track demo user file upload:', err);
      });
    }
  };

  /**
   * Check if the current operation should be tracked (is demo user)
   */
  const shouldTrackChanges = (): boolean => {
    return isDemoMode && !!user?.email && isDemoUser(user.email);
  };

  return {
    trackDocument,
    trackFile,
    shouldTrackChanges,
    isDemoMode
  };
}