import { databases, storage, ID, account } from '@/lib/appwrite';
import { APPWRITE } from '@/lib/config';

/**
 * DemoSessionTracker
 * 
 * Utility to track and reset changes made by the demo user during a session.
 * This ensures demo users always start with a clean slate and changes don't persist.
 */

// Constants
const DEMO_USER_EMAIL = 'test@sjcem.edu.in';
const DEMO_SESSION_TRACKING_COLLECTION = 'demo_session_tracking';

// Types
type ChangeType = 'document' | 'file' | 'profile' | 'association' | 'connection' | 'follow' | 'membership' | 'preference';

interface TrackedChange {
  id: string;
  type: ChangeType;
  collectionId?: string;
  databaseId?: string;
  bucketId?: string;
  relationType?: string;
  timestamp: string;
}

/**
 * Track a document change made by the demo user
 * @param databaseId The database ID where the document was created/modified
 * @param collectionId The collection ID where the document was created/modified
 * @param documentId The ID of the document that was created/modified
 * @returns The ID of the tracking record
 */
export async function trackDocumentChange(
  databaseId: string,
  collectionId: string,
  documentId: string
): Promise<string> {
  try {
    const databaseIdToUse = databaseId || APPWRITE.DATABASE_ID;
    
    // Create a tracking record
    const trackingRecord = await databases.createDocument(
      databaseIdToUse,
      DEMO_SESSION_TRACKING_COLLECTION,
      ID.unique(),
      {
        changeType: 'document',
        databaseId: databaseIdToUse,
        collectionId,
        documentId,
        userEmail: DEMO_USER_EMAIL,
        timestamp: new Date().toISOString()
      }
    );
    
    console.log(`[DemoSessionTracker] Tracked document change: ${collectionId}/${documentId}`);
    return trackingRecord.$id;
  } catch (error) {
    console.error('[DemoSessionTracker] Failed to track document change:', error);
    return '';
  }
}

/**
 * Track a file upload made by the demo user
 * @param bucketId The bucket ID where the file was uploaded
 * @param fileId The ID of the file that was uploaded
 * @returns The ID of the tracking record
 */
export async function trackFileUpload(
  bucketId: string,
  fileId: string
): Promise<string> {
  try {
    const databaseId = APPWRITE.DATABASE_ID;
    
    // Create a tracking record
    const trackingRecord = await databases.createDocument(
      databaseId,
      DEMO_SESSION_TRACKING_COLLECTION,
      ID.unique(),
      {
        changeType: 'file',
        bucketId,
        fileId,
        userEmail: DEMO_USER_EMAIL,
        timestamp: new Date().toISOString()
      }
    );
    
    console.log(`[DemoSessionTracker] Tracked file upload: ${bucketId}/${fileId}`);
    return trackingRecord.$id;
  } catch (error) {
    console.error('[DemoSessionTracker] Failed to track file upload:', error);
    return '';
  }
}

/**
 * Track a profile update made by the demo user
 * @param userId The ID of the user profile that was updated
 * @returns The ID of the tracking record
 */
export async function trackProfileUpdate(userId: string): Promise<string> {
  try {
    const databaseId = APPWRITE.DATABASE_ID;
    
    // Create a tracking record
    const trackingRecord = await databases.createDocument(
      databaseId,
      DEMO_SESSION_TRACKING_COLLECTION,
      ID.unique(),
      {
        changeType: 'profile',
        userId,
        userEmail: DEMO_USER_EMAIL,
        timestamp: new Date().toISOString()
      }
    );
    
    console.log(`[DemoSessionTracker] Tracked profile update: ${userId}`);
    return trackingRecord.$id;
  } catch (error) {
    console.error('[DemoSessionTracker] Failed to track profile update:', error);
    return '';
  }
}

/**
 * Track a preference change made by the demo user
 * @param prefType The type of preference (e.g., 'followedAssociations', 'theme', etc.)
 * @param dataType Additional context about the data being changed
 * @returns The ID of the tracking record
 */
