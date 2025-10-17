// Example of how to integrate the demo user functionality into a screen component

// In your screen file, e.g., HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { databases, Query } from '@/lib/appwrite';
import { APPWRITE } from '@/lib/config';
import { useAuth } from '@/hooks/useAuth';
import { applyTestUserOverride, logTestUserAccess } from '@/utils/demoUser';
import TestUserBanner from '@/components/TestUserBanner';

// Example integration of test user functionality in a screen
export default function HomeScreenWithDemoSupport() {
  const { user, currentInstitutionId } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPosts();
  }, [currentInstitutionId]);
  
  const fetchPosts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Prepare base query
      let queries = [
        Query.orderDesc('createdAt')
      ];
      
      // Apply test user override if needed - this will bypass institution filtering for test user
      queries = await applyTestUserOverride(
        queries,
        user.email,
        currentInstitutionId
      );
      
      // Log the access if it's the test user
      await logTestUserAccess(
        user.email,
        'view',
        'home_posts'
      );
      
      // Fetch data with potentially modified queries
      const { documents } = await databases.listDocuments(
        APPWRITE.DATABASE_ID,
        'events_and_sessions',
        queries
      );
      
      setPosts(documents);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      {/* Display test user banner if applicable */}
      <TestUserBanner />
      
      {/* Rest of your screen content */}
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          // Your existing post rendering logic
          <Text>{item.title}</Text>
        )}
        keyExtractor={(item) => item.$id}
      />
    </View>
  );
}