import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { themeShared } from '../../constants/theme';
import { APP_CONFIG } from '../../constants/config';
import { useApp } from '../../contexts/AppContext';
import { getTranslation } from '../../constants/translations';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { journalEntries, language, colors } = useApp();
  const t = getTranslation(language);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => { Haptics.selectionAsync(); setExpandedId(prev => (prev === id ? null : id)); };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    if (dateStr === todayStr) return t.today;
    if (dateStr === yesterdayDate.toISOString().split('T')[0]) return t.yesterday;
    return d.toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.tabJournal}</Text>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/journal-entry'); }} style={[styles.newEntryButton, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="add" size={20} color="#FFF" />
          <Text style={styles.newEntryText}>{t.newEntry}</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {journalEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={require('../../assets/images/journal-empty.png')} style={styles.emptyImage} contentFit="contain" />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t.journalAwaits}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{t.journalEmptyDesc}</Text>
            <Pressable onPress={() => router.push('/journal-entry')} style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.emptyButtonText}>{t.writeFirstEntry}</Text>
            </Pressable>
          </View>
        ) : (
          journalEntries.map((entry, index) => (
            <Animated.View key={entry.id} entering={FadeInDown.duration(400).delay(index * 80)}>
              <Pressable onPress={() => toggleExpand(entry.id)} style={({ pressed }) => [styles.entryCard, { backgroundColor: colors.surface }, pressed && { transform: [{ scale: 0.99 }] }]}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryDateRow}>
                    <Text style={[styles.entryDate, { color: colors.textSecondary }]}>{formatDate(entry.date)}</Text>
                    {entry.mood ? (
                      <View style={[styles.moodBadge, { backgroundColor: (colors.mood[entry.mood] || '#CBD5E0') + '20' }]}>
                        <Text style={styles.moodBadgeEmoji}>{APP_CONFIG.moodScale.emojis[entry.mood]}</Text>
                        <Text style={[styles.moodBadgeText, { color: colors.mood[entry.mood] || '#CBD5E0' }]}>{entry.mood}/10</Text>
                      </View>
                    ) : null}
                  </View>
                  <MaterialIcons name={expandedId === entry.id ? 'expand-less' : 'expand-more'} size={22} color={colors.textTertiary} />
                </View>
                <Text style={[styles.entryTitle, { color: colors.textPrimary }]}>{entry.title}</Text>
                <Text style={[styles.entryContent, { color: colors.textSecondary }]} numberOfLines={expandedId === entry.id ? undefined : 2}>{entry.content}</Text>
                {entry.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {entry.tags.map((tag) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + '12' }]}><Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text></View>
                    ))}
                  </View>
                )}
                {expandedId === entry.id && entry.aiInsight ? (
                  <Animated.View entering={FadeInDown.duration(300)} style={[styles.insightContainer, { backgroundColor: colors.accent + '0A', borderLeftColor: colors.accent }]}>
                    <View style={styles.insightHeader}><MaterialIcons name="auto-awesome" size={16} color={colors.accent} /><Text style={[styles.insightLabel, { color: colors.accent }]}>{t.aiInsight}</Text></View>
                    <Text style={[styles.insightText, { color: colors.textSecondary }]}>{entry.aiInsight}</Text>
                  </Animated.View>
                ) : null}
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  newEntryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: themeShared.radius.full, gap: 6, ...themeShared.shadows.soft },
  newEntryText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  emptyImage: { width: 200, height: 200, marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyButton: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: themeShared.radius.full },
  emptyButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  entryCard: { borderRadius: themeShared.radius.lg, padding: 18, marginBottom: 12, ...themeShared.shadows.card },
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  entryDateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryDate: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  moodBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: themeShared.radius.full, gap: 4 },
  moodBadgeEmoji: { fontSize: 12 },
  moodBadgeText: { fontSize: 11, fontWeight: '600' },
  entryTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  entryContent: { fontSize: 14, lineHeight: 21 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: themeShared.radius.full },
  tagText: { fontSize: 11, fontWeight: '600' },
  insightContainer: { marginTop: 14, borderRadius: themeShared.radius.md, padding: 14, borderLeftWidth: 3 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  insightLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  insightText: { fontSize: 14, lineHeight: 21 },
});
