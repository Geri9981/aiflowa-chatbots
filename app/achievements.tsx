import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { themeShared } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';
import {
  ACHIEVEMENTS, TIER_COLORS, getAchievementProgress, Achievement,
} from '../services/achievements';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterCategory = 'all' | 'mood' | 'meditation' | 'journal' | 'breathing' | 'general';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    currentStreak, meditationStreak, meditationSessions, totalMeditationMinutes,
    totalJournalEntries, language, colors, unlockedAchievements,
    breathingCompleted, tripleThreats, highMoodCount,
  } = useApp();
  const t = getTranslation(language);
  const [filter, setFilter] = useState<FilterCategory>('all');

  const totalMeditations = meditationSessions.length;

  const filtered = useMemo(() => {
    if (filter === 'all') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter(a => a.category === filter);
  }, [filter]);

  const unlockedSet = new Set(unlockedAchievements);
  const totalUnlocked = ACHIEVEMENTS.filter(a => unlockedSet.has(a.id)).length;

  const tiers = useMemo(() => {
    const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    ACHIEVEMENTS.forEach(a => {
      if (unlockedSet.has(a.id)) counts[a.tier]++;
    });
    return counts;
  }, [unlockedAchievements]);

  const categories: { key: FilterCategory; label: string; icon: string }[] = [
    { key: 'all', label: t.all || 'All', icon: 'apps' },
    { key: 'mood', label: t.mood || 'Mood', icon: 'mood' },
    { key: 'meditation', label: t.meditation || 'Meditation', icon: 'self-improvement' },
    { key: 'journal', label: t.journal || 'Journal', icon: 'edit' },
    { key: 'breathing', label: t.breathe || 'Breathing', icon: 'air' },
  ];

  const renderAchievementCard = (ach: Achievement, index: number) => {
    const isUnlocked = unlockedSet.has(ach.id);
    const progress = getAchievementProgress(
      ach, currentStreak, meditationStreak, totalMeditations,
      totalMeditationMinutes, totalJournalEntries, breathingCompleted,
      tripleThreats, highMoodCount,
    );
    const progressPercent = Math.min(1, progress / ach.requirement);
    const tierColor = TIER_COLORS[ach.tier];
    const achTitle = (t as any)[ach.titleKey] || ach.title;
    const achDesc = (t as any)[ach.descKey] || ach.description;

    return (
      <Animated.View key={ach.id} entering={FadeInDown.duration(400).delay(50 + index * 40)}>
        <View style={[
          styles.achievementCard,
          { backgroundColor: colors.surface },
          isUnlocked && { borderWidth: 1.5, borderColor: tierColor.border },
        ]}>
          <View style={styles.achievementRow}>
            <View style={[
              styles.achievementIcon,
              { backgroundColor: isUnlocked ? tierColor.bg : colors.backgroundSecondary },
            ]}>
              {isUnlocked ? (
                <MaterialIcons name={ach.icon as any} size={24} color={tierColor.text} />
              ) : (
                <MaterialIcons name="lock" size={22} color={colors.textTertiary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.achievementTitleRow}>
                <Text style={[
                  styles.achievementTitle,
                  { color: isUnlocked ? colors.textPrimary : colors.textTertiary },
                ]}>{achTitle}</Text>
                <View style={[styles.tierBadge, { backgroundColor: tierColor.bg }]}>
                  <Text style={[styles.tierBadgeText, { color: tierColor.text }]}>
                    {ach.tier.charAt(0).toUpperCase() + ach.tier.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.achievementDesc, { color: colors.textSecondary }]}>{achDesc}</Text>
              {!isUnlocked ? (
                <View style={styles.progressRow}>
                  <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
                    <View style={[
                      styles.progressFill,
                      { width: `${progressPercent * 100}%`, backgroundColor: tierColor.text },
                    ]} />
                  </View>
                  <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                    {progress}/{ach.requirement}
                  </Text>
                </View>
              ) : (
                <View style={styles.unlockedBadge}>
                  <MaterialIcons name="check-circle" size={14} color={colors.success} />
                  <Text style={[styles.unlockedText, { color: colors.success }]}>{t.unlocked || 'Unlocked'}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.achievements || 'Achievements'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Trophy Case Hero */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.heroSection}>
          <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <Image source={require('../assets/images/achievements-hero.png')} style={styles.heroBgImage} contentFit="cover" />
            <View style={styles.heroContent}>
              <MaterialIcons name="emoji-events" size={40} color="#FFF" />
              <Text style={styles.heroValue}>{totalUnlocked}/{ACHIEVEMENTS.length}</Text>
              <Text style={styles.heroLabel}>{t.achievementsUnlocked || 'Achievements Unlocked'}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tier Summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.tierRow}>
          {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => {
            const tierColor = TIER_COLORS[tier];
            return (
              <View key={tier} style={[styles.tierCard, { backgroundColor: colors.surface }]}>
                <LinearGradient colors={tierColor.gradient} style={styles.tierIconBg}>
                  <MaterialIcons name="emoji-events" size={16} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.tierCount, { color: colors.textPrimary }]}>{tiers[tier]}</Text>
                <Text style={[styles.tierLabel, { color: colors.textTertiary }]}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Category Filter */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => { Haptics.selectionAsync(); setFilter(cat.key); }}
                style={[
                  styles.filterChip,
                  { backgroundColor: filter === cat.key ? colors.primary : colors.backgroundSecondary },
                ]}
              >
                <MaterialIcons name={cat.icon as any} size={16} color={filter === cat.key ? '#FFF' : colors.textSecondary} />
                <Text style={[
                  styles.filterText,
                  { color: filter === cat.key ? '#FFF' : colors.textSecondary },
                ]}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Achievement Cards */}
        <View style={styles.achievementsList}>
          {/* Unlocked first */}
          {filtered.filter(a => unlockedSet.has(a.id)).map((ach, i) => renderAchievementCard(ach, i))}
          {/* Then locked */}
          {filtered.filter(a => !unlockedSet.has(a.id)).map((ach, i) => renderAchievementCard(ach, i + 5))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  heroSection: { paddingHorizontal: 16, marginTop: 8 },
  heroCard: { borderRadius: themeShared.radius.xl, height: 160, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  heroBgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.12 },
  heroContent: { alignItems: 'center', zIndex: 1 },
  heroValue: { fontSize: 44, fontWeight: '700', color: '#FFF', marginTop: 6 },
  heroLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  tierRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  tierCard: { flex: 1, alignItems: 'center', borderRadius: themeShared.radius.md, padding: 12, ...themeShared.shadows.card },
  tierIconBg: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tierCount: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  tierLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  filterRow: { paddingHorizontal: 16, gap: 8, marginTop: 20, paddingBottom: 4 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: themeShared.radius.full },
  filterText: { fontSize: 13, fontWeight: '600' },
  achievementsList: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  achievementCard: { borderRadius: themeShared.radius.lg, padding: 16, ...themeShared.shadows.card },
  achievementRow: { flexDirection: 'row', gap: 14 },
  achievementIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  achievementTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  achievementTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tierBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  achievementDesc: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '600', minWidth: 40, textAlign: 'right' },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  unlockedText: { fontSize: 12, fontWeight: '600' },
});
