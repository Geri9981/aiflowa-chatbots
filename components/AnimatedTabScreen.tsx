import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedTabScreenProps {
  children: React.ReactNode;
  /** Unique key to re-trigger animation on tab focus */
  focused?: boolean;
}

/**
 * Wraps tab content with a subtle fade + slide-up animation on mount/focus.
 */
export default function AnimatedTabScreen({ children, focused }: AnimatedTabScreenProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    // Reset and animate on focus
    opacity.value = 0;
    translateY.value = 12;
    opacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.ease) });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      {children}
    </Animated.View>
  );
}
