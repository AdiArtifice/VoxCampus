import type React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

const AppHeader = ({ navigation }: NativeStackHeaderProps) => {
  const navigateToProfile = () => {
    // Navigate on the current stack to the Profile screen
    navigation.navigate('Profile' as never);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton} onPress={navigateToProfile}>
          <Image
            source={require('@/assets/images/rn.png')}
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open profile" onPress={navigateToProfile} style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/appwrite-logo.png')}
            style={{ width: 25, height: 25 }}
          />
          <Text style={styles.headerTitle}>VoxCampus</Text>
        </TouchableOpacity>
        {/* Right spacer to balance layout */}
        <View style={{ width: 54, height: 53 }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.primary,
  },
  header: {
    minHeight: SIZES.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
  },
  profileButton: {
    width: 54,
    height: 53,
    marginRight: SIZES.md,
    cursor: 'pointer' as any,
  },
  profileImage: {
    width: 54,
    height: 53,
    borderRadius: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    cursor: 'pointer' as any,
  },
  headerTitle: {
    fontFamily: FONTS.regular,
    fontSize: 30,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
});

export default AppHeader;
