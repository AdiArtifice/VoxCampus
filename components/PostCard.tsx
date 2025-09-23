import React, { useState, useCallback, Fragment, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import IconLike from '@/assets/images/IconLike';
import IconComment from '@/assets/images/IconComment';
import IconShare from '@/assets/images/IconShare';
import IconSave from '@/assets/images/IconSave';

type PostCardProps = {
  userName: string;
  userAvatar?: string;
  content?: string;
  image?: string;
  likesCount?: number;
  commentsCount?: number;
  rsvpUrl?: string;
  meetingUrl?: string;
  infoUrl?: string;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
};

const PostCard: React.FC<PostCardProps> = ({
  userName,
  userAvatar,
  content,
  image,
  likesCount = 0,
  commentsCount = 0,
  rsvpUrl,
  meetingUrl,
  infoUrl,
  onLike,
  onComment,
  onShare,
  onSave
}) => {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const onAvatarError = useCallback(() => setAvatarFailed(true), []);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [contentWidth, setContentWidth] = useState(0);

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

  const renderContent = useCallback(() => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const parts = content.split(urlRegex);
    if (parts.length === 1) return <Text style={styles.contentText}>{content}</Text>;
    return (
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
      </Text>
    );
  }, [content, openUrl]);

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
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <IconLike width={30} height={30} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <IconComment width={30} height={30} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <IconShare width={30} height={30} />
        </TouchableOpacity>
        <View style={styles.spacer} />
        <TouchableOpacity style={styles.actionButton} onPress={onSave}>
          <IconSave width={25} height={25} />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={styles.commentsText}>
          Comment {commentsCount.toString().padStart(2, '0')}
        </Text>
      </View>
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
    justifyContent: 'flex-end',
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.xs
  },
  commentsText: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.white
  }
});

export default PostCard;
