# Demo Mode Setup Guide

This guide explains how to set up the demo mode functionality in the VoxCampus app.

## 1. Setup Demo User Account

The demo user account is pre-configured with the following credentials:

- **Email**: `test@sjcem.edu.in`
- **Password**: `DemoUser2025!@#`

If you need to create a new demo user account:

```bash
# Using Appwrite CLI
appwrite users create \
  --userId="demo_user" \
  --email="test@sjcem.edu.in" \
  --password="DemoUser2025!@#" \
  --name="VoxCampus Demo User"
```

## 2. Set Up Demo Session Tracking Collection

The demo session tracking collection has already been set up with the following attributes:

- `changeType` (string): Type of change (document/file/profile)
- `databaseId` (string): Database ID 
- `collectionId` (string): Collection ID
- `documentId` (string): Document ID
- `bucketId` (string): Bucket ID
- `fileId` (string): File ID
- `userId` (string): User ID
- `userEmail` (string): User email
- `timestamp` (string): Timestamp of change

An index has been created on the `userEmail` field for faster queries.

## 3. Configure Cleanup Function

The cleanup function is scheduled to run daily to remove old demo session data. To configure it properly:

1. Go to the Appwrite Console → Functions → `cleanup_demo_sessions`
2. Set the API key variable:
   - Name: `APPWRITE_API_KEY`
   - Value: Create an API key with the following permissions:
     - `databases.read` and `databases.write` 
     - Scope limited to the demo_session_tracking collection

```bash
# Using Appwrite CLI to create the API key
appwrite keys create \
  --name="Demo Session Cleanup" \
  --scopes="databases.read,databases.write" \
  --expire="0"
```

3. Use the generated key to update the function variable.

## 4. Deploy the Function

The function code is located in `scripts/functions/cleanup-demo-sessions/`. You can deploy it using:

```bash
# Navigate to the project root
cd "path/to/VoxCampus App"

# Run the deployment script
node scripts/deploy-cleanup-function.js
```

## 5. Verify Setup

To verify that demo mode is working correctly:

1. Log in with the demo account via the demo mode toggle
2. Create some content (posts, comments, etc.)
3. Upload a profile picture
4. Log out
5. Log in again to verify that your changes have been reset

## 6. Monitoring

You can monitor demo mode usage through:

- The `test_user_access_logs` collection for login/logout events
- The `demo_session_tracking` collection for all tracked changes
- Function logs for the cleanup process

## Support

If you encounter any issues with the demo mode setup, please refer to the complete documentation in `DEMO_MODE_DOCUMENTATION.md` or contact the development team.