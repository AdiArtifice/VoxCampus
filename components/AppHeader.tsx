import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const AppHeader: React.FC<NativeStackHeaderProps> = ({ navigation }) => {
  const navigateToProfile = () => {
    // Navigate on the current stack to the Profile screen
    navigation.navigate('Profile' as never);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={navigateToProfile}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <View style={styles.profileIconWrap}>
            <Ionicons name="person" size={28} color={COLORS.white} />
          </View>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/appwrite-logo.png')}
            style={{ width: 25, height: 25 }}
          />
          <MaskedView
            maskElement={<Text style={styles.headerTitle}>VoxCampus</Text>}
          >
            <LinearGradient
              colors={['#7C3AED', '#A78BFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.headerTitle, { opacity: 0 }]}>VoxCampus</Text>
            </LinearGradient>
          </MaskedView>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  headerTitle: {
    fontFamily: FONTS.regular,
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black', // Mask text color
  },
});

export default AppHeader;
