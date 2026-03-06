import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { themeShared } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getTranslation } from '../constants/translations';
import { ACHIEVEMENTS } from '../services/achievements';
import SubscriptionBadge from '../components/SubscriptionBadge';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const {
    language, colors, userName, moodHistory, journalEntries, meditationSessions,
    breathingCompleted, currentStreak, meditationStreak, unlockedAchievements,
    weeklyAvgMood, totalMeditationMinutes, diagnosis, wellnessGoals, avatarUri, setAvatarUri,
  } = useApp();
  const t = getTranslation(language);

  // Calculate wellness score (0-100)
  const wellnessScore = useMemo(() => {
    let score = 0;
    // Mood consistency (up to 30 points)
    const moodScore = Math.min(30, currentStreak * 3);
    score += moodScore;
    // Meditation (up to 25 points)
    const medScore = Math.min(25, meditationSessions.length * 2.5);
    score += medScore;
    // Journaling (up to 20 points)
    const journalScore = Math.min(20, journalEntries.length * 2);
    score += journalScore;
    // Breathing (up to 15 points)
    const breathScore = Math.min(15, breathingCompleted * 3);
    score += breathScore;
    // Achievements (up to 10 points)
    const achieveScore = Math.min(10, unlockedAchievements.length * 0.5);
    score += achieveScore;
    return Math.round(Math.min(100, score));
  }, [currentStreak, meditationSessions.length, journalEntries.length, breathingCompleted, unlockedAchievements.length]);

  const scoreColor = wellnessScore >= 70 ? '#10B981' : wellnessScore >= 40 ? '#F59E0B' : '#EF4444';
  const scoreLabel = wellnessScore >= 70 ? 'Excellent' : wellnessScore >= 40 ? 'Good' : 'Getting Started';

  // Journey timeline
  const firstMoodDate = useMemo(() => {
    if (moodHistory.length === 0) return null;
    const sorted = [...moodHistory].sort((a, b) => a.timestamp - b.timestamp);
    return new Date(sorted[0].timestamp);
  }, [moodHistory]);

  const daysSinceStart = firstMoodDate
    ? Math.floor((Date.now() - firstMoodDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const totalActivities = moodHistory.length + journalEntries.length + meditationSessions.length + breathingCompleted;

  // Avatar picker
  const pickAvatar = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }, [setAvatarUri]);

  // Progress badges
  const badges = useMemo(() => {
    const list: Array<{ icon: string; label: string; earned: boolean; color: string }> = [];
    // Weekly badges
    list.push({ icon: 'event-available', label: '7-Day Streak', earned: currentStreak >= 7, color: '#F59E0B' });
    list.push({ icon: 'local-fire-department', label: '30-Day Streak', earned: currentStreak >= 30, color: '#EF4444' });
    list.push({ icon: 'self-improvement', label: '10 Meditations', earned: meditationSessions.length >= 10, color: '#8B5CF6' });
    list.push({ icon: 'edit-note', label: '10 Journals', earned: journalEntries.length >= 10, color: colors.accent });
    list.push({ icon: 'air', label: '5 Breathing', earned: breathingCompleted >= 5, color: '#5B8FB9' });
    list.push({ icon: 'emoji-events', label: '10 Achievements', earned: unlockedAchievements.length >= 10, color: '#D97706' });
    return list;
  }, [currentStreak, meditationSessions.length, journalEntries.length, breathingCompleted, unlockedAchievements.length, colors.accent]);

  const displayName = userName || user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.profile || 'Profile'}</Text>
        <Pressable onPress={() => router.push('/settings')} style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="settings" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Subscription Status */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.subscriptionSection}>
          <SubscriptionBadge variant="card" />
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.profileSection}>
          <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCard}>
            <Image source={require('../assets/images/profile-hero.png')} style={styles.profileBg} contentFit="cover" />
            <View style={styles.profileContent}>
              <Pressable onPress={pickAvatar} style={({ pressed }) => [styles.avatarContainer, pressed && { transform: [{ scale: 0.95 }] }]}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <MaterialIcons name="camera-alt" size={14} color="#FFF" />
                </View>
              </Pressable>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              {diagnosis.length > 0 ? (
                <View style={styles.diagnosisRow}>
                  {diagnosis.slice(0, 3).map(d => (
                    <View key={d} style={styles.diagChip}>
                      <Text style={styles.diagChipText}>{d}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Wellness Score */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Wellness Score</Text>
          <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
            <View style={styles.scoreCircleOuter}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
                <Text style={[styles.scoreValue, { color: scoreColor }]}>{wellnessScore}</Text>
                <Text style={[styles.scoreOf, { color: colors.textTertiary }]}>/100</Text>
              </View>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={[styles.scoreLabel, { color: scoreColor }]}>{scoreLabel}</Text>
              <View style={styles.scoreBreakdown}>
                {[
                  { label: 'Mood', value: Math.min(30, currentStreak * 3), max: 30, color: '#F59E0B' },
                  { label: 'Meditation', value: Math.min(25, meditationSessions.length * 2.5), max: 25, color: '#8B5CF6' },
                  { label: 'Journal', value: Math.min(20, journalEntries.length * 2), max: 20, color: colors.accent },
                  { label: 'Breathing', value: Math.min(15, breathingCompleted * 3), max: 15, color: '#5B8FB9' },
                ].map((item, i) => (
                  <View key={i} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                    <View style={[styles.breakdownBar, { backgroundColor: colors.borderLight }]}>
                      <View style={[styles.breakdownFill, { width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color }]} />
                    </View>
                    <Text style={[styles.breakdownValue, { color: colors.textTertiary }]}>{Math.round(item.value)}/{item.max}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Journey Timeline */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Wellness Journey</Text>
          <View style={[styles.journeyCard, { backgroundColor: colors.surface }]}>
            <View style={styles.journeyTimeline}>
              {/* Start */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]}>
                  <MaterialIcons name="flag" size={14} color="#FFF" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>Started Journey</Text>
                  <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                    {firstMoodDate ? firstMoodDate.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not yet started'}
                  </Text>
                </View>
              </View>
              <View style={[styles.timelineLine, { backgroundColor: colors.borderLight }]} />

              {/* Stats */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]}>
                  <MaterialIcons name="trending-up" size={14} color="#FFF" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>{daysSinceStart} Days Active</Text>
                  <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>{totalActivities} total activities completed</Text>
                </View>
              </View>
              <View style={[styles.timelineLine, { backgroundColor: colors.borderLight }]} />

              {/* Current */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]}>
                  <MaterialIcons name="emoji-events" size={14} color="#FFF" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>{unlockedAchievements.length} Achievements</Text>
                  <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                    {currentStreak} day mood streak | {meditationStreak} day meditation streak
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary stats */}
            <View style={[styles.journeyStats, { borderTopColor: colors.borderLight }]}>
              {[
                { icon: 'mood' as const, value: moodHistory.length, label: 'Check-ins', color: '#F59E0B' },
                { icon: 'edit-note' as const, value: journalEntries.length, label: 'Journals', color: colors.accent },
                { icon: 'self-improvement' as const, value: meditationSessions.length, label: 'Sessions', color: '#8B5CF6' },
                { icon: 'air' as const, value: breathingCompleted, label: 'Breathing', color: '#5B8FB9' },
              ].map((s, i) => (
                <View key={i} style={styles.journeyStat}>
                  <MaterialIcons name={s.icon} size={18} color={s.color} />
                  <Text style={[styles.journeyStatValue, { color: colors.textPrimary }]}>{s.value}</Text>
                  <Text style={[styles.journeyStatLabel, { color: colors.textTertiary }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Progress Badges */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Progress Badges</Text>
          <View style={styles.badgeGrid}>
            {badges.map((badge, i) => (
              <Animated.View key={i} entering={FadeInDown.duration(300).delay(300 + i * 50)} style={[styles.badgeCard, { backgroundColor: badge.earned ? colors.surface : colors.backgroundSecondary }]}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.earned ? badge.color + '18' : colors.borderLight }]}>
                  <MaterialIcons name={badge.icon as any} size={22} color={badge.earned ? badge.color : colors.textTertiary} />
                </View>
                <Text style={[styles.badgeLabel, { color: badge.earned ? colors.textPrimary : colors.textTertiary }]}>{badge.label}</Text>
                {badge.earned ? (
                  <MaterialIcons name="check-circle" size={14} color="#10B981" style={{ marginTop: 4 }} />
                ) : (
                  <MaterialIcons name="lock" size={14} color={colors.textTertiary} style={{ marginTop: 4 }} />
                )}
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Goals */}
        {wellnessGoals.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Goals</Text>
            <View style={[styles.goalsCard, { backgroundColor: colors.surface }]}>
              {wellnessGoals.map((goal, i) => (
                <View key={i} style={[styles.goalRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                  <View style={[styles.goalDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.goalText, { color: colors.textPrimary }]}>{goal}</Text>
                  <MaterialIcons name="check-circle-outline" size={18} color={colors.textTertiary} />
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        {/* Quick links */}
        <Animated.View entering={FadeInDown.duration(400).delay(450)} style={styles.section}>
          <View style={styles.quickLinks}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/achievements'); }} style={({ pressed }) => [styles.quickLink, { backgroundColor: colors.surface }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <MaterialIcons name="emoji-events" size={20} color="#D97706" />
              <Text style={[styles.quickLinkText, { color: colors.textPrimary }]}>Trophy Case</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/weekly-summary'); }} style={({ pressed }) => [styles.quickLink, { backgroundColor: colors.surface }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <MaterialIcons name="share" size={20} color={colors.primary} />
              <Text style={[styles.quickLinkText, { color: colors.textPrimary }]}>Share Progress</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>
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

  subscriptionSection: { paddingHorizontal: 16, marginTop: 8 },
  profileSection: { paddingHorizontal: 16, marginTop: 12 },
  profileCard: { borderRadius: themeShared.radius.xl, height: 220, overflow: 'hidden', justifyContent: 'flex-end' },
  profileBg: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
  profileContent: { alignItems: 'center', paddingBottom: 20, zIndex: 1 },
  avatarContainer: { marginBottom: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  profileName: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  diagnosisRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  diagChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  diagChipText: { fontSize: 11, fontWeight: '600', color: '#FFF', textTransform: 'capitalize' },

  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },

  scoreCard: { borderRadius: themeShared.radius.lg, padding: 20, ...themeShared.shadows.card },
  scoreCircleOuter: { alignItems: 'center', marginBottom: 16 },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { fontSize: 36, fontWeight: '700' },
  scoreOf: { fontSize: 13, fontWeight: '500', marginTop: -4 },
  scoreDetails: {},
  scoreLabel: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  scoreBreakdown: { gap: 10 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownLabel: { fontSize: 13, fontWeight: '600', width: 72 },
  breakdownBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 3 },
  breakdownValue: { fontSize: 11, fontWeight: '600', width: 36, textAlign: 'right' },

  journeyCard: { borderRadius: themeShared.radius.lg, padding: 20, ...themeShared.shadows.card },
  journeyTimeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: 15, fontWeight: '600' },
  timelineDate: { fontSize: 12, marginTop: 1 },
  timelineLine: { width: 2, height: 20, marginLeft: 14, marginVertical: 4 },
  journeyStats: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  journeyStat: { flex: 1, alignItems: 'center', gap: 4 },
  journeyStatValue: { fontSize: 18, fontWeight: '700' },
  journeyStatLabel: { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { width: '47.5%', borderRadius: themeShared.radius.md, padding: 14, alignItems: 'center', ...themeShared.shadows.card },
  badgeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  badgeLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  goalsCard: { borderRadius: themeShared.radius.lg, ...themeShared.shadows.card },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  goalDot: { width: 8, height: 8, borderRadius: 4 },
  goalText: { flex: 1, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },

  quickLinks: { gap: 10 },
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: themeShared.radius.lg, ...themeShared.shadows.card },
  quickLinkText: { flex: 1, fontSize: 15, fontWeight: '600' },
});
