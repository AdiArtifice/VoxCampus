import { storage, databases, account, ID } from '@/lib/appwrite';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Prefer environment overrides but fall back to known constants
const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID || 'user_profile_images';
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '68c58e83000a2666b4d9';
const PROFILES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_USERS_COLLECTION_ID || 'public_users';

export interface AvatarUploadResult {
  fileId: string;
  bucketId: string;
  previewUrl: string;
  viewUrl: string;
}

/**
 * Standard Appwrite Avatar Upload Service
 * 
 * Follows the recommended pattern:
 * 1. Upload image to Storage bucket with createFile
 * 2. Save fileId in user profile document
 * 3. Use getFilePreview/getFileView for display
 */
export class AvatarService {
  
  /**
   * Upload image and save fileId to user profile
   */
  static async uploadAvatar(imageUri: string, userId: string): Promise<AvatarUploadResult> {
    console.log('🚀 [AvatarService] Starting avatar upload', {
      userId,
      platform: Platform.OS,
      bucket: BUCKET_ID,
      database: DATABASE_ID,
      collection: PROFILES_COLLECTION_ID,
      uriStartsWith: imageUri?.slice(0, 12)
    });

    if (!imageUri) throw new Error('No image URI provided');
    if (!userId) throw new Error('Missing userId');

    await this.ensureSession();

    // Step 1: Normalize file for platform
    const normalized = await this.prepareFileForUpload(imageUri);
    console.log('🧾 [AvatarService] Normalized file ready', {
      name: normalized.name,
      type: normalized.type,
      uri: normalized.uri,
      size: normalized.size
    });

    // Step 2: Upload to Storage
    const fileId = await this.uploadToStorageWithFile(normalized);

    // Step 3: Persist fileId to profile
    await this.saveFileIdToProfile(userId, fileId);

    // Step 4: URLs
    const previewUrl = this.getPreviewUrl(fileId, { width: 128, height: 128 });
    const viewUrl = this.getViewUrl(fileId);

    console.log('✅ [AvatarService] Upload complete');
    return { fileId, bucketId: BUCKET_ID, previewUrl, viewUrl };
  }
  
