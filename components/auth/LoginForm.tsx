import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Button } from '@/components/Button';
import { isValidEmail, isValidPassword } from '@/utils/validation';
import { useAuth } from '@/hooks/useAuth';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { COLORS } from '@/constants/theme';

type Props = {
  onSuccess?: () => void;
  onSwitchToRegister: () => void;
};

export const LoginForm: React.FC<Props> = ({ onSuccess, onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Demo mode toggle state
  const [demoMode, setDemoMode] = useState(false);

  // If demo mode is enabled, we bypass validation
  const canSubmit = demoMode || (isValidEmail(email) && isValidPassword(password));

  const handleSubmit = async () => {
    setError(null);
    
    try {
      setSubmitting(true);
      
      if (demoMode) {
        // Use demo user credentials
        console.log('Logging in with demo account');
        await login('test@sjcem.edu.in', 'DemoUser2025!@#', true);
      } else {
        // Regular login validation
        if (!canSubmit) {
          setError('Please enter a valid email and a password with at least 8 characters.');
          setSubmitting(false);
          return;
        }
        
        await login(email, password);
      }
      
      onSuccess?.();
    } catch (e: any) {
      const msg = e?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        editable={!demoMode}
      />
      
      {/* Demo Mode Toggle */}
      <TouchableOpacity 
        style={styles.demoModeContainer} 
        onPress={() => setDemoMode(!demoMode)}
        activeOpacity={0.7}
      >
        <Switch
          value={demoMode}
          onValueChange={setDemoMode}
          trackColor={{ false: '#767577', true: COLORS.primary }}
          thumbColor={demoMode ? '#f4f3f4' : '#f4f3f4'}
        />
        <Text style={styles.demoModeText}>
          Demo Mode {demoMode ? '(Enabled)' : ''}
        </Text>
      </TouchableOpacity>
      
      {demoMode && (
        <Text style={styles.demoModeInfo}>
          Access the app in demo mode to explore without account restrictions.
        </Text>
      )}
      
      <View style={{ marginTop: 12, opacity: submitting ? 0.8 : 1 }}>
        <Button text={submitting ? 'Signing in...' : demoMode ? 'Enter Demo Mode' : 'Sign In'} onPress={handleSubmit} />
      </View>
      <SocialAuthButtons
        variant="signin"
        onSuccess={() => onSuccess?.()}
        onError={(e: any) => {
          const msg = e?.message || 'Google sign-in failed';
          if (msg !== 'Sign-in canceled') {
            setError(msg);
          }
        }}
      />
      <Text style={styles.switchText} onPress={onSwitchToRegister}>
        {`Don\u2019t have an account? Create one`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#EDEDF0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: '#C62828',
    marginBottom: 4,
  },
  switchText: {
    color: '#1F6FEB',
    marginTop: 12,
  },
  demoModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 4,
  },
  demoModeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  demoModeInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
});
