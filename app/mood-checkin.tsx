import React, { useState } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { themeShared } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';

export default function MoodCheckinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logMood, language, colors } = useApp();
  const t = getTranslation(language);
  const [selectedMood, setSelectedMood] = useState<number>(5);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleMoodSelect = (value: number) => {
    Haptics.selectionAsync(); setSelectedMood(value);
    scale.value = withSpring(1.1, { damping: 8 }, () => { scale.value = withSpring(1); });
  };

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    logMood(selectedMood, note || undefined); setSubmitted(true);
    setTimeout(() => router.back(), 1500);
  };

  if (submitted) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <LinearGradient colors={[colors.primary, colors.accent]} style={StyleSheet.absoluteFillObject} />
        <Animated.View entering={FadeInDown.duration(500)} style={styles.successContent}>
          <View style={styles.successCircle}><MaterialIcons name="check" size={48} color={colors.primary} /></View>
          <Text style={styles.successTitle}>{t.checkinSaved}</Text>
          <Text style={styles.successSubtitle}>{selectedMood >= 7 ? t.gladDoingWell : selectedMood >= 4 ? t.thankForCheckin : t.itsOkay}</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}><MaterialIcons name="close" size={24} color={colors.textSecondary} /></Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.dailyCheckin}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.questionSection}>
          <Text style={[styles.question, { color: colors.textPrimary }]}>{t.howFeelingRightNow}</Text>
          <Text style={[styles.questionSubtext, { color: colors.textSecondary }]}>{t.beHonest}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.moodDisplay}>
          <Animated.View style={[styles.moodValueContainer, animatedStyle]}>
            <Text style={styles.moodEmoji}>{APP_CONFIG.moodScale.emojis[selectedMood]}</Text>
            <Text style={[styles.moodNumber, { color: colors.mood[selectedMood] }]}>{selectedMood}</Text>
          </Animated.View>
          <Text style={[styles.moodLabel, { color: colors.textSecondary }]}>{APP_CONFIG.moodScale.labels[selectedMood]}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.moodSelector}>
          <View style={styles.moodTrack}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
              <Pressable key={val} onPress={() => handleMoodSelect(val)} style={[styles.moodDot, { backgroundColor: val === selectedMood ? colors.mood[val] : val <= selectedMood ? colors.mood[val] + '40' : colors.border, width: val === selectedMood ? 36 : 28, height: val === selectedMood ? 36 : 28, borderRadius: val === selectedMood ? 18 : 14 }]}>
                {val === selectedMood ? <Text style={styles.moodDotText}>{val}</Text> : null}
              </Pressable>
            ))}
          </View>
          <View style={styles.moodLabelsRow}>
            <Text style={[styles.moodEndLabel, { color: colors.textTertiary }]}>{t.struggling}</Text>
            <Text style={[styles.moodEndLabel, { color: colors.textTertiary }]}>{t.excellent}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.noteSection}>
          <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>{t.addNote}</Text>
          <TextInput style={[styles.noteInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} placeholder={t.whatsContributing} placeholderTextColor={colors.textTertiary} value={note} onChangeText={setNote} multiline maxLength={200} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={[styles.submitSection, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={handleSubmit} style={({ pressed }) => [styles.submitButton, pressed && { transform: [{ scale: 0.97 }] }]}>
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.submitGradient}>
              <Text style={styles.submitText}>{t.saveCheckin}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20 },
  questionSection: { alignItems: 'center', marginTop: 16 },
  question: { fontSize: 26, fontWeight: '700', textAlign: 'center', lineHeight: 34 },
  questionSubtext: { fontSize: 14, marginTop: 8 },
  moodDisplay: { alignItems: 'center', marginTop: 28 },
  moodValueContainer: { alignItems: 'center' },
  moodEmoji: { fontSize: 52 },
  moodNumber: { fontSize: 48, fontWeight: '700', marginTop: 4 },
  moodLabel: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  moodSelector: { marginTop: 28 },
  moodTrack: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  moodDot: { alignItems: 'center', justifyContent: 'center' },
  moodDotText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  moodLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 },
  moodEndLabel: { fontSize: 11, fontWeight: '500' },
  noteSection: { marginTop: 28 },
  noteLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  noteInput: { borderRadius: themeShared.radius.md, padding: 16, fontSize: 15, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, lineHeight: 22 },
  submitSection: { marginTop: 'auto', paddingTop: 16 },
  submitButton: { borderRadius: themeShared.radius.lg, overflow: 'hidden', ...themeShared.shadows.soft },
  submitGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: themeShared.radius.lg },
  submitText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  successContainer: { justifyContent: 'center', alignItems: 'center' },
  successContent: { alignItems: 'center', padding: 40 },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  successSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
});
