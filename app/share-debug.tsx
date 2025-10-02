import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useShare } from '@/hooks/useShare';
import { buildShareablePostUrl, getEnvironmentConfig } from '@/constants/environment';
import { databases } from '@/lib/appwrite';

interface DatabasePost {
  $id: string;
  title: string;
  organizer?: string;
  type?: string;
}

export default function ShareDebugScreen() {
  const router = useRouter();
  const { sharePost, copyPostUrl, isSharing } = useShare();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [availablePosts, setAvailablePosts] = useState<DatabasePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailablePosts();
  }, []);

  const loadAvailablePosts = async () => {
    try {
      setLoading(true);
      addResult('Loading available posts from database...');
      
      const response = await databases.listDocuments(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        'events_and_sessions'
      );
      
      addResult(`Found ${response.documents.length} posts in database`);
      setAvailablePosts(response.documents as unknown as DatabasePost[]);
      
      // Log all post IDs for debugging
      response.documents.forEach((post: any) => {
        addResult(`Post: "${post.title}" - ID: ${post.$id}`);
      });
      
    } catch (error) {
      addResult(`❌ Error loading posts: ${error}`);
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testProductionUrl = async () => {
    const testPostId = '68d1553a00340737f6bf'; // Use the ID from your test
    const url = buildShareablePostUrl(testPostId);
    
    addResult(`Generated URL: ${url}`);
    
    // Check if it's a production URL
    if (url.includes('voxcampusorg.appwrite.network')) {
      addResult('✅ SUCCESS: Production URL generated correctly!');
    } else {
      addResult('❌ ERROR: Still generating localhost URL');
    }
    
    Alert.alert('URL Generated', `The URL that will be shared:\n\n${url}`);
  };

  const testShare = async () => {
    const testPostId = '68d1553a00340737f6bf';
    addResult(`Testing share for post: ${testPostId}`);
    
    try {
      const result = await sharePost(testPostId, { 
        includeText: true, 
        fallbackToCopy: true 
      });
      
      if (result.success) {
        addResult(`✅ Share result: ${result.shared ? 'Shared' : 'Copied'}`);
        addResult(`URL: ${result.url}`);
      } else {
        addResult(`❌ Share failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Share error: ${error}`);
    }
  };

  const testCopy = async () => {
    const testPostId = '68d1553a00340737f6bf';
    addResult(`Testing copy URL for post: ${testPostId}`);
    
    try {
      const result = await copyPostUrl(testPostId);
      
      if (result.success) {
        addResult(`✅ Copy successful: ${result.url}`);
      } else {
        addResult(`❌ Copy failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Copy error: ${error}`);
    }
  };

  const testPostUrl = (postId: string, title: string) => {
    addResult(`Testing post URL for: ${title} (${postId})`);
    router.push(`/post/${postId}`);
  };

  const shareRealPost = async (postId: string, title: string) => {
    addResult(`Sharing real post: ${title} (${postId})`);
    
    try {
      const result = await sharePost(postId, { 
        includeText: true, 
        fallbackToCopy: true 
      });
      
      if (result.success) {
        addResult(`✅ Real post share result: ${result.shared ? 'Shared' : 'Copied'}`);
        addResult(`URL: ${result.url}`);
      } else {
        addResult(`❌ Real post share failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Real post share error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const envConfig = getEnvironmentConfig();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Share Debug & Test</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment Info</Text>
          <Text style={styles.infoText}>Environment: {envConfig.environment}</Text>
          <Text style={styles.infoText}>Base URL: {envConfig.baseUrl}</Text>
          <Text style={styles.infoText}>Share URL: {envConfig.shareBaseUrl}</Text>
          <Text style={styles.infoText}>Is Production: {envConfig.isProduction ? 'Yes' : 'No'}</Text>
          <Text style={styles.infoText}>Is Development: {envConfig.isDevelopment ? 'Yes' : 'No'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Posts ({availablePosts.length})</Text>
          {loading ? (
            <Text style={styles.infoText}>Loading posts...</Text>
          ) : (
            availablePosts.map((post) => (
              <View key={post.$id} style={styles.postItem}>
                <Text style={styles.postTitle} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.postId}>ID: {post.$id}</Text>
                <Text style={styles.postInfo}>
                  Organizer: {post.organizer || 'Unknown'} | Type: {post.type || 'Unknown'}
                </Text>
                
                <View style={styles.postActions}>
                  <TouchableOpacity 
                    style={[styles.button, styles.smallButton, styles.testButton]} 
                    onPress={() => testPostUrl(post.$id, post.title)}
                  >
                    <Text style={styles.buttonText}>Test URL</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.smallButton, styles.shareButton]} 
                    onPress={() => shareRealPost(post.$id, post.title)}
                  >
                    <Text style={styles.buttonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Actions</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={testProductionUrl}
          >
            <Text style={styles.buttonText}>Test URL Generation</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.shareButton, isSharing && styles.disabledButton]} 
            onPress={testShare}
            disabled={isSharing}
          >
            <Text style={styles.buttonText}>
              {isSharing ? 'Sharing...' : 'Test Share Dialog'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.copyButton]} 
            onPress={testCopy}
          >
            <Text style={styles.buttonText}>Test Copy URL</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.clearButton]} 
            onPress={clearResults}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <View style={styles.resultsContainer}>
            {testResults.length === 0 ? (
              <Text style={styles.noResultsText}>No test results yet. Run a test above.</Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={styles.resultText} selectable>
                  {result}
                </Text>
              ))
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SIZES.md,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  section: {
    marginBottom: SIZES.lg,
    padding: SIZES.md,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: FONTS.body,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.sm,
  },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.black,
    marginBottom: SIZES.xs,
  },
  button: {
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius.md,
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  copyButton: {
    backgroundColor: '#FF9800',
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius.sm,
    minHeight: 100,
  },
  noResultsText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultText: {
    fontFamily: 'Courier New',
    fontSize: 12,
    color: COLORS.black,
    marginBottom: SIZES.xs,
    lineHeight: 16,
  },
  postItem: {
    backgroundColor: '#f8f9fa',
    padding: SIZES.sm,
    borderRadius: SIZES.borderRadius.sm,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  postTitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.xs,
  },
  postId: {
    fontFamily: 'Courier New',
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  postInfo: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: SIZES.sm,
  },
  postActions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  smallButton: {
    flex: 1,
    padding: SIZES.sm,
    marginBottom: 0,
  },
});