  /**
   * Pick image using ImagePicker
   */
  static async pickImage(): Promise<string | null> {
    console.log('📸 [AvatarService] Requesting image picker permissions');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') throw new Error('Photo library permission required');

    const includeBase64 = Platform.OS === 'ios'; // ph:// handling fallback
    console.log('🖼️ [AvatarService] Opening picker (base64:', includeBase64, ')');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: includeBase64,
    });

    if (result.canceled || !result.assets?.length) {
      console.log('❌ [AvatarService] User canceled image selection');
      return null;
    }
    const asset = result.assets[0];
    console.log('✅ [AvatarService] Image selected', { uri: asset.uri, base64: !!asset.base64 });
    return asset.uri;
  }
  
  /**
   * Upload file to Storage bucket
   */
  private static async uploadToStorage(imageUri: string): Promise<string> {
    // legacy path kept for backwards compatibility
    const file = await this.prepareFileForUpload(imageUri);
    return this.uploadToStorageWithFile(file);
  }

  private static async uploadToStorageWithFile(filePayload: { uri: string; name: string; type: string; size?: number }): Promise<string> {
    console.log('⬆️ [AvatarService] Uploading prepared file to bucket', {
      bucket: BUCKET_ID,
      name: filePayload.name,
      type: filePayload.type,
      uri: filePayload.uri,
      size: filePayload.size
    });
    try {
      const fileId = ID.unique();
      const file = await storage.createFile(
        BUCKET_ID,
        fileId,
        { ...filePayload, size: filePayload.size ?? 0 }
      );
      console.log('✅ [AvatarService] File uploaded', { fileId: file.$id });
      return file.$id;
    } catch (error: any) {
      console.error('❌ [AvatarService] Upload failed raw error:', error);
      const message = error?.message || error?.response?.message || JSON.stringify(error);
      throw new Error(`Failed to upload: ${message}`);
    }
  }

  private static async prepareFileForUpload(uri: string): Promise<{ uri: string; name: string; type: string; size?: number }> {
    let workingUri = uri;
    const fileName = `avatar-${Date.now()}.jpg`;
    const type = 'image/jpeg';

    try {
      // iOS: ph:// scheme needs conversion
      if (Platform.OS === 'ios' && workingUri.startsWith('ph://')) {
        console.log('� [AvatarService] Converting ph:// asset');
        // Attempt to leverage FileSystem (may need MediaLibrary for more robust solution)
        // Fallback: throw explicit error for now
        throw new Error('iOS ph:// URI not directly readable. Need MediaLibrary copy implementation.');
      }

      // Web: fetch to blob then write to temp (not always required for react-native-appwrite, but safer)
      if (Platform.OS === 'web' && workingUri.startsWith('blob:')) {
        console.log('🌐 [AvatarService] Converting blob: URL');
        const res = await fetch(workingUri);
        const blob = await res.blob();
        // Create object URL again (react-native-appwrite might accept original, keep as is)
        // For now we proceed with original URI; debug size
        console.log('🌐 [AvatarService] Blob size', blob.size);
      }

      // Attempt to stat file
      let size: number | undefined = undefined;
      try {
        const info = await FileSystem.getInfoAsync(workingUri);
        if (info.exists) size = info.size;
      } catch {
        // ignore
      }

      return { uri: workingUri, name: fileName, type, size };
    } catch (prepError) {
      console.warn('⚠️ [AvatarService] File prep fallback triggered', prepError);
      return { uri: workingUri, name: fileName, type };
    }
  }

  private static async ensureSession(): Promise<void> {
    try {
      const user = await account.get();
      if (!user) throw new Error('No active user session');
    } catch (err) {
      console.error('❌ [AvatarService] No active session', err);
      throw new Error('User not authenticated. Please log in again.');
    }
  }
  
  /**
   * Save fileId to user profile document
   */
  private static async saveFileIdToProfile(userId: string, fileId: string): Promise<void> {
    console.log('💾 [AvatarService] Saving fileId to profile', { userId, fileId });
    try {
      await databases.updateDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        userId,
        { avatarUrl: fileId }
      );
      console.log('✅ [AvatarService] Profile updated');
    } catch (error: any) {
      const msg = error?.message || error?.response?.message || JSON.stringify(error);
      console.error('❌ [AvatarService] Profile update failed', msg);
      throw new Error(`Failed to save avatar reference: ${msg}`);
    }
  }
  
  /**
   * Generate preview URL (resized/optimized)
   */
  static getPreviewUrl(fileId: string, options?: { width?: number; height?: number; quality?: number }): string {
    const url = storage.getFilePreview(
      BUCKET_ID,
      fileId,
      options?.width || 128,
      options?.height || 128
    );
    
    return url.toString();
  }
  
  /**
   * Generate view URL (full size)
   */
  static getViewUrl(fileId: string): string {
    const url = storage.getFileView(BUCKET_ID, fileId);
    return url.toString();
  }

  /**
   * Get avatar URL from profile - supports both fileId and direct URL
   */
  static getAvatarUrl(profile: { avatarUrl?: string; avatarFileId?: string }): string | undefined {
    // If avatarUrl is already a full URL, return it
    if (profile.avatarUrl && (profile.avatarUrl.startsWith('http') || profile.avatarUrl.includes('/storage/buckets/'))) {
      return profile.avatarUrl;
    }
    
    // If we have avatarFileId or avatarUrl contains just the fileId
    const fileId = profile.avatarFileId || profile.avatarUrl;
    if (fileId && !fileId.startsWith('http')) {
      return this.getPreviewUrl(fileId, { width: 128, height: 128 });
    }
    
    return undefined;
  }
}

export default AvatarService;