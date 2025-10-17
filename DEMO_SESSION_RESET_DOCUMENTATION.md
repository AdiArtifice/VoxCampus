# Demo User Session Reset Implementation

This document explains how the demo user session reset functionality works in VoxCampus, ensuring that changes made by users in demo mode are temporary and reset upon logout.

## Overview

The session reset functionality tracks all changes (data modifications, profile updates, posts, etc.) made by demo users during their session and automatically reverts or deletes these changes when they log out. This ensures that each demo user session starts with a clean and original set of data.

## Implementation Components

### 1. Session Tracking

The `utils/demoSessionTracker.ts` utility provides functions to track changes made by demo users:

```typescript
// Track document changes (creation/updates)
trackDocumentChange(databaseId, collectionId, documentId);

// Track file uploads
trackFileUpload(bucketId, fileId);

// Track profile updates
trackProfileUpdate(userId);
```

### 2. Session Reset on Logout

The AuthContext has been updated to reset all tracked changes when a demo user logs out:

```typescript
// In AuthContext.tsx
const logout = useCallback(async () => {
  try {
    if (isDemoMode && user?.email) {
      // Log the logout event
      await databases.createDocument(...);
      
      // Reset the demo user session - delete all tracked changes
      await resetDemoUserSession();
    }
    
    // Continue with normal logout
    await account.deleteSession('current');
  } finally {
    setUser(null);
    setIsDemoMode(false);
  }
}, [...]);
```

### 3. Demo Tracker Hook

A custom hook `useDemoTracker` is provided for components that modify data:

```typescript
// In a component that modifies data
import { useDemoTracker } from '@/hooks/useDemoTracker';

function MyComponent() {
  const { trackDocument, trackFile, isDemoMode } = useDemoTracker();
  
  async function createItem() {
    const newId = ID.unique();
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, newId, {...});
    
    // Track the change if in demo mode
    if (isDemoMode) {
      await trackDocument(DATABASE_ID, COLLECTION_ID, newId);
    }
  }
}
```

## Database Setup

A special collection `demo_session_tracking` is used to track all changes made by the demo user:

```
demo_session_tracking
├─ changeType: string (document, file, profile)
├─ databaseId: string (optional)
├─ collectionId: string (optional) 
├─ documentId: string (optional)
├─ bucketId: string (optional)
├─ fileId: string (optional)
├─ userId: string (optional)
├─ userEmail: string
└─ timestamp: string
```

## Setup Instructions

1. Run the setup script to create the tracking collection:

```bash
node scripts/setup-demo-session-tracking.js
```

2. The script will:
   - Create the `demo_session_tracking` collection if it doesn't exist
   - Add the required attributes
   - Create an index on `userEmail` for faster queries

## User Experience

1. The TestUserBanner displays "DEMO MODE - Changes Reset on Logout" to inform users about the temporary nature of their changes.

2. When a demo user logs in, they receive an alert informing them that all changes will be reset on logout.

3. When a demo user logs out, all their changes (documents created, files uploaded, profile updates) are automatically deleted.

## Implementation Notes

- For simplicity, we're deleting all tracked changes rather than trying to revert them to their previous state.
- This approach ensures that each demo user session starts with a clean state.
- The implementation is designed to be fault-tolerant - if tracking or resetting fails, the app continues to function normally.
- All changes are tracked in a separate collection, making it easy to debug and maintain.

## Security Considerations

- Only demo users have their changes tracked and reset.
- The tracking system has minimal impact on regular users.
- Even if the reset process fails for some reason, the demo user's session will still end normally.
- The demo user can only see this specialized behavior, they can't affect other users.