import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../contexts/AppContext';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import ErrorBoundary from '../components/ErrorBoundary';
import SplashScreen from '../components/SplashScreen';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const {
    isAppReady,
    incrementNotificationCount,
    addNotificationToHistory,
    clearNotificationCount
  } = useApp();

  const router = useRouter();

  const notificationResponseListener = useRef<Notifications.Subscription | null>(null);
  const notificationReceivedListener = useRef<Notifications.Subscription | null>(null);

 

  // Listen for notifications
  useEffect(() => {
    notificationReceivedListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const content = notification.request.content;
        const data = content.data as any;

        incrementNotificationCount();

        addNotificationToHistory(
          content.title || "MindSpace",
          content.body || "",
          data?.type || "general"
        );
      });

    return () => {
      notificationReceivedListener.current?.remove();
    };
  }, [incrementNotificationCount, addNotificationToHistory]);

  // Notification tap
  useEffect(() => {
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {

        const data = response.notification.request.content.data;

        clearNotificationCount();

        if (!data?.route || !user) return;

        setTimeout(() => {
          router.push(data.route as any);
        }, 300);
      });

    return () => {
      notificationResponseListener.current?.remove();
    };
  }, [user]);

  if (isLoading || !isAppReady) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

function InnerLayout() {
  const { isDarkMode } = useApp();

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="journal-entry" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="mood-checkin" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="breathing" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="mood-analytics" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="meditation" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="subscription" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="crisis-resources" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="achievements" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="weekly-summary" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="sound-library" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="admin-dashboard" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="health-report" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="help-faq" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </AuthGate>
    </>
  );
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <ErrorBoundary>
        <SafeAreaProvider>
          <AuthProvider>
            <AppProvider>
              <InnerLayout />
            </AppProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </AlertProvider>
  );
}