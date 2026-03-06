import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../contexts/AppContext';

export default function RootIndex() {
  const { user, isLoading } = useAuth();
  const { hasCompletedOnboarding, isAppReady } = useApp();

  if (isLoading || !isAppReady || hasCompletedOnboarding === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#5B8FB9" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});