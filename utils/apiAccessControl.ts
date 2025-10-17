import { checkGuestSession } from './guestSession';

/**
 * Utility to verify if the current guest session is valid before making API calls
 * @returns True if the user can access data (valid guest session or logged in)
 * @throws Error if guest session has expired
 */
export async function verifyGuestAccess(): Promise<boolean> {
  // Check if the guest session is still valid
  const { isValid } = await checkGuestSession();
  
  if (!isValid) {
    throw new Error('Guest session expired. Please log in to continue.');
  }
  
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