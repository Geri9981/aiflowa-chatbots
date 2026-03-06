import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { themeShared } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { mockWeeklySummary } from '../../services/mockData';
import { getTranslation } from '../../constants/translations';
import MoodPrediction from '../../components/MoodPrediction';
import PremiumGate from '../../components/PremiumGate';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 180;

type Period = '1W' | '2W' | '1M';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { moodHistory, weeklyAvgMood, currentStreak, totalJournalEntries, language, colors, isPremium, refreshCloudData, isRefreshing } = useApp();
  const { checkSubscription } = useAuth();
  const t = getTranslation(language);
  const [period, setPeriod] = useState<Period>('1W');

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshCloudData(), checkSubscription()]);
  }, [refreshCloudData, checkSubscription]);

  const now = new Date();
  const days = period === '1W' ? 7 : period === '2W' ? 14 : 30;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const filteredMoods = moodHistory.filter(m => {
    try {
      const d = new Date(m.date + 'T12:00:00');
      return !isNaN(d.getTime()) && d >= cutoff;
    } catch { return false; }
  }).sort((a, b) => {
    const da = new Date(a.date + 'T12:00:00').getTime() || 0;
    const db = new Date(b.date + 'T12:00:00').getTime() || 0;
    return da - db;
  });

  const avgMood = filteredMoods.length > 0 ? Math.round((filteredMoods.reduce((s, m) => s + m.value, 0) / filteredMoods.length) * 10) / 10 : 0;
  const highestMood = filteredMoods.length > 0 ? Math.max(...filteredMoods.map(m => m.value)) : 0;
  const lowestMood = filteredMoods.length > 0 ? Math.min(...filteredMoods.map(m => m.value)) : 0;

  const trend = (() => {
    if (filteredMoods.length < 3) return 'stable' as const;
    const half = Math.floor(filteredMoods.length / 2);
    const first = filteredMoods.slice(0, half).reduce((s, m) => s + m.value, 0) / half;
    const second = filteredMoods.slice(half).reduce((s, m) => s + m.value, 0) / (filteredMoods.length - half);
    if (second - first > 0.5) return 'improving' as const;
    if (first - second > 0.5) return 'declining' as const;
    return 'stable' as const;
  })();

  const trendConfig = {
    improving: { icon: 'trending-up' as const, color: colors.success, label: t.improving },
    stable: { icon: 'trending-flat' as const, color: colors.primary, label: t.stable },
    declining: { icon: 'trending-down' as const, color: colors.warning, label: t.needsAttention },
  };

  const renderChart = () => {
    if (filteredMoods.length === 0) return null;
    const padding = { top: 20, bottom: 30, left: 30, right: 16 };
    const chartW = CHART_WIDTH - padding.left - padding.right;
    const chartH = CHART_HEIGHT - padding.top - padding.bottom;
    const barWidth = Math.min(28, (chartW / filteredMoods.length) - 6);
    const totalBarsWidth = filteredMoods.length * (barWidth + 6);
    const startX = padding.left + (chartW - totalBarsWidth) / 2;

    return (
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {[2, 4, 6, 8, 10].map((val) => {
            const y = padding.top + chartH - (val / 10) * chartH;
            return (
              <React.Fragment key={val}>
                <Line x1={padding.left} y1={y} x2={CHART_WIDTH - padding.right} y2={y} stroke={colors.border} strokeWidth={1} strokeDasharray="4,4" />
                <SvgText x={padding.left - 8} y={y + 4} fontSize={10} fill={colors.textTertiary} textAnchor="end">{val}</SvgText>
              </React.Fragment>
            );
          })}
          {filteredMoods.map((mood, i) => {
            const x = startX + i * (barWidth + 6);
            const barH = (mood.value / 10) * chartH;
            const y = padding.top + chartH - barH;
            return (
              <React.Fragment key={mood.id}>
                <Rect x={x} y={y} width={barWidth} height={barH} rx={barWidth / 4} fill={colors.mood[mood.value] || colors.primary} opacity={0.85} />
                {(i % Math.ceil(filteredMoods.length / 7) === 0 || filteredMoods.length <= 7) && (
                  <SvgText x={x + barWidth / 2} y={CHART_HEIGHT - 4} fontSize={9} fill={colors.textTertiary} textAnchor="middle">
                    {new Date(mood.date + 'T12:00:00').toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'short' }).slice(0, 2)}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    );
  };

  return (
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
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.progress}</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/weekly-summary'); }} style={[styles.analyticsButton, { backgroundColor: colors.accent + '12' }]}>
              <MaterialIcons name="share" size={16} color={colors.accent} />
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/mood-analytics'); }} style={[styles.analyticsButton, { backgroundColor: colors.primary + '12' }]}>
              <MaterialIcons name="analytics" size={18} color={colors.primary} />
              <Text style={[styles.analyticsButtonText, { color: colors.primary }]}>{t.deepInsights}</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroSection}>
          <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <Image source={require('../../assets/images/progress-hero.png')} style={styles.heroBgImage} contentFit="cover" />
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>{t.averageMood}</Text>
              <Text style={styles.heroValue}>{avgMood}</Text>
              <View style={styles.trendRow}>
                <MaterialIcons name={trendConfig[trend].icon} size={18} color="#FFF" />
                <Text style={styles.trendText}>{trendConfig[trend].label}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[styles.statsGrid, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}><MaterialIcons name="local-fire-department" size={22} color="#F59E0B" /><Text style={[styles.statItemValue, { color: colors.textPrimary }]}>{currentStreak}</Text><Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>{t.dayStreak}</Text></View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}><MaterialIcons name="arrow-upward" size={22} color={colors.success} /><Text style={[styles.statItemValue, { color: colors.textPrimary }]}>{highestMood}</Text><Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>{t.highest}</Text></View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}><MaterialIcons name="arrow-downward" size={22} color={colors.warning} /><Text style={[styles.statItemValue, { color: colors.textPrimary }]}>{lowestMood}</Text><Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>{t.lowest}</Text></View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}><MaterialIcons name="edit-note" size={22} color={colors.accent} /><Text style={[styles.statItemValue, { color: colors.textPrimary }]}>{totalJournalEntries}</Text><Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>{t.entries}</Text></View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.periodSelector}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.moodTrend}</Text>
          <View style={styles.periodChips}>
            {(['1W', '2W', '1M'] as Period[]).map((p) => (
              <Pressable key={p} onPress={() => { Haptics.selectionAsync(); setPeriod(p); }} style={[styles.periodChip, { backgroundColor: colors.backgroundSecondary }, period === p && { backgroundColor: colors.primary }]}>
                <Text style={[styles.periodChipText, { color: colors.textSecondary }, period === p && { color: '#FFF' }]}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(350)}>
          <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>{renderChart()}</View>
        </Animated.View>

        {/* AI Mood Prediction */}
        <Animated.View entering={FadeInDown.duration(500).delay(380)} style={styles.predictionSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.moodPrediction || 'Mood Prediction'}</Text>
          {isPremium ? (
            <View style={{ marginTop: 12, marginHorizontal: 16 }}>
              <MoodPrediction />
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              <PremiumGate inline feature={t.moodPrediction || 'Mood Prediction'}>
                <View />
              </PremiumGate>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.summarySection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.weeklyInsight}</Text>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.accent + '14' }]}><MaterialIcons name="auto-awesome" size={20} color={colors.accent} /></View>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{mockWeeklySummary.insight}</Text>
            <View style={styles.summaryTags}>
              {mockWeeklySummary.topTags.map((tag) => (
                <View key={tag} style={[styles.summaryTag, { backgroundColor: colors.primary + '12' }]}><Text style={[styles.summaryTagText, { color: colors.primary }]}>{tag}</Text></View>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(450)} style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.recentCheckins}</Text>
          {filteredMoods.slice().reverse().slice(0, 7).map((mood) => (
            <View key={mood.id} style={[styles.historyItem, { borderBottomColor: colors.borderLight }]}>
              <View style={[styles.historyDot, { backgroundColor: colors.mood[mood.value] || colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyDate, { color: colors.textPrimary }]}>{new Date(mood.date + 'T12:00:00').toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                {mood.note ? <Text style={[styles.historyNote, { color: colors.textSecondary }]} numberOfLines={1}>{mood.note}</Text> : null}
              </View>
              <View style={[styles.historyMoodBadge, { backgroundColor: (colors.mood[mood.value] || colors.primary) + '18' }]}>
                <Text style={[styles.historyMoodValue, { color: colors.mood[mood.value] || colors.primary }]}>{mood.value}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  analyticsButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: themeShared.radius.full },
  analyticsButtonText: { fontSize: 13, fontWeight: '600' },
  heroSection: { paddingHorizontal: 16, marginTop: 16 },
  heroCard: { borderRadius: themeShared.radius.xl, padding: 24, height: 160, justifyContent: 'flex-end', overflow: 'hidden' },
  heroBgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.15, borderRadius: themeShared.radius.xl },
  heroContent: { zIndex: 1 },
  heroLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1.5 },
  heroValue: { fontSize: 56, fontWeight: '700', color: '#FFF', marginTop: 4 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  trendText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  statsGrid: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, borderRadius: themeShared.radius.lg, padding: 16, ...themeShared.shadows.card },
  statItem: { flex: 1, alignItems: 'center' },
  statItemValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  statItemLabel: { fontSize: 10, fontWeight: '500', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  statDivider: { width: 1, marginVertical: 4 },
  periodSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  periodChips: { flexDirection: 'row', gap: 6 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: themeShared.radius.full },
  periodChipText: { fontSize: 13, fontWeight: '600' },
  chartCard: { marginHorizontal: 16, marginTop: 12, borderRadius: themeShared.radius.lg, paddingVertical: 12, paddingHorizontal: 8, ...themeShared.shadows.card },
  chartContainer: { alignItems: 'center' },
  summarySection: { paddingHorizontal: 20, marginTop: 24 },
  summaryCard: { borderRadius: themeShared.radius.lg, padding: 18, marginTop: 12, ...themeShared.shadows.card },
  summaryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryText: { fontSize: 14, lineHeight: 22 },
  summaryTags: { flexDirection: 'row', gap: 6, marginTop: 12 },
  summaryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: themeShared.radius.full },
  summaryTagText: { fontSize: 11, fontWeight: '600' },
  historySection: { paddingHorizontal: 20, marginTop: 24 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyDate: { fontSize: 14, fontWeight: '600' },
  historyNote: { fontSize: 12, marginTop: 2 },
  historyMoodBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  historyMoodValue: { fontSize: 15, fontWeight: '700' },
  predictionSection: { marginTop: 24 },
});
