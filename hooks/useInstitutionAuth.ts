import React from 'react';
import { AuthContext } from '@/context/AuthContext';
import { GuestSession } from '@/utils/guestSession';
import { InstitutionFilter } from '@/utils/institutionFilter';
import { getInstitutionIdFromEmail } from '@/lib/institutions';

/**
 * Hook that provides institution-aware authentication
 * Enhances the regular useAuth hook with institution filtering and guest session handling
 */
export function useInstitutionAuth() {
  const auth = React.useContext(AuthContext);
  
  if (!auth) {
    throw new Error('useInstitutionAuth must be used within an AuthProvider');
  }
  
  const [isGuestUser, setIsGuestUser] = React.useState<boolean>(false);
  const [institutionId, setInstitutionId] = React.useState<string | null>(null);
  
  // Initialize on mount
  React.useEffect(() => {
    const initialize = async () => {
      try {
        // If user is logged in, try to get their institution
        if (auth.user) {
          // Here you would fetch the user's institution from your user profile or other source
          // This is placeholder logic - replace with your actual implementation
          // Find the user's institution ID from their email domain if available
          const userEmail = auth.user?.email;
          const userInstitutionId = userEmail 
            ? await getInstitutionIdFromEmail(userEmail)
            : GuestSession.getDefaultInstitutionId();
          setInstitutionId(userInstitutionId);
          setIsGuestUser(false);
        } else {
          // If not logged in, use default institution and mark as guest
          setInstitutionId(GuestSession.getDefaultInstitutionId());
          setIsGuestUser(true);
          
          // Start guest session timer if not already started
          await GuestSession.startSession();
        }
      } catch (error) {
        console.error("Error initializing institution auth:", error);
        // Fallback to default institution
        setInstitutionId(GuestSession.getDefaultInstitutionId());
      }
    };
    
    initialize();
  }, [auth.user]);
  
  // Create query filter for current institution
  const createInstitutionFilter = React.useCallback(() => {
    return InstitutionFilter.createFilter({ 
      institutionId: institutionId || GuestSession.getDefaultInstitutionId(),
      isGuest: isGuestUser
    });
  }, [institutionId, isGuestUser]);
  
  // Apply institution filter to an array of queries
  const applyInstitutionFilter = React.useCallback((queries: string[] = []) => {
    return InstitutionFilter.applyToQueries(queries, {
      institutionId: institutionId || GuestSession.getDefaultInstitutionId(),
      isGuest: isGuestUser
    });
  }, [institutionId, isGuestUser]);
  
  // Check if guest session is valid
  const checkGuestSession = React.useCallback(async () => {
    if (!isGuestUser) return true;
    return await GuestSession.isSessionValid();
  }, [isGuestUser]);
  
  return {
    ...auth,
    isGuestUser,
    institutionId,
    createInstitutionFilter,
    applyInstitutionFilter,
    checkGuestSession
  };
}