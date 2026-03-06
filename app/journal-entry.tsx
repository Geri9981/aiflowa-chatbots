import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { themeShared } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';

const SUGGESTED_TAGS = ['anxiety', 'gratitude', 'sleep', 'work', 'relationships', 'self-care', 'exercise', 'stress', 'mindfulness', 'growth'];

export default function JournalEntryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addJournalEntry, language, colors } = useApp();
  const t = getTranslation(language);
  const { showAlert } = useAlert();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const toggleTag = (tag: string) => { Haptics.selectionAsync(); setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) { showAlert(t.missingFields, t.addTitleAndThoughts); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addJournalEntry(title.trim(), content.trim(), mood || undefined, selectedTags);
    setSaved(true); setTimeout(() => router.back(), 1500);
  };

  if (saved) {
    return (
      <View style={[styles.container, styles.savedContainer]}>
        <LinearGradient colors={[colors.accent, colors.primary]} style={StyleSheet.absoluteFillObject} />
        <Animated.View entering={FadeInDown.duration(500)} style={styles.savedContent}>
          <View style={styles.savedCircle}><MaterialIcons name="auto-awesome" size={40} color={colors.accent} /></View>
          <Text style={styles.savedTitle}>{t.entrySaved}</Text>
          <Text style={styles.savedSubtitle}>{t.aiInsightGenerating}</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}><MaterialIcons name="close" size={24} color={colors.textSecondary} /></Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.newEntry}</Text>
        <Pressable onPress={handleSave} style={[styles.saveButton, { backgroundColor: (!title.trim() || !content.trim()) ? colors.backgroundSecondary : colors.primary }]}>
          <Text style={[styles.saveButtonText, (!title.trim() || !content.trim()) && { color: colors.textTertiary }]}>{t.save}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TextInput style={[styles.titleInput, { color: colors.textPrimary, borderBottomColor: colors.borderLight }]} placeholder={t.giveTitle} placeholderTextColor={colors.textTertiary} value={title} onChangeText={setTitle} maxLength={100} />
          <TextInput style={[styles.contentInput, { color: colors.textPrimary }]} placeholder={t.whatsOnMind} placeholderTextColor={colors.textTertiary} value={content} onChangeText={setContent} multiline textAlignVertical="top" maxLength={2000} />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>{content.length}/2000</Text>
          <View style={styles.moodSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.howDoYouFeel}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                <Pressable key={val} onPress={() => { Haptics.selectionAsync(); setMood(prev => prev === val ? null : val); }} style={[styles.moodChip, { backgroundColor: colors.surface, borderColor: mood === val ? colors.mood[val] : colors.border }, mood === val && { backgroundColor: colors.mood[val] }]}>
                  <Text style={styles.moodChipEmoji}>{APP_CONFIG.moodScale.emojis[val]}</Text>
                  <Text style={[styles.moodChipText, { color: colors.textPrimary }, mood === val && { color: '#FFF' }]}>{val}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={styles.tagsSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.tags}</Text>
            <View style={styles.tagsWrap}>
              {SUGGESTED_TAGS.map((tag) => (
                <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tagChip, { backgroundColor: colors.surface, borderColor: selectedTags.includes(tag) ? colors.primary : colors.border }, selectedTags.includes(tag) && { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.tagChipText, { color: colors.textSecondary }, selectedTags.includes(tag) && { color: colors.primary, fontWeight: '600' }]}>{tag}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={[styles.aiHint, { backgroundColor: colors.accent + '0A' }]}>
            <MaterialIcons name="auto-awesome" size={16} color={colors.accent} />
            <Text style={[styles.aiHintText, { color: colors.textSecondary }]}>{t.aiInsightHint}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  saveButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: themeShared.radius.full },
  saveButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  titleInput: { fontSize: 22, fontWeight: '700', paddingVertical: 16, borderBottomWidth: 1 },
  contentInput: { fontSize: 16, lineHeight: 24, minHeight: 160, paddingVertical: 16 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: -8, marginBottom: 8 },
  moodSection: { marginTop: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  moodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: themeShared.radius.full, borderWidth: 1.5 },
  moodChipEmoji: { fontSize: 16 },
  moodChipText: { fontSize: 14, fontWeight: '600' },
  tagsSection: { marginTop: 20 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: themeShared.radius.full, borderWidth: 1.5 },
  tagChipText: { fontSize: 13, fontWeight: '500' },
  aiHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 24, borderRadius: themeShared.radius.md, padding: 14 },
  aiHintText: { flex: 1, fontSize: 13, lineHeight: 19 },
  savedContainer: { justifyContent: 'center', alignItems: 'center' },
  savedContent: { alignItems: 'center', padding: 40 },
  savedCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  savedTitle: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  savedSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
});
