import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import theme from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';

const CIRCLE_SIZE = 260;
const CIRCLE_MIN_SCALE = 0.5;
const TOTAL_ROUNDS = 4;

type Phase = 'idle' | 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, addBreathingCompletion } = useApp();
  const t = getTranslation(language);

  const PHASES: { phase: Phase; label: string; duration: number }[] = [
    { phase: 'inhale', label: t.breatheIn, duration: 4000 },
    { phase: 'hold-in', label: t.hold, duration: 4000 },
    { phase: 'exhale', label: t.breatheOut, duration: 4000 },
    { phase: 'hold-out', label: t.hold, duration: 4000 },
  ];

  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const circleScale = useSharedValue(0.5);
  const pulseOpacity = useSharedValue(0.3);
  const ringScale = useSharedValue(1);

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    transform: [{ scale: circleScale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    borderRadius: (CIRCLE_SIZE + 40) / 2,
    opacity: pulseOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const currentPhase = isActive ? PHASES[currentPhaseIndex] : null;

  const hapticForPhase = useCallback((phase: Phase) => {
    if (phase === 'inhale') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (phase === 'exhale') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  }, []);

  const animatePhase = useCallback((phaseIndex: number) => {
    const phase = PHASES[phaseIndex];
    const dur = phase.duration;
    if (phase.phase === 'inhale') {
      circleScale.value = withTiming(1, { duration: dur, easing: Easing.bezier(0.4, 0, 0.2, 1) });
      pulseOpacity.value = withTiming(0.5, { duration: dur });
      ringScale.value = withTiming(1.15, { duration: dur });
    } else if (phase.phase === 'exhale') {
      circleScale.value = withTiming(0.5, { duration: dur, easing: Easing.bezier(0.4, 0, 0.2, 1) });
      pulseOpacity.value = withTiming(0.2, { duration: dur });
      ringScale.value = withTiming(0.95, { duration: dur });
    } else {
      pulseOpacity.value = withSequence(withTiming(0.6, { duration: dur / 2 }), withTiming(0.3, { duration: dur / 2 }));
    }
  }, [circleScale, pulseOpacity, ringScale]);

  const startCountdown = useCallback(() => {
    setCountdown(4);
    let c = 4;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { c -= 1; setCountdown(c); }, 1000);
  }, []);

  const advancePhase = useCallback(() => {
    setCurrentPhaseIndex(prev => {
      const next = (prev + 1) % PHASES.length;
      if (next === 0) {
        setCurrentRound(r => {
          const newRound = r + 1;
          if (newRound > TOTAL_ROUNDS) {
            setIsActive(false);
            setIsComplete(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addBreathingCompletion();
            return r;
          }
          return newRound;
        });
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isActive || isComplete) return;
    hapticForPhase(PHASES[currentPhaseIndex].phase);
    animatePhase(currentPhaseIndex);
    startCountdown();
    phaseTimerRef.current = setTimeout(() => advancePhase(), PHASES[currentPhaseIndex].duration);
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, currentPhaseIndex, isComplete]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(true); setIsComplete(false); setCurrentRound(1); setCurrentPhaseIndex(0);
    circleScale.value = 0.5; pulseOpacity.value = 0.3; ringScale.value = 1;
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActive(false); setCurrentPhaseIndex(0); setCurrentRound(1);
    if (timerRef.current) clearInterval(timerRef.current);
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    circleScale.value = withTiming(0.5, { duration: 500 });
    pulseOpacity.value = withTiming(0.3, { duration: 500 });
    ringScale.value = withTiming(1, { duration: 500 });
  };

  const getPhaseColor = (): string[] => {
    if (!currentPhase) return ['#A7C7E7', '#5B8FB9'];
    switch (currentPhase.phase) {
      case 'inhale': return ['#89CFF0', '#5B8FB9'];
      case 'hold-in': return ['#A7C7E7', '#7DB89E'];
      case 'exhale': return ['#9B8EC4', '#7A6BA8'];
      case 'hold-out': return ['#B8D4C8', '#7DB89E'];
      default: return ['#A7C7E7', '#5B8FB9'];
    }
  };

  if (isComplete) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[theme.secondary, theme.primary]} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>
          <View style={styles.completeContainer}>
            <Animated.View entering={FadeIn.duration(600)}>
              <View style={styles.completeCircle}><MaterialIcons name="check" size={48} color={theme.secondary} /></View>
            </Animated.View>
            <Animated.Text entering={FadeInDown.duration(500).delay(200)} style={styles.completeTitle}>{t.sessionComplete}</Animated.Text>
            <Animated.Text entering={FadeInDown.duration(500).delay(400)} style={styles.completeSubtitle}>
              {t.completedRounds.replace('{rounds}', String(TOTAL_ROUNDS))}
            </Animated.Text>
            <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.completeActions}>
              <Pressable onPress={() => { setIsComplete(false); handleStart(); }} style={styles.restartButton}>
                <MaterialIcons name="replay" size={20} color={theme.primary} />
                <Text style={styles.restartButtonText}>{t.repeat}</Text>
              </Pressable>
              <Pressable onPress={() => router.back()} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>{t.done}</Text>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={getPhaseColor()} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => { handleStop(); router.back(); }} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <Text style={styles.headerTitle}>{t.boxBreathing}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {isActive && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.roundIndicator}>
              <Text style={styles.roundText}>{t.roundOf} {currentRound} {t.of} {TOTAL_ROUNDS}</Text>
              <View style={styles.roundDots}>
                {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                  <View key={i} style={[styles.roundDot, i < currentRound ? styles.roundDotActive : null]} />
                ))}
              </View>
            </Animated.View>
          )}

          <View style={styles.circleContainer}>
            <Animated.View style={[styles.pulseRing, pulseAnimatedStyle]} />
            <Animated.View style={[styles.breathCircle, circleAnimatedStyle]}>
              <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.08)']} style={styles.circleInner}>
                {isActive ? (
                  <>
                    <Text style={styles.countdownText}>{countdown}</Text>
                    <Text style={styles.phaseLabel}>{currentPhase?.label}</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="air" size={40} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.idleLabel}>{t.ready}</Text>
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {isActive && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.timeline}>
              {PHASES.map((p, i) => (
                <View key={p.phase} style={styles.timelineStep}>
                  <View style={[styles.timelineDot, i === currentPhaseIndex ? styles.timelineDotActive : null, i < currentPhaseIndex ? styles.timelineDotDone : null]} />
                  <Text style={[styles.timelineLabel, i === currentPhaseIndex ? styles.timelineLabelActive : null]}>{p.label}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {!isActive && (
            <Animated.View entering={FadeInDown.duration(500)} style={styles.descriptionSection}>
              <Text style={styles.descTitle}>{t.pattern4444}</Text>
              <Text style={styles.descText}>{t.breathingDesc}</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}><MaterialIcons name="timer" size={18} color="rgba(255,255,255,0.7)" /><Text style={styles.infoText}>~4 min</Text></View>
                <View style={styles.infoItem}><MaterialIcons name="repeat" size={18} color="rgba(255,255,255,0.7)" /><Text style={styles.infoText}>{TOTAL_ROUNDS} {t.roundOf.toLowerCase()}s</Text></View>
              </View>
            </Animated.View>
          )}

          <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
            {isActive ? (
              <Pressable onPress={handleStop} style={({ pressed }) => [styles.stopButton, pressed && { transform: [{ scale: 0.95 }] }]}>
                <MaterialIcons name="stop" size={24} color="rgba(255,255,255,0.9)" />
                <Text style={styles.stopButtonText}>{t.stop}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleStart} style={({ pressed }) => [styles.startButton, pressed && { transform: [{ scale: 0.96 }] }]}>
                <Text style={styles.startButtonText}>{t.beginSession}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingTop: 16 },
  roundIndicator: { alignItems: 'center', gap: 8 },
  roundText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  roundDots: { flexDirection: 'row', gap: 8 },
  roundDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  roundDotActive: { backgroundColor: '#FFF' },
  circleContainer: { width: CIRCLE_SIZE + 60, height: CIRCLE_SIZE + 60, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  breathCircle: { overflow: 'hidden' },
  circleInner: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)', borderRadius: CIRCLE_SIZE / 2 },
  countdownText: { fontSize: 56, fontWeight: '700', color: '#FFF', includeFontPadding: false },
  phaseLabel: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  idleLabel: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  timeline: { flexDirection: 'row', gap: 24, paddingHorizontal: 20 },
  timelineStep: { alignItems: 'center', gap: 6 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.3)' },
  timelineDotActive: { backgroundColor: '#FFF', width: 14, height: 14, borderRadius: 7 },
  timelineDotDone: { backgroundColor: 'rgba(255,255,255,0.6)' },
  timelineLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  timelineLabelActive: { color: '#FFF', fontWeight: '700' },
  descriptionSection: { alignItems: 'center', paddingHorizontal: 32 },
  descTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  descText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  infoRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  controls: { width: '100%', paddingHorizontal: 24 },
  startButton: { backgroundColor: '#FFF', borderRadius: 28, paddingVertical: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  startButtonText: { fontSize: 18, fontWeight: '700', color: theme.primary },
  stopButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 28, paddingVertical: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  stopButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  completeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  completeCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  completeTitle: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  completeSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
  completeActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  restartButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24 },
  restartButtonText: { fontSize: 16, fontWeight: '600', color: theme.primary },
  doneButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  doneButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
