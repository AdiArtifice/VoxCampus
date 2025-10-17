# Timed Guest Access & Institution Filtering

## Overview

This document describes the implementation of timed guest access with institution-based content filtering in the VoxCampus app. These features allow:

1. Guest users to access institution-specific content for a limited time (5 minutes)
2. Content filtering based on institution ID for all users (guest and authenticated)

## Feature Components

### 1. Guest Session Management

The guest session system manages temporary access for non-authenticated users:

- **Session Duration**: 5 minutes by default (configurable in `guestSession.ts`)
- **Session Tracking**: Stored in AsyncStorage with start/expiry timestamps
- **Session Expiration**: Automatically blocks data access and displays a login prompt after time expires
- **Visual Indicator**: A timer widget shows remaining time for guest sessions

### 2. Institution-Based Content Filtering

All content (posts, associations, user profiles) is filtered by institution:

- **Guest Users**: See only content from the default institution
- **Authenticated Users**: See content from their institution (determined by email domain)
- **Multi-College Ready**: Architecture supports future expansion to multiple institutions

## Implementation Details

### Core Files

1. **Guest Session Management**
   - `utils/guestSession.ts`: Core functions for managing guest sessions
   - `components/GuestSessionTimer.tsx`: Visual timer component
   - `context/GuestSessionContext.tsx`: Context provider for sharing guest session state

2. **Institution Filtering**
   - `utils/institutionFilter.ts`: Utilities for institution filtering
   - `hocs/withInstitutionFiltering.tsx`: HOC to add institution filtering to components
   - `utils/apiAccessControl.ts`: Verification utilities for API access control

3. **Auth Integration**
   - `context/AuthContext.tsx`: Modified to work with guest sessions and institution filtering

### How It Works

1. **First-time Guest Access**:
   - User opens app without authentication
   - App starts a 5-minute guest session
   - Content filtered to default institution
   - Timer appears showing remaining time

2. **Session Expiration**:
   - Timer counts down to zero
   - Access to content blocked
   - Modal appears prompting login
   - API requests return "Guest session expired" error

3. **Authentication**:
   - User logs in with institutional email
   - System determines institution from email domain
   - Content filtered to user's institution
   - Guest timer disappears

## Configuration

### Default Institution Setup

The default institution is configured with ID `default_institution` and domain "vit.edu". To change:

1. Edit constants in `utils/institutionFilter.ts`:
   ```typescript
   const DEFAULT_INSTITUTION_ID = 'default_institution';
   const DEFAULT_DOMAIN = 'vit.edu';
   const DEFAULT_NAME = 'Default Institution';
   ```

2. Ensure this institution exists in Appwrite:
   ```typescript
   await databases.createDocument(
     APPWRITE.DATABASE_ID,
     'institutions',
     DEFAULT_INSTITUTION_ID,
     {
       name: DEFAULT_NAME,
       domain: DEFAULT_DOMAIN,
     }
   );
   ```

### Guest Session Duration

To modify the guest session duration, update the constant in `utils/guestSession.ts`:

```typescript
const GUEST_SESSION_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
```

## Usage Examples

### Filtering Content by Institution

```typescript
import { withInstitutionFiltering } from '@/hocs/withInstitutionFiltering';
import { institutionFilter } from '@/utils/institutionFilter';

// 1. Using HOC pattern
const MyComponent = ({ institutionId }) => {
  // institutionId is automatically injected
  // Use it in database queries
};
export default withInstitutionFiltering(MyComponent);

// 2. Direct filter usage in queries
const fetchPosts = async (institutionId) => {
  const { documents } = await databases.listDocuments(
    DATABASE_ID, 
    'posts',
    [institutionFilter(institutionId)]
  );
  return documents;
};
```

### Verifying Guest Session Before API Calls

```typescript
import { withGuestVerification } from '@/utils/apiAccessControl';

// Wrap API function to verify guest session
const fetchProtectedData = withGuestVerification(async () => {
  // This will only execute if guest session is valid
  return await databases.listDocuments(...);
});

// Using the wrapped function
try {
  const data = await fetchProtectedData();
  // Process data
} catch (error) {
  if (error.message?.includes('Guest session expired')) {
    // Show login prompt
  }
}
```

### Accessing Guest Session State

```typescript
import { useGuestSession } from '@/hooks/useGuestSession';

function MyComponent() {
  const { 
    isGuestSession,
    guestSessionActive,
    guestSessionRemainingTime,
    startNewGuestSession,
    endCurrentGuestSession
  } = useGuestSession();
  
  // Use guest session state and methods
}
```

## Security Considerations

1. **Client-side Implementation**: The guest session is primarily enforced client-side through AsyncStorage. For enhanced security, consider implementing server-side validation.

2. **Data Access Controls**: Appwrite permissions still apply - guest users can only access documents with appropriate read permissions.

3. **Session Spoofing Protection**: The implementation includes validation checks to prevent tampering with session timestamps.

## Future Improvements

1. **Server-side Validation**: Implement an Appwrite Function to verify guest session validity on the server.

2. **Customizable Access Levels**: Allow different guest access levels per institution.

3. **Progressive Disclosure**: Show limited content previews after guest session expires to encourage sign-up.

4. **Institution Selection**: Add UI for users with access to multiple institutions.