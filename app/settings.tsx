import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, TextInput, Switch, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { LinearGradient } from 'expo-linear-gradient';
import { themeShared } from '../constants/theme';
import { scheduleAllNotifications, requestNotificationPermissions } from '../services/notifications';
import { APP_CONFIG } from '../constants/config';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getTranslation } from '../constants/translations';

const REMINDER_TIMES = ['07:00', '08:00', '09:00', '10:00', '12:00', '18:00', '20:00', '21:00'];
const QUOTE_TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '18:00', '20:00'];
const QUOTE_INTERVALS = ['off', 'daily', 'twice', 'every3'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    language, setLanguage, userName, setUserName, colors, isDarkMode, toggleDarkMode,
    diagnosis, setDiagnosis, wellnessGoals, country,
    reminderTime, setReminderTime, quoteInterval, setQuoteInterval,
    quoteTime, setQuoteTime,
    notificationsEnabled, setNotificationsEnabled,
    notificationHistory,
  } = useApp();
  const { user, logout } = useAuth();
  const t = getTranslation(language);
  const { showAlert } = useAlert();

  const countryObj = APP_CONFIG.countries.find(c => c.code === country) || APP_CONFIG.countries[0];
  const isPrem = user?.isPremium || user?.isAdmin;
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [showQuoteTimePicker, setShowQuoteTimePicker] = useState(false);

  const currentLang = APP_CONFIG.languages.find(l => l.code === language) || APP_CONFIG.languages[0];

  const handleSaveName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUserName(nameInput.trim());
    setEditingName(false);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        showAlert(t.reminders || 'Notifications', 'Please enable notifications in your device settings.');
        return;
      }
    }
    setNotificationsEnabled(enabled);
  };

  const handleClearData = () => {
    showAlert(t.clearAllData, t.clearDataConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.clear, style: 'destructive', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) },
    ]);
  };

 const handleLogout = async () => {
  console.log("HANDLE LOGOUT RUNNING");

  await logout();

  console.log("LOGOUT FINISHED");

  router.replace("/login");
};

  const quoteIntervalLabel = (val: string) => {
    const labels: Record<string, string> = { off: 'Off', daily: t.daily || 'Daily', twice: '2x/day', every3: 'Every 3 days' };
    return labels[val] || val;
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.settings}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t.profile}</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/profile'); }} style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '14' }]}><MaterialIcons name="account-circle" size={20} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={[styles.settingLabel, { color: colors.textPrimary }]}>View Profile</Text><Text style={[styles.settingValue, { color: colors.textSecondary }]}>Avatar, wellness score, journey</Text></View>
              <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
            </Pressable>
            <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '14' }]}><MaterialIcons name="person" size={20} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.name}</Text>
                {editingName ? (
                  <View style={styles.nameEditRow}>
                    <TextInput style={[styles.nameInput, { color: colors.textPrimary, backgroundColor: colors.background, borderColor: colors.primary }]} value={nameInput} onChangeText={setNameInput} placeholder={t.name} placeholderTextColor={colors.textTertiary} autoFocus />
                    <Pressable onPress={handleSaveName} style={[styles.nameSaveButton, { backgroundColor: colors.primary }]}><MaterialIcons name="check" size={18} color="#FFF" /></Pressable>
                  </View>
                ) : <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{userName || user?.name || t.notSet}</Text>}
              </View>
              {!editingName && <Pressable onPress={() => { setNameInput(userName); setEditingName(true); }}><MaterialIcons name="edit" size={18} color={colors.textTertiary} /></Pressable>}
            </View>
            {user ? (
              <>
                <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
                <View style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '14' }]}><MaterialIcons name="mail-outline" size={20} color={colors.secondary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Email</Text>
                    <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{user.email}</Text>
                  </View>
                </View>
              </>
            ) : null}
            {diagnosis.length > 0 ? (
              <>
                <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
                <View style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.accent + '14' }]}><MaterialIcons name="psychology" size={20} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.diagnosisTitle || 'Diagnosis'}</Text>
                    <Text style={[styles.settingValue, { color: colors.textSecondary, textTransform: 'capitalize' }]}>{diagnosis.join(', ')}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </View>
        </Animated.View>

        {/* Appearance */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t.appearance || 'APPEARANCE'}</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: isDarkMode ? '#334155' : '#FEF3C7' }]}>
                <MaterialIcons name={isDarkMode ? 'dark-mode' : 'light-mode'} size={20} color={isDarkMode ? '#94A3B8' : '#D97706'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.darkMode || 'Dark Mode'}</Text>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{isDarkMode ? (t.darkModeOn || 'Calming dark theme') : (t.lightMode || 'Light mode')}</Text>
              </View>
              <Switch value={isDarkMode} onValueChange={() => { Haptics.selectionAsync(); toggleDarkMode(); }} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={isDarkMode ? colors.primary : '#F4F3F4'} />
            </View>
          </View>
        </Animated.View>

        {/* Language */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t.language}</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Pressable onPress={() => { Haptics.selectionAsync(); setShowLanguages(!showLanguages); }} style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accent + '14' }]}><MaterialIcons name="language" size={20} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.appLanguage}</Text>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{currentLang.flag} {currentLang.name}</Text>
              </View>
              <MaterialIcons name={showLanguages ? 'expand-less' : 'expand-more'} size={22} color={colors.textTertiary} />
            </Pressable>
            {showLanguages && (
              <Animated.View entering={FadeInDown.duration(200)}>
                {APP_CONFIG.languages.map((lang) => (
                  <Pressable key={lang.code} onPress={() => { Haptics.selectionAsync(); setLanguage(lang.code); setShowLanguages(false); }} style={[styles.languageOption, { borderTopColor: colors.borderLight }, language === lang.code && { backgroundColor: colors.primary + '08' }]}>
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={[styles.languageName, { color: colors.textPrimary }, language === lang.code && { fontWeight: '600', color: colors.primary }]}>{lang.name}</Text>
                    {language === lang.code ? <MaterialIcons name="check-circle" size={18} color={colors.primary} /> : null}
                  </Pressable>
                ))}
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t.notifications || 'NOTIFICATIONS'}</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '14' }]}><MaterialIcons name="notifications-active" size={20} color={colors.secondary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.enableNotifications || 'Enable Notifications'}</Text>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t.remindersAndQuotes || 'Reminders and motivational quotes'}</Text>
              </View>
              <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={notificationsEnabled ? colors.primary : '#F4F3F4'} />
            </View>
            {notificationsEnabled ? (
              <>
                <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
                <Pressable onPress={() => setShowReminders(!showReminders)} style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.primary + '14' }]}><MaterialIcons name="schedule" size={20} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.reminderTime || 'Check-in Reminder'}</Text>
                    <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{reminderTime}</Text>
                  </View>
                  <MaterialIcons name={showReminders ? 'expand-less' : 'expand-more'} size={22} color={colors.textTertiary} />
                </Pressable>
                {showReminders && (
                  <View style={styles.timeOptions}>
                    {REMINDER_TIMES.map(time => (
                      <Pressable key={time} onPress={() => { Haptics.selectionAsync(); setReminderTime(time); setShowReminders(false); scheduleAllNotifications(true, time, quoteInterval, quoteTime); }} style={[styles.timeChip, { backgroundColor: colors.backgroundSecondary }, reminderTime === time && { backgroundColor: colors.primary }]}>
                        <Text style={[styles.timeChipText, { color: colors.textSecondary }, reminderTime === time && { color: '#FFF' }]}>{time}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
                <Pressable onPress={() => setShowQuotes(!showQuotes)} style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.accent + '14' }]}><MaterialIcons name="auto-awesome" size={20} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.quoteNotifications || 'Motivational Quotes'}</Text>
                    <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{quoteIntervalLabel(quoteInterval)}</Text>
                  </View>
                  <MaterialIcons name={showQuotes ? 'expand-less' : 'expand-more'} size={22} color={colors.textTertiary} />
                </Pressable>
                {showQuotes && (
                  <View style={styles.timeOptions}>
                    {QUOTE_INTERVALS.map(interval => (
                      <Pressable key={interval} onPress={() => { Haptics.selectionAsync(); setQuoteInterval(interval); setShowQuotes(false); scheduleAllNotifications(true, reminderTime, interval, quoteTime); }} style={[styles.timeChip, { backgroundColor: colors.backgroundSecondary }, quoteInterval === interval && { backgroundColor: colors.primary }]}>
                        <Text style={[styles.timeChipText, { color: colors.textSecondary }, quoteInterval === interval && { color: '#FFF' }]}>{quoteIntervalLabel(interval)}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {quoteInterval !== 'off' ? (
                  <>
                    <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
                    <Pressable onPress={() => setShowQuoteTimePicker(!showQuoteTimePicker)} style={styles.settingRow}>
                      <View style={[styles.settingIcon, { backgroundColor: '#DBEAFE' }]}><MaterialIcons name="access-time" size={20} color="#3B82F6" /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.quoteTime || 'Affirmation Time'}</Text>
                        <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{quoteTime}{quoteInterval === 'twice' ? ` & ${String((parseInt(quoteTime.split(':')[0]) + 12) % 24).padStart(2, '0')}:${quoteTime.split(':')[1]}` : ''}</Text>
                      </View>
                      <MaterialIcons name={showQuoteTimePicker ? 'expand-less' : 'expand-more'} size={22} color={colors.textTertiary} />
                    </Pressable>
                    {showQuoteTimePicker ? (
                      <View style={styles.timeOptions}>
                        {QUOTE_TIMES.map(time => (
                          <Pressable key={time} onPress={() => { Haptics.selectionAsync(); setQuoteTime(time); setShowQuoteTimePicker(false); scheduleAllNotifications(true, reminderTime, quoteInterval, time); }} style={[styles.timeChip, { backgroundColor: colors.backgroundSecondary }, quoteTime === time && { backgroundColor: colors.primary }]}>
                            <Text style={[styles.timeChipText, { color: colors.textSecondary }, quoteTime === time && { color: '#FFF' }]}>{time}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </>
                ) : null}

                {/* Recent Notification History */}
                {notificationHistory.length > 0 ? (
                  <>
                    <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
                    <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <MaterialIcons name="history" size={16} color={colors.textTertiary} />
                        <Text style={[styles.settingLabel, { color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }]}>{t.recentNotifications || 'Recent Notifications'}</Text>
                      </View>
                      {notificationHistory.slice(0, 5).map(notif => {
                        const date = new Date(notif.timestamp);
                        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                        const dayStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        return (
                          <View key={notif.id} style={[styles.notifHistoryItem, { borderTopColor: colors.borderLight }]}>
                            <View style={[styles.notifTypeIcon, { backgroundColor: notif.type === 'quote' ? colors.accent + '18' : colors.primary + '18' }]}>
                              <MaterialIcons name={notif.type === 'quote' ? 'auto-awesome' : 'notifications'} size={14} color={notif.type === 'quote' ? colors.accent : colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.notifHistoryTitle, { color: colors.textPrimary }]} numberOfLines={1}>{notif.title}</Text>
                              <Text style={[styles.notifHistoryBody, { color: colors.textTertiary }]} numberOfLines={1}>{notif.body}</Text>
                            </View>
                            <Text style={[styles.notifHistoryTime, { color: colors.textTertiary }]}>{dayStr} {timeStr}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                ) : null}
              </>
            ) : null}
          </View>
        </Animated.View>

        {/* Support */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t.support}</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/achievements'); }} style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: '#FEF3C7' }]}><MaterialIcons name="emoji-events" size={20} color="#D97706" /></View>
              <View style={{ flex: 1 }}><Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.achievements || 'Achievements'}</Text><Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t.trophyCaseBadges || 'Trophy case and badges'}</Text></View>
              <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
            </Pressable>
            <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/sound-library'); }} style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '14' }]}><MaterialIcons name="library-music" size={20} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.soundLibrary || 'Sound Library'}</Text><Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t.ambientSoundsMix || 'Ambient sounds and mixing'}</Text></View>
              <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
            </Pressable>
            <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/health-report'); }} style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: '#DBEAFE' }]}><MaterialIcons name="medical-services" size={20} color="#2563EB" /></View>
              <View style={{ flex: 1 }}><Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.healthReport || 'Health Report'}</Text><Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t.healthReportSettingsDesc || 'Generate report for your doctor'}</Text></View>
              <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
            </Pressable>
            <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/crisis-resources'); }} style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: '#FEE2E2' }]}><MaterialIcons name="emergency" size={20} color="#EF4444" /></View>
              <View style={{ flex: 1 }}><Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.crisisResources}</Text><Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t.hotlinesEmergency}</Text></View>
              <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
            </Pressable>
            <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/help-faq'); }} style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '14' }]}><MaterialIcons name="help-outline" size={20} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t.helpFaq}</Text><Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t.howMindspaceWorks}</Text></View>
              <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Data */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t.data}</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            {user?.isAdmin ? (
              <>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin-dashboard'); }} style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: '#1E3A5F18' }]}><MaterialIcons name="dashboard" size={20} color="#1E3A5F" /></View>
                  <View style={{ flex: 1 }}><Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Admin Dashboard</Text><Text style={[styles.settingValue, { color: colors.textSecondary }]}>Users, revenue and analytics</Text></View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
                </Pressable>
                <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
              </>
            ) : null}
            <Pressable onPress={handleClearData} style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: '#FEE2E2' }]}><MaterialIcons name="delete-outline" size={20} color="#EF4444" /></View>
              <View style={{ flex: 1 }}><Text style={[styles.settingLabel, { color: '#EF4444' }]}>{t.clearAllData}</Text><Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t.removeAllEntries}</Text></View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Logout + Premium */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <Pressable
  onPress={() => {
    console.log("BUTTON PRESSED");
    handleLogout();
  }}
  style={[styles.logoutButton, { backgroundColor: colors.surface }]}
