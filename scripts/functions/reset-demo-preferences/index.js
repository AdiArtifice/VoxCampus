// Appwrite function to reset demo user preferences
// This function is designed to run with user-session authentication
// It can be triggered from the frontend during demo logout
const { Client, Account } = require('node-appwrite');

// Constants
const DEMO_USER_EMAIL = 'test@sjcem.edu.in'; // Demo user email
const MAX_RETRY_ATTEMPTS = 3; // Maximum number of retry attempts

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

// Main function
module.exports = async function(req, res) {
  // This function uses a JWT token from the client to access the account API
  // The token is passed in the request headers
  // This allows us to reset preferences that aren't accessible with just API keys
  
  console.log('Starting demo user preferences reset function');
  
  try {
    // Parse function parameters
    const params = req.body || {};
    const jwt = req.headers?.['x-appwrite-jwt'];
    
    if (!jwt) {
      throw new Error('No JWT token provided - authorization required');
    }
    
    // Initialize client with JWT from the request headers
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setJWT(jwt);
    
    const account = new Account(client);
    
    // Verify we can access the account
    console.log('Verifying account access');
    const user = await withRetry(() => account.get());
    
    // Make sure this is the demo account
    if (user.email !== DEMO_USER_EMAIL) {
      console.log(`User ${user.email} is not the demo account - skipping preferences reset`);
      return res.json({
        success: false,
        message: 'Not a demo user account',
        email: user.email
      });
    }
    
    console.log(`Confirmed demo user (${user.email}) - resetting preferences`);
    
    // Reset preferences to defaults with retry mechanism
    await withRetry(async () => {
      await account.updatePrefs({
        // Reset followed associations to empty array
        followedAssociations: [],
        // Reset theme to default
        theme: 'light',
        // Reset notification preferences
        notifications: {
          enabled: true
        },
        // Reset profile preferences
        profile: {
          bio: "This is a demo account exploring VoxCampus.",
          interests: [],
          education: [],
          projects: [],
          socialLinks: {}
        }
      });
    });
    
    console.log('Demo user preferences successfully reset');
    
    return res.json({
      success: true,
      message: 'Demo user preferences successfully reset'
    });
  } catch (error) {
    console.error('Error resetting demo user preferences:', error);
    
    return res.json({
      success: false,
      error: error.message || 'Unknown error occurred during preference reset',
      stack: process.env.APPWRITE_FUNCTION_ENV === 'development' ? error.stack : undefined,
      code: error.code
    }, 500);
  }
};