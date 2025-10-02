import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Linking,
  SafeAreaView,
  Platform,
  Dimensions
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import StandalonePostCard from '@/components/StandalonePostCard';
import PostHead from '@/components/PostHead';
import { databases } from '@/lib/appwrite';

const { width: screenWidth } = Dimensions.get('window');

interface Post {
  $id: string;
  title: string;
  description: string;
  organizer?: string;
  organizerId?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  rsvpUrl?: string;
  meetingUrl?: string;
  infoUrl?: string;
  bannerUrl?: string;
  type?: string;
}

export default function StandalonePostView() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
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

      // Clean and validate postId
      const cleanPostId = typeof postId === 'string' ? postId.trim() : String(postId).trim();

      try {
        setLoading(true);
        setError('');
        
        // Fetch post from events_and_sessions collection
        const eventResponse = await databases.getDocument(
          process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
          'events_and_sessions',
          cleanPostId
        );
        
        if (eventResponse) {
          setPost(eventResponse as unknown as Post);
        } else {
          setError('Post not found');
        }
        
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Post not found or no longer available');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  const handleOpenApp = () => {
    if (Platform.OS === 'web') {
      // On web, navigate to the main app
      window.location.href = '/';
    } else {
      // On mobile, this would open the app
      Linking.openURL('voxcampus://');
    }
  };

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
        {/* VoxCampus Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>VoxCampus</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleOpenApp}>
            <Text style={styles.ctaButtonText}>Explore More Posts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😔</Text>
          <Text style={styles.errorTitle}>Post Not Found</Text>
          <Text style={styles.errorText}>
            This post might have been removed or the link is incorrect.
          </Text>
          <TouchableOpacity style={styles.goHomeButton} onPress={handleOpenApp}>
            <Text style={styles.goHomeButtonText}>Discover Other Posts</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Meta Tags for Social Sharing */}
      <PostHead
        title={post.title}
        description={post.description}
        imageUrl={post.bannerUrl}
        postId={post.$id}
      />
      
      {/* VoxCampus Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>VoxCampus</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={handleOpenApp}>
          <Text style={styles.ctaButtonText}>Explore More Posts</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Standalone Post Card */}
        <StandalonePostCard
          postId={post.$id}
          title={post.title}
          description={post.description}
          organizer={post.organizer}
          startAt={post.startAt}
          endAt={post.endAt}
          location={post.location}
          bannerUrl={post.bannerUrl}
          rsvpUrl={post.rsvpUrl}
          meetingUrl={post.meetingUrl}
          infoUrl={post.infoUrl}
          type={post.type}
        />

        {/* Call to Action */}
        <View style={styles.bottomCta}>
          <Text style={styles.ctaTitle}>Discover More Campus Events</Text>
          <Text style={styles.ctaDescription}>
            Join VoxCampus to stay updated with all campus activities, events, and opportunities.
          </Text>
          <TouchableOpacity style={styles.mainCtaButton} onPress={handleOpenApp}>
            <Text style={styles.mainCtaButtonText}>Open VoxCampus App</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  brandName: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.borderRadius.md,
  },
  ctaButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SIZES.lg,
    paddingHorizontal: Platform.OS === 'web' ? Math.max(SIZES.md, (screenWidth - 600) / 2) : SIZES.md,
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
  errorEmoji: {
    fontSize: 48,
    marginBottom: SIZES.md,
  },
  errorTitle: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.black,
    marginBottom: SIZES.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.lg,
    lineHeight: 24,
  },
  goHomeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.borderRadius.md,
  },
  goHomeButtonText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  bottomCta: {
    marginTop: SIZES.lg,
    padding: SIZES.lg,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaTitle: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  ctaDescription: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.lg,
  },
  mainCtaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.borderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  mainCtaButtonText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});