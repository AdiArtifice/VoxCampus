# Server-Side Guest Access Validation

This document describes the implementation of server-side validation for guest access in the VoxCampus app.

## Overview

While client-side validation provides basic protection for guest session expiration, a malicious user could potentially modify client-side storage or intercept network requests. The server-side validation adds an extra layer of security by validating guest access tokens on the server side before allowing access to protected resources.

## Implementation Components

### 1. Appwrite Function: Guest Access Validator

This function validates guest session tokens and ensures they haven't expired. It also returns the default institution ID for the guest session.

**Location:** `scripts/functions/guest-access-validator/src/main.js`

**Deployment:**

```bash
cd scripts/functions/guest-access-validator
appwrite deploy function
```

**Environment Variables:**
- `GUEST_ACCESS_KEY`: A secret key for validating requests to the function
- `APPWRITE_DATABASE_ID`: The ID of the VoxCampus database

### 2. Client-Side Integration

The client-side code is enhanced with server validation capabilities through:

**Location:** `utils/serverValidation.ts`

This module provides:

1. **validateGuestSessionOnServer()** - Validates the current guest session with the server
2. **withServerGuestValidation()** - A Higher Order Function that wraps API calls with server-side validation

## Usage

### Basic Validation

```typescript
import { validateGuestSessionOnServer } from '../utils/serverValidation';

// In an async function
const validationResult = await validateGuestSessionOnServer();
if (!validationResult.success) {
  // Handle invalid session
  if (validationResult.expired) {
    // Show login prompt
  }
} else {
  // Session is valid
  console.log(`Session valid for ${validationResult.remainingTime}ms more`);
}
```

### Wrapping API Calls with Server Validation

```typescript
import { withServerGuestValidation } from '../utils/serverValidation';
import { getPosts } from '../your-api-module';

// Create a protected version of the API call
const getPostsWithValidation = withServerGuestValidation(getPosts);

// When calling the protected function
const result = await getPostsWithValidation(params);
if ('error' in result) {
  // Session validation failed
  console.log(result.error);
} else {
  // API call succeeded
  // Use result as normal
}
```

### Integration with Existing Filtering

The server-side validation works alongside the client-side institution filtering:

```typescript
import { withInstitutionFiltering } from '../utils/institutionFilter';
import { withServerGuestValidation } from '../utils/serverValidation';

// Combine both HOCs
const getPostsSecure = withServerGuestValidation(
  withInstitutionFiltering(getPosts)
);

// Now getPostsSecure has both institution filtering AND server validation
```

## Security Considerations

1. **Token Format**: The current implementation uses a simple Base64-encoded JSON token. For production, consider using JWT with proper signing.

2. **Secret Key**: The `GUEST_ACCESS_KEY` should be a strong random string stored securely in your environment variables.

3. **Function Access**: The function should be configured to only allow authorized access - the current implementation sets it for user access.

4. **Error Handling**: All validation failures should guide users to login/register rather than exposing error details.

## Future Improvements

1. **JWT Implementation**: Replace the simple Base64 token with a properly signed JWT token.

2. **Rate Limiting**: Add rate limiting to prevent abuse of the validation function.

3. **Logging**: Implement comprehensive logging for security auditing.

4. **Cache Control**: Add cache headers to prevent response caching.

## Deployment Instructions

1. Update the `GUEST_ACCESS_KEY` in both server-side function and client-side code.

2. Deploy the function using the Appwrite CLI:

```bash
cd scripts/functions/guest-access-validator
appwrite deploy function
```

3. Update the `GUEST_ACCESS_VALIDATOR_FUNCTION_ID` in `serverValidation.ts` with the actual function ID after deployment.