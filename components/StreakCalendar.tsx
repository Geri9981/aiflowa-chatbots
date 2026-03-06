import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { themeShared } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';

const CELL_SIZE = 36;
const GAP = 4;

export default function StreakCalendar() {
  const { moodHistory, journalEntries, meditationSessions, language, colors, currentStreak, meditationStreak } = useApp();
  const t = getTranslation(language);

  const DAYS_SHORT = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun];

  const calendarData = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();

    // First day of month (0=Sun -> shift to Mon=0)
    let firstDayOfWeek = startOfMonth.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;

    const moodDates = new Set(moodHistory.map(m => m.date));
    const journalDates = new Set(journalEntries.map(j => j.date));
    const medDates = new Set(meditationSessions.map(s => s.date));

    const days: Array<{
      day: number;
      date: string;
      hasMood: boolean;
      hasJournal: boolean;
      hasMeditation: boolean;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    // Padding for first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: 0, date: '', hasMood: false, hasJournal: false, hasMeditation: false, isToday: false, isFuture: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(today.getFullYear(), today.getMonth(), d);
      const dateStr = dateObj.toISOString().split('T')[0];
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isFuture = dateObj > today;

      days.push({
        day: d,
        date: dateStr,
        hasMood: moodDates.has(dateStr),
        hasJournal: journalDates.has(dateStr),
        hasMeditation: medDates.has(dateStr),
        isToday,
        isFuture,
      });
    }

    return days;
  }, [moodHistory, journalEntries, meditationSessions]);

  const monthName = new Date().toLocaleDateString(language === 'en' ? 'en-US' : language, { month: 'long', year: 'numeric' });

  // Count completed days (at least one activity)
  const completedDays = calendarData.filter(d => d.day > 0 && (d.hasMood || d.hasJournal || d.hasMeditation)).length;
  const totalPastDays = calendarData.filter(d => d.day > 0 && !d.isFuture).length;

  // Week streak
  const currentWeekComplete = (() => {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // Mon=0
    let count = 0;
    for (let i = 0; i <= dayOfWeek; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek + i);
      const dateStr = d.toISOString().split('T')[0];
      const found = calendarData.find(cd => cd.date === dateStr);
      if (found && (found.hasMood || found.hasJournal || found.hasMeditation)) count++;
    }
    return count;
  })();

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(150)} style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t.streakCalendar || 'Activity Calendar'}</Text>
          <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{monthName}</Text>
        </View>
        <View style={styles.streakBadges}>
          <View style={[styles.streakBadge, { backgroundColor: '#F59E0B18' }]}>
            <MaterialIcons name="local-fire-department" size={14} color="#F59E0B" />
            <Text style={[styles.streakBadgeText, { color: '#F59E0B' }]}>{currentStreak}</Text>
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textTertiary }]}>{t.dailyCheckin || 'Mood'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.textTertiary }]}>{t.journal}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
          <Text style={[styles.legendText, { color: colors.textTertiary }]}>{t.meditation}</Text>
        </View>
      </View>

      {/* Day labels */}
      <View style={styles.dayLabels}>
        {DAYS_SHORT.map((d, i) => (
          <View key={i} style={styles.dayLabelCell}>
            <Text style={[styles.dayLabelText, { color: colors.textTertiary }]}>{d.slice(0, 2)}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {calendarData.map((item, index) => {
          if (item.day === 0) {
            return <View key={`empty-${index}`} style={styles.cell} />;
          }

          const activityCount = (item.hasMood ? 1 : 0) + (item.hasJournal ? 1 : 0) + (item.hasMeditation ? 1 : 0);
          const hasActivity = activityCount > 0;

          return (
            <View key={`day-${item.day}`} style={[
              styles.cell,
              item.isToday && [styles.todayCell, { borderColor: colors.primary }],
              item.isFuture && styles.futureCell,
            ]}>
              <Text style={[
                styles.dayNumber,
                { color: item.isFuture ? colors.textTertiary : hasActivity ? colors.textPrimary : colors.textSecondary },
                item.isToday && { color: colors.primary, fontWeight: '700' },
              ]}>{item.day}</Text>
              {!item.isFuture ? (
                <View style={styles.dotsRow}>
                  {item.hasMood ? <View style={[styles.activityDot, { backgroundColor: colors.primary }]} /> : <View style={styles.activityDot} />}
                  {item.hasJournal ? <View style={[styles.activityDot, { backgroundColor: colors.accent }]} /> : <View style={styles.activityDot} />}
                  {item.hasMeditation ? <View style={[styles.activityDot, { backgroundColor: colors.secondary }]} /> : <View style={styles.activityDot} />}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Monthly milestones */}
      <View style={[styles.milestones, { borderTopColor: colors.borderLight }]}>
        <View style={styles.milestone}>
          <Text style={[styles.milestoneValue, { color: colors.textPrimary }]}>{completedDays}/{totalPastDays}</Text>
          <Text style={[styles.milestoneLabel, { color: colors.textTertiary }]}>{t.activeDays || 'Active days'}</Text>
        </View>
        <View style={[styles.milestoneDivider, { backgroundColor: colors.borderLight }]} />
        <View style={styles.milestone}>
          <Text style={[styles.milestoneValue, { color: colors.textPrimary }]}>{currentWeekComplete}/7</Text>
          <Text style={[styles.milestoneLabel, { color: colors.textTertiary }]}>{t.thisWeek}</Text>
        </View>
        <View style={[styles.milestoneDivider, { backgroundColor: colors.borderLight }]} />
        <View style={styles.milestone}>
          <Text style={[styles.milestoneValue, { color: totalPastDays > 0 ? (completedDays / totalPastDays >= 0.7 ? '#38A169' : colors.textPrimary) : colors.textPrimary }]}>
            {totalPastDays > 0 ? Math.round((completedDays / totalPastDays) * 100) : 0}%
          </Text>
          <Text style={[styles.milestoneLabel, { color: colors.textTertiary }]}>{t.consistency || 'Consistency'}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: themeShared.radius.lg, padding: 16, marginHorizontal: 16, marginTop: 14, ...themeShared.shadows.card },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '700' },
  monthLabel: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  streakBadges: { flexDirection: 'row', gap: 6 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  streakBadgeText: { fontSize: 12, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: '500' },
  dayLabels: { flexDirection: 'row', marginBottom: 4 },
  dayLabelCell: { flex: 1, alignItems: 'center' },
  dayLabelText: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4, minHeight: 42 },
  todayCell: { borderWidth: 1.5, borderRadius: 10 },
  futureCell: { opacity: 0.35 },
  dayNumber: { fontSize: 12, fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 3 },
  activityDot: { width: 4, height: 4, borderRadius: 2 },
  milestones: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  milestone: { flex: 1, alignItems: 'center' },
  milestoneValue: { fontSize: 16, fontWeight: '700' },
  milestoneLabel: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  milestoneDivider: { width: 1, marginVertical: 2 },
});
