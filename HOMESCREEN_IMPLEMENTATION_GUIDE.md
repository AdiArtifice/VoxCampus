# HomeScreen Implementation with Institution Filtering

To update the HomeScreen to use institution filtering, make the following changes to the file `c:\Aditya Files\Projects\VoxCampus Main\VoxCampus App\screens\HomeScreen.tsx`:

## 1. Update Imports

```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';
import PostCard from '@/components/PostCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases, Query } from '@/lib/appwrite';
import { useInstitutionAuth } from '@/hooks/useInstitutionAuth';
import { GuestSession } from '@/utils/guestSession';
```

## 2. Update the HomeScreen Component

```typescript
const HomeScreen = () => {
  const databaseId = (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string) || '68c58e83000a2666b4d9';
  const eventsCol = 'events_and_sessions';
  const assocCol = 'association';

  // Use the institution-aware auth hook
  const { 
    isGuestUser, 
    institutionId, 
    createInstitutionFilter,
    checkGuestSession
  } = useInstitutionAuth();

  const [events, setEvents] = useState<EventDoc[]>([]);
  const [assocs, setAssocs] = useState<Record<string, Assoc>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestSessionValid, setGuestSessionValid] = useState(true);

  // Check guest session validity
  useEffect(() => {
    const validateGuestSession = async () => {
      if (isGuestUser) {
        const isValid = await checkGuestSession();
        setGuestSessionValid(isValid);
      } else {
        setGuestSessionValid(true);
      }
    };

    validateGuestSession();
    
    // For guest users, periodically check session validity
    let timer: NodeJS.Timeout | null = null;
    
    if (isGuestUser) {
      timer = setInterval(validateGuestSession, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGuestUser, checkGuestSession]);
```

## 3. Update the Data Fetching Logic

```typescript
  // Fetch events with institution filtering
  useEffect(() => {
    const fetchEvents = async () => {
      if (!guestSessionValid && isGuestUser) {
        // Don't fetch data if guest session is expired
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Create a query with institution filtering
        const queries = [
          Query.orderDesc('startAt'),
          Query.limit(20)
        ];
        
        // Add institution filter
        if (institutionId) {
          queries.push(Query.equal('institutionId', institutionId));
        } else {
          // Default to the default institution for guest users
          queries.push(Query.equal('institutionId', GuestSession.getDefaultInstitutionId()));
        }
        
        const response = await databases.listDocuments(
          databaseId,
          eventsCol,
          queries
        );
        
        setEvents(response.documents as EventDoc[]);
        
        // Extract unique organizer IDs to fetch association info
        const organizerIds = response.documents
          .map(doc => doc.organizerId)
          .filter(id => !!id);
        
        const uniqueOrganizerIds = [...new Set(organizerIds)];
        
        // If we have organizer IDs, fetch the associations with institution filtering
        if (uniqueOrganizerIds.length > 0) {
          const assocQueries = [
            Query.equal('$id', uniqueOrganizerIds)
          ];
          
          // Add institution filter for associations too
          if (institutionId) {
            assocQueries.push(Query.equal('institutionId', institutionId));
          } else {
            assocQueries.push(Query.equal('institutionId', GuestSession.getDefaultInstitutionId()));
          }
          
          const assocsResponse = await databases.listDocuments(
            databaseId,
            assocCol,
            assocQueries
          );
          
          // Convert to a map for easy lookup
          const assocsMap = assocsResponse.documents.reduce((acc, doc) => {
            acc[doc.$id] = doc as Assoc;
            return acc;
          }, {} as Record<string, Assoc>);
          
          setAssocs(assocsMap);
        }
        
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [databaseId, institutionId, guestSessionValid, isGuestUser]);
```

## 4. Add Institution Status Display (Optional)

```typescript
  // Render
  return (
    <SafeAreaView style={styles.container}>
      {isGuestUser && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestText}>
            Viewing as guest - {institutionId === GuestSession.getDefaultInstitutionId() 
              ? 'Default Institution' 
              : 'Institution Content'}
          </Text>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No events found</Text>
            </View>
          ) : (
            events.map((event) => (
              <PostCard
                key={event.$id}
                id={event.$id}
                title={event.title}
                description={event.description || ''}
                organizerName={event.organizer || assocs[event.organizerId || '']?.name || 'Unknown organizer'}
                bannerUrl={event.bannerUrl || undefined}
                startDate={event.startAt}
                endDate={event.endAt}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// Update styles to include guest banner
const styles = StyleSheet.create({
  // Include existing styles
  
  guestBanner: {
    backgroundColor: COLORS.secondary,
    padding: SIZES.sm,
    alignItems: 'center',
  },
  guestText: {
    color: COLORS.white,
    fontWeight: '500',
  },
});

export default HomeScreen;
```

This implementation:

1. Uses the `useInstitutionAuth` hook to get the current institution context
2. Adds institution filtering to database queries
3. Checks guest session validity before fetching data
4. Shows a banner for guest users
5. Properly handles expired guest sessions

Remember to adjust the specific fields and styling to match your existing implementation.