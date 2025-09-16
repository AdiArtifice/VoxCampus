import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing, Text } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  onFinish?: () => void;
  durationMs?: number; // keep under 2000ms for snappy start
};

export default function AnimatedSplash({ onFinish, durationMs = 1600 }: Props) {
  // Logo intro
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  // Text sequence
  const textOpacity = useRef(new Animated.Value(0)).current;
  const voxX = useRef(new Animated.Value(-22)).current; // start left
  const campusX = useRef(new Animated.Value(22)).current; // start right
  // Optional fade at end
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const logoInMs = Math.min(500, durationMs * 0.35);
  const convergeMs = Math.min(450, durationMs * 0.45);
  const holdMs = Math.min(150, durationMs * 0.15); // brief hold while attached
  const fadeOutMs = Math.max(0, durationMs - (logoInMs + convergeMs + holdMs));

    // 1) Logo scale + fade in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: logoInMs,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        speed: 12,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2) Converge to center while fading in
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: convergeMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(voxX, {
          toValue: 0,
          duration: convergeMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(campusX, {
          toValue: 0,
          duration: convergeMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 3) Keep attached at center; brief hold, then fade out
        if (holdMs > 0) {
          setTimeout(() => {
            if (fadeOutMs > 0) {
              Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: fadeOutMs,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }).start(() => onFinish?.());
            } else {
              onFinish?.();
            }
          }, holdMs);
        } else if (fadeOutMs > 0) {
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: fadeOutMs,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }).start(() => onFinish?.());
        } else {
          onFinish?.();
        }
      });
    });
  }, [durationMs, logoOpacity, logoScale, textOpacity, voxX, campusX, overlayOpacity, onFinish]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]} pointerEvents="none">
      <LinearGradient
        colors={["#E6F2FF", "#4682B4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Logo */}
        <Animated.View style={[styles.center, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <Image
            source={require('@/assets/images/appwrite-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Vox + Campus: converge then split */}
        <Animated.View style={[styles.textRow, { opacity: textOpacity }]}>
          <Animated.View style={{ transform: [{ translateX: voxX }] }}>
            <MaskedView
              androidRenderingMode={'software'}
              style={styles.maskedView}
              maskElement={<Text style={styles.maskText}>Vox</Text>}
            >
              <LinearGradient
                colors={['#7C3AED', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.maskText, { opacity: 0 }]}>Vox</Text>
              </LinearGradient>
            </MaskedView>
          </Animated.View>
          <Animated.View style={{ transform: [{ translateX: campusX }], marginLeft: 6 }}>
            <MaskedView
              androidRenderingMode={'software'}
              style={styles.maskedView}
              maskElement={<Text style={styles.maskText}>Campus</Text>}
            >
              <LinearGradient
                colors={['#7C3AED', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.maskText, { opacity: 0 }]}>Campus</Text>
              </LinearGradient>
            </MaskedView>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 110,
    height: 110,
  },
  textRow: {
    flexDirection: 'row',
    marginTop: 14,
    alignItems: 'center',
  },
  maskedView: {
    height: 32, // Match font size
  },
  maskText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'black',
  },
});
