import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { getTranslation } from '../../constants/translations';

function AnimatedTabIcon({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withTiming(focused ? 1.1 : 1, { duration: 200, easing: Easing.out(Easing.ease) });
    opacity.value = withTiming(focused ? 1 : 0.6, { duration: 200 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { language, colors, isPremium, notificationCount } = useApp();
  const t = getTranslation(language);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.select({
            ios: insets.bottom + 60,
            android: insets.bottom + 60,
            default: 70,
          }),
          paddingTop: 8,
          paddingBottom: Platform.select({
            ios: insets.bottom + 8,
            android: insets.bottom + 8,
            default: 8,
          }),
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <View>
                <MaterialIcons name="spa" size={size} color={color} />
                {notificationCount > 0 ? (
                  <View style={{ position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFF', includeFontPadding: false }}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
                  </View>
                ) : null}
              </View>
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t.tabTalk,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <View>
                <MaterialIcons name="chat-bubble-outline" size={size} color={color} />
                {!isPremium ? <View style={{ position: 'absolute', top: -2, right: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="lock" size={7} color="#FFF" /></View> : null}
              </View>
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t.tabJournal,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <MaterialIcons name="auto-stories" size={size} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t.tabProgress,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <MaterialIcons name="insights" size={size} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
    </Tabs>
  );
}
