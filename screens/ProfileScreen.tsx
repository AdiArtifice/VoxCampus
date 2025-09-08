import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import ProfileHeader from '@/components/ProfileHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';

// Mock data for associations
const myAssociations = [
  { id: '1', name: 'ASCAI' },
  { id: '2', name: 'Student Development Cell' },
  { id: '3', name: 'SIH Group' }
];

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ProfileHeader 
          name={user?.name || user?.email?.split('@')[0] || 'User'}
          college="SJCEM"
          description="Student at St. John College of Engineering and Management"
        />

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutBox}>
            <Text style={styles.aboutText}>
              Computer Science student passionate about web and mobile development.
              Active member of various clubs and associations at SJCEM.
            </Text>
          </View>
        </View>

        <View style={styles.associationsSection}>
          <Text style={styles.sectionTitle}>My Associations</Text>
          {myAssociations.map((assoc, index) => (
            <View key={assoc.id} style={styles.associationItem}>
              <View style={styles.associationIcon} />
              <Text style={styles.associationName}>{assoc.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  scrollView: {
    flex: 1
  },
  aboutSection: {
    marginTop: -SIZES.xl,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.borderRadius.lg,
    borderTopRightRadius: SIZES.borderRadius.lg,
    padding: SIZES.md
  },
  sectionTitle: {
    fontFamily: FONTS.regular,
    fontSize: 22,
    color: COLORS.black,
    marginBottom: SIZES.sm
  },
  aboutBox: {
    padding: SIZES.md,
    backgroundColor: COLORS.gray,
    borderRadius: SIZES.borderRadius.sm
  },
  aboutText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.black
  },
  associationsSection: {
    padding: SIZES.md
  },
  associationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    padding: SIZES.sm,
    borderRadius: SIZES.borderRadius.sm,
    marginBottom: SIZES.md
  },
  associationIcon: {
    width: 41,
    height: 37,
    backgroundColor: COLORS.gray,
    borderRadius: SIZES.borderRadius.sm,
    marginRight: SIZES.sm
  },
  associationName: {
    fontFamily: FONTS.regular,
    fontSize: 20,
    color: COLORS.black
  },
  buttonsContainer: {
    padding: SIZES.md,
    marginBottom: SIZES.xxl * 2 // Extra padding at bottom
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.borderRadius.sm,
    alignItems: 'center'
  },
  logoutButtonText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.white
  }
});

export default ProfileScreen;
