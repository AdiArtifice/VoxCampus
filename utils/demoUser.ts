import { ID, Query } from 'appwrite';
import { databases } from '@/lib/appwrite';
import { APPWRITE } from '@/lib/config';

/**
 * Utility functions for handling the special demo user features
 * in the VoxCampus app. This allows a test user to access content
 * across all institutions without domain restrictions.
 */

const TEST_USER_EMAIL = 'test@sjcem.edu.in';
const DATABASE_ID = APPWRITE.DATABASE_ID || '68c58e83000a2666b4d9';

/**
 * Checks if the current user is the special test user
 * @param userEmail - The email of the currently logged-in user
 * @returns Promise<boolean> - True if the user is the special test user
 */
export async function isTestUser(userEmail: string): Promise<boolean> {
  if (!userEmail) return false;
  
  return userEmail.toLowerCase() === TEST_USER_EMAIL.toLowerCase();
}

/**
 * Gets a list of all institution IDs accessible to the test user
 * Used to bypass the normal institution filtering
 * @returns Promise<string[]> - Array of institution IDs
 */
export async function getTestUserAccessibleInstitutions(): Promise<string[]> {
  try {
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      'institutions'
    );
    
    // Return all institution IDs for the test user
    return documents.map(doc => doc.$id);
  } catch (error) {
    console.error('Error fetching institutions for test user:', error);
    return [];
  }
}

/**
 * Modifies a query to allow the test user to access content
 * across all institutions. For normal users, the standard
 * institution filter is applied.
 * 
 * @param baseQueries - The original query array for database filtering
 * @param userEmail - The email of the currently logged-in user
 * @param currentInstitutionId - The current active institution ID
 * @returns Promise<string[]> - The modified query array
 */
export async function applyTestUserOverride(
  baseQueries: string[],
  userEmail: string,
  currentInstitutionId: string
): Promise<string[]> {
  // If not the test user, apply normal institution filtering
  if (!await isTestUser(userEmail)) {
    return [...baseQueries, Query.equal('institutionId', currentInstitutionId)];
  }
  
  // For test user, don't apply institution filtering
  // This allows them to see content from all institutions
  console.log('Test user access: bypassing institution filter');
  return baseQueries;
}

/**
 * Logs access by the test user for security auditing purposes
 * @param userEmail - The email of the user
 * @param action - The action being performed
 * @param resource - The resource being accessed
 */
export async function logTestUserAccess(
  userEmail: string,
  action: string,
  resource: string
): Promise<void> {
  if (!await isTestUser(userEmail)) return;
  
  try {
    // Log this access for audit purposes
    await databases.createDocument(
      DATABASE_ID,
      'test_user_access_logs',
      ID.unique(),
      {
        userEmail,
        action,
        resource,
        timestamp: new Date().toISOString(),
        // Include additional context if needed
        ip: 'client-side', // Would need server-side integration for real IP
        userAgent: navigator.userAgent
      }
    );
  } catch (error) {
    // Don't block the operation if logging fails
    console.error('Failed to log test user access:', error);
  }
}
