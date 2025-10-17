// Appwrite function to clean up old demo session data and reset demo user changes
const { Client, Databases, Query, Account } = require('node-appwrite');

// Constants
const DEMO_USER_EMAIL = 'test@sjcem.edu.in'; // Demo user email
const MAX_RETRY_ATTEMPTS = 3; // Maximum number of retry attempts
const BATCH_SIZE = 25; // Process in smaller batches to avoid rate limits

/**
 * Sleep function to introduce delay between operations
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxAttempts - Maximum number of attempts
 */
async function withRetry(fn, maxAttempts = MAX_RETRY_ATTEMPTS) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
      
      // Check if we've hit rate limits
      const isRateLimit = error.code === 429 || 
                          (error.message && error.message.toLowerCase().includes('rate limit'));
      
      // Don't retry if this is the last attempt
      if (attempt === maxAttempts) break;
      
      // Wait longer if rate limited (exponential backoff with jitter)
      const baseDelay = isRateLimit ? 2000 : 1000;
      const delay = baseDelay * Math.pow(1.5, attempt - 1) * (0.9 + Math.random() * 0.2);
      console.log(`Retrying after ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Process documents in batches with rate limit awareness
 * @param {Array} documents - Documents to process
 * @param {Function} processFn - Function to process each document
 */
async function processBatches(documents, processFn) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  // Process in smaller batches to avoid rate limits
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(documents.length/BATCH_SIZE)} (${batch.length} items)`);
    
    // Process each document in the batch sequentially to avoid rate limits
    for (const doc of batch) {
      try {
        await withRetry(() => processFn(doc));
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          id: doc.$id,
          error: error.message || 'Unknown error'
        });
        console.error(`Failed to process document ${doc.$id}: ${error.message}`);
      }
      
      // Small delay between individual operations to avoid rate limits
      await sleep(300);
    }
    
    // Add delay between batches
    if (i + BATCH_SIZE < documents.length) {
      await sleep(1500);
    }
  }
  
  return results;
}

// Main function
module.exports = async function(req, res) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DATABASE_ID = '68c58e83000a2666b4d9'; // The database ID for the app
  
  console.log('Starting demo session cleanup and reset function');
  console.log(`Environment: ${process.env.APPWRITE_FUNCTION_ENV || 'unknown'}`);
  console.log(`Function ID: ${process.env.APPWRITE_FUNCTION_ID || 'unknown'}`);
  
  try {
    // Parse function parameters
    const params = req.body || {};
    const specificUserId = params.userId || null; // For targeting a specific user
    const specificEmail = params.email || DEMO_USER_EMAIL; // Default to demo email
    const skipOldRecords = params.skipOldRecords === true; // Option to skip old records cleanup
    const forceReset = params.forceReset === true; // Force reset regardless of time
    
    console.log(`Function parameters: ${JSON.stringify({
      specificUserId,
      specificEmail,
      skipOldRecords,
      forceReset
    })}`);
    
    const results = {
      tracking: { deleted: 0, failed: 0 },
      documents: { deleted: 0, failed: 0 },
      preferences: { reset: false }
    };
    
    // PART 1: Clean up old tracking records (if not skipped)
    if (!skipOldRecords) {
      // Calculate the date cutoff for old demo sessions (7 days ago)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      const cutoffTimestamp = cutoffDate.toISOString();
      
      console.log(`Cleaning up demo sessions older than ${cutoffTimestamp}`);
      
      // First, get the list of old records to clean
      const oldRecordsQuery = [Query.lessThan('timestamp', cutoffTimestamp)];
      
      if (specificEmail) {
        oldRecordsQuery.push(Query.equal('userEmail', specificEmail));
      }
      
      const records = await withRetry(() => 
        databases.listDocuments(
          DATABASE_ID,
          'demo_session_tracking',
          oldRecordsQuery
        )
      );
      
      const totalOldRecords = records.total;
      console.log(`Found ${totalOldRecords} old demo session records to clean up`);
      
      // If there are records to delete, process them in batches
      if (totalOldRecords > 0) {
        const oldRecordsResult = await processBatches(
          records.documents, 
          doc => databases.deleteDocument(DATABASE_ID, 'demo_session_tracking', doc.$id)
        );
        
        results.tracking.deleted += oldRecordsResult.success;
        results.tracking.failed += oldRecordsResult.failed;
        
        console.log(`Old tracking records cleanup results: ${JSON.stringify(oldRecordsResult)}`);
      }
    }
    
    // PART 2: Handle active demo user session reset if requested
    // This is useful for immediate cleanup when a demo user logs out
    if (forceReset || specificUserId) {
      console.log(`Performing immediate reset for ${specificEmail || 'demo user'}`);
      
      // Get all active tracking records for this user
      const activeRecordsQuery = [];
      
      if (specificEmail) {
        activeRecordsQuery.push(Query.equal('userEmail', specificEmail));
      }
      
      if (specificUserId) {
        // If we have a specific user ID, we can use it for more precise querying
        activeRecordsQuery.push(Query.equal('userId', specificUserId));
      }
      
      // First, get all tracked changes
      const activeRecords = await withRetry(() => 
        databases.listDocuments(
          DATABASE_ID,
          'demo_session_tracking',
          activeRecordsQuery
        )
      );
      
      console.log(`Found ${activeRecords.total} active tracked changes to reset`);
      
      // Process each tracked change based on its type
      if (activeRecords.total > 0) {
        // Group documents by type for more efficient processing
        const documentsByType = {};
        
        // Organize documents by change type
        activeRecords.documents.forEach(doc => {
          const changeType = doc.changeType || 'unknown';
          if (!documentsByType[changeType]) {
            documentsByType[changeType] = [];
          }
          documentsByType[changeType].push(doc);
        });
        
        console.log(`Grouped changes by type: ${Object.keys(documentsByType).join(', ')}`);
        
        // Handle each type of change
        for (const [changeType, docs] of Object.entries(documentsByType)) {
          console.log(`Processing ${docs.length} changes of type: ${changeType}`);
          
          // Different processing based on change type
          if (['document', 'post', 'comment', 'like'].includes(changeType)) {
            const docsResult = await processBatches(docs, async (doc) => {
              if (doc.databaseId && doc.collectionId && doc.documentId) {
                await databases.deleteDocument(doc.databaseId, doc.collectionId, doc.documentId);
              }
              // Also delete the tracking record itself
              await databases.deleteDocument(DATABASE_ID, 'demo_session_tracking', doc.$id);
            });
            
            results.documents.deleted += docsResult.success;
            results.documents.failed += docsResult.failed;
          } 
          else if (['file', 'upload'].includes(changeType)) {
            // File handling would be here if needed
            // We'll just delete tracking for now
            const filesResult = await processBatches(docs, async (doc) => {
              // Delete the tracking record itself
              await databases.deleteDocument(DATABASE_ID, 'demo_session_tracking', doc.$id);
            });
          }
          else if (['preference', 'setting'].includes(changeType)) {
            // For preferences, we'd need an Account instance with the user's session
            // We can't do that here since we only have the API key
            // Just delete the tracking records
            const prefsResult = await processBatches(docs, async (doc) => {
              // Delete the tracking record itself
              await databases.deleteDocument(DATABASE_ID, 'demo_session_tracking', doc.$id);
            });
          }
          else {
            // For any other type, just delete the tracking record
            const otherResult = await processBatches(docs, async (doc) => {
              // Delete the tracking record itself
              await databases.deleteDocument(DATABASE_ID, 'demo_session_tracking', doc.$id);
            });
          }
        }
      }
    }
    
    return res.json({
      success: true,
      results,
      message: `Demo cleanup completed. Deleted ${results.tracking.deleted} tracking records and ${results.documents.deleted} user documents.`
    });
  } catch (error) {
    console.error('Error in demo session cleanup function:', error);
    
    return res.json({
      success: false,
      error: error.message || 'Unknown error occurred during cleanup',
      stack: process.env.APPWRITE_FUNCTION_ENV === 'development' ? error.stack : undefined,
      code: error.code
    }, 500);
  }
};