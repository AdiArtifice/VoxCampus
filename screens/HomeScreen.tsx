import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/rn.png')}
            style={styles.profileImage}
          />
        </View>
        <View style={styles.titleContainer}>
          <Image 
            source={require('@/assets/images/appwrite-logo.png')}
            style={{ width: 25, height: 25 }}
          />
          <Text style={styles.title}>VoxCampus</Text>
        </View>
      </View>

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
  header: {
    height: 71,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md
  },
  logoContainer: {
    width: 54,
    height: 53,
    marginRight: SIZES.md
  },
  profileImage: {
    width: 54,
    height: 53,
    borderRadius: 10
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm
  },
  title: {
    fontFamily: FONTS.stencil,
    fontSize: 30,
    color: COLORS.secondary
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
