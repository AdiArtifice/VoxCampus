import { checkGuestSession } from './guestSession';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility to verify if the current guest session is valid before making API calls
 * @returns True if the user can access data (valid guest session or logged in)
 * @throws Error if guest session has expired
 */
export async function verifyGuestAccess(): Promise<boolean> {
  console.log('[DEBUG] apiAccessControl - Verifying guest access');
  
  // Check if the guest session is still valid
  const { isValid, remainingTime } = await checkGuestSession();
  console.log(`[DEBUG] apiAccessControl - Guest session valid: ${isValid}, Remaining: ${Math.round(remainingTime/1000)}s`);
  
  // Allow access for first-time users even without an explicit session
  try {
    // Check if this might be a first-time user (no session yet but should be allowed access)
    const firstLaunchValue = await AsyncStorage.getItem('voxcampus_first_launch');
    const isFirstTime = firstLaunchValue === null;
    
    if (isFirstTime) {
      console.log('[DEBUG] apiAccessControl - First time user, allowing access');
      return true;
    }
  } catch (error) {
    console.error('[DEBUG] apiAccessControl - Error checking first launch:', error);
  }
  
  if (!isValid) {
    console.log('[DEBUG] apiAccessControl - Guest access denied');
    throw new Error('Guest session expired. Please log in to continue.');
  }
  
  console.log('[DEBUG] apiAccessControl - Guest access granted');
  return true;
}

/**
 * Wraps an API function with guest session verification
 * @param apiFn The API function to wrap
 * @returns A wrapped function that checks guest session before executing
 */
export function withGuestVerification<T extends (...args: any[]) => Promise<any>>(
  apiFn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      await verifyGuestAccess();
      return await apiFn(...args);
    } catch (error: any) {
      if (error.message?.includes('Guest session expired')) {
        // Re-throw the session expired error to be handled by the UI
        throw error;
      } else {
        // For other errors, pass through
        throw error;
      }
    }
  }) as T;
}