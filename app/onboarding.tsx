import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { APP_CONFIG } from '../constants/config';
import { getTranslation } from '../constants/translations';

const { width: SW } = Dimensions.get('window');

type Step = 'welcome' | 'country' | 'diagnosis' | 'goals';

const DIAGNOSIS_OPTIONS = [
  { id: 'anxiety', icon: 'psychology' as const, labelKey: 'diagAnxiety' },
  { id: 'depression', icon: 'mood-bad' as const, labelKey: 'diagDepression' },
  { id: 'adhd', icon: 'electric-bolt' as const, labelKey: 'diagADHD' },
  { id: 'ptsd', icon: 'shield' as const, labelKey: 'diagPTSD' },
  { id: 'ocd', icon: 'loop' as const, labelKey: 'diagOCD' },
  { id: 'bipolar', icon: 'swap-vert' as const, labelKey: 'diagBipolar' },
  { id: 'insomnia', icon: 'bedtime' as const, labelKey: 'diagInsomnia' },
  { id: 'eating', icon: 'restaurant' as const, labelKey: 'diagEating' },
  { id: 'autism', icon: 'extension' as const, labelKey: 'diagAutism' },
  { id: 'none', icon: 'check-circle' as const, labelKey: 'diagNone' },
  { id: 'other', icon: 'more-horiz' as const, labelKey: 'diagOther' },
];

const GOAL_OPTIONS = [
  { id: 'anxiety', icon: 'spa' as const, labelKey: 'goalAnxiety' },
  { id: 'sleep', icon: 'bedtime' as const, labelKey: 'goalSleep' },
  { id: 'stress', icon: 'self-improvement' as const, labelKey: 'goalStress' },
  { id: 'mood', icon: 'mood' as const, labelKey: 'goalMood' },
  { id: 'focus', icon: 'center-focus-strong' as const, labelKey: 'goalFocus' },
  { id: 'mindfulness', icon: 'light-mode' as const, labelKey: 'goalMindfulness' },
  { id: 'selfcare', icon: 'favorite' as const, labelKey: 'goalSelfCare' },
  { id: 'relationships', icon: 'people' as const, labelKey: 'goalRelationships' },
];

