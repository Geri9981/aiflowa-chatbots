import React from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Linking, Platform,
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

interface CrisisResource {
  country: string;
  flag: string;
  hotline: string;
  hotlineName: string;
  textLine?: string;
  textLineName?: string;
  website?: string;
}

const CRISIS_RESOURCES: CrisisResource[] = [
  { country: 'United States', flag: '🇺🇸', hotline: '988', hotlineName: 'Suicide & Crisis Lifeline', textLine: '741741', textLineName: 'Crisis Text Line', website: 'https://988lifeline.org' },
  { country: 'Danmark', flag: '🇩🇰', hotline: '70201201', hotlineName: 'Livslinien', website: 'https://www.livslinien.dk' },
  { country: 'Deutschland', flag: '🇩🇪', hotline: '08001110111', hotlineName: 'Telefonseelsorge', website: 'https://www.telefonseelsorge.de' },
  { country: 'España', flag: '🇪🇸', hotline: '024', hotlineName: 'Linea de Atencion a la Conducta Suicida', website: 'https://www.sanidad.gob.es/linea024' },
  { country: 'France', flag: '🇫🇷', hotline: '3114', hotlineName: 'Numero National de Prevention du Suicide', website: 'https://www.3114.fr' },
  { country: 'Sverige', flag: '🇸🇪', hotline: '90101', hotlineName: 'Mind Sjalvmordslinjen', website: 'https://mind.se' },
  { country: 'United Kingdom', flag: '🇬🇧', hotline: '116123', hotlineName: 'Samaritans', website: 'https://www.samaritans.org' },
  { country: 'International', flag: '🌍', hotline: '', hotlineName: 'International Association for Suicide Prevention', website: 'https://www.iasp.info/resources/Crisis_Centres/' },
];

