import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileEditModal, { ProfileFormValues } from '@/components/ProfileEditModal';
import { useAuth } from '@/hooks/useAuth';
import type { ProfilePreferences, ProfileProject } from '@/context/AuthContext';
import { databases, Query } from '@/lib/appwrite';
import { APPWRITE } from '@/lib/config';
import { simpleAvatarUpload, testStorageConnection } from '@/utils/simpleAvatarUpload';
import { AvatarService } from '../services/AvatarService';

type ActivityItem = {
  id: string;
  type: 'membership' | 'post';
  title: string;
  description: string;
  timestamp: string;
};

type AssociationDoc = {
  $id: string;
  name?: string;
  type?: string | null;
};

const databaseId =
  (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string) || APPWRITE.DATABASE_ID || '68c58e83000a2666b4d9';
const associationCollectionId =
  (process.env.EXPO_PUBLIC_APPWRITE_ASSOCIATION_COLLECTION_ID as string) || 'association';
const postsCollectionId = APPWRITE.POSTS_COLLECTION_ID || 'events_and_sessions';

const resolveStorageUrl = (bucketId?: string | null, fileId?: string | null) => {
  if (!bucketId || !fileId) return undefined;
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !project) return undefined;
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${project}`;
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    user,
    logout,
    userMemberships,
    updateProfile,
    uploadAvatar,
    refreshMemberships,
  } = useAuth();

  const profilePrefs = useMemo(
    () => ((user?.prefs as any)?.profile ?? {}) as ProfilePreferences,
    [user?.prefs]
  );

  const followedIds = useMemo(() => {
    const raw = (user?.prefs as any)?.followedAssociations;
    return Array.isArray(raw) ? (raw.filter(Boolean) as string[]) : [];
  }, [user?.prefs]);

  const [editVisible, setEditVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [followedAssociations, setFollowedAssociations] = useState<AssociationDoc[]>([]);
  const [followedLoading, setFollowedLoading] = useState(false);

  const avatarUrl = useMemo(() => {
    if (profilePrefs.avatar?.url) {
      return profilePrefs.avatar.url;
    }
    return resolveStorageUrl(profilePrefs.avatar?.bucketId, profilePrefs.avatar?.fileId);
  }, [profilePrefs.avatar?.bucketId, profilePrefs.avatar?.fileId, profilePrefs.avatar?.url]);

  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(avatarUrl);

  useEffect(() => {
    setAvatarPreview(avatarUrl);
  }, [avatarUrl]);

  const skills = profilePrefs.skills ?? [];
  const projects = profilePrefs.projects ?? [];
  const socialLinks = profilePrefs.socialLinks ?? {};
  const achievements = profilePrefs.achievements ?? [];
  const education = profilePrefs.education;
  const bio =
    profilePrefs.bio?.trim() ||
    'Add a short bio to let fellow students know about your interests, goals, and campus journey.';

  const stats = useMemo(
    () => [
      { label: 'Associations', value: userMemberships.length || '—' },
      { label: 'Skills', value: skills.length || '—' },
      { label: 'Projects', value: projects.length || '—' },
    ],
    [projects.length, skills.length, userMemberships.length]
  );

  const fetchFollowedAssociations = useCallback(async () => {
    if (!followedIds.length || !databaseId || !associationCollectionId) {
      setFollowedAssociations([]);
      return;
    }

    setFollowedLoading(true);
    try {
      const response = await databases.listDocuments(databaseId, associationCollectionId, [
        Query.equal('$id', followedIds),
        Query.limit(followedIds.length),
      ]);
      setFollowedAssociations(response.documents as AssociationDoc[]);
    } catch (error) {
      console.error('Failed to load followed associations', error);
    } finally {
      setFollowedLoading(false);
    }
  }, [associationCollectionId, followedIds]);

  useEffect(() => {
    fetchFollowedAssociations();
  }, [fetchFollowedAssociations]);

  const loadActivityFeed = useCallback(async () => {
    if (!user?.$id) {
      setActivities([]);
      return;
    }

    setActivitiesLoading(true);
    setActivitiesError(null);

    try {
      const membershipActivities: ActivityItem[] = userMemberships.map(membership => ({
        id: `membership-${membership.$id}`,
        type: 'membership',
        title: membership.organization?.name || 'Association Membership',
        description: membership.role ? `Joined as ${membership.role}` : 'Joined the association',
        timestamp: membership.joinedAt || new Date().toISOString(),
      }));

      let postActivities: ActivityItem[] = [];
      if (databaseId && postsCollectionId) {
        try {
          const response = await databases.listDocuments(databaseId, postsCollectionId, [
            Query.equal('organizerId', user.$id),
            Query.orderDesc('$createdAt'),
            Query.limit(10),
          ]);
          postActivities = response.documents.map((doc: any) => ({
            id: `post-${doc.$id}`,
            type: 'post',
            title: doc.title ?? 'Campus Post',
            description: doc.type ? `Published a ${doc.type}` : 'Shared a new update on VoxCampus',
            timestamp: doc.$createdAt ?? new Date().toISOString(),
          }));
        } catch (error) {
          console.error('Failed to load posts for activity feed', error);
          setActivitiesError('Unable to load recent posts.');
        }
      }

      const combined = [...membershipActivities, ...postActivities].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(combined);
    } catch (error) {
      console.error('Failed to load activity feed', error);
      setActivitiesError('Unable to load your recent activity.');
    } finally {
      setActivitiesLoading(false);
    }
  }, [databaseId, postsCollectionId, user?.$id, userMemberships]);

  useEffect(() => {
    loadActivityFeed();
  }, [loadActivityFeed]);

  const badges = useMemo(() => {
    const badgeList: Array<{ id: string; label: string; description?: string }> = [];

    if (userMemberships.length > 0) {
      badgeList.push({
        id: 'association-member',
        label: 'Association Member',
        description: 'Active member of campus associations',
      });
    }

    if (userMemberships.some(m => /president|lead|coordinator|head|secretary/i.test(m.role ?? ''))) {
      badgeList.push({
        id: 'leader',
        label: 'Campus Leader',
        description: 'Recognized for leadership roles in associations',
      });
    }

    if (activities.some(activity => activity.type === 'post')) {
      badgeList.push({
        id: 'event-host',
        label: 'Event Host',
        description: 'Published events or sessions on VoxCampus',
      });
    }

    if (skills.length >= 3) {
      badgeList.push({
        id: 'multi-skilled',
        label: 'Multi-Skilled',
        description: 'Showcases a diverse skillset',
      });
    }

    achievements.forEach((achievement, index) => {
      badgeList.push({ id: `achievement-${index}`, label: achievement });
    });

    return badgeList;
  }, [achievements, activities, skills.length, userMemberships]);

  const openLink = useCallback(async (url?: string | null) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Invalid URL', 'The link appears to be invalid.');
      }
    } catch (error) {
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  }, []);

  const handleEditSave = useCallback(
    async (values: ProfileFormValues) => {
      try {
        setSavingProfile(true);
        await updateProfile({
          name: values.name,
          bio: values.bio,
          education: values.education,
          skills: values.skills,
          projects: values.projects,
          socialLinks: values.socialLinks,
          achievements: values.achievements,
        });
        setEditVisible(false);
        await refreshMemberships();
        loadActivityFeed();
      } catch (error: any) {
        Alert.alert('Could not update profile', error?.message ?? 'Please try again later.');
      } finally {
        setSavingProfile(false);
      }
    },
    [loadActivityFeed, refreshMemberships, updateProfile]
  );

  const handleChangeAvatar = useCallback(async () => {
    console.log('[ProfileScreen] 🚀 Avatar change initiated');
    
    try {
      if (!user?.$id) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      setUploadingAvatar(true);
      console.log('[ProfileScreen] ⏳ Upload loading state set to true');

      // Use standard AvatarService to pick and upload image
      const selectedUri = await AvatarService.pickImage();
      
      if (!selectedUri) {
        console.log('[ProfileScreen] ❌ Image selection cancelled');
        return;
      }

      console.log('[ProfileScreen] ✅ Image selected, starting upload...');
      
      // Show preview immediately
      setAvatarPreview(selectedUri);
      
      // Upload using standard Appwrite pattern
      const result = await AvatarService.uploadAvatar(selectedUri, user.$id);
      
      if (result.previewUrl) {
        console.log('[ProfileScreen] ✅ Avatar uploaded successfully');
        
        // Update preview with final URL
        setAvatarPreview(result.previewUrl);
        
        Alert.alert('Success! 🎉', 'Your profile photo has been updated!');
        
        // Force UI refresh by updating avatar URL state
        // The avatarUrl will be updated when the component re-fetches profile data
      } else {
        console.error('[ProfileScreen] ❌ Avatar upload failed: No preview URL');
        setAvatarPreview(avatarUrl); // Revert preview
        Alert.alert('Upload Failed', 'Failed to update profile picture');
      }

    } catch (error: any) {
      console.error('[ProfileScreen] ❌ Avatar change failed:', error);
      setAvatarPreview(avatarUrl); // Revert preview
      Alert.alert('Error', `Unable to update profile photo: ${error?.message || 'Unknown error'}`);
    } finally {
      setUploadingAvatar(false);
      console.log('[ProfileScreen] 🏁 Upload process completed, loading state cleared');
    }
  }, [user?.$id, avatarUrl]);


  const navigateToAssociations = useCallback(() => {
    navigation.navigate('Main', { screen: 'Associations' });
  }, [navigation]);

  const initialFormValues = useMemo<ProfileFormValues>(
    () => ({
      name: user?.name || user?.email?.split('@')[0] || 'Student',
      bio,
      education: education ?? {},
      skills,
      projects,
      socialLinks,
      achievements,
    }),
    [achievements, bio, education, projects, skills, socialLinks, user?.email, user?.name]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          name={initialFormValues.name}
          college="SJCEM"
          description={bio}
          userId={user?.$id || ''}
          education={education}
          stats={stats}
          onPressChangeAvatar={handleChangeAvatar}
          isUploadingAvatar={uploadingAvatar}
        />

        <View style={styles.headerButtonsRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setEditVisible(true)}>
            <Text style={styles.primaryButtonText}>{savingProfile ? 'Updating…' : 'Edit Profile'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={navigateToAssociations}>
            <Text style={styles.secondaryButtonText}>Manage Associations</Text>
          </TouchableOpacity>
        </View>

        {/* Removed debug upload/testing buttons */}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bodyText}>{bio}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Badges & Achievements</Text>
          {badges.length ? (
            <View style={styles.badgeGrid}>
              {badges.map(badge => (
                <View key={badge.id} style={styles.badgePill}>
                  <Text style={styles.badgeLabel}>{badge.label}</Text>
                  {badge.description ? (
                    <Text style={styles.badgeDescription}>{badge.description}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.bodyTextMuted}>
              Unlock badges by joining associations, leading events, or sharing your wins.
            </Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {skills.length ? (
            <View style={styles.chipWrap}>
              {skills.map(skill => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.bodyTextMuted}>Add skills to highlight what you bring to the community.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {projects.length ? (
            projects.map((project: ProfileProject, index) => (
              <View key={`${project.title}-${index}`} style={styles.projectCard}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                {project.description ? (
                  <Text style={styles.projectDescription}>{project.description}</Text>
                ) : null}
                {project.link ? (
                  <TouchableOpacity onPress={() => openLink(project.link)}>
                    <Text style={styles.projectLink}>View project</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.bodyTextMuted}>
              Showcase the projects, events, or initiatives you are proud of.
            </Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Social Links</Text>
          {Object.entries(socialLinks).filter(([, value]) => !!value).length ? (
            Object.entries(socialLinks)
              .filter(([, value]) => !!value)
              .map(([key, value]) => (
                <TouchableOpacity key={key} onPress={() => openLink(value)} style={styles.linkRow}>
                  <Text style={styles.linkLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text style={styles.linkValue}>{value}</Text>
                </TouchableOpacity>
              ))
          ) : (
            <Text style={styles.bodyTextMuted}>
              Add GitHub, LinkedIn, or portfolio links to make networking easier.
            </Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Members in Association</Text>
            <TouchableOpacity onPress={refreshMemberships}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {userMemberships.length ? (
            userMemberships.map(membership => (
              <View key={membership.$id} style={styles.membershipRow}>
                <View style={styles.membershipIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.membershipName}>
                    {membership.organization?.name ?? membership.orgId}
                  </Text>
                  <Text style={styles.membershipMeta}>
                    {[membership.role, membership.organization?.type]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.bodyTextMuted}>
              Join an association to unlock member-only privileges.
            </Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Followed Associations</Text>
          {followedLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : followedAssociations.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.followedScroll}
            >
              {followedAssociations.map(assoc => (
                <View key={assoc.$id} style={styles.followedCard}>
                  <Text style={styles.followedName}>{assoc.name ?? 'Association'}</Text>
                  {assoc.type ? <Text style={styles.followedType}>{assoc.type}</Text> : null}
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.bodyTextMuted}>
              Follow associations to receive updates and quick access here.
            </Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>
          {activitiesLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : activities.length ? (
            activities.map(activity => (
              <View key={activity.id} style={styles.activityRow}>
                <View style={styles.activityMarker} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.bodyTextMuted}>
              {activitiesError ?? 'Your recent activity will appear here once you start engaging.'}
            </Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: COLORS.error, marginRight: 0 }]}
            onPress={logout}
          >
            <Text style={styles.primaryButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ProfileEditModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        onSave={handleEditSave}
        saving={savingProfile}
        initialValues={initialFormValues}
      />

      {uploadingAvatar ? (
        <View style={styles.uploadingBanner}>
          <ActivityIndicator color={COLORS.white} size="small" />
          <Text style={styles.uploadingText}>Updating profile picture…</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.sm,
    marginBottom: SIZES.md,
    rowGap: SIZES.sm,
  },
  primaryButton: {
    flexGrow: 1,
    flexBasis: '48%',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.borderRadius.md,
    alignItems: 'center',
    marginRight: 0,
    marginBottom: SIZES.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.heading,
    fontSize: 15,
  },
  secondaryButton: {
    flexGrow: 1,
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.borderRadius.md,
    alignItems: 'center',
    marginLeft: 0,
    marginBottom: SIZES.sm,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontFamily: FONTS.heading,
    fontSize: 15,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
    padding: SIZES.lg,
    borderRadius: SIZES.borderRadius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: COLORS.black,
    marginBottom: SIZES.sm,
  },
  bodyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
  },
  bodyTextMuted: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#6B7280',
  },
  badgeGrid: {
    gap: SIZES.sm,
  },
  badgePill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: SIZES.borderRadius.md,
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    backgroundColor: '#F9FAFB',
  },
  badgeLabel: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.black,
  },
  badgeDescription: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#6B7280',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.xs,
  },
  skillChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 6,
  },
  skillChipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.primary,
  },
  projectCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: SIZES.borderRadius.md,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
  },
  projectTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.black,
  },
  projectDescription: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  projectLink: {
    marginTop: SIZES.xs,
    color: COLORS.primary,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  linkRow: {
    marginBottom: SIZES.xs,
  },
  linkLabel: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.black,
  },
  linkValue: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  refreshText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.primary,
  },
  membershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  membershipIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.gray,
    marginRight: SIZES.sm,
  },
  membershipName: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.black,
  },
  membershipMeta: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#6B7280',
  },
  followedScroll: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  followedCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: SIZES.borderRadius.md,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: '#F9FAFB',
    marginRight: SIZES.sm,
  },
  followedName: {
    fontFamily: FONTS.heading,
    fontSize: 15,
    color: COLORS.black,
  },
  followedType: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#6B7280',
  },
  activityRow: {
    flexDirection: 'row',
    paddingVertical: SIZES.xs,
  },
  activityMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginRight: SIZES.md,
    marginTop: SIZES.xs,
  },
  activityTitle: {
    fontFamily: FONTS.heading,
    fontSize: 15,
    color: COLORS.black,
  },
  activityDescription: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#4B5563',
  },
  activityTime: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  uploadingBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(31, 111, 235, 0.95)',
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
  },
  uploadingText: {
    color: COLORS.white,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
});

export default ProfileScreen;
