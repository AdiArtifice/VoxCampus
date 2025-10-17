// GuestAccessValidator Function
// This function validates guest access tokens on the server side for enhanced security

const { Client, Databases, Query } = require('node-appwrite');

module.exports = async function(req, res) {
  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID;

  // Parse request payload
  let payload;
  try {
    payload = JSON.parse(req.payload || '{}');
  } catch (error) {
    return res.json({ 
      success: false, 
      error: 'Invalid payload format' 
    }, 400);
  }

  // Extract session token from payload
  const { sessionToken, guestKey } = payload;
  
  if (!sessionToken) {
    return res.json({ 
      success: false, 
      error: 'Missing session token' 
    }, 400);
  }
  
  // Guest key is a simple security measure to prevent unauthorized access to this function
  // In a real implementation, use proper authentication
  if (guestKey !== process.env.GUEST_ACCESS_KEY) {
    return res.json({ 
      success: false, 
      error: 'Unauthorized access' 
    }, 403);
  }
  
  try {
    // Token validation logic
    // 1. Parse the session token (in a real implementation, use JWT or similar)
    let session;
    try {
      session = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    } catch (error) {
      return res.json({ 
        success: false, 
        error: 'Invalid token format' 
      }, 400);
    }
    
    // 2. Validate session timestamp
    const now = Date.now();
    if (!session.startTime || !session.expiryTime) {
      return res.json({ 
        success: false, 
        error: 'Invalid token data' 
      }, 400);
    }
    
    // 3. Check if session has expired
    if (session.expiryTime < now) {
      return res.json({ 
        success: false, 
        error: 'Guest session expired', 
        expired: true,
        remainingTime: 0
      }, 401);
    }
    
    // 4. Get default institution data for the session
    let institutionData;
    try {
      institutionData = await databases.getDocument(
        databaseId,
        'institutions',
        'default_institution'
      );
    } catch (error) {
      console.error('Error fetching institution data:', error);
      // Continue even if we can't fetch institution data
    }
    
    // 5. Return successful validation result
    return res.json({
      success: true,
      remainingTime: session.expiryTime - now,
      expiryTime: session.expiryTime,
      institutionId: 'default_institution',
      institutionName: institutionData?.name || 'Default Institution'
    });
    
  } catch (error) {
    console.error('Error validating guest session:', error);
    return res.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
};