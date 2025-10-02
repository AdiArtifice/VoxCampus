import React, { useState, useCallback, Fragment, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import IconLike from '@/assets/images/IconLike';
import IconComment from '@/assets/images/IconComment';
import IconShare from '@/assets/images/IconShare';
import IconSave from '@/assets/images/IconSave';
import { useLikes } from '@/hooks/useLikes';
import { useComments } from '@/hooks/useComments';
import { useShare } from '@/hooks/useShare';
import Comments from './Comments';

type PostCardProps = {
  postId: string; // Required for likes and comments functionality
  userName: string;
  userAvatar?: string;
  content?: string;
  image?: string;
  rsvpUrl?: string;
  meetingUrl?: string;
  infoUrl?: string;
  onShare?: () => void;
  onSave?: () => void;
};

const PostCard: React.FC<PostCardProps> = ({
  postId,
  userName,
  userAvatar,
  content,
  image,
  rsvpUrl,
  meetingUrl,
  infoUrl,
  onShare,
  onSave
}) => {
  // Likes functionality using custom hook
  const { isLiked, likesCount, toggleLike, loading: likesLoading } = useLikes(postId);
  
  // Comments functionality using custom hook
  const { commentsCount } = useComments(postId);
  
  // Share functionality using custom hook
  const { sharePost, isSharing, shareWithOptions } = useShare();
  
  // Comments section visibility state
  const [showComments, setShowComments] = useState(false);
  
  // Existing state management
  const [avatarFailed, setAvatarFailed] = useState(false);
  const onAvatarError = useCallback(() => setAvatarFailed(true), []);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (image) {
      // Fetch intrinsic size to compute aspect-fit height
      Image.getSize(
        image,
        (w, h) => { if (mounted) setImgSize({ w, h }); },
        () => { if (mounted) setImgSize(null); }
      );
    } else {
      setImgSize(null);
    }
    return () => { mounted = false; };
  }, [image]);

  const openUrl = useCallback(async (url?: string) => {
    if (!url) return;
    try {
      const safe = /^(http|https):\/\//i.test(url) ? url : `https://${url}`;
      const can = await Linking.canOpenURL(safe);
      if (can) await Linking.openURL(safe);
    } catch {
      // silently ignore
    }
  }, []);

  // Extract title from content (first line or first sentence)
  const extractTitle = useCallback((text?: string): string => {
    if (!text) return 'Untitled Post';
    
    // Split by lines and take the first non-empty line
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // If the first line is longer than 80 characters, truncate at word boundary
      if (firstLine.length > 80) {
        const truncated = firstLine.substring(0, 80);
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '...' : truncated + '...';
      }
      return firstLine;
    }
    
    return 'Untitled Post';
  }, []);

  // Share handler - Enhanced with title extraction
  const handleShare = useCallback(async () => {
    if (isSharing) return; // Prevent multiple simultaneous shares
    
    try {
      const postTitle = extractTitle(content);
      const result = await shareWithOptions(
        postId, 
        postTitle, 
        `Check out this post: "${postTitle}"`
      );
      
      if (result.success && result.shared) {
        // Could show a subtle success indicator if desired
        console.log('Post shared successfully');
      } else if (result.copied) {
        Alert.alert('Link Copied', 'The post link has been copied to your clipboard.');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Error', 'Unable to share this post. Please try again.');
    }
  }, [postId, content, isSharing, shareWithOptions, extractTitle]);

  const renderContent = useCallback(() => {
    if (!content) return null;
    
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    
    // If not expanded, show only title with "Show More" button
    if (!isExpanded) {
      const title = extractTitle(content);
      return (
        <View>
          <Text style={styles.titleText}>{title}</Text>
          <TouchableOpacity 
            style={styles.showMoreButton} 
            onPress={() => setIsExpanded(true)}
          >
            <Text style={styles.showMoreText}>Show More</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // If expanded, show full content with "Show Less" button
    const parts = content.split(urlRegex);
    const fullContentElement = parts.length === 1 ? 
      <Text style={styles.contentText}>{content}</Text> :
      <Text style={styles.contentText}>
        {parts.map((part, idx) => {
          if (urlRegex.test(part)) {
            // Reset lastIndex for subsequent tests
            urlRegex.lastIndex = 0;
            return (
              <Text key={idx} style={styles.linkText} onPress={() => openUrl(part)}>
                {part}
              </Text>
            );
          }
          return <Fragment key={idx}>{part}</Fragment>;
        })}
      </Text>;
    
    return (
      <View>
        {fullContentElement}
        <TouchableOpacity 
          style={styles.showLessButton} 
          onPress={() => setIsExpanded(false)}
        >
          <Text style={styles.showLessText}>Show Less</Text>
        </TouchableOpacity>
      </View>
    );
  }, [content, openUrl, isExpanded, extractTitle]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {userAvatar && !avatarFailed ? (
            <Image source={{ uri: userAvatar }} style={styles.avatarImage} onError={onAvatarError} />
          ) : (
            <View style={[styles.avatarImage, styles.avatarPlaceholder]} />
          )}
        </View>
        <Text style={styles.userName}>{userName}</Text>
      </View>

      <View style={styles.content}>
        {content && renderContent()}
        {image && (
          <View
            style={styles.contentImageWrap}
            onLayout={({ nativeEvent }) => setContentWidth(nativeEvent.layout.width)}
          >
            <Image
              source={{ uri: image }}
              style={{
                width: '100%',
                height: (() => {
                  if (!contentWidth) return 240;
                  if (imgSize && imgSize.w > 0) {
                    const aspect = imgSize.h / imgSize.w;
                    const h = contentWidth * aspect;
                    // Clamp to reasonable bounds
                    return Math.max(160, Math.min(h, 480));
                  }
                  return 240;
                })(),
                backgroundColor: COLORS.lightGray
              }}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      {(rsvpUrl || meetingUrl || infoUrl) && (
        <View style={styles.ctaRow}>
          {rsvpUrl && (
            <TouchableOpacity style={styles.ctaButton} onPress={() => openUrl(rsvpUrl)}>
              <Text style={styles.ctaText}>RSVP</Text>
            </TouchableOpacity>
          )}
          {meetingUrl && (
            <TouchableOpacity style={styles.ctaButton} onPress={() => openUrl(meetingUrl)}>
              <Text style={styles.ctaText}>Join</Text>
            </TouchableOpacity>
          )}
          {infoUrl && (
            <TouchableOpacity style={styles.ctaButton} onPress={() => openUrl(infoUrl)}>
              <Text style={styles.ctaText}>More Info</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.actions}>
        {/* Like Button - Changes color when liked, shows loading state */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={toggleLike}
          disabled={likesLoading}
        >
          <IconLike 
            width={30} 
            height={30} 
            color={isLiked ? '#4a90e2' : COLORS.black} // VoxCampus primary color when liked
          />
        </TouchableOpacity>
        
        {/* Comment Button - Opens/closes comments section */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowComments(!showComments)}
        >
          <IconComment 
            width={30} 
            height={30} 
            color={showComments ? '#4a90e2' : COLORS.black} // Highlight when comments are open
          />
        </TouchableOpacity>
        
        {/* Share Button */}
        <TouchableOpacity 
          style={[styles.actionButton, isSharing && styles.actionButtonDisabled]} 
          onPress={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <IconShare width={30} height={30} />
          )}
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        {/* Save Button */}
        <TouchableOpacity style={styles.actionButton} onPress={onSave}>
          <IconSave width={25} height={25} />
        </TouchableOpacity>
      </View>

      {/* Stats Section - Shows likes and comments count */}
      <View style={styles.stats}>
        <View style={styles.statsLeft}>
          {/* Likes Count Display */}
          <Text style={styles.likesText}>
            {likesCount > 0 ? `${likesCount} ${likesCount === 1 ? 'like' : 'likes'}` : ''}
          </Text>
        </View>
        
        <View style={styles.statsRight}>
          {/* Comments Count Display */}
          <Text style={styles.commentsText}>
            Comment {commentsCount.toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      {/* Comments Section - Collapsible */}
      <Comments
        postId={postId}
        isVisible={showComments}
        onClose={() => setShowComments(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SIZES.md,
    backgroundColor: COLORS.gray,
    borderRadius: SIZES.borderRadius.sm,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.sm,
    height: 59
  },
  avatar: {
    width: 43,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    marginRight: SIZES.sm
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary
  },
  userName: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.black
  },
  content: {
    width: '100%',
    backgroundColor: COLORS.gray
  },
  contentText: {
    padding: SIZES.sm,
    fontFamily: FONTS.body,
    fontSize: 14
  },
  contentImageWrap: {
    width: '100%'
  },
  ctaRow: {
    flexDirection: 'row',
    gap: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    paddingTop: SIZES.xs
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  ctaText: {
    color: COLORS.white,
    fontFamily: FONTS.body,
    fontSize: 12
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.white,
    marginTop: 12
  },
  linkText: {
    color: '#1F6FEB'
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
    height: 42
  },
  actionButton: {
    marginRight: SIZES.lg
  },
  spacer: {
    flex: 1
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.xs,
    paddingTop: SIZES.xs
  },
  statsLeft: {
    flex: 1,
    justifyContent: 'flex-start'
  },
  statsRight: {
    flex: 1,
    alignItems: 'flex-end'
  },
  likesText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#4a90e2', // VoxCampus primary color for likes
    fontWeight: '500'
  },
  commentsText: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.white
  },
  titleText: {
    padding: SIZES.sm,
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black
  },
  showMoreButton: {
    paddingHorizontal: SIZES.sm,
    paddingBottom: SIZES.xs,
    alignSelf: 'flex-start'
  },
  showMoreText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500'
  },
  showLessButton: {
    paddingHorizontal: SIZES.sm,
    paddingTop: SIZES.xs,
    alignSelf: 'flex-start'
  },
  showLessText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500'
  },
  actionButtonDisabled: {
    opacity: 0.6
  }
});

export default PostCard;
