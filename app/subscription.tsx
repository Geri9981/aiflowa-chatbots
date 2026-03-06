import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAlert } from '@/template';
import theme from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';
import { APP_CONFIG } from '../constants/config';
import { STRIPE_CONFIG } from '../constants/stripe';

type Plan = 'monthly' | 'yearly';

const YEARLY_DISCOUNT = 0.20;

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, startCheckout, openCustomerPortal, checkSubscription, subscriptionLoading } = useAuth();
  const { language } = useApp();
  const t = getTranslation(language);
  const { showAlert } = useAlert();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const [refreshing, setRefreshing] = useState(false);

  const isPremium = user?.isPremium;

  // Get pricing based on country
  const { country } = useApp();
  const countryObj = APP_CONFIG.countries.find(c => c.code === country) || APP_CONFIG.countries[0];
  const MONTHLY_PRICE = countryObj.monthlyPrice;
  const CURRENCY_SYMBOL = countryObj.symbol;
  const YEARLY_MONTHLY_PRICE = Number((MONTHLY_PRICE * (1 - YEARLY_DISCOUNT)).toFixed(2));
  const YEARLY_TOTAL = Number((YEARLY_MONTHLY_PRICE * 12).toFixed(2));

  // Refresh subscription status when screen opens
  useEffect(() => {
    checkSubscription();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await checkSubscription();
    setTimeout(() => setRefreshing(false), 1000);
  }, [checkSubscription]);

  const features = [
    { icon: 'self-improvement' as const, title: t.unlimitedMeditation || 'Unlimited Meditation', desc: t.allDurationsAndSounds || 'All durations and ambient sounds' },
    { icon: 'psychology' as const, title: t.advancedAIChat || 'Advanced AI Chat', desc: t.deeperConversations || 'Deeper, more personalized conversations' },
    { icon: 'analytics' as const, title: t.fullAnalytics || 'Full Analytics', desc: t.comprehensiveInsights || 'Comprehensive mood and wellness insights' },
    { icon: 'library-music' as const, title: t.soundLibrary || 'Sound Library', desc: t.allSoundsUnlocked || 'All 12 ambient sounds unlocked' },
    { icon: 'insights' as const, title: t.moodPrediction || 'Mood Prediction', desc: t.aiPoweredRecommendations || 'AI-powered mood forecasting' },
    { icon: 'favorite' as const, title: t.prioritySupport || 'Priority Support', desc: t.directAccessToTeam || 'Direct access to our support team' },
  ];

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const priceId = selectedPlan === 'yearly'
      ? STRIPE_CONFIG.yearly.priceId
      : STRIPE_CONFIG.monthly.priceId;

    const { error } = await startCheckout(priceId);

    if (error) {
      showAlert(
        t.error || 'Error',
        error,
        [{ text: 'OK' }]
      );
    }
  };

  const handleManageSubscription = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await openCustomerPortal();
    if (error) {
      showAlert(t.error || 'Error', error);
    }
  };

  if (isPremium) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[theme.primary, theme.accent]} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>
          <View style={styles.premiumActiveContent}>
            <Animated.View entering={FadeIn.duration(500)} style={styles.premiumBadge}>
              <MaterialIcons name="workspace-premium" size={48} color="#FFF" />
            </Animated.View>
            <Text style={styles.premiumActiveTitle}>{t.youArePremium || 'You are Premium'}</Text>
            <Text style={styles.premiumActiveSubtitle}>
              {user?.isAdmin
                ? (t.adminFullAccess || 'Admin account with full access')
                : (t.enjoyAllFeatures || 'Enjoy all features of MindSpace')
              }
            </Text>
            {user?.subscriptionEnd ? (
              <Text style={styles.premiumExpiry}>
                {t.validUntil || 'Valid until'}: {new Date(user.subscriptionEnd).toLocaleDateString()}
              </Text>
            ) : null}
            {user?.subscriptionStatus ? (
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: user.subscriptionStatus === 'active' ? '#10B981' : '#F59E0B' }]} />
                <Text style={styles.statusText}>{user.subscriptionStatus}</Text>
              </View>
            ) : null}

            {/* Manage Subscription */}
            {!user?.isAdmin ? (
              <Pressable
                onPress={handleManageSubscription}
                disabled={subscriptionLoading}
                style={({ pressed }) => [styles.manageBtn, pressed && { transform: [{ scale: 0.97 }] }, subscriptionLoading && { opacity: 0.7 }]}
              >
                {subscriptionLoading ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <>
                    <MaterialIcons name="settings" size={18} color={theme.primary} />
                    <Text style={styles.manageBtnText}>{t.manageSubscription || 'Manage Subscription'}</Text>
                  </>
                )}
              </Pressable>
            ) : null}

            {/* Refresh status */}
            <Pressable
              onPress={handleRefresh}
              disabled={refreshing}
              style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
            >
              {refreshing ? (
                <ActivityIndicator color="rgba(255,255,255,0.7)" size="small" />
              ) : (
                <>
                  <MaterialIcons name="refresh" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.refreshText}>{t.refreshStatus || 'Refresh Status'}</Text>
                </>
              )}
            </Pressable>

            <Pressable onPress={() => router.back()} style={styles.premiumDoneBtn}>
              <Text style={styles.premiumDoneBtnText}>{t.done || 'Done'}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient colors={['#0F1722', '#1A2332', '#2D3748']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.heroSection}>
          <LinearGradient colors={[theme.primary, theme.accent]} style={styles.heroBadge}>
            <MaterialIcons name="workspace-premium" size={28} color="#FFF" />
          </LinearGradient>
          <Text style={styles.heroTitle}>MindSpace Premium</Text>
          <Text style={styles.heroSubtitle}>
            {t.unlockFullPotential || 'Unlock your full wellness potential'}
          </Text>
          {/* Free trial banner */}
          <View style={styles.trialBanner}>
            <MaterialIcons name="card-giftcard" size={16} color="#10B981" />
            <Text style={styles.trialBannerText}>
              {t.freeTrialBanner || `${STRIPE_CONFIG.trialDays} dages gratis prøveperiode — betal først efter`}
            </Text>
          </View>
        </Animated.View>

        {/* Stripe secure badge */}
        <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.secureBadge}>
          <MaterialIcons name="lock" size={14} color="#10B981" />
          <Text style={styles.secureText}>Secured by Stripe — SSL encrypted</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.featuresSection}>
          {features.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialIcons name={feature.icon} size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
              <MaterialIcons name="check-circle" size={18} color={theme.success} />
            </View>
          ))}
        </Animated.View>

        {/* Pricing cards */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.pricingSection}>
          {/* Yearly */}
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setSelectedPlan('yearly'); }}
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardActive]}
          >
            <View style={styles.planBestValue}>
              <Text style={styles.planBestValueText}>{t.bestValue || 'BEST VALUE'}</Text>
            </View>
            <View style={styles.planHeader}>
              <View style={[styles.planRadio, selectedPlan === 'yearly' && styles.planRadioActive]}>
                {selectedPlan === 'yearly' ? <View style={styles.planRadioDot} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{t.yearlyPlan || '12 Months'}</Text>
                <Text style={styles.planSaving}>
                  {t.save || 'Save'} 20% — {CURRENCY_SYMBOL}{Number((MONTHLY_PRICE * 12 - YEARLY_TOTAL).toFixed(2))}/{t.yearAbbr || 'year'}
                </Text>
              </View>
            </View>
            <View style={styles.planPriceRow}>
              <Text style={styles.planPrice}>{CURRENCY_SYMBOL}{YEARLY_MONTHLY_PRICE}</Text>
              <Text style={styles.planPeriod}>/{t.monthAbbr || 'month'}</Text>
              <Text style={styles.planOriginal}>{CURRENCY_SYMBOL}{MONTHLY_PRICE}</Text>
            </View>
            <Text style={styles.planTotal}>
              {CURRENCY_SYMBOL}{YEARLY_TOTAL} {t.billedAnnually || 'billed annually'}
            </Text>
          </Pressable>

          {/* Monthly */}
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setSelectedPlan('monthly'); }}
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
          >
            <View style={styles.planHeader}>
              <View style={[styles.planRadio, selectedPlan === 'monthly' && styles.planRadioActive]}>
                {selectedPlan === 'monthly' ? <View style={styles.planRadioDot} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{t.monthlyPlan || '1 Month'}</Text>
                <Text style={styles.planSaving}>{t.flexibleCancelAnytime || 'Flexible, cancel anytime'}</Text>
              </View>
            </View>
            <View style={styles.planPriceRow}>
              <Text style={styles.planPrice}>{CURRENCY_SYMBOL}{MONTHLY_PRICE}</Text>
              <Text style={styles.planPeriod}>/{t.monthAbbr || 'month'}</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Subscribe button */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Pressable
            onPress={handleSubscribe}
            disabled={subscriptionLoading}
            style={({ pressed }) => [
              styles.subscribeBtn,
              pressed && !subscriptionLoading && { transform: [{ scale: 0.97 }] },
              subscriptionLoading && { opacity: 0.7 },
            ]}
          >
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.subscribeGradient}>
              {subscriptionLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.subscribeBtnText}>
                  {selectedPlan === 'yearly'
                    ? `${t.startFreeTrial || 'Start Free Trial'} — ${CURRENCY_SYMBOL}${YEARLY_TOTAL}/${t.yearAbbr || 'year'}`
                    : `${t.startFreeTrial || 'Start Free Trial'} — ${CURRENCY_SYMBOL}${MONTHLY_PRICE}/${t.monthAbbr || 'month'}`
                  }
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Refresh subscription */}
        <Animated.View entering={FadeInDown.duration(500).delay(350)} style={{ alignItems: 'center', marginTop: 16 }}>
          <Pressable
            onPress={handleRefresh}
            disabled={refreshing}
            style={({ pressed }) => [styles.checkStatusBtn, pressed && { opacity: 0.7 }]}
          >
            {refreshing ? (
              <ActivityIndicator color="rgba(255,255,255,0.6)" size="small" />
            ) : (
              <>
                <MaterialIcons name="refresh" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.checkStatusText}>{t.refreshStatus || 'Check Subscription Status'}</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* Terms */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.termsSection}>
          <Text style={styles.termsText}>
            {t.subscriptionTermsWithTrial || `Start with ${STRIPE_CONFIG.trialDays} days free. Payment will be charged via Stripe after trial ends. Cancel anytime before trial expires to avoid charges. Subscription auto-renews unless cancelled.`}
          </Text>
          <View style={styles.paymentIcons}>
            <MaterialIcons name="credit-card" size={18} color="rgba(255,255,255,0.3)" />
            <Text style={styles.paymentText}>Visa, Mastercard, Amex, and more</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1722' },
  header: { paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-start' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  heroSection: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
  heroBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#FFF', letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  trialBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16,185,129,0.12)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, marginTop: 16 },
  trialBannerText: { fontSize: 13, fontWeight: '700', color: '#10B981' },

  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20, backgroundColor: 'rgba(16,185,129,0.1)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignSelf: 'center' },
  secureText: { fontSize: 12, fontWeight: '600', color: '#10B981' },

  featuresSection: { gap: 14, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(91,143,185,0.15)', alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  featureDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 },

  pricingSection: { gap: 12, marginBottom: 24 },
  planCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  planCardActive: { backgroundColor: 'rgba(91,143,185,0.12)', borderColor: theme.primary },
  planBestValue: { alignSelf: 'flex-start', backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 10 },
  planBestValueText: { fontSize: 10, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  planRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  planRadioActive: { borderColor: theme.primary },
  planRadioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.primary },
  planName: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  planSaving: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginLeft: 34 },
  planPrice: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  planPeriod: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  planOriginal: { fontSize: 16, color: 'rgba(255,255,255,0.3)', textDecorationLine: 'line-through', marginLeft: 8 },
  planTotal: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 34, marginTop: 4 },

  subscribeBtn: { borderRadius: 16, overflow: 'hidden', ...theme.shadows.elevated },
  subscribeGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: 16 },
  subscribeBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },

  checkStatusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkStatusText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  termsSection: { alignItems: 'center', marginTop: 16, gap: 12 },
  termsText: { fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 16 },
  paymentIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentText: { fontSize: 11, color: 'rgba(255,255,255,0.25)' },

  // Premium active
  premiumActiveContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  premiumBadge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  premiumActiveTitle: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  premiumActiveSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  premiumExpiry: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, marginTop: 20 },
  manageBtnText: { fontSize: 15, fontWeight: '600', color: theme.primary },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  refreshText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  premiumDoneBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 24, marginTop: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  premiumDoneBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
