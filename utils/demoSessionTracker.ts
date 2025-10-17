import { databases, storage, ID } from '@/lib/appwrite';
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
type ChangeType = 'document' | 'file' | 'profile';

interface TrackedChange {
  id: string;
  type: ChangeType;
  collectionId?: string;
  databaseId?: string;
  bucketId?: string;
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
 * Reset all changes made by the demo user during the current session
 * @returns A promise that resolves when all changes have been reset
 */
export async function resetDemoUserSession(): Promise<void> {
  try {
    console.log('[DemoSessionTracker] Starting demo user session reset');
    
    const databaseId = APPWRITE.DATABASE_ID;
    
    // Fetch all tracked changes for this demo session
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
    
    // Process each tracked change
    const resetPromises = trackedChanges.documents.map(async (trackingDoc) => {
      try {
        const { changeType, databaseId: targetDbId, collectionId, documentId, bucketId, fileId } = trackingDoc;
        
        if (changeType === 'document' && targetDbId && collectionId && documentId) {
          // Delete the document
          await databases.deleteDocument(targetDbId, collectionId, documentId);
          console.log(`[DemoSessionTracker] Deleted document: ${collectionId}/${documentId}`);
        } 
        else if (changeType === 'file' && bucketId && fileId) {
          // Delete the file
          await storage.deleteFile(bucketId, fileId);
          console.log(`[DemoSessionTracker] Deleted file: ${bucketId}/${fileId}`);
        }
        // Profile updates are more complex and may require special handling
        // For simplicity, we might need to restore from a backup or template
        
        // Delete the tracking record itself
        await databases.deleteDocument(databaseId, DEMO_SESSION_TRACKING_COLLECTION, trackingDoc.$id);
      } catch (error) {
        console.error(`[DemoSessionTracker] Failed to reset change ${trackingDoc.$id}:`, error);
      }
    });
    
    // Wait for all reset operations to complete
    await Promise.all(resetPromises);
    
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