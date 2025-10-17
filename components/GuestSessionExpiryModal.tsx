import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { GuestSession, formatTimeRemaining } from '@/utils/guestSession';

interface GuestSessionModalProps {
  isVisible: boolean;
  onLogin: () => void;
  onRegister: () => void;
}

/**
 * Modal displayed when guest session is about to expire or has expired
 */
export const GuestSessionExpiryModal: React.FC<GuestSessionModalProps> = ({ 
  isVisible, 
  onLogin,
  onRegister
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const navigation = useNavigation();
  
  // Effect to update the timer
  useEffect(() => {
    if (!isVisible) return;
    
    // Check initial state
    GuestSession.getRemainingTime().then(remaining => {
      setTimeRemaining(remaining);
      setIsExpired(remaining <= 0);
    });
    
    // Set up timer to update remaining time
    const timer = setInterval(() => {
      GuestSession.getRemainingTime().then(remaining => {
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setIsExpired(true);
          clearInterval(timer);
        }
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isVisible]);
  
  // Format the time for display
  const formattedTime = formatTimeRemaining(timeRemaining);
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        if (!isExpired) {
          // Allow dismissing only if not expired
          navigation.goBack();
        }
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {isExpired ? (
            <>
              <Text style={styles.modalTitle}>Session Expired</Text>
              <Text style={styles.modalText}>
                Your guest preview has ended. Please sign in or register to continue exploring VoxCampus.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>Guest Preview</Text>
              <Text style={styles.modalText}>
                You're browsing VoxCampus as a guest. Your preview session will expire in:
              </Text>
              <Text style={styles.timerText}>{formattedTime}</Text>
            </>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={onLogin}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onRegister}
            >
              <Text style={styles.buttonTextSecondary}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Hook to manage the guest session timer and modal
 * Use this in your app's top-level component to handle guest sessions
 */
export function useGuestSession() {
  const [isGuestSession, setIsGuestSession] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigation = useNavigation();
  
  // Initialize and check guest session on mount
  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true);
      
      // Check if there's a user logged in (via your auth context)
      // This is a placeholder - replace with your actual auth check
      const isLoggedIn = false; // Replace with: useAuth().user !== null;
      
      if (!isLoggedIn) {
        // Start or resume guest session
        await GuestSession.startSession();
        setIsGuestSession(true);
        
        // Check if session is already expired
        const isValid = await GuestSession.isSessionValid();
        setIsExpired(!isValid);
        setShowModal(!isValid);
      }
      
      setIsLoading(false);
    };
    
    initSession();
  }, []);
  
  // Set up timer to check session status periodically
  useEffect(() => {
    if (!isGuestSession) return;
    
    // Check every 30 seconds if we're nearing expiration
    const timer = setInterval(async () => {
      const remaining = await GuestSession.getRemainingTime();
      
      // Show warning modal when 1 minute remaining
      if (remaining > 0 && remaining < 60000) {
        setShowModal(true);
      }
      
      // Mark as expired when time's up
      if (remaining <= 0) {
        setIsExpired(true);
        setShowModal(true);
        clearInterval(timer);
      }
    }, 30000);
    
    return () => clearInterval(timer);
  }, [isGuestSession]);
  
  // Functions to handle login/register
  const handleLogin = () => {
    // Navigate to login screen
    // @ts-ignore - Navigation typing is complex with dynamic routes
    navigation.navigate('auth');
    setShowModal(false);
  };
  
  const handleRegister = () => {
    // Navigate to register screen
    // @ts-ignore - Navigation typing is complex with dynamic routes
    navigation.navigate('auth', { screen: 'Register' });
    setShowModal(false);
  };
  
  return {
    isGuestSession,
    isExpired,
    isLoading,
    showModal,
    setShowModal,
    handleLogin,
    handleRegister
  };
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalText: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.textDark || '#333',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    width: '48%',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default GuestSessionExpiryModal;