export default function CrisisResourcesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, colors } = useApp();
  const t = getTranslation(language);

  const handleCall = (number: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const url = Platform.OS === 'ios' ? `telprompt:${number}` : `tel:${number}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleText = (number: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`sms:${number}`).catch(() => {});
  };

  const handleWebsite = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.crisisResources}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Emergency Banner */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.emergencyBanner}>
            <MaterialIcons name="warning" size={28} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>{t.immediateEmergency || 'Immediate Emergency?'}</Text>
              <Text style={styles.emergencyDesc}>{t.callEmergencyServices || 'If you or someone else is in immediate danger, call your local emergency number (112/911).'}</Text>
            </View>
          </LinearGradient>
          <View style={styles.emergencyButtons}>
            <Pressable onPress={() => handleCall('112')} style={({ pressed }) => [styles.emergencyCallBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
              <LinearGradient colors={['#DC2626', '#991B1B']} style={styles.emergencyCallGradient}>
                <MaterialIcons name="call" size={22} color="#FFF" />
                <Text style={styles.emergencyCallText}>{t.callEmergency || 'Call 112 (EU)'}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => handleCall('911')} style={({ pressed }) => [styles.emergencyCallBtnSmall, { borderColor: '#DC2626' }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <MaterialIcons name="call" size={18} color="#DC2626" />
              <Text style={[styles.emergencyCallSmallText, { color: '#DC2626' }]}>911 (US)</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Reassurance message */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={[styles.reassuranceCard, { backgroundColor: colors.primary + '0D' }]}>
          <MaterialIcons name="favorite" size={20} color={colors.primary} />
          <Text style={[styles.reassuranceText, { color: colors.textSecondary }]}>
            {t.youAreNotAlone || 'You are not alone. Reaching out for help is a sign of strength. These resources are available 24/7 and are free of charge.'}
          </Text>
        </Animated.View>

        {/* Country Resources */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.crisisHotlines || 'Crisis Hotlines by Country'}</Text>

        {CRISIS_RESOURCES.map((resource, index) => (
          <Animated.View key={resource.country} entering={FadeInDown.duration(400).delay(150 + index * 60)}>
            <View style={[styles.resourceCard, { backgroundColor: colors.surface }]}>
              <View style={styles.resourceHeader}>
                <Text style={styles.resourceFlag}>{resource.flag}</Text>
                <Text style={[styles.resourceCountry, { color: colors.textPrimary }]}>{resource.country}</Text>
              </View>

              <View style={styles.resourceBody}>
                <View style={styles.resourceRow}>
                  <View style={[styles.resourceIconCircle, { backgroundColor: '#DC262610' }]}>
                    <MaterialIcons name="call" size={16} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resourceName, { color: colors.textPrimary }]}>{resource.hotlineName}</Text>
                    {resource.hotline ? (
                      <Text style={[styles.resourceNumber, { color: colors.primary }]}>{resource.hotline}</Text>
                    ) : null}
                  </View>
                  {resource.hotline ? (
                    <Pressable onPress={() => handleCall(resource.hotline)} style={({ pressed }) => [styles.callNowBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
                      <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.callNowGradient}>
                        <MaterialIcons name="call" size={16} color="#FFF" />
                        <Text style={styles.callNowText}>{t.callNow || 'Call Now'}</Text>
                      </LinearGradient>
                    </Pressable>
                  ) : null}
                </View>

                {resource.textLine ? (
                  <View style={[styles.resourceRow, { marginTop: 10 }]}>
                    <View style={[styles.resourceIconCircle, { backgroundColor: colors.primary + '10' }]}>
                      <MaterialIcons name="sms" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resourceName, { color: colors.textPrimary }]}>{resource.textLineName}</Text>
                      <Text style={[styles.resourceNumber, { color: colors.primary }]}>Text HOME to {resource.textLine}</Text>
                    </View>
                    <Pressable onPress={() => handleText(resource.textLine!)} style={({ pressed }) => [styles.textBtn, { borderColor: colors.primary }, pressed && { transform: [{ scale: 0.95 }] }]}>
                      <MaterialIcons name="sms" size={14} color={colors.primary} />
                      <Text style={[styles.textBtnText, { color: colors.primary }]}>Text</Text>
                    </Pressable>
                  </View>
                ) : null}

                {resource.website ? (
                  <Pressable onPress={() => handleWebsite(resource.website!)} style={[styles.websiteRow, { borderTopColor: colors.borderLight }]}>
                    <MaterialIcons name="language" size={14} color={colors.textTertiary} />
                    <Text style={[styles.websiteText, { color: colors.primary }]} numberOfLines={1}>{resource.website}</Text>
                    <MaterialIcons name="open-in-new" size={14} color={colors.textTertiary} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Animated.View>
        ))}

        {/* Disclaimer */}
        <Animated.View entering={FadeInDown.duration(400).delay(600)} style={[styles.disclaimerCard, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialIcons name="info-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
            {t.crisisDisclaimer || 'These numbers are provided for informational purposes. Availability and hours may vary. Always call your local emergency number in life-threatening situations.'}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  emergencyBanner: { borderRadius: themeShared.radius.lg, padding: 20, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 14 },
  emergencyTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  emergencyDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19 },
  emergencyButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  emergencyCallBtn: { flex: 1, borderRadius: themeShared.radius.lg, overflow: 'hidden', ...themeShared.shadows.elevated },
  emergencyCallGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: themeShared.radius.lg },
  emergencyCallText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  emergencyCallBtnSmall: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: themeShared.radius.lg, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 6 },
  emergencyCallSmallText: { fontSize: 15, fontWeight: '700' },
  reassuranceCard: { borderRadius: themeShared.radius.md, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reassuranceText: { flex: 1, fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  resourceCard: { borderRadius: themeShared.radius.lg, marginBottom: 12, overflow: 'hidden', ...themeShared.shadows.card },
  resourceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  resourceFlag: { fontSize: 22 },
  resourceCountry: { fontSize: 16, fontWeight: '700' },
  resourceBody: { paddingHorizontal: 16, paddingBottom: 4 },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resourceIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  resourceName: { fontSize: 13, fontWeight: '600' },
  resourceNumber: { fontSize: 15, fontWeight: '700', marginTop: 1 },
  callNowBtn: { borderRadius: themeShared.radius.full, overflow: 'hidden' },
  callNowGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: themeShared.radius.full },
  callNowText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  textBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: themeShared.radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  textBtnText: { fontSize: 12, fontWeight: '600' },
  websiteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginTop: 8, borderTopWidth: 1 },
  websiteText: { flex: 1, fontSize: 12, fontWeight: '500' },
  disclaimerCard: { borderRadius: themeShared.radius.md, padding: 14, marginTop: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
