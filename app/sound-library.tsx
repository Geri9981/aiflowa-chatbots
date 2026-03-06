import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { themeShared } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';
import { SOUND_URLS, getFallbackUrl } from '../services/soundUrls';
import PremiumGate from '../components/PremiumGate';

interface SoundCategory {
  id: string;
  labelKey: string;
  fallbackLabel: string;
  icon: string;
  color: string;
  url: string;
}

const SOUND_CATEGORIES: SoundCategory[] = [
  { id: 'rain', labelKey: 'rain', fallbackLabel: 'Rain', icon: 'water-drop', color: '#5B8FB9', url: SOUND_URLS.rain },
  { id: 'thunderstorm', labelKey: 'thunderstorm', fallbackLabel: 'Thunderstorm', icon: 'flash-on', color: '#6C5B7B', url: SOUND_URLS.thunderstorm },
  { id: 'ocean', labelKey: 'ocean', fallbackLabel: 'Ocean', icon: 'waves', color: '#3A6D94', url: SOUND_URLS.ocean },
  { id: 'forest', labelKey: 'forest', fallbackLabel: 'Forest', icon: 'forest', color: '#5A9A7C', url: SOUND_URLS.forest },
  { id: 'fireplace', labelKey: 'fireplace', fallbackLabel: 'Fireplace', icon: 'local-fire-department', color: '#E6A87C', url: SOUND_URLS.fireplace },
  { id: 'wind', labelKey: 'wind', fallbackLabel: 'Wind', icon: 'air', color: '#8BB8D6', url: SOUND_URLS.wind },
  { id: 'birds', labelKey: 'birds', fallbackLabel: 'Birds', icon: 'flutter-dash', color: '#68D391', url: SOUND_URLS.birds },
  { id: 'river', labelKey: 'river', fallbackLabel: 'River', icon: 'water', color: '#63B3ED', url: SOUND_URLS.river },
  { id: 'night', labelKey: 'nightSounds', fallbackLabel: 'Night', icon: 'nightlight', color: '#4A5568', url: SOUND_URLS.night },
  { id: 'cafe', labelKey: 'cafe', fallbackLabel: 'Cafe', icon: 'local-cafe', color: '#A0522D', url: SOUND_URLS.cafe },
  { id: 'whitenoise', labelKey: 'whiteNoise', fallbackLabel: 'White Noise', icon: 'graphic-eq', color: '#A0AEC0', url: SOUND_URLS.whitenoise },
  { id: 'piano', labelKey: 'piano', fallbackLabel: 'Soft Piano', icon: 'piano', color: '#9B8EC4', url: SOUND_URLS.piano },
];

interface ActiveSound {
  id: string;
  sound: Audio.Sound;
  volume: number;
}

const FADE_STEPS = 15;
const FADE_DURATION = 1200;

