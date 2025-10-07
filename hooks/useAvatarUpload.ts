import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { storage, databases, ID } from '@/lib/appwrite';

export interface AvatarUploadResult {
  bucketId: string;
  fileId: string;
  url: string;
}

export interface UseAvatarUploadOptions {
  userId: string;
  onSuccess?: (result: AvatarUploadResult) => void;
  onError?: (error: Error) => void;
}

export interface UseAvatarUploadReturn {
  isUploading: boolean;
  uploadError: string | null;
  pickAndUploadAvatar: () => Promise<AvatarUploadResult | null>;
  pickImageFromCamera: () => Promise<AvatarUploadResult | null>;
  pickImageFromGallery: () => Promise<AvatarUploadResult | null>;
  uploadImageFromUri: (uri: string) => Promise<AvatarUploadResult>;
  clearError: () => void;
}

/**
 * Custom hook for handling avatar image upload with Appwrite Storage
 * 
 * This hook provides a complete solution for:
 * 1. Image selection (camera or gallery)
 * 2. Upload to Appwrite Storage
 * 3. Update user profile document with the new avatar URL
 * 4. Error handling and loading states
 */
export function useAvatarUpload({
  userId,
  onSuccess,
  onError,
}: UseAvatarUploadOptions): UseAvatarUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  // Get configuration from environment
  const getConfig = useCallback(() => {
    const bucketId = process.env.EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID || 'user_profile_images';
    const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '68c58e83000a2666b4d9';
    const collectionId = process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_USERS_COLLECTION_ID || 'public_users';
    const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

    if (!endpoint || !projectId) {
      throw new Error('Appwrite endpoint or project ID not configured');
    }

    return { bucketId, databaseId, collectionId, endpoint, projectId };
  }, []);

  /**
   * Upload an image file to Appwrite Storage and update user profile
   * 
   * @param uri - Local file URI of the image
   * @returns Promise resolving to upload result
   */
  const uploadImageFromUri = useCallback(async (uri: string): Promise<AvatarUploadResult> => {
    const config = getConfig();
    
    console.debug('[useAvatarUpload] Starting upload for URI:', uri);
    console.debug('[useAvatarUpload] Platform:', Platform.OS);

    let fileInfo: any;
    let filePayload: any;

    // Determine file type and name from URI
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = extension === 'png' ? 'image/png' 
                   : extension === 'heic' ? 'image/heic'
                   : extension === 'webp' ? 'image/webp'
                   : 'image/jpeg';
    
    const fileName = `avatar-${userId}-${Date.now()}.${extension}`;

    // For both web and native, use the URI-based format that Appwrite expects
    filePayload = {
      uri,
      name: fileName,
      type: mimeType,
      size: 0, // Size will be determined by Appwrite
    };
    
    console.debug('[useAvatarUpload] File payload prepared:', filePayload);

    // For native platforms, optionally validate file exists
    if (Platform.OS !== 'web') {
      try {
        fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error('Selected file is not accessible');
        }
        filePayload.size = fileInfo.size || 0;
        console.debug('[useAvatarUpload] Native file validated, size:', fileInfo.size);
      } catch (fsError) {
        console.warn('[useAvatarUpload] File validation failed, proceeding anyway:', fsError);
      }
    }

    console.debug('[useAvatarUpload] Uploading avatar', { 
      fileName: filePayload.name,
      bucketId: config.bucketId, 
      size: filePayload.size,
      mimeType: filePayload.type 
    });

    // Step 1: Upload to Appwrite Storage with timeout
    console.debug('[useAvatarUpload] Starting file upload to storage...');
    let file;
    
    try {
      // Add a timeout promise to prevent hanging uploads
      const uploadPromise = storage.createFile(config.bucketId, ID.unique(), filePayload);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      );
      
      file = await Promise.race([uploadPromise, timeoutPromise]) as any;
      console.debug('[useAvatarUpload] File uploaded successfully', { fileId: file.$id });
    } catch (uploadError) {
      console.error('[useAvatarUpload] Storage upload failed:', uploadError);
      throw new Error(`Failed to upload image to storage: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }

    // Step 2: Generate public URL for the uploaded file
    // Using getFileView for public access - this is the key to getting the correct URL
    const publicUrl = storage.getFileView(config.bucketId, file.$id).toString();
    console.debug('[useAvatarUpload] Generated public URL', { publicUrl });

    // Step 3: Update user profile document in database
    const documentId = `user_${userId}`;
    const profileData = {
      user_id: userId,
      avatar_bucket_id: config.bucketId,
      avatar_file_id: file.$id,
      avatar_url: publicUrl,
      avatarUrl: publicUrl, // Also update the new attribute
    };

    try {
      // Try to update existing document first
      await databases.updateDocument(
        config.databaseId,
        config.collectionId,
        documentId,
        profileData
      );
      console.debug('[useAvatarUpload] Updated existing profile document');
    } catch (updateError) {
      console.debug('[useAvatarUpload] Update failed, creating new document', updateError);
      try {
        // If update fails, create new document
        await databases.createDocument(
          config.databaseId,
          config.collectionId,
          documentId,
          profileData
        );
        console.debug('[useAvatarUpload] Created new profile document');
      } catch (createError) {
        console.error('[useAvatarUpload] Failed to create profile document:', createError);
        throw new Error('Failed to update user profile with new avatar');
      }
    }

    const result: AvatarUploadResult = {
      bucketId: config.bucketId,
      fileId: file.$id,
      url: publicUrl,
    };

    return result;
  }, [userId, getConfig]);

  /**
   * Request camera permissions and take a photo
   */
  const pickImageFromCamera = useCallback(async (): Promise<AvatarUploadResult | null> => {
    try {
      setIsUploading(true);
      setUploadError(null);

      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        throw new Error('Camera permission is required to take photos');
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatars
        quality: 0.8,
        base64: false, // We don't need base64, just the URI
      });

      if (result.canceled || !result.assets?.length) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        throw new Error('No image URI received from camera');
      }

      const uploadResult = await uploadImageFromUri(asset.uri);
      onSuccess?.(uploadResult);
      return uploadResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to take photo';
      console.error('[useAvatarUpload] Camera error:', error);
      setUploadError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [uploadImageFromUri, onSuccess, onError]);

  /**
   * Request gallery permissions and pick an image
   */
  const pickImageFromGallery = useCallback(async (): Promise<AvatarUploadResult | null> => {
    try {
      setIsUploading(true);
      setUploadError(null);

      // Request media library permissions
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaPermission.status !== 'granted') {
        throw new Error('Photo library permission is required to select images');
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatars
        quality: 0.8,
        base64: false, // We don't need base64, just the URI
      });

      if (result.canceled || !result.assets?.length) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        throw new Error('No image URI received from gallery');
      }

      const uploadResult = await uploadImageFromUri(asset.uri);
      onSuccess?.(uploadResult);
      return uploadResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select image';
      console.error('[useAvatarUpload] Gallery error:', error);
      setUploadError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [uploadImageFromUri, onSuccess, onError]);

  /**
   * Show action sheet to let user choose between camera and gallery
   */
  const pickAndUploadAvatar = useCallback(async (): Promise<AvatarUploadResult | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Photo',
        'Choose how you would like to select your profile photo',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const result = await pickImageFromCamera();
              resolve(result);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await pickImageFromGallery();
              resolve(result);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true }
      );
    });
  }, [pickImageFromCamera, pickImageFromGallery]);

  return {
    isUploading,
    uploadError,
    pickAndUploadAvatar,
    pickImageFromCamera,
    pickImageFromGallery,
    uploadImageFromUri,
    clearError,
  };
}