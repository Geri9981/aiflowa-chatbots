import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { themeShared } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';

interface FAQItem {
  icon: string;
  q: string;
  a: string;
}

interface FeatureItem {
  icon: string;
  color: string;
  title: string;
  desc: string;
}

export default function HelpFaqScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, colors } = useApp();
  const t = getTranslation(language);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const features: FeatureItem[] = [
    { icon: 'chat-bubble-outline', color: '#5B8FB9', title: t.helpFeatureChat || 'AI Chat', desc: t.helpFeatureChatDesc || 'Talk to an empathetic AI companion who listens without judgment. Share your thoughts, feelings, and concerns — get thoughtful responses and coping strategies in real time.' },
    { icon: 'mood', color: '#7DB89E', title: t.helpFeatureMood || 'Mood Tracking', desc: t.helpFeatureMoodDesc || 'Rate your mood daily on a 1-10 scale and add notes about what influenced your day. Over time, see patterns, trends, and correlations with your habits.' },
    { icon: 'auto-stories', color: '#9B8EC4', title: t.helpFeatureJournal || 'Journaling', desc: t.helpFeatureJournalDesc || 'Write freely about your thoughts and feelings. After saving, our AI provides personalized insights based on your entry to help you reflect and grow.' },
    { icon: 'self-improvement', color: '#E6A87C', title: t.helpFeatureMeditation || 'Meditation', desc: t.helpFeatureMeditationDesc || 'Guided meditation timer with ambient sounds (rain, ocean, forest, and more). Choose your duration, select a sound, and find your calm.' },
    { icon: 'air', color: '#5B8FB9', title: t.helpFeatureBreathing || 'Breathing Exercises', desc: t.helpFeatureBreathingDesc || 'Interactive Box Breathing (4-4-4-4 pattern) with animated visual guide, haptic feedback, and round counter. Activates your parasympathetic nervous system to reduce stress.' },
    { icon: 'insights', color: '#D97706', title: t.helpFeatureProgress || 'Progress & Analytics', desc: t.helpFeatureProgressDesc || 'Visual mood trends, weekly patterns, day-of-week analysis, and journal tag correlations. Track your wellness journey with data-driven insights.' },
    { icon: 'library-music', color: '#A0522D', title: t.helpFeatureSounds || 'Sound Library', desc: t.helpFeatureSoundsDesc || 'Mix ambient sounds like rain, ocean, fireplace, birds, and white noise. Adjust individual volumes to create your perfect relaxation mix.' },
    { icon: 'medical-services', color: '#2563EB', title: t.helpFeatureHealthReport || 'Health Reports', desc: t.helpFeatureHealthReportDesc || 'Generate structured wellness reports based on your data for any period. Export as PDF to share with your therapist or doctor.' },
    { icon: 'emoji-events', color: '#D97706', title: t.helpFeatureAchievements || 'Achievements', desc: t.helpFeatureAchievementsDesc || 'Earn badges for mood streaks, meditation sessions, journal entries, and breathing exercises. Gamified motivation for your wellness journey.' },
    { icon: 'notifications-active', color: '#EF4444', title: t.helpFeatureNotifications || 'Smart Notifications', desc: t.helpFeatureNotificationsDesc || 'Daily affirmation quotes and mood check-in reminders at your preferred times. Tapping a notification takes you directly to the relevant screen.' },
  ];

  const faqs: FAQItem[] = [
    { icon: 'shield', q: t.helpFaqPrivacy || 'Is my data private and secure?', a: t.helpFaqPrivacyAnswer || 'Yes. Your data is stored securely in the cloud with encryption. Your mood entries, journal, and chat history are only accessible by you. We never share or sell your personal data.' },
    { icon: 'psychology', q: t.helpFaqReplaceTherapy || 'Can MindSpace replace therapy?', a: t.helpFaqReplaceTherapyAnswer || 'No. MindSpace is a supportive wellness tool, not a replacement for professional therapy or medical advice. If you are in crisis or need clinical help, please contact a mental health professional or use our Crisis Resources.' },
    { icon: 'workspace-premium', q: t.helpFaqPremium || 'What does Premium include?', a: t.helpFaqPremiumAnswer || 'Premium unlocks: unlimited AI chat, full meditation with all ambient sounds, complete mood analytics and predictions, sound library mixing, advanced health reports, and priority support. Free users get basic mood tracking, journaling, and limited features.' },
    { icon: 'sync', q: t.helpFaqSync || 'Does my data sync across devices?', a: t.helpFaqSyncAnswer || 'Yes. Your data is stored in the cloud and syncs automatically when you log in on any device with the same account. Preferences like dark mode and language are stored locally per device.' },
    { icon: 'language', q: t.helpFaqLanguages || 'Which languages are supported?', a: t.helpFaqLanguagesAnswer || 'MindSpace supports English, Danish, German, Spanish, French, Swedish, and Italian. You can change the language at any time in Settings. The AI chat responds in your selected language.' },
    { icon: 'notifications', q: t.helpFaqNotifications || 'How do notifications work?', a: t.helpFaqNotificationsAnswer || 'You can set separate times for mood check-in reminders and daily affirmation quotes. Tapping a mood reminder opens the mood check-in screen; tapping an affirmation opens the home screen. Configure everything in Settings > Notifications.' },
    { icon: 'delete-outline', q: t.helpFaqDeleteData || 'Can I delete my data?', a: t.helpFaqDeleteDataAnswer || 'You can clear local preferences in Settings > Data > Clear All Data. For complete account deletion, please contact our support team at contact@onspace.ai.' },
    { icon: 'offline-bolt', q: t.helpFaqOffline || 'Does MindSpace work offline?', a: t.helpFaqOfflineAnswer || 'Basic features like breathing exercises work offline. However, AI chat, cloud sync, mood analytics, and health reports require an internet connection.' },
  ];

  const toggleFaq = (index: number) => {
    Haptics.selectionAsync();
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.helpFaq || 'Help & FAQ'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBanner}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="spa" size={32} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>MindSpace</Text>
            <Text style={styles.heroSubtitle}>{t.helpHeroSubtitle || 'Your safe space for mental wellness'}</Text>
            <Text style={styles.heroDesc}>{t.helpHeroDesc || 'MindSpace combines AI-powered conversations, mood tracking, guided meditation, journaling, and data-driven insights to support your daily mental wellness journey.'}</Text>
          </LinearGradient>
        </Animated.View>

        {/* How It Works */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.helpHowItWorks || 'How MindSpace Works'}</Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>{t.helpHowItWorksDesc || 'MindSpace is built around four pillars: Track how you feel, Reflect through writing, Practice mindfulness, and Grow with AI-powered insights.'}</Text>

          <View style={styles.pillarsRow}>
            {[
              { icon: 'mood', label: t.helpPillarTrack || 'Track', color: '#7DB89E' },
              { icon: 'edit', label: t.helpPillarReflect || 'Reflect', color: '#9B8EC4' },
              { icon: 'self-improvement', label: t.helpPillarPractice || 'Practice', color: '#E6A87C' },
              { icon: 'trending-up', label: t.helpPillarGrow || 'Grow', color: '#5B8FB9' },
            ].map((pillar, i) => (
              <View key={i} style={[styles.pillarCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.pillarIcon, { backgroundColor: pillar.color + '18' }]}>
                  <MaterialIcons name={pillar.icon as any} size={22} color={pillar.color} />
                </View>
                <Text style={[styles.pillarLabel, { color: colors.textPrimary }]}>{pillar.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.helpFeatures || 'Features'}</Text>
          <View style={styles.featuresGrid}>
            {features.map((feat, i) => (
              <View key={i} style={[styles.featureCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.featureIcon, { backgroundColor: feat.color + '14' }]}>
                  <MaterialIcons name={feat.icon as any} size={20} color={feat.color} />
                </View>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{feat.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textTertiary }]} numberOfLines={3}>{feat.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* FAQ */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.helpFaqTitle || 'Frequently Asked Questions'}</Text>
          <View style={[styles.faqContainer, { backgroundColor: colors.surface }]}>
            {faqs.map((faq, i) => (
              <View key={i}>
                {i > 0 ? <View style={[styles.faqDivider, { backgroundColor: colors.borderLight }]} /> : null}
                <Pressable onPress={() => toggleFaq(i)} style={styles.faqRow}>
                  <View style={[styles.faqIcon, { backgroundColor: colors.primary + '14' }]}>
                    <MaterialIcons name={faq.icon as any} size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.faqQuestion, { color: colors.textPrimary }]}>{faq.q}</Text>
                  <MaterialIcons name={expandedIndex === i ? 'expand-less' : 'expand-more'} size={22} color={colors.textTertiary} />
                </Pressable>
                {expandedIndex === i ? (
                  <Animated.View entering={FadeInDown.duration(200)}>
                    <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.a}</Text>
                  </Animated.View>
                ) : null}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Contact */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.helpContact || 'Still Need Help?'}</Text>
          <Pressable
            onPress={() => Linking.openURL('mailto:contact@onspace.ai')}
            style={({ pressed }) => [styles.contactCard, { backgroundColor: colors.surface }, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <View style={[styles.contactIcon, { backgroundColor: colors.primary + '14' }]}>
              <MaterialIcons name="mail-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>contact@onspace.ai</Text>
              <Text style={[styles.contactDesc, { color: colors.textSecondary }]}>{t.helpContactDesc || 'Email our support team for personalized help'}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
          </Pressable>
        </Animated.View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <MaterialIcons name="info-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>{t.disclaimer}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  heroBanner: { marginHorizontal: 16, marginTop: 8, borderRadius: 20, padding: 24, alignItems: 'center' },
  heroIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 19, marginTop: 14, paddingHorizontal: 8 },
  section: { marginTop: 28, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 19, fontWeight: '700', marginBottom: 8 },
  sectionDesc: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  pillarsRow: { flexDirection: 'row', gap: 10 },
  pillarCard: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 14, ...themeShared.shadows.card },
  pillarIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  pillarLabel: { fontSize: 12, fontWeight: '700' },
  featuresGrid: { gap: 10 },
  featureCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, ...themeShared.shadows.card },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  featureTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  featureDesc: { fontSize: 12, lineHeight: 17, flex: 1 },
  faqContainer: { borderRadius: 16, ...themeShared.shadows.card },
  faqDivider: { height: 1, marginLeft: 54 },
  faqRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  faqIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600' },
  faqAnswer: { fontSize: 13, lineHeight: 20, paddingHorizontal: 54, paddingBottom: 14 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, ...themeShared.shadows.card },
  contactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { fontSize: 15, fontWeight: '700' },
  contactDesc: { fontSize: 12, marginTop: 2 },
  disclaimerContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginTop: 24, paddingHorizontal: 4 },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
