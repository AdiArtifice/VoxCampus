# VoxCampus Institution and Guest Access Documentation

## Overview

This document explains the implementation of institution-based content filtering and timed guest access in VoxCampus. These features allow:

1. **Institution-Based Content Filtering**: All content is filtered by institution, ensuring users only see content relevant to their college.
2. **Timed Guest Access**: Non-logged-in users can preview the app for 5 minutes before being prompted to create an account.

## Implementation Details

### 1. Institution Structure

- All content is associated with an institution via the `institutionId` attribute
- A default institution (`default_institution`) is used for guest users and backward compatibility
- Institution assignment is based on email domain for logged-in users

### 2. Guest Session Management

- Guest sessions are limited to 5 minutes
- Session timing is persisted using AsyncStorage
- After expiration, users are prompted to login or register
- Guest users only see content from the default institution

### 3. Key Components

#### A. Utilities

- **GuestSession** (`utils/guestSession.ts`): Manages guest session timing and persistence
- **InstitutionFilter** (`utils/institutionFilter.ts`): Creates query filters for institution-scoped content
- **useInstitutionAuth** (`hooks/useInstitutionAuth.ts`): Hook providing auth with institution awareness

#### B. UI Components

- **GuestSessionExpiryModal** (`components/GuestSessionExpiryModal.tsx`): Modal for expired guest sessions

### 4. Database Changes

- Added `institutions` collection with fields:
  - `name`: Institution name
  - `domain`: Email domain for auto-assignment
  - `logoFileId`: Optional logo reference
- Added `institutionId` field to collections:
  - `association`
  - `events_and_sessions`
  - `public_users`
  - `private_groups`

## Usage Guide

### For Frontend Developers

#### Fetching Data with Institution Filtering

```typescript
import { useInstitutionAuth } from '@/hooks/useInstitutionAuth';

function MyComponent() {
  const { applyInstitutionFilter } = useInstitutionAuth();
  
  // Apply institution filter to your queries
  const fetchData = async () => {
    const queries = [
      Query.limit(10),
      Query.orderDesc('createdAt')
    ];
    
    // Add institution filtering
    const filteredQueries = applyInstitutionFilter(queries);
    
    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      filteredQueries
    );
    
    return response.documents;
  };
}
```

#### Creating Data with Institution ID

```typescript
import { useInstitutionAuth } from '@/hooks/useInstitutionAuth';

function CreatePostComponent() {
  const { institutionId } = useInstitutionAuth();
  
  const createPost = async (data) => {
    await databases.createDocument(
      databaseId,
      'events_and_sessions',
      ID.unique(),
      {
        ...data,
        institutionId: institutionId
      }
    );
  };
}
```

#### Checking Guest Session Status

```typescript
import { useInstitutionAuth } from '@/hooks/useInstitutionAuth';

function MyComponent() {
  const { isGuestUser, checkGuestSession } = useInstitutionAuth();
  
  // Check if guest session is valid before performing actions
  const performAction = async () => {
    if (isGuestUser) {
      const isSessionValid = await checkGuestSession();
      
      if (!isSessionValid) {
        // Show login prompt
        return;
      }
    }
    
    // Continue with action
  };
}
```

### For Backend Developers

#### Validating Institution Access in Functions

```typescript
// Example Appwrite Function for validating institution access
const { institutionId } = context.payload;
const { userId } = event;

// Get user's institution
const userRecord = await database.getDocument('VoxCampusDB', 'public_users', userId);

// Validate access
if (userRecord.institutionId !== institutionId) {
  throw new Error('Access denied: User does not belong to this institution');
}
```

## Configuration

### Constants

- **Guest Session Duration**: 5 minutes (configurable in `utils/guestSession.ts`)
- **Default Institution ID**: `'default_institution'`

### Environment Variables

- No new environment variables are required
- Existing `EXPO_PUBLIC_APPWRITE_*` variables are used

## Technical Considerations

### Security

- Institution filtering happens on both client and server sides
- Expired guest sessions are prevented from fetching new data
- Function-based validation can be added for enhanced security

### Performance

- Indexes are created on `institutionId` fields for optimal query performance
- Batch operations are used where possible to minimize API calls

### Data Migration

- A migration script (`migrate-multi-college.js`) is provided to assign the default institution ID to existing documents

## Troubleshooting

### Common Issues

1. **Content not appearing**: Verify that documents have the correct `institutionId`
2. **Guest session not expiring**: Check that AsyncStorage is working properly
3. **Wrong institution content**: Verify user's email domain and institution mapping

## Future Enhancements

1. **Institution Admin Panel**: For managing institution settings
2. **Institution Switching**: For users with accounts at multiple institutions
3. **Cross-Institution Collaboration**: For events and resources shared between institutions