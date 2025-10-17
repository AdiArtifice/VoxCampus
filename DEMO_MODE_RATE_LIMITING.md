# Demo Mode Rate Limiting Fix

This document explains the changes made to fix rate limiting issues when using the VoxCampus app in demo mode.

## Problem

When logging in with demo mode, users were experiencing rate limiting errors from the Appwrite backend due to too many API calls being made in quick succession. The login flow was triggering multiple operations:

1. Create a user session
2. Initialize demo session tracking
3. Log the demo access event
4. Reset previous demo user preferences/changes
5. Set up default demo preferences

These operations were happening too quickly and causing Appwrite to return rate limit errors.

## Solution

The following changes were implemented to address this issue:

### 1. Sequential API Calls with Delays

In `AuthContext.tsx`, the login function was modified to:

- Add larger delays between critical API operations (1-2 seconds instead of 500ms)
- Wrap each operation in its own try/catch block to prevent cascading failures
- Continue with the login process even if some non-critical operations fail
- Show a more helpful alert when setup operations fail but login succeeds

### 2. Optimized Reset Process

In `demoSessionTracker.ts`, the `resetDemoUserSession` function was improved to:

- Process tracked changes sequentially instead of in parallel
- Add delays between database operations
- Use a more minimal preferences reset to avoid rate limits
- Only reset critical preferences (followed associations) if rate limits are encountered

### 3. Simplified Default Preferences

In `demoDefaultPrefs.ts`, the `setupDemoDefaultPreferences` function was modified to:

- Start with essential preferences first to ensure the most important settings are applied
- Add enhanced preferences in a separate API call only if the first call succeeds
- Add longer delays between preference update calls
- Include better type checking for rate limit error detection
- Fall back to minimal preferences when rate limits are detected

## Usage Guidelines

When implementing demo mode features:

1. **Minimize API Calls**: Only make essential API calls during login/logout
2. **Add Delays**: Always include delays between API operations (minimum 1000ms)
3. **Handle Rate Limits**: Check for rate limit errors and have fallback strategies
4. **Use Minimal Data**: Start with minimal data updates and enhance later if possible
5. **Log Issues**: Include detailed logging to help diagnose issues

## Testing

When testing demo mode:

1. Try rapid login/logout cycles to ensure rate limiting doesn't occur
2. Check that followed associations are properly reset after logout
3. Verify that default preferences are applied correctly
4. Confirm that all user-created content is properly tracked and reset

## Rate Limit Error Detection

Rate limit errors from Appwrite typically include one of these indicators:

- HTTP status code 429
- Error message containing "rate limit" or "too many requests"
- Server response indicating throttling

Our error handling now properly checks for these conditions and responds accordingly.