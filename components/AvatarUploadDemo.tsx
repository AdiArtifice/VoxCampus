import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserAvatar, LargeAvatar } from '@/components/Avatar';

/**
 * Complete Avatar Upload Demo Component
 * 
 * This component demonstrates the complete avatar upload flow:
 * 1. Image selection (camera or gallery)
 * 2. Upload to Appwrite Storage
 * 3. Update user profile document
 * 4. Immediate UI feedback
 * 5. Error handling
 * 
 * Use this as a reference implementation for avatar upload functionality.
 */
export const AvatarUploadDemo: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [uploadingMethod, setUploadingMethod] = useState<string | null>(null);

  const { profile, isLoading: profileLoading, refresh: refreshProfile } = useUserProfile({
    userId: user?.$id || '',
  });

  const avatarUpload = useAvatarUpload({
    userId: user?.$id || '',
    onSuccess: async (result) => {
      console.log('✅ Avatar upload successful:', result);
      
      try {
        // Update user preferences for immediate UI feedback
        await updateProfile({ avatar: result });
        console.log('✅ Profile updated successfully');
        
        // Refresh profile data to ensure consistency
        await refreshProfile();
        console.log('✅ Profile data refreshed');
        
        Alert.alert('Success!', 'Your profile photo has been updated.');
      } catch (updateError) {
        console.error('❌ Profile update failed:', updateError);
        Alert.alert('Update Failed', 'The image was uploaded but failed to update your profile. Please try again.');
      }
      
      setUploadingMethod(null);
    },
    onError: (error) => {
      console.error('❌ Avatar upload failed:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload image. Please try again.');
      setUploadingMethod(null);
    },
  });

  const handleCameraPress = async () => {
    setUploadingMethod('camera');
    await avatarUpload.pickImageFromCamera();
  };

  const handleGalleryPress = async () => {
    setUploadingMethod('gallery');
    await avatarUpload.pickImageFromGallery();
  };

  const handleAutoPickPress = async () => {
    setUploadingMethod('auto');
    await avatarUpload.pickAndUploadAvatar();
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to upload an avatar</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isUploading = avatarUpload.isUploading;
  const currentAvatarUrl = profile?.avatarUrl || profile?.avatar_url;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Avatar Upload Demo</Text>
        <Text style={styles.subtitle}>Complete implementation of avatar upload system</Text>

        {/* Current Avatar Display */}
        <View style={styles.avatarSection}>
          <Text style={styles.sectionTitle}>Current Avatar</Text>
          <View style={styles.avatarContainer}>
            <LargeAvatar
              userId={user.$id}
              userName={user.name || user.email}
              showName={true}
            />
          </View>
          
          {currentAvatarUrl && (
            <Text style={styles.urlText}>URL: {currentAvatarUrl}</Text>
          )}
          
          {profileLoading && (
            <Text style={styles.statusText}>Loading profile...</Text>
          )}
        </View>

        {/* Upload Methods */}
        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>Upload Methods</Text>
          
          <TouchableOpacity
            style={[styles.methodButton, uploadingMethod === 'camera' && styles.buttonLoading]}
            onPress={handleCameraPress}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>
              {uploadingMethod === 'camera' ? '📸 Taking Photo...' : '📸 Take Photo'}
            </Text>
            <Text style={styles.buttonSubtext}>Uses camera with permissions check</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, uploadingMethod === 'gallery' && styles.buttonLoading]}
            onPress={handleGalleryPress}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>
              {uploadingMethod === 'gallery' ? '🖼️ Selecting...' : '🖼️ Choose from Gallery'}
            </Text>
            <Text style={styles.buttonSubtext}>Uses photo library with permissions check</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, styles.primaryButton, uploadingMethod === 'auto' && styles.buttonLoading]}
            onPress={handleAutoPickPress}
            disabled={isUploading}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {uploadingMethod === 'auto' ? '⚡ Uploading...' : '⚡ Smart Upload'}
            </Text>
            <Text style={[styles.buttonSubtext, styles.primaryButtonSubtext]}>
              Shows camera/gallery choice dialog (recommended)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Information */}
        {avatarUpload.uploadError && (
          <View style={styles.errorSection}>
            <Text style={styles.errorTitle}>Upload Error</Text>
            <Text style={styles.errorMessage}>{avatarUpload.uploadError}</Text>
            <TouchableOpacity
              style={styles.clearErrorButton}
              onPress={avatarUpload.clearError}
            >
              <Text style={styles.clearErrorText}>Clear Error</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upload Flow Information */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Upload Flow</Text>
          <View style={styles.flowStep}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepText}>Image selection with permissions</Text>
          </View>
          <View style={styles.flowStep}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>Upload to Appwrite Storage bucket: user_profile_images</Text>
          </View>
          <View style={styles.flowStep}>
            <Text style={styles.stepNumber}>3.</Text>
            <Text style={styles.stepText}>Generate public URL using getFileView()</Text>
          </View>
          <View style={styles.flowStep}>
            <Text style={styles.stepNumber}>4.</Text>
            <Text style={styles.stepText}>Update public_users collection with avatarUrl</Text>
          </View>
          <View style={styles.flowStep}>
            <Text style={styles.stepNumber}>5.</Text>
            <Text style={styles.stepText}>Update user preferences for immediate UI feedback</Text>
          </View>
          <View style={styles.flowStep}>
            <Text style={styles.stepNumber}>6.</Text>
            <Text style={styles.stepText}>Refresh profile data for consistency</Text>
          </View>
        </View>

        {/* Technical Details */}
        <View style={styles.techSection}>
          <Text style={styles.techTitle}>Technical Details</Text>
          <Text style={styles.techDetail}>User ID: {user.$id}</Text>
          <Text style={styles.techDetail}>Bucket ID: user_profile_images</Text>
          <Text style={styles.techDetail}>Collection ID: public_users</Text>
          <Text style={styles.techDetail}>Document ID: user_{user.$id}</Text>
          <Text style={styles.techDetail}>Status: {isUploading ? 'Uploading...' : 'Ready'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SIZES.md,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.heading,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  avatarSection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.lg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  avatarContainer: {
    marginBottom: SIZES.md,
  },
  urlText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
  statusText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
  methodsSection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.lg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  methodButton: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.md,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  primaryButtonText: {
    color: COLORS.white,
  },
  buttonSubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
  },
  primaryButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorSection: {
    backgroundColor: COLORS.error,
    borderRadius: SIZES.borderRadius.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    marginBottom: SIZES.sm,
  },
  clearErrorButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: SIZES.borderRadius.sm,
    padding: SIZES.xs,
    alignSelf: 'flex-start',
  },
  clearErrorText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.white,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.lg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  flowStep: {
    flexDirection: 'row',
    marginBottom: SIZES.sm,
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.primary,
    width: 20,
  },
  stepText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    flex: 1,
  },
  techSection: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.lg,
    padding: SIZES.md,
  },
  techTitle: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  techDetail: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    marginBottom: SIZES.xs,
  },
});

export default AvatarUploadDemo;