import React, { useState, useEffect } from 'react';
import { useGuestSession } from '../hooks/useGuestSession';
import { validateGuestSessionOnServer } from '../utils/serverValidation';
import { View, Modal, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Higher-Order Component that adds both client and server-side guest session validation
 * @param Component The component to wrap with validation
 * @returns A new component that validates guest session before rendering
 */
export function withGuestValidation<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const { guestSessionActive, guestSessionRemainingTime } = useGuestSession();
    const [serverValidated, setServerValidated] = useState<boolean | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Perform server-side validation when component mounts
    useEffect(() => {
      async function validateWithServer() {
        if (!guestSessionActive) {
          setServerValidated(false);
          setIsLoading(false);
          return;
        }

        try {
          const result = await validateGuestSessionOnServer();
          setServerValidated(result.success);
          if (!result.success && result.error) {
            setServerError(result.error);
          }
        } catch (error) {
          console.error('Server validation error:', error);
          setServerValidated(false);
          setServerError('Failed to validate session with server');
        } finally {
          setIsLoading(false);
        }
      }

      validateWithServer();
    }, [guestSessionActive]);

    // Show loading state while validating
    if (isLoading) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.loadingText}>Validating session...</Text>
        </View>
      );
    }

    // If server validation failed but client validation passed, show an error
    if (!serverValidated && guestSessionActive) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>Session verification failed</Text>
          <Text style={styles.errorSubText}>{serverError || 'Please try again'}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.navigate('/')}
          >
            <Text style={styles.buttonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // If both validations passed, render the component
    return <Component {...props} />;
  };
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFB',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#4682B4',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6347',
    marginBottom: 10,
  },
  errorSubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});