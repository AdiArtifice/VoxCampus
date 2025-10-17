import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const GUEST_SESSION_START_KEY = 'voxcampus_guest_session_start';
const GUEST_SESSION_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const DEFAULT_INSTITUTION_ID = 'default_institution';

/**
 * Guest session management utility
 * Handles the timing logic for guest access
 */
export const GuestSession = {
  /**
   * Start or resume a guest session
   * If a session already exists, it will be used
   * If no session exists, a new one will be created
   * @returns Promise<boolean> True if session was started, false if it already existed
   */
  async startSession(): Promise<boolean> {
    const existingSession = await this.getSessionStartTime();
    
    if (!existingSession) {
      const now = Date.now();
      await AsyncStorage.setItem(GUEST_SESSION_START_KEY, now.toString());
      return true;
    }
    
    return false;
  },

  /**
   * Get the timestamp when the guest session started
   * @returns Promise<number | null> The session start timestamp or null if no session exists
   */
  async getSessionStartTime(): Promise<number | null> {
    const startTimeString = await AsyncStorage.getItem(GUEST_SESSION_START_KEY);
    return startTimeString ? parseInt(startTimeString, 10) : null;
  },

  /**
   * Check if the guest session is still valid
   * @returns Promise<boolean> True if the session is valid, false if it has expired
   */
  async isSessionValid(): Promise<boolean> {
    const startTime = await this.getSessionStartTime();
    
    if (!startTime) {
      return false;
    }
    
    const now = Date.now();
    const elapsed = now - startTime;
    
    return elapsed < GUEST_SESSION_DURATION;
  },

  /**
   * Get the remaining time in the guest session (in milliseconds)
   * @returns Promise<number> Remaining time in milliseconds, 0 if expired
   */
  async getRemainingTime(): Promise<number> {
    const startTime = await this.getSessionStartTime();
    
    if (!startTime) {
      return 0;
    }
    
    const now = Date.now();
    const elapsed = now - startTime;
    const remaining = GUEST_SESSION_DURATION - elapsed;
    
    return Math.max(0, remaining);
  },

  /**
   * Clear the guest session
   * @returns Promise<void>
   */
  async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(GUEST_SESSION_START_KEY);
  },
  
  /**
   * Get the default institution ID for guest users
   * @returns string The default institution ID
   */
  getDefaultInstitutionId(): string {
    return DEFAULT_INSTITUTION_ID;
  }
};

/**
 * Format milliseconds into a human-readable time string (MM:SS)
 * @param ms Milliseconds
 * @returns Formatted time string
 */
export function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}