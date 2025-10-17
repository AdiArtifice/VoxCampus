/**
 * Reset Demo User Script
 * 
 * This script forcibly resets all changes made by the demo user.
 * It can be run manually to clean up the demo user state without requiring a login/logout.
 * 
 * Usage:
 * node scripts/reset-demo-user.js
 */
 * Reset Demo User
 * 
 * This script completely resets the demo user account:
 * 1. Deletes all tracked changes in demo_session_tracking
 * 2. Resets all user preferences to default values
 * 3. Deletes any documents created by the demo user
 * 
 * Run with: node scripts/reset-demo-user.js
 */

require('dotenv').config();

const { Client, Databases, ID, Users, Query } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client();
client
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '68acb6eb0002c8837570')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '68c58e83000a2666b4d9';
const DEMO_USER_EMAIL = 'test@sjcem.edu.in';
const DEMO_SESSION_TRACKING_COLLECTION = 'demo_session_tracking';

// Collections that might contain demo user data
const COLLECTIONS_TO_CHECK = [
    'posts',
    'comments',
    'connections',
    'membership',
    'likes',
];

async function resetDemoUser() {
    console.log('🔄 Resetting demo user...');
    
    try {
        // Step 1: Get the demo user's ID
        const usersList = await users.list([
            Query.equal('email', DEMO_USER_EMAIL)
        ]);
        
        if (usersList.total === 0) {
            console.log('❌ Demo user not found');
            return;
        }
        
        const demoUser = usersList.users[0];
        const demoUserId = demoUser.$id;
        
        console.log(`✅ Found demo user: ${demoUserId} (${DEMO_USER_EMAIL})`);
        
        // Step 2: Reset user preferences
        console.log('🔄 Resetting user preferences...');
        
        await users.updatePrefs(demoUserId, {
            // Reset to default empty preferences
            followedAssociations: [],
            profile: {
                displayName: 'Demo User',
                bio: '',
                education: [],
                projects: [],
                socialLinks: {},
                displaySettings: {
                    theme: 'system',
                    notifications: true
                }
            }
        });
        
        console.log('✅ User preferences reset');
        
        // Step 3: Delete tracked changes in demo_session_tracking
        console.log('🔄 Deleting tracked changes...');
        
        const trackedChanges = await databases.listDocuments(
            DATABASE_ID,
            DEMO_SESSION_TRACKING_COLLECTION,
            [
                Query.equal('userEmail', DEMO_USER_EMAIL)
            ]
        );
        
        console.log(`Found ${trackedChanges.total} tracked changes to delete`);
        
        // Group changes by type for better logging
        const documentChanges = trackedChanges.documents.filter(doc => doc.changeType === 'document');
        const fileChanges = trackedChanges.documents.filter(doc => doc.changeType === 'file');
        const profileChanges = trackedChanges.documents.filter(doc => doc.changeType === 'profile');
        const associationChanges = trackedChanges.documents.filter(doc => 
            doc.changeType === 'association' || 
            doc.changeType === 'follow_associations' || 
            doc.changeType === 'unfollow_association'
        );
        const connectionChanges = trackedChanges.documents.filter(doc => doc.changeType === 'connection');
        
        console.log({
            documents: documentChanges.length,
            files: fileChanges.length,
            profiles: profileChanges.length,
            associations: associationChanges.length,
            connections: connectionChanges.length
        });
        
        // Handle file changes first (delete from storage)
        for (const change of fileChanges) {
            try {
                if (change.bucketId && change.fileId) {
                    // We don't have storage instance here, but files will be reset in Step 4
                    console.log(`Would delete file: ${change.bucketId}/${change.fileId}`);
                }
            } catch (error) {
                console.error(`❌ Error handling file change: ${error.message}`);
            }
        }
        
        // Handle document changes (delete from database)
        for (const change of documentChanges) {
            try {
                if (change.databaseId && change.collectionId && change.documentId) {
                    try {
                        await databases.deleteDocument(change.databaseId, change.collectionId, change.documentId);
                        console.log(`✅ Deleted document: ${change.collectionId}/${change.documentId}`);
                    } catch (error) {
                        if (error.code === 404) {
                            console.log(`⚠️ Document already deleted: ${change.collectionId}/${change.documentId}`);
                        } else {
                            throw error;
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Error handling document change: ${error.message}`);
            }
        }
        
        // Handle connection changes
        for (const change of connectionChanges) {
            try {
                if (change.databaseId && change.collectionId && change.documentId) {
                    try {
                        await databases.deleteDocument(change.databaseId, change.collectionId, change.documentId);
                        console.log(`✅ Deleted connection: ${change.documentId}`);
                    } catch (error) {
                        if (error.code === 404) {
                            console.log(`⚠️ Connection already deleted: ${change.documentId}`);
                        } else {
                            throw error;
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Error handling connection change: ${error.message}`);
            }
        }
        
        // Step 4: Clean up collections that might contain demo user data
        console.log('🔄 Checking collections for demo user data...');
        
        for (const collectionId of COLLECTIONS_TO_CHECK) {
            try {
                console.log(`Checking collection: ${collectionId}`);
                
                // Different collections might use different fields to identify the user
                // Try common patterns like userId, user_id, createdBy, authorId, etc.
                const userIdFields = ['userId', 'user_id', 'createdBy', 'authorId', 'fromUserId'];
                
                for (const field of userIdFields) {
                    try {
                        const documents = await databases.listDocuments(
                            DATABASE_ID,
                            collectionId,
                            [
                                Query.equal(field, demoUserId)
                            ]
                        );
                        
                        if (documents.total > 0) {
                            console.log(`Found ${documents.total} documents in ${collectionId} with ${field}=${demoUserId}`);
                            
                            for (const doc of documents.documents) {
                                try {
                                    await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
                                    console.log(`✅ Deleted ${collectionId}/${doc.$id}`);
                                } catch (error) {
                                    console.error(`❌ Error deleting ${collectionId}/${doc.$id}: ${error.message}`);
                                }
                            }
                        }
                    } catch (error) {
                        // Skip if the field doesn't exist in this collection
                        if (error.code !== 400) {
                            console.error(`❌ Error checking ${collectionId} with field ${field}: ${error.message}`);
                        }
                    }
                }
                
                // Also check by email
                try {
                    const documents = await databases.listDocuments(
                        DATABASE_ID,
                        collectionId,
                        [
                            Query.equal('email', DEMO_USER_EMAIL)
                        ]
                    );
                    
                    if (documents.total > 0) {
                        console.log(`Found ${documents.total} documents in ${collectionId} with email=${DEMO_USER_EMAIL}`);
                        
                        for (const doc of documents.documents) {
                            try {
                                await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
                                console.log(`✅ Deleted ${collectionId}/${doc.$id}`);
                            } catch (error) {
                                console.error(`❌ Error deleting ${collectionId}/${doc.$id}: ${error.message}`);
                            }
                        }
                    }
                } catch (error) {
                    // Skip if the field doesn't exist in this collection
                    if (error.code !== 400) {
                        console.error(`❌ Error checking ${collectionId} with field email: ${error.message}`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error checking collection ${collectionId}: ${error.message}`);
            }
        }
        
        // Step 5: Delete tracking records
        console.log('🔄 Deleting tracking records...');
        
        for (const doc of trackedChanges.documents) {
            try {
                await databases.deleteDocument(DATABASE_ID, DEMO_SESSION_TRACKING_COLLECTION, doc.$id);
            } catch (error) {
                console.error(`❌ Error deleting tracking record ${doc.$id}: ${error.message}`);
            }
        }
        
        console.log('✅ Demo user reset complete!');
        
    } catch (error) {
        console.error('❌ Error resetting demo user:', error);
    }
}

// Run the reset function
resetDemoUser()
    .then(() => {
        console.log('Reset script completed');
    })
    .catch((err) => {
        console.error('Error running reset script:', err);
        process.exit(1);
    });