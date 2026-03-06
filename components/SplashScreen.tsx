import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

export default function SplashScreen() {
  const [isDark, setIsDark] = useState(false);

  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(20);
  const pulseScale = useSharedValue(1);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);
  const dotOpacity = useSharedValue(0);

  useEffect(() => {
    // Detect dark mode preference
    AsyncStorage.getItem('darkMode').then(val => {
      if (val) setIsDark(JSON.parse(val));
    }).catch(() => {});

    // Logo entrance
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Pulsing ring
    ringScale.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 0 })
      ),
      -1
    ));
    ringOpacity.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(0.4, { duration: 200 }),
        withTiming(0, { duration: 1300 })
      ),
      -1
    ));

    // Gentle pulse on logo
    pulseScale.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    ));

    // Text entrance
    textOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    textY.value = withDelay(500, withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }));

    // Loading dots
    dotOpacity.value = withDelay(800, withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1
    ));
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value * pulseScale.value }],
    opacity: logoOpacity.value,
  }));

  const ringAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: interpolate(dotOpacity.value, [0.3, 1], [1, 0.3]),
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  // Theme-aware colors
  const gradientColors = isDark
    ? ['#1A1F2E', '#1E2537', '#1A2A2E', '#1C2028'] as const
    : ['#EBF4FF', '#F0EBFF', '#E8F9F0', '#F5F8FB'] as const;

  const ringColor = isDark ? '#7BA3C9' : '#5B8FB9';
  const logoShadowColor = isDark ? '#7BA3C9' : '#5B8FB9';
  const logoBgColor = isDark ? 'rgba(40,50,70,0.8)' : 'rgba(255,255,255,0.6)';
  const nameColor = isDark ? '#E8EDF4' : '#2D3748';
  const taglineColor = isDark ? '#8B9AB5' : '#718096';
  const dotColor = isDark ? '#7BA3C9' : '#5B8FB9';
  const orbAlpha = isDark ? '08' : '06';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors as unknown as [string, string, ...string[]]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative floating orbs */}
      <View style={[styles.orb, styles.orb1, { backgroundColor: `rgba(91,143,185,0.${orbAlpha})` }]} />
      <View style={[styles.orb, styles.orb2, { backgroundColor: `rgba(155,142,196,0.${orbAlpha})` }]} />
      <View style={[styles.orb, styles.orb3, { backgroundColor: `rgba(125,184,158,0.${isDark ? '04' : '05'})` }]} />

      <View style={styles.center}>
        {/* Expanding ring */}
        <Animated.View style={[styles.ring, { borderColor: ringColor }, ringAnimStyle]} />

        {/* Logo */}
        <Animated.View style={[styles.logoContainer, { backgroundColor: logoBgColor, shadowColor: logoShadowColor }, logoAnimStyle]}>
          <Image
            source={require('../assets/images/splash-logo.png')}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>

        {/* App name and tagline */}
        <Animated.View style={[styles.textContainer, textAnimStyle]}>
          <Text style={[styles.appName, { color: nameColor }]}>MindSpace</Text>
          <Text style={[styles.tagline, { color: taglineColor }]}>Your safe space for mental wellness</Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View style={[styles.dotsContainer, textAnimStyle]}>
          <Animated.View style={[styles.loadingDot, { backgroundColor: dotColor }, dot1Style]} />
          <Animated.View style={[styles.loadingDot, { backgroundColor: dotColor }, dot2Style]} />
          <Animated.View style={[styles.loadingDot, { backgroundColor: dotColor }, dot3Style]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  logo: {
    width: 140,
    height: 140,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 180,
    height: 180,
    top: SH * 0.12,
    left: -40,
  },
  orb2: {
    width: 120,
    height: 120,
    top: SH * 0.08,
    right: -20,
  },
  orb3: {
    width: 150,
    height: 150,
    bottom: SH * 0.15,
    right: -30,
  },
});
