import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/Button';
import { isValidEmail, isValidPassword, isValidName, isSJCEMEmail } from '@/utils/validation';
import { useAuth } from '@/hooks/useAuth';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';

type Props = {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
};

export const RegisterForm: React.FC<Props> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const emailOk = isValidEmail(email) && isSJCEMEmail(email);
  const canSubmit = isValidName(name) && emailOk && isValidPassword(password);

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!canSubmit) {
      if (!isSJCEMEmail(email)) {
        setError('Registration is limited to campus emails ending with @sjcem.edu.in');
      } else {
        setError('Please provide a valid name, email, and a password with at least 8 characters.');
      }
      return;
    }
    try {
      setSubmitting(true);
      await register(name.trim(), email.trim(), password);
      setInfo('Account created. Please check your inbox for a verification email to activate your account.');
      onSuccess?.();
    } catch (e: any) {
      const msg = e?.message || 'Registration failed. Try a different email or check your input.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.hint}>Use your campus email (e.g. 123name@sjcem.edu.in)</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!info && <Text style={styles.info}>{info}</Text>}
      <TextInput
        placeholder="Full Name"
        autoCapitalize="words"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Email (@sjcem.edu.in)"
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
        <Button text={submitting ? 'Creating...' : 'Create Account'} onPress={handleSubmit} />
      </View>
      <SocialAuthButtons
        variant="signup"
        onSuccess={() => onSuccess?.()}
        onError={(e: any) => {
          const msg = e?.message || 'Google sign-in failed';
          if (msg !== 'Sign-in canceled') {
            setError(msg);
          }
        }}
      />
      <Text style={styles.switchText} onPress={onSwitchToLogin}>
        Already have an account? Sign in
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
  hint: {
    color: '#5f6368',
    marginBottom: 4,
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
  info: {
    color: '#1B5E20',
    marginBottom: 4,
  },
  switchText: {
    color: '#1F6FEB',
    marginTop: 12,
  },
});
