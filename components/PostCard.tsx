import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
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
  onLike,
  onComment,
  onShare,
  onSave
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarImage, styles.avatarPlaceholder]} />
          )}
        </View>
        <Text style={styles.userName}>{userName}</Text>
      </View>

      <View style={styles.content}>
        {content && <Text style={styles.contentText}>{content}</Text>}
        {image && (
          <Image
            source={{ uri: image }}
            style={styles.contentImage}
            resizeMode="cover"
          />
        )}
      </View>

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
  contentImage: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.lightGray
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.white,
    marginTop: 12
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
