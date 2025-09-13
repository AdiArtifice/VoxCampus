import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '@/constants/theme';
import HomeScreen from '@/screens/HomeScreen';
import ExploreScreen from '@/screens/ExploreScreen';
import ConnectScreen from '@/screens/ConnectScreen';
import AssociationsScreen from '@/screens/AssociationsScreen';
import TabBar from '@/components/TabBar';
import { MainTabParamList } from './types';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder screen for Add functionality
const AddScreen = () => {
  return null;
};

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
        component={AddScreen} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default action
            e.preventDefault();
            // Create post flow would go here
            console.log('Add post pressed');
          },
        })}
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
