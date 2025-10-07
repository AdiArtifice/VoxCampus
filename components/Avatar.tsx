import React, { useMemo } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';
import { useUserProfile, useAvatarUrl } from '@/hooks/useUserProfile';

interface AvatarProps {
  userId: string;
  size?: number;
  showName?: boolean;
  userName?: string;
  onPress?: () => void;
  isEditable?: boolean;
  showEditIcon?: boolean;
  style?: any;
}

/**
 * Reusable Avatar component that automatically fetches and displays user avatars
 * 
 * Features:
 * - Automatic avatar URL fetching from public_users collection
 * - Fallback to user initials if no avatar
 * - Loading states
 * - Error handling
 * - Configurable size and styling
 * - Optional edit functionality
 */
export const Avatar: React.FC<AvatarProps> = ({
  userId,
  size = 50,
  showName = false,
  userName,
  onPress,
  isEditable = false,
  showEditIcon = false,
  style,
}) => {
  const { profile, isLoading } = useUserProfile({ userId });
  const avatarUrl = useAvatarUrl(profile);
  
  // Generate initials from name
  const initials = useMemo(() => {
    const name = userName || profile?.name || 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, [userName, profile?.name]);

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const renderAvatar = () => {
    if (isLoading) {
      return (
        <View style={[styles.placeholder, avatarStyle, { backgroundColor: COLORS.lightGray }]}>
          <ActivityIndicator size="small" color={COLORS.gray} />
        </View>
      );
    }

    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={[avatarStyle, styles.image]}
          onError={(error) => {
            console.warn('[Avatar] Failed to load image:', error.nativeEvent.error);
          }}
        />
      );
    }

    // Fallback to initials
    return (
      <View style={[styles.placeholder, avatarStyle, { backgroundColor: COLORS.primary }]}>
        <Text 
          style={[
            styles.initials, 
            { 
              fontSize: size * 0.4,
              color: COLORS.white,
            }
          ]}
        >
          {initials}
        </Text>
      </View>
    );
  };

  const content = (
    <View style={[styles.container, style]}>
      <View style={styles.avatarWrapper}>
        {renderAvatar()}
        
        {showEditIcon && isEditable && (
          <View style={[styles.editIcon, { width: size * 0.3, height: size * 0.3 }]}>
            <Text style={[styles.editText, { fontSize: size * 0.15 }]}>✏️</Text>
          </View>
        )}
      </View>
      
      {showName && (
        <Text style={styles.nameText} numberOfLines={1}>
          {userName || profile?.name || 'Unknown User'}
        </Text>
      )}
    </View>
  );

  if (onPress || isEditable) {
    return (
      <TouchableOpacity onPress={onPress} disabled={!onPress && !isEditable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

/**
 * Avatar component specifically for the current authenticated user
 * Includes edit functionality
 */
interface UserAvatarProps extends Omit<AvatarProps, 'userId' | 'isEditable'> {
  userId: string;
  onEditPress?: () => void;
  isUploading?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  onEditPress,
  isUploading = false,
  ...props
}) => {
  return (
    <View style={styles.userAvatarContainer}>
      <Avatar
        userId={userId}
        isEditable={true}
        showEditIcon={true}
        onPress={onEditPress}
        {...props}
      />
      
      {isUploading && (
        <View style={[styles.uploadingOverlay, { 
          width: props.size || 50, 
          height: props.size || 50, 
          borderRadius: (props.size || 50) / 2 
        }]}>
          <ActivityIndicator size="small" color={COLORS.white} />
        </View>
      )}
    </View>
  );
};

/**
 * Small avatar for lists and comments
 */
export const SmallAvatar: React.FC<Omit<AvatarProps, 'size'>> = (props) => (
  <Avatar size={32} {...props} />
);

/**
 * Medium avatar for cards and profiles
 */
export const MediumAvatar: React.FC<Omit<AvatarProps, 'size'>> = (props) => (
  <Avatar size={60} {...props} />
);

/**
 * Large avatar for profile screens
 */
export const LargeAvatar: React.FC<Omit<AvatarProps, 'size'>> = (props) => (
  <Avatar size={100} {...props} />
);

/**
 * Avatar group component for showing multiple users
 */
interface AvatarGroupProps {
  userIds: string[];
  maxCount?: number;
  size?: number;
  overlap?: number;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  userIds,
  maxCount = 3,
  size = 40,
  overlap = 8,
}) => {
  const displayUserIds = userIds.slice(0, maxCount);
  const remainingCount = Math.max(0, userIds.length - maxCount);

  return (
    <View style={styles.avatarGroup}>
      {displayUserIds.map((userId, index) => (
        <View 
          key={userId}
          style={[
            styles.groupAvatar,
            {
              marginLeft: index > 0 ? -overlap : 0,
              zIndex: displayUserIds.length - index,
            }
          ]}
        >
          <Avatar userId={userId} size={size} />
        </View>
      ))}
      
      {remainingCount > 0 && (
        <View style={[
          styles.remainingCountBadge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            marginLeft: -overlap,
          }
        ]}>
          <Text style={[styles.remainingCountText, { fontSize: size * 0.3 }]}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  image: {
    // Add any image-specific styles here
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  initials: {
    fontFamily: FONTS.regular,
    fontWeight: '600',
    textAlign: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.white,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  editText: {
    textAlign: 'center',
  },
  nameText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  userAvatarContainer: {
    position: 'relative',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 50,
  },
  remainingCountBadge: {
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  remainingCountText: {
    color: COLORS.white,
    fontFamily: FONTS.regular,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Avatar;