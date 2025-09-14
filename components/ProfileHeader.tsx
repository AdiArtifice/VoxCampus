import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

type ProfileHeaderProps = {
  name: string;
  college?: string;
  description?: string;
  avatar?: string;
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  college = 'SJCEM',
  description = 'Student at St. John College of Engineering and Management',
  avatar
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerBackground}>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.college}>{college}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerBackground: {
    backgroundColor: COLORS.profileBlue,
    padding: SIZES.md,
    paddingBottom: SIZES.xl * 2,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: SIZES.md
  },
  avatar: {
    width: '100%',
    height: '100%'
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray
  },
  infoContainer: {
    alignItems: 'center'
  },
  name: {
    fontFamily: FONTS.body,
    fontSize: 23,
    color: COLORS.white,
    marginBottom: SIZES.xs
  },
  college: {
    fontFamily: FONTS.body,
    fontSize: 25,
    color: COLORS.white,
    marginBottom: SIZES.md
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center'
  }
});

export default ProfileHeader;
