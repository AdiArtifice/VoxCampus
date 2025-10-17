# Multi-College Architecture Implementation Guide

## Overview

This guide outlines the changes needed to transform VoxCampus from a single-college app to a multi-college platform. The architecture uses a single database with institution-scoped collections, allowing data separation while maintaining a unified codebase.

## Database Structure Changes

### New Collections

1. **Institutions Collection**
   - Created with the ID `institutions`
   - Contains fields:
     - `name`: Institution name (required)
     - `domain`: Email domain for auto-assigning users (required)
     - `logoFileId`: Reference to logo image in storage (optional)
   - A default institution with ID `default_institution` has been created

### Modified Collections

The following collections have been updated with an `institutionId` field:

1. Association
2. Events and Sessions (Posts)
3. Public Users
4. Private Groups

These collections now have indexes on the `institutionId` field for efficient querying.

## Migration

A migration script has been created at `scripts/migrate-multi-college.js` to:

1. Assign the default institution ID to all existing documents
2. Verify that all required indexes are in place
3. Update user profiles based on email domains

To run the migration:

```bash
npm install dotenv
node scripts/migrate-multi-college.js
```

## Code Changes Required

### 1. Institution Utilities

A new file `lib/institutions.ts` provides utilities for:
- Getting institution ID from email domain
- Getting all institutions
- Getting institution by ID
- Creating query filters for institutions

### 2. AuthContext Updates

Update `context/AuthContext.tsx` to:
- Store and manage current institution
- Determine institution during login/registration
- Filter data by institution

See `MULTI_COLLEGE_AUTH_GUIDE.md` for detailed implementation notes.

### 3. Querying Data

Update all data fetching to include institution filtering:

```typescript
import { institutionFilter } from '../lib/institutions';

// Before
const { documents } = await databases.listDocuments(
  DATABASE_ID,
  'events_and_sessions'
);

// After
const { documents } = await databases.listDocuments(
  DATABASE_ID,
  'events_and_sessions',
  [institutionFilter(currentInstitutionId)]
);
```

### 4. Creating Data

Update all document creation to include institution ID:

```typescript
// Before
await databases.createDocument(
  DATABASE_ID,
  'events_and_sessions',
  ID.unique(),
  documentData
);

// After
await databases.createDocument(
  DATABASE_ID,
  'events_and_sessions',
  ID.unique(),
  {
    ...documentData,
    institutionId: currentInstitutionId
  }
);
```

### 5. UI Updates

Add institution selection UI for users with accounts at multiple institutions.

## Testing

1. Create test institutions
2. Create users with different email domains
3. Verify data isolation between institutions
4. Test switching between institutions

## Future Considerations

1. **Institution Admin Panel**: For managing institution settings
2. **Cross-Institution Features**: For collaborative events and shared resources
3. **Institution-specific Branding**: Custom themes and logos