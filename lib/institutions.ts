import { databases, Query } from "@/lib/appwrite";
import { APPWRITE } from "@/lib/config";
import { Models } from 'appwrite';

export interface Institution {
  $id: string;
  name: string;
  domain: string;
  logoFileId?: string;
}

/**
 * Gets the institution ID based on email domain
 * @param email User's email address
 * @returns Institution ID if found, null otherwise
 */
export async function getInstitutionIdFromEmail(email: string): Promise<string | null> {
  if (!email) return null;

  const emailDomain = email.split('@').pop();
  if (!emailDomain) return null;

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

    // If no match, check for a default institution
    try {
      const defaultInstitution = await databases.getDocument(
        APPWRITE.DATABASE_ID,
        'institutions',
        'default_institution'
      );
      return defaultInstitution.$id;
    } catch (error) {
      console.error('No default institution found:', error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching institution:', error);
    return null;
  }
}

/**
 * Gets all institutions from the database
 * @returns Array of institutions
 */
export async function getAllInstitutions(): Promise<Institution[]> {
  try {
    const { documents } = await databases.listDocuments(
      APPWRITE.DATABASE_ID,
      'institutions'
    );
    
    return documents as unknown as Institution[];
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return [];
  }
}

/**
 * Gets an institution by its ID
 * @param institutionId Institution ID
 * @returns Institution object if found, null otherwise
 */
export async function getInstitutionById(institutionId: string): Promise<Institution | null> {
  if (!institutionId) return null;

  try {
    const institution = await databases.getDocument(
      APPWRITE.DATABASE_ID,
      'institutions',
      institutionId
    );
    
    return institution as unknown as Institution;
  } catch (error) {
    console.error('Error fetching institution by ID:', error);
    return null;
  }
}

/**
 * Creates a query filter for the current institution
 * @param institutionId Institution ID to filter by
 * @returns Appwrite Query filter for the specified institution
 */
export function institutionFilter(institutionId: string): string {
  if (!institutionId) {
    throw new Error('Institution ID is required for filtering');
  }
  
  return Query.equal('institutionId', institutionId);
}