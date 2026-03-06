// Achievement definitions and tracking logic

export interface Achievement {
  id: string;
  title: string;
  titleKey: string;
  description: string;
  descKey: string;
  icon: string;
  category: 'mood' | 'meditation' | 'journal' | 'breathing' | 'general';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: number;
  type: 'streak' | 'total' | 'single';
  unlockedAt?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Mood streak achievements
  { id: 'mood-7', title: 'Week Warrior', titleKey: 'achMood7', description: '7-day mood check-in streak', descKey: 'achMood7Desc', icon: 'local-fire-department', category: 'mood', tier: 'bronze', requirement: 7, type: 'streak' },
  { id: 'mood-14', title: 'Fortnight Focus', titleKey: 'achMood14', description: '14-day mood check-in streak', descKey: 'achMood14Desc', icon: 'local-fire-department', category: 'mood', tier: 'silver', requirement: 14, type: 'streak' },
  { id: 'mood-30', title: 'Monthly Master', titleKey: 'achMood30', description: '30-day mood check-in streak', descKey: 'achMood30Desc', icon: 'local-fire-department', category: 'mood', tier: 'gold', requirement: 30, type: 'streak' },
  { id: 'mood-90', title: 'Mindful Legend', titleKey: 'achMood90', description: '90-day mood check-in streak', descKey: 'achMood90Desc', icon: 'emoji-events', category: 'mood', tier: 'platinum', requirement: 90, type: 'streak' },

  // Meditation achievements
  { id: 'med-first', title: 'First Breath', titleKey: 'achMedFirst', description: 'Complete your first meditation', descKey: 'achMedFirstDesc', icon: 'self-improvement', category: 'meditation', tier: 'bronze', requirement: 1, type: 'total' },
  { id: 'med-10', title: 'Calm Seeker', titleKey: 'achMed10', description: 'Complete 10 meditation sessions', descKey: 'achMed10Desc', icon: 'self-improvement', category: 'meditation', tier: 'silver', requirement: 10, type: 'total' },
  { id: 'med-50', title: 'Zen Master', titleKey: 'achMed50', description: 'Complete 50 meditation sessions', descKey: 'achMed50Desc', icon: 'self-improvement', category: 'meditation', tier: 'gold', requirement: 50, type: 'total' },
  { id: 'med-60min', title: 'Deep Dive', titleKey: 'achMed60', description: 'Meditate for 60 total minutes', descKey: 'achMed60Desc', icon: 'timer', category: 'meditation', tier: 'bronze', requirement: 60, type: 'total' },
  { id: 'med-300min', title: 'Inner Peace', titleKey: 'achMed300', description: 'Meditate for 300 total minutes', descKey: 'achMed300Desc', icon: 'timer', category: 'meditation', tier: 'gold', requirement: 300, type: 'total' },
  { id: 'med-streak7', title: 'Meditation Habit', titleKey: 'achMedStreak7', description: '7-day meditation streak', descKey: 'achMedStreak7Desc', icon: 'spa', category: 'meditation', tier: 'silver', requirement: 7, type: 'streak' },

  // Journal achievements
  { id: 'journal-first', title: 'First Words', titleKey: 'achJournalFirst', description: 'Write your first journal entry', descKey: 'achJournalFirstDesc', icon: 'edit', category: 'journal', tier: 'bronze', requirement: 1, type: 'total' },
  { id: 'journal-10', title: 'Storyteller', titleKey: 'achJournal10', description: 'Write 10 journal entries', descKey: 'achJournal10Desc', icon: 'auto-stories', category: 'journal', tier: 'silver', requirement: 10, type: 'total' },
  { id: 'journal-30', title: 'Reflective Soul', titleKey: 'achJournal30', description: 'Write 30 journal entries', descKey: 'achJournal30Desc', icon: 'menu-book', category: 'journal', tier: 'gold', requirement: 30, type: 'total' },
  { id: 'journal-100', title: 'Author of Self', titleKey: 'achJournal100', description: 'Write 100 journal entries', descKey: 'achJournal100Desc', icon: 'workspace-premium', category: 'journal', tier: 'platinum', requirement: 100, type: 'total' },

