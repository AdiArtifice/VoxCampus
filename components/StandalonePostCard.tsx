import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useShare } from '@/hooks/useShare';

const { width: screenWidth } = Dimensions.get('window');

interface StandalonePostCardProps {
  postId: string;
  title: string;
  description: string;
  organizer?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  bannerUrl?: string;
  rsvpUrl?: string;
  meetingUrl?: string;
  infoUrl?: string;
  type?: string;
}

export default function StandalonePostCard({
  postId,
  title,
  description,
  organizer,
  startAt,
  endAt,
  location,
  bannerUrl,
  rsvpUrl,
  meetingUrl,
  infoUrl,
  type,
}: StandalonePostCardProps) {
  const { sharePost, isSharing } = useShare();
  const [imageError, setImageError] = useState(false);
  const [imageAspect, setImageAspect] = useState<number | null>(null);

  const handleOpenUrl = async (url: string, fallbackText: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log(`Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error(`Error opening ${fallbackText}:`, error);
    }
  };

  const handleShare = async () => {
    try {
      await sharePost(postId, { 
        includeText: true, 
        fallbackToCopy: true 
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Pre-compute safe date display (avoid reversed ranges if end < start)
  const showDateRange = (() => {
    if (startAt && endAt) {
      const s = new Date(startAt).getTime();
      const e = new Date(endAt).getTime();
      if (!isNaN(s) && !isNaN(e) && e >= s) return true;
    }
    return false;
  })();

  useEffect(() => {
    if (bannerUrl) {
      // Attempt to get intrinsic size for better aspect ratio display (web friendly)
      Image.getSize(
        bannerUrl,
        (w, h) => {
          if (w > 0 && h > 0) setImageAspect(h / w);
        },
        () => setImageAspect(null)
      );
    }
  }, [bannerUrl]);

  const renderDescription = () => {
    if (!description) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    // Split by newline first to preserve paragraphs
    const paragraphs = description.split(/\n+/);
    return (
      <View style={styles.descriptionWrapper}>
        {paragraphs.map((para, pIdx) => {
          if (!para.trim()) return <Text key={pIdx} style={styles.descriptionEmptyLine}> </Text>;
          const parts = para.split(urlRegex);
            return (
              <Text key={pIdx} style={styles.description}>
                {parts.map((part, idx) => {
                  if (urlRegex.test(part)) {
                    urlRegex.lastIndex = 0; // reset for subsequent tests
                    return (
                      <Text
                        key={idx}
                        style={styles.linkText}
                        onPress={() => handleOpenUrl(part, 'Link')}
                      >
                        {part}
                      </Text>
                    );
                  }
                  return <Text key={idx}>{part}</Text>;
                })}
                {pIdx < paragraphs.length - 1 ? '\n' : ''}
              </Text>
            );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.organizerInfo}>
          <View style={styles.organizerAvatar}>
            <Text style={styles.organizerInitial}>
              {organizer ? organizer.charAt(0).toUpperCase() : 'V'}
            </Text>
          </View>
          <View style={styles.organizerDetails}>
            <Text style={styles.organizerName}>{organizer || 'VoxCampus'}</Text>
            {type && (
              <Text style={styles.postType}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        
        {/* Event Details */}
        {startAt && (
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>
                {formatDate(startAt)}
                {showDateRange && endAt && ` - ${formatDate(endAt)}`}
              </Text>
            </View>
            
            {startAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🕒</Text>
                <Text style={styles.detailText}>
                  {formatTime(startAt)}
                  {showDateRange && endAt && ` - ${formatTime(endAt)}`}
                </Text>
              </View>
            )}
            
            {location && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>{location}</Text>
              </View>
            )}
          </View>
        )}

        {/* Banner Image */}
        {bannerUrl && !imageError && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: bannerUrl }}
              style={[
                styles.bannerImage,
                imageAspect
                  ? { height: Math.min(400, Math.max(160, (screenWidth > 640 ? 600 : screenWidth - 32) * imageAspect)) }
                  : null,
              ]}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Description with linkification & preserved paragraphs */}
        {renderDescription()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {rsvpUrl && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleOpenUrl(rsvpUrl, 'RSVP')}
            >
              <Text style={styles.primaryButtonText}>RSVP</Text>
            </TouchableOpacity>
          )}
          
          {meetingUrl && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleOpenUrl(meetingUrl, 'Meeting')}
            >
              <Text style={styles.secondaryButtonText}>Join Meeting</Text>
            </TouchableOpacity>
          )}
          
          {infoUrl && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleOpenUrl(infoUrl, 'More Info')}
            >
              <Text style={styles.secondaryButtonText}>More Info</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Social Actions */}
        <View style={styles.socialActions}>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialIcon}>👍</Text>
            <Text style={styles.socialText}>Like</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialIcon}>💬</Text>
            <Text style={styles.socialText}>Comment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={handleShare}
            disabled={isSharing}
          >
            <Text style={styles.socialIcon}>📤</Text>
            <Text style={styles.socialText}>
              {isSharing ? 'Sharing...' : 'Share'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.lg,
    marginHorizontal: SIZES.md,
    marginVertical: SIZES.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    // Allow description / image shadows to render fully
    overflow: Platform.OS === 'web' ? 'visible' : 'hidden',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  organizerInitial: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  organizerDetails: {
    flex: 1,
  },
  organizerName: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  postType: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gray,
    textTransform: 'capitalize',
  },
  content: {
    padding: SIZES.md,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SIZES.md,
    lineHeight: 28,
  },
  eventDetails: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: SIZES.sm,
    width: 20,
  },
  detailText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
  },
  imageContainer: {
    marginBottom: SIZES.md,
    borderRadius: SIZES.borderRadius.md,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 200, // default; dynamic height may override
    backgroundColor: COLORS.lightGray,
  },
  descriptionWrapper: {
    marginBottom: SIZES.lg,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.black,
    lineHeight: 24,
    textAlign: 'left',
  },
  descriptionEmptyLine: {
    lineHeight: 12,
  },
  linkText: {
    color: '#1F6FEB',
    textDecorationLine: 'underline',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  actionButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  primaryButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  socialActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.borderRadius.sm,
  },
  socialIcon: {
    fontSize: 18,
    marginRight: SIZES.xs,
  },
  socialText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
});