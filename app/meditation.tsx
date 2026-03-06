import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import theme from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getTranslation } from '../constants/translations';
import Slider from '@react-native-community/slider';
import PremiumGate from '../components/PremiumGate';

const PRESETS = [5, 10, 15];
const BELL_INTERVAL = 5;

type Phase = 'select' | 'countdown' | 'active' | 'complete';

const AMBIENT_SOUNDS = [
  { id: 'none', label: 'silence', icon: 'volume-off' as const },
  { id: 'rain', label: 'rain', icon: 'water-drop' as const },
  { id: 'ocean', label: 'ocean', icon: 'waves' as const },
  { id: 'forest', label: 'forest', icon: 'forest' as const },
];

import { SOUND_URLS, getFallbackUrl } from '../services/soundUrls';

const FADE_DURATION = 2000; // 2 seconds fade
const FADE_STEPS = 20;

export default function MeditationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, addMeditationSession, meditationStreak, totalMeditationMinutes, meditationSessions, todayMood, isPremium } = useApp();
  const { user } = useAuth();
  const t = getTranslation(language);

  const [phase, setPhase] = useState<Phase>('select');
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [selectedSound, setSelectedSound] = useState('none');
  const [volume, setVolume] = useState(0.6);
  const [countdown, setCountdown] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const breathScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const ringScale = useSharedValue(1);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const displayName = user?.name?.split(' ')[0] || '';

  // Audio management — tries primary URL, then fallback if it fails
  const tryLoadSound = useCallback(async (url: string, targetVolume: number): Promise<boolean> => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, isLooping: true, volume: 0 }
      );
      soundRef.current = sound;

      // Fade in
      let currentVol = 0;
      const step = targetVolume / FADE_STEPS;
      const interval = FADE_DURATION / FADE_STEPS;
      fadeIntervalRef.current = setInterval(() => {
        currentVol += step;
        if (currentVol >= targetVolume) {
          currentVol = targetVolume;
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        }
        soundRef.current?.setVolumeAsync(currentVol).catch(() => {});
      }, interval);
      return true;
    } catch (e) {
      console.log('[Meditation] Failed to load sound from:', url, e);
      return false;
    }
  }, []);

  const loadAndPlaySound = useCallback(async (soundId: string, targetVolume: number) => {
    if (soundId === 'none') return;
    const url = SOUND_URLS[soundId];
    if (!url) return;

    setIsAudioLoading(true);
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Try primary URL
      const success = await tryLoadSound(url, targetVolume);
      if (!success) {
        // Try fallback URL
        const fallbackUrl = getFallbackUrl(soundId);
        if (fallbackUrl) {
          console.log('[Meditation] Trying fallback URL for:', soundId);
          await tryLoadSound(fallbackUrl, targetVolume);
        }
      }
    } catch (e) {
      console.log('[Meditation] Audio setup failed:', e);
    } finally {
      setIsAudioLoading(false);
    }
  }, [tryLoadSound]);

  const fadeOutAndStop = useCallback(async () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    const sound = soundRef.current;
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;
      let currentVol = status.volume || 0;
      const step = currentVol / FADE_STEPS;
      const interval = FADE_DURATION / FADE_STEPS;

      await new Promise<void>((resolve) => {
        fadeIntervalRef.current = setInterval(async () => {
          currentVol -= step;
          if (currentVol <= 0) {
            currentVol = 0;
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            resolve();
          }
          try { await sound.setVolumeAsync(Math.max(0, currentVol)); } catch { resolve(); }
        }, interval);
      });

      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {
      // Ignore errors during cleanup
    }
    soundRef.current = null;
  }, []);

  const updateVolume = useCallback(async (newVolume: number) => {
    setVolume(newVolume);
    if (soundRef.current) {
      try { await soundRef.current.setVolumeAsync(newVolume); } catch {}
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // Start breathing animation during active phase
  useEffect(() => {
    if (phase === 'active') {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(1, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ), -1, false
      );
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.6, { duration: 4000 }), withTiming(0.2, { duration: 4000 })), -1, false
      );
      ringScale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 4000 }), withTiming(0.95, { duration: 4000 })), -1, false
      );
    } else {
      breathScale.value = withTiming(1, { duration: 500 });
      glowOpacity.value = withTiming(0.3, { duration: 500 });
      ringScale.value = withTiming(1, { duration: 500 });
    }
  }, [phase]);

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(3);
    let c = 3;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const countdownTimer = setInterval(() => {
      c -= 1;
      if (c <= 0) {
        clearInterval(countdownTimer);
        setPhase('active');
        setTimeRemaining(selectedDuration * 60);
        setElapsed(0);
        startTimer();
        // Start ambient sound
        if (selectedSound !== 'none') {
          loadAndPlaySound(selectedSound, volume);
        }
      } else {
        setCountdown(c);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 1000);
  }, [selectedDuration, selectedSound, volume, loadAndPlaySound]);

  const startTimer = useCallback(() => {
    const totalSeconds = selectedDuration * 60;
    let remaining = totalSeconds;
    let elapsedSec = 0;

    timerRef.current = setInterval(() => {
      remaining -= 1;
      elapsedSec += 1;
      setTimeRemaining(remaining);
      setElapsed(elapsedSec);

      if (BELL_INTERVAL > 0 && elapsedSec % (BELL_INTERVAL * 60) === 0 && remaining > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase('complete');
      }
    }, 1000);
  }, [selectedDuration]);

  const handleComplete = useCallback(() => {
    addMeditationSession(selectedDuration);
    fadeOutAndStop();
  }, [addMeditationSession, selectedDuration, fadeOutAndStop]);

  useEffect(() => {
    if (phase === 'complete') {
      handleComplete();
    }
  }, [phase]);

  const handleStop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const minutesCompleted = Math.max(1, Math.round(elapsed / 60));
    if (elapsed >= 60) {
      addMeditationSession(minutesCompleted);
    }
    fadeOutAndStop();
    setPhase('select');
  }, [elapsed, addMeditationSession, fadeOutAndStop]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = phase === 'active' ? 1 - (timeRemaining / (selectedDuration * 60)) : 0;

  const thisWeekSessions = meditationSessions.filter(s => {
    const diff = (Date.now() - s.timestamp) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  // Selection screen
  if (phase === 'select') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#2D3748', '#1A2332', '#0F1722']} style={StyleSheet.absoluteFillObject} />
        <Image source={require('../assets/images/meditation-bg.png')} style={styles.bgImage} contentFit="cover" />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.7)" />
            </Pressable>
            <Text style={styles.headerTitle}>{t.meditation || 'Meditation'}</Text>
            <Pressable onPress={() => router.push('/sound-library')} style={styles.closeButton}>
              <MaterialIcons name="library-music" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <View style={styles.selectContent}>
            <Animated.View entering={FadeInDown.duration(500)} style={styles.greetingSection}>
              {displayName ? (
                <Text style={styles.greetingText}>{t.welcomeBack || 'Welcome back'}, {displayName}</Text>
              ) : null}
              <Text style={styles.greetingSubtext}>{t.findYourCalm || 'Find your calm'}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.statsStrip}>
              <View style={styles.miniStat}>
                <MaterialIcons name="local-fire-department" size={18} color="#F6AD55" />
                <Text style={styles.miniStatValue}>{meditationStreak}</Text>
                <Text style={styles.miniStatLabel}>{t.streak || 'streak'}</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStat}>
                <MaterialIcons name="schedule" size={18} color={theme.primaryLight} />
                <Text style={styles.miniStatValue}>{totalMeditationMinutes}</Text>
                <Text style={styles.miniStatLabel}>min</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStat}>
                <MaterialIcons name="event-available" size={18} color={theme.secondaryLight} />
                <Text style={styles.miniStatValue}>{thisWeekSessions}</Text>
                <Text style={styles.miniStatLabel}>{t.thisWeek || 'this week'}</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.presetSection}>
              <Text style={styles.sectionLabel}>{t.duration || 'Duration'}</Text>
              <View style={styles.presetRow}>
                {PRESETS.map((min) => (
                  <Pressable key={min} onPress={() => { Haptics.selectionAsync(); setSelectedDuration(min); }} style={[styles.presetChip, selectedDuration === min && styles.presetChipActive]}>
                    <Text style={[styles.presetValue, selectedDuration === min && styles.presetValueActive]}>{min}</Text>
                    <Text style={[styles.presetUnit, selectedDuration === min && styles.presetUnitActive]}>min</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.soundSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Text style={styles.sectionLabel}>{t.ambientSound || 'Ambient Sound'}</Text>
                {!isPremium ? <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}><Text style={{ fontSize: 9, fontWeight: '700', color: '#FFF' }}>PREMIUM</Text></View> : null}
              </View>
              <View style={styles.soundRow}>
                {AMBIENT_SOUNDS.map((sound) => {
                  const isLocked = sound.id !== 'none' && !isPremium;
                  return (
                  <Pressable key={sound.id} onPress={() => { if (isLocked) return; Haptics.selectionAsync(); setSelectedSound(sound.id); }} style={[styles.soundChip, selectedSound === sound.id && styles.soundChipActive, isLocked && { opacity: 0.4 }]}>
                    <MaterialIcons name={isLocked ? 'lock' : sound.icon} size={20} color={selectedSound === sound.id ? '#FFF' : 'rgba(255,255,255,0.5)'} />
                    <Text style={[styles.soundLabel, selectedSound === sound.id && styles.soundLabelActive]}>
                      {(t as any)[sound.label] || sound.label}
                    </Text>
                  </Pressable>
                  );
                })}
              </View>

              {/* Volume slider */}
              {selectedSound !== 'none' ? (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.volumeRow}>
                  <MaterialIcons name="volume-down" size={18} color="rgba(255,255,255,0.4)" />
                  <Slider
                    style={styles.volumeSlider}
                    value={volume}
                    onValueChange={updateVolume}
                    minimumValue={0.1}
                    maximumValue={1.0}
                    step={0.1}
                    minimumTrackTintColor={theme.primary}
                    maximumTrackTintColor="rgba(255,255,255,0.15)"
                    thumbTintColor={theme.primaryLight}
                  />
                  <MaterialIcons name="volume-up" size={18} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
                </Animated.View>
              ) : null}
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.bellInfo}>
              <MaterialIcons name="notifications-active" size={16} color="rgba(255,255,255,0.4)" />
              <Text style={styles.bellInfoText}>{t.intervalBell || 'Interval bell every 5 minutes'}</Text>
            </Animated.View>
          </View>

          <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 20 }]}>
            <Pressable onPress={startCountdown} style={({ pressed }) => [styles.startButton, pressed && { transform: [{ scale: 0.96 }] }]}>
              <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.startGradient}>
                <MaterialIcons name="self-improvement" size={24} color="#FFF" />
                <Text style={styles.startText}>{t.beginMeditation || 'Begin Meditation'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Countdown
  if (phase === 'countdown') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1A2332', '#0F1722', '#0A0E14']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.countdownCenter}>
          <Animated.Text entering={FadeIn.duration(300)} style={styles.countdownNumber}>{countdown}</Animated.Text>
          <Text style={styles.countdownLabel}>{t.getComfortable || 'Get comfortable...'}</Text>
        </View>
      </View>
    );
  }

  // Active meditation
  if (phase === 'active') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1A2332', '#0F1722', '#0A0E14']} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.activeHeader}>
            <Pressable onPress={handleStop} style={styles.stopPill}>
              <MaterialIcons name="stop" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.stopPillText}>{t.stop || 'Stop'}</Text>
            </Pressable>
          </View>

          <View style={styles.activeContent}>
            {selectedSound !== 'none' && (
              <Animated.View entering={FadeIn.duration(500)} style={styles.soundIndicator}>
                <MaterialIcons name={AMBIENT_SOUNDS.find(s => s.id === selectedSound)?.icon || 'volume-up'} size={14} color="rgba(255,255,255,0.4)" />
                <Text style={styles.soundIndicatorText}>{(t as any)[selectedSound] || selectedSound}</Text>
                {isAudioLoading ? <Text style={styles.soundIndicatorText}>...</Text> : null}
              </Animated.View>
            )}

            {/* Volume control during session */}
            {selectedSound !== 'none' ? (
              <View style={styles.activeVolumeRow}>
                <MaterialIcons name="volume-down" size={14} color="rgba(255,255,255,0.3)" />
                <Slider
                  style={styles.activeVolumeSlider}
                  value={volume}
                  onValueChange={updateVolume}
                  minimumValue={0.05}
                  maximumValue={1.0}
                  step={0.05}
                  minimumTrackTintColor={theme.primary + '80'}
                  maximumTrackTintColor="rgba(255,255,255,0.1)"
                  thumbTintColor={theme.primaryLight}
                />
                <MaterialIcons name="volume-up" size={14} color="rgba(255,255,255,0.3)" />
              </View>
            ) : null}

            {/* Breathing circle */}
            <View style={styles.circleArea}>
              <Animated.View style={[styles.outerGlow, glowStyle]} />
              <Animated.View style={[styles.mainCircle, breathStyle]}>
                <LinearGradient colors={['rgba(91,143,185,0.3)', 'rgba(91,143,185,0.1)']} style={styles.circleGradient}>
                  <Text style={styles.timeText}>{formatTime(timeRemaining)}</Text>
                  <Text style={styles.timeLabel}>{t.remaining || 'remaining'}</Text>
                </LinearGradient>
              </Animated.View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>{formatTime(elapsed)}</Text>
                <Text style={styles.progressLabel}>{selectedDuration} min</Text>
              </View>
            </View>

            <Text style={styles.breatheHint}>{t.breatheNaturally || 'Breathe naturally'}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Complete screen
  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.primary, theme.primaryDark, '#1A2332']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={styles.completeContent}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.completeIcon}>
            <MaterialIcons name="self-improvement" size={48} color={theme.primary} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.duration(500).delay(200)} style={styles.completeTitle}>
            {t.sessionComplete || 'Session Complete'}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.duration(500).delay(300)} style={styles.completeSubtitle}>
            {displayName ? `${t.wellDone || 'Well done'}, ${displayName}!` : (t.wellDone || 'Well done!')}
          </Animated.Text>

          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialIcons name="schedule" size={22} color={theme.primaryLight} />
                <Text style={styles.summaryValue}>{selectedDuration}</Text>
                <Text style={styles.summaryLabel}>{t.minutesMeditated || 'minutes'}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <MaterialIcons name="local-fire-department" size={22} color="#F6AD55" />
                <Text style={styles.summaryValue}>{meditationStreak}</Text>
                <Text style={styles.summaryLabel}>{t.dayStreak || 'day streak'}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <MaterialIcons name="timer" size={22} color={theme.secondaryLight} />
                <Text style={styles.summaryValue}>{totalMeditationMinutes}</Text>
                <Text style={styles.summaryLabel}>{t.totalMin || 'total min'}</Text>
              </View>
            </View>

            {todayMood ? (
              <View style={styles.moodCorrelation}>
                <MaterialIcons name="mood" size={16} color={theme.accent} />
                <Text style={styles.moodCorrelationText}>
                  {t.todaysMoodIs || "Today's mood"}: {todayMood.value}/10
                </Text>
              </View>
            ) : null}

            {selectedSound !== 'none' ? (
              <View style={styles.moodCorrelation}>
                <MaterialIcons name={AMBIENT_SOUNDS.find(s => s.id === selectedSound)?.icon || 'volume-up'} size={16} color={theme.secondaryLight} />
                <Text style={styles.moodCorrelationText}>
                  {(t as any)[selectedSound] || selectedSound} • {Math.round(volume * 100)}% {t.duration || 'volume'}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.completeActions}>
            <Pressable onPress={() => { setPhase('select'); }} style={({ pressed }) => [styles.againButton, pressed && { transform: [{ scale: 0.96 }] }]}>
              <MaterialIcons name="replay" size={20} color={theme.primary} />
              <Text style={styles.againText}>{t.meditateAgain || 'Meditate Again'}</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.doneBtn, pressed && { transform: [{ scale: 0.96 }] }]}>
              <Text style={styles.doneBtnText}>{t.done || 'Done'}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const CIRCLE_SIZE = 220;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1722' },
  bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },

  selectContent: { flex: 1, paddingHorizontal: 24 },
  greetingSection: { marginTop: 16, marginBottom: 24 },
  greetingText: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  greetingSubtext: { fontSize: 15, color: 'rgba(255,255,255,0.5)' },

  statsStrip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 28, alignItems: 'center' },
  miniStat: { flex: 1, alignItems: 'center', gap: 4 },
  miniStatValue: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  miniStatLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  miniStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },

  presetSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  presetRow: { flexDirection: 'row', gap: 12 },
  presetChip: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  presetChipActive: { backgroundColor: 'rgba(91,143,185,0.2)', borderColor: theme.primary },
  presetValue: { fontSize: 28, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  presetValueActive: { color: '#FFF' },
  presetUnit: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  presetUnitActive: { color: theme.primaryLight },

  soundSection: { marginBottom: 16 },
  soundRow: { flexDirection: 'row', gap: 10 },
  soundChip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', gap: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)' },
  soundChipActive: { backgroundColor: 'rgba(91,143,185,0.2)', borderColor: theme.primary },
  soundLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' },
  soundLabelActive: { color: '#FFF' },

  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingHorizontal: 4 },
  volumeSlider: { flex: 1, height: 30 },
  volumeText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', width: 34, textAlign: 'right' },

  bellInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  bellInfoText: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },

  bottomAction: { paddingHorizontal: 24 },
  startButton: { borderRadius: 16, overflow: 'hidden', ...theme.shadows.elevated },
  startGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16 },
  startText: { fontSize: 18, fontWeight: '700', color: '#FFF' },

  countdownCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countdownNumber: { fontSize: 96, fontWeight: '700', color: '#FFF', includeFontPadding: false },
  countdownLabel: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 8 },

  activeHeader: { alignItems: 'center', paddingTop: 16 },
  stopPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  stopPillText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  activeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  soundIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  soundIndicatorText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize' },

  activeVolumeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '70%', marginBottom: 20 },
  activeVolumeSlider: { flex: 1, height: 24 },

  circleArea: { width: CIRCLE_SIZE + 60, height: CIRCLE_SIZE + 60, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  outerGlow: { position: 'absolute', width: CIRCLE_SIZE + 50, height: CIRCLE_SIZE + 50, borderRadius: (CIRCLE_SIZE + 50) / 2, backgroundColor: 'rgba(91,143,185,0.1)', borderWidth: 1.5, borderColor: 'rgba(91,143,185,0.15)' },
  mainCircle: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, overflow: 'hidden' },
  circleGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(91,143,185,0.3)', borderRadius: CIRCLE_SIZE / 2 },
  timeText: { fontSize: 44, fontWeight: '700', color: '#FFF', includeFontPadding: false },
  timeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  progressContainer: { width: '100%', marginBottom: 16 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.primary, borderRadius: 2 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  breatheHint: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  completeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  completeIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 24, ...theme.shadows.elevated },
  completeTitle: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  completeSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 28 },

  summaryCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  summaryLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  moodCorrelation: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', justifyContent: 'center' },
  moodCorrelationText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

  completeActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  againButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24 },
  againText: { fontSize: 15, fontWeight: '600', color: theme.primary },
  doneBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  doneBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
