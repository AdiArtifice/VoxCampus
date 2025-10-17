import { client } from '../lib/appwrite';
import { Functions } from 'react-native-appwrite';
import { checkGuestSession } from './guestSession';

// Function ID will need to be updated once the function is deployed
const GUEST_ACCESS_VALIDATOR_FUNCTION_ID = 'guest-access-validator';
const GUEST_ACCESS_KEY = 'YOUR_GUEST_ACCESS_KEY'; // This should be stored securely and match the server environment variable

/**
 * Validates a guest session on the server side
 * This provides enhanced security compared to client-side validation alone
 */
export const validateGuestSessionOnServer = async (): Promise<{
  success: boolean;
  remainingTime?: number;
  expiryTime?: number;
  institutionId?: string;
  institutionName?: string;
  error?: string;
  expired?: boolean;
}> => {
  try {
    // Get current session from storage
    const sessionCheck = await checkGuestSession();
    if (!sessionCheck.isValid) {
      return { success: false, error: 'No active guest session' };
    }

    // Create session token (simplified for demo - in production use proper JWT)
    const sessionToken = Buffer.from(JSON.stringify({
      expiryTime: sessionCheck.expiryTime
    })).toString('base64');

    // Call the Appwrite function
    const functions = new Functions(client);
    const execution = await functions.createExecution(
      GUEST_ACCESS_VALIDATOR_FUNCTION_ID,
      JSON.stringify({
        sessionToken,
        guestKey: GUEST_ACCESS_KEY
      })
    );

    // Parse response
    let response;
    try {
      // The response is already parsed by the SDK
      return execution.responseBody ? JSON.parse(execution.responseBody) : { 
        success: false, 
        error: 'No response body' 
      };
    } catch (error) {
      console.error('Failed to parse function response', error);
      return { success: false, error: 'Invalid server response' };
    }
  } catch (error) {
    console.error('Error validating guest session on server', error);
    return { success: false, error: 'Server validation failed' };
  }
};

/**
 * HOC that adds server-side validation to API calls
 * @param apiCall The API function to wrap with server validation
 * @returns The wrapped function that validates the session before proceeding
 */
export const withServerGuestValidation = <T extends any[], R>(
  apiCall: (...args: T) => Promise<R>
): ((...args: T) => Promise<R | { error: string }>) => {
  return async (...args: T) => {
    // First check if the session is valid on the server
    const validationResult = await validateGuestSessionOnServer();
    
    // If validation fails, return error
    if (!validationResult.success) {
      if (validationResult.expired) {
        // Session has expired - could trigger login prompt here as well
        console.log('Guest session expired (server validated)');
        return { error: 'Guest session expired' };
      }
      return { error: validationResult.error || 'Guest validation failed' };
    }
    
    // Session is valid, proceed with the API call
    return await apiCall(...args);
  };
};