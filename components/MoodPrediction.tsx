import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { themeShared } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';

const DAYS_AHEAD = 7;

export default function MoodPrediction() {
  const { moodHistory, diagnosis, wellnessGoals, language, colors, meditationSessions, journalEntries } = useApp();
  const t = getTranslation(language);

  const prediction = useMemo(() => {
    if (moodHistory.length < 5) {
      return null; // Not enough data
    }

    // Analyze patterns
    const last14 = moodHistory
      .filter(m => {
        const diff = (Date.now() - new Date(m.date + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 14;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const last7 = last14.filter(m => {
      const diff = (Date.now() - new Date(m.date + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });

    const avgLast7 = last7.length > 0 ? last7.reduce((s, m) => s + m.value, 0) / last7.length : 5;
    const avgLast14 = last14.length > 0 ? last14.reduce((s, m) => s + m.value, 0) / last14.length : 5;

    // Determine trend
    const trend = avgLast7 - avgLast14;
    const isTrendingUp = trend > 0.3;
    const isTrendingDown = trend < -0.3;

    // Day-of-week analysis
    const dayAvgs: Record<number, number[]> = {};
    moodHistory.forEach(m => {
      const day = new Date(m.date + 'T12:00:00').getDay();
      if (!dayAvgs[day]) dayAvgs[day] = [];
      dayAvgs[day].push(m.value);
    });

    // Predict next 7 days
    const predictedDays: Array<{ day: string; predicted: number; confidence: number }> = [];
    const today = new Date();
    const dayLabels = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

    for (let i = 1; i <= DAYS_AHEAD; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);
      const dayOfWeek = futureDate.getDay();
      const dayData = dayAvgs[dayOfWeek] || [];
      const dayAvg = dayData.length > 0 ? dayData.reduce((s, v) => s + v, 0) / dayData.length : avgLast7;

      // Weighted prediction: 60% recent trend, 30% day-of-week pattern, 10% overall
      const basePrediction = avgLast7 * 0.6 + dayAvg * 0.3 + avgLast14 * 0.1;
      const trendAdjustment = trend * 0.2 * i;
      const predicted = Math.max(1, Math.min(10, Math.round((basePrediction + trendAdjustment) * 10) / 10));
      const confidence = Math.max(40, Math.min(85, 60 + (last14.length * 2) - (i * 3)));

      predictedDays.push({
        day: dayLabels[dayOfWeek],
        predicted,
        confidence,
      });
    }

    const avgPredicted = predictedDays.reduce((s, d) => s + d.predicted, 0) / predictedDays.length;

    // Generate tips based on diagnosis and goals
    const tips: string[] = [];

    if (isTrendingDown) {
      tips.push(t.tipTrendingDown || 'Your mood has been dipping recently. Try to prioritize rest and self-care this week.');
    } else if (isTrendingUp) {
      tips.push(t.tipTrendingUp || 'Great momentum! Keep doing what is working — your mood has been steadily improving.');
    } else {
      tips.push(t.tipStable || 'Your mood has been stable. Small positive actions can help push it higher.');
    }

    // Meditation impact
    const recentMed = meditationSessions.filter(s => {
      const diff = (Date.now() - s.timestamp) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });
    if (recentMed.length >= 3) {
      tips.push(t.tipMeditationHelping || 'Your meditation practice seems to correlate with better mood days. Keep it up!');
    } else if (recentMed.length === 0) {
      tips.push(t.tipTryMeditation || 'Consider adding meditation to your routine — even 5 minutes can make a difference.');
    }

    // Journal impact
    const recentJournal = journalEntries.filter(j => {
      const diff = (Date.now() - j.timestamp) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });
    if (recentJournal.length >= 2) {
      tips.push(t.tipJournalingHelping || 'Regular journaling is helping you process emotions. Keep writing!');
    }

    // Diagnosis-specific tips
    if (diagnosis.includes('anxiety')) {
      tips.push(t.tipAnxiety || 'For anxiety: Try the Box Breathing exercise when you feel tension building.');
    }
    if (diagnosis.includes('insomnia')) {
      tips.push(t.tipInsomnia || 'For better sleep: Avoid screens 1 hour before bed and try a calming meditation.');
    }
    if (diagnosis.includes('depression')) {
      tips.push(t.tipDepression || 'Small wins matter. Set one tiny goal for today and celebrate completing it.');
    }

    // Goal-specific tips
    if (wellnessGoals.includes('stress')) {
      tips.push(t.tipStress || 'To manage stress: Schedule short breaks throughout your day, even 5 minutes of fresh air helps.');
    }
    if (wellnessGoals.includes('mindfulness')) {
      tips.push(t.tipMindfulness || 'Mindfulness practice: Try to eat one meal today without any screens or distractions.');
    }

    return {
      predictedDays,
      avgPredicted: Math.round(avgPredicted * 10) / 10,
      trend: isTrendingUp ? 'up' as const : isTrendingDown ? 'down' as const : 'stable' as const,
      tips: tips.slice(0, 3), // Max 3 tips
      currentAvg: Math.round(avgLast7 * 10) / 10,
    };
  }, [moodHistory, diagnosis, wellnessGoals, meditationSessions, journalEntries, t]);

  if (!prediction) {
    return (
      <Animated.View entering={FadeInDown.duration(500)} style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.emptyState}>
          <MaterialIcons name="insights" size={32} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t.needMoreData || 'Need More Data'}</Text>
          <Text style={[styles.emptyDesc, { color: colors.textTertiary }]}>{t.needMoreDataDesc || 'Log at least 5 mood check-ins to unlock AI mood predictions.'}</Text>
        </View>
      </Animated.View>
    );
  }

  const trendIcon = prediction.trend === 'up' ? 'trending-up' : prediction.trend === 'down' ? 'trending-down' : 'trending-flat';
  const trendColor = prediction.trend === 'up' ? colors.success : prediction.trend === 'down' ? colors.warning : colors.primary;
  const trendLabel = prediction.trend === 'up' ? (t.improving || 'Improving') : prediction.trend === 'down' ? (t.needsAttention || 'Needs attention') : (t.stable || 'Stable');

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.accent + '14' }]}>
          <MaterialIcons name="insights" size={20} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t.moodPrediction || 'Mood Prediction'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.nextWeekForecast || 'Next 7-day forecast'}</Text>
        </View>
        <View style={[styles.trendBadge, { backgroundColor: trendColor + '18' }]}>
          <MaterialIcons name={trendIcon as any} size={14} color={trendColor} />
          <Text style={[styles.trendBadgeText, { color: trendColor }]}>{trendLabel}</Text>
        </View>
      </View>

      {/* Prediction bars */}
      <View style={styles.predictionBars}>
        {prediction.predictedDays.map((day, i) => {
          const barHeight = Math.max(12, (day.predicted / 10) * 80);
          const barColor = day.predicted >= 7 ? colors.success : day.predicted >= 5 ? colors.primary : colors.warning;
          return (
            <View key={i} style={styles.predictionBar}>
              <Text style={[styles.predictionValue, { color: colors.textSecondary }]}>{day.predicted}</Text>
              <View style={[styles.barContainer, { backgroundColor: colors.borderLight }]}>
                <View style={[styles.bar, { height: barHeight, backgroundColor: barColor + '70' }]} />
              </View>
              <Text style={[styles.predictionDay, { color: colors.textTertiary }]}>{day.day.slice(0, 2)}</Text>
            </View>
          );
        })}
      </View>

      {/* Predicted average */}
      <View style={[styles.predictedAvgRow, { borderTopColor: colors.borderLight }]}>
        <View style={styles.predictedAvgItem}>
          <Text style={[styles.predictedAvgLabel, { color: colors.textTertiary }]}>{t.currentAvg || 'Current avg'}</Text>
          <Text style={[styles.predictedAvgValue, { color: colors.textPrimary }]}>{prediction.currentAvg}</Text>
        </View>
        <MaterialIcons name="arrow-forward" size={16} color={colors.textTertiary} />
        <View style={styles.predictedAvgItem}>
          <Text style={[styles.predictedAvgLabel, { color: colors.textTertiary }]}>{t.predicted || 'Predicted'}</Text>
          <Text style={[styles.predictedAvgValue, { color: trendColor }]}>{prediction.avgPredicted}</Text>
        </View>
      </View>

      {/* Personalized tips */}
      {prediction.tips.length > 0 ? (
        <View style={[styles.tipsSection, { borderTopColor: colors.borderLight }]}>
          <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>{t.personalizedTips || 'Personalized Tips'}</Text>
          {prediction.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <MaterialIcons name="lightbulb" size={14} color={colors.accent} style={{ marginTop: 2 }} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: themeShared.radius.lg, padding: 18, ...themeShared.shadows.card },
  emptyState: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  headerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 11, marginTop: 1 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  trendBadgeText: { fontSize: 11, fontWeight: '600' },
  predictionBars: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  predictionBar: { alignItems: 'center', flex: 1 },
  predictionValue: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  barContainer: { width: 20, height: 80, borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 10, minHeight: 8 },
  predictionDay: { fontSize: 9, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
  predictedAvgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 12, borderTopWidth: 1 },
  predictedAvgItem: { alignItems: 'center' },
  predictedAvgLabel: { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  predictedAvgValue: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  tipsSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  tipsTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
