import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import IconAdd from '@/assets/images/IconAdd';

const CreateScreen: React.FC = () => {
  const router = useRouter();
  const { user, userMemberships, loading, refreshMemberships } = useAuth();
  
  // Check if user has any active memberships
  const hasActiveMemberships = userMemberships.length > 0;
  const canCreatePosts = hasActiveMemberships && user?.emailVerification;

  const handleCreatePost = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to create posts.');
      return;
    }
    
    if (!user.emailVerification) {
      Alert.alert('Email Verification Required', 'Please verify your email to create posts.');
      return;
    }

    if (!canCreatePosts) {
      Alert.alert(
        'Membership Required', 
        'You need to be a member of at least one association to create official posts.'
      );
      return;
    }

    // Navigate to create post screen
    router.push('/create-post');
  };

  const handleCreateGroup = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to create private groups.');
      return;
    }

    if (!user.emailVerification) {
      Alert.alert('Email Verification Required', 'Please verify your email to create private groups.');
      return;
    }

    // Navigate to create group screen
    router.push('/create-group');
  };

  const handleRefreshMemberships = async () => {
    try {
      await refreshMemberships();
      Alert.alert('Success', 'Memberships refreshed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh memberships. Please try again.');
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Authentication Required</Text>
          <Text style={styles.subtitle}>
            Please log in to access creation features.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create</Text>
        <Text style={styles.subtitle}>
          Share your ideas with the VoxCampus community
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading memberships...</Text>
        </View>
      )}

      {/* Membership Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Membership Status</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefreshMemberships}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {hasActiveMemberships ? (
          <View>
            <Text style={[styles.statusText, styles.successText]}>
              ✅ Active Member
            </Text>
            <Text style={styles.membershipDetails}>
              You're a member of {userMemberships.length} organization{userMemberships.length !== 1 ? 's' : ''}:
            </Text>
            {userMemberships.map((membership, index) => (
              <View key={membership.$id} style={styles.membershipItem}>
                <Text style={styles.membershipName}>
                  • {membership.organization?.name || 'Unknown Organization'}
                </Text>
                <Text style={styles.membershipRole}>
                  Role: {membership.role}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <Text style={[styles.statusText, styles.warningText]}>
              ⚠️ No Active Memberships
            </Text>
            <Text style={styles.membershipDetails}>
              {user?.email?.endsWith('@sjcem.edu.in') 
                ? 'Contact your association admins to get membership access, or check if your email matches your registration.'
                : 'Join an association to create official posts and events.'
              }
            </Text>
          </View>
        )}
      </View>

      {/* Create Options */}
      <View style={styles.optionsContainer}>
        {/* Create Official Post Option */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            canCreatePosts ? styles.enabledCard : styles.disabledCard
          ]}
          onPress={handleCreatePost}
          disabled={!canCreatePosts}
        >
          <View style={styles.optionIcon}>
            <IconAdd width={32} height={32} color={canCreatePosts ? COLORS.primary : COLORS.gray} />
          </View>
          <View style={styles.optionContent}>
            <Text style={[
              styles.optionTitle,
              canCreatePosts ? styles.enabledText : styles.disabledText
            ]}>
              Create Official Post
            </Text>
            <Text style={[
              styles.optionDescription,
              canCreatePosts ? styles.enabledDescription : styles.disabledDescription
            ]}>
              Share events, announcements, and updates on behalf of your organization
            </Text>
            {!canCreatePosts && (
              <Text style={styles.requirementText}>
                Requires: Active membership in an association
              </Text>
            )}
          </View>
          <View style={styles.optionArrow}>
            <Text style={[
              styles.arrowText,
              canCreatePosts ? styles.enabledText : styles.disabledText
            ]}>
              →
            </Text>
          </View>
        </TouchableOpacity>

        {/* Create Private Group Option */}
        <TouchableOpacity
          style={[styles.optionCard, styles.enabledCard]}
          onPress={handleCreateGroup}
        >
          <View style={styles.optionIcon}>
            <IconAdd width={32} height={32} color={COLORS.primary} />
          </View>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, styles.enabledText]}>
              Create Private Group
            </Text>
            <Text style={[styles.optionDescription, styles.enabledDescription]}>
              Start a private group for study sessions, projects, or social activities
            </Text>
          </View>
          <View style={styles.optionArrow}>
            <Text style={[styles.arrowText, styles.enabledText]}>→</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        <Text style={styles.helpText}>
          • Official posts are visible to the entire campus community
        </Text>
        <Text style={styles.helpText}>
          • Private groups are invitation-only and perfect for smaller communities
        </Text>
        <Text style={styles.helpText}>
          • Contact your association admin to join as a member
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.md,
    paddingBottom: SIZES.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  header: {
    marginBottom: SIZES.lg,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.gray,
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: SIZES.lg,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: SIZES.sm,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.lg,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  statusTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  refreshButton: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.sm,
  },
  refreshButtonText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SIZES.xs,
  },
  successText: {
    color: '#22C55E',
  },
  warningText: {
    color: '#F59E0B',
  },
  membershipDetails: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: SIZES.sm,
    lineHeight: 20,
  },
  membershipItem: {
    marginBottom: SIZES.xs,
  },
  membershipName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  membershipRole: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: SIZES.sm,
  },
  optionsContainer: {
    marginBottom: SIZES.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.lg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  enabledCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  disabledCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.lightGray,
    opacity: 0.6,
  },
  optionIcon: {
    marginRight: SIZES.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SIZES.xs,
  },
  optionDescription: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SIZES.xs,
  },
  enabledText: {
    color: COLORS.black,
  },
  disabledText: {
    color: COLORS.gray,
  },
  enabledDescription: {
    color: COLORS.gray,
  },
  disabledDescription: {
    color: COLORS.lightGray,
  },
  requirementText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  optionArrow: {
    marginLeft: SIZES.sm,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  helpSection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.lg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  helpTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.sm,
  },
  helpText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: SIZES.xs,
  },
});

export default CreateScreen;