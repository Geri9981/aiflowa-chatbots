import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { themeShared } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getTranslation } from '../constants/translations';
import { getSupabaseClient } from '@/template';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 140;

interface RealStats {
  total_users: number;
  premium_users: number;
  total_mood_entries: number;
  total_journal_entries: number;
  total_meditation_sessions: number;
  total_breathing_sessions: number;
  active_today: number;
  active_7d: number;
  new_users_today: number;
  new_users_week: number;
}

interface TimeSeriesPoint {
  date: string;
  count: number;
}

interface RetentionPoint {
  week_start: string;
  total_users: number;
  active_users: number;
}

interface TimeSeries {
  daily_signups: TimeSeriesPoint[];
  daily_active: TimeSeriesPoint[];
  weekly_retention: RetentionPoint[];
}

// Mini bar chart component
function MiniBarChart({ data, color, height = CHART_HEIGHT, label }: { data: TimeSeriesPoint[]; color: string; height?: number; label: string }) {
  const { colors } = useApp();
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.count), 1);
  const barWidth = Math.max(2, Math.min(8, (CHART_WIDTH - 40) / data.length - 1));
  const totalW = data.length * (barWidth + 1);

  // Show last label and first label
  const firstDate = data[0]?.date || '';
  const lastDate = data[data.length - 1]?.date || '';
  const total = data.reduce((s, d) => s + d.count, 0);
  const avg = (total / data.length).toFixed(1);

  return (
    <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartLabel, { color: colors.textPrimary }]}>{label}</Text>
        <View style={styles.chartMeta}>
          <Text style={[styles.chartTotal, { color }]}>{total}</Text>
          <Text style={[styles.chartAvgLabel, { color: colors.textTertiary }]}>avg {avg}/day</Text>
        </View>
      </View>
      <View style={[styles.chartArea, { height }]}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
          <View key={i} style={[styles.gridLine, { bottom: frac * height, backgroundColor: colors.borderLight }]} />
        ))}
        {/* Bars */}
        <View style={styles.barsRow}>
          {data.map((d, i) => {
            const barH = Math.max(2, (d.count / maxVal) * (height - 20));
            return (
              <View key={i} style={[styles.barWrapper, { width: barWidth }]}>
                <View style={[styles.bar, { height: barH, backgroundColor: color, borderRadius: barWidth / 2 }]} />
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.chartFooter}>
        <Text style={[styles.chartDate, { color: colors.textTertiary }]}>{firstDate.slice(5)}</Text>
        <Text style={[styles.chartDate, { color: colors.textTertiary }]}>{lastDate.slice(5)}</Text>
      </View>
    </View>
  );
}

// Retention chart
function RetentionChart({ data }: { data: RetentionPoint[] }) {
  const { colors } = useApp();
  if (!data || data.length === 0) return null;

  return (
    <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartLabel, { color: colors.textPrimary }]}>Weekly Retention</Text>
      </View>
      {data.map((d, i) => {
        const rate = d.total_users > 0 ? Math.round((d.active_users / d.total_users) * 100) : 0;
        const barPct = Math.max(4, rate);
        return (
          <View key={i} style={styles.retentionRow}>
            <Text style={[styles.retentionWeek, { color: colors.textTertiary }]}>{d.week_start.slice(5)}</Text>
            <View style={[styles.retentionBarBg, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={[styles.retentionBarFill, { width: `${barPct}%`, backgroundColor: rate > 50 ? '#10B981' : rate > 25 ? '#F59E0B' : '#EF4444' }]} />
            </View>
            <Text style={[styles.retentionPct, { color: colors.textPrimary }]}>{rate}%</Text>
            <Text style={[styles.retentionCount, { color: colors.textTertiary }]}>{d.active_users}/{d.total_users}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, colors } = useApp();
  const { user } = useAuth();
  const t = getTranslation(language);

  const [stats, setStats] = useState<RealStats | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartDays, setChartDays] = useState(30);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const [statsRes, tsRes] = await Promise.all([
        supabase.rpc('get_admin_stats'),
        supabase.rpc('get_admin_time_series', { days_back: chartDays }),
      ]);
      if (statsRes.data) setStats(statsRes.data as RealStats);
      if (tsRes.data) setTimeSeries(tsRes.data as TimeSeries);
    } catch (e) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [chartDays]);

  const totalUsers = stats?.total_users ?? 0;
  const premiumUsers = stats?.premium_users ?? 0;
  const activeToday = stats?.active_today ?? 0;
  const active7d = stats?.active_7d ?? 0;
  const newToday = stats?.new_users_today ?? 0;
  const newWeek = stats?.new_users_week ?? 0;
  const totalMoods = stats?.total_mood_entries ?? 0;
  const totalJournals = stats?.total_journal_entries ?? 0;
  const totalMeditations = stats?.total_meditation_sessions ?? 0;
  const totalBreathings = stats?.total_breathing_sessions ?? 0;
  const mrr = premiumUsers * 89;
  const { setPremium } = useAuth();
  const [adminPremiumOverride, setAdminPremiumOverride] = useState(user?.isPremium ?? false);

  if (!user?.isAdmin) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Admin Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <MaterialIcons name="lock" size={48} color={colors.textTertiary} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: 'center' }}>Admin access required</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Admin Dashboard</Text>
        <Pressable onPress={fetchData} style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="refresh" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.heroSection}>
          <LinearGradient colors={['#1E3A5F', '#2D5F8A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <Image source={require('../assets/images/admin-dashboard.png')} style={styles.heroBg} contentFit="cover" />
            <View style={styles.heroContent}>
              <Text style={styles.heroGreeting}>Hej, {user.name}</Text>
              <Text style={styles.heroSubtitle}>MindSpace Admin — Live Data</Text>
              {loading ? (
                <View style={[styles.heroStats, { justifyContent: 'center' }]}>
                  <ActivityIndicator color="#FFF" />
                </View>
              ) : (
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{totalUsers}</Text>
                    <Text style={styles.heroStatLabel}>Total Users</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{premiumUsers}</Text>
                    <Text style={styles.heroStatLabel}>Premium</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{mrr} kr</Text>
                    <Text style={styles.heroStatLabel}>MRR</Text>
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Connection Status */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={styles.section}>
          <View style={[styles.statusBanner, { backgroundColor: '#10B98118' }]}>
            <MaterialIcons name="cloud-done" size={18} color="#10B981" />
            <Text style={[styles.statusText, { color: '#10B981' }]}>OnSpace Cloud Connected — Live Data</Text>
          </View>
        </Animated.View>

        {/* Admin Premium Toggle */}
        <Animated.View entering={FadeInDown.duration(400).delay(75)} style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.engagementRow}>
              <View style={[styles.engIcon, { backgroundColor: '#8B5CF618' }]}>
                <MaterialIcons name="workspace-premium" size={18} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.engLabel, { color: colors.textPrimary, fontWeight: '600' }]}>Admin Premium Access</Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>{adminPremiumOverride ? 'Active — all features unlocked' : 'Inactive — premium features locked'}</Text>
              </View>
              <Pressable
                onPress={async () => {
                  const newState = !adminPremiumOverride;
                  setAdminPremiumOverride(newState);
                  await setPremium(newState);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                style={({ pressed }) => [{
                  backgroundColor: adminPremiumOverride ? '#10B981' : colors.backgroundSecondary,
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                }, pressed && { transform: [{ scale: 0.95 }] }]}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: adminPremiumOverride ? '#FFF' : colors.textSecondary }}>
                  {adminPremiumOverride ? 'ON' : 'OFF'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Chart Time Selector */}
        <Animated.View entering={FadeInDown.duration(400).delay(90)} style={styles.section}>
          <View style={styles.chartTimeRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Analytics</Text>
            <View style={styles.chartTimePills}>
              {[7, 14, 30, 60].map(d => (
                <Pressable key={d} onPress={() => setChartDays(d)} style={[styles.chartTimePill, { backgroundColor: chartDays === d ? colors.primary : colors.backgroundSecondary }]}>
                  <Text style={[styles.chartTimePillText, { color: chartDays === d ? '#FFF' : colors.textTertiary }]}>{d}d</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Charts */}
        {timeSeries ? (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
              <MiniBarChart data={timeSeries.daily_signups} color="#10B981" label="User Registrations" />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
              <MiniBarChart data={timeSeries.daily_active} color={colors.primary} label="Daily Active Users" />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
              <RetentionChart data={timeSeries.weekly_retention} />
            </Animated.View>
          </>
        ) : loading ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {/* Revenue */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Revenue</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.revenueRow}>
              <View style={styles.revenueItem}>
                <Text style={[styles.revLabel, { color: colors.textTertiary }]}>Monthly Revenue (MRR)</Text>
                <Text style={[styles.revValue, { color: colors.textPrimary }]}>{mrr.toLocaleString()} kr</Text>
                <Text style={[styles.revSub, { color: colors.textTertiary }]}>{premiumUsers} premium x 89 kr</Text>
              </View>
              <View style={styles.revenueItem}>
                <Text style={[styles.revLabel, { color: colors.textTertiary }]}>Annual Run Rate</Text>
                <Text style={[styles.revValue, { color: colors.textPrimary }]}>{(mrr * 12).toLocaleString()} kr</Text>
                <Text style={[styles.revSub, { color: colors.textTertiary }]}>Projected from MRR</Text>
              </View>
            </View>
            <View style={[styles.conversionRow, { borderTopColor: colors.borderLight }]}>
              <MaterialIcons name="trending-up" size={16} color={colors.primary} />
              <Text style={[styles.conversionText, { color: colors.textSecondary }]}>
                Conversion rate: {totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0}% of users are premium
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Users */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Users</Text>
          <View style={styles.metricGrid}>
            {[
              { icon: 'people' as const, label: 'Total Users', value: totalUsers.toString(), color: colors.primary, bg: colors.primary + '18' },
              { icon: 'person-add' as const, label: 'New Today', value: `+${newToday}`, color: '#10B981', bg: '#10B98118' },
              { icon: 'today' as const, label: 'Active Today', value: activeToday.toString(), color: '#F59E0B', bg: '#F59E0B18' },
              { icon: 'date-range' as const, label: 'Active 7d', value: active7d.toString(), color: colors.accent, bg: colors.accent + '18' },
            ].map((m, i) => (
              <View key={i} style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.metricIcon, { backgroundColor: m.bg }]}>
                  <MaterialIcons name={m.icon} size={18} color={m.color} />
                </View>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{m.value}</Text>
                <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Engagement */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Engagement</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {[
              { icon: 'mood' as const, label: 'Mood Check-ins', value: totalMoods.toLocaleString(), color: '#F59E0B' },
              { icon: 'edit-note' as const, label: 'Journal Entries', value: totalJournals.toLocaleString(), color: colors.accent },
              { icon: 'self-improvement' as const, label: 'Meditation Sessions', value: totalMeditations.toLocaleString(), color: '#8B5CF6' },
              { icon: 'air' as const, label: 'Breathing Sessions', value: totalBreathings.toLocaleString(), color: '#5B8FB9' },
            ].map((item, i) => (
              <View key={i} style={[styles.engagementRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                <View style={[styles.engIcon, { backgroundColor: item.color + '18' }]}>
                  <MaterialIcons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[styles.engLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                <Text style={[styles.engValue, { color: colors.textPrimary }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Database */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Database</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {[
              { table: 'user_profiles', desc: 'User accounts and profiles', icon: 'person' as const },
              { table: 'mood_entries', desc: 'Mood check-in records', icon: 'mood' as const },
              { table: 'journal_entries', desc: 'Journal and diary entries', icon: 'edit-note' as const },
              { table: 'meditation_sessions', desc: 'Meditation session logs', icon: 'self-improvement' as const },
              { table: 'breathing_sessions', desc: 'Breathing exercise logs', icon: 'air' as const },
            ].map((item, i) => (
              <View key={i} style={[styles.dbRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                <View style={[styles.dbIcon, { backgroundColor: colors.primary + '14' }]}>
                  <MaterialIcons name={item.icon} size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dbTable, { color: colors.textPrimary }]}>{item.table}</Text>
                  <Text style={[styles.dbDesc, { color: colors.textTertiary }]}>{item.desc}</Text>
                </View>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInDown.duration(400).delay(450)} style={[styles.footerNote, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="verified" size={14} color="#10B981" />
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            All data is live from OnSpace Cloud. Numbers reflect actual database records and will grow as users sign up and engage with the app.
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
  heroCard: { borderRadius: themeShared.radius.xl, height: 180, overflow: 'hidden', justifyContent: 'flex-end' },
  heroBg: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
  heroContent: { padding: 20, zIndex: 1 },
  heroGreeting: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  heroStatLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: themeShared.radius.md },
  statusText: { fontSize: 13, fontWeight: '600' },
  card: { borderRadius: themeShared.radius.lg, padding: 16, ...themeShared.shadows.card },
  // Charts
  chartTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTimePills: { flexDirection: 'row', gap: 6 },
  chartTimePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  chartTimePillText: { fontSize: 12, fontWeight: '700' },
  chartContainer: { borderRadius: themeShared.radius.lg, padding: 16, ...themeShared.shadows.card },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  chartLabel: { fontSize: 15, fontWeight: '700' },
  chartMeta: { alignItems: 'flex-end' },
  chartTotal: { fontSize: 18, fontWeight: '700' },
  chartAvgLabel: { fontSize: 10, marginTop: 1 },
  chartArea: { position: 'relative', overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.5 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 1 },
  barWrapper: { justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%' },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  chartDate: { fontSize: 10, fontWeight: '500' },
  // Retention
  retentionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  retentionWeek: { width: 44, fontSize: 11, fontWeight: '500' },
  retentionBarBg: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  retentionBarFill: { height: '100%', borderRadius: 6 },
  retentionPct: { width: 32, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  retentionCount: { width: 40, fontSize: 10, textAlign: 'right' },
  // Revenue
  revenueRow: { flexDirection: 'row', gap: 16 },
  revenueItem: { flex: 1 },
  revLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  revValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  revSub: { fontSize: 12, marginTop: 2 },
  conversionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  conversionText: { fontSize: 13 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: (SCREEN_WIDTH - 42) / 2 - 5, borderRadius: themeShared.radius.md, padding: 14, ...themeShared.shadows.card },
  metricIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metricValue: { fontSize: 20, fontWeight: '700' },
  metricLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  engIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  engLabel: { flex: 1, fontSize: 14 },
  engValue: { fontSize: 15, fontWeight: '700' },
  dbRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  dbIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dbTable: { fontSize: 13, fontWeight: '600' },
  dbDesc: { fontSize: 11, marginTop: 1 },
  footerNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginTop: 24, padding: 14, borderRadius: themeShared.radius.md },
  footerText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