  // Breathing achievements
  { id: 'breath-first', title: 'Deep Breath', titleKey: 'achBreathFirst', description: 'Complete your first breathing exercise', descKey: 'achBreathFirstDesc', icon: 'air', category: 'breathing', tier: 'bronze', requirement: 1, type: 'total' },
  { id: 'breath-10', title: 'Breath Master', titleKey: 'achBreath10', description: 'Complete 10 breathing exercises', descKey: 'achBreath10Desc', icon: 'air', category: 'breathing', tier: 'silver', requirement: 10, type: 'total' },
  { id: 'breath-50', title: 'Wind Walker', titleKey: 'achBreath50', description: 'Complete 50 breathing exercises', descKey: 'achBreath50Desc', icon: 'air', category: 'breathing', tier: 'gold', requirement: 50, type: 'total' },

  // General
  { id: 'all-streak3', title: 'Triple Threat', titleKey: 'achTriple', description: 'Log mood, journal, and meditate on the same day', descKey: 'achTripleDesc', icon: 'star', category: 'general', tier: 'silver', requirement: 1, type: 'single' },
  { id: 'mood-high5', title: 'High Five', titleKey: 'achHighFive', description: 'Reach a mood score of 8 or above 5 times', descKey: 'achHighFiveDesc', icon: 'mood', category: 'mood', tier: 'silver', requirement: 5, type: 'total' },
];

export const TIER_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string[] }> = {
  bronze: { bg: '#CD7F3218', text: '#CD7F32', border: '#CD7F3240', gradient: ['#CD7F32', '#A0522D'] },
  silver: { bg: '#C0C0C018', text: '#808080', border: '#C0C0C040', gradient: ['#C0C0C0', '#A8A8A8'] },
  gold: { bg: '#FFD70018', text: '#DAA520', border: '#FFD70040', gradient: ['#FFD700', '#FFA500'] },
  platinum: { bg: '#E5E4E218', text: '#7B68EE', border: '#E5E4E240', gradient: ['#7B68EE', '#6A5ACD'] },
};

export interface AchievementProgress {
  unlockedAchievements: string[];
  breathingCompleted: number;
  tripleThreats: number;
  highMoodCount: number;
}

export function checkAchievements(
  moodStreak: number,
  meditationStreak: number,
  totalMeditations: number,
  totalMeditationMinutes: number,
  totalJournalEntries: number,
  breathingCompleted: number,
  tripleThreats: number,
  highMoodCount: number,
  existingUnlocked: string[],
): string[] {
  const newlyUnlocked: string[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (existingUnlocked.includes(ach.id)) continue;

    let progress = 0;

    switch (ach.id) {
      case 'mood-7': case 'mood-14': case 'mood-30': case 'mood-90':
        progress = moodStreak;
        break;
      case 'med-first': case 'med-10': case 'med-50':
        progress = totalMeditations;
        break;
      case 'med-60min': case 'med-300min':
        progress = totalMeditationMinutes;
        break;
      case 'med-streak7':
        progress = meditationStreak;
        break;
      case 'journal-first': case 'journal-10': case 'journal-30': case 'journal-100':
        progress = totalJournalEntries;
        break;
      case 'breath-first': case 'breath-10': case 'breath-50':
        progress = breathingCompleted;
        break;
      case 'all-streak3':
        progress = tripleThreats;
        break;
      case 'mood-high5':
        progress = highMoodCount;
        break;
    }

    if (progress >= ach.requirement) {
      newlyUnlocked.push(ach.id);
    }
  }

  return newlyUnlocked;
}

export function getAchievementProgress(
  ach: Achievement,
  moodStreak: number,
  meditationStreak: number,
  totalMeditations: number,
  totalMeditationMinutes: number,
  totalJournalEntries: number,
  breathingCompleted: number,
  tripleThreats: number,
  highMoodCount: number,
): number {
  switch (ach.id) {
    case 'mood-7': case 'mood-14': case 'mood-30': case 'mood-90':
      return moodStreak;
    case 'med-first': case 'med-10': case 'med-50':
      return totalMeditations;
    case 'med-60min': case 'med-300min':
      return totalMeditationMinutes;
    case 'med-streak7':
      return meditationStreak;
    case 'journal-first': case 'journal-10': case 'journal-30': case 'journal-100':
      return totalJournalEntries;
    case 'breath-first': case 'breath-10': case 'breath-50':
      return breathingCompleted;
    case 'all-streak3':
      return tripleThreats;
    case 'mood-high5':
      return highMoodCount;
    default:
      return 0;
  }
}
