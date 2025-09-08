import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import IconHome from '@/assets/images/IconHome';
import IconExplore from '@/assets/images/IconExplore';
import IconAdd from '@/assets/images/IconAdd';
import IconConnect from '@/assets/images/IconConnect';
import IconAssociations from '@/assets/images/IconAssociations';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';

const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { user } = useAuth();
  const mainNavigation = useNavigation();

  const navigateToProfile = () => {
    mainNavigation.navigate('Profile');
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton} onPress={navigateToProfile}>
          <Image 
            source={require('@/assets/images/rn.png')} 
            style={styles.profileImage} 
          />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/appwrite-logo.png')}
            style={{ width: 25, height: 25 }}
          />
          <Text style={styles.headerTitle}>VoxCampus</Text>
        </View>
      </View>

      <View style={styles.container}>
        {state.routes.map((route, index) => {
          // Skip the Profile tab in the tab bar
          if (route.name === 'Profile') return null;

          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let icon;
          switch (route.name) {
            case 'Home':
              icon = <IconHome color={isFocused ? COLORS.black : COLORS.black} />;
              break;
            case 'Explore':
              icon = <IconExplore color={isFocused ? COLORS.black : COLORS.black} />;
              break;
            case 'Add':
              icon = <IconAdd color={isFocused ? COLORS.black : COLORS.black} />;
              break;
            case 'Connect':
              icon = <IconConnect color={isFocused ? COLORS.black : COLORS.black} />;
              break;
            case 'Associations':
              icon = <IconAssociations color={isFocused ? COLORS.black : COLORS.black} />;
              break;
            default:
              icon = null;
          }

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={onPress}
              style={styles.tabButton}
            >
              {icon}
              <Text style={[
                styles.tabText,
                { color: isFocused ? COLORS.black : COLORS.black }
              ]}>
                {label as string}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: COLORS.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  header: {
    height: 71,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
  },
  profileButton: {
    width: 54,
    height: 53,
    marginRight: SIZES.md,
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
  },
  headerTitle: {
    fontFamily: FONTS.regular,
    fontSize: 30,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: SIZES.tabBarHeight,
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xs,
  },
  tabText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    marginTop: 4,
  }
});

export default TabBar;