export default function OnboardingScreen() {
  const { setLanguage, language, setDiagnosis, setWellnessGoals, completeOnboarding, setCountry, colors } = useApp();
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('welcome');
  const [selectedCountry, setSelectedCountryLocal] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosisLocal] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoalsLocal] = useState<string[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);

  // Determine language based on current selection (country -> lang)
  const countryObj = APP_CONFIG.countries.find(c => c.code === selectedCountry);
  const activeLang = countryObj ? countryObj.lang : language;
  const t = getTranslation(activeLang);

  const toggleDiagnosis = (id: string) => {
    Haptics.selectionAsync();
    if (id === 'none') {
      setSelectedDiagnosisLocal(prev => prev.includes('none') ? [] : ['none']);
      return;
    }
    setSelectedDiagnosisLocal(prev => {
      const filtered = prev.filter(d => d !== 'none');
      return filtered.includes(id) ? filtered.filter(d => d !== id) : [...filtered, id];
    });
  };

  const toggleGoal = (id: string) => {
    Haptics.selectionAsync();
    setSelectedGoalsLocal(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'welcome') {
      setStep('country');
    } else if (step === 'country') {
      if (selectedCountry) {
        setCountry(selectedCountry);
        const cObj = APP_CONFIG.countries.find(c => c.code === selectedCountry);
        if (cObj) setLanguage(cObj.lang);
      }
      setStep('diagnosis');
    } else if (step === 'diagnosis') {
      const filtered = selectedDiagnosis.filter(d => d !== 'none');
      try { setDiagnosis(filtered); } catch (e) { console.log('setDiagnosis error:', e); }
      setStep('goals');
    } else if (step === 'goals') {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
  if (isFinishing) return;
  setIsFinishing(true);

  try {
    setWellnessGoals(selectedGoals);

    await AsyncStorage.setItem(
      "diagnosis",
      JSON.stringify(selectedDiagnosis.filter(d => d !== "none"))
    );

    await AsyncStorage.setItem(
      "wellnessGoals",
      JSON.stringify(selectedGoals)
    );

    await completeOnboarding();

    // giver state tid til at opdatere
   setTimeout(() => {
  router.replace("/");
}, 300);

  } catch (e) {
    console.log("finishOnboarding error:", e);
  }
};

  const TOTAL_STEPS = 4;
  const stepIndex = step === 'welcome' ? 0 : step === 'country' ? 1 : step === 'diagnosis' ? 2 : 3;

  // Welcome
  if (step === 'welcome') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#EBF4FF', '#F0EBFF', '#E8F9F0']} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.welcomeContent}>
            <Animated.View entering={FadeIn.duration(600)} style={styles.welcomeImageWrap}>
              <Image source={require('../assets/images/onboarding-welcome.png')} style={styles.welcomeImage} contentFit="contain" transition={200} />
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(500).delay(200)}>
              <Text style={styles.welcomeTitle}>{user ? `${t.welcomeBack || 'Welcome'}, ${user.name?.split(' ')[0] || ''}!` : 'MindSpace'}</Text>
              <Text style={styles.welcomeSubtitle}>{user ? (t.personalizeExperience || 'Let us personalize your experience') : (t.loginSubtitle || 'Your safe space for mental wellness')}</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.welcomeFeatures}>
              {[
                { icon: 'chat-bubble-outline' as const, text: t.talkToAI || 'Talk to an empathetic AI companion' },
                { icon: 'show-chart' as const, text: t.moodTrend || 'Track and understand your mood patterns' },
                { icon: 'self-improvement' as const, text: t.meditation || 'Guided meditation and breathing exercises' },
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIcon}><MaterialIcons name={f.icon} size={20} color="#5B8FB9" /></View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </Animated.View>
          </View>
          <View style={styles.bottomSection}>
            <Text style={styles.disclaimer}>{t.disclaimer || 'MindSpace is a supportive tool, not a replacement for professional therapy.'}</Text>
            <Pressable onPress={handleNext} style={({ pressed }) => [styles.primaryBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
              <LinearGradient colors={['#5B8FB9', '#3A6D94']} style={styles.primaryBtnGradient}>
                <Text style={styles.primaryBtnText}>{t.beginSession || 'Get Started'}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Country Selection
  if (step === 'country') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#EBF4FF', '#F0EBFF', '#E8F9F0']} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
            ))}
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(400)}>
              <MaterialIcons name="public" size={48} color="#5B8FB9" style={{ alignSelf: 'center', marginBottom: 16 }} />
              <Text style={styles.stepTitle}>{(t as any).selectCountry || 'Select Your Country'}</Text>
              <Text style={styles.stepSubtitle}>{(t as any).selectCountryDesc || 'We will adapt the app to your country'}</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.langGrid}>
              {APP_CONFIG.countries.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => { Haptics.selectionAsync(); setSelectedCountryLocal(c.code); }}
                  style={[styles.langCard, selectedCountry === c.code && styles.langCardActive]}
                >
                  <Text style={styles.langFlag}>{c.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.langName, selectedCountry === c.code && styles.langNameActive]}>{c.name}</Text>
                    <Text style={styles.currencyHint}>{c.currency} ({c.symbol})</Text>
                  </View>
                  {selectedCountry === c.code ? <MaterialIcons name="check-circle" size={20} color="#5B8FB9" /> : null}
                </Pressable>
              ))}
            </Animated.View>
          </ScrollView>
          <View style={styles.bottomSection}>
            <Pressable onPress={handleNext} disabled={!selectedCountry} style={({ pressed }) => [styles.primaryBtn, !selectedCountry && { opacity: 0.5 }, pressed && selectedCountry ? { transform: [{ scale: 0.97 }] } : null]}>
              <LinearGradient colors={['#5B8FB9', '#3A6D94']} style={styles.primaryBtnGradient}>
                <Text style={styles.primaryBtnText}>{t.done || 'Continue'}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Diagnosis
  if (step === 'diagnosis') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#EBF4FF', '#F0EBFF', '#E8F9F0']} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
            ))}
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(400)}>
              <MaterialIcons name="psychology" size={48} color="#9B8EC4" style={{ alignSelf: 'center', marginBottom: 16 }} />
              <Text style={styles.stepTitle}>{t.diagnosisTitle || 'Tell Us About You'}</Text>
              <Text style={styles.stepSubtitle}>{t.diagnosisSubtitle}</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.optionsGrid}>
              {DIAGNOSIS_OPTIONS.map((opt) => {
                const isSelected = selectedDiagnosis.includes(opt.id);
                return (
                  <Pressable key={opt.id} onPress={() => toggleDiagnosis(opt.id)} style={[styles.optionCard, isSelected && styles.optionCardActive]}>
                    <MaterialIcons name={opt.icon} size={24} color={isSelected ? '#FFF' : '#718096'} />
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>{(t as any)[opt.labelKey] || opt.labelKey}</Text>
                  </Pressable>
                );
              })}
            </Animated.View>
            <View style={styles.privacyNote}>
              <MaterialIcons name="lock" size={14} color="#A0AEC0" />
              <Text style={styles.privacyText}>{t.diagnosisPrivacy}</Text>
            </View>
          </ScrollView>
          <View style={styles.bottomSection}>
            <Pressable onPress={handleNext} style={({ pressed }) => [styles.primaryBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
              <LinearGradient colors={['#9B8EC4', '#7A6BA8']} style={styles.primaryBtnGradient}>
                <Text style={styles.primaryBtnText}>{t.done || 'Continue'}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => setStep('goals')} style={styles.skipBtn}>
              <Text style={styles.skipText}>{t.skip || 'Skip for now'}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Goals
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EBF4FF', '#F0EBFF', '#E8F9F0']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
          ))}
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <MaterialIcons name="flag" size={48} color="#7DB89E" style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.stepTitle}>{t.goalsTitle || 'What Are Your Goals?'}</Text>
            <Text style={styles.stepSubtitle}>{t.goalsSubtitle}</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.optionsGrid}>
            {GOAL_OPTIONS.map((opt) => {
              const isSelected = selectedGoals.includes(opt.id);
              return (
                <Pressable key={opt.id} onPress={() => toggleGoal(opt.id)} style={[styles.optionCard, isSelected && styles.optionCardActiveGreen]}>
                  <MaterialIcons name={opt.icon} size={24} color={isSelected ? '#FFF' : '#718096'} />
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>{(t as any)[opt.labelKey] || opt.labelKey}</Text>
                </Pressable>
              );
            })}
          </Animated.View>
        </ScrollView>
        <View style={styles.bottomSection}>
          <Pressable onPress={handleNext} disabled={isFinishing} style={({ pressed }) => [styles.primaryBtn, pressed && { transform: [{ scale: 0.97 }] }, isFinishing && { opacity: 0.6 }]}>
            <LinearGradient colors={['#7DB89E', '#5A9A7C']} style={styles.primaryBtnGradient}>
              <Text style={styles.primaryBtnText}>{t.beginSession || 'Start My Journey'}</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16, paddingBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(91,143,185,0.2)' },
  dotActive: { width: 24, backgroundColor: '#5B8FB9' },
  welcomeContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeImageWrap: { width: 200, height: 200, marginBottom: 24 },
  welcomeImage: { width: 200, height: 200 },
  welcomeTitle: { fontSize: 36, fontWeight: '700', color: '#2D3748', textAlign: 'center', letterSpacing: -0.5 },
  welcomeSubtitle: { fontSize: 16, color: '#718096', textAlign: 'center', marginTop: 8, lineHeight: 24 },
  welcomeFeatures: { marginTop: 32, gap: 16, width: '100%' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFF', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(91,143,185,0.1)', alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, fontSize: 15, color: '#4A5568', lineHeight: 21 },
  stepContent: { paddingTop: 16, paddingBottom: 24 },
  stepTitle: { fontSize: 26, fontWeight: '700', color: '#2D3748', textAlign: 'center', marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: '#718096', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 8 },
  langGrid: { gap: 10 },
  langCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 2, borderColor: 'transparent' },
  langCardActive: { borderColor: '#5B8FB9', backgroundColor: 'rgba(91,143,185,0.06)' },
  langFlag: { fontSize: 28 },
  langName: { flex: 1, fontSize: 17, fontWeight: '600', color: '#4A5568' },
  langNameActive: { color: '#5B8FB9' },
  currencyHint: { fontSize: 12, color: '#A0AEC0', marginTop: 2 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard: { width: (SW - 58) / 2, backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: 'transparent', minHeight: 90, justifyContent: 'center' },
  optionCardActive: { borderColor: '#9B8EC4', backgroundColor: '#9B8EC4' },
  optionCardActiveGreen: { borderColor: '#7DB89E', backgroundColor: '#7DB89E' },
  optionLabel: { fontSize: 13, fontWeight: '600', color: '#4A5568', textAlign: 'center' },
  optionLabelActive: { color: '#FFF' },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, justifyContent: 'center' },
  privacyText: { fontSize: 12, color: '#A0AEC0' },
  bottomSection: { paddingTop: 12, paddingBottom: 16, gap: 12 },
  primaryBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  primaryBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16 },
  primaryBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 15, color: '#A0AEC0', fontWeight: '500' },
  disclaimer: { fontSize: 11, color: '#A0AEC0', textAlign: 'center', lineHeight: 16, marginBottom: 4 },
});
