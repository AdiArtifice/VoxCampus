import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import CommentItem from './CommentItem';

interface CommentsProps {
  postId: string;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Collapsible comments section component
 * Displays comments list, handles new comment input, and manages UI state
 */
const Comments: React.FC<CommentsProps> = ({ postId, isVisible, onClose }) => {
  const { user, initializing } = useAuth();
  const {
    comments,
    loading,
    loadingUserData,
    submitting,
    addComment,
    deleteComment,
    formatTimestamp
  } = useComments(postId);

  const [commentText, setCommentText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  /**
   * Handle keyboard show/hide events for better UX
   */
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  /**
   * Auto-focus input and scroll to bottom when comments section opens
   * Only run when becoming visible, not on every render
   */
  useEffect(() => {
    if (isVisible && !hasInitialized) {
      setHasInitialized(true);
      // Small delay to ensure component is rendered
      setTimeout(() => {
        textInputRef.current?.focus();
        scrollToBottom();
      }, 150);
    } else if (!isVisible) {
      setHasInitialized(false);
    }
  }, [isVisible, hasInitialized]);

  /**
   * Auto-scroll to bottom when new comments are added
   * But only if component is visible and has comments
   */
  useEffect(() => {
    if (isVisible && comments.length > 0 && !loading && !loadingUserData) {
      // Only scroll if we're not loading to prevent jumping
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [comments.length, isVisible, loading, loadingUserData]);

  /**
   * Scroll comments list to bottom (most recent comments)
   */
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  /**
   * Handle comment submission
   */
  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;

    const success = await addComment(commentText);
    if (success) {
      setCommentText(''); // Clear input on success
      Keyboard.dismiss(); // Hide keyboard after submission
      scrollToBottom(); // Scroll to show new comment
    }
  };

  /**
   * Handle comment deletion (only for comment owner)
   */
  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  if (!isVisible) return null;

  return (
    <View style={[styles.container, { marginBottom: keyboardHeight }]}>
      {/* Comments Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Comments ({comments.length})
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Comments List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.commentsContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Show loading only when initializing or when we have no comments yet */}
        {(initializing || (loading && comments.length === 0)) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#4a90e2" size="small" />
            <Text style={styles.loadingText}>
              {initializing ? 'Initializing...' : 'Loading comments...'}
            </Text>
          </View>
        ) : comments.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No comments yet. Be the first to comment!
            </Text>
          </View>
        ) : (
          <>
            {/* Subtle loading indicator when loading user data for existing comments */}
            {loadingUserData && comments.length > 0 && (
              <View style={styles.subtleLoadingContainer}>
                <ActivityIndicator color="#4a90e2" size="small" />
                <Text style={styles.subtleLoadingText}>Updating user info...</Text>
              </View>
            )}
            {comments.map((comment) => (
              <CommentItem
                key={comment.$id}
                comment={comment}
                onDelete={handleDeleteComment}
                canDelete={user?.$id === comment.userId}
                formatTimestamp={formatTimestamp}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Comment Input Section */}
      {user ? (
        <View style={styles.inputContainer}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder="Write a comment..."
            placeholderTextColor={COLORS.gray}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSubmitComment}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: commentText.trim() && !submitting 
                  ? '#4a90e2' 
                  : COLORS.lightGray 
              }
            ]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={[
                styles.sendButtonText,
                { 
                  color: commentText.trim() && !submitting 
                    ? COLORS.white 
                    : COLORS.gray 
                }
              ]}>
                Send
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>
            Please log in to comment
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    maxHeight: 400 // Limit height to prevent overwhelming the screen
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: '#f8f9fa'
  },
  headerTitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: -2 // Visual adjustment
  },
  commentsContainer: {
    maxHeight: 250, // Scrollable area height
    backgroundColor: COLORS.white
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.lg
  },
  loadingText: {
    marginLeft: SIZES.sm,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.xl
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.md,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.black,
    maxHeight: 100, // Limit input height
    marginRight: SIZES.sm
  },
  sendButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60
  },
  sendButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '600'
  },
  loginPrompt: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: '#f8f9fa'
  },
  loginText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray
  },
  subtleLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.md,
    backgroundColor: '#f0f7ff',
    borderRadius: SIZES.borderRadius.sm,
    marginBottom: SIZES.xs
  },
  subtleLoadingText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#4a90e2',
    marginLeft: SIZES.xs
  }
});

export default Comments;