import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { getTranslation } from '../constants/translations';
import { STRIPE_CONFIG } from '../constants/stripe';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  /** Inline variant renders a smaller banner instead of full-screen overlay */
  inline?: boolean;
}

export default function PremiumGate({ children, feature, inline }: PremiumGateProps) {
  const { isPremium, language, colors, country } = useApp();
  const router = useRouter();
  const t = getTranslation(language);

  if (isPremium) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/subscription');
  };

  // Inline banner variant for embedding inside screens
  if (inline) {
    return (
      <Animated.View entering={FadeIn.duration(400)}>
        <Pressable
          onPress={handleUpgrade}
          style={({ pressed }) => [
            styles.inlineContainer,
            { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '30' },
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
          ]}
        >
          <LinearGradient colors={[colors.primary, colors.accent]} style={styles.inlineIcon}>
            <MaterialIcons name="workspace-premium" size={18} color="#FFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inlineTitle, { color: colors.textPrimary }]}>
              {feature ? `${feature} — Premium` : ((t as any).premiumRequired || 'Premium Required')}
            </Text>
            <Text style={[styles.inlineDesc, { color: colors.textSecondary }]}>
              {(t as any).tryFreeForDays || `${STRIPE_CONFIG.trialDays} dages gratis prøveperiode`}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.primary} />
        </Pressable>
      </Animated.View>
    );
  }

  // Full-screen overlay variant
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.content}>
        <LinearGradient colors={[colors.primary, colors.accent]} style={styles.iconCircle}>
          <MaterialIcons name="workspace-premium" size={40} color="#FFF" />
        </LinearGradient>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {(t as any).premiumRequired || 'Premium Required'}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          {(t as any).premiumRequiredDesc || 'This feature requires an active Premium subscription.'}
        </Text>
        {feature ? (
          <View style={[styles.featureBadge, { backgroundColor: colors.primary + '14' }]}>
            <MaterialIcons name="lock" size={14} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.primary }]}>{feature}</Text>
          </View>
        ) : null}

        {/* Trial callout */}
        <View style={[styles.trialBadge, { backgroundColor: colors.success + '14' }]}>
          <MaterialIcons name="card-giftcard" size={16} color={colors.success} />
          <Text style={[styles.trialText, { color: colors.success }]}>
            {(t as any).freeTrialLabel || `${STRIPE_CONFIG.trialDays} dages gratis prøveperiode`}
          </Text>
        </View>

        <Pressable
          onPress={handleUpgrade}
          style={({ pressed }) => [styles.upgradeBtn, pressed && { transform: [{ scale: 0.97 }] }]}
        >
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.upgradeGradient}>
            <MaterialIcons name="workspace-premium" size={20} color="#FFF" />
            <Text style={styles.upgradeBtnText}>
              {(t as any).startFreeTrial || 'Start gratis prøveperiode'}
            </Text>
          </LinearGradient>
        </Pressable>

        <Text style={[styles.priceHint, { color: colors.textTertiary }]}>
          {(t as any).thenFromPrice || `Derefter fra 19 kr/måned`}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  content: { alignItems: 'center', maxWidth: 300 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  desc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  featureBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginBottom: 12 },
  featureText: { fontSize: 13, fontWeight: '600' },
  trialBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginBottom: 20 },
  trialText: { fontSize: 14, fontWeight: '700' },
  upgradeBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  upgradeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  upgradeBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  priceHint: { fontSize: 12, marginTop: 10 },

  // Inline variant
  inlineContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, marginHorizontal: 16, marginVertical: 8 },
  inlineIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inlineTitle: { fontSize: 14, fontWeight: '700' },
  inlineDesc: { fontSize: 12, marginTop: 2 },
});
