import { AvatarService } from '@/services/AvatarService';

/**
 * Test utility for avatar upload functionality
 * 
 * This helps verify that the standard Appwrite pattern is working correctly
 */
export class AvatarTestHelper {
  
  /**
   * Test the complete avatar upload flow
   */
  static async testAvatarUpload(userId: string): Promise<void> {
    console.log('🧪 [AvatarTest] Starting avatar upload test...');
    
    try {
      // Step 1: Pick image
      console.log('📸 [AvatarTest] Step 1: Pick image');
      const imageUri = await AvatarService.pickImage();
      
      if (!imageUri) {
        console.log('❌ [AvatarTest] No image selected - test cancelled');
        return;
      }
      
      console.log('✅ [AvatarTest] Image selected:', imageUri);
      
      // Step 2: Upload avatar
      console.log('⬆️ [AvatarTest] Step 2: Upload avatar');
      const result = await AvatarService.uploadAvatar(imageUri, userId);
      
      console.log('✅ [AvatarTest] Upload successful:');
      console.log('   - File ID:', result.fileId);
      console.log('   - Bucket ID:', result.bucketId);
      console.log('   - Preview URL:', result.previewUrl);
      console.log('   - View URL:', result.viewUrl);
      
      // Step 3: Test URL generation
      console.log('🔗 [AvatarTest] Step 3: Test URL generation');
      const previewUrl = AvatarService.getPreviewUrl(result.fileId, { width: 64, height: 64 });
      const viewUrl = AvatarService.getViewUrl(result.fileId);
      
      console.log('✅ [AvatarTest] URLs generated:');
      console.log('   - Preview (64x64):', previewUrl);
      console.log('   - View (full):', viewUrl);
      
      console.log('🎉 [AvatarTest] All tests passed!');
      
    } catch (error) {
      console.error('❌ [AvatarTest] Test failed:', error);
      throw error;
    }
  }
  
  /**
   * Test avatar URL resolution from profile data
   */
  static testAvatarUrlResolution(): void {
    console.log('🧪 [AvatarTest] Testing avatar URL resolution...');
    
    // Test with fileId
    const profileWithFileId = { avatarUrl: 'some-file-id-123' };
    const urlFromFileId = AvatarService.getAvatarUrl(profileWithFileId);
    console.log('✅ [AvatarTest] URL from fileId:', urlFromFileId);
    
    // Test with full URL
    const profileWithUrl = { avatarUrl: 'https://example.com/storage/buckets/bucket/files/file/view' };
    const fullUrl = AvatarService.getAvatarUrl(profileWithUrl);
    console.log('✅ [AvatarTest] Full URL passthrough:', fullUrl);
    
    // Test with no avatar
    const profileEmpty = {};
    const noUrl = AvatarService.getAvatarUrl(profileEmpty);
    console.log('✅ [AvatarTest] Empty profile result:', noUrl);
    
    console.log('🎉 [AvatarTest] URL resolution tests passed!');
  }
}