export default function SoundLibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, colors, isPremium } = useApp();
  const [activeSounds, setActiveSounds] = useState<Map<string, ActiveSound>>(new Map());
  const [loadingSounds, setLoadingSounds] = useState<Set<string>>(new Set());
  const [masterVolume, setMasterVolume] = useState(0.8);
  const activeSoundsRef = useRef<Map<string, ActiveSound>>(new Map());

  const t = getTranslation(language);

  // Keep ref in sync
  useEffect(() => {
    activeSoundsRef.current = activeSounds;
  }, [activeSounds]);

  // Cleanup all sounds on unmount
  useEffect(() => {
    return () => {
      activeSoundsRef.current.forEach(async (as) => {
        try {
          await as.sound.stopAsync();
          await as.sound.unloadAsync();
        } catch {}
      });
    };
  }, []);

  const toggleSound = useCallback(async (category: SoundCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const existing = activeSoundsRef.current.get(category.id);
    if (existing) {
      // Fade out and remove
      try {
        let currentVol = existing.volume * masterVolume;
        const step = currentVol / FADE_STEPS;
        for (let i = 0; i < FADE_STEPS; i++) {
          currentVol = Math.max(0, currentVol - step);
          await existing.sound.setVolumeAsync(currentVol);
          await new Promise(r => setTimeout(r, FADE_DURATION / FADE_STEPS));
        }
        await existing.sound.stopAsync();
        await existing.sound.unloadAsync();
      } catch {}

      setActiveSounds(prev => {
        const next = new Map(prev);
        next.delete(category.id);
        return next;
      });
      return;
    }

    // Load and play new sound with fallback
    setLoadingSounds(prev => new Set(prev).add(category.id));
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const targetVolume = 0.7;
      let sound: Audio.Sound | null = null;

      // Try primary URL
      try {
        const result = await Audio.Sound.createAsync(
          { uri: category.url },
          { shouldPlay: true, isLooping: true, volume: 0 }
        );
        sound = result.sound;
      } catch (primaryErr) {
        console.log('[SoundLibrary] Primary URL failed for:', category.id, primaryErr);
        // Try fallback
        const fallbackUrl = getFallbackUrl(category.id);
        if (fallbackUrl) {
          console.log('[SoundLibrary] Trying fallback for:', category.id);
          try {
            const result = await Audio.Sound.createAsync(
              { uri: fallbackUrl },
              { shouldPlay: true, isLooping: true, volume: 0 }
            );
            sound = result.sound;
          } catch (fallbackErr) {
            console.log('[SoundLibrary] Fallback also failed for:', category.id);
          }
        }
      }

      if (!sound) {
        setLoadingSounds(prev => {
          const next = new Set(prev);
          next.delete(category.id);
          return next;
        });
        return;
      }

      // Fade in
      let vol = 0;
      const step = (targetVolume * masterVolume) / FADE_STEPS;
      for (let i = 0; i < FADE_STEPS; i++) {
        vol = Math.min(targetVolume * masterVolume, vol + step);
        await sound.setVolumeAsync(vol);
        await new Promise(r => setTimeout(r, FADE_DURATION / FADE_STEPS));
      }

      const activeSound: ActiveSound = { id: category.id, sound, volume: targetVolume };
      setActiveSounds(prev => {
        const next = new Map(prev);
        next.set(category.id, activeSound);
        return next;
      });
    } catch (e) {
      // Silently fail
    } finally {
      setLoadingSounds(prev => {
        const next = new Set(prev);
        next.delete(category.id);
        return next;
      });
    }
  }, [masterVolume]);

  const updateSoundVolume = useCallback(async (soundId: string, newVolume: number) => {
    setActiveSounds(prev => {
      const next = new Map(prev);
      const existing = next.get(soundId);
      if (existing) {
        next.set(soundId, { ...existing, volume: newVolume });
        existing.sound.setVolumeAsync(newVolume * masterVolume).catch(() => {});
      }
      return next;
    });
  }, [masterVolume]);

  const updateMasterVolume = useCallback(async (newMaster: number) => {
    setMasterVolume(newMaster);
    activeSoundsRef.current.forEach(async (as) => {
      try {
        await as.sound.setVolumeAsync(as.volume * newMaster);
      } catch {}
    });
  }, []);

  const stopAll = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const sounds = Array.from(activeSoundsRef.current.values());
    for (const as of sounds) {
      try {
        await as.sound.stopAsync();
        await as.sound.unloadAsync();
      } catch {}
    }
    setActiveSounds(new Map());
  }, []);

  const activeCount = activeSounds.size;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => { stopAll(); router.back(); }} style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.soundLibrary || 'Sound Library'}</Text>
        {activeCount > 0 ? (
          <Pressable onPress={stopAll} style={[styles.stopAllBtn, { backgroundColor: colors.error + '18' }]}>
            <MaterialIcons name="stop" size={16} color={colors.error} />
            <Text style={[styles.stopAllText, { color: colors.error }]}>{t.stopAll || 'Stop All'}</Text>
          </Pressable>
        ) : <View style={{ width: 80 }} />}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Active mix info */}
        {activeCount > 0 ? (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.mixInfo, { backgroundColor: colors.primary + '0D' }]}>
            <MaterialIcons name="equalizer" size={18} color={colors.primary} />
            <Text style={[styles.mixInfoText, { color: colors.textSecondary }]}>
              {activeCount} {activeCount === 1 ? (t.soundActive || 'sound active') : (t.soundsActive || 'sounds active')}
            </Text>
          </Animated.View>
        ) : null}

        {/* Master volume */}
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.masterRow, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="volume-down" size={18} color={colors.textTertiary} />
          <Slider
            style={styles.masterSlider}
            value={masterVolume}
            onValueChange={updateMasterVolume}
            minimumValue={0.05}
            maximumValue={1.0}
            step={0.05}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.borderLight}
            thumbTintColor={colors.primary}
          />
          <MaterialIcons name="volume-up" size={18} color={colors.textTertiary} />
          <Text style={[styles.masterText, { color: colors.textSecondary }]}>{Math.round(masterVolume * 100)}%</Text>
        </Animated.View>

        {/* Sound grid */}
        <View style={styles.soundGrid}>
          {SOUND_CATEGORIES.map((cat, index) => {
            const isActive = activeSounds.has(cat.id);
            const isLoading = loadingSounds.has(cat.id);
            const activeSound = activeSounds.get(cat.id);
            const label = (t as any)[cat.labelKey] || cat.fallbackLabel;
            // First 3 sounds are free, rest require premium
            const FREE_SOUND_COUNT = 3;
            const isLocked = !isPremium && index >= FREE_SOUND_COUNT;

            return (
              <Animated.View key={cat.id} entering={FadeInDown.duration(400).delay(50 + index * 30)} style={styles.soundCardWrapper}>
                <Pressable
                  onPress={() => {
                    if (isLocked) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/subscription');
                      return;
                    }
                    toggleSound(cat);
                  }}
                  style={({ pressed }) => [
                    styles.soundCard,
                    { backgroundColor: isActive ? cat.color + '18' : colors.surface },
                    isActive && { borderWidth: 1.5, borderColor: cat.color + '50' },
                    isLocked && { opacity: 0.5 },
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <View style={[styles.soundIconBg, { backgroundColor: isActive ? cat.color + '25' : colors.backgroundSecondary }]}>
                    {isLocked ? (
                      <MaterialIcons name="lock" size={24} color={colors.textTertiary} />
                    ) : isLoading ? (
                      <MaterialIcons name="hourglass-top" size={24} color={cat.color} />
                    ) : (
                      <MaterialIcons name={cat.icon as any} size={24} color={isActive ? cat.color : colors.textTertiary} />
                    )}
                  </View>
                  <Text style={[
                    styles.soundLabel,
                    { color: isActive ? colors.textPrimary : colors.textSecondary },
                  ]}>{label}</Text>
                  {isLocked ? (
                    <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 6 }}>
                      <Text style={{ fontSize: 8, fontWeight: '700', color: '#FFF' }}>PREMIUM</Text>
                    </View>
                  ) : isActive ? (
                    <View style={[styles.activeIndicator, { backgroundColor: cat.color }]} />
                  ) : null}
                </Pressable>

                {/* Individual volume control */}
                {isActive && activeSound ? (
                  <View style={styles.individualVolume}>
                    <Slider
                      style={styles.individualSlider}
                      value={activeSound.volume}
                      onValueChange={(v: number) => updateSoundVolume(cat.id, v)}
                      minimumValue={0.05}
                      maximumValue={1.0}
                      step={0.05}
                      minimumTrackTintColor={cat.color}
                      maximumTrackTintColor={colors.borderLight}
                      thumbTintColor={cat.color}
                    />
                  </View>
                ) : null}
              </Animated.View>
            );
          })}
        </View>

        {/* Usage tips */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={[styles.tipsCard, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="tips-and-updates" size={16} color={colors.textTertiary} />
          <Text style={[styles.tipsText, { color: colors.textTertiary }]}>
            {t.soundMixTip || 'Tap multiple sounds to create your own custom mix. Adjust individual volumes to find the perfect balance for meditation or relaxation.'}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  stopAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: themeShared.radius.full },
  stopAllText: { fontSize: 12, fontWeight: '700' },
  mixInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: themeShared.radius.md },
  mixInfoText: { fontSize: 13, fontWeight: '600' },
  masterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: themeShared.radius.lg, ...themeShared.shadows.card },
  masterSlider: { flex: 1, height: 30 },
  masterText: { fontSize: 12, fontWeight: '600', width: 36, textAlign: 'right' },
  soundGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 16, gap: 0 },
  soundCardWrapper: { width: '50%', padding: 4 },
  soundCard: { borderRadius: themeShared.radius.lg, padding: 18, alignItems: 'center', minHeight: 110, justifyContent: 'center', ...themeShared.shadows.card },
  soundIconBg: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  soundLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  activeIndicator: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  individualVolume: { paddingHorizontal: 8, paddingBottom: 4, marginTop: -4 },
  individualSlider: { width: '100%', height: 24 },
  tipsCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: themeShared.radius.md },
  tipsText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
