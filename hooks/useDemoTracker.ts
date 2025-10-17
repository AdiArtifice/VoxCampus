import { useAuth } from '@/hooks/useAuth';
import { 
  trackDocumentChange, 
  trackFileUpload,
  trackProfileUpdate,
  trackRelation,
  trackPreferenceChange,
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
   * Track a profile update
   */
  const trackProfile = async (userId: string): Promise<void> => {
    if (isDemoMode && user?.email && isDemoUser(user.email)) {
      await trackProfileUpdate(userId).catch(err => {
        console.error('Failed to track demo user profile update:', err);
      });
    }
  };

  /**
   * Track an association or connection
   * @param databaseId Database ID
   * @param collectionId Collection ID (e.g., 'memberships', 'follows')
   * @param documentId Document ID
   * @param relationType Type of relation ('follow', 'connect', 'membership')
   */
  const trackAssociation = async (
    databaseId: string, 
    collectionId: string, 
    documentId: string, 
    relationType: string
  ): Promise<void> => {
    if (isDemoMode && user?.email && isDemoUser(user.email)) {
      await trackRelation(databaseId, collectionId, documentId, relationType).catch(err => {
        console.error(`Failed to track demo user ${relationType}:`, err);
      });
    }
  };

  /**
   * Check if the current operation should be tracked (is demo user)
   */
  const shouldTrackChanges = (): boolean => {
    return isDemoMode && !!user?.email && isDemoUser(user.email);
  };

  /**
   * Track a preference change (such as following associations)
   * @param prefType The type of preference (e.g., 'followedAssociations')
   * @param dataType Additional context about the data type
   */
  const trackPreference = async (
    prefType: string,
    dataType: string = 'user_preference'
  ): Promise<void> => {
    if (isDemoMode && user?.email && isDemoUser(user.email)) {
      await trackPreferenceChange(prefType, dataType).catch(err => {
        console.error(`Failed to track demo user preference change (${prefType}):`, err);
      });
    }
  };

  return {
    trackDocument,
    trackFile,
    trackProfile,
    trackAssociation,
    trackPreference,
    shouldTrackChanges,
    isDemoMode
  };
}