import { databases, Query } from "@/lib/appwrite";
import { APPWRITE } from "@/lib/config";

/**
 * Helper function to extract email domain from an email address
 * @param email - The email address
 * @returns The domain part of the email
 */
export function extractDomain(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  return email.split('@').pop()?.toLowerCase() || null;
}

/**
 * Helper function to determine if two emails belong to the same institution
 * @param email1 - First email address
 * @param email2 - Second email address
 * @returns True if both emails have the same domain
 */
export function isSameInstitution(email1: string, email2: string): boolean {
  const domain1 = extractDomain(email1);
  const domain2 = extractDomain(email2);
  return !!domain1 && !!domain2 && domain1 === domain2;
}

/**
 * Helper function to determine if an email is from a known institution domain
 * @param email - The email to check
 * @returns Promise that resolves to true if the email domain matches an institution
 */
export async function isKnownInstitutionEmail(email: string): Promise<boolean> {
  const domain = extractDomain(email);
  if (!domain) return false;
  
  try {
    const { total } = await databases.listDocuments(
      APPWRITE.DATABASE_ID,
      'institutions',
      [Query.equal('domain', domain)]
    );
    
    return total > 0;
  } catch (error) {
    console.error('Error checking institution domain:', error);
    return false;
  }
}