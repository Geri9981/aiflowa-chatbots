import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getTranslation } from '../constants/translations';

interface SubscriptionBadgeProps {
  /** 'compact' for header, 'card' for profile */
  variant?: 'compact' | 'card';
}

export default function SubscriptionBadge({ variant = 'compact' }: SubscriptionBadgeProps) {
  const { isPremium, language, colors } = useApp();
  const { user } = useAuth();
  const router = useRouter();
  const t = getTranslation(language);

  const statusInfo = useMemo(() => {
    if (!user) return null;

    const subStatus = user.subscriptionStatus;
    const subEnd = user.subscriptionEnd;

    // Calculate days remaining
    let daysRemaining: number | null = null;
    if (subEnd) {
      const endDate = new Date(subEnd);
      const now = new Date();
      daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    if (subStatus === 'trialing') {
      return {
        label: (t as any).trialActive || 'Trial',
        sublabel: daysRemaining !== null ? `${daysRemaining}d left` : '',
        icon: 'card-giftcard' as const,
        gradient: ['#10B981', '#059669'] as [string, string],
        color: '#10B981',
        bgColor: '#10B981' + '14',
      };
    }

    if (subStatus === 'active' || (isPremium && subStatus !== 'canceled')) {
      return {
        label: 'Premium',
        sublabel: daysRemaining !== null ? `${daysRemaining}d` : '',
        icon: 'workspace-premium' as const,
        gradient: ['#F59E0B', '#D97706'] as [string, string],
        color: '#F59E0B',
        bgColor: '#F59E0B' + '14',
      };
    }

    if (subStatus === 'canceled' && daysRemaining !== null && daysRemaining > 0) {
      return {
        label: (t as any).expiring || 'Expiring',
        sublabel: `${daysRemaining}d`,
        icon: 'schedule' as const,
        gradient: ['#EF4444', '#DC2626'] as [string, string],
        color: '#EF4444',
        bgColor: '#EF4444' + '14',
      };
    }

    // Free user or expired
    return null;
  }, [user, isPremium, t]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/subscription');
  };

  // Free users - show upgrade nudge
  if (!statusInfo) {
    if (variant === 'compact') {
      return (
        <Pressable onPress={handlePress} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.compactUpgrade}
          >
            <MaterialIcons name="workspace-premium" size={12} color="#FFF" />
            <Text style={styles.compactUpgradeText}>PRO</Text>
          </LinearGradient>
        </Pressable>
      );
    }

    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Pressable onPress={handlePress} style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
          <View style={[styles.cardFree, { backgroundColor: colors.primary + '0A', borderColor: colors.primary + '25' }]}>
            <LinearGradient colors={[colors.primary, colors.accent]} style={styles.cardFreeIcon}>
              <MaterialIcons name="workspace-premium" size={18} color="#FFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardFreeTitle, { color: colors.textPrimary }]}>
                {(t as any).upgradeToPremium || 'Upgrade to Premium'}
              </Text>
              <Text style={[styles.cardFreeDesc, { color: colors.textSecondary }]}>
                {(t as any).tryFreeForDays || '3 dages gratis prøveperiode'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.primary} />
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Compact header variant
  if (variant === 'compact') {
    return (
      <Pressable onPress={handlePress} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
        <Animated.View entering={FadeIn.duration(300)} style={[styles.compactBadge, { backgroundColor: statusInfo.bgColor }]}>
          <MaterialIcons name={statusInfo.icon} size={13} color={statusInfo.color} />
          <Text style={[styles.compactLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          {statusInfo.sublabel ? (
            <Text style={[styles.compactSub, { color: statusInfo.color }]}>{statusInfo.sublabel}</Text>
          ) : null}
        </Animated.View>
      </Pressable>
    );
  }

  // Card variant for profile
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Pressable onPress={handlePress} style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
        <LinearGradient
          colors={statusInfo.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardPremium}
        >
          <View style={styles.cardPremiumIcon}>
            <MaterialIcons name={statusInfo.icon} size={22} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardPremiumLabel}>{statusInfo.label}</Text>
            {statusInfo.sublabel ? (
              <Text style={styles.cardPremiumSub}>{statusInfo.sublabel} remaining</Text>
            ) : null}
          </View>
          <View style={styles.cardManageBtn}>
            <Text style={styles.cardManageText}>{(t as any).manage || 'Manage'}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Compact variant (header)
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  compactSub: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
  },
  compactUpgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  compactUpgradeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },

  // Card variant (profile) — free users
  cardFree: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cardFreeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFreeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardFreeDesc: {
    fontSize: 12,
    marginTop: 2,
  },

  // Card variant (profile) — premium/trial
  cardPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  cardPremiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPremiumLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  cardPremiumSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  cardManageBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cardManageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
});
