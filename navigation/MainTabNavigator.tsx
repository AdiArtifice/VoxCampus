import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '@/constants/theme';
import HomeScreen from '@/screens/HomeScreen';
import ExploreScreen from '@/screens/ExploreScreen';
import ConnectScreen from '@/screens/ConnectScreen';
import AssociationsScreen from '@/screens/AssociationsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import TabBar from '@/components/TabBar';
import { MainTabParamList } from './types';
import { useAuth } from '@/hooks/useAuth';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder screen for Add functionality
const AddScreen = () => <></>;

const MainTabNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <TabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Add" component={AddScreen} />
      <Tab.Screen name="Connect" component={ConnectScreen} />
      <Tab.Screen name="Associations" component={AssociationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
