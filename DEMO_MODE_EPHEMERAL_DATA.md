# VoxCampus Demo Mode: Ephemeral Data Implementation

## Overview

This document describes the implementation of ephemeral data handling for the VoxCampus app's demo mode. The system ensures that all changes made during a demo session are properly tracked and reset when the user logs in and logs out.

## Problem Statement

Previously, changes made by demo users were permanently saved to the database, causing:
1. Demo data to persist across sessions
2. Demo actions to affect other users
3. Demo content to accumulate in the database
4. **Following associations** was especially problematic since it's stored in user preferences, not as documents

## Solution

We've implemented a comprehensive tracking and reset mechanism for demo users that:
1. Identifies when a user is in demo mode
2. Tracks ALL types of changes, including preferences like followed associations
3. Resets all changes when the demo user logs in AND when they log out
4. Sets up default preferences to provide a good starting experience
5. Provides visual indication to users that they're in demo mode

## Key Features

1. **Reset on Login and Logout**: All changes made by the demo user are reset both when they log in and when they log out, ensuring a clean slate for each session.

2. **Default Preferences**: Demo users start with sensible default preferences (including followed associations) for a better demo experience.

3. **Comprehensive Tracking**: All types of changes are tracked, including:
   - Documents created or modified
   - Files uploaded
   - Associations followed (via preferences)
   - Connections made with other users
   - Profile changes

4. **Transparent to Users**: Demo users are informed that their changes are temporary and will be reset.

## Key Components

### 1. Demo Session Tracker (utils/demoSessionTracker.ts)

Core utility that provides functions to track and clean up changes:

```typescript
// Track a document change
trackDocumentChange(databaseId, collectionId, documentId);

// Track a file upload
trackFileUpload(bucketId, fileId);

// Track profile updates
trackProfileUpdate(userId);

// Track relationships (follows, connections, etc.)
trackRelation(databaseId, collectionId, documentId, relationType);

// Track preference changes (e.g., followed associations)
trackPreferenceChange(prefType, dataType);

// Reset everything on login and logout
resetDemoUserSession();
```

### 2. Demo Default Preferences (utils/demoDefaultPrefs.ts)

Sets up default preferences for demo users after login:

```typescript
// Set default preferences after login
setupDemoDefaultPreferences();

// Helper to find a good default association to follow
getDefaultAssociationId();
```

### 3. Demo Tracker Hook (hooks/useDemoTracker.ts)

React hook that provides easy access to tracking functions:

```typescript
const { 
  trackDocument, 
  trackFile, 
  trackProfile, 
  trackAssociation,
  trackPreference,  // New function for preference tracking
  shouldTrackChanges,
  isDemoMode 
} = useDemoTracker();

// Example: Track when user follows associations (stored in preferences)
trackPreference('followedAssociations', 'association_follows');
```

### 3. Visual Indicators (components/TestUserBanner.tsx)

Banner that displays at the top of the screen when in demo mode:

```tsx
<TestUserBanner />
```

### 4. Demo User Detection (useAuth hook)

```typescript
const { isDemoMode } = useAuth();
```

### 5. Integration with User Actions

We've integrated tracking into various user actions:

#### Following Associations

```typescript
// In AssociationsScreen.tsx
const saveFollowed = async () => {
  // Update preferences
  await account.updatePrefs({ followedAssociations: ids });
  
  // Track if demo user
  if (isDemoMode) {
    await trackAssociation(
      'preferences',
      'user_preferences',
      trackingId,
      'follow_associations'
    );
  }
};
```

#### Creating Connections

```typescript
// In ConnectScreen.tsx
const createConnection = async () => {
  // Create connection document
  const connectionDoc = await databases.createDocument(...);
  
  // Track if demo user
  if (isDemoMode) {
    await trackAssociation(
      databaseId, 
      connectionsCol, 
      connectionDoc.$id, 
      'connection'
    );
  }
};
```

## Database Structure

### Demo Session Tracking Collection

Stores records of all changes made by demo users:

- `changeType`: Type of change (document, file, profile, association, preference)
- `databaseId`: Database where the change was made
- `collectionId`: Collection where the change was made
- `documentId`: ID of the created/modified document
- `bucketId`: For file uploads, the bucket ID
- `fileId`: For file uploads, the file ID
- `relationType`: For associations, the type of relation
- `prefType`: For preference changes, the type of preference changed
- `userEmail`: Email of the demo user
- `timestamp`: When the change was made

## Login Process for Demo Users

1. User initiates demo login
2. Set demo mode flag in state
3. Initialize demo tracking system
4. **Reset any previous demo user changes**
5. Create authentication session
6. Fetch current user information
7. Log the demo access event
8. **Set up default preferences**
9. Show notification to user about demo mode

## Logout Process for Demo Users

1. User initiates logout
2. Log the logout event
3. **Reset all demo user changes**
4. Delete the authentication session
5. Clear user state

## Reset Process

1. Reset user preferences to default empty state
2. Fetch all tracked changes from the database
3. Process each change based on its type:
   - Delete documents
   - Delete files
   - Reset connections and follows
   - Clear preference changes
4. Delete all tracking records

## Automated Testing

We've added tests in `__tests__/demoMode.test.ts` and `scripts/test-demo-preferences-reset.js` that verify:

1. Following associations is tracked and reset
2. Creating connections is tracked and reset
3. Fresh logins show no persistent changes
4. Preferences are properly reset
5. Default preferences are correctly applied after login

## Future Improvements

1. Add more granular tracking for specific operations
2. Implement more sophisticated reset mechanisms for complex data relationships
3. Add metrics to track demo mode usage

## Security Considerations

1. Demo user has limited permissions
2. All operations by demo users are logged
3. Demo data is isolated and doesn't affect other users

## Conclusion

The VoxCampus app now provides a true sandbox environment for demo users, allowing them to explore the full functionality without creating permanent changes. This enhances the demo experience while maintaining data integrity for real users.