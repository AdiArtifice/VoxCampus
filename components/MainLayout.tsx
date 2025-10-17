import React from 'react';
import { View } from 'react-native';
import TestUserBanner from './TestUserBanner';
import { useAuth } from '@/hooks/useAuth';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout component that includes the TestUserBanner
 * and wraps the main content of each screen.
 * 
 * This component ensures the demo mode banner is displayed consistently
 * across all screens when the user is in demo mode.
 */
export default function MainLayout({ children }: MainLayoutProps) {
  const { isDemoMode } = useAuth();
  
  return (
    <View style={{ flex: 1 }}>
      {isDemoMode && <TestUserBanner />}
      {children}
    </View>
  );
}