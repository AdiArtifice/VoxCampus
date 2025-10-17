import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { useGuestSession } from '../hooks/useGuestSession';
import { withGuestValidation } from '../components/withGuestValidation';
import { institutionFilter } from '../utils/institutionFilter';
import { databases, Query } from '../lib/appwrite';
import PostCard from '../components/PostCard';
import GuestSessionTimer from '../components/GuestSessionTimer';
import AppHeader from '../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

// Example screen that uses both guest validation and institution filtering
const ExampleScreen = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { guestSessionActive, institutionId } = useGuestSession();
  
  // Function to fetch posts with institution filtering
  async function getPosts() {
    try {
      // Create query with institution filtering
      const queries = institutionId 
        ? [Query.equal('institutionId', institutionId)]
        : [];
        
      // This would be your actual database call
      const response = await databases.listDocuments(
        '68c58e83000a2666b4d9',
        'posts',
        queries
      );
      return response.documents;
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Could not load posts. Please try again.');
      return [];
    }
  }
  
  // Load posts with filtering
  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Could not load posts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh action
  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };
  
  // Load posts on initial render and when institutionId changes
  useEffect(() => {
    loadPosts();
  }, [institutionId]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Example Screen</Text>
      </View>
      
      {/* Show timer for guest sessions */}
      {guestSessionActive && <GuestSessionTimer />}
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id || item.id}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.postTitle}>{item.title || 'Untitled Post'}</Text>
            <Text style={styles.postContent}>{item.content}</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts found</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFB',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#4682B4',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  postCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#444',
  },
});

// Export the screen wrapped with guest validation
// This adds both client and server-side validation
export default withGuestValidation(ExampleScreen);