# VoxCampus Demo User Implementation

This document explains how the special demo user functionality works in VoxCampus, allowing authorized testers to view content across all institutions regardless of domain restrictions.

## Overview

The demo user implementation creates a special account with the email `test@sjcem.edu.in` that has permissions to view content from all institutions in the app. This is accomplished through special handling in the authentication context and database queries.

## User Interface Components

### 1. Demo Mode Toggle on Login Screen

The login screen (`components/auth/LoginForm.tsx`) includes a toggle switch for "Demo Mode" that allows users to access the app with the demo account credentials without having to manually enter them.

```tsx
// From LoginForm.tsx
const [demoMode, setDemoMode] = useState(false);

// When demo mode is toggled
<Switch
  trackColor={{ false: "#767577", true: COLORS.primary }}
  thumbColor={demoMode ? "#f4f3f4" : "#f4f3f4"}
  ios_backgroundColor="#3e3e3e"
  onValueChange={() => setDemoMode(!demoMode)}
  value={demoMode}
/>
```

### 2. Demo Mode Banner

A banner (`components/TestUserBanner.tsx`) is displayed when using the app in demo mode, indicating the special access privileges:

```tsx
// TestUserBanner component
export default function TestUserBanner() {
  const { isDemoMode } = useAuth();
  
  // Don't render anything if not in demo mode
  if (!isDemoMode) return null;
  
  // ...banner UI
}
```

### 3. MainLayout Component

The `MainLayout` component serves as a wrapper that ensures the TestUserBanner is consistently displayed across all screens when in demo mode:

```tsx
// MainLayout component
export default function MainLayout({ children }: MainLayoutProps) {
  const { isDemoMode } = useAuth();
  
  return (
    <View style={{ flex: 1 }}>
      {isDemoMode && <TestUserBanner />}
      {children}
    </View>
  );
}
```

## Setup

A setup script has been created at `scripts/setup-demo-user.js` that:

1. Creates the demo user account (or updates it if it already exists)
2. Sets appropriate user labels for tracking access
3. Adds a special flag to the user's public profile
4. Creates membership records for all institutions
5. Outputs the generated credentials for login

To run the setup script:

```bash
# Set environment variables (if not using mcp.json)
# APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
# APPWRITE_PROJECT_ID=your_project_id
# APPWRITE_API_KEY=your_api_key

node scripts/setup-demo-user.js
```

## Security Considerations

The demo user implementation includes several security measures:

1. **Access Tracking**: All actions by the demo user are logged for security audit purposes
2. **Read-Only Mode**: The demo user is limited to viewing content, not creating or modifying it
3. **Special Labeling**: The user account has special labels that clearly identify it as a demo user
4. **Explicit Permissions**: Access is granted through explicit memberships, not by modifying core logic

## Implementation Details

### Authentication Context

The `context/AuthContext.tsx` has been extended to support demo mode:

```tsx
// AuthContext.tsx
export const AuthContext = createContext<AuthContextType>({
  // ...other context values
  isDemoMode: false,
  // ...other context values
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ...other state
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const login = async (email: string, password: string, demoMode = false) => {
    try {
      // If demo mode is enabled, use the demo credentials
      if (demoMode) {
        email = 'test@sjcem.edu.in'; // Demo user email
        password = DEMO_USER_PASSWORD; // Imported from environment config
        setIsDemoMode(true);
      }
      
      // Regular login process
      const session = await account.createEmailSession(email, password);
      // ...rest of login logic
    } catch (error) {
      // ...error handling
    }
  };
  
  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setIsDemoMode(false); // Reset demo mode on logout
      // ...rest of logout logic
    } catch (error) {
      // ...error handling
    }
  };
  
  // ...other functions
  
  const value = {
    // ...other context values
    isDemoMode,
    // ...other context values
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### Demo User Utilities

The `utils/demoUser.ts` file contains utility functions for handling the special user:

- `isTestUser()`: Checks if the current user is the demo user
- `getTestUserAccessibleInstitutions()`: Gets all institution IDs accessible to the demo user
- `applyTestUserOverride()`: Modifies database queries to bypass institution filtering
- `logTestUserAccess()`: Logs access for security audit purposes

### Usage in Code

When fetching data, use the demo user utilities to modify your queries:

```typescript
import { applyTestUserOverride, logTestUserAccess } from '@/utils/demoUser';

// Normal query preparation
let queries = [Query.orderDesc('createdAt')];

// Apply demo user override if needed
queries = await applyTestUserOverride(queries, user.email, currentInstitutionId);

// Log the access if it's the demo user
await logTestUserAccess(user.email, 'view', 'posts');

// Fetch the data with the modified queries
const { documents } = await databases.listDocuments(
  DATABASE_ID,
  'events_and_sessions',
  queries
);
```

## How to Use Demo Mode

1. Open the VoxCampus app and navigate to the login screen.
2. Toggle the "Demo Mode" switch at the bottom of the login form.
3. Press the "Login" button (no need to enter any credentials).
4. The app will log in with the pre-configured demo account.
5. A banner will appear at the top of the screen indicating that you're in Demo Mode.
6. Browse content across all institutions without domain restrictions.
7. Tap on the Demo Mode banner for more information about the demo access.
8. Log out normally when you're done testing.

## Integration With App Structure

The Demo Mode feature is integrated into the app's structure as follows:

1. **App Layout**: The `app/_layout.tsx` file includes the `MainLayout` component which wraps all content:
   ```tsx
   // In _layout.tsx
   <AuthProvider>
     <ProviderGuard>
       <MainLayout>
         <Slot />
       </MainLayout>
     </ProviderGuard>
   </AuthProvider>
   ```

2. **Login Flow**: The login flow is modified to handle demo mode login:
   ```tsx
   // In LoginForm.tsx
   const handleLogin = async () => {
     // For demo mode, use pre-configured credentials
     if (demoMode) {
       await login("", "", true); // Email and password are ignored in demo mode
     } else {
       await login(email, password);
     }
   };
   ```

3. **Auth Hook**: The `useAuth` hook provides access to the `isDemoMode` state:
   ```tsx
   // In components that need to know demo status
   const { isDemoMode } = useAuth();
   
   // Conditional rendering based on demo mode
   {isDemoMode && <ReadOnlyNotice />}
   ```

## Important Notes

1. The demo user functionality is intended only for authorized testers and demo purposes.
2. The demo user's actions are logged for security audit purposes.
3. This implementation is a balance between allowing cross-institution access and maintaining security.
4. Demo Mode provides read-only access to prevent abuse of cross-institution access.