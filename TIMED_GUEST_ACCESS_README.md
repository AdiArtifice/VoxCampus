# VoxCampus Timed Guest Access & Institution Content Filtering

This document explains the implementation of timed guest access and institution-based content filtering in the VoxCampus app.

## Overview

VoxCampus provides a 5-minute guest preview for new users to explore the app without having to create an account. During this preview period, users can only see content from the default institution. After the 5-minute period expires, users are prompted to log in to continue using the app.

## Implementation Details

### Guest Session Management

1. **Guest Session Creation**: 
   - New users automatically get a 5-minute guest session
   - The session timer starts on first app launch
   - Session data is stored in AsyncStorage with expiration time

2. **Session Tracking**:
   - The `GuestSessionContext` manages the guest session state
   - `useGuestSession` hook provides access to session info throughout the app
   - Timer updates every second to show remaining time

3. **Session Expiration**:
   - After 5 minutes, the session expires
   - A modal prompts the user to log in
   - API access is blocked for expired sessions

### Institution Content Filtering

1. **Default Institution**:
   - All guest users are assigned to the "default_institution"
   - Each piece of content in the database has an institutionId field
   - Queries are automatically filtered by institution

2. **Filtering Mechanism**:
   - `withInstitutionFiltering` HOC wraps components needing institution context
   - `institutionFilter` utility adds filtering to database queries
   - Server-side validation via Appwrite Functions (optional)

## How to Use

### Guest Session Components

```tsx
// Display the guest session timer
import GuestSessionTimer from '@/components/GuestSessionTimer';

function MyScreen() {
  const { user } = useAuth();
  
  return (
    <View>
      {!user && <GuestSessionTimer />}
      {/* Rest of your component */}
    </View>
  );
}
```

### Institution Filtering

```tsx
// Apply institution filtering to a component
import { withInstitutionFiltering } from '@/hocs/withInstitutionFiltering';

const MyComponent = ({ institutionId }) => {
  // Use institutionId in your queries
  // ...
};

export default withInstitutionFiltering(MyComponent);
```

### API Access Control

```tsx
// Protect API calls with guest session verification
import { withGuestVerification } from '@/utils/apiAccessControl';

const fetchData = withGuestVerification(async () => {
  // Your API call logic here
  // Will throw an error if guest session expired
});
```

## Debugging

The implementation includes comprehensive debug logging to help troubleshoot issues:

1. **Session Management**:
   - Check console logs with `[DEBUG]` prefix
   - Monitor guest session creation, checks, and expiration
   - Validate institution IDs are correctly applied

2. **Common Issues**:
   - If the timer doesn't appear: Check GuestSessionTimer component mounting
   - If content doesn't load: Verify institutionId is correctly passed to queries
   - If modal doesn't show: Check the showExpiryModal state in GuestSessionTimer

## Security Considerations

1. Guest sessions are validated on both client and server side
2. Institution filtering ensures users can only see content they should have access to
3. API calls are wrapped with verification to prevent expired sessions from accessing data

## Testing

1. Clear app data to simulate a new user
2. Verify the 5-minute timer appears
3. Check that content loads with default institution filtering
4. Wait for timer expiration and confirm login modal appears
5. Verify API calls fail after session expiration