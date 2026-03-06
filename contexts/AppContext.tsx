import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MoodEntry,
  JournalEntry,
  ChatMessage,
  Recommendation,
  Affirmation,
  mockRecommendations,
  affirmationsPool,
  checkForCrisis,
} from '../services/mockData';
import { APP_CONFIG } from '../constants/config';
import { lightTheme, darkTheme, ThemeColors } from '../constants/theme';
import { checkAchievements } from '../services/achievements';
import { scheduleAllNotifications } from '../services/notifications';
import {
  fetchMoodEntries, upsertMoodEntry,
  fetchJournalEntries, insertJournalEntry,
  fetchMeditationSessions, insertMeditationSession,
  fetchBreathingSessions, insertBreathingSession,
  updateUserProfile, fetchUserProfile,
  sendAIChatMessage, uploadAvatarToCloud,
} from '../services/database';
import { useAuth } from '../hooks/useAuth';

export interface MeditationSession {
  id: string;
  date: string;
  duration: number;
  timestamp: number;
}

interface AppState {
  moodHistory: MoodEntry[];
  todayMood: MoodEntry | null;
  logMood: (value: number, note?: string) => void;
  journalEntries: JournalEntry[];
  addJournalEntry: (title: string, content: string, mood?: number, tags?: string[]) => void;
  chatMessages: ChatMessage[];
  sendMessage: (text: string) => void;
  isChatLoading: boolean;
  recommendations: Recommendation[];
  completeRecommendation: (id: string) => void;
  completedRecommendations: string[];
  currentAffirmation: Affirmation;
  nextAffirmation: () => void;
  prevAffirmation: () => void;
  favoriteAffirmations: string[];
  toggleFavoriteAffirmation: (id: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  currentStreak: number;
  weeklyAvgMood: number;
  totalJournalEntries: number;
  meditationSessions: MeditationSession[];
  meditationStreak: number;
  totalMeditationMinutes: number;
  addMeditationSession: (duration: number, sound?: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: ThemeColors;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  diagnosis: string[];
  setDiagnosis: (d: string[]) => void;
  wellnessGoals: string[];
  setWellnessGoals: (g: string[]) => void;
  reminderTime: string;
  setReminderTime: (time: string) => void;
  quoteInterval: string;
  setQuoteInterval: (interval: string) => void;
  quoteTime: string;
  setQuoteTime: (time: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  unlockedAchievements: string[];
  breathingCompleted: number;
  addBreathingCompletion: () => void;
  tripleThreats: number;
  highMoodCount: number;
  newAchievement: string | null;
  clearNewAchievement: () => void;
  avatarUri: string | null;
  setAvatarUri: (uri: string) => void;
  country: string;
  setCountry: (code: string) => void;
  isPremium: boolean;
  notificationCount: number;
  clearNotificationCount: () => void;
  incrementNotificationCount: () => void;
  notificationHistory: { id: string; title: string; body: string; timestamp: number; type: string }[];
  addNotificationToHistory: (title: string, body: string, type: string) => void;
  affirmationFilter: string | null;
  setAffirmationFilter: (cat: string | null) => void;
  filteredAffirmation: typeof import('../services/mockData').affirmationsPool[0];
  nextFilteredAffirmation: () => void;
  prevFilteredAffirmation: () => void;
  refreshCloudData: () => Promise<void>;
  isRefreshing: boolean;
  isAppReady: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {

  const { user } = useAuth();

  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: "Hello! I am MindSpace AI, your personal wellness companion. I am here to listen, support, and help you navigate your emotions. How are you feeling today?",
      sender: 'ai',
      timestamp: Date.now() - 1000,
      quickReplies: ["I am feeling anxious", "I had a good day", "I need someone to talk to"],
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [recommendations] = useState<Recommendation[]>(mockRecommendations);
  const [completedRecommendations, setCompletedRecommendations] = useState<string[]>([]);
  const [language, setLanguageState] = useState<string>('en');
  const [userName, setUserNameState] = useState<string>('');
  const [affirmationIndex, setAffirmationIndex] = useState<number>(0);
  const [favoriteAffirmations, setFavoriteAffirmations] = useState<string[]>([]);
  const [meditationSessions, setMeditationSessions] = useState<MeditationSession[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [diagnosis, setDiagnosisState] = useState<string[]>([]);
  const [wellnessGoals, setWellnessGoalsState] = useState<string[]>([]);
  const [reminderTime, setReminderTimeState] = useState<string>('09:00');
  const [quoteInterval, setQuoteIntervalState] = useState<string>('daily');
  const [quoteTime, setQuoteTimeState] = useState<string>('08:00');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [breathingCompleted, setBreathingCompleted] = useState(0);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);
  const [country, setCountryState] = useState<string>('DK');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationHistory, setNotificationHistory] = useState<{ id: string; title: string; body: string; timestamp: number; type: string }[]>([]);
  const [affirmationFilter, setAffirmationFilterState] = useState<string | null>(null);
  const [filteredIndex, setFilteredIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  const colors = isDarkMode ? darkTheme : lightTheme;

  // Load local-only preferences from AsyncStorage
  useEffect(() => {
    const loadLocal = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('language');
        if (storedLang) setLanguageState(storedLang);
        const storedName = await AsyncStorage.getItem('userName');
        if (storedName) setUserNameState(storedName);
        const storedCompleted = await AsyncStorage.getItem('completedRecs');
        if (storedCompleted) setCompletedRecommendations(JSON.parse(storedCompleted));
        const storedFavAff = await AsyncStorage.getItem('favoriteAffirmations');
        if (storedFavAff) setFavoriteAffirmations(JSON.parse(storedFavAff));
        const storedDarkMode = await AsyncStorage.getItem('darkMode');
        if (storedDarkMode) setIsDarkMode(JSON.parse(storedDarkMode));
        const storedOnboarding = await AsyncStorage.getItem('onboardingComplete');
        setHasCompletedOnboarding(storedOnboarding === "true");
        const storedReminder = await AsyncStorage.getItem('reminderTime');
        if (storedReminder) setReminderTimeState(storedReminder);
        const storedQuoteInterval = await AsyncStorage.getItem('quoteInterval');
        if (storedQuoteInterval) setQuoteIntervalState(storedQuoteInterval);
        const storedQuoteTime = await AsyncStorage.getItem('quoteTime');
        if (storedQuoteTime) setQuoteTimeState(storedQuoteTime);
        const storedNotifEnabled = await AsyncStorage.getItem('notificationsEnabled');
        if (storedNotifEnabled) setNotificationsEnabledState(JSON.parse(storedNotifEnabled));
        const storedAchievements = await AsyncStorage.getItem('unlockedAchievements');
        if (storedAchievements) setUnlockedAchievements(JSON.parse(storedAchievements));
        const storedAvatar = await AsyncStorage.getItem('avatarUri');
        if (storedAvatar) setAvatarUriState(storedAvatar);
        const storedCountry = await AsyncStorage.getItem('country');
        if (storedCountry) setCountryState(storedCountry);
        const storedNotifHistory = await AsyncStorage.getItem('notificationHistory');
        if (storedNotifHistory) { try { setNotificationHistory(JSON.parse(storedNotifHistory)); } catch {} }
        const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % affirmationsPool.length;
        setAffirmationIndex(dayIndex);
      } catch (e) { /* use defaults */ } finally {
        setIsAppReady(true);
      }
    };
    loadLocal();
  }, []);

  // Load cloud data when user logs in
  useEffect(() => {
    if (!user?.id) {
      // User logged out — clear cloud data
      setMoodHistory([]);
      setJournalEntries([]);
      setMeditationSessions([]);
      setBreathingCompleted(0);
      setDiagnosisState([]);
      setWellnessGoalsState([]);
      setDataLoaded(true);
      return;
    }

    const loadCloudData = async () => {
      try {
        // Fetch all user data from database in parallel
        const [moods, journals, meditations, breathings, profile] = await Promise.all([
          fetchMoodEntries(user.id),
          fetchJournalEntries(user.id),
          fetchMeditationSessions(user.id),
          fetchBreathingSessions(user.id),
          fetchUserProfile(user.id),
        ]);

        // Map mood entries with safe date parsing
        setMoodHistory((moods || []).map((m: any) => {
          let ts = Date.now();
          try { ts = new Date(m.created_at).getTime(); if (isNaN(ts)) ts = Date.now(); } catch { /* use default */ }
          return { id: m.id, date: m.date || '', value: m.value || 0, note: m.note, timestamp: ts };
        }));

        // Map journal entries with safe date parsing
        setJournalEntries((journals || []).map((j: any) => {
          let ts = Date.now();
          try { ts = new Date(j.created_at).getTime(); if (isNaN(ts)) ts = Date.now(); } catch { /* use default */ }
          return { id: j.id, date: j.date || '', title: j.title || '', content: j.content || '', mood: j.mood, tags: j.tags || [], aiInsight: j.ai_insight, timestamp: ts };
        }));

        // Map meditation sessions with safe date parsing
        setMeditationSessions((meditations || []).map((s: any) => {
          let ts = Date.now();
          try { ts = new Date(s.created_at).getTime(); if (isNaN(ts)) ts = Date.now(); } catch { /* use default */ }
          return { id: s.id, date: s.date || '', duration: s.duration || 0, timestamp: ts };
        }));

        // Breathing count
        setBreathingCompleted((breathings || []).length);

        // Profile data
        if (profile) {
          if (profile.diagnosis?.length) setDiagnosisState(profile.diagnosis);
          if (profile.wellness_goals?.length) setWellnessGoalsState(profile.wellness_goals);
          if (profile.language) setLanguageState(profile.language);
          if (profile.username) setUserNameState(profile.username);
          if (profile.avatar_url) setAvatarUriState(profile.avatar_url);
          if (profile.country) { setCountryState(profile.country); AsyncStorage.setItem('country', profile.country); }
        }

        setDataLoaded(true);
      } catch (e) {
        console.error('Failed to load cloud data:', e);
        setDataLoaded(true);
      }
    };

    loadCloudData();
  }, [user?.id]);

  // Persist local preferences
  useEffect(() => {
  const save = async () => {
    await AsyncStorage.setItem(
      'completedRecs',
      JSON.stringify(completedRecommendations)
    );
  };

  save();
}, [completedRecommendations]);

  // Today's mood
  const today = new Date().toISOString().split('T')[0];
  const todayMood = moodHistory.find(m => m.date === today) || null;
  const currentAffirmation = affirmationsPool[affirmationIndex % affirmationsPool.length];

  const nextAffirmation = useCallback(() => {
    setAffirmationIndex(prev => (prev + 1) % affirmationsPool.length);
  }, []);

  const prevAffirmation = useCallback(() => {
    setAffirmationIndex(prev => (prev - 1 + affirmationsPool.length) % affirmationsPool.length);
  }, []);

  const toggleFavoriteAffirmation = useCallback((id: string) => {
    setFavoriteAffirmations(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  // Notification count
  const clearNotificationCount = useCallback(() => setNotificationCount(0), []);
  const incrementNotificationCount = useCallback(() => setNotificationCount(prev => prev + 1), []);
  const addNotificationToHistory = useCallback((title: string, body: string, type: string) => {
    setNotificationHistory(prev => {
      const entry = { id: `n-${Date.now()}`, title, body, timestamp: Date.now(), type };
      const updated = [entry, ...prev].slice(0, 20); // Keep last 20
      AsyncStorage.setItem('notificationHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Affirmation category filter
  const filteredPool = affirmationFilter
    ? affirmationsPool.filter(a => a.category === affirmationFilter)
    : affirmationsPool;
  const filteredAffirmation = affirmationFilter
    ? filteredPool[filteredIndex % Math.max(1, filteredPool.length)]
    : currentAffirmation;

  const setAffirmationFilter = useCallback((cat: string | null) => {
    setAffirmationFilterState(cat);
    setFilteredIndex(0);
  }, []);

  const nextFilteredAffirmation = useCallback(() => {
    if (affirmationFilter) {
      setFilteredIndex(prev => (prev + 1) % Math.max(1, filteredPool.length));
    } else {
      nextAffirmation();
    }
  }, [affirmationFilter, filteredPool.length, nextAffirmation]);

  const prevFilteredAffirmation = useCallback(() => {
    if (affirmationFilter) {
      setFilteredIndex(prev => (prev - 1 + filteredPool.length) % Math.max(1, filteredPool.length));
    } else {
      prevAffirmation();
    }
  }, [affirmationFilter, filteredPool.length, prevAffirmation]);

  // Calculate meditation streak
  const meditationStreak = (() => {
    let streak = 0;
    const uniqueDates = [...new Set(meditationSessions.map(s => s.date))].sort().reverse();
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      if (uniqueDates.includes(expected.toISOString().split('T')[0])) { streak++; } else { break; }
    }
    return streak;
  })();

  const totalMeditationMinutes = meditationSessions.reduce((sum, s) => sum + s.duration, 0);

  // Calculate mood streak
  const sortedMoods = [...moodHistory].sort((a, b) => b.timestamp - a.timestamp);
  let currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (sortedMoods.some(m => m.date === expected.toISOString().split('T')[0])) { currentStreak++; } else { break; }
  }

  const tripleThreats = (() => {
    const moodDates = new Set(moodHistory.map(m => m.date));
    const journalDates = new Set(journalEntries.map(j => j.date));
    const medDates = new Set(meditationSessions.map(s => s.date));
    let count = 0;
    moodDates.forEach(d => { if (journalDates.has(d) && medDates.has(d)) count++; });
    return count;
  })();

  const highMoodCount = moodHistory.filter(m => m.value >= 8).length;

  // Achievement check
   const runAchievementCheck = useCallback(() => {

  const newlyUnlocked = checkAchievements(
    currentStreak,
    meditationStreak,
    meditationSessions.length,
    totalMeditationMinutes,
    journalEntries.length,
    breathingCompleted,
    tripleThreats,
    highMoodCount,
    unlockedAchievements
  );

  if (newlyUnlocked.length === 0) return;

  setUnlockedAchievements(prev => [...prev, ...newlyUnlocked]);
  setNewAchievement(newlyUnlocked[0]);

}, [
  currentStreak,
  meditationStreak,
  meditationSessions.length,
  totalMeditationMinutes,
  journalEntries.length,
  breathingCompleted,
  tripleThreats,
  highMoodCount,
  unlockedAchievements
]);

useEffect(() => {
  if (!dataLoaded) return;
  runAchievementCheck();
}, [dataLoaded]);

  const clearNewAchievement = useCallback(() => { setNewAchievement(null); }, []);

  // ─── Cloud-connected actions ───

  const logMood = useCallback((value: number, note?: string) => {
    const entry: MoodEntry = { id: `m-${Date.now()}`, date: today, value, note, timestamp: Date.now() };
    setMoodHistory(prev => {
      const filtered = prev.filter(m => m.date !== today);
      return [entry, ...filtered];
    });
    // Persist to cloud
    if (user?.id) {
      upsertMoodEntry(user.id, value, note).then(data => {
        if (data) setMoodHistory(prev => prev.map(m => m.date === today && m.id.startsWith('m-') ? { ...m, id: data.id } : m));
      });
    }
  }, [today, user?.id]);

  const addJournalEntry = useCallback((title: string, content: string, mood?: number, tags: string[] = []) => {
    const insights = [
      'Your writing shows self-awareness and emotional depth.',
      'I notice themes of growth in your words.',
      'Your reflection shows courage.',
      'There is a pattern of strength in your entries.',
      'Writing about this is itself a form of healing.',
    ];
    const aiInsight = insights[Math.floor(Math.random() * insights.length)];
    const entry: JournalEntry = { id: `j-${Date.now()}`, date: today, title, content, aiInsight, mood, tags, timestamp: Date.now() };
    setJournalEntries(prev => [entry, ...prev]);
    // Persist to cloud
    if (user?.id) {
      insertJournalEntry(user.id, title, content, mood, tags, aiInsight).then(data => {
        if (data) setJournalEntries(prev => prev.map(j => j.id === entry.id ? { ...j, id: data.id } : j));
      });
    }
  }, [today, user?.id]);

  const addMeditationSession = useCallback((duration: number, sound?: string) => {
    const session: MeditationSession = { id: `med-${Date.now()}`, date: today, duration, timestamp: Date.now() };
    setMeditationSessions(prev => [session, ...prev]);
    if (user?.id) {
      insertMeditationSession(user.id, duration, sound).then(data => {
        if (data) setMeditationSessions(prev => prev.map(s => s.id === session.id ? { ...s, id: data.id } : s));
      });
    }
  }, [today, user?.id]);

  const addBreathingCompletion = useCallback(() => {
    setBreathingCompleted(prev => prev + 1);
    if (user?.id) {
      insertBreathingSession(user.id, 4);
    }
  }, [user?.id]);

  // ─── AI Chat (real) ───

  const sendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, text, sender: 'user', timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    // Check for crisis first
    const isCrisis = checkForCrisis(text);
    if (isCrisis) {
      const crisisMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        text: APP_CONFIG.crisisMessage,
        sender: 'ai',
        timestamp: Date.now() + 500,
        quickReplies: ["I will reach out for help", "Thank you for caring", "Can we keep talking?"],
      };
      setTimeout(() => {
        setChatMessages(p => [...p, crisisMsg]);
        setIsChatLoading(false);
      }, 500);
      return;
    }

    // Send to AI — get latest messages for context
    setChatMessages(currentMsgs => {
      const withUser = [...currentMsgs];
      const recentMessages = withUser.slice(-20).map(m => ({ sender: m.sender, text: m.text }));
      sendAIChatMessage(recentMessages, diagnosis, wellnessGoals, language).then(response => {
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          text: response.text,
          sender: 'ai',
          timestamp: Date.now(),
          quickReplies: response.quickReplies,
        };
        setChatMessages(p => [...p, aiMsg]);
        setIsChatLoading(false);
      });
      return withUser; // return unchanged to avoid double-adding
    });
  }, [diagnosis, wellnessGoals, language]);

  const completeRecommendation = useCallback((id: string) => {
    setCompletedRecommendations(prev => [...prev, id]);
  }, []);

  // Settings
  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    AsyncStorage.setItem('language', lang);
    if (user?.id) updateUserProfile(user.id, { language: lang });
  }, [user?.id]);

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    AsyncStorage.setItem('userName', name);
    if (user?.id) updateUserProfile(user.id, { username: name });
  }, [user?.id]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => { const next = !prev; AsyncStorage.setItem('darkMode', JSON.stringify(next)); return next; });
  }, []);

  const completeOnboarding = useCallback(async () => {
  try {
    await AsyncStorage.setItem("onboardingComplete", "true");
    setHasCompletedOnboarding(true);
  } catch (e) {
    console.log("Failed to save onboarding:", e);
  }
}, []);

  const setDiagnosis = useCallback((d: string[]) => {
    setDiagnosisState(d);
    AsyncStorage.setItem('diagnosis', JSON.stringify(d));
    if (user?.id) updateUserProfile(user.id, { diagnosis: d });
  }, [user?.id]);

  const setWellnessGoals = useCallback((g: string[]) => {
    setWellnessGoalsState(g);
    AsyncStorage.setItem('wellnessGoals', JSON.stringify(g));
    if (user?.id) updateUserProfile(user.id, { wellness_goals: g });
  }, [user?.id]);

  const setReminderTime = useCallback((time: string) => {
    setReminderTimeState(time); AsyncStorage.setItem('reminderTime', time);
  }, []);
  const setQuoteInterval = useCallback((interval: string) => {
    setQuoteIntervalState(interval); AsyncStorage.setItem('quoteInterval', interval);
  }, []);
  const setQuoteTime = useCallback((time: string) => {
    setQuoteTimeState(time); AsyncStorage.setItem('quoteTime', time);
  }, []);
  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    AsyncStorage.setItem('notificationsEnabled', JSON.stringify(enabled));
    scheduleAllNotifications(enabled, reminderTime, quoteInterval, quoteTime);
  }, [reminderTime, quoteInterval, quoteTime]);

  const setAvatarUri = useCallback((uri: string) => {
    setAvatarUriState(uri); AsyncStorage.setItem('avatarUri', uri);
    // Upload to cloud storage
    if (user?.id && uri && !uri.startsWith('http')) {
      uploadAvatarToCloud(user.id, uri).then(publicUrl => {
        if (publicUrl) {
          setAvatarUriState(publicUrl);
          AsyncStorage.setItem('avatarUri', publicUrl);
          updateUserProfile(user.id, { avatar_url: publicUrl });
        }
      });
    }
  }, [user?.id]);

  const setCountry = useCallback((code: string) => {
    setCountryState(code);
    AsyncStorage.setItem('country', code);
    if (user?.id) updateUserProfile(user.id, { country: code });
  }, [user?.id]);

  const isPremium = user?.isPremium || false;

  // Pull-to-refresh: reload all cloud data
  const refreshCloudData = useCallback(async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    try {
      const [moods, journals, meditations, breathings] = await Promise.all([
        fetchMoodEntries(user.id),
        fetchJournalEntries(user.id),
        fetchMeditationSessions(user.id),
        fetchBreathingSessions(user.id),
      ]);

      setMoodHistory((moods || []).map((m: any) => {
        let ts = Date.now();
        try { ts = new Date(m.created_at).getTime(); if (isNaN(ts)) ts = Date.now(); } catch { /* default */ }
        return { id: m.id, date: m.date || '', value: m.value || 0, note: m.note, timestamp: ts };
      }));

      setJournalEntries((journals || []).map((j: any) => {
        let ts = Date.now();
        try { ts = new Date(j.created_at).getTime(); if (isNaN(ts)) ts = Date.now(); } catch { /* default */ }
        return { id: j.id, date: j.date || '', title: j.title || '', content: j.content || '', mood: j.mood, tags: j.tags || [], aiInsight: j.ai_insight, timestamp: ts };
      }));

      setMeditationSessions((meditations || []).map((s: any) => {
        let ts = Date.now();
        try { ts = new Date(s.created_at).getTime(); if (isNaN(ts)) ts = Date.now(); } catch { /* default */ }
        return { id: s.id, date: s.date || '', duration: s.duration || 0, timestamp: ts };
      }));

      setBreathingCompleted((breathings || []).length);
    } catch (e) {
      console.error('Refresh cloud data error:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  // Weekly avg
  const last7 = moodHistory.filter(m => {
    try {
      const d = new Date(m.date + 'T12:00:00');
      if (isNaN(d.getTime())) return false;
      const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    } catch { return false; }
  });
  const weeklyAvgMood = last7.length > 0 ? Math.round((last7.reduce((sum, m) => sum + m.value, 0) / last7.length) * 10) / 10 : 0;

  return (
    <AppContext.Provider value={{
      moodHistory, todayMood, logMood,
      journalEntries, addJournalEntry,
      chatMessages, sendMessage, isChatLoading,
      recommendations, completeRecommendation, completedRecommendations,
      currentAffirmation, nextAffirmation, prevAffirmation,
      favoriteAffirmations, toggleFavoriteAffirmation,
      language, setLanguage, userName, setUserName,
      currentStreak, weeklyAvgMood,
      totalJournalEntries: journalEntries.length,
      meditationSessions, meditationStreak, totalMeditationMinutes, addMeditationSession,
      isDarkMode, toggleDarkMode, colors,
      hasCompletedOnboarding, completeOnboarding,
      diagnosis, setDiagnosis, wellnessGoals, setWellnessGoals,
      reminderTime, setReminderTime, quoteInterval, setQuoteInterval, quoteTime, setQuoteTime,
      notificationsEnabled, setNotificationsEnabled,
      unlockedAchievements, breathingCompleted, addBreathingCompletion,
      tripleThreats, highMoodCount, newAchievement, clearNewAchievement,
      avatarUri, setAvatarUri,
      country, setCountry, isPremium,
      notificationCount, clearNotificationCount, incrementNotificationCount,
      notificationHistory, addNotificationToHistory,
      affirmationFilter, setAffirmationFilter, filteredAffirmation,
      nextFilteredAffirmation, prevFilteredAffirmation,
      refreshCloudData, isRefreshing, isAppReady,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
