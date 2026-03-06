
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Rect, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { themeShared } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';
import PremiumGate from '../components/PremiumGate';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 200;
const PIE_SIZE = 160;

export default function MoodAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { moodHistory, journalEntries, language, colors, isPremium } = useApp();
  const t = getTranslation(language);
  const DAYS_OF_WEEK = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

  const moods30d = useMemo(() => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return moodHistory.filter(m => new Date(m.date) >= cutoff).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [moodHistory]);

  const renderCombinedChart = () => {
    if (moods30d.length === 0) return null;
    const padding = { top: 24, bottom: 30, left: 30, right: 16 };
    const chartW = CHART_WIDTH - padding.left - padding.right;
    const chartH = CHART_HEIGHT - padding.top - padding.bottom;
    const barWidth = Math.min(20, (chartW / moods30d.length) - 4);
    const totalBarsWidth = moods30d.length * (barWidth + 4);
    const startX = padding.left + (chartW - totalBarsWidth) / 2;
    const avgPoints: string[] = [];
    for (let i = 0; i < moods30d.length; i++) {
      const start = Math.max(0, i - 1); const end = Math.min(moods30d.length - 1, i + 1);
      let sum = 0; let count = 0;
      for (let j = start; j <= end; j++) { sum += moods30d[j].value; count++; }
      const avg = sum / count;
      avgPoints.push(`${startX + i * (barWidth + 4) + barWidth / 2},${padding.top + chartH - (avg / 10) * chartH}`);
    }

    return (
      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{t.moodOverview30}</Text>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {[2, 4, 6, 8, 10].map((val) => {
            const y = padding.top + chartH - (val / 10) * chartH;
            return (
              <React.Fragment key={val}>
                <Line x1={padding.left} y1={y} x2={CHART_WIDTH - padding.right} y2={y} stroke={colors.borderLight} strokeWidth={1} strokeDasharray="3,3" />
                <SvgText x={padding.left - 8} y={y + 4} fontSize={9} fill={colors.textTertiary} textAnchor="end">{val}</SvgText>
              </React.Fragment>
            );
          })}
          {moods30d.map((mood, i) => {
            const x = startX + i * (barWidth + 4); const barH = (mood.value / 10) * chartH;
            return <Rect key={mood.id} x={x} y={padding.top + chartH - barH} width={barWidth} height={barH} rx={barWidth / 4} fill={colors.mood[mood.value] || colors.primary} opacity={0.4} />;
          })}
          <Polyline points={avgPoints.join(' ')} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        </Svg>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: colors.primary, opacity: 0.4 }]} /><Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.dailyMood}</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: colors.primary }]} /><Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.threeDayAvg}</Text></View>
        </View>
      </View>
    );
  };

  const moodDistribution = useMemo(() => {
    const buckets: Record<string, { label: string; color: string; count: number }> = {
      low: { label: t.lowMood, color: '#ED6444', count: 0 }, mid: { label: t.mediumMood, color: '#ECC94B', count: 0 },
      high: { label: t.goodMood, color: '#68D391', count: 0 }, great: { label: t.excellentMood, color: '#38A169', count: 0 },
    };
    moods30d.forEach(m => { if (m.value <= 3) buckets.low.count++; else if (m.value <= 6) buckets.mid.count++; else if (m.value <= 8) buckets.high.count++; else buckets.great.count++; });
    return Object.values(buckets);
  }, [moods30d, t]);

  const renderPieChart = () => {
    const total = moods30d.length;
    if (total === 0) return null;
    const cx = PIE_SIZE / 2; const cy = PIE_SIZE / 2; const r = PIE_SIZE / 2 - 8;
    let startPct = 0; const circumference = 2 * Math.PI * (r - 12);
    return (
      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{t.moodDistribution}</Text>
        <View style={styles.pieContainer}>
          <Svg width={PIE_SIZE} height={PIE_SIZE}>
            {moodDistribution.filter(d => d.count > 0).map((d, i) => {
              const pct = d.count / total; const dashLength = pct * circumference;
              const offset = -startPct * circumference - circumference * 0.25; startPct += pct;
              return <Circle key={i} cx={cx} cy={cy} r={r - 12} fill="none" stroke={d.color} strokeWidth={20} strokeDasharray={`${dashLength} ${circumference - dashLength}`} strokeDashoffset={offset} strokeLinecap="butt" />;
            })}
            <Circle cx={cx} cy={cy} r={r - 28} fill={colors.surface} />
            <SvgText x={cx} y={cy - 4} fontSize={22} fontWeight="700" fill={colors.textPrimary} textAnchor="middle">{total}</SvgText>
            <SvgText x={cx} y={cy + 14} fontSize={10} fill={colors.textSecondary} textAnchor="middle">{t.checkins}</SvgText>
          </Svg>
          <View style={styles.pieLegend}>
            {moodDistribution.map((d, i) => (
              <View key={i} style={styles.pieLegendItem}>
                <View style={[styles.pieLegendDot, { backgroundColor: d.color }]} />
                <Text style={[styles.pieLegendLabel, { color: colors.textSecondary }]}>{d.label}</Text>
                <Text style={[styles.pieLegendCount, { color: colors.textPrimary }]}>{d.count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const dayPatterns = useMemo(() => {
    const days: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    moods30d.forEach(m => { const day = new Date(m.date + 'T12:00:00').getDay(); days[day].push(m.value); });
    return DAYS_OF_WEEK.map((label, i) => {
      const vals = days[i]; const avg = vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
      return { label, avg, count: vals.length };
    });
  }, [moods30d, DAYS_OF_WEEK]);

  const tagCorrelations = useMemo(() => {
    const tagMap: Record<string, { moods: number[]; avgMood: number }> = {};
    journalEntries.forEach(entry => { if (entry.mood) { entry.tags.forEach(tag => { if (!tagMap[tag]) tagMap[tag] = { moods: [], avgMood: 0 }; tagMap[tag].moods.push(entry.mood as number); }); } });
    Object.keys(tagMap).forEach(tag => { const m = tagMap[tag].moods; tagMap[tag].avgMood = Math.round((m.reduce((s, v) => s + v, 0) / m.length) * 10) / 10; });
    return Object.entries(tagMap).map(([tag, data]) => ({ tag, avgMood: data.avgMood, count: data.moods.length })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [journalEntries]);

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.backgroundSecondary }]}><MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} /></Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.moodAnalytics}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {!isPremium ? (
          <View style={{ flex: 1, marginTop: 40 }}>
            <PremiumGate feature={t.fullAnalytics || 'Full Analytics'}>
              <View />
            </PremiumGate>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(400)} style={styles.summaryRow}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t.thirtyDayAvg}</Text>
                <Text style={styles.summaryValue}>{moods30d.length > 0 ? (moods30d.reduce((s, m) => s + m.value, 0) / moods30d.length).toFixed(1) : '-'}</Text>
              </LinearGradient>
              <LinearGradient colors={[colors.secondary, colors.secondaryDark]} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t.checkins}</Text>
                <Text style={styles.summaryValue}>{moods30d.length}</Text>
              </LinearGradient>
              <LinearGradient colors={[colors.accent, colors.accentDark]} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t.entries}</Text>
                <Text style={styles.summaryValue}>{journalEntries.length}</Text>
              </LinearGradient>
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>{renderCombinedChart()}</Animated.View>
            <Animated.View entering={FadeInDown.duration(400).delay(200)}>{renderPieChart()}</Animated.View>
            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{t.dayOfWeekPatterns}</Text>
                <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>{t.avgMoodByDay}</Text>
                <View style={styles.dowContainer}>
                  {dayPatterns.map((d, i) => {
                    const barH = d.avg > 0 ? (d.avg / 10) * 100 : 4;
                    const color = d.avg >= 7 ? colors.success : d.avg >= 5 ? colors.primary : d.avg > 0 ? colors.warning : colors.border;
                    return (
                      <View key={i} style={styles.dowItem}>
                        <Text style={[styles.dowValue, { color: colors.textSecondary }]}>{d.avg > 0 ? d.avg : '-'}</Text>
                        <View style={[styles.dowBarContainer, { backgroundColor: colors.borderLight }]}><View style={[styles.dowBar, { height: barH, backgroundColor: color }]} /></View>
                        <Text style={[styles.dowLabel, { color: colors.textTertiary }]}>{d.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
            {isPremium ? (
              <Animated.View entering={FadeInDown.duration(400).delay(400)}>
                  <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{t.tagMoodCorrelation}</Text>
                    <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>{t.howThemesRelate}</Text>
                    {tagCorrelations.map((item) => {
                      const bw = (item.avgMood / 10) * 100;
                      const color = item.avgMood >= 7 ? colors.success : item.avgMood >= 5 ? colors.primary : colors.warning;
                      return (
                        <View key={item.tag} style={styles.tagRow}>
                          <View style={styles.tagLabelContainer}><Text style={[styles.tagLabel, { color: colors.textPrimary }]}>{item.tag}</Text><Text style={[styles.tagCount, { color: colors.textTertiary }]}>{item.count}x</Text></View>
                          <View style={[styles.tagBarContainer, { backgroundColor: colors.borderLight }]}><View style={[styles.tagBar, { width: `${bw}%`, backgroundColor: color }]} /></View>
                          <Text style={[styles.tagAvg, { color }]}>{item.avgMood}</Text>
                        </View>
                      );
                    })}
                  </View>
                </Animated.View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: themeShared.radius.md, padding: 14, alignItems: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 26, fontWeight: '700', color: '#FFF', marginTop: 4 },
  chartCard: { borderRadius: themeShared.radius.lg, padding: 18, marginBottom: 14, ...themeShared.shadows.card },
  chartTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  chartSubtitle: { fontSize: 12, marginBottom: 12 },
  chartLegend: { flexDirection: 'row', gap: 20, marginTop: 8, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendColor: { width: 12, height: 12, borderRadius: 3 },
  legendLine: { width: 16, height: 3, borderRadius: 2 },
  legendText: { fontSize: 11 },
  pieContainer: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  pieLegend: { flex: 1, gap: 10 },
  pieLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pieLegendDot: { width: 10, height: 10, borderRadius: 5 },
  pieLegendLabel: { flex: 1, fontSize: 12 },
  pieLegendCount: { fontSize: 13, fontWeight: '700' },
  dowContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 4 },
  dowItem: { alignItems: 'center', flex: 1 },
  dowValue: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  dowBarContainer: { height: 100, width: 24, borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  dowBar: { width: '100%', borderRadius: 12, minHeight: 4 },
  dowLabel: { fontSize: 10, fontWeight: '600', marginTop: 6, textTransform: 'uppercase' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  tagLabelContainer: { width: 80, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagLabel: { fontSize: 12, fontWeight: '600', flex: 1 },
  tagCount: { fontSize: 10 },
  tagBarContainer: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  tagBar: { height: '100%', borderRadius: 5, minWidth: 4 },
  tagAvg: { width: 28, fontSize: 13, fontWeight: '700', textAlign: 'right' },
});
