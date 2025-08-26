import React, { useMemo, useState } from 'react';
import { ActivityIndicator, GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import type { Models } from 'react-native-appwrite';

export type SocialAuthVariant = 'signup' | 'signin';

type Props = {
  variant: SocialAuthVariant;
  onSuccess?: (user: Models.User<Models.Preferences>) => void;
  onError?: (error: any) => void;
};

export const SocialAuthButtons: React.FC<Props> = ({ variant, onSuccess, onError }) => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const label = useMemo(() => (variant === 'signup' ? 'Sign up with Google' : 'Continue with Google'), [variant]);
  const a11y = useMemo(() => (variant === 'signup' ? 'Sign up with Google' : 'Continue with Google'), [variant]);

  const onPress = async (_e: GestureResponderEvent) => {
    if (loading) return;
    try {
      setLoading(true);
      const user = await signInWithGoogle();
      // First-time user detection (debug log only; routing to be handled by consumer of onSuccess)
      if (user) {
        const createdAt = (user as any).$createdAt ? new Date((user as any).$createdAt) : undefined;
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
        const prefs = user.prefs as any;
        const isNew = (prefs?.onboarded !== true) || (!!createdAt && createdAt > tenMinsAgo) || !user.name;
        console.log('[SocialAuthButtons] Signed in via Google. New user?', isNew, { id: user.$id, email: user.email });
      }
      onSuccess?.(user!);
    } catch (e: any) {
      // Swallow cancel silently but still re-enable button
      const msg = e?.message || '';
      if (msg && msg !== 'Sign-in canceled') {
        console.log('[SocialAuthButtons] Google sign-in error:', e);
        onError?.(e);
      } else {
        console.log('[SocialAuthButtons] User canceled Google sign-in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={a11y}
        onPress={onPress}
        disabled={loading}
        style={[styles.btn, loading && styles.btnDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <View style={styles.innerContent}>
            <AntDesign name="google" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.text}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
  },
  btn: {
    backgroundColor: '#FD366E',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    minHeight: 44, // min touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SocialAuthButtons;
