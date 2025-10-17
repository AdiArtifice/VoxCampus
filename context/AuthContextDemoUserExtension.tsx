// Example code to integrate the test user functionality into AuthContext.tsx

// 1. Import the demo user utilities
import { isTestUser, getTestUserAccessibleInstitutions } from '@/utils/demoUser';

// 2. Modify the fetchMemberships function in AuthContext.tsx
const fetchMemberships = async (userEmail: string, userId: string) => {
  try {
    setLoading(true);
    
    // For the test user, handle special access
    if (await isTestUser(userEmail)) {
      console.log('Test user detected - granting cross-institution access');
      
      // Get all available institutions for the test user
      const institutionIds = await getTestUserAccessibleInstitutions();
      
      // Fetch all memberships, potentially across all institutions
      let allMemberships = [];
      
      for (const institutionId of institutionIds) {
        // Fetch memberships for this institution
        const { documents } = await databases.listDocuments(
          DATABASE_ID,
          'membership',
          [Query.equal('userId', userId), Query.equal('institutionId', institutionId)]
        );
        
        allMemberships = [...allMemberships, ...documents];
      }
      
      setUserMemberships(allMemberships);
      
      // Log this special access
      await logTestUserAccess(userEmail, 'fetch', 'memberships_all_institutions');
      
      return;
    }
    
    // Normal user logic continues here
    // ...existing code...
  } catch (error) {
    console.error('Error fetching memberships:', error);
  } finally {
    setLoading(false);
  }
};

// 3. Modify the refresh function to consider the test user
const refresh = async () => {
  try {
    setLoading(true);
    const currentUser = await account.get();
    setUser(currentUser);
    
    // Special handling for test user
    if (await isTestUser(currentUser.email)) {
      // For test user, set default institution or get from preferences
      // This would be your default institution logic
      const defaultInstitutionId = 'default_institution';
      setCurrentInstitutionId(defaultInstitutionId);
      
      // Fetch all memberships across institutions for this test user
      await fetchMemberships(currentUser.email, currentUser.$id);
    } else {
      // Normal user logic
      // Get institution from email domain
      const institutionId = await getInstitutionIdFromEmail(currentUser.email);
      setCurrentInstitutionId(institutionId);
      
      // Fetch memberships for this user in their institution
      await fetchMemberships(currentUser.email, currentUser.$id);
    }
  } catch (error) {
    console.error('Error refreshing user data:', error);
    setUser(null);
  } finally {
    setLoading(false);
    setInitializing(false);
  }
};