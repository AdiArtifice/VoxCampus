import React, { createContext, useState, useEffect, useCallback } from 'react';
import { startGuestSession, checkGuestSession, endGuestSession } from '../utils/guestSession';
import { ensureDefaultInstitution } from '../utils/institutionFilter';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Guest session context type
export interface GuestSessionContextType {
  isGuestSession: boolean;
  guestSessionActive: boolean;
  guestSessionRemainingTime: number;
  guestSessionExpiryTime?: number;
  startNewGuestSession: () => Promise<void>;
  endCurrentGuestSession: () => Promise<void>;
  checkCurrentGuestSession: () => Promise<void>;
  institutionId: string | null;
}

// Create the context with default values
export const GuestSessionContext = createContext<GuestSessionContextType>({
  isGuestSession: false,
  guestSessionActive: false,
  guestSessionRemainingTime: 0,
  startNewGuestSession: async () => {},
  endCurrentGuestSession: async () => {},
  checkCurrentGuestSession: async () => {},
  institutionId: null
});

// Timer update interval (1 second)
const UPDATE_INTERVAL = 1000;

export const GuestSessionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isGuestSession, setIsGuestSession] = useState<boolean>(false);
  const [guestSessionActive, setGuestSessionActive] = useState<boolean>(false);
  const [guestSessionRemainingTime, setGuestSessionRemainingTime] = useState<number>(0);
  const [guestSessionExpiryTime, setGuestSessionExpiryTime] = useState<number | undefined>(undefined);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true);

  // Check if this is the first app launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const firstLaunchValue = await AsyncStorage.getItem('voxcampus_first_launch');
        const isFirstTime = firstLaunchValue === null;
        console.log(`[DEBUG] GuestSessionProvider - First launch check: ${isFirstTime}`);
        setIsFirstLaunch(isFirstTime);
        
        // If this is the first launch, save that info
        if (isFirstTime) {
          await AsyncStorage.setItem('voxcampus_first_launch', 'false');
          console.log(`[DEBUG] GuestSessionProvider - Marked first launch complete`);
        }
      } catch (error) {
        console.error(`[DEBUG] GuestSessionProvider - Error checking first launch:`, error);
        setIsFirstLaunch(false);
      }
    };
    
    checkFirstLaunch();
  }, []);

  // Function to start a new guest session
  const startNewGuestSession = async () => {
    console.log(`[DEBUG] GuestSessionProvider - Starting new guest session`);
    try {
      const expiryTime = await startGuestSession();
      setIsGuestSession(true);
      setGuestSessionActive(true);
      setGuestSessionExpiryTime(expiryTime);
      
      // Ensure default institution exists and set it as current
      console.log(`[DEBUG] GuestSessionProvider - Getting default institution`);
      const defaultInstitutionId = await ensureDefaultInstitution();
      console.log(`[DEBUG] GuestSessionProvider - Default institution ID: ${defaultInstitutionId}`);
      setInstitutionId(defaultInstitutionId);
    } catch (error) {
      console.error('Error starting guest session:', error);
      Alert.alert(
        'Error',
        'Could not start guest session. Please try again.'
      );
    }
  };

  // Function to end the current guest session
  const endCurrentGuestSession = async () => {
    try {
      await endGuestSession();
      setIsGuestSession(false);
      setGuestSessionActive(false);
      setGuestSessionRemainingTime(0);
      setGuestSessionExpiryTime(undefined);
    } catch (error) {
      console.error('Error ending guest session:', error);
    }
  };

  // Function to check current guest session status
  const checkCurrentGuestSession = async () => {
    console.log(`[DEBUG] GuestSessionProvider - Checking current guest session`);
    try {
      const { isValid, remainingTime, expiryTime } = await checkGuestSession();
      console.log(`[DEBUG] GuestSessionProvider - Session valid: ${isValid}, Remaining: ${Math.round(remainingTime/1000)}s`);
      
      setGuestSessionActive(isValid);
      setGuestSessionRemainingTime(remainingTime);
      setGuestSessionExpiryTime(expiryTime);
      
      if (isValid) {
        console.log(`[DEBUG] GuestSessionProvider - Setting guest session active`);
        setIsGuestSession(true);
        
        // Ensure default institution exists and set it as current
        const defaultInstitutionId = await ensureDefaultInstitution();
        console.log(`[DEBUG] GuestSessionProvider - Default institution ID: ${defaultInstitutionId}`);
        setInstitutionId(defaultInstitutionId);
      } else if (isFirstLaunch) {
        // For first-time users, automatically start a guest session
        console.log(`[DEBUG] GuestSessionProvider - First launch, starting guest session automatically`);
        await startNewGuestSession();
      }
    } catch (error) {
      console.error('[DEBUG] GuestSessionProvider - Error checking guest session:', error);
    }
  };

  // Check guest session on initial load
  useEffect(() => {
    console.log(`[DEBUG] GuestSessionProvider - Initial load effect running`);
    checkCurrentGuestSession();
    
    // Set up interval to check session status
    const intervalId = setInterval(checkCurrentGuestSession, UPDATE_INTERVAL);
    console.log(`[DEBUG] GuestSessionProvider - Set up interval with ID ${intervalId}`);
    
    return () => {
      console.log(`[DEBUG] GuestSessionProvider - Cleaning up interval ${intervalId}`);
      clearInterval(intervalId);
    };
  }, [isFirstLaunch]); // Re-run if isFirstLaunch changes

  const contextValue: GuestSessionContextType = {
    isGuestSession,
    guestSessionActive,
    guestSessionRemainingTime,
    guestSessionExpiryTime,
    startNewGuestSession,
    endCurrentGuestSession,
    checkCurrentGuestSession,
    institutionId
  };

  return (
    <GuestSessionContext.Provider value={contextValue}>
      {children}
    </GuestSessionContext.Provider>
  );
};