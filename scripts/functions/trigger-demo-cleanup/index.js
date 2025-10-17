// Appwrite function to trigger demo cleanup for a specific user
// This function is designed to be called from the frontend when a demo user logs out
const { Client, Functions } = require('node-appwrite');

// Constants
const DEMO_USER_EMAIL = 'test@sjcem.edu.in'; // Demo user email
const CLEANUP_FUNCTION_ID = 'cleanup-demo-sessions'; // ID of your cleanup function

/**
 * Sleep function to introduce delay between operations
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main function
module.exports = async function(req, res) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const functions = new Functions(client);
  
  console.log('Starting demo cleanup trigger function');
  
  try {
    // Parse function parameters
    const params = req.body || {};
    const userId = params.userId;
    const email = params.email || DEMO_USER_EMAIL;
    
    if (!userId) {
      throw new Error('Missing required parameter: userId');
    }
    
    console.log(`Triggering cleanup for demo user: ${email} (${userId})`);
    
    // Execute the cleanup function with the specific user details
    const execution = await functions.createExecution(
      CLEANUP_FUNCTION_ID,
      JSON.stringify({
        userId: userId,
        email: email,
        skipOldRecords: true, // Skip old records cleanup for faster response
        forceReset: true, // Force immediate reset
      }),
      false, // Sync execution
      '/', // Default path
      'POST' // Method
    );
    
    console.log(`Cleanup function execution completed with status: ${execution.status}`);
    
    // Check if the execution was successful
    if (execution.status !== 'completed') {
      throw new Error(`Cleanup function execution failed with status: ${execution.status}`);
    }
    
    return res.json({
      success: true,
      executionId: execution.$id,
      message: 'Demo user cleanup successfully triggered'
    });
  } catch (error) {
    console.error('Error triggering demo cleanup:', error);
    
    return res.json({
      success: false,
      error: error.message || 'Unknown error occurred while triggering cleanup',
      stack: process.env.APPWRITE_FUNCTION_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
};