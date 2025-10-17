// Test script to verify demo mode functionality
const { Client, Account, Databases, ID } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Config
const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '68acb6eb0002c8837570';
const databaseId = '68c58e83000a2666b4d9';
const demoEmail = 'test@sjcem.edu.in';
const demoPassword = 'DemoUser2025!@#';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

const account = new Account(client);
const databases = new Databases(client);

async function testDemoMode() {
    console.log('\n=== DEMO MODE TEST ===\n');
    
    try {
        // Step 1: Login with demo account
        console.log('1. Logging in with demo account...');
        const session = await account.createEmailPasswordSession(demoEmail, demoPassword);
        console.log('   ✓ Login successful!');
        console.log(`   User ID: ${session.userId}`);
        
        // Step 2: Get user details
        const user = await account.get();
        console.log('2. Got user details:');
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Email Verified: ${user.emailVerification ? 'Yes' : 'No'}`);
        
        // Step 3: Create a test document
        console.log('\n3. Creating test document...');
        const documentId = ID.unique();
        const testDoc = await databases.createDocument(
            databaseId,
            'test_documents',
            documentId,
            {
                title: 'Demo Mode Test Document',
                content: 'This document was created during demo mode testing',
                createdBy: user.$id,
                userEmail: user.email,
                timestamp: new Date().toISOString()
            }
        );
        console.log(`   ✓ Document created with ID: ${testDoc.$id}`);
        
        // Step 4: Check if document was tracked in demo_session_tracking
        console.log('\n4. Checking if document creation was tracked...');
        const trackingDocs = await databases.listDocuments(
            databaseId,
            'demo_session_tracking',
            [
                // Add query to filter by documentId
            ]
        );
        
        if (trackingDocs.total > 0) {
            console.log('   ✓ Document change tracked successfully!');
        } else {
            console.log('   ✗ Document change not tracked in demo_session_tracking');
        }
        
        // Step 5: Logout
        console.log('\n5. Logging out...');
        await account.deleteSession('current');
        console.log('   ✓ Logged out successfully!');
        
        // Step 6: Login again to check if changes were reset
        console.log('\n6. Logging in again to check if changes were reset...');
        await account.createEmailPasswordSession(demoEmail, demoPassword);
        
        // Check if the document still exists
        console.log('\n7. Checking if test document was deleted...');
        try {
            await databases.getDocument(databaseId, 'test_documents', documentId);
            console.log('   ✗ Document still exists - reset failed!');
        } catch (error) {
            if (error.code === 404) {
                console.log('   ✓ Document was successfully deleted on logout!');
            } else {
                throw error;
            }
        }
        
        // Final logout
        await account.deleteSession('current');
        console.log('\n=== TEST COMPLETED SUCCESSFULLY ===\n');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
    }
}

// Run the test
testDemoMode();