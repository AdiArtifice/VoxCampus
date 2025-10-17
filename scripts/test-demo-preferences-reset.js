/**
 * Test Demo Preferences Reset
 * 
 * This script tests that the demo user preferences are properly reset
 * and that followed associations are properly tracked and reset.
 * 
 * Run this after implementing the fix to verify it works correctly.
 */
const { ID, Client, Databases, Account, Query } = require('node-appwrite');
const config = require('../lib/config.ts');
const { APPWRITE } = config;

const DEMO_USER_EMAIL = 'demo@voxcampus.edu';
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'demoPass123!';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(APPWRITE.ENDPOINT)
  .setProject(APPWRITE.PROJECT_ID);

const databases = new Databases(client);
const account = new Account(client);

/**
 * Main test function
 */
async function runTest() {
  try {
    console.log('\n==== DEMO USER PREFERENCES RESET TEST ====\n');
    
    // Step 1: Login as the demo user
    console.log('Step 1: Login as demo user');
    await account.createEmailPasswordSession(DEMO_USER_EMAIL, DEMO_USER_PASSWORD);
    console.log('- Logged in successfully');

    // Step 2: Get initial user preferences
    console.log('\nStep 2: Get initial preferences');
    const initialPrefs = await account.getPrefs();
    console.log('- Initial followed associations:', initialPrefs.followedAssociations || []);
    
    // Save these to verify reset later
    const initialFollowedAssociations = initialPrefs.followedAssociations || [];
    
    // Step 3: Modify user preferences - add some followed associations
    console.log('\nStep 3: Modify preferences - adding followed associations');
    const testFollowedIds = ['test-association-1', 'test-association-2', ...initialFollowedAssociations];
    await account.updatePrefs({
      ...initialPrefs,
      followedAssociations: testFollowedIds,
      testPreference: 'This should be reset'
    });
    
    // Verify the change was made
    const modifiedPrefs = await account.getPrefs();
    console.log('- Modified followed associations:', modifiedPrefs.followedAssociations || []);
    console.log('- Added test preference:', modifiedPrefs.testPreference);
    
    // Step 4: Logout - this should reset all preferences
    console.log('\nStep 4: Logging out (should trigger reset)');
    await account.deleteSession('current');
    console.log('- Logged out successfully');
    
    // Step 5: Login again - verify preferences are reset
    console.log('\nStep 5: Login again to verify reset');
    await account.createEmailPasswordSession(DEMO_USER_EMAIL, DEMO_USER_PASSWORD);
    console.log('- Logged in successfully');
    
    const finalPrefs = await account.getPrefs();
    console.log('\nFinal preferences after reset and re-login:');
    console.log('- Followed associations:', finalPrefs.followedAssociations || []);
    console.log('- Test preference exists?', finalPrefs.testPreference ? 'Yes' : 'No');
    
    // Step 6: Check if the preferences were properly reset and defaults applied
    console.log('\nStep 6: Checking test results');
    
    // Check that our test preference was removed
    const testPrefReset = !finalPrefs.testPreference;
    console.log('- Test preference was reset:', testPrefReset ? '✅ PASS' : '❌ FAIL');
    
    // Check that we have at least one default association
    const hasDefaultAssociations = Array.isArray(finalPrefs.followedAssociations) && 
                                 finalPrefs.followedAssociations.length > 0;
    console.log('- Has default associations:', hasDefaultAssociations ? '✅ PASS' : '❌ FAIL');
    
    // Check that our test associations are not still there
    const testAssociationsRemoved = !finalPrefs.followedAssociations?.includes('test-association-1');
    console.log('- Test associations were removed:', testAssociationsRemoved ? '✅ PASS' : '❌ FAIL');
    
    // Cleanup - logout again
    console.log('\nCleaning up - logging out');
    await account.deleteSession('current');
    
    // Print final result
    console.log('\n==== TEST RESULTS ====');
    if (testPrefReset && hasDefaultAssociations && testAssociationsRemoved) {
      console.log('✅ ALL TESTS PASSED - Demo user preferences are properly reset');
    } else {
      console.log('❌ SOME TESTS FAILED - See details above');
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
  }
}

// Run the test
runTest();