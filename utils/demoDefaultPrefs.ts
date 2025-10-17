import { account, databases, Query } from '@/lib/appwrite';
import { APPWRITE } from '@/lib/config';

/**
 * Get a default association ID for the demo user to follow
 * @returns Promise resolving to an association ID or null if none found
 */
export async function getDefaultAssociationId(): Promise<string | null> {
  try {
    console.log('[DemoDefaultPrefs] Fetching a default association to follow');
    
    const databaseId = APPWRITE.DATABASE_ID;
    const associationsCollection = 'associations';
    
    // Query for an active association
    const result = await databases.listDocuments(
      databaseId,
      associationsCollection,
      [
        Query.equal('isActive', true),
        Query.limit(1)
      ]
    );
    
    if (result.documents && result.documents.length > 0) {
      const associationId = result.documents[0].$id;
      console.log(`[DemoDefaultPrefs] Found default association to follow: ${associationId}`);
      return associationId;
    }
    
    console.log('[DemoDefaultPrefs] No active associations found');
    return null;
  } catch (error) {
    console.error('[DemoDefaultPrefs] Error fetching default association:', error);
    return null;
  }
}

/**
 * Set up default preferences for the demo user
 * This should be called after login and after resetting any previous session
 */
export async function setupDemoDefaultPreferences(): Promise<void> {
  try {
    console.log('[DemoDefaultPrefs] Setting up default preferences for demo user');
    
    // Use a hardcoded default association ID to reduce API calls and avoid rate limiting
    // This simplifies the process and makes it more reliable
    const defaultAssociationId = 'association-ascai';
    console.log(`[DemoDefaultPrefs] Using default association ID: ${defaultAssociationId}`);
    
    // Start with minimal preferences to ensure success even with rate limits
    // Only include the most essential preferences
    const essentialPrefs = {
      // Follow at least one association by default for better user experience
      followedAssociations: [defaultAssociationId],
      // UI preferences
      theme: 'light',
    };
    
    // Try to set up the essential preferences first
    try {
      await account.updatePrefs(essentialPrefs);
      console.log('[DemoDefaultPrefs] Successfully set up essential preferences');
      
      // If that works, wait and then try to add the enhanced preferences in a separate call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to enhance with additional preferences
      try {
        const enhancedPrefs = {
          // Notification preferences
          notifications: {
            enabled: true,
            academicUpdates: true,
          },
          
          // Basic profile data
          profile: {
            bio: "This is a demo account exploring VoxCampus. Any changes made will be reset when I log out.",
            interests: ["Technology", "Education"],
          },
        };
        
        await account.updatePrefs(enhancedPrefs);
        console.log('[DemoDefaultPrefs] Successfully enhanced preferences');
      } catch (enhanceError) {
        // It's okay if enhanced preferences fail - we already have the essentials
        console.log('[DemoDefaultPrefs] Could not set enhanced preferences, but essentials are in place');
      }
    } catch (error) {
      const prefError = error as { message?: string, code?: number };
      
      // Check for rate limiting or other errors
      if (prefError.message && 
          (prefError.message.includes('rate limit') || 
           prefError.code === 429 ||
           prefError.message.includes('too many requests'))) {
        console.error('[DemoDefaultPrefs] Rate limit hit. Will continue with default preferences');
      } else {
        // For other errors, log but continue
        console.error('[DemoDefaultPrefs] Error setting preferences:', prefError.message || 'Unknown error');
      }
    }
    
  } catch (error) {
    console.error('[DemoDefaultPrefs] Failed to set up default preferences:', error);
    // Don't throw error - allow login to continue even if setting defaults fails
  }
}