import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/Button';
import { isValidEmail, isValidPassword } from '@/utils/validation';
import { useAuth } from '@/hooks/useAuth';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';

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

  const canSubmit = isValidEmail(email) && isValidPassword(password);

  const handleSubmit = async () => {
    setError(null);
    if (!canSubmit) {
      setError('Please enter a valid email and a password with at least 8 characters.');
      return;
    }
    try {
      setSubmitting(true);
      await login(email, password);
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
      />
      <View style={{ marginTop: 12, opacity: submitting || !canSubmit ? 0.8 : 1 }}>
        <Button text={submitting ? 'Signing in...' : 'Sign In'} onPress={handleSubmit} />
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
        Don't have an account? Create one
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
});
