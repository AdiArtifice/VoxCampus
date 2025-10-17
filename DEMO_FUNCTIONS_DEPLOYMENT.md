# Demo User Functions Deployment Guide

This guide explains how to deploy and set up the demo user session management functions for VoxCampus.

## Overview

The demo user session management system consists of three Appwrite functions:

1. **cleanup-demo-sessions**: Cleans up old demo session data and resets user changes
2. **reset-demo-preferences**: Resets demo user preferences (requires JWT auth)
3. **trigger-demo-cleanup**: Triggers cleanup for a specific user during logout

## Deployment Method

We've created direct API-based deployment tools that don't require the Appwrite CLI, making deployment simple and consistent.

### Prerequisites

- Node.js installed
- npm packages: `archiver`, `form-data` (installed automatically during deployment)

## Deployment Steps

### 1. Deploy All Functions

Run the following command to deploy all functions at once:

```bash
npm run deploy-functions
```

This will:
- Create the functions in your Appwrite project if they don't exist
- Set up all required environment variables
- Create deployments with the latest code
- Activate the deployments automatically

### 2. Set Up Schedule for Auto-Cleanup

To configure the cleanup function to run automatically each day:

```bash
npm run setup-schedule
```

This will set up a CRON schedule of `0 0 * * *` (midnight every day) for the cleanup function.

### 3. Test the Functions

To verify the functions are working properly:

```bash
npm run test-demo-functions
```

Before running this test, edit the `scripts/test-demo-functions.js` file and replace "demo-user-id" with an actual demo user ID for proper testing.

## Function Configuration Details

### cleanup-demo-sessions

- **Purpose**: Cleans up tracked changes and resets user content
- **Environment Variables**:
  - `DATABASE_ID`: Your Appwrite database ID
  - `DEMO_USER_EMAIL`: The email address for the demo user
- **Schedule**: Daily at midnight

### reset-demo-preferences

- **Purpose**: Resets user preferences when they log out
- **Environment Variables**:
  - `DATABASE_ID`: Your Appwrite database ID
  - `DEMO_USER_EMAIL`: The email address for the demo user
- **Authentication**: Uses the user's JWT token

### trigger-demo-cleanup

- **Purpose**: Triggers cleanup from the frontend
- **Environment Variables**:
  - `CLEANUP_FUNCTION_ID`: ID of the cleanup function
  - `DEMO_USER_EMAIL`: The email address for the demo user
- **Parameters**: User ID and email are passed in the request

## Verifying Deployment

After deployment:

1. Go to the Appwrite Console → Functions
2. You should see all three functions listed
3. Check that each function has an active deployment
4. Verify environment variables are set correctly
5. Test each function manually from the console

## Troubleshooting

### Rate Limiting Issues

If you encounter rate limit errors:
- The functions include built-in retry logic with exponential backoff
- Ensure proper delays between operations in the code
- Consider increasing timeout values if needed

### Permission Issues

If functions fail due to permissions:
- Check the API key permissions in Appwrite Console
- Ensure the key has functions:write and databases:write permissions
- For JWT functions, verify proper user permissions are set

### Deployment Failures

If deployment fails:
- Check console output for specific errors
- Verify your internet connection
- Ensure your API key is valid and has correct permissions

## Security Considerations

- The reset-demo-preferences function validates the JWT belongs to the demo user
- API keys have minimal required permissions
- Cleanup functions only target demo user data