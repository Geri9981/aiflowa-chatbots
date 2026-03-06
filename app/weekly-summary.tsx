import React, { useRef, useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Dimensions, Share, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useAlert } from '@/template';
import { themeShared } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CHART_WIDTH = CARD_WIDTH - 48;
const CHART_HEIGHT = 120;

export default function WeeklySummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    moodHistory, currentStreak, meditationStreak, totalMeditationMinutes,
    totalJournalEntries, weeklyAvgMood, language, colors, userName, meditationSessions,
  } = useApp();
  const t = getTranslation(language);
  const { showAlert } = useAlert();
  const cardRef = useRef<any>(null);

  const weeklyData = useMemo(() => {
    const now = new Date();
    const last7 = moodHistory
      .filter(m => {
        const diff = (now.getTime() - new Date(m.date + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Wellness score (0-100): weighted combination
    const moodScore = weeklyAvgMood * 10; // 0-100
    const streakScore = Math.min(100, currentStreak * 10);
    const meditationScore = Math.min(100, meditationSessions.filter(s => {
      const diff = (now.getTime() - s.timestamp) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length * 20);
    const journalScore = Math.min(100, moodHistory.filter(m => {
      const diff = (now.getTime() - new Date(m.date + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length * 15);

    const wellnessScore = Math.round(moodScore * 0.4 + streakScore * 0.2 + meditationScore * 0.2 + journalScore * 0.2);

    return { moods: last7, wellnessScore: Math.min(100, wellnessScore) };
  }, [moodHistory, weeklyAvgMood, currentStreak, meditationSessions]);

  const handleShareImage = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Weekly Summary',
        });
      } else {
        await Share.share({ url: uri });
      }
    } catch (e) {
      showAlert('Error', 'Could not capture the summary card. Please try again.');
    }
  }, []);

  const handleSaveToGallery = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showAlert(t.error || 'Error', 'Gallery permission is required to save the image.');
        return;
      }

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      showAlert(t.success || 'Success', t.savedToGallery || 'Saved to your photo gallery!');
    } catch (e) {
      showAlert(t.error || 'Error', 'Could not save the image. Please try again.');
    }
  }, []);

  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'short' }).slice(0, 2));
    }
    return labels;
  }, [language]);

  const moodValues = useMemo(() => {
    const now = new Date();
    const values: (number | null)[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = moodHistory.find(m => m.date === dateStr);
      values.push(entry ? entry.value : null);
    }
    return values;
  }, [moodHistory]);

  const getWellnessEmoji = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '✨';
    if (score >= 40) return '💫';
    return '🌱';
  };

  const getWellnessLabel = (score: number) => {
    if (score >= 80) return t.excellent || 'Excellent';
    if (score >= 60) return t.good || 'Good';
    if (score >= 40) return t.fair || 'Fair';
    return t.growing || 'Growing';
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.weeklySummary || 'Weekly Summary'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.scrollContainer}>
        {/* Capturable card */}
        <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }} style={styles.cardWrapper}>
          <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCard}>
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>MindSpace</Text>
                <Text style={styles.cardSubtitle}>{t.weeklyMoodSummary || 'Weekly Mood Summary'}</Text>
              </View>
              <Text style={styles.cardDate}>
                {new Date().toLocaleDateString(language === 'en' ? 'en-US' : language, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>

            {/* Wellness score */}
            <View style={styles.wellnessRow}>
              <View style={styles.wellnessCircle}>
                <Text style={styles.wellnessEmoji}>{getWellnessEmoji(weeklyData.wellnessScore)}</Text>
                <Text style={styles.wellnessValue}>{weeklyData.wellnessScore}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.wellnessLabel}>{t.wellnessScore || 'Wellness Score'}</Text>
                <Text style={styles.wellnessDesc}>{getWellnessLabel(weeklyData.wellnessScore)}</Text>
              </View>
            </View>

            {/* Mini chart */}
            <View style={styles.chartSection}>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                {[2, 5, 8].map((val) => {
                  const y = 10 + (CHART_HEIGHT - 30) - (val / 10) * (CHART_HEIGHT - 30);
                  return (
                    <Line key={val} x1={0} y1={y} x2={CHART_WIDTH} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4,4" />
                  );
                })}
                {moodValues.map((val, i) => {
                  const barWidth = Math.min(28, CHART_WIDTH / 7 - 8);
                  const x = (i * CHART_WIDTH / 7) + (CHART_WIDTH / 14) - barWidth / 2;
                  if (val === null) {
                    return (
                      <React.Fragment key={i}>
                        <Rect x={x} y={CHART_HEIGHT - 30} width={barWidth} height={4} rx={2} fill="rgba(255,255,255,0.15)" />
                        <SvgText x={x + barWidth / 2} y={CHART_HEIGHT - 4} fontSize={9} fill="rgba(255,255,255,0.5)" textAnchor="middle">{dayLabels[i]}</SvgText>
                      </React.Fragment>
                    );
                  }
                  const barH = Math.max(8, (val / 10) * (CHART_HEIGHT - 30));
                  const y = 10 + (CHART_HEIGHT - 30) - barH;
                  return (
                    <React.Fragment key={i}>
                      <Rect x={x} y={y} width={barWidth} height={barH} rx={barWidth / 4} fill="rgba(255,255,255,0.55)" />
                      <SvgText x={x + barWidth / 2} y={y - 4} fontSize={10} fill="#FFF" textAnchor="middle" fontWeight="600">{val}</SvgText>
                      <SvgText x={x + barWidth / 2} y={CHART_HEIGHT - 4} fontSize={9} fill="rgba(255,255,255,0.5)" textAnchor="middle">{dayLabels[i]}</SvgText>
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialIcons name="mood" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statValue}>{weeklyAvgMood}</Text>
                <Text style={styles.statLabel}>{t.avgMood || 'Avg Mood'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="local-fire-department" size={16} color="#F6AD55" />
                <Text style={styles.statValue}>{currentStreak}</Text>
                <Text style={styles.statLabel}>{t.dayStreak || 'Day Streak'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="self-improvement" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statValue}>{meditationStreak}</Text>
                <Text style={styles.statLabel}>{t.medStreak || 'Med Streak'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="edit-note" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statValue}>{totalJournalEntries}</Text>
                <Text style={styles.statLabel}>{t.entries || 'Entries'}</Text>
              </View>
            </View>

            {/* Anonymous footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>mindspace.app</Text>
              <Text style={styles.footerDot}>•</Text>
              <Text style={styles.footerText}>{t.yourSafeSpace || 'Your safe space for mental wellness'}</Text>
            </View>
          </LinearGradient>
        </ViewShot>

        {/* Action buttons */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.actions}>
          <Pressable onPress={handleShareImage} style={({ pressed }) => [styles.actionBtn, styles.shareBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
            <LinearGradient colors={[colors.primary, colors.accent]} style={styles.actionGradient}>
              <MaterialIcons name="share" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>{t.shareToSocial || 'Share'}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={handleSaveToGallery} style={({ pressed }) => [styles.actionBtn, styles.saveBtn, { borderColor: colors.primary }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <MaterialIcons name="save-alt" size={20} color={colors.primary} />
            <Text style={[styles.saveBtnText, { color: colors.primary }]}>{t.saveToGallery || 'Save to Gallery'}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={[styles.privacyNote, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="visibility-off" size={14} color={colors.textTertiary} />
          <Text style={[styles.privacyText, { color: colors.textTertiary }]}>
            {t.summaryPrivacy || 'Your name and personal data are not included. Only anonymous wellness stats are shared.'}
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  scrollContainer: { flex: 1, alignItems: 'center', paddingTop: 16 },
  cardWrapper: { marginHorizontal: 24 },
  summaryCard: { width: CARD_WIDTH, borderRadius: themeShared.radius.xl, padding: 24, ...themeShared.shadows.elevated },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  cardSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  cardDate: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  wellnessRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  wellnessCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  wellnessEmoji: { fontSize: 18 },
  wellnessValue: { fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: -2 },
  wellnessLabel: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  wellnessDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  chartSection: { marginBottom: 16, alignItems: 'center' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  statLabel: { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  footerDot: { fontSize: 8, color: 'rgba(255,255,255,0.3)' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24, paddingHorizontal: 24 },
  actionBtn: { flex: 1, borderRadius: themeShared.radius.lg, overflow: 'hidden' },
  shareBtn: { ...themeShared.shadows.elevated },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: themeShared.radius.lg },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  saveBtn: { borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 20, marginHorizontal: 24, padding: 14, borderRadius: themeShared.radius.md },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