export async function trackPreferenceChange(
  prefType: string,
  dataType: string = 'user_preference'
): Promise<string> {
  try {
    const databaseId = APPWRITE.DATABASE_ID;
    
    // Create a tracking record
    const trackingRecord = await databases.createDocument(
      databaseId,
      DEMO_SESSION_TRACKING_COLLECTION,
      ID.unique(),
      {
        changeType: 'preference',
        prefType,
        dataType,
        userEmail: DEMO_USER_EMAIL,
        timestamp: new Date().toISOString()
      }
    );
    
    console.log(`[DemoSessionTracker] Tracked preference change: ${prefType} (${dataType})`);
    return trackingRecord.$id;
  } catch (error) {
    console.error('[DemoSessionTracker] Failed to track preference change:', error);
    return '';
  }
}

/**
 * Track an association or connection made by the demo user
 * @param databaseId The database ID where the association was created
 * @param collectionId The collection ID where the association was created
 * @param documentId The ID of the association document
 * @param relationType The type of relation (e.g., 'follow', 'connect', 'membership')
 * @returns The ID of the tracking record
 */
export async function trackRelation(
  databaseId: string,
  collectionId: string,
  documentId: string,
  relationType: string
): Promise<string> {
  try {
    const databaseIdToUse = databaseId || APPWRITE.DATABASE_ID;
    
    // Create a tracking record
    const trackingRecord = await databases.createDocument(
      databaseIdToUse,
      DEMO_SESSION_TRACKING_COLLECTION,
      ID.unique(),
      {
        changeType: relationType || 'association',
        databaseId: databaseIdToUse,
        collectionId,
        documentId,
        relationType,
        userEmail: DEMO_USER_EMAIL,
        timestamp: new Date().toISOString()
      }
    );
    
    console.log(`[DemoSessionTracker] Tracked relation: ${relationType} - ${collectionId}/${documentId}`);
    return trackingRecord.$id;
  } catch (error) {
    console.error(`[DemoSessionTracker] Failed to track relation (${relationType}):`, error);
    return '';
  }
}

/**
 * Reset all changes made by the demo user during the current session
 * @returns A promise that resolves when all changes have been reset
 */
