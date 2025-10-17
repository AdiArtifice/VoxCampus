import { databases, Query } from "@/lib/appwrite";
import { APPWRITE } from "@/lib/config";
import { Models } from 'appwrite';

// Default institution values
const DEFAULT_INSTITUTION_ID = 'default_institution';
const DEFAULT_DOMAIN = 'vit.edu';
const DEFAULT_NAME = 'Default Institution';

export interface Institution {
  $id: string;
  name: string;
  domain: string;
  logoFileId?: string;
}

/**
 * Ensures the default institution exists in the database.
 * If it doesn't exist, it will be created.
 * @returns The default institution ID
 */
export async function ensureDefaultInstitution(): Promise<string> {
  try {
    // Check if default institution exists
    try {
      await databases.getDocument(
        APPWRITE.DATABASE_ID,
        'institutions',
        DEFAULT_INSTITUTION_ID
      );
      console.log('Default institution exists');
      return DEFAULT_INSTITUTION_ID;
    } catch (error) {
      // If it doesn't exist, create it
      console.log('Default institution does not exist, creating...');
      await databases.createDocument(
        APPWRITE.DATABASE_ID,
        'institutions',
        DEFAULT_INSTITUTION_ID,
        {
          name: DEFAULT_NAME,
          domain: DEFAULT_DOMAIN,
        }
      );
      return DEFAULT_INSTITUTION_ID;
    }
  } catch (error) {
    console.error('Error ensuring default institution:', error);
    return DEFAULT_INSTITUTION_ID; // Return the default ID even if there was an error
  }
}

/**
 * Gets the institution ID based on email domain
 * @param email User's email address
 * @returns Institution ID if found, default institution ID otherwise
 */
export async function getInstitutionIdFromEmail(email: string): Promise<string> {
  if (!email) return DEFAULT_INSTITUTION_ID;

  const emailDomain = email.split('@').pop()?.toLowerCase();
  if (!emailDomain) return DEFAULT_INSTITUTION_ID;

  try {
    // Search for an institution with a matching domain
    const { documents } = await databases.listDocuments(
      APPWRITE.DATABASE_ID,
      'institutions',
      [Query.equal('domain', emailDomain)]
    );

    if (documents.length > 0) {
      return documents[0].$id;
    }

    // Return default if no match
    return DEFAULT_INSTITUTION_ID;
  } catch (error) {
    console.error('Error fetching institution:', error);
    return DEFAULT_INSTITUTION_ID;
  }
}

/**
 * Creates a query filter for institutional content
 * @param institutionId Institution ID to filter by, defaults to default institution
 * @returns Appwrite Query filter for the specified institution
 */
export function institutionFilter(institutionId: string = DEFAULT_INSTITUTION_ID): string {
  console.log(`[DEBUG] Creating institution filter for ID: ${institutionId}`);
  return Query.equal('institutionId', institutionId);
}

/**
 * Wraps a database query function with institution filtering
 * @param queryFn Function that performs database queries
 * @param institutionId Institution ID to filter by (optional)
 * @returns Function that applies institution filtering to queries
 */
export function withInstitutionFilter<T extends any[], R>(
  queryFn: (...args: T) => Promise<R>,
  institutionId?: string
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    // Determine which institution to use
    const idToUse = institutionId || DEFAULT_INSTITUTION_ID;
    console.log(`[DEBUG] withInstitutionFilter using ID: ${idToUse}`);
    
    // If any of the args is an array and likely to be queries, add the institution filter
    const newArgs = args.map((arg) => {
      if (Array.isArray(arg) && arg.some(item => typeof item === 'string' && item.includes('equal('))) {
        // This is likely the queries array, add our filter
        console.log(`[DEBUG] Adding institution filter to query array`);
        return [...arg, institutionFilter(idToUse)];
      }
      return arg;
    });
    
    // Call the original function with modified arguments
    return queryFn(...newArgs as T);
  };
}

/**
 * Gets the default institution
 * @returns Promise resolving to the default institution object
 */
export async function getDefaultInstitution(): Promise<Institution> {
  try {
    const institution = await databases.getDocument(
      APPWRITE.DATABASE_ID,
      'institutions',
      DEFAULT_INSTITUTION_ID
    ) as unknown as Institution;
    
    return institution;
  } catch (error) {
    console.error('Error fetching default institution:', error);
    // Return fallback object if database call fails
    return {
      $id: DEFAULT_INSTITUTION_ID,
      name: DEFAULT_NAME,
      domain: DEFAULT_DOMAIN
    };
  }
}
