import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Share, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { themeShared } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';
import { getSupabaseClient } from '@/template';
import { useAlert } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

type Period = '1week' | '1month' | '2months';

interface ReportStats {
  moodEntries: number;
  avgMood: string;
  moodTrend: string;
  journalEntries: number;
  meditationSessions: number;
  meditationMinutes: number;
  breathingSessions: number;
  period: string;
  startDate: string;
  endDate: string;
}

export default function HealthReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, colors, isPremium } = useApp();
  const t = getTranslation(language);
  const { showAlert } = useAlert();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1month');
  const [report, setReport] = useState<string | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const periods: { key: Period; label: string; icon: string }[] = [
    { key: '1week', label: t.oneWeek || '1 Week', icon: 'date-range' },
    { key: '1month', label: t.oneMonth || '1 Month', icon: 'calendar-month' },
    { key: '2months', label: t.twoMonths || '2 Months', icon: 'calendar-today' },
  ];

  const generateReport = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setReport(null);
    setStats(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('health-report', {
        body: { period: selectedPeriod, language },
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const textContent = await error.context?.text();
            errorMessage = textContent || error.message;
          } catch {}
        }
        console.error('Health report error:', errorMessage);
        showAlert(t.error || 'Error', t.reportGenerationFailed || 'Failed to generate report. Please try again.');
        return;
      }

      setReport(data.report);
      setStats(data.stats);
    } catch (e) {
      console.error('Health report exception:', e);
      showAlert(t.error || 'Error', t.reportGenerationFailed || 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, language]);

  const handleShare = useCallback(async () => {
    if (!report) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const cleanText = report
        .replace(/#{1,3}\s/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/---/g, '────────────');
      await Share.share({
        message: cleanText,
        title: t.healthReport || 'MindSpace Health Report',
      });
    } catch (e) {
      // Silently fail
    }
  }, [report, t]);

  // Convert markdown report to styled HTML for PDF
  const markdownToHtml = (md: string): string => {
    let html = md
      .replace(/### (.+)/g, '<h3 style="color:#1E3A5F;font-size:16px;margin:18px 0 8px 0;font-family:sans-serif;">$1</h3>')
      .replace(/## (.+)/g, '<h2 style="color:#1E3A5F;font-size:20px;margin:24px 0 10px 0;border-bottom:1px solid #E2E8F0;padding-bottom:6px;font-family:sans-serif;">$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;"/>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  const handleExportPDF = useCallback(async () => {
    if (!report) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPdfLoading(true);

    try {
      const reportHtml = markdownToHtml(report);
      const statsHtml = stats ? `
        <div style="display:flex;gap:16px;margin:16px 0;flex-wrap:wrap;">
          <div style="background:#F7FAFC;border-radius:8px;padding:12px 16px;flex:1;min-width:120px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#1E3A5F;">${stats.avgMood}</div>
            <div style="font-size:11px;color:#718096;margin-top:4px;">Avg Mood</div>
          </div>
          <div style="background:#F7FAFC;border-radius:8px;padding:12px 16px;flex:1;min-width:120px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#1E3A5F;text-transform:capitalize;">${stats.moodTrend}</div>
            <div style="font-size:11px;color:#718096;margin-top:4px;">Trend</div>
          </div>
          <div style="background:#F7FAFC;border-radius:8px;padding:12px 16px;flex:1;min-width:120px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#1E3A5F;">${stats.journalEntries}</div>
            <div style="font-size:11px;color:#718096;margin-top:4px;">Journal Entries</div>
          </div>
          <div style="background:#F7FAFC;border-radius:8px;padding:12px 16px;flex:1;min-width:120px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#1E3A5F;">${stats.meditationMinutes}m</div>
            <div style="font-size:11px;color:#718096;margin-top:4px;">Meditation</div>
          </div>
        </div>
      ` : '';

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #2D3748;
                line-height: 1.6;
                padding: 40px 32px;
                max-width: 800px;
                margin: 0 auto;
                font-size: 14px;
              }
              .header {
                text-align: center;
                margin-bottom: 32px;
                padding-bottom: 20px;
                border-bottom: 2px solid #1E3A5F;
              }
              .header h1 {
                color: #1E3A5F;
                font-size: 28px;
                margin: 0 0 4px 0;
              }
              .header .subtitle {
                color: #718096;
                font-size: 13px;
              }
              .period-info {
                background: #EBF8FF;
                border-radius: 8px;
                padding: 12px 16px;
                margin-bottom: 20px;
                font-size: 13px;
                color: #2B6CB0;
              }
              .content {
                font-size: 14px;
                line-height: 1.7;
              }
              .footer {
                margin-top: 40px;
                padding-top: 16px;
                border-top: 1px solid #E2E8F0;
                font-size: 11px;
                color: #A0AEC0;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>MindSpace Health Report</h1>
              <div class="subtitle">${stats ? `${stats.startDate} — ${stats.endDate} | ${stats.period}` : ''}</div>
            </div>
            ${stats ? `<div class="period-info">Period: ${stats.period} | Mood entries: ${stats.moodEntries} | Average mood: ${stats.avgMood}/10 | Trend: ${stats.moodTrend}</div>` : ''}
            ${statsHtml}
            <div class="content">
              ${reportHtml}
            </div>
            <div class="footer">
              Generated by MindSpace | ${new Date().toLocaleDateString()} | This is self-reported data, not a clinical assessment.
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: fullHtml,
        base64: false,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: t.healthReport || 'MindSpace Health Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        showAlert(t.healthReport || 'PDF', 'PDF saved but sharing is not available on this device.');
      }
    } catch (e) {
      console.error('PDF export error:', e);
      showAlert(t.error || 'Error', 'Failed to generate PDF. Please try sharing as text instead.');
    } finally {
      setPdfLoading(false);
    }
  }, [report, stats, t]);

  const trendIcon = stats?.moodTrend === 'improving' ? 'trending-up' : stats?.moodTrend === 'declining' ? 'trending-down' : 'trending-flat';
  const trendColor = stats?.moodTrend === 'improving' ? '#10B981' : stats?.moodTrend === 'declining' ? '#EF4444' : '#F59E0B';

  // Simple markdown-like renderer
  const renderReport = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <View key={i} style={{ height: 8 }} />;

      if (trimmed.startsWith('## ')) {
        return (
          <Text key={i} style={[styles.reportH2, { color: colors.textPrimary }]}>
            {trimmed.replace('## ', '').replace(/\*\*/g, '')}
          </Text>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <Text key={i} style={[styles.reportH3, { color: colors.textPrimary }]}>
            {trimmed.replace('### ', '').replace(/\*\*/g, '')}
          </Text>
        );
      }
      if (trimmed === '---' || trimmed === '***') {
        return <View key={i} style={[styles.reportDivider, { backgroundColor: colors.borderLight }]} />;
      }
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      return (
        <Text key={i} style={[styles.reportText, { color: colors.textSecondary }]}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <Text key={j} style={{ fontWeight: '700', color: colors.textPrimary }}>{part.slice(2, -2)}</Text>;
            }
            return part;
          })}
        </Text>
      );
    });
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.healthReport || 'Health Report'}</Text>
        {report ? (
          <Pressable onPress={handleShare} style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialIcons name="share" size={22} color={colors.textSecondary} />
          </Pressable>
        ) : <View style={{ width: 40 }} />}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.heroSection}>
          <LinearGradient colors={['#1E3A5F', '#2D5F8A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <View style={styles.heroIconBg}>
              <MaterialIcons name="medical-services" size={28} color="#FFF" />
            </View>
            <Text style={styles.heroTitle}>{t.healthReportTitle || 'Wellness Health Report'}</Text>
            <Text style={styles.heroDesc}>
              {t.healthReportDesc || 'Generate a structured report of your mental health data to share with your doctor or therapist.'}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Period Selection */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.selectPeriod || 'Select Period'}</Text>
          <View style={styles.periodRow}>
            {periods.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => { Haptics.selectionAsync(); setSelectedPeriod(p.key); }}
                style={[
                  styles.periodCard,
                  { backgroundColor: colors.surface },
                  selectedPeriod === p.key && { backgroundColor: colors.primary + '15', borderColor: colors.primary, borderWidth: 1.5 },
                ]}
              >
                <MaterialIcons name={p.icon as any} size={22} color={selectedPeriod === p.key ? colors.primary : colors.textTertiary} />
                <Text style={[styles.periodLabel, { color: selectedPeriod === p.key ? colors.primary : colors.textSecondary }]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Generate Button */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Pressable
            onPress={generateReport}
            disabled={loading}
            style={({ pressed }) => [
              styles.generateBtn,
              pressed && !loading && { transform: [{ scale: 0.97 }] },
              loading && { opacity: 0.7 },
            ]}
          >
            <LinearGradient colors={[colors.primary, '#2D5F8A']} style={styles.generateGradient}>
              {loading ? (
                <>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.generateText}>{t.generatingReport || 'Generating Report...'}</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="auto-awesome" size={20} color="#FFF" />
                  <Text style={styles.generateText}>{t.generateReport || 'Generate Report with AI'}</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
          <Text style={[styles.generateHint, { color: colors.textTertiary }]}>
            {t.reportPoweredBy || 'Powered by OnSpace AI — your data stays private'}
          </Text>
        </Animated.View>

        {/* Stats Summary */}
        {stats ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.dataSummary || 'Data Summary'}</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="mood" size={18} color="#F59E0B" />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.avgMood}</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t.avgMood || 'Avg Mood'}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name={trendIcon as any} size={18} color={trendColor} />
                <Text style={[styles.statValue, { color: colors.textPrimary, textTransform: 'capitalize' }]}>{stats.moodTrend}</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t.trend || 'Trend'}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="edit-note" size={18} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.journalEntries}</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t.entries || 'Entries'}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="self-improvement" size={18} color="#8B5CF6" />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.meditationMinutes}m</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t.meditation || 'Meditation'}</Text>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* Report Content */}
        {report ? (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0, paddingHorizontal: 0 }]}>{t.report || 'Report'}</Text>
              <View style={[styles.aiBadge, { backgroundColor: '#8B5CF618' }]}>
                <MaterialIcons name="auto-awesome" size={12} color="#8B5CF6" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#8B5CF6' }}>AI</Text>
              </View>
            </View>
            <View style={[styles.reportCard, { backgroundColor: colors.surface }]}>
              {renderReport(report)}
            </View>

            {/* Export / Share actions */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleExportPDF}
                disabled={pdfLoading}
                style={({ pressed }) => [styles.pdfBtn, { backgroundColor: '#EF4444' }, pressed && { transform: [{ scale: 0.97 }] }, pdfLoading && { opacity: 0.7 }]}
              >
                {pdfLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <MaterialIcons name="picture-as-pdf" size={18} color="#FFF" />
                )}
                <Text style={styles.pdfBtnText}>{pdfLoading ? 'Exporting...' : 'Export PDF'}</Text>
              </Pressable>
              <Pressable onPress={handleShare} style={[styles.shareBtn, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="share" size={18} color="#FFF" />
                <Text style={styles.shareBtnText}>{t.shareWithDoctor || 'Share'}</Text>
              </Pressable>
              <Pressable onPress={generateReport} style={[styles.regenerateBtn, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialIcons name="refresh" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Email hint */}
            <View style={[styles.emailHint, { backgroundColor: colors.backgroundSecondary }]}>
              <MaterialIcons name="email" size={14} color={colors.textTertiary} />
              <Text style={[styles.emailHintText, { color: colors.textTertiary }]}>
                {t.pdfEmailHint || 'Export as PDF and send directly to your doctor via email or messaging app.'}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Disclaimer */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={[styles.disclaimer, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="info-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
            {t.reportDisclaimer || 'This report is based on self-reported data from MindSpace. It is not a clinical assessment or diagnosis. Always consult a healthcare professional for medical advice.'}
          </Text>
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
  heroSection: { paddingHorizontal: 16, marginTop: 8 },
  heroCard: { borderRadius: themeShared.radius.xl, padding: 24, alignItems: 'center' },
  heroIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12 },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  periodCard: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: themeShared.radius.lg, gap: 8, borderWidth: 1.5, borderColor: 'transparent', ...themeShared.shadows.card },
  periodLabel: { fontSize: 13, fontWeight: '600' },
  generateBtn: { borderRadius: 16, overflow: 'hidden', ...themeShared.shadows.elevated },
  generateGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16 },
  generateText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  generateHint: { fontSize: 11, textAlign: 'center', marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  statCard: { width: '47%', borderRadius: themeShared.radius.md, padding: 14, alignItems: 'center', gap: 4, ...themeShared.shadows.card },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  reportCard: { marginHorizontal: 16, borderRadius: themeShared.radius.lg, padding: 20, ...themeShared.shadows.card },
  reportH2: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  reportH3: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  reportText: { fontSize: 14, lineHeight: 22, marginBottom: 4 },
  reportDivider: { height: 1, marginVertical: 12 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 10 },
  pdfBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  pdfBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  regenerateBtn: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emailHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: themeShared.radius.md },
  emailHintText: { flex: 1, fontSize: 12, lineHeight: 17 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginTop: 24, padding: 14, borderRadius: themeShared.radius.md },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
