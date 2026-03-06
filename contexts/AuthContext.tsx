import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { getSupabaseClient } from '@/template';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { router } from "expo-router";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  isPremium?: boolean;
  adminPremiumOverride?: boolean;
  subscriptionEnd?: string;
  subscriptionStatus?: string;
}

const ADMIN_EMAIL = 'corneliusbostok@gmail.com';
const FREE_PREMIUM_EMAILS = ['natasja6715@gmail.com'];

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  operationLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsOTP?: boolean }>;
  sendOTP: (email: string) => Promise<{ error: string | null }>;
  verifyOTPAndLogin: (email: string, otp: string, options?: { password?: string }) => Promise<{ error: string | null; user: AuthUser | null }>;
  logout: () => Promise<void>;
  setPremium: (isPremium: boolean, months?: number) => void;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  biometricLogin: () => Promise<boolean>;
  biometricAvailable: boolean;
  hasPreviousUser: boolean;
  checkSubscription: () => Promise<void>;
  startCheckout: (priceId: string) => Promise<{ error?: string }>;
  openCustomerPortal: () => Promise<{ error?: string }>;
  subscriptionLoading: boolean;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasPreviousUser, setHasPreviousUser] = useState(false);
  const supabase = useRef(getSupabaseClient()).current;
  const subCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCheckedSub = useRef(false);

  // Map Supabase user to AuthUser
