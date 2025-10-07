# Avatar Upload Troubleshooting Guide

This document provides comprehensive troubleshooting for the avatar upload system in VoxCampus App.

## 🔧 Common Issues and Solutions

### 1. **Avatar uploads to storage but profile document is NOT updated**

**Symptoms:**
- Image successfully uploads to Appwrite Storage
- File appears in the `user_profile_images` bucket
- UI doesn't show the new avatar
- Profile document in `public_users` collection is not updated

**Root Causes & Solutions:**

#### **A. Missing Database Permissions**
```typescript
// Check collection permissions in Appwrite Console:
// Database -> Collections -> public_users -> Permissions
// Required: create("users"), update("users"), read("any")
```

#### **B. Incorrect Document ID Pattern**
```typescript
// WRONG: Random document IDs
await databases.createDocument(databaseId, collectionId, ID.unique(), data);

// CORRECT: Deterministic document ID
const documentId = `user_${userId}`;
await databases.createDocument(databaseId, collectionId, documentId, data);
```

#### **C. Missing await on Database Operations**
```typescript
// WRONG: Not awaiting database update
uploadAvatar(uri).then(() => {
  databases.updateDocument(/* ... */); // Not awaited!
});

// CORRECT: Properly awaited
const uploaded = await uploadAvatar(uri);
await databases.updateDocument(/* ... */);
```

#### **D. Using Wrong Collection/Attribute Names**
```typescript
// WRONG: Hardcoded or incorrect names
await databases.updateDocument(databaseId, "users", docId, { avatar: url });

// CORRECT: Using environment variables and correct attribute names
const collectionId = process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_USERS_COLLECTION_ID || 'public_users';
await databases.updateDocument(databaseId, collectionId, docId, { 
  avatarUrl: url,    // New attribute as requested
  avatar_url: url    // Legacy attribute for backwards compatibility
});
```

### 2. **Profile Document Update Fails Silently**

**Symptoms:**
- No error thrown but document is not updated
- Console shows success messages but database unchanged

**Solutions:**

#### **A. Implement Proper Error Handling**
```typescript
try {
  await databases.updateDocument(databaseId, collectionId, documentId, data);
  console.log('✅ Profile updated successfully');
} catch (updateError) {
  console.log('❌ Update failed, trying create:', updateError);
  try {
    await databases.createDocument(databaseId, collectionId, documentId, data);
    console.log('✅ Profile created successfully');
  } catch (createError) {
    console.error('❌ Both update and create failed:', createError);
    throw new Error(`Failed to save profile: ${createError.message}`);
  }
}
```

#### **B. Validate Required Fields**
```typescript
const profileData = {
  user_id: userId,           // Required field
  name: user.name,
  avatar_bucket_id: bucketId,
  avatar_file_id: fileId,
  avatar_url: publicUrl,     // Legacy field
  avatarUrl: publicUrl,      // New field
};

// Validate required fields exist
if (!profileData.user_id) {
  throw new Error('User ID is required for profile update');
}
```

### 3. **Image URL Generation Issues**

**Symptoms:**
- Image uploads successfully but URL is broken/inaccessible
- 404 errors when trying to display avatar
- CORS issues in web browsers

**Solutions:**

#### **A. Use Correct URL Generation Method**
```typescript
// WRONG: Manual URL construction (unreliable)
const url = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view`;

// CORRECT: Use Appwrite SDK method
const url = storage.getFileView(bucketId, fileId).toString();
```

#### **B. Verify Bucket Permissions**
```typescript
// Check bucket permissions in Appwrite Console:
// Storage -> Buckets -> user_profile_images -> Permissions
// Required: read("any") for public access
```

#### **C. Handle Different File Formats**
```typescript
const mimeType = extension === 'png' ? 'image/png' 
               : extension === 'heic' ? 'image/heic'
               : extension === 'webp' ? 'image/webp'
               : 'image/jpeg';

const filePayload = {
  uri,
  name: fileName,
  type: mimeType,  // Ensure correct MIME type
  size: fileInfo.size || 0,
};
```

### 4. **State Management Issues**

**Symptoms:**
- Avatar uploads and updates database but UI doesn't refresh
- Old avatar still shows after successful upload
- Inconsistent avatar display across screens

**Solutions:**

#### **A. Implement Immediate State Updates**
```typescript
// Update local state immediately after successful upload
const uploaded = await uploadAvatar(uri);
await updateProfile({ avatar: uploaded });

// Force immediate UI update
setAvatarPreview(uploaded.url);

// Also trigger any global state refresh
await refresh(); // Refresh AuthContext
```

#### **B. Use Consistent Avatar URL Resolution**
```typescript
// Create a utility function for consistent URL resolution
const getAvatarUrl = (profile) => {
  return profile?.avatarUrl || profile?.avatar_url || undefined;
};

// Use throughout the app
const ProfileAvatar = ({ userId }) => {
  const { profile } = useUserProfile({ userId });
  const avatarUrl = getAvatarUrl(profile);
  
  return <Image source={{ uri: avatarUrl }} />;
};
```

### 5. **Permission and Authentication Issues**

**Symptoms:**
- "Permission denied" errors during upload
- Authentication errors in database operations
- CORS errors in web environment

**Solutions:**

#### **A. Verify User Authentication**
```typescript
if (!user || !user.$id) {
  throw new Error('User must be authenticated to upload avatar');
}

// Check session is valid
try {
  const currentUser = await account.get();
  console.log('✅ User authenticated:', currentUser.email);
} catch (authError) {
  console.error('❌ Authentication failed:', authError);
  throw new Error('Please log in again to upload avatar');
}
```

#### **B. Check Environment Configuration**
```typescript
// Validate all required environment variables
const requiredEnvVars = {
  EXPO_PUBLIC_APPWRITE_ENDPOINT: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID: process.env.EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID,
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.error(`❌ Missing environment variable: ${key}`);
  }
});
```

## 🔍 Debugging Steps

### Step 1: Enable Debug Logging
```typescript
// Add detailed logging throughout the upload process
console.debug('[AvatarUpload] Starting upload process...');
console.debug('[AvatarUpload] File info:', fileInfo);
console.debug('[AvatarUpload] Upload payload:', filePayload);
console.debug('[AvatarUpload] File created:', file);
console.debug('[AvatarUpload] Public URL:', publicUrl);
console.debug('[AvatarUpload] Database update payload:', profileData);
console.debug('[AvatarUpload] Process completed successfully');
```

### Step 2: Test Each Step Individually

#### Test Storage Upload:
```typescript
const testStorageUpload = async (uri) => {
  try {
    const file = await storage.createFile(bucketId, ID.unique(), {
      uri, name: 'test.jpg', type: 'image/jpeg', size: 0
    });
    console.log('✅ Storage upload works:', file.$id);
    return file;
  } catch (error) {
    console.error('❌ Storage upload failed:', error);
    throw error;
  }
};
```

#### Test Database Update:
```typescript
const testDatabaseUpdate = async (userId, avatarUrl) => {
  try {
    const docId = `user_${userId}`;
    const data = { user_id: userId, avatarUrl };
    
    await databases.updateDocument(databaseId, collectionId, docId, data);
    console.log('✅ Database update works');
  } catch (error) {
    console.error('❌ Database update failed:', error);
    throw error;
  }
};
```

### Step 3: Verify Database State
```typescript
// Check if document was actually created/updated
const verifyProfileUpdate = async (userId) => {
  try {
    const docId = `user_${userId}`;
    const doc = await databases.getDocument(databaseId, collectionId, docId);
    console.log('📄 Current profile document:', doc);
    return doc;
  } catch (error) {
    console.error('❌ Failed to fetch profile:', error);
  }
};
```

## 🛠 Testing the Complete Flow

### Manual Testing Script:
```typescript
const testAvatarUploadFlow = async (userId: string, imageUri: string) => {
  console.log('🚀 Testing complete avatar upload flow...');
  
  try {
    // Step 1: Test authentication
    const currentUser = await account.get();
    console.log('✅ Step 1: User authenticated:', currentUser.email);
    
    // Step 2: Test storage upload
    const file = await storage.createFile(bucketId, ID.unique(), {
      uri: imageUri,
      name: `test-avatar-${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: 0
    });
    console.log('✅ Step 2: File uploaded to storage:', file.$id);
    
    // Step 3: Test URL generation
    const publicUrl = storage.getFileView(bucketId, file.$id).toString();
    console.log('✅ Step 3: Public URL generated:', publicUrl);
    
    // Step 4: Test database update
    const docId = `user_${userId}`;
    const profileData = {
      user_id: userId,
      avatarUrl: publicUrl,
      avatar_url: publicUrl,
      avatar_file_id: file.$id,
      avatar_bucket_id: bucketId,
    };
    
    try {
      await databases.updateDocument(databaseId, collectionId, docId, profileData);
      console.log('✅ Step 4a: Updated existing document');
    } catch {
      await databases.createDocument(databaseId, collectionId, docId, profileData);
      console.log('✅ Step 4b: Created new document');
    }
    
    // Step 5: Verify the update
    const updatedDoc = await databases.getDocument(databaseId, collectionId, docId);
    console.log('✅ Step 5: Document updated successfully:', updatedDoc);
    
    console.log('🎉 Complete flow test PASSED!');
    return true;
    
  } catch (error) {
    console.error('❌ Complete flow test FAILED:', error);
    return false;
  }
};
```

## 🔧 Quick Fixes Checklist

- [ ] **Environment Variables**: All required env vars are set
- [ ] **Permissions**: Bucket has `read("any")`, Collection has `create("users")`, `update("users")`
- [ ] **Authentication**: User is logged in and session is valid
- [ ] **Document ID**: Using consistent `user_${userId}` pattern
- [ ] **Attribute Names**: Using correct `avatarUrl` attribute name
- [ ] **Error Handling**: Proper try-catch with fallback to create if update fails
- [ ] **URL Generation**: Using `storage.getFileView()` method
- [ ] **State Updates**: Immediate local state update after successful upload
- [ ] **File Validation**: Checking file exists before upload
- [ ] **MIME Types**: Setting correct content type for different image formats

## 🚨 Emergency Fallback

If all else fails, here's a minimal working implementation:

```typescript
const emergencyAvatarUpload = async (userId: string, imageUri: string) => {
  // 1. Upload to storage
  const file = await storage.createFile('user_profile_images', ID.unique(), {
    uri: imageUri,
    name: `avatar-${userId}-${Date.now()}.jpg`,
    type: 'image/jpeg',
    size: 0
  });
  
  // 2. Get public URL
  const url = storage.getFileView('user_profile_images', file.$id).toString();
  
  // 3. Update database with both attribute names
  const docId = `user_${userId}`;
  const data = { 
    user_id: userId, 
    avatarUrl: url,
    avatar_url: url 
  };
  
  try {
    await databases.updateDocument('68c58e83000a2666b4d9', 'public_users', docId, data);
  } catch {
    await databases.createDocument('68c58e83000a2666b4d9', 'public_users', docId, data);
  }
  
  return { bucketId: 'user_profile_images', fileId: file.$id, url };
};
```

This emergency implementation covers the absolute minimum requirements and should work in most cases.
