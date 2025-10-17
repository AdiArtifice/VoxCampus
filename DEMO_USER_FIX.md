# Demo User Session Management Fix

This update fixes the demo user session cleanup functionality to ensure changes made by demo users are properly reset when they log out.

## Changes Made

1. **Fixed Package Version**
   - Updated `node-appwrite` dependency from invalid version 3.0.6 to valid version 8.0.0 in all functions
   - Created package.json files for functions that were missing them
   - Ensured consistent versioning across all functions

2. **Added Deployment Scripts**
   - Created individual deployment scripts for each function
   - Added a combined script to deploy all functions at once
   - Fixed path references in existing deployment scripts

3. **Updated Documentation**
   - Enhanced README with dependency information
   - Added more deployment options
   - Created a TROUBLESHOOTING.md guide for common issues

## Deployment Instructions

To deploy the fixed functions:

1. Run the combined deployment script:
   ```
   node scripts/deploy-all-cleanup-functions.js
   ```

2. Verify in the Appwrite console that all functions have deployed successfully

3. For the cleanup-demo-sessions function, set up a CRON schedule:
   - Daily execution: `0 0 * * *` (midnight every day)

## Testing the Fix

To test the fix works correctly:

1. Log in as the demo user (test@sjcem.edu.in)
2. Make some changes (create posts, comments, etc.)
3. Log out
4. Log back in as the demo user
5. Verify your changes were cleaned up

## Technical Details

The main issue was that the functions were trying to use an invalid version of `node-appwrite` (3.0.6), which doesn't exist. We've updated them to use version 8.0.0 which is compatible with the current Appwrite server.