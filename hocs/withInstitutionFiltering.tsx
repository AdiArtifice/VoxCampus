import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { getInstitutionIdFromEmail } from '@/utils/institutionFilter';
import { COLORS, FONTS } from '@/constants/theme';

/**
 * Higher-order component that provides institution filtering capability
 * to components that need to fetch data from Appwrite
 * 
 * @param WrappedComponent Component to enhance with institution filtering
 * @returns Enhanced component with institutionId prop
 */
export function withInstitutionFiltering<P extends { institutionId?: string }>(
  WrappedComponent: React.ComponentType<P>
) {
  // Return a new component with additional props
  return (props: Omit<P, 'institutionId'>) => {
    const { user } = useAuth();
    const { institutionId: guestInstitutionId, isGuestSession } = useGuestSession();
    const [institutionId, setInstitutionId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
      const determineInstitution = async () => {
        setLoading(true);
        try {
          console.log(`[DEBUG] withInstitutionFiltering - Determining institution. User: ${user?.email || 'none'}, Guest: ${isGuestSession}`);
          let id: string | null = null;

          if (user) {
            // For logged-in users, determine institution from email
            id = await getInstitutionIdFromEmail(user.email);
            console.log(`[DEBUG] withInstitutionFiltering - User institution: ${id}`);
          } else if (isGuestSession) {
            // For guest users, use the default institution
            id = guestInstitutionId;
            console.log(`[DEBUG] withInstitutionFiltering - Guest institution: ${id}`);
          } else {
            // Neither logged in nor guest - shouldn't happen, but handle gracefully
            console.warn('[DEBUG] withInstitutionFiltering - User is neither logged in nor in guest session');
            // Default to the default institution for safety
            id = 'default_institution';
            console.log(`[DEBUG] withInstitutionFiltering - Falling back to default: ${id}`);
          }

          setInstitutionId(id);
        } catch (error) {
          console.error('[DEBUG] withInstitutionFiltering - Error determining institution:', error);
          // Set default institution as a fallback
          setInstitutionId('default_institution');
        } finally {
          setLoading(false);
        }
      };

      determineInstitution();
    }, [user, guestInstitutionId, isGuestSession]);

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (!institutionId) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Unable to determine institution. Please try again.
          </Text>
        </View>
      );
    }

    // Cast to P to satisfy TypeScript
    const enhancedProps = {
      ...props as any,
      institutionId,
    } as P;

    return <WrappedComponent {...enhancedProps} />;
  };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    marginTop: 10,
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
    color: COLORS.error,
  },
});