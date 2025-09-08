import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import IconHome from '@/assets/images/IconHome';
import IconExplore from '@/assets/images/IconExplore';
import IconAdd from '@/assets/images/IconAdd';
import IconConnect from '@/assets/images/IconConnect';
import IconAssociations from '@/assets/images/IconAssociations';

const { width } = Dimensions.get('window');

const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: SIZES.tabBarHeight,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xs,
  },
  tabText: {
    fontSize: 15,
    fontFamily: FONTS.body,
    marginTop: 4,
  }
});

export default TabBar;
