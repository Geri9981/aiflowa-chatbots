import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Share,
  RefreshControl,
} from 'react-native';
import ReanimatedAnimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, runOnJS } from 'react-native-reanimated';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { themeShared } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { APP_CONFIG } from '../../constants/config';
import { affirmationGradients } from '../../services/mockData';
import { useApp } from '../../contexts/AppContext';
import { getTranslation } from '../../constants/translations';
import StreakCalendar from '../../components/StreakCalendar';
import SubscriptionBadge from '../../components/SubscriptionBadge';
import { ACHIEVEMENTS } from '../../services/achievements';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Skeleton placeholder component with shimmer animation
function SkeletonBlock({ width, height, borderRadius = 12, style }: { width: number | string; height: number; borderRadius?: number; style?: any }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ReanimatedAnimated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: '#CBD5E0' },
        animatedStyle,
        style,
      ]}
    />
  );
}

function HomeSkeleton({ colors }: { colors: any }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, paddingTop: 12 }}>
      {/* Header skeleton */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <SkeletonBlock width={220} height={28} borderRadius={8} style={{ backgroundColor: colors.backgroundSecondary }} />
        <SkeletonBlock width={160} height={16} borderRadius={6} style={{ marginTop: 6, backgroundColor: colors.backgroundSecondary }} />
      </View>

      {/* Category filter skeleton */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
        {[70, 60, 65, 75, 80].map((w, i) => (
          <SkeletonBlock key={i} width={w} height={34} borderRadius={20} style={{ backgroundColor: colors.backgroundSecondary }} />
        ))}
      </View>

      {/* Affirmation card skeleton */}
      <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
        <SkeletonBlock width={'100%' as any} height={140} borderRadius={20} style={{ backgroundColor: colors.primary + '18' }} />
      </View>

      {/* Mood card skeleton */}
      <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
        <SkeletonBlock width={'100%' as any} height={80} borderRadius={16} style={{ backgroundColor: colors.backgroundSecondary }} />
      </View>

      {/* Stats row skeleton */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 14 }}>
        {[1, 2, 3].map(i => (
          <View key={i} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, alignItems: 'center', gap: 6 }}>
            <SkeletonBlock width={20} height={20} borderRadius={10} style={{ backgroundColor: colors.backgroundSecondary }} />
            <SkeletonBlock width={40} height={22} borderRadius={6} style={{ backgroundColor: colors.backgroundSecondary }} />
            <SkeletonBlock width={50} height={12} borderRadius={4} style={{ backgroundColor: colors.backgroundSecondary }} />
          </View>
        ))}
      </View>

      {/* Quick actions skeleton */}
      <View style={{ paddingHorizontal: 16, marginTop: 10, gap: 12 }}>
        <SkeletonBlock width={140} height={20} borderRadius={6} style={{ marginLeft: 4, backgroundColor: colors.backgroundSecondary }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 18, gap: 10 }}>
            <SkeletonBlock width={44} height={44} borderRadius={22} style={{ backgroundColor: colors.backgroundSecondary }} />
            <SkeletonBlock width={90} height={16} borderRadius={6} style={{ backgroundColor: colors.backgroundSecondary }} />
            <SkeletonBlock width={120} height={13} borderRadius={4} style={{ backgroundColor: colors.backgroundSecondary }} />
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 18, gap: 10 }}>
            <SkeletonBlock width={44} height={44} borderRadius={22} style={{ backgroundColor: colors.backgroundSecondary }} />
            <SkeletonBlock width={80} height={16} borderRadius={6} style={{ backgroundColor: colors.backgroundSecondary }} />
            <SkeletonBlock width={110} height={13} borderRadius={4} style={{ backgroundColor: colors.backgroundSecondary }} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const {
    todayMood, weeklyAvgMood, currentStreak, totalJournalEntries,
    recommendations, completedRecommendations, completeRecommendation,
    userName, currentAffirmation, nextAffirmation, prevAffirmation,
    favoriteAffirmations, toggleFavoriteAffirmation, language, colors, diagnosis,
    unlockedAchievements, newAchievement, clearNewAchievement,
    affirmationFilter, setAffirmationFilter, filteredAffirmation,
    nextFilteredAffirmation, prevFilteredAffirmation,
    refreshCloudData, isRefreshing,
  } = useApp();
  const { checkSubscription } = useAuth();

  const displayName = user?.name?.split(' ')[0] || '';

  const t = getTranslation(language);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Show skeleton briefly on first render then reveal content
    const timer = setTimeout(() => setIsInitialLoad(false), 600);
    return () => clearTimeout(timer);
  }, []);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  useEffect(() => {
  if (!diagnosis || diagnosis.length === 0) {
    router.replace('/onboarding');
  }
}, [diagnosis, router]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const base = hour < 12 ? t.goodMorning : hour < 17 ? t.goodAfternoon : t.goodEvening;
    return displayName ? `${base}, ${displayName}` : base;
  };

  const handleRecommendationPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 'r1') { router.push('/breathing'); return; }
    completeRecommendation(id);
  }, [completeRecommendation, router]);

  const handleShareAffirmation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await Share.share({ message: `"${displayAffirmation?.text || currentAffirmation.text}" — MindSpace` }); } catch (e) { }
  };

  const handleSwipeLeft = useCallback(() => { Haptics.selectionAsync(); setSwipeDirection('left'); nextFilteredAffirmation(); setTimeout(() => setSwipeDirection(null), 300); }, [nextFilteredAffirmation]);
  const handleSwipeRight = useCallback(() => { Haptics.selectionAsync(); setSwipeDirection('right'); prevFilteredAffirmation(); setTimeout(() => setSwipeDirection(null), 300); }, [prevFilteredAffirmation]);

  const swipeGesture = Gesture.Pan().activeOffsetX([-20, 20]).onEnd((e) => {
    if (e.translationX < -50) runOnJS(handleSwipeLeft)();
    else if (e.translationX > 50) runOnJS(handleSwipeRight)();
  });

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshCloudData(), checkSubscription()]);
  }, [refreshCloudData, checkSubscription]);

  const displayAffirmation = filteredAffirmation || currentAffirmation;
  const isFavorite = favoriteAffirmations.includes(displayAffirmation.id);
  const gradientColors = affirmationGradients[displayAffirmation.category] || affirmationGradients.calm;

  const AFFIRMATION_CATEGORIES = [
    { key: null, label: t.all || 'All', icon: 'auto-awesome' as const },
    { key: 'calm', label: t.calm || 'Calm', icon: 'spa' as const },
    { key: 'strength', label: t.strength || 'Strength', icon: 'fitness-center' as const },
    { key: 'growth', label: t.growth || 'Growth', icon: 'trending-up' as const },
    { key: 'gratitude', label: t.gratitude || 'Gratitude', icon: 'favorite' as const },
    { key: 'self-love', label: t.selfLove || 'Self-Love', icon: 'self-improvement' as const },
  ];

  const recTranslations: Record<string, { title: string; desc: string }> = {
    r1: { title: t.recBoxBreathing, desc: t.recBoxBreathingDesc },
    r2: { title: t.recGratitude, desc: t.recGratitudeDesc },
    r3: { title: t.recMindfulWalk, desc: t.recMindfulWalkDesc },
    r4: { title: t.recBodyScan, desc: t.recBodyScanDesc },
    r5: { title: t.recThoughtReframe, desc: t.recThoughtReframeDesc },
    r6: { title: t.rec478, desc: t.rec478Desc },
  };

  if (isInitialLoad) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
          <HomeSkeleton colors={colors} />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.textPrimary }]}>{getGreeting()}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.howFeeling}</Text>
            </View>
            <View style={styles.headerRight}>
              <SubscriptionBadge variant="compact" />
              <Pressable onPress={() => router.push('/settings')} style={[styles.settingsButton, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="person" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
          </Animated.View>

          {/* Diagnosis Tag */}
          {diagnosis.length > 0 ? (
            <Animated.View entering={FadeInDown.duration(500).delay(25)} style={styles.diagnosisRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {diagnosis.map(d => (
                  <View key={d} style={[styles.diagnosisChip, { backgroundColor: colors.accent + '18' }]}>
                    <MaterialIcons name="psychology" size={12} color={colors.accent} />
                    <Text style={[styles.diagnosisText, { color: colors.accent }]}>{d}</Text>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          ) : null}

          {/* Admin Dashboard Button */}
          {user?.isAdmin ? (
            <Animated.View entering={FadeInDown.duration(500).delay(25)}>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin-dashboard'); }} style={({ pressed }) => [styles.adminBanner, pressed && { transform: [{ scale: 0.98 }] }]}>
                <LinearGradient colors={['#1E3A5F', '#2D5F8A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.adminGradient}>
                  <View style={styles.adminIconBg}><MaterialIcons name="dashboard" size={20} color="#FFF" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adminTitle}>Admin Dashboard</Text>
                    <Text style={styles.adminDesc}>Users, revenue and analytics</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.6)" />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Affirmation Category Filter */}
          <Animated.View entering={FadeInDown.duration(500).delay(40)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilterRow}>
              {AFFIRMATION_CATEGORIES.map(cat => {
                const isSelected = affirmationFilter === cat.key;
                return (
                  <Pressable
                    key={cat.key || 'all'}
                    onPress={() => { Haptics.selectionAsync(); setAffirmationFilter(cat.key); }}
                    style={[styles.categoryChip, { backgroundColor: isSelected ? colors.primary : colors.surface }]}
                  >
                    <MaterialIcons name={cat.icon} size={14} color={isSelected ? '#FFF' : colors.textSecondary} />
                    <Text style={[styles.categoryChipText, { color: isSelected ? '#FFF' : colors.textSecondary }]}>{cat.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Daily Affirmation Card */}
          <Animated.View entering={FadeInDown.duration(500).delay(50)}>
            <GestureDetector gesture={swipeGesture}>
              <View style={styles.affirmationOuter}>
                <LinearGradient colors={gradientColors as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.affirmationCard}>
                  <View style={styles.affirmationHeader}>
                    <View style={styles.affirmationBadge}>
                      <MaterialIcons name="auto-awesome" size={14} color="#FFF" />
                      <Text style={styles.affirmationBadgeText}>{t.dailyAffirmation}</Text>
                    </View>
                    <View style={styles.affirmationActions}>
                      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleFavoriteAffirmation(displayAffirmation.id); }} hitSlop={8}>
                        <MaterialIcons name={isFavorite ? 'favorite' : 'favorite-border'} size={22} color="#FFF" />
                      </Pressable>
                      <Pressable onPress={handleShareAffirmation} hitSlop={8}>
                        <MaterialIcons name="share" size={20} color="rgba(255,255,255,0.85)" />
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.affirmationText}>{`"${displayAffirmation.text}"`}</Text>
                  <View style={styles.affirmationNav}>
                    <Pressable onPress={handleSwipeRight} style={styles.affirmationArrow} hitSlop={12}><MaterialIcons name="chevron-left" size={22} color="rgba(255,255,255,0.6)" /></Pressable>
                    <Text style={styles.affirmationHint}>{t.swipeForMore}</Text>
                    <Pressable onPress={handleSwipeLeft} style={styles.affirmationArrow} hitSlop={12}><MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.6)" /></Pressable>
                  </View>
                </LinearGradient>
              </View>
            </GestureDetector>
          </Animated.View>

          {/* Mood Check-in Card */}
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <Pressable onPress={() => router.push('/mood-checkin')} style={({ pressed }) => [styles.moodCard, pressed && { transform: [{ scale: 0.98 }] }]}>
              <LinearGradient colors={todayMood ? [colors.primary, colors.accent] : [colors.cardChat, colors.cardJournal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.moodGradient}>
                {todayMood ? (
                  <View style={styles.moodCheckedIn}>
                    <View style={styles.moodValueCircle}><Text style={styles.moodValueText}>{todayMood.value}</Text></View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={styles.moodCheckedLabel}>{t.todaysMood}</Text>
                      <Text style={styles.moodCheckedDesc}>{APP_CONFIG.moodScale.labels[todayMood.value]}</Text>
                      <Text style={styles.moodTapHint}>{t.tapToUpdate}</Text>
                    </View>
                    <Text style={styles.moodEmoji}>{APP_CONFIG.moodScale.emojis[todayMood.value]}</Text>
                  </View>
                ) : (
                  <View style={styles.moodNotChecked}>
                    <View style={[styles.moodIconContainer, { backgroundColor: colors.primary + '18' }]}><MaterialIcons name="add-circle-outline" size={32} color={colors.primary} /></View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={[styles.moodPromptTitle, { color: colors.textPrimary }]}>{t.dailyCheckin}</Text>
                      <Text style={[styles.moodPromptDesc, { color: colors.textSecondary }]}>{t.howFeelingNow}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.statsRow}>
            {[
              { icon: 'local-fire-department' as const, color: '#F59E0B', value: currentStreak, label: t.dayStreak },
              { icon: 'mood' as const, color: colors.primary, value: weeklyAvgMood, label: t.weekAvg },
              { icon: 'edit-note' as const, color: colors.accent, value: totalJournalEntries, label: t.entries },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name={s.icon} size={20} color={s.color} />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Achievement Toast */}
          {newAchievement ? (
            <Animated.View entering={FadeInDown.duration(500)} style={[styles.achievementToast, { backgroundColor: '#FEF3C7' }]}>
              <MaterialIcons name="emoji-events" size={20} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.toastTitle}>{t.newAchievement || 'New Achievement!'}</Text>
                <Text style={styles.toastDesc}>{ACHIEVEMENTS.find(a => a.id === newAchievement)?.title || ''}</Text>
              </View>
              <Pressable onPress={() => { clearNewAchievement(); router.push('/achievements'); }} hitSlop={8}>
                <Text style={styles.toastAction}>{t.view || 'View'}</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Streak Calendar */}
          <StreakCalendar />

          {/* Achievements Mini + Share + Sounds */}
          <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.achieveRow}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/achievements'); }} style={({ pressed }) => [styles.achieveCard, { backgroundColor: colors.surface }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <View style={[styles.achieveIconBg, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="emoji-events" size={20} color="#D97706" />
              </View>
              <Text style={[styles.achieveValue, { color: colors.textPrimary }]}>{unlockedAchievements.length}/{ACHIEVEMENTS.length}</Text>
              <Text style={[styles.achieveLabel, { color: colors.textTertiary }]}>{t.achievements || 'Achievements'}</Text>
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/weekly-summary'); }} style={({ pressed }) => [styles.achieveCard, { backgroundColor: colors.surface }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <View style={[styles.achieveIconBg, { backgroundColor: colors.primary + '14' }]}>
                <MaterialIcons name="share" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.achieveValue, { color: colors.textPrimary }]}>{weeklyAvgMood}</Text>
              <Text style={[styles.achieveLabel, { color: colors.textTertiary }]}>{t.weeklySummary || 'Share Week'}</Text>
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/sound-library'); }} style={({ pressed }) => [styles.achieveCard, { backgroundColor: colors.surface }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <View style={[styles.achieveIconBg, { backgroundColor: colors.accent + '14' }]}>
                <MaterialIcons name="library-music" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.achieveValue, { color: colors.textPrimary }]}>12+</Text>
              <Text style={[styles.achieveLabel, { color: colors.textTertiary }]}>{t.sounds || 'Sounds'}</Text>
            </Pressable>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.quickActions}</Text>
            <View style={styles.quickActions}>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/chat'); }} style={({ pressed }) => [styles.quickActionCard, { backgroundColor: colors.cardChat }, pressed && { transform: [{ scale: 0.96 }] }]}>
                <View style={[styles.quickActionIcon, { backgroundColor: colors.primary }]}><MaterialIcons name="chat-bubble" size={22} color="#FFF" /></View>
                <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>{t.talkToAI}</Text>
                <Text style={[styles.quickActionDesc, { color: colors.textSecondary }]}>{t.shareWhatsOnMind}</Text>
              </Pressable>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/meditation'); }} style={({ pressed }) => [styles.quickActionCard, { backgroundColor: colors.cardMeditation }, pressed && { transform: [{ scale: 0.96 }] }]}>
                <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary }]}><MaterialIcons name="self-improvement" size={22} color="#FFF" /></View>
                <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>{t.meditation || 'Meditate'}</Text>
                <Text style={[styles.quickActionDesc, { color: colors.textSecondary }]}>{t.guidedMeditationTimer || 'Guided meditation timer'}</Text>
              </Pressable>
            </View>
            <View style={[styles.quickActions, { marginTop: 12 }]}>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/journal-entry'); }} style={({ pressed }) => [styles.quickActionCard, { backgroundColor: colors.cardJournal }, pressed && { transform: [{ scale: 0.96 }] }]}>
                <View style={[styles.quickActionIcon, { backgroundColor: colors.accent }]}><MaterialIcons name="edit" size={22} color="#FFF" /></View>
                <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>{t.journal}</Text>
                <Text style={[styles.quickActionDesc, { color: colors.textSecondary }]}>{t.writeAndReflect}</Text>
              </Pressable>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/breathing'); }} style={({ pressed }) => [styles.quickActionCard, { backgroundColor: colors.cardBreathe }, pressed && { transform: [{ scale: 0.96 }] }]}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#5B8FB9' }]}><MaterialIcons name="air" size={22} color="#FFF" /></View>
                <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>{t.breathe}</Text>
                <Text style={[styles.quickActionDesc, { color: colors.textSecondary }]}>{t.boxBreathingExercise}</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Hero Image */}
          <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.heroContainer}>
            <Image source={require('../../assets/images/home-hero.png')} style={styles.heroImage} contentFit="cover" />
            <LinearGradient colors={['transparent', 'rgba(91, 143, 185, 0.85)']} style={styles.heroOverlay}>
              <Text style={styles.heroText}>{t.yourSafeSpace}</Text>
              <Text style={styles.heroSubtext}>{t.notReplacement}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Daily Recommendations */}
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.section}>
            <View style={styles.recHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.recommendedForYou}</Text>
              <View style={[styles.recProgressBadge, { backgroundColor: colors.primary + '14' }]}>
                <Text style={[styles.recProgressText, { color: colors.primary }]}>{completedRecommendations.length}/{recommendations.length}</Text>
              </View>
            </View>
            {/* Progress bar */}
            <View style={[styles.recProgressBar, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={[styles.recProgressFill, { backgroundColor: colors.primary, width: `${Math.min(100, (completedRecommendations.length / Math.max(1, recommendations.length)) * 100)}%` }]} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingTop: 4 }}>
              {recommendations.map((rec, recIndex) => {
                const isCompleted = completedRecommendations.includes(rec.id);
                const tr = recTranslations[rec.id];
                return (
                  <Pressable key={rec.id} onPress={() => handleRecommendationPress(rec.id)} style={({ pressed }) => [styles.recCard, { backgroundColor: colors.surface }, isCompleted && styles.recCardCompleted, pressed && { transform: [{ scale: 0.97 }] }]}>
                    <View style={styles.recCardTop}>
                      <View style={[styles.recIconCircle, { backgroundColor: rec.color + '18' }]}>
                        {isCompleted ? <MaterialIcons name="check-circle" size={24} color={colors.success} /> : <MaterialIcons name={rec.icon as any} size={24} color={rec.color} />}
                      </View>
                      {isCompleted ? (
                        <View style={[styles.recDoneBadge, { backgroundColor: colors.success + '18' }]}>
                          <MaterialIcons name="done" size={10} color={colors.success} />
                          <Text style={{ fontSize: 9, fontWeight: '700', color: colors.success }}>{t.done || 'Done'}</Text>
                        </View>
                      ) : rec.duration ? (
                        <View style={[styles.recDuration, { backgroundColor: colors.backgroundSecondary }]}>
                          <MaterialIcons name="schedule" size={11} color={colors.textTertiary} />
                          <Text style={[styles.recDurationText, { color: colors.textTertiary }]}>{rec.duration}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.recTitle, { color: colors.textPrimary }, isCompleted && { textDecorationLine: 'line-through', color: colors.textSecondary }]}>{tr ? tr.title : rec.title}</Text>
                    <Text style={[styles.recDesc, { color: colors.textSecondary }]} numberOfLines={2}>{tr ? tr.desc : rec.description}</Text>
                    {!isCompleted ? (
                      <View style={[styles.recStartBtn, { backgroundColor: rec.color + '14' }]}>
                        <Text style={[styles.recStartText, { color: rec.color }]}>{rec.id === 'r1' ? (t.beginSession || 'Start') : (t.recStartAction || 'Start')}</Text>
                        <MaterialIcons name="arrow-forward" size={12} color={rec.color} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Disclaimer */}
          <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.disclaimerContainer}>
            <View style={[styles.disclaimerCard, { backgroundColor: colors.backgroundSecondary }]}>
              <MaterialIcons name="info-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>{t.disclaimer}</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greeting: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 2 },
  settingsButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', ...themeShared.shadows.card },
  diagnosisRow: { marginTop: 4, marginBottom: 4 },
  diagnosisChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  diagnosisText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  adminBanner: { marginHorizontal: 16, marginTop: 12, borderRadius: themeShared.radius.lg, overflow: 'hidden', ...themeShared.shadows.elevated },
  adminGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: themeShared.radius.lg },
  adminIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  adminTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  adminDesc: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  affirmationOuter: { marginHorizontal: 16, marginTop: 16, borderRadius: themeShared.radius.xl, overflow: 'hidden', ...themeShared.shadows.elevated },
  affirmationCard: { borderRadius: themeShared.radius.xl, padding: 20 },
  affirmationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  affirmationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  affirmationBadgeText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  affirmationActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  affirmationText: { fontSize: 18, fontWeight: '600', color: '#FFF', lineHeight: 26, textAlign: 'center', paddingHorizontal: 8, minHeight: 60 },
  categoryFilterRow: { paddingHorizontal: 16, gap: 8, paddingTop: 10, paddingBottom: 2 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  affirmationNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  affirmationArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  affirmationHint: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  moodCard: { marginHorizontal: 16, marginTop: 14, borderRadius: themeShared.radius.lg, overflow: 'hidden', ...themeShared.shadows.elevated },
  moodGradient: { padding: 20, borderRadius: themeShared.radius.lg },
  moodCheckedIn: { flexDirection: 'row', alignItems: 'center' },
  moodValueCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  moodValueText: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  moodCheckedLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 },
  moodCheckedDesc: { fontSize: 18, fontWeight: '600', color: '#FFF', marginTop: 2 },
  moodTapHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  moodEmoji: { fontSize: 36 },
  moodNotChecked: { flexDirection: 'row', alignItems: 'center' },
  moodIconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  moodPromptTitle: { fontSize: 18, fontWeight: '700' },
  moodPromptDesc: { fontSize: 14, marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 14 },
  statCard: { flex: 1, borderRadius: themeShared.radius.md, padding: 14, alignItems: 'center', ...themeShared.shadows.card },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 12 },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  quickActionCard: { flex: 1, borderRadius: themeShared.radius.lg, padding: 18 },
  quickActionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickActionTitle: { fontSize: 16, fontWeight: '700' },
  quickActionDesc: { fontSize: 13, marginTop: 4 },
  heroContainer: { marginHorizontal: 16, marginTop: 24, borderRadius: themeShared.radius.xl, overflow: 'hidden', height: 180, ...themeShared.shadows.elevated },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 20 },
  heroText: { fontSize: 20, fontWeight: '700', color: '#FFF', lineHeight: 26 },
  heroSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  recHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 4 },
  recProgressBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  recProgressText: { fontSize: 12, fontWeight: '700' },
  recProgressBar: { height: 4, marginHorizontal: 20, borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  recProgressFill: { height: '100%', borderRadius: 2 },
  recCard: { width: 170, borderRadius: themeShared.radius.lg, padding: 16, ...themeShared.shadows.card },
  recCardCompleted: { opacity: 0.65 },
  recCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  recIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  recDoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  recTitle: { fontSize: 14, fontWeight: '700' },
  recDesc: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  recDuration: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  recDurationText: { fontSize: 10, fontWeight: '600' },
  recStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, paddingVertical: 7, borderRadius: 10 },
  recStartText: { fontSize: 12, fontWeight: '700' },
  disclaimerContainer: { paddingHorizontal: 16, marginTop: 24 },
  disclaimerCard: { flexDirection: 'row', borderRadius: themeShared.radius.md, padding: 14, gap: 10, alignItems: 'flex-start' },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
  achievementToast: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 14, paddingHorizontal: 16, paddingVertical: 12, borderRadius: themeShared.radius.lg },
  toastTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  toastDesc: { fontSize: 12, color: '#B45309', marginTop: 1 },
  toastAction: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  achieveRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 14 },
  achieveCard: { flex: 1, alignItems: 'center', borderRadius: themeShared.radius.lg, padding: 14, ...themeShared.shadows.card },
  achieveIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  achieveValue: { fontSize: 16, fontWeight: '700' },
  achieveLabel: { fontSize: 10, fontWeight: '500', marginTop: 2, textAlign: 'center' },
});
