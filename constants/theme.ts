// MindSpace — Calm + Serious (Q2) design system
// Soft blues, pastel greens, lavender accents
// Supports light and dark mode

export const lightTheme = {
  // Primary palette
  primary: '#5B8FB9',
  primaryLight: '#8BB8D6',
  primaryDark: '#3A6D94',
  
  // Secondary (pastel green)
  secondary: '#7DB89E',
  secondaryLight: '#A8D4BF',
  secondaryDark: '#5A9A7C',
  
  // Accent (lavender)
  accent: '#9B8EC4',
  accentLight: '#BDB3D8',
  accentDark: '#7A6BA8',
  
  // Backgrounds
  background: '#F5F8FB',
  backgroundSecondary: '#EDF2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Text
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  textTertiary: '#A0AEC0',
  textInverse: '#FFFFFF',
  
  // Functional
  success: '#68D391',
  warning: '#F6AD55',
  error: '#FC8181',
  info: '#63B3ED',
  
  // Mood colors (1-10 scale)
  mood: {
    1: '#E53E3E',
    2: '#ED6444',
    3: '#ED8936',
    4: '#ECC94B',
    5: '#F6E05E',
    6: '#C6F6D5',
    7: '#9AE6B4',
    8: '#68D391',
    9: '#48BB78',
    10: '#38A169',
  } as Record<number, string>,
  
  // Borders
  border: '#E2E8F0',
  borderLight: '#EDF2F7',
  
  // Gradients
  gradients: {
    primary: ['#5B8FB9', '#3A6D94'],
    secondary: ['#7DB89E', '#5A9A7C'],
    accent: ['#9B8EC4', '#7A6BA8'],
    calm: ['#EBF4FF', '#E0F2FE'],
    warm: ['#FFF5F5', '#FED7D7'],
    surface: ['#F5F8FB', '#EDF2F7'],
    hero: ['#5B8FB9', '#9B8EC4'],
  },
  
  // Tab bar
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',

  // Card colors for quick actions
  cardChat: '#E8F4FD',
  cardMeditation: '#E8F9F0',
  cardJournal: '#F0EBFF',
  cardAnalytics: '#FFF5F0',
  cardBreathe: '#E0F2FE',
  cardPremium: '#FDF2F8',

  // Input
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
};

export const darkTheme: typeof lightTheme = {
  primary: '#6BA3CB',
  primaryLight: '#8BB8D6',
  primaryDark: '#4A8DB8',
  
  secondary: '#7DB89E',
  secondaryLight: '#A8D4BF',
  secondaryDark: '#5A9A7C',
  
  accent: '#A99AD0',
  accentLight: '#BDB3D8',
  accentDark: '#8B7CB5',
  
  background: '#0D1117',
  backgroundSecondary: '#161B22',
  surface: '#1C2128',
  surfaceElevated: '#22272E',
  
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  textInverse: '#0D1117',
  
  success: '#56D4A0',
  warning: '#E3A04B',
  error: '#F27878',
  info: '#58A6FF',
  
  mood: {
    1: '#F87171',
    2: '#FB923C',
    3: '#FBBF24',
    4: '#FCD34D',
    5: '#FDE68A',
    6: '#BBF7D0',
    7: '#86EFAC',
    8: '#4ADE80',
    9: '#22C55E',
    10: '#16A34A',
  } as Record<number, string>,
  
  border: '#30363D',
  borderLight: '#21262D',
  
  gradients: {
    primary: ['#6BA3CB', '#4A8DB8'],
    secondary: ['#7DB89E', '#5A9A7C'],
    accent: ['#A99AD0', '#8B7CB5'],
    calm: ['#161B22', '#1C2128'],
    warm: ['#2D1B1B', '#1C1212'],
    surface: ['#0D1117', '#161B22'],
    hero: ['#4A8DB8', '#8B7CB5'],
  },

  tabBarBg: '#161B22',
  tabBarBorder: '#30363D',

  cardChat: '#162230',
  cardMeditation: '#142220',
  cardJournal: '#1E1830',
  cardAnalytics: '#251C15',
  cardBreathe: '#142530',
  cardPremium: '#251520',

  inputBg: '#1C2128',
  inputBorder: '#30363D',
};

// Shared values that don't change between themes
const shared = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  typography: {
    heroValue: { fontSize: 48, fontWeight: '700' as const },
    heroLabel: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 1 },
    title: { fontSize: 28, fontWeight: '700' as const },
    subtitle: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    bodyBold: { fontSize: 16, fontWeight: '600' as const },
    caption: { fontSize: 13, fontWeight: '400' as const },
    small: { fontSize: 11, fontWeight: '500' as const },
    chatMessage: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    moodValue: { fontSize: 56, fontWeight: '700' as const },
    sectionHeader: { fontSize: 18, fontWeight: '700' as const },
  },
  
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    soft: {
      shadowColor: '#5B8FB9',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
  },
};

// Default export is light theme merged with shared for backward compat
const theme = { ...lightTheme, ...shared };

export type ThemeColors = typeof lightTheme;
export type Theme = typeof theme;
export { shared as themeShared };
export default theme;
