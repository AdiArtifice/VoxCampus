import { useState } from 'react';
import { Share, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { generateShareableUrl } from '../utils/urlShortener';
import { config, getEnvironmentInfo, buildShareablePostUrl } from '../constants/environment';

export interface ShareOptions {
  includeText?: boolean;
  customMessage?: string;
  fallbackToCopy?: boolean;
}

export interface ShareResult {
  success: boolean;
  shared?: boolean;
  copied?: boolean;
  error?: string;
  url?: string;
}

export const useShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [lastSharedUrl, setLastSharedUrl] = useState<string>('');

  /**
   * Share a post with native share dialog
   */
  const sharePost = async (
    postId: string, 
    options: ShareOptions = {}
  ): Promise<ShareResult> => {
    if (!postId) {
      return {
        success: false,
        error: 'Post ID is required'
      };
    }

    setIsSharing(true);
    
    try {
      // Always use production URL for sharing so recipients can access it
      const shareableUrl = buildShareablePostUrl(postId);
      setLastSharedUrl(shareableUrl);
      
      console.log('Sharing post with URL:', shareableUrl);

      // Prepare share content
      const defaultMessage = 'Check out this post on VoxCampus!';
      const message = options.customMessage || (options.includeText ? defaultMessage : '');
      
      const shareContent: any = {
        url: shareableUrl,
      };

      // Add message if provided and platform supports it
      if (message && Platform.OS === 'ios') {
        shareContent.message = `${message}\n\n${shareableUrl}`;
      } else if (message) {
        shareContent.title = message;
      }

      // Check if sharing is available
      const isShareAvailable = await Share.share(shareContent);

      if (Platform.OS === 'android') {
        // Android doesn't provide detailed response, assume success
        return {
          success: true,
          shared: true,
          url: shareableUrl
        };
      } else if (Platform.OS === 'ios') {
        // iOS provides more detailed response
        if (isShareAvailable.action === Share.sharedAction) {
          return {
            success: true,
            shared: true,
            url: shareableUrl
          };
        } else if (isShareAvailable.action === Share.dismissedAction) {
          return {
            success: true,
            shared: false,
            url: shareableUrl
          };
        }
      }

      // Default success case
      return {
        success: true,
        shared: true,
        url: shareableUrl
      };

    } catch (error) {
      console.error('Error sharing post:', error);
      
      // Fallback to copying URL if sharing fails and option is enabled
      if (options.fallbackToCopy) {
        try {
          const url = buildShareablePostUrl(postId);
          await Clipboard.setStringAsync(url);
          
          Alert.alert(
            'Link Copied',
            'Unable to open share dialog, but the link has been copied to your clipboard.',
            [{ text: 'OK' }]
          );
          
          return {
            success: true,
            copied: true,
            url
          };
        } catch (clipboardError) {
          return {
            success: false,
            error: 'Failed to share or copy link'
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to share post'
      };
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Copy post URL to clipboard
   */
  const copyPostUrl = async (postId: string): Promise<ShareResult> => {
    if (!postId) {
      return {
        success: false,
        error: 'Post ID is required'
      };
    }

    setIsSharing(true);

    try {
      const shareableUrl = buildShareablePostUrl(postId);
      await Clipboard.setStringAsync(shareableUrl);
      setLastSharedUrl(shareableUrl);

      return {
        success: true,
        copied: true,
        url: shareableUrl
      };
    } catch (error) {
      console.error('Error copying post URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to copy link'
      };
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Get shareable URL without triggering share dialog
   */
  const getShareableUrl = async (postId: string): Promise<string | null> => {
    try {
      const url = buildShareablePostUrl(postId);
      setLastSharedUrl(url);
      return url;
    } catch (error) {
      console.error('Error getting shareable URL:', error);
      return null;
    }
  };

  /**
   * Share with custom options for different platforms
   */
  const shareWithOptions = async (postId: string, title?: string, message?: string) => {
    return sharePost(postId, {
      includeText: true,
      customMessage: message || `${title ? `${title}\n\n` : ''}Check out this post on VoxCampus!`,
      fallbackToCopy: true
    });
  };

  /**
   * Debug function to get environment and sharing info
   */
  const getShareDebugInfo = () => ({
    ...getEnvironmentInfo(),
    lastSharedUrl,
    isSharing,
  });

  return {
    sharePost,
    copyPostUrl,
    getShareableUrl,
    shareWithOptions,
    isSharing,
    lastSharedUrl,
    getShareDebugInfo,
  };
};