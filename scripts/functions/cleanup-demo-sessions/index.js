// Appwrite function to clean up old demo session data
const { Client, Databases, Query } = require('node-appwrite');

// Initialize Appwrite client
module.exports = async function(req, res) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DATABASE_ID = '68c58e83000a2666b4d9'; // The database ID for the app
  
  try {
    // Calculate the date cutoff for old demo sessions (7 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffTimestamp = cutoffDate.toISOString();
    
    console.log(`Cleaning up demo sessions older than ${cutoffTimestamp}`);
    
    // First, get the list of old records to clean
    const records = await databases.listDocuments(
      DATABASE_ID,
      'demo_session_tracking',
      [
        Query.lessThan('timestamp', cutoffTimestamp),
      ]
    );
    
    const totalRecords = records.total;
    console.log(`Found ${totalRecords} old demo session records to clean up`);
    
    // If there are records to delete, process them in batches
    if (totalRecords > 0) {
      const deletePromises = records.documents.map(doc => 
        databases.deleteDocument(DATABASE_ID, 'demo_session_tracking', doc.$id)
      );
      
      await Promise.all(deletePromises);
      
      console.log(`Successfully deleted ${records.documents.length} old demo session records`);
    }
    
    return res.json({
      success: true,
      deletedCount: totalRecords,
      message: `Successfully cleaned up ${totalRecords} demo session records older than ${cutoffTimestamp}`
    });
  } catch (error) {
    console.error('Error cleaning up demo sessions:', error);
    
    return res.json({
      success: false,
      error: error.message || 'Unknown error occurred during cleanup',
      stack: process.env.APPWRITE_FUNCTION_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
};