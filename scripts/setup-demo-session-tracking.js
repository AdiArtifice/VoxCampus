/**
 * Setup Demo Session Tracking
 * 
 * This script creates the necessary database collection and attributes
 * to track changes made by the demo user during a session.
 * 
 * Run with: node scripts/setup-demo-session-tracking.js
 */

require('dotenv').config();

const { Client, Databases, ID } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client();
client
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '68acb6eb0002c8837570')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '68c58e83000a2666b4d9';
const DEMO_SESSION_TRACKING_COLLECTION = 'demo_session_tracking';

async function setupDemoSessionTracking() {
    console.log('Setting up demo session tracking...');
    
    try {
        // Create the collection if it doesn't exist
        try {
            await databases.createCollection(
                DATABASE_ID,
                ID.unique(),
                DEMO_SESSION_TRACKING_COLLECTION,
                [
                    { 
                        type: 'read', // Allow demo user to read their own tracking records
                        role: 'user:test@sjcem.edu.in'
                    }
                ]
            );
            console.log('✅ Created demo session tracking collection');
        } catch (e) {
            if (e.code === 409) { // Collection already exists
                console.log('ℹ️ Demo session tracking collection already exists');
            } else {
                throw e;
            }
        }
        
        // Create required attributes
        const attributesToCreate = [
            { name: 'changeType', type: 'string', required: true, size: 20 },
            { name: 'databaseId', type: 'string', required: false, size: 36 },
            { name: 'collectionId', type: 'string', required: false, size: 36 },
            { name: 'documentId', type: 'string', required: false, size: 36 },
            { name: 'bucketId', type: 'string', required: false, size: 36 },
            { name: 'fileId', type: 'string', required: false, size: 36 },
            { name: 'userId', type: 'string', required: false, size: 36 },
            { name: 'userEmail', type: 'string', required: true, size: 128 },
            { name: 'timestamp', type: 'string', required: true, size: 30 },
        ];
        
        for (const attr of attributesToCreate) {
            try {
                await databases.createStringAttribute(
                    DATABASE_ID,
                    DEMO_SESSION_TRACKING_COLLECTION,
                    attr.name,
                    attr.size,
                    attr.required
                );
                console.log(`✅ Created attribute: ${attr.name}`);
            } catch (e) {
                if (e.code === 409) { // Attribute already exists
                    console.log(`ℹ️ Attribute already exists: ${attr.name}`);
                } else {
                    throw e;
                }
            }
        }
        
        // Create an index on userEmail for faster queries
        try {
            await databases.createIndex(
                DATABASE_ID,
                DEMO_SESSION_TRACKING_COLLECTION,
                'userEmail_index',
                'key',
                ['userEmail']
            );
            console.log('✅ Created index on userEmail');
        } catch (e) {
            if (e.code === 409) { // Index already exists
                console.log('ℹ️ Index on userEmail already exists');
            } else {
                throw e;
            }
        }
        
        console.log('✅ Demo session tracking setup complete');
        
    } catch (error) {
        console.error('❌ Error setting up demo session tracking:', error);
    }
}

// Run the setup function
setupDemoSessionTracking()
    .then(() => {
        console.log('Setup script completed');
    })
    .catch((err) => {
        console.error('Error running setup script:', err);
        process.exit(1);
    });