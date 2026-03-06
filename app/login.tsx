import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import theme from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from "expo-router";

type AuthMode = 'login' | 'signup' | 'otp' | 'forgot';

export default function LoginScreen() {

  const router = useRouter();

  const {
    login, signup, sendOTP, verifyOTPAndLogin, resetPassword,
    biometricLogin, biometricAvailable, hasPreviousUser, operationLoading,
  } = useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
  setError('');

  if (!email.trim() || !password.trim()) {
    setError('Please fill in all fields');
    return;
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const result = await login(email.trim(), password);

  if (!result.success) {
    setError(result.error || 'Invalid email or password');
    return;
  }

  // LOGIN SUCCESS
  router.replace("/");
};

  const handleSignup = async () => {
    setError('');
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Send OTP for email verification
    const otpResult = await sendOTP(email.trim());
    if (otpResult.error) { setError(otpResult.error); return; }

    setSignupPassword(password);
    setMode('otp');
    showAlert('Verification Code Sent', `A 4-digit code has been sent to ${email.trim()}`);
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (!otp.trim() || otp.trim().length < 4) { setError('Please enter the 4-digit code'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await verifyOTPAndLogin(email.trim(), otp.trim(), { password: signupPassword });
    if (result.error) setError(result.error);
    // If success, AuthRouter handles navigation
  };

  const handleResendOTP = async () => {
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await sendOTP(email.trim());
    if (result.error) setError(result.error);
    else showAlert('Code Resent', 'A new verification code has been sent to your email');
  };

  const handleForgotPassword = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email address'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await resetPassword(email.trim());
    if (result.error) { setError(result.error); return; }
    showAlert('Reset Email Sent', `A password reset link has been sent to ${email.trim()}. Check your inbox.`);
    setMode('login');
  };

  // Forgot password screen
  if (mode === 'forgot') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#EBF4FF', '#F0EBFF', '#E8F9F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Pressable onPress={() => setMode('login')} style={styles.otpBackBtn}>
                <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
              </Pressable>

              <Animated.View entering={FadeInDown.duration(500)} style={styles.otpSection}>
                <View style={styles.otpIconCircle}>
                  <MaterialIcons name="lock-reset" size={40} color={theme.primary} />
                </View>
                <Text style={styles.otpTitle}>Forgot Password</Text>
                <Text style={[styles.otpSubtitle, { paddingHorizontal: 20 }]}>Enter your email and we will send you a link to reset your password</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="mail-outline" size={20} color={theme.textTertiary} />
                    <TextInput style={styles.textInput} placeholder="Enter your email" placeholderTextColor={theme.textTertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoFocus />
                  </View>
                </View>

                {error ? (
                  <Animated.View entering={FadeInDown.duration(200)} style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={16} color={theme.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                ) : null}

                <Pressable onPress={handleForgotPassword} disabled={operationLoading} style={({ pressed }) => [styles.submitButton, pressed && !operationLoading && { transform: [{ scale: 0.97 }] }, operationLoading && { opacity: 0.7 }]}>
                  <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.submitGradient}>
                    {operationLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Send Reset Link</Text>}
                  </LinearGradient>
                </Pressable>

                <Pressable onPress={() => { setError(''); setMode('login'); }} style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary }}>Back to Sign In</Text>
                </Pressable>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // OTP verification screen
  if (mode === 'otp') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#EBF4FF', '#F0EBFF', '#E8F9F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Pressable onPress={() => setMode('signup')} style={styles.otpBackBtn}>
                <MaterialIcons name="arrow-back" size={24} color={theme.textSecondary} />
              </Pressable>

              <Animated.View entering={FadeInDown.duration(500)} style={styles.otpSection}>
                <View style={styles.otpIconCircle}>
                  <MaterialIcons name="mark-email-read" size={40} color={theme.primary} />
                </View>
                <Text style={styles.otpTitle}>Verify Your Email</Text>
                <Text style={styles.otpSubtitle}>Enter the 4-digit code sent to</Text>
                <Text style={styles.otpEmail}>{email.trim()}</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.formSection}>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="pin" size={20} color={theme.textTertiary} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter 4-digit code"
                    placeholderTextColor={theme.textTertiary}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={4}
                    autoFocus
                  />
                </View>

                {error ? (
                  <Animated.View entering={FadeInDown.duration(200)} style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={16} color={theme.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                ) : null}

                <Pressable onPress={handleVerifyOTP} disabled={operationLoading} style={({ pressed }) => [styles.submitButton, pressed && !operationLoading && { transform: [{ scale: 0.97 }] }, operationLoading && { opacity: 0.7 }]}>
                  <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.submitGradient}>
                    {operationLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Verify and Create Account</Text>}
                  </LinearGradient>
                </Pressable>

                <Pressable onPress={handleResendOTP} disabled={operationLoading} style={styles.resendBtn}>
                  <Text style={styles.resendText}>Did not receive a code? <Text style={{ fontWeight: '700', color: theme.primary }}>Resend</Text></Text>
                </Pressable>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // Login / Signup screen
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EBF4FF', '#F0EBFF', '#E8F9F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Biometric Quick Login */}
            {biometricAvailable && hasPreviousUser && mode === 'login' ? (
              <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.biometricSection}>
                  <Pressable
  onPress={async () => {
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const success = await biometricLogin();

    if (!success) {
      setError('Biometric authentication failed');
      return;
    }

    router.replace("/");
  }}
  disabled={operationLoading}
  style={({ pressed }) => [
    styles.biometricButton,
    pressed && { transform: [{ scale: 0.97 }] },
    operationLoading && { opacity: 0.6 }
  ]}
>
                  style={({ pressed }) => [styles.biometricButton, pressed && { transform: [{ scale: 0.97 }] }, operationLoading && { opacity: 0.6 }]}
                >
                  <View style={styles.biometricIconCircle}>
                    <MaterialIcons name="fingerprint" size={32} color={theme.primary} />
                  </View>
                  <Text style={styles.biometricText}>Sign in with Face ID / Fingerprint</Text>
                  <Text style={styles.biometricHint}>Quick and secure</Text>
                </Pressable>
                <View style={styles.biometricDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or sign in with email</Text>
                  <View style={styles.dividerLine} />
                </View>
              </Animated.View>
            ) : null}

            {/* Hero */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroSection}>
              <Image source={require('../assets/images/login-hero.png')} style={styles.heroImage} contentFit="contain" transition={200} />
            </Animated.View>

            {/* Title */}
            <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.titleSection}>
              <Text style={styles.title}>{mode === 'signup' ? 'Create Account' : 'Welcome to'}</Text>
              {mode === 'login' ? <Text style={styles.brandName}>MindSpace</Text> : null}
              <Text style={styles.subtitle}>Your safe space for mental wellness</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail-outline" size={20} color={theme.textTertiary} />
                  <TextInput style={styles.textInput} placeholder="Enter your email" placeholderTextColor={theme.textTertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={20} color={theme.textTertiary} />
                  <TextInput style={styles.textInput} placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Enter your password'} placeholderTextColor={theme.textTertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={theme.textTertiary} />
                  </Pressable>
                </View>
              </View>

              {mode === 'signup' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock-outline" size={20} color={theme.textTertiary} />
                    <TextInput style={styles.textInput} placeholder="Re-enter your password" placeholderTextColor={theme.textTertiary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
                  </View>
                </View>
              ) : null}

              {mode === 'login' ? (
                <Pressable onPress={() => { setError(''); setMode('forgot'); }} style={{ alignSelf: 'flex-end', paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>Forgot Password?</Text>
                </Pressable>
              ) : null}

              {error ? (
                <Animated.View entering={FadeInDown.duration(200)} style={styles.errorRow}>
                  <MaterialIcons name="error-outline" size={16} color={theme.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              <Pressable
                onPress={mode === 'login' ? handleLogin : handleSignup}
                disabled={operationLoading}
                style={({ pressed }) => [styles.submitButton, pressed && !operationLoading && { transform: [{ scale: 0.97 }] }, operationLoading && { opacity: 0.7 }]}
              >
                <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.submitGradient}>
                  {operationLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Switch */}
            <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.switchSection}>
              <Text style={styles.switchText}>{mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}</Text>
              <Pressable onPress={() => { Haptics.selectionAsync(); setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setConfirmPassword(''); }}>
                <Text style={styles.switchLink}>{mode === 'signup' ? 'Sign In' : 'Create Account'}</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  heroSection: { alignItems: 'center', marginTop: 16 },
  heroImage: { width: 160, height: 160 },
  titleSection: { alignItems: 'center', marginTop: 12 },
  title: { fontSize: 18, fontWeight: '500', color: theme.textSecondary },
  brandName: { fontSize: 32, fontWeight: '700', color: theme.primary, marginTop: 2, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 6 },
  formSection: { marginTop: 24, gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: theme.border, gap: 10 },
  textInput: { flex: 1, fontSize: 15, color: theme.textPrimary, padding: 0 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  errorText: { fontSize: 13, color: theme.error, fontWeight: '500' },
  submitButton: { borderRadius: 14, overflow: 'hidden', marginTop: 4, ...theme.shadows.soft },
  submitGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  submitText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  switchSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
  switchText: { fontSize: 14, color: theme.textSecondary },
  switchLink: { fontSize: 14, fontWeight: '700', color: theme.primary },
  biometricSection: { alignItems: 'center', marginTop: 8, marginBottom: 4 },
  biometricButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 22, paddingHorizontal: 24, width: '100%', borderWidth: 1.5, borderColor: theme.primary + '30', ...theme.shadows.card },
  biometricIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  biometricText: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
  biometricHint: { fontSize: 13, color: theme.textSecondary },
  biometricDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, width: '100%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { fontSize: 12, color: theme.textTertiary, fontWeight: '500' },
  // OTP
  otpBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginTop: 8, ...theme.shadows.card },
  otpSection: { alignItems: 'center', marginTop: 32, marginBottom: 24 },
  otpIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primary + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  otpTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary },
  otpSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 8 },
  otpEmail: { fontSize: 15, fontWeight: '600', color: theme.primary, marginTop: 4 },
  resendBtn: { alignItems: 'center', paddingVertical: 12 },
  resendText: { fontSize: 14, color: theme.textSecondary },
});
