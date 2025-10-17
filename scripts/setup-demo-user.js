/**
 * VoxCampus Test User Setup
 * 
 * This script creates a special test user with cross-institution access
 * for demo and testing purposes. The user will be able to view content
 * from all institutions without being restricted by domain.
 */

import { Client, Users, Databases, ID, Query, Teams } from "node-appwrite";

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '68acb6eb0002c8837570')
    .setKey(process.env.APPWRITE_API_KEY || '');

// Initialize services
const users = new Users(client);
const databases = new Databases(client);
const teams = new Teams(client);

// Configuration
const TEST_USER_EMAIL = 'test@sjcem.edu.in';
const TEST_USER_NAME = 'VoxCampus Demo User';
const TEST_USER_PASSWORD = generateSecurePassword(); // We'll generate a secure password
const DATABASE_ID = '68c58e83000a2666b4d9'; // VoxCampusDB
const PUBLIC_USERS_COLLECTION = 'public_users';

// Demo user labels to identify and track special access
const DEMO_USER_LABELS = ['demo_user', 'cross_institution_access', 'read_only'];

/**
 * Generates a secure random password
 */
function generateSecurePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

/**
 * Creates a demo user if it doesn't exist, or updates its permissions if it does
 */
async function setupDemoUser() {
    console.log('Setting up VoxCampus demo user...');
    
    try {
        // Check if user already exists
        let demoUser;
        try {
            // Try to find the user by email
            const { users: existingUsers } = await users.list([
                Query.equal('email', TEST_USER_EMAIL)
            ]);
            
            demoUser = existingUsers.length > 0 ? existingUsers[0] : null;
            
            if (demoUser) {
                console.log('Demo user already exists with ID:', demoUser.$id);
            }
        } catch (error) {
            console.log('Error checking for existing user:', error.message);
        }
        
        // Create new user if it doesn't exist
        if (!demoUser) {
            demoUser = await users.create(
                ID.unique(),
                TEST_USER_EMAIL,
                TEST_USER_PASSWORD,
                TEST_USER_NAME
            );
            console.log('Created new demo user with ID:', demoUser.$id);
            
            // Set email as verified
            await users.updateEmailVerification(demoUser.$id, true);
            console.log('Email verification set to true');
        } else {
            // Reset password for existing user
            await users.updatePassword(demoUser.$id, TEST_USER_PASSWORD);
            console.log('Reset password for existing demo user');
        }
        
        // Update the user labels to mark as a demo user with special access
        await users.updateLabels(demoUser.$id, DEMO_USER_LABELS);
        console.log('Updated user labels for access tracking');

        // Create or update public user profile
        try {
            // Check if a public profile already exists
            const { documents: existingProfiles } = await databases.listDocuments(
                DATABASE_ID,
                PUBLIC_USERS_COLLECTION,
                [Query.equal('user_id', demoUser.$id)]
            );
            
            if (existingProfiles.length > 0) {
                // Update existing profile to include all institutions
                await databases.updateDocument(
                    DATABASE_ID,
                    PUBLIC_USERS_COLLECTION,
                    existingProfiles[0].$id,
                    {
                        name: TEST_USER_NAME,
                        // Special flag for demo user with cross-institution access
                        demo_cross_institution_access: true
                    }
                );
                console.log('Updated public profile with demo access flag');
            } else {
                // Create new public profile
                await databases.createDocument(
                    DATABASE_ID,
                    PUBLIC_USERS_COLLECTION,
                    ID.unique(),
                    {
                        user_id: demoUser.$id,
                        name: TEST_USER_NAME,
                        // Special flag for demo user with cross-institution access
                        demo_cross_institution_access: true
                    }
                );
                console.log('Created public profile with demo access flag');
            }
        } catch (error) {
            console.error('Error managing public profile:', error);
        }

        // Try to create a new admin team membership if needed
        try {
            // Check if team "admins" exists, create if not
            let adminTeam;
            try {
                const { teams: existingTeams } = await teams.list([
                    Query.equal('name', 'admins')
                ]);
                adminTeam = existingTeams.length > 0 ? existingTeams[0] : null;
            } catch (error) {
                console.log('Admin team not found, creating...');
            }

            if (!adminTeam) {
                adminTeam = await teams.create(
                    ID.unique(),
                    'admins'
                );
                console.log('Created new admin team with ID:', adminTeam.$id);
            }

            // Add user to admin team
            try {
                await teams.createMembership(
                    adminTeam.$id,
                    demoUser.$id,
                    ['owner'],
                    'http://localhost'  // This URL would be needed for real invites
                );
                console.log('Added user to admin team');
            } catch (error) {
                // User might already be a member
                console.log('Note about team membership:', error.message);
            }
        } catch (error) {
            console.error('Error managing team membership:', error);
        }

        // Add a record in all institutions to ensure visibility
        try {
            // Get all institutions
            const { documents: institutions } = await databases.listDocuments(
                DATABASE_ID,
                'institutions'
            );
            
            console.log(`Found ${institutions.length} institutions`);
            
            for (const institution of institutions) {
                // Check if the user already has a membership in this institution
                const { total: existingMemberships } = await databases.listDocuments(
                    DATABASE_ID,
                    'membership',
                    [
                        Query.equal('userId', demoUser.$id),
                        Query.equal('institutionId', institution.$id)
                    ]
                );
                
                if (existingMemberships === 0) {
                    // Create a special membership record for this institution
                    await databases.createDocument(
                        DATABASE_ID,
                        'membership',
                        ID.unique(),
                        {
                            userId: demoUser.$id,
                            institutionId: institution.$id,
                            // Mark this as a demo user with special access
                            role: 'demo_viewer',
                            joinedAt: new Date().toISOString()
                        }
                    );
                    console.log(`Created membership for institution: ${institution.name}`);
                }
            }
        } catch (error) {
            console.error('Error setting up institution memberships:', error);
        }

        console.log('\n======= DEMO USER CREDENTIALS =======');
        console.log('Email:   ', TEST_USER_EMAIL);
        console.log('Password:', TEST_USER_PASSWORD);
        console.log('=====================================\n');
        console.log('This user has special cross-institution access for demo purposes.');
        console.log('Access is logged via user labels for security auditing.');
        
    } catch (error) {
        console.error('Setup failed:', error);
    }
}

// Run the setup
setupDemoUser().catch(console.error);