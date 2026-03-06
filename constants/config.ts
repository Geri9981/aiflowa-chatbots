export const APP_CONFIG = {
  name: 'MindSpace',
  tagline: 'Your safe space for mental wellness',
  version: '1.0.0',
  
  // Mood scale
  moodScale: {
    min: 1,
    max: 10,
    labels: {
      1: 'Very Low',
      2: 'Low',
      3: 'Struggling',
      4: 'Difficult',
      5: 'Neutral',
      6: 'Okay',
      7: 'Good',
      8: 'Great',
      9: 'Wonderful',
      10: 'Excellent',
    } as Record<number, string>,
    emojis: {
      1: '😢',
      2: '😞',
      3: '😟',
      4: '😕',
      5: '😐',
      6: '🙂',
      7: '😊',
      8: '😄',
      9: '🤩',
      10: '✨',
    } as Record<number, string>,
  },
  
  // Languages
  languages: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'da', name: 'Dansk', flag: '🇩🇰' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  ],

  // Countries with language mapping and currency
  countries: [
    { code: 'DK', name: 'Denmark', flag: '🇩🇰', lang: 'da', currency: 'DKK', symbol: 'kr', monthlyPrice: 19 },
    { code: 'US', name: 'United States', flag: '🇺🇸', lang: 'en', currency: 'USD', symbol: '$', monthlyPrice: 2.79 },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', lang: 'en', currency: 'GBP', symbol: '£', monthlyPrice: 2.19 },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', lang: 'de', currency: 'EUR', symbol: '€', monthlyPrice: 2.49 },
    { code: 'FR', name: 'France', flag: '🇫🇷', lang: 'fr', currency: 'EUR', symbol: '€', monthlyPrice: 2.49 },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', lang: 'es', currency: 'EUR', symbol: '€', monthlyPrice: 2.49 },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪', lang: 'sv', currency: 'SEK', symbol: 'kr', monthlyPrice: 29 },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', lang: 'it', currency: 'EUR', symbol: '€', monthlyPrice: 2.49 },
    { code: 'NO', name: 'Norway', flag: '🇳🇴', lang: 'en', currency: 'NOK', symbol: 'kr', monthlyPrice: 29 },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', lang: 'en', currency: 'EUR', symbol: '€', monthlyPrice: 2.49 },
  ] as const,
  
  // Breathing exercise presets
  breathingExercises: [
    { id: 'box', name: 'Box Breathing', inhale: 4, hold: 4, exhale: 4, holdOut: 4, rounds: 4 },
    { id: '478', name: '4-7-8 Technique', inhale: 4, hold: 7, exhale: 8, holdOut: 0, rounds: 4 },
    { id: 'calm', name: 'Calming Breath', inhale: 5, hold: 2, exhale: 7, holdOut: 0, rounds: 6 },
  ],
  
  // Crisis keywords
  crisisKeywords: ['suicide', 'kill myself', 'end it all', 'self harm', 'want to die', 'hurt myself', 'no reason to live'],
  
  crisisMessage: 'I hear you, and I want you to know that your feelings are valid. But please reach out to a professional who can truly help:\n\n📞 Crisis Hotline: 988 (US)\n📞 Crisis Text Line: Text HOME to 741741\n\nYou are not alone. Help is available 24/7.',
  
  disclaimer: 'MindSpace is a supportive tool, not a replacement for professional therapy. If you\'re in crisis, please contact emergency services or a mental health professional.',
};

export default APP_CONFIG;
