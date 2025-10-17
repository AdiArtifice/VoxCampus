/**
 * Demo Mode Integration Test
 * 
 * This test file verifies that the demo mode properly resets all changes when a user logs out.
 * It tests various operations such as following associations, connecting with users, and uploading files.
 */

import { account, databases, storage, ID } from '@/lib/appwrite';
import { APPWRITE } from '@/lib/config';
import { resetDemoUserSession } from '@/utils/demoSessionTracker';

// Demo user credentials
const DEMO_EMAIL = 'test@sjcem.edu.in';
const DEMO_PASSWORD = 'DemoUser2025!@#';

// Test data
const TEST_ASSOCIATION = {
  name: 'Test Association',
  description: 'Created by automated test',
};

const TEST_CONNECTION = {
  toUserId: 'test_target_user_id', // Use a valid user ID in your system
  toName: 'Test User',
  toEmail: 'target@sjcem.edu.in',
  status: 'pending',
};

describe('Demo Mode Ephemeral Data Tests', () => {
  // Keep track of created resources to verify deletion
  const createdResources = {
    documents: [] as string[],
    files: [] as string[],
    preferences: {} as Record<string, any>,
  };
  
  beforeAll(async () => {
    // Log in as the demo user
    await account.createEmailPasswordSession(DEMO_EMAIL, DEMO_PASSWORD);
  });
  
  afterAll(async () => {
    // Clean up by logging out
    await account.deleteSession('current');
  });
  
  test('Following associations should be tracked and reset', async () => {
    // Initial state - save current preferences
    const initialPrefs = await account.getPrefs();
    
    // Follow some associations
    const followedIds = ['test_assoc_1', 'test_assoc_2'];
    await account.updatePrefs({ followedAssociations: followedIds });
    
    // Save current state
    createdResources.preferences = await account.getPrefs();
    
    // Verify that associations were followed
    expect((createdResources.preferences as any).followedAssociations).toEqual(followedIds);
    
    // Reset the session
    await resetDemoUserSession();
    
    // Verify that associations were reset
    const afterResetPrefs = await account.getPrefs();
    expect((afterResetPrefs as any).followedAssociations).toBeUndefined();
  });
  
  test('Creating connections should be tracked and reset', async () => {
    // Create a connection
    const databaseId = APPWRITE.DATABASE_ID;
    const connectionsCol = 'connections';
    
    const me = await account.get();
    const connection = await databases.createDocument(
      databaseId,
      connectionsCol,
      ID.unique(),
      {
        fromUserId: me.$id,
        fromName: me.name,
        fromEmail: me.email,
        toUserId: TEST_CONNECTION.toUserId,
        toName: TEST_CONNECTION.toName,
        toEmail: TEST_CONNECTION.toEmail,
        status: TEST_CONNECTION.status,
        requestedAt: new Date().toISOString(),
      }
    );
    
    // Save the document ID for verification
    createdResources.documents.push(connection.$id);
    
    // Verify the connection was created
    const fetchedConnection = await databases.getDocument(
      databaseId,
      connectionsCol,
      connection.$id
    );
    expect(fetchedConnection).toBeDefined();
    expect(fetchedConnection.fromUserId).toBe(me.$id);
    
    // Reset the session
    await resetDemoUserSession();
    
    // Verify the connection was deleted
    try {
      await databases.getDocument(
        databaseId,
        connectionsCol,
        connection.$id
      );
      // If we get here, the document wasn't deleted
      fail('Connection was not deleted after reset');
    } catch (error) {
      // Document should not exist - this is expected
      expect((error as any).code).toBe(404);
    }
  });
  
  test('Fresh login should show no persistent changes', async () => {
    // Log out and log back in
    await account.deleteSession('current');
    await account.createEmailPasswordSession(DEMO_EMAIL, DEMO_PASSWORD);
    
    // Check for associations
    const prefs = await account.getPrefs();
    expect((prefs as any).followedAssociations).toBeUndefined();
    
    // Check for connections
    const databaseId = APPWRITE.DATABASE_ID;
    const connections = await databases.listDocuments(
      databaseId,
      'connections',
      [
        // Use the right query format for your database
        `fromEmail=${DEMO_EMAIL}`
      ]
    );
    expect(connections.total).toBe(0);
  });
});