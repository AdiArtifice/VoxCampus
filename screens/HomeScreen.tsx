import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';
import PostCard from '@/components/PostCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases, Query } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import GuestSessionTimer from '@/components/GuestSessionTimer';
import { withInstitutionFiltering } from '@/hocs/withInstitutionFiltering';
import { institutionFilter } from '@/utils/institutionFilter';
import { withGuestVerification } from '@/utils/apiAccessControl';

type Assoc = { $id: string; name: string; images?: string | null };
type EventDoc = {
  $id: string;
  title: string;
  description?: string;
  bannerUrl?: string | null;
  imageUrl?: string | null;
  organizer?: string | null;
  organizerId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  rsvpUrl?: string | null;
  meetingUrl?: string | null;
  infoUrl?: string | null;
};

interface HomeScreenProps {
  institutionId?: string;
}

const HomeScreenComponent = ({ institutionId }: HomeScreenProps) => {
  const databaseId = (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string) || '68c58e83000a2666b4d9';
  const eventsCol = 'events_and_sessions';
  const assocCol = 'association';

  const { user } = useAuth();
  const { isGuestSession, guestSessionActive, startNewGuestSession } = useGuestSession();
  
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [assocs, setAssocs] = useState<Record<string, Assoc>>({});

  // Start guest session if user is not logged in and no active session
  useEffect(() => {
    if (!user && !guestSessionActive) {
      startNewGuestSession();
    }
  }, [user, guestSessionActive]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve association image which may be a full URL or an Appwrite Storage file ID
  const assocBucketId = (process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_BUCKET_ID as string) || '68cd3daf000b092d007b';
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT as string | undefined;
  const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID as string | undefined;
  const resolveAssocImage = (img?: string | null): string | undefined => {
    if (!img) return undefined;
    if (/^https?:\/\//i.test(img)) {
      try {
        const url = new URL(img);
        const isAppwriteStorage = /\/storage\/buckets\//.test(url.pathname);
        if (isAppwriteStorage) {
          // Remove admin-only param if present
          if (url.searchParams.has('mode')) url.searchParams.delete('mode');
          // Ensure project param exists; if missing and we have env project, add it
          if (!url.searchParams.get('project') && project) {
            url.searchParams.set('project', project);
          }
          return url.toString();
        }
      } catch {}
      return img;
    }
    if (endpoint && project) {
      return `${endpoint}/storage/buckets/${assocBucketId}/files/${img}/view?project=${project}`;
    }
    return undefined;
  };

  useEffect(() => {
    let cancelled = false;
    
    // Skip loading if institutionId is not available
    if (!institutionId) return;

    const fetchData = withGuestVerification(async () => {
      setLoading(true);
      setError(null);
      try {
        // Include institution filter in the query
        const res = await databases.listDocuments(databaseId, eventsCol, [
          Query.orderDesc('startAt'),
          Query.limit(50),
          // Filter by institution ID
          institutionFilter(institutionId)
        ]);
        
        const docs = (res.documents || []) as unknown as EventDoc[];
        if (cancelled) return;
        setEvents(docs);

        // Collect organizerIds and fetch matching associations
        const ids = Array.from(new Set(docs.map(d => d.organizerId).filter(Boolean))) as string[];
        if (ids.length) {
          // Also filter associations by institution
          const assocRes = await databases.listDocuments(databaseId, assocCol, [
            Query.equal('$id', ids),
            Query.limit(ids.length),
            // Filter by institution ID
            institutionFilter(institutionId)
          ]);
          
          const map: Record<string, Assoc> = {};
          (assocRes.documents as any[]).forEach((a: any) => {
            map[a.$id] = { $id: a.$id, name: a.name, images: a.images };
          });
          if (!cancelled) setAssocs(map);
        } else {
          if (!cancelled) setAssocs({});
        }
      } catch (e: any) {
        if (!cancelled) {
          // Handle guest session expired error specifically
          if (e?.message?.includes('Guest session expired')) {
            setError('Guest session expired. Please log in to continue.');
          } else {
            setError(e?.message ?? 'Failed to load feed');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    
    fetchData();
    return () => { cancelled = true; };
  }, [institutionId]);

  const feedItems = useMemo(() => {
    return events.map((ev) => {
      const assoc = ev.organizerId ? assocs[ev.organizerId] : undefined;
      const userName = assoc?.name || ev.organizer || 'Organizer';
      const userAvatar = resolveAssocImage(assoc?.images);
      const image = ev.imageUrl || ev.bannerUrl || undefined;
      const content = ev.description || ev.title;
      if (__DEV__) {
        // Lightweight debug hint for avatar URL resolution
        // eslint-disable-next-line no-console
        console.log('[FeedItem]', ev.$id, 'assoc:', assoc?.$id, 'avatar:', userAvatar);
      }
      return {
        id: ev.$id,
        userName,
        userAvatar,
        image,
        content,
        rsvpUrl: ev.rsvpUrl || undefined,
        meetingUrl: ev.meetingUrl || undefined,
        infoUrl: ev.infoUrl || undefined
      };
    });
  }, [events, assocs]);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      {/* Add Guest Session Timer for non-logged in users */}
      {!user && <GuestSessionTimer />}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.centerWrap}><ActivityIndicator color={COLORS.primary} /></View>
        )}
        {!!error && !loading && (
          <View style={styles.centerWrap}><Text>{error}</Text></View>
        )}
        {!loading && !error && feedItems.map(post => (
          <PostCard
            key={post.id}
            postId={post.id} // Pass postId for likes and comments functionality
            userName={post.userName}
            userAvatar={post.userAvatar}
            content={post.content}
            image={post.image}
            rsvpUrl={post.rsvpUrl}
            meetingUrl={post.meetingUrl}
            infoUrl={post.infoUrl}
            onSave={() => console.log('Save pressed')}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: SIZES.md,
    gap: SIZES.md
  },
  centerWrap: {
    padding: SIZES.lg,
    alignItems: 'center'
  }
});

// Wrap component with institution filtering HOC
const HomeScreen = withInstitutionFiltering(HomeScreenComponent);

export default HomeScreen;
