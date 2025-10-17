# Demo Mode Implementation Documentation

## Overview

The VoxCampus App includes a complete demo mode that allows users to explore the app without creating an account. This implementation includes:

1. **Demo User Login**: Ability to log in with a pre-configured demo account
2. **Session Tracking**: All changes made by demo users are tracked
3. **Automatic Reset**: Demo user changes are automatically reset when they log out
4. **Cleanup Schedule**: Old demo session data is cleaned up automatically

## Components

### 1. Demo User Authentication

Demo mode is implemented in the login form with a toggle switch that bypasses normal authentication and uses predefined credentials:

- **Email**: `test@sjcem.edu.in`
- **Password**: `DemoUser2025!@#`

The login form in `components/auth/LoginForm.tsx` has a demo mode toggle that, when enabled:
- Disables the email/password fields
- Changes the button text to "Enter Demo Mode"
- Uses the predefined demo credentials

### 2. Session Tracking

All demo user activities are tracked in the `demo_session_tracking` collection with the following attributes:

- `changeType`: Type of change (document/file/profile)
- `databaseId`: Database ID where the change occurred
- `collectionId`: Collection ID for document changes
- `documentId`: Document ID for document changes
- `bucketId`: Bucket ID for file changes
- `fileId`: File ID for file changes
- `userId`: The user ID of the demo user
- `userEmail`: The email of the demo user (test@sjcem.edu.in)
- `timestamp`: When the change was made

### 3. Demo Session Tracker Utility

The `utils/demoSessionTracker.ts` file contains utility functions for tracking and resetting demo user changes:

- `isDemoUser`: Checks if a user is the demo user
- `initDemoSessionTracking`: Initializes the tracking collection
- `trackDocumentChange`: Records document creation/updates
- `trackFileUpload`: Records file uploads
- `trackProfileUpdate`: Records profile preference updates
- `resetDemoUserSession`: Resets all tracked changes when the user logs out

### 4. Demo User Banner

A banner component displays at the top of the screen when in demo mode, informing users that:
- They are using a demo account
- All changes will be reset when they log out
- Data created in demo mode is temporary

### 5. Automatic Reset

When a demo user logs out, the `resetDemoUserSession` function:
1. Retrieves all tracked changes from the `demo_session_tracking` collection
2. Deletes any documents created by the demo user
3. Deletes any files uploaded by the demo user
4. Resets the demo user's profile preferences
5. Deletes the tracking records

### 6. Scheduled Cleanup

A scheduled function runs daily to clean up old demo session data:
- Function ID: `cleanup_demo_sessions`
- Schedule: Daily at midnight (CRON: `0 0 * * *`)
- Deletes tracking records older than 7 days

## Integration Points

The demo mode functionality integrates with several parts of the app:

1. **AuthContext** (`context/AuthContext.tsx`):
   - Sets `isDemoMode` state when demo login is used
   - Initializes demo session tracking on login
   - Logs demo user access
   - Resets demo session on logout
   - Tracks changes when demo mode is active

2. **Component Integration**:
   - Components check `isDemoMode` from AuthContext
   - UI elements display appropriate demo mode messages
   - Changes are tracked through the demo session tracker

## Database Collections

The demo mode uses two dedicated collections:

1. **demo_session_tracking**: Tracks all changes made by demo users
   - Includes attributes for different types of changes
   - Has an index on userEmail for efficient querying

2. **test_user_access_logs**: Logs demo user login/logout events
   - Records timestamps, actions, and user agent information
   - Used for analytics on demo mode usage

## Testing and Verification

To verify that demo mode is working correctly:

1. Enable demo mode on the login screen
2. Log in with the demo account
3. Make various changes (create posts, upload files, update profile)
4. Log out
5. Log back in to verify that all changes have been reset

## Maintenance

The demo mode requires minimal maintenance due to:

1. Automatic cleanup of old session data
2. Self-contained tracking and reset functionality
3. Clear separation between demo and regular user data

To update the demo user account:
1. Update the credentials in `components/auth/LoginForm.tsx`
2. Update the public profile in the `public_users` collection

## Security Considerations

The demo mode has been designed with security in mind:

1. Demo user has limited permissions
2. All demo user changes are isolated and tracked
3. Automatic reset prevents accumulation of test data
4. Demo user cannot access sensitive functions or data

## Troubleshooting

If issues occur with the demo mode:

1. Check the `test_user_access_logs` collection for login/logout events
2. Verify that the `demo_session_tracking` collection is recording changes
3. Ensure the cleanup function is running correctly
4. Check that the demo user account exists and is properly configured