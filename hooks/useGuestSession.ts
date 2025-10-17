import { useContext } from 'react';
import { GuestSessionContext } from '../context/GuestSessionContext';

/**
 * Hook to access the guest session context
 * @returns GuestSessionContextType containing guest session state and methods
 */
export function useGuestSession() {
  const context = useContext(GuestSessionContext);
  
  if (context === undefined) {
    throw new Error('useGuestSession must be used within a GuestSessionProvider');
  }
  
  return context;
}