import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useShare } from '@/hooks/useShare';
import { getEnvironmentInfo, buildPostUrl } from '@/constants/environment';

export default function ShareTestScreen() {
  const [testPostId, setTestPostId] = useState('post1');
  const { sharePost, copyPostUrl, getShareableUrl, isSharing, lastSharedUrl, getShareDebugInfo } = useShare();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleTestShare = async () => {
    if (!testPostId.trim()) {
      Alert.alert('Error', 'Please enter a post ID to test');
      return;
    }

    const result = await sharePost(testPostId, {
      includeText: true,
      fallbackToCopy: true,
    });

    if (result.success) {
      Alert.alert(
        'Share Result',
        `${result.shared ? 'Shared successfully!' : result.copied ? 'Link copied to clipboard!' : 'Share completed'}\n\nURL: ${result.url}`
      );
    } else {
      Alert.alert('Share Error', result.error || 'Unknown error');
    }
  };

  const handleTestCopy = async () => {
    if (!testPostId.trim()) {
      Alert.alert('Error', 'Please enter a post ID to test');
      return;
    }

    const result = await copyPostUrl(testPostId);

    if (result.success) {
      Alert.alert('Link Copied', `The link has been copied to your clipboard!\n\nURL: ${result.url}`);
    } else {
      Alert.alert('Copy Error', result.error || 'Unknown error');
    }
  };

  const handleGetUrl = async () => {
    if (!testPostId.trim()) {
      Alert.alert('Error', 'Please enter a post ID to test');
      return;
    }

    const url = await getShareableUrl(testPostId);
    
    if (url) {
      Alert.alert('Generated URL', url);
    } else {
      Alert.alert('Error', 'Failed to generate URL');
    }
  };

  const handleShowDebugInfo = () => {
    const info = getShareDebugInfo();
    setDebugInfo(info);
  };

  const testUrls = ['post1', 'post2', 'post3'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Share Feature Test</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment Info</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Environment: {getEnvironmentInfo().environment}
            </Text>
            <Text style={styles.infoText}>
              Base URL: {getEnvironmentInfo().config.baseUrl}
            </Text>
            <Text style={styles.infoText}>
              Share Base URL: {getEnvironmentInfo().config.shareBaseUrl}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Post ID</Text>
          <TextInput
            style={styles.input}
            value={testPostId}
            onChangeText={setTestPostId}
            placeholder="Enter post ID to test"
            placeholderTextColor={COLORS.gray}
          />
          
          <Text style={styles.quickSelectLabel}>Quick Select:</Text>
          <View style={styles.quickButtons}>
            {testUrls.map((id) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.quickButton,
                  testPostId === id && styles.quickButtonActive,
                ]}
                onPress={() => setTestPostId(id)}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    testPostId === id && styles.quickButtonTextActive,
                  ]}
                >
                  {id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Actions</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.shareButton]}
            onPress={handleTestShare}
            disabled={isSharing}
          >
            <Text style={styles.buttonText}>
              {isSharing ? 'Sharing...' : 'Test Share Dialog'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.copyButton]}
            onPress={handleTestCopy}
            disabled={isSharing}
          >
            <Text style={styles.buttonText}>Copy URL to Clipboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.urlButton]}
            onPress={handleGetUrl}
            disabled={isSharing}
          >
            <Text style={styles.buttonText}>Generate URL Only</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>URL Preview</Text>
          <View style={styles.urlPreview}>
            <Text style={styles.urlText}>
              {buildPostUrl(testPostId)}
            </Text>
          </View>
        </View>

        {lastSharedUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Shared URL</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText} selectable>
                {lastSharedUrl}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.debugButton]}
          onPress={handleShowDebugInfo}
        >
          <Text style={styles.buttonText}>Show Debug Info</Text>
        </TouchableOpacity>

        {debugInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug Information</Text>
            <View style={styles.debugBox}>
              <Text style={styles.debugText} selectable>
                {JSON.stringify(debugInfo, null, 2)}
              </Text>
            </View>
          </View>
        )}
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
  },
  sectionTitle: {
    fontFamily: FONTS.body,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.sm,
  },
  infoBox: {
    backgroundColor: COLORS.lightGray,
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius.md,
  },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.black,
    marginBottom: SIZES.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.borderRadius.md,
    padding: SIZES.md,
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    marginBottom: SIZES.sm,
  },
  quickSelectLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: SIZES.xs,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: SIZES.xs,
  },
  quickButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.borderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.gray,
    backgroundColor: COLORS.white,
  },
  quickButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  quickButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.gray,
  },
  quickButtonTextActive: {
    color: COLORS.white,
  },
  button: {
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius.md,
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  shareButton: {
    backgroundColor: '#4267B2', // Facebook blue
  },
  copyButton: {
    backgroundColor: '#1DA1F2', // Twitter blue
  },
  urlButton: {
    backgroundColor: '#25D366', // WhatsApp green
  },
  debugButton: {
    backgroundColor: COLORS.gray,
  },
  buttonText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  urlPreview: {
    backgroundColor: '#f8f9fa',
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  urlText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  debugBox: {
    backgroundColor: '#2d3748',
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius.md,
    maxHeight: 300,
  },
  debugText: {
    fontFamily: 'Courier New',
    fontSize: 12,
    color: '#68d391',
  },
});