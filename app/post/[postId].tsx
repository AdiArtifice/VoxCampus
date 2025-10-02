import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/hooks/useAuth';
import { databases } from '@/lib/appwrite';

interface Post {
  $id: string;
  title: string;
  description?: string;
  organizer?: string;
  organizerId?: string;
  startAt?: string;
  endAt?: string;
  rsvpUrl?: string;
  meetingUrl?: string;
  infoUrl?: string;
  bannerUrl?: string;
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setError('No post ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        console.log('Loading post with ID:', postId);
        
        // Try to fetch from events_and_sessions collection
        const eventResponse = await databases.getDocument(
          process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
          'events_and_sessions',
          postId as string
        );
        
        console.log('Found post:', eventResponse);
        
        if (eventResponse) {
          setPost(eventResponse as unknown as Post);
        } else {
          setError('Post not found');
        }
        
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Post not found or no longer available');
        
        // Show alert for missing post
        Alert.alert(
          'Post Not Found',
          'The post you\'re looking for doesn\'t exist or has been removed.',
          [
            { text: 'Go Back', onPress: () => router.back() },
            { text: 'Go Home', onPress: () => router.replace('/') }
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>
            {error || 'Post not found'}
          </Text>
          <Text 
            style={styles.goHomeLink}
            onPress={() => router.replace('/')}
          >
            Go to Home
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PostCard
          postId={post.$id}
          userName={post.organizer || 'Unknown Organizer'}
          userAvatar={undefined}
          content={post.description || post.title}
          image={post.bannerUrl}
          rsvpUrl={post.rsvpUrl}
          meetingUrl={post.meetingUrl}
          infoUrl={post.infoUrl}
        />
        
        {/* Additional post details */}
        <View style={styles.additionalInfo}>
          <Text style={styles.infoText}>
            💡 Tip: You can like, comment, and share this post with others!
          </Text>
          
          {post.startAt && (
            <Text style={styles.detailText}>
              📅 Event Date: {new Date(post.startAt).toLocaleDateString()}
            </Text>
          )}
          
          {post.organizer && (
            <Text style={styles.detailText}>
              👥 Organized by: {post.organizer}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.gray,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  errorTitle: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.black,
    marginBottom: SIZES.md,
    fontWeight: 'bold',
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  goHomeLink: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  additionalInfo: {
    marginTop: SIZES.lg,
    padding: SIZES.md,
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.md,
  },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.black,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
});