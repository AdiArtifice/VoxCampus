import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { checkGuestSession, formatRemainingTime } from '../utils/guestSession';
import { COLORS, FONTS } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

const UPDATE_INTERVAL = 1000; // Update timer every 1 second

const GuestSessionTimer: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [showExpiryModal, setShowExpiryModal] = useState<boolean>(false);
  const [timerVisible, setTimerVisible] = useState<boolean>(false);
  const [sessionChecked, setSessionChecked] = useState<boolean>(false);

  // Separated check session function for better debugging
  const checkSession = useCallback(async () => {
    // Only check if user is not logged in
    if (!user) {
      console.log('[DEBUG] GuestSessionTimer - Checking session for non-logged-in user');
      try {
        const { isValid, remainingTime } = await checkGuestSession();
        console.log(`[DEBUG] GuestSessionTimer - Session valid: ${isValid}, Remaining: ${Math.round(remainingTime/1000)}s`);
        
        setRemainingTime(remainingTime);
        setTimerVisible(isValid); // Only show timer if session is valid
        
        // Show expiry modal when time is up
        if (!isValid && remainingTime <= 0) {
          console.log('[DEBUG] GuestSessionTimer - Session expired, showing modal');
          setShowExpiryModal(true);
        }
      } catch (error) {
        console.error('[DEBUG] GuestSessionTimer - Error checking session:', error);
      } finally {
        setSessionChecked(true);
      }
    } else {
      console.log('[DEBUG] GuestSessionTimer - User is logged in, hiding timer');
      setTimerVisible(false);
      setSessionChecked(true);
    }
  }, [user]);

  useEffect(() => {
    console.log('[DEBUG] GuestSessionTimer - Component mounted');
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // Initial check
    checkSession();

    // Set up interval for regular checks
    if (!user) {
      console.log('[DEBUG] GuestSessionTimer - Setting up interval for session checks');
      intervalId = setInterval(checkSession, UPDATE_INTERVAL);
    }

    return () => {
      console.log('[DEBUG] GuestSessionTimer - Component unmounted');
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, checkSession]);

  const handleLogin = () => {
    console.log('[DEBUG] GuestSessionTimer - Login button pressed');
    setShowExpiryModal(false);
    // Navigate to login screen
    navigation.navigate('Login' as never);
  };
  
  // If session has not been checked yet, show nothing
  if (!sessionChecked) {
    console.log('[DEBUG] GuestSessionTimer - Session not checked yet, not rendering');
    return null;
  }

  // If timer should not be visible, return null but still render the modal if needed
  if (!timerVisible && !showExpiryModal) {
    console.log('[DEBUG] GuestSessionTimer - Timer not visible, not rendering');
    return null;
  }

  console.log(`[DEBUG] GuestSessionTimer - Rendering with remaining time: ${formatRemainingTime(remainingTime)}, modal visible: ${showExpiryModal}`);
  
  return (
    <>
      {timerVisible && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Guest Session:</Text>
          <Text style={styles.timerValue}>{formatRemainingTime(remainingTime)}</Text>
        </View>
      )}

      <Modal
        visible={showExpiryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          console.log('[DEBUG] GuestSessionTimer - Modal closed by request');
          setShowExpiryModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Guest Session Expired</Text>
            <Text style={styles.modalText}>
              Your guest session has expired. Please log in to continue using VoxCampus.
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.buttonText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '20', // Primary color with 20% opacity
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 100,
  },
  timerLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.primary,
    marginRight: 4,
  },
  timerValue: {
    fontFamily: FONTS.regular,
    fontWeight: 'bold',
    fontSize: 12,
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  modalText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default GuestSessionTimer;