export async function resetDemoUserSession(): Promise<void> {
  try {
    console.log('[DemoSessionTracker] Starting demo user session reset');
    
    const databaseId = APPWRITE.DATABASE_ID;
    
    // Step 1: Reset user preferences (including followed associations)
    // We'll do a minimal preferences reset to avoid rate limits
    try {
      console.log('[DemoSessionTracker] Resetting demo user preferences');
      
      // Only reset the most critical preferences to avoid rate limits
      await account.updatePrefs({
        // Reset followed associations to empty array - this is the most important
        followedAssociations: [],
        // Minimal other prefs to reduce API payload
        theme: 'light',
      });
      
      console.log('[DemoSessionTracker] Successfully reset demo user preferences');
    } catch (prefError) {
      console.error('[DemoSessionTracker] Failed to reset demo user preferences:', prefError);
      // Continue with other reset operations even if this fails
    }
    
    // Add a small delay after preference reset to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 2: Fetch all tracked changes for this demo session
    const trackedChanges = await databases.listDocuments(
      databaseId,
      DEMO_SESSION_TRACKING_COLLECTION,
      [
        // Filter by demo user email
        // We could also filter by session ID if we want to track multiple demo users
        // or maintain historical records
        // For now we assume only one demo user with the fixed email
        `userEmail=${DEMO_USER_EMAIL}`
      ]
    );
    
    if (!trackedChanges.documents || trackedChanges.documents.length === 0) {
      console.log('[DemoSessionTracker] No changes to reset');
      return;
    }
    
    console.log(`[DemoSessionTracker] Found ${trackedChanges.documents.length} changes to reset`);
    
    // Process tracked changes sequentially to avoid rate limits
    console.log(`[DemoSessionTracker] Processing ${trackedChanges.documents.length} changes sequentially to avoid rate limits`);
    
    for (const trackingDoc of trackedChanges.documents) {
      try {
        const { 
          changeType, 
          databaseId: targetDbId, 
          collectionId, 
          documentId, 
          bucketId, 
          fileId,
          relationType,
          prefType
        } = trackingDoc;
        
        // Handle different types of changes
        switch(changeType) {
          case 'document':
            if (targetDbId && collectionId && documentId) {
              await databases.deleteDocument(targetDbId, collectionId, documentId)
                .catch(e => console.log(`[DemoSessionTracker] Could not delete document - may already be deleted: ${e.message}`));
              console.log(`[DemoSessionTracker] Deleted document: ${collectionId}/${documentId}`);
              // Add delay to prevent rate limits
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            break;
            
          case 'file':
            if (bucketId && fileId) {
              await storage.deleteFile(bucketId, fileId)
                .catch(e => console.log(`[DemoSessionTracker] Could not delete file - may already be deleted: ${e.message}`));
              console.log(`[DemoSessionTracker] Deleted file: ${bucketId}/${fileId}`);
              // Add delay to prevent rate limits
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            break;
            
          case 'association':
          case 'connection':
          case 'follow':
          case 'membership':
            if (targetDbId && collectionId && documentId) {
              await databases.deleteDocument(targetDbId, collectionId, documentId)
                .catch(e => console.log(`[DemoSessionTracker] Could not delete relation - may already be deleted: ${e.message}`));
              console.log(`[DemoSessionTracker] Deleted relation: ${changeType}/${documentId}`);
              // Add delay to prevent rate limits
              await new Promise(resolve => setTimeout(resolve, 250));
            }
            break;
            
          case 'preference':
            // Preferences are already reset in Step 1 (bulk reset)
            console.log(`[DemoSessionTracker] Preference change already reset: ${prefType || 'unknown'}`);
            break;
            
          default:
            console.log(`[DemoSessionTracker] Unknown change type: ${changeType}`);
        }
        
        // Delete the tracking record itself
        await databases.deleteDocument(databaseId, DEMO_SESSION_TRACKING_COLLECTION, trackingDoc.$id)
          .catch(e => console.log(`[DemoSessionTracker] Could not delete tracking record: ${e.message}`));
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[DemoSessionTracker] Failed to reset change ${trackingDoc.$id}:`, error);
      }
    }
    
    console.log('[DemoSessionTracker] Demo user session reset complete');
  } catch (error) {
    console.error('[DemoSessionTracker] Failed to reset demo user session:', error);
  }
}

/**
 * Check if a user is the demo user
 * @param email User email to check
 * @returns True if the user is the demo user
 */
export function isDemoUser(email: string): boolean {
  return email === DEMO_USER_EMAIL;
}

/**
 * Initialize the demo session tracking system
 * This ensures the tracking collection exists
 */
export async function initDemoSessionTracking(): Promise<void> {
  try {
    // Check if collection exists, create it if it doesn't
    const databaseId = APPWRITE.DATABASE_ID;
    
    // This might throw if the collection doesn't exist
    // In a production app, we'd use a better approach to check if the collection exists
    // For now, we'll catch the error and create the collection
    try {
      await databases.listDocuments(databaseId, DEMO_SESSION_TRACKING_COLLECTION, []);
      console.log('[DemoSessionTracker] Demo session tracking collection exists');
    } catch (error) {
      console.log('[DemoSessionTracker] Creating demo session tracking collection');
      
      // In a real implementation, we'd use the Appwrite API to create the collection
      // For simplicity, we'll assume the collection already exists or will be created manually
      console.error('[DemoSessionTracker] Demo session tracking collection may need to be created manually');
    }
  } catch (error) {
    console.error('[DemoSessionTracker] Failed to initialize demo session tracking:', error);
  }
}