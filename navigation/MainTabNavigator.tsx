import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '@/constants/theme';
import HomeScreen from '@/screens/HomeScreen';
import ExploreScreen from '@/screens/ExploreScreen';
import ConnectScreen from '@/screens/ConnectScreen';
import AssociationsScreen from '@/screens/AssociationsScreen';
import CreateScreen from '@/screens/CreateScreen';
import TabBar from '@/components/TabBar';
import { MainTabParamList } from './types';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Profile launcher (hidden in tab bar). Navigation handled via top header.
const ProfileLauncher = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };

  return null;
};

const MainTabNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.black,
        tabBarInactiveTintColor: COLORS.black,
        tabBarStyle: {
          backgroundColor: COLORS.primary,
          height: 71,
          borderTopColor: COLORS.lightGray,
        }
      }}
      tabBar={props => <TabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen 
        name="Add" 
        component={CreateScreen}
        options={{
          title: 'Create'
        }}
      />
      <Tab.Screen name="Connect" component={ConnectScreen} />
      <Tab.Screen name="Associations" component={AssociationsScreen} />
      <Tab.Screen 
        name="Profile" 
        component={ProfileLauncher} 
        options={{ 
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' } 
        }} 
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
