import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Button } from '@/components/Button';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from '@/navigation/MainTabNavigator';
import { RootStackParamList } from '@/navigation/types';
import { useFonts } from 'expo-font';
import ProfileScreen from '@/screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthScreen() {
  const { user, initializing, refresh, sendVerificationEmail } = useAuth();
  const [mode, setMode] = React.useState<'login' | 'register'>('login');
  const [resending, setResending] = React.useState(false);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return mode === 'login' ? (
      <LoginForm onSwitchToRegister={() => setMode('register')} />
    ) : (
      <RegisterForm onSwitchToLogin={() => setMode('login')} />
    );
  }

  const onResend = async () => {
    try {
      setResending(true);
      await sendVerificationEmail();
    } finally {
      setResending(false);
    }
  };

  // If user is logged in but email not verified, show verification message
  if (!user.emailVerification) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ 
          padding: 16, 
          backgroundColor: '#FFF8E1', 
          borderWidth: 1, 
          borderColor: '#FFECB3',
          borderRadius: 8,
          marginTop: 20 
        }}>
          <Text style={{ color: '#8D6E63', marginBottom: 12, fontSize: 16 }}>
            Your email is not verified. Please check your inbox and click the verification link.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button text={resending ? 'Sending…' : 'Resend verification email'} onPress={onResend} />
            <View style={{ width: 12 }} />
            <Button text={'Refresh status'} onPress={refresh} />
          </View>
        </View>
      </View>
    );
  }

  // If user is logged in and email is verified, return null since Navigator will handle routing
  return null;
}

export default function App() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user || !user.emailVerification ? (
        // Auth screens
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        // App screens
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
}
