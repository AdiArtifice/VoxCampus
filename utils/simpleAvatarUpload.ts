import * as ImagePicker from 'expo-image-picker';
import { storage, databases, ID } from '@/lib/appwrite';
import { Platform, Alert } from 'react-native';

/**
 * Simplified avatar upload function for testing and troubleshooting
 * This bypasses the complex hook system to identify where the issue occurs
 */
export const simpleAvatarUpload = async (userId: string) => {
  console.log('🚀 [SimpleUpload] Starting simple avatar upload test');
  
  try {
    // Step 1: Get image
    console.log('📱 [SimpleUpload] Requesting media library permissions...');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Photo library permission required');
    }
    console.log('✅ [SimpleUpload] Permissions granted');

    // Step 2: Launch image picker
    console.log('🖼️ [SimpleUpload] Opening image picker...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      console.log('❌ [SimpleUpload] User canceled or no image selected');
      return null;
    }

    const asset = result.assets[0];
    const imageUri = asset.uri;
    console.log('✅ [SimpleUpload] Image selected:', imageUri);

    // Step 3: Prepare file for upload
    console.log('📦 [SimpleUpload] Preparing file for upload...');
    const fileName = `avatar-${userId}-${Date.now()}.jpg`;
    let filePayload;

    // For both web and native, use the URI-based format that Appwrite expects
    console.log('📦 [SimpleUpload] Creating file payload for Appwrite...');
    filePayload = {
      uri: imageUri,
      name: fileName,
      type: 'image/jpeg',
      size: asset.fileSize || asset.width * asset.height / 10 || 100000, // Estimate size if not available
    };
    console.log('✅ [SimpleUpload] Payload prepared:', filePayload);

    // Step 4: Upload to storage with timeout
    console.log('⬆️ [SimpleUpload] Starting upload to Appwrite Storage...');
    console.log('🪣 [SimpleUpload] Bucket ID: user_profile_images');
    
    const uploadPromise = storage.createFile('user_profile_images', ID.unique(), filePayload);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout after 60 seconds')), 60000)
    );

    const file = await Promise.race([uploadPromise, timeoutPromise]) as any;
    console.log('✅ [SimpleUpload] File uploaded successfully!', {
      fileId: file.$id,
      bucketId: file.bucketId
    });

    // Step 5: Generate URL
    console.log('🔗 [SimpleUpload] Generating public URL...');
    const publicUrl = storage.getFileView('user_profile_images', file.$id).toString();
    console.log('✅ [SimpleUpload] Public URL generated:', publicUrl);

    // Step 6: Update database
    console.log('💾 [SimpleUpload] Updating database document...');
    const databaseId = '68c58e83000a2666b4d9';
    const collectionId = 'public_users';
    const documentId = `user_${userId}`;
    
    const profileData = {
      user_id: userId,
      avatar_bucket_id: 'user_profile_images',
      avatar_file_id: file.$id,
      avatar_url: publicUrl,
      avatarUrl: publicUrl,
    };

    try {
      await databases.updateDocument(databaseId, collectionId, documentId, profileData);
      console.log('✅ [SimpleUpload] Document updated successfully');
    } catch (updateError) {
      console.log('⚠️ [SimpleUpload] Update failed, trying create...', updateError);
      try {
        await databases.createDocument(databaseId, collectionId, documentId, profileData);
        console.log('✅ [SimpleUpload] Document created successfully');
      } catch (createError) {
        console.error('❌ [SimpleUpload] Both update and create failed:', createError);
        throw new Error('Failed to save avatar information to database');
      }
    }

    console.log('🎉 [SimpleUpload] Avatar upload completed successfully!');
    
    return {
      bucketId: 'user_profile_images',
      fileId: file.$id,
      url: publicUrl
    };

  } catch (error) {
    console.error('❌ [SimpleUpload] Upload failed:', error);
    throw error;
  }
};

/**
 * Test function to verify Appwrite Storage connection
 */
export const testStorageConnection = async () => {
  console.log('🧪 [Test] Testing Appwrite Storage connection...');
  
  try {
    // Create a data URI for a small test image (1x1 pixel PNG)
    const testImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const filePayload = {
      uri: testImageUri,
      name: 'test-image.png',
      type: 'image/png',
      size: 100,
    };

    console.log('⬆️ [Test] Uploading test file...');
    const file = await storage.createFile('user_profile_images', ID.unique(), filePayload);
    console.log('✅ [Test] Test file uploaded:', file.$id);

    // Clean up - delete test file
    console.log('🧹 [Test] Cleaning up test file...');
    await storage.deleteFile('user_profile_images', file.$id);
    console.log('✅ [Test] Test file deleted');

    return true;
  } catch (error) {
    console.error('❌ [Test] Storage test failed:', error);
    return false;
  }
};