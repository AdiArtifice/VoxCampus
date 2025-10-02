import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { Comment } from '@/hooks/useComments';

interface CommentItemProps {
  comment: Comment;
  onDelete?: (commentId: string) => void;
  canDelete?: boolean;
  formatTimestamp: (timestamp: string) => string;
}

/**
 * Individual comment display component
 * Shows user avatar, name, comment text, and timestamp
 * Includes delete option for comment owner
 */
const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDelete,
  canDelete = false,
  formatTimestamp
}) => {
  return (
    <View style={styles.container}>
      {/* User Avatar */}
      <View style={styles.avatarContainer}>
        {comment.userAvatar ? (
          <Image 
            source={{ uri: comment.userAvatar }} 
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {(comment.userName?.[0] || 'U').toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Comment Content */}
      <View style={styles.contentContainer}>
        {/* User Name and Timestamp */}
        <View style={styles.headerRow}>
          <Text style={styles.userName}>{comment.userName}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(comment.createdAt)}</Text>
          
          {/* Delete Button (only for comment owner) */}
          {canDelete && onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(comment.$id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Comment Text */}
        <Text style={styles.commentText}>{comment.commentText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.white
  },
  avatarContainer: {
    marginRight: SIZES.sm
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray
  },
  avatarPlaceholder: {
    backgroundColor: '#4a90e2', // VoxCampus primary color
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: COLORS.white,
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '600'
  },
  contentContainer: {
    flex: 1
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  userName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginRight: SIZES.xs
  },
  timestamp: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.gray,
    flex: 1
  },
  deleteButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -1 // Adjust for visual centering
  },
  commentText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20
  }
});

export default CommentItem;