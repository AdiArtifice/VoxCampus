import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import IconHome from '@/assets/images/IconHome';
import IconExplore from '@/assets/images/IconExplore';
import IconAdd from '@/assets/images/IconAdd';
import IconConnect from '@/assets/images/IconConnect';
import IconAssociations from '@/assets/images/IconAssociations';
// no auth needed in tab bar

const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  // no-op
  const ICON_SIZE = 20;

  return (
    <View style={styles.tabBarContainer}>
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
              icon = <IconHome width={ICON_SIZE} height={ICON_SIZE} color={isFocused ? COLORS.black : COLORS.black} />;
              break;
            case 'Explore':
              icon = <IconExplore width={ICON_SIZE} height={ICON_SIZE} color={isFocused ? COLORS.black : COLORS.black} />;
              break;
            case 'Add':
              icon = <IconAdd width={ICON_SIZE} height={ICON_SIZE} color={isFocused ? COLORS.black : COLORS.black} />;
              break;
            case 'Connect':
              icon = <IconConnect width={ICON_SIZE} height={ICON_SIZE} color={isFocused ? COLORS.black : COLORS.black} />;
              break;
            case 'Associations':
              icon = <IconAssociations width={ICON_SIZE} height={ICON_SIZE} color={isFocused ? COLORS.black : COLORS.black} />;
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
              <Text
                style={[
                styles.tabText,
                { color: isFocused ? COLORS.black : COLORS.black }
              ]}
                numberOfLines={1}
                ellipsizeMode="tail"
                allowFontScaling={false}
              >
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
  // header styles removed; header is now a separate top component
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
    gap: 2,
    minWidth: 0, // allow text to truncate within flex item
  },
  tabText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 1,
    textAlign: 'center',
    lineHeight: 13,
    alignSelf: 'center',
  }
});

export default TabBar;
