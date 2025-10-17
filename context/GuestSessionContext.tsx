import React, { createContext, useState, useEffect, useCallback } from 'react';
import { startGuestSession, checkGuestSession, endGuestSession } from '../utils/guestSession';
import { ensureDefaultInstitution } from '../utils/institutionFilter';
import { Alert } from 'react-native';

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

  // Function to start a new guest session
  const startNewGuestSession = async () => {
    try {
      const expiryTime = await startGuestSession();
      setIsGuestSession(true);
      setGuestSessionActive(true);
      setGuestSessionExpiryTime(expiryTime);
      
      // Ensure default institution exists and set it as current
      const defaultInstitutionId = await ensureDefaultInstitution();
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
    try {
      const { isValid, remainingTime, expiryTime } = await checkGuestSession();
      setGuestSessionActive(isValid);
      setGuestSessionRemainingTime(remainingTime);
      setGuestSessionExpiryTime(expiryTime);
      
      if (isValid) {
        setIsGuestSession(true);
        
        // Ensure default institution exists and set it as current
        const defaultInstitutionId = await ensureDefaultInstitution();
        setInstitutionId(defaultInstitutionId);
      }
    } catch (error) {
      console.error('Error checking guest session:', error);
    }
  };

  // Check guest session on initial load
  useEffect(() => {
    checkCurrentGuestSession();
    
    // Set up interval to check session status
    const intervalId = setInterval(checkCurrentGuestSession, UPDATE_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, []);

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