import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_SESSION_KEY = 'voxcampus_guest_session';
const GUEST_SESSION_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface GuestSession {
  startTime: number;
  expiryTime: number;
}

/**
 * Starts a new guest session with a 5-minute timer
 * @returns The expiry timestamp of the guest session
 */
export async function startGuestSession(): Promise<number> {
  const now = Date.now();
  const expiryTime = now + GUEST_SESSION_DURATION;
  
  const session: GuestSession = {
    startTime: now,
    expiryTime: expiryTime
  };
  
  console.log(`[DEBUG] Starting new guest session. Expiry at: ${new Date(expiryTime).toLocaleTimeString()}`);
  
  try {
    await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    console.log(`[DEBUG] Guest session saved successfully`);
    return expiryTime;
  } catch (error) {
    console.error(`[DEBUG] Failed to save guest session: ${error}`);
    throw error;
  }
}

/**
 * Checks if a guest session exists and is still valid
 * @returns Object containing session status and remaining time in milliseconds
 */
export async function checkGuestSession(): Promise<{
  isValid: boolean;
  remainingTime: number;
  expiryTime?: number;
}> {
  try {
    const sessionData = await AsyncStorage.getItem(GUEST_SESSION_KEY);
    
    if (!sessionData) {
      console.log(`[DEBUG] No guest session found in storage`);
      return { isValid: false, remainingTime: 0 };
    }
    
    const session: GuestSession = JSON.parse(sessionData);
    const now = Date.now();
    const remainingTime = Math.max(0, session.expiryTime - now);
    const isValid = remainingTime > 0;
    
    console.log(`[DEBUG] Guest session check: Valid=${isValid}, Remaining=${Math.round(remainingTime/1000)}s, Expiry=${new Date(session.expiryTime).toLocaleTimeString()}`);
    
    return {
      isValid,
      remainingTime,
      expiryTime: session.expiryTime
    };
  } catch (error) {
    console.error('Error checking guest session:', error);
    return { isValid: false, remainingTime: 0 };
  }
}

/**
 * Ends the current guest session
 */
export async function endGuestSession(): Promise<void> {
  console.log(`[DEBUG] Ending guest session`);
  try {
    await AsyncStorage.removeItem(GUEST_SESSION_KEY);
    console.log(`[DEBUG] Guest session removed successfully`);
  } catch (error) {
    console.error(`[DEBUG] Failed to remove guest session: ${error}`);
    throw error;
  }
}

/**
 * Returns the remaining time in the guest session in a formatted string (MM:SS)
 */
export function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
