# Demo User Session Management Functions

This directory contains Appwrite functions to manage demo user sessions and ensure changes are properly cleaned up in the production environment.

## Functions Overview

### 1. cleanup-demo-sessions

Primary cleanup function that deletes tracking records and user-generated content.

- **Execution**: Both scheduled (cron) and on-demand
- **Permissions**: Requires full API key with database access
- **Variables**:
  - None (uses environment variables)

### 2. reset-demo-preferences

Resets demo user preferences when they log out.

- **Execution**: On-demand, triggered from frontend during logout
- **Permissions**: Uses user JWT token for account API access
- **Variables**:
  - None (uses JWT from request headers)

### 3. trigger-demo-cleanup

Triggers the cleanup function for a specific user.

- **Execution**: On-demand from frontend
- **Permissions**: Requires API key with functions:execute access
- **Variables**:
  - CLEANUP_FUNCTION_ID: ID of your cleanup function in Appwrite

## Deployment Instructions

### 1. Deploying to Appwrite

For each function directory, use the Appwrite CLI:

```bash
cd scripts/functions/cleanup-demo-sessions
appwrite deploy function
```

Repeat for each function directory.

### 2. Configuring Execution Triggers

#### For cleanup-demo-sessions:

1. **Set up a CRON schedule** in Appwrite console:
   - Daily execution: `0 0 * * *` (midnight every day)
   - Weekly execution: `0 0 * * 0` (midnight every Sunday)

2. **Configure event triggers** for logout events (optional):
   - Event: `users.logout`
   - User role: For demo user only

#### For reset-demo-preferences:

1. **Set up execution permissions**:
   - Grant execute permission to the demo user role
   - Required for JWT authentication

#### For trigger-demo-cleanup:

1. **Set up execution permissions**:
   - Grant execute permission to all signed-in users

### 3. Environment Variables

Ensure the following environment variables are set in the Appwrite console for all functions:

- `APPWRITE_ENDPOINT`: Your Appwrite endpoint URL
- `APPWRITE_FUNCTION_PROJECT_ID`: Auto-filled by Appwrite
- `APPWRITE_API_KEY`: Your Appwrite API key with required permissions

### 4. Testing Deployment

After deployment:

1. Trigger the function manually from Appwrite Console
2. Check the execution logs for success/failure
3. Verify demo user data is properly cleaned up

## Troubleshooting

### Common Issues

1. **Function Execution Failing**:
   - Check API key permissions in Appwrite Console
   - Ensure database and collection IDs are correct
   - Verify rate limits aren't being exceeded

2. **Rate Limiting**:
   - The functions include built-in retry logic for rate limits
   - Consider increasing delays between operations if still encountering issues

3. **Permissions Issues**:
   - Ensure the API key has correct permissions for databases, functions
   - For JWT functions, ensure proper user permissions are set

### Monitoring

Monitor function execution in the Appwrite Console:

1. Check execution logs
2. Set up alerts for failed executions
3. Review rate limit warnings

## Integration with Frontend

To trigger cleanup from the frontend when a demo user logs out:

```javascript
// In your logout function
const logout = async () => {
  if (isDemoUser) {
    // First reset preferences (requires user session)
    await sdk.functions.createExecution('reset-demo-preferences');
    
    // Then trigger cleanup (can use API key)
    await sdk.functions.createExecution('trigger-demo-cleanup', 
      JSON.stringify({
        userId: currentUser.$id,
        email: currentUser.email
      })
    );
  }
  
  // Now proceed with actual logout
  await account.deleteSession('current');
};
```

## Security Considerations

- The reset-demo-preferences function must validate that the JWT belongs to the demo user
- API keys should have minimal required permissions
- Cleanup functions should only target demo user data, never regular user data