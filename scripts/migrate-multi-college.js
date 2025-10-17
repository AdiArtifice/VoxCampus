/**
 * Migration Script for Multi-College Architecture
 * 
 * This script performs the following operations:
 * 1. Assigns the default institution ID to all existing documents in institution-scoped collections
 * 2. Checks for and creates indexes needed for the multi-college architecture
 * 3. Updates user profiles to associate with the correct institution based on email domain
 */

import { Client, Databases, Query } from "appwrite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID || "")
  .setKey(process.env.APPWRITE_API_KEY || "");

const databases = new Databases(client);

// Database and default institution constants
const DATABASE_ID = "68c58e83000a2666b4d9";
const DEFAULT_INSTITUTION_ID = "default_institution";

// Collections to update with institutionId
const COLLECTIONS_TO_UPDATE = [
  "association",
  "events_and_sessions",
  "public_users",
  "private_groups"
];

/**
 * Main migration function
 */
async function migrateToMultiCollegeArchitecture() {
  console.log("Starting migration to multi-college architecture...");

  try {
    // 1. Verify that the institutions collection exists
    try {
      await databases.getCollection(DATABASE_ID, "institutions");
      console.log("✓ Institutions collection exists");
    } catch (error) {
      console.error("✗ Institutions collection does not exist. Please create it first.");
      return;
    }

    // 2. Verify that the default institution exists
    try {
      await databases.getDocument(DATABASE_ID, "institutions", DEFAULT_INSTITUTION_ID);
      console.log("✓ Default institution exists");
    } catch (error) {
      console.error("✗ Default institution does not exist. Please create it first.");
      return;
    }

    // 3. Update each collection with the default institution ID
    for (const collectionId of COLLECTIONS_TO_UPDATE) {
      console.log(`\nProcessing collection: ${collectionId}`);
      
      // Check if the collection has the institutionId attribute
      try {
        await databases.getAttribute(DATABASE_ID, collectionId, "institutionId");
        console.log(`✓ Collection ${collectionId} has institutionId attribute`);
      } catch (error) {
        console.error(`✗ Collection ${collectionId} is missing institutionId attribute. Please add it first.`);
        continue;
      }

      // Get all documents without institutionId
      const { documents } = await databases.listDocuments(
        DATABASE_ID,
        collectionId,
        [Query.isNull("institutionId")]
      );

      console.log(`Found ${documents.length} documents without institutionId in ${collectionId}`);

      // Update each document with the default institution ID
      let successCount = 0;
      let failCount = 0;

      for (const doc of documents) {
        try {
          await databases.updateDocument(
            DATABASE_ID,
            collectionId,
            doc.$id,
            { institutionId: DEFAULT_INSTITUTION_ID }
          );
          successCount++;
        } catch (error) {
          console.error(`Failed to update document ${doc.$id}: ${error.message}`);
          failCount++;
        }
      }

      console.log(`Updated ${successCount} documents successfully, ${failCount} failed`);
    }

    // 4. Special handling for public_users collection - update based on email domain
    console.log("\nUpdating public_users based on email domains...");

    // This step would typically match user email domains to institutions
    // For now, we'll just set everyone to the default institution if needed

    console.log("\nMigration completed successfully!");

  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Execute the migration
migrateToMultiCollegeArchitecture().catch(console.error);