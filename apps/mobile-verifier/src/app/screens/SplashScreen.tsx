import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polygon } from 'react-native-svg';

const { width } = Dimensions.get('window');

// ─── Animated SVG Shield ──────────────────────────────────
const AnimatedShield = ({ glowOpacity }: { glowOpacity: Animated.Value }) => (
  <Svg width={120} height={140} viewBox="0 0 120 140" fill="none">
    {/* Outer shield */}
    <Path
      d="M60 4 L108 24 L108 72 Q108 112 60 136 Q12 112 12 72 L12 24 Z"
      fill="#0D0D0D"
      stroke="#DC2626"
      strokeWidth={2}
    />
    {/* Inner shield glow ring */}
    <Path
      d="M60 18 L96 34 L96 72 Q96 104 60 122 Q24 104 24 72 L24 34 Z"
      fill="none"
      stroke="#7F1D1D"
      strokeWidth={1}
    />
    {/* Lock body */}
    <View style={{ position: 'absolute', top: 44, left: 42 }}>
      <Svg width={36} height={38} viewBox="0 0 36 38">
        <Path
          d="M8 16 L8 12 Q8 4 18 4 Q28 4 28 12 L28 16 L30 16 Q32 16 32 18 L32 34 Q32 36 30 36 L6 36 Q4 36 4 34 L4 18 Q4 16 6 16 Z"
          fill="#1A1A1A"
          stroke="#DC2626"
          strokeWidth={1.5}
        />
        {/* Shackle */}
        <Path
          d="M12 16 L12 12 Q12 8 18 8 Q24 8 24 12 L24 16"
          fill="none"
          stroke="#EF4444"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Keyhole body */}
        <Circle cx={18} cy={24} r={3.5} fill="#DC2626" />
        {/* Keyhole slot */}
        <Path d="M16.5 24 L16.5 30 L19.5 30 L19.5 24" fill="#DC2626" />
      </Svg>
    </View>
  </Svg>
);

// ─── Main Splash Screen ───────────────────────────────────
export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  // Animation values
  const shieldScale    = useRef(new Animated.Value(0.3)).current;
  const shieldOpacity  = useRef(new Animated.Value(0)).current;
  const glowOpacity    = useRef(new Animated.Value(0)).current;
  const titleOpacity   = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth      = useRef(new Animated.Value(0)).current;
  const screenOpacity  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      // 1. Shield pops in
      Animated.parallel([
        Animated.spring(shieldScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(shieldOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 2. Glow pulse
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 3. Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 4. Red accent line grows
      Animated.timing(lineWidth, {
        toValue: 1,           // used as scaleX
        duration: 500,
        useNativeDriver: true,
      }),
      // 5. Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 6. Hold for 0.8s
      Animated.delay(800),
      // 7. Fade whole screen out
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    sequence.start(() => onFinish());
  }, []);

  // Glow pulse loop (runs independently)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.wrapper, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.container}>

        {/* Shield with glow halo */}
        <View style={styles.shieldWrapper}>
          {/* Glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              { opacity: glowOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.shieldContainer,
              {
                transform: [{ scale: shieldScale }],
                opacity: shieldOpacity,
              },
            ]}
          >
            <AnimatedShield glowOpacity={glowOpacity} />
          </Animated.View>
        </View>

        {/* App name */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.appName}>
            Secure<Text style={styles.appNameAccent}>Verify</Text>
          </Text>

          {/* Red accent line */}
          <Animated.View
            style={[
              styles.accentLine,
              { transform: [{ scaleX: lineWidth }] },
            ]}
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Offline Identity Verification
        </Animated.Text>

        {/* Corner scan-line decorations */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 20,
  },
  shieldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 140,
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 10,
  },
  appNameAccent: {
    color: '#DC2626',
  },
  accentLine: {
    width: 160,
    height: 2,
    backgroundColor: '#DC2626',
    borderRadius: 1,
    marginBottom: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#6B7280',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  // Corner decorations
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#7F1D1D',
    borderWidth: 1.5,
  },
  cornerTL: { top: 32, left: 24, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 32, right: 24, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 32, left: 24, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 32, right: 24, borderLeftWidth: 0, borderTopWidth: 0 },
});