>
            <MaterialIcons name="logout" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>{t.logout}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(320)} style={styles.section}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/subscription'); }} style={styles.premiumBanner}>
            <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premiumGradient}>
              <MaterialIcons name="workspace-premium" size={24} color="#FFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumBannerTitle}>{isPrem ? 'Premium Active' : 'MindSpace Premium'}</Text>
                <Text style={styles.premiumBannerDesc}>{isPrem ? (t.enjoyAllFeatures || 'Full access enabled') : `${t.unlockAllFeatures || 'Unlock all features'} — ${countryObj.symbol}${countryObj.monthlyPrice}/${t.monthAbbr || 'month'}`}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Version */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.versionSection}>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>MindSpace v{APP_CONFIG.version}</Text>
          <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>{t.disclaimer}</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  section: { marginTop: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 },
  sectionCard: { borderRadius: themeShared.radius.lg, ...themeShared.shadows.card },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingValue: { fontSize: 13, marginTop: 1 },
  settingDivider: { height: 1, marginLeft: 62 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  nameInput: { flex: 1, fontSize: 14, paddingHorizontal: 12, paddingVertical: 8, borderRadius: themeShared.radius.sm, borderWidth: 1 },
  nameSaveButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  languageOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 62, gap: 12, borderTopWidth: 1 },
  languageFlag: { fontSize: 20 },
  languageName: { fontSize: 15, flex: 1 },
  timeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 62, paddingBottom: 14 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: themeShared.radius.full },
  timeChipText: { fontSize: 13, fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: themeShared.radius.lg, paddingVertical: 16, ...themeShared.shadows.card },
  logoutText: { fontSize: 16, fontWeight: '600' },
  notifHistoryItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, width: '100%' },
  notifTypeIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifHistoryTitle: { fontSize: 13, fontWeight: '600' },
  notifHistoryBody: { fontSize: 11, marginTop: 1 },
  notifHistoryTime: { fontSize: 10, fontWeight: '500' },
  versionSection: { alignItems: 'center', marginTop: 32, paddingHorizontal: 20 },
  versionText: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  disclaimerText: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
  premiumBanner: { borderRadius: themeShared.radius.lg, overflow: 'hidden', ...themeShared.shadows.elevated },
  premiumGradient: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: themeShared.radius.lg },
  premiumBannerTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  premiumBannerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
});
