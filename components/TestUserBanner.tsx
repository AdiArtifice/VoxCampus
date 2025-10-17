import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '@/constants/theme';

/**
 * TestUserBanner component displays a banner when a user is logged in 
 * as the special test user with cross-institution access.
 * 
 * This component uses the isDemoMode state from AuthContext to determine
 * whether to show the banner, making it more reliable than checking email.
 */
export default function TestUserBanner() {
  const { isDemoMode } = useAuth();
  
  // Don't render anything if not in demo mode
  if (!isDemoMode) return null;
  
  // Already verified isDemoMode above
  
  const handleInfoPress = () => {
    Alert.alert(
      'Demo Mode Active',
      'You are currently using VoxCampus in demo mode. This gives you access to view content across all institutions for demonstration purposes. All changes you make will be automatically reset when you log out. Your actions are being logged for security purposes.',
      [{ text: 'OK' }]
    );
  };
  
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={handleInfoPress} 
      style={styles.container}
    >
      <Text style={styles.text}>
        DEMO MODE - Changes Reset on Logout
      </Text>
      <Text style={styles.infoText}>
        ℹ️ Info
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 8,
  },
});