import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import type { ProfileEducation } from '@/context/AuthContext';
import { UserAvatar } from '@/components/Avatar';

type ProfileHeaderProps = {
  name: string;
  college?: string;
  description?: string;
  userId: string; // Changed from avatarUrl to userId for automatic fetching
  education?: ProfileEducation;
  stats?: { label: string; value: string | number }[];
  onPressChangeAvatar?: () => void;
  isUploadingAvatar?: boolean;
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  college = 'SJCEM',
  description = 'Student at St. John College of Engineering and Management',
  userId,
  education,
  stats = [],
  onPressChangeAvatar,
  isUploadingAvatar = false,
}) => {
  const renderStat = ({ label, value }: { label: string; value: string | number }, index: number) => (
    <View key={`${label}-${index}`} style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground}>
        <View style={styles.avatarContainer}>
          <UserAvatar
            userId={userId}
            size={90}
            onEditPress={onPressChangeAvatar}
            isUploading={isUploadingAvatar}
            userName={name}
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
          {education?.program ? (
            <Text style={styles.college}>{education.program}</Text>
          ) : (
            <Text style={styles.college}>{college}</Text>
          )}
          {education?.department || education?.year ? (
            <Text style={styles.subTitle}>
              {[education?.department, education?.year].filter(Boolean).join(' • ')}
            </Text>
          ) : null}
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      {stats.length ? (
        <View style={styles.statsRow}>
          {stats.map(renderStat)}
        </View>
      ) : null}
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
    alignSelf: 'center',
    marginBottom: SIZES.md
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
  subTitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: SIZES.sm,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    marginTop: -SIZES.xl,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.borderRadius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.black,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ProfileHeader;
