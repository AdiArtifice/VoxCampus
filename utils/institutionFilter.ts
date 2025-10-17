import { databases, Query } from "@/lib/appwrite";
import { APPWRITE } from "@/lib/config";
import { GuestSession } from "./guestSession";

// Type for content filtering options
export interface ContentFilterOptions {
  institutionId?: string;
  isGuest?: boolean;
}

/**
 * Utility to enforce institution-based content filtering
 */
export const InstitutionFilter = {
  /**
   * Create a query filter for institution-scoped content
   * This is the main function to use when fetching data to ensure proper institution filtering
   * 
   * @param options Filter options including institutionId and whether user is a guest
   * @returns Query string for filtering content by institution
   */
  createFilter(options: ContentFilterOptions = {}): string {
    // If institutionId is provided, use it
    if (options.institutionId) {
      return Query.equal('institutionId', options.institutionId);
    }
    
    // Otherwise use default institution for guests
    return Query.equal('institutionId', GuestSession.getDefaultInstitutionId());
  },
  
  /**
   * Apply institution filter to query array
   * Use this to add institution filtering to an existing array of queries
   * 
   * @param queries Existing array of Appwrite queries
   * @param options Filter options including institutionId and whether user is a guest
   * @returns Updated array with institution filter added
   */
  applyToQueries(queries: string[] = [], options: ContentFilterOptions = {}): string[] {
    const institutionFilter = this.createFilter(options);
    return [...queries, institutionFilter];
  },
  
  /**
   * Get the appropriate institution ID for filtering
   * Use when you need to determine which institution ID to use for filtering
   * 
   * @param userInstitutionId The logged-in user's institution ID (if any)
   * @param isGuest Whether the current session is a guest session
   * @returns Institution ID to use for filtering
   */
  getFilterInstitutionId(userInstitutionId?: string, isGuest = false): string {
    if (!isGuest && userInstitutionId) {
      return userInstitutionId;
    }
    return GuestSession.getDefaultInstitutionId();
  },
  
  /**
   * Create a default institution document if it doesn't exist
   * This ensures the default institution is available for guest access
   */
  async ensureDefaultInstitutionExists(): Promise<void> {
    const defaultId = GuestSession.getDefaultInstitutionId();
    
    try {
      // Try to get the default institution
      await databases.getDocument(
        APPWRITE.DATABASE_ID,
        'institutions',
        defaultId
      );
      console.log('Default institution exists');
    } catch (error) {
      // If it doesn't exist, create it
      try {
        await databases.createDocument(
          APPWRITE.DATABASE_ID,
          'institutions',
          defaultId,
          {
            name: 'Default Institution',
            domain: 'vit.edu',
            createdAt: new Date().toISOString()
          }
        );
        console.log('Created default institution');
      } catch (createError) {
        console.error('Failed to create default institution:', createError);
      }
    }
  }
};