const mapUser = useCallback(async (supaUser: any): Promise<AuthUser | null> => {

  if (!supaUser) return null;

  const email = supaUser.email || '';
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isFreePremium = FREE_PREMIUM_EMAILS.some(
    e => e.toLowerCase() === email.toLowerCase()
  );

  let profile = null;

  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('username, is_premium, avatar_url')
      .eq('id', supaUser.id)
      .maybeSingle();

    profile = data;

  } catch (error) {
    console.log("Supabase profile fetch failed:", error);
  }

  const dbPremium = profile?.is_premium || false;

  return {
    id: supaUser.id,
    email,
    name: profile?.username || supaUser.user_metadata?.name || email.split('@')[0],
    isAdmin,
    isPremium: isFreePremium || dbPremium,
    adminPremiumOverride: isAdmin ? dbPremium : undefined,
  };

}, [supabase]);

  // Check subscription status via Edge Function
  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: {},
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try { errorMessage = await error.context?.text() || error.message; } catch {}
        }
        console.log('[check-subscription] Error:', errorMessage);
        return;
      }

      if (data) {
        setUser(prev => {
          if (!prev) return prev;
          const isFreePremium = FREE_PREMIUM_EMAILS.some(e => e.toLowerCase() === prev.email.toLowerCase());
          const stripePremium = data.subscribed === true;
          const subStatus = data.status || (stripePremium ? 'active' : 'inactive');
          return {
            ...prev,
            isPremium: isFreePremium || stripePremium || prev.adminPremiumOverride || false,
            subscriptionEnd: data.subscription_end || prev.subscriptionEnd,
            subscriptionStatus: subStatus,
          };
        });
      }
    } catch (e) {
      console.log('[check-subscription] Exception:', e);
    }
  }, [supabase]);

  // Start checkout session
  const startCheckout = useCallback(async (priceId: string): Promise<{ error?: string }> => {
    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try { errorMessage = await error.context?.text() || error.message; } catch {}
        }
        return { error: errorMessage };
      }

      if (data?.url) {
        await Linking.openURL(data.url);
        return {};
      }
      if (data?.error) {
        return { error: data.error };
      }
      return { error: 'No checkout URL returned' };
    } catch (e: any) {
      return { error: e.message || 'Checkout failed' };
    } finally {
      setSubscriptionLoading(false);
    }
  }, [supabase]);

  // Open customer portal
  const openCustomerPortal = useCallback(async (): Promise<{ error?: string }> => {
    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {},
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try { errorMessage = await error.context?.text() || error.message; } catch {}
        }
        return { error: errorMessage };
      }

      if (data?.url) {
        await Linking.openURL(data.url);
        return {};
      }
      return { error: 'No portal URL returned' };
    } catch (e: any) {
      return { error: e.message || 'Portal failed' };
    } finally {
      setSubscriptionLoading(false);
    }
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const mapped = await mapUser(session.user);
          setUser(mapped);
        }

        // Check biometric availability
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(compatible && enrolled);

        const lastUser = await AsyncStorage.getItem('biometric_credentials');
        if (lastUser) setHasPreviousUser(true);
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    init();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const mapped = await mapUser(session.user);
        setUser(mapped);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, mapUser]);

  // Check subscription on login and periodically (every 60s)
  useEffect(() => {
    if (!user?.id) {
      hasCheckedSub.current = false;
      if (subCheckInterval.current) {
        clearInterval(subCheckInterval.current);
        subCheckInterval.current = null;
      }
      return;
    }

    // Only check once on initial login, not on every user state change
    if (!hasCheckedSub.current) {
      hasCheckedSub.current = true;
      checkSubscription();
    }

    // Set up periodic check every 60 seconds
    const interval = setInterval(checkSubscription, 60000);
    subCheckInterval.current = interval;

    return () => {
      clearInterval(interval);
      if (subCheckInterval.current === interval) {
        subCheckInterval.current = null;
      }
    };
  }, [user?.id, checkSubscription]);

  // Listen for deep links (returning from Stripe checkout)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      if (url.includes('subscription/success')) {
        // Refresh subscription status after successful checkout
        setTimeout(checkSubscription, 2000);
        setTimeout(checkSubscription, 5000);
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [checkSubscription]);

  // Login with email/password
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setOperationLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        const mapped = await mapUser(data.user);
        setUser(mapped);
        // Save credentials for biometric
        await AsyncStorage.setItem('biometric_credentials', JSON.stringify({ email: email.trim().toLowerCase(), password }));
        setHasPreviousUser(true);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Login failed' };
    } finally {
      setOperationLoading(false);
    }
  }, [supabase, mapUser]);

  // Sign up with email/password (traditional)
  const signup = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; needsOTP?: boolean }> => {
    setOperationLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user && !data.session) {
        return { success: true, needsOTP: true };
      }
      if (data.user && data.session) {
        const mapped = await mapUser(data.user);
        setUser(mapped);
        await AsyncStorage.setItem('biometric_credentials', JSON.stringify({ email: email.trim().toLowerCase(), password }));
        setHasPreviousUser(true);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Signup failed' };
    } finally {
      setOperationLoading(false);
    }
  }, [supabase, mapUser]);

  // Send OTP
  const sendOTP = useCallback(async (email: string): Promise<{ error: string | null }> => {
    setOperationLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Failed to send OTP' };
    } finally {
      setOperationLoading(false);
    }
  }, [supabase]);

  // Verify OTP and login
  const verifyOTPAndLogin = useCallback(async (
    email: string,
    otp: string,
    options?: { password?: string },
  ): Promise<{ error: string | null; user: AuthUser | null }> => {
    setOperationLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp,
        type: 'email',
      });
      if (error) return { error: error.message, user: null };

      if (options?.password && data.user) {
        await supabase.auth.updateUser({ password: options.password });
      }

      if (data.user) {
        const mapped = await mapUser(data.user);
        setUser(mapped);
        if (options?.password) {
          await AsyncStorage.setItem('biometric_credentials', JSON.stringify({ email: email.trim().toLowerCase(), password: options.password }));
          setHasPreviousUser(true);
        }
        return { error: null, user: mapped };
      }
      return { error: 'Verification failed', user: null };
    } catch (e: any) {
      return { error: e.message || 'Verification failed', user: null };
    } finally {
      setOperationLoading(false);
    }
  }, [supabase, mapUser]);

  // Biometric login
  const biometricLogin = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log in to MindSpace',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (!result.success) return false;

      const stored = await AsyncStorage.getItem('biometric_credentials');
      if (!stored) return false;

      const { email, password } = JSON.parse(stored);
      const { success } = await login(email, password);
      return success;
    } catch {
      return false;
    }
  }, [login]);

  // Logout
  const logout = useCallback(async () => {
  try {
    if (subCheckInterval.current) {
      clearInterval(subCheckInterval.current);
      subCheckInterval.current = null;
    }

    hasCheckedSub.current = false;

    await supabase.auth.signOut();

    setUser(null);

    // 🚀 send direkte til login
    router.replace("/login");

  } catch (error) {
    console.log("Logout error:", error);
  }
}, [supabase]);

  // Set premium (manual admin toggle)
  const setPremium = useCallback(async (isPremium: boolean, months?: number) => {
    if (!user) return;
    await supabase.from('user_profiles').update({ is_premium: isPremium }).eq('id', user.id);
    setUser(prev => prev ? { ...prev, isPremium, adminPremiumOverride: prev.isAdmin ? isPremium : prev.adminPremiumOverride } : null);
  }, [user, supabase]);

  // Reset password
  const resetPassword = useCallback(async (email: string): Promise<{ error: string | null }> => {
    setOperationLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Failed to send reset email' };
    } finally {
      setOperationLoading(false);
    }
  }, [supabase]);

  return (
    <AuthContext.Provider value={{
      user, isLoading, operationLoading,
      login, signup, sendOTP, verifyOTPAndLogin,
      logout, setPremium, resetPassword, biometricLogin, biometricAvailable, hasPreviousUser,
      checkSubscription, startCheckout, openCustomerPortal, subscriptionLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
