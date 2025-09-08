import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';
import PostCard from '@/components/PostCard';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for posts
const mockPosts = [
  {
    id: '1',
    userName: 'John Doe',
    content: 'Just finished my project at SJCEM!',
    likesCount: 25,
    commentsCount: 5
  },
  {
    id: '2',
    userName: 'Jane Smith',
    content: 'Check out our college fest preparations!',
    image: 'https://picsum.photos/seed/picsum1/400/300',
    likesCount: 42,
    commentsCount: 8
  },
  {
    id: '3',
    userName: 'Alex Johnson',
    content: 'Hackathon preparations are in full swing!',
    likesCount: 15,
    commentsCount: 3
  }
];

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {mockPosts.map(post => (
          <PostCard
            key={post.id}
            userName={post.userName}
            content={post.content}
            image={post.image}
            likesCount={post.likesCount}
            commentsCount={post.commentsCount}
            onLike={() => console.log('Like pressed')}
            onComment={() => console.log('Comment pressed')}
            onShare={() => console.log('Share pressed')}
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
  }
});

export default HomeScreen;
