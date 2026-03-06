// Ambient sound URLs for meditation and sound library
// Uses multiple CDN sources with fallback logic for reliability

// Primary URLs — chosen to actually match the label content
const PRIMARY_URLS: Record<string, string> = {
  // Rain — gentle rain recording
  rain: 'https://archive.org/download/naturesounds-soundtheraphy/Light%20Gentle%20Rain.mp3',
  // Thunderstorm — rain + thunder
  thunderstorm: 'https://archive.org/download/RelaxingRainAndLoudThunderFreeFieldRecordingOfNatureSoundsForSleepOrMeditation/Relaxing%20Rain%20and%20Loud%20Thunder%20%28Free%20Field%20Recording%20of%20Nature%20Sounds%20for%20Sleep%20or%20Meditation%20Mp3%29.mp3',
  // Ocean — ocean shoreline waves
  ocean: 'https://archive.org/download/kundalini-new-age-anthology/108.%20Sea%20Tranquility%20Academy%20-%20Ocen%20Shoreline%20In%20the%20Afternoon.mp3',
  // Forest — birdsong + stream in a forest setting
  forest: 'https://archive.org/download/naturesounds-soundtheraphy/Relaxing%20Nature%20Sounds%20-%20Trickling%20Stream%20Sounds%20%26%20Birds.mp3',
  // Fireplace — crackling fire sound
  fireplace: 'https://archive.org/download/kundalini-new-age-anthology/119.%20Spa%20Music%20Paradise%20Zone%20-%20Flame%20at%20the%20Wind%20Spa%20Dreams.mp3',
  // Wind — rain with wind ambient
  wind: 'https://archive.org/download/Red_Library_Nature_Rain/R23-35-Rain%20with%20Wind.mp3',
  // Birds — pure birdsong morning
  birds: 'https://archive.org/download/naturesounds-soundtheraphy/Relaxing%20Nature%20Sounds%20-%20Birdsong%20Sound.mp3',
  // River — river in forest ambient
  river: 'https://archive.org/download/kundalini-new-age-anthology/106.%20Guided%20Meditation%20Music%20Zone%20-%20Spiritual%20Reawaking%20%28River%20in%20the%20Asian%20Forest%29.mp3',
  // Night — crickets + night ambient
  night: 'https://archive.org/download/kundalini-new-age-anthology/124.%20Improving%20Concentration%20Music%20Zone%20-%20Deep%20Focus%20%28Night%20Ambient%29.mp3',
  // Cafe — soft background murmur
  cafe: 'https://archive.org/download/Red_Library_Ambience_1/R08-47-Outdoor%20Ambience.mp3',
  // White noise — sea storm = continuous noise
  whitenoise: 'https://archive.org/download/naturesounds-soundtheraphy/Sound%20Therapy%20-%20Sea%20Storm.mp3',
  // Piano — soft piano ambient
  piano: 'https://archive.org/download/kundalini-new-age-anthology/111.%20Bedtime%20Stories%20Unit%20-%20Early%20Time%20%28Soft%20Piano%29.mp3',
};

// Fallback URLs — Pixabay CDN (may expire but often work)
const FALLBACK_URLS: Record<string, string> = {
  rain: 'https://cdn.pixabay.com/audio/2022/10/30/audio_42ab3398a5.mp3',
  thunderstorm: 'https://cdn.pixabay.com/audio/2022/05/16/audio_1d59498a9f.mp3',
  ocean: 'https://cdn.pixabay.com/audio/2024/09/17/audio_030b1c5690.mp3',
  forest: 'https://cdn.pixabay.com/audio/2022/08/31/audio_419263ef89.mp3',
  fireplace: 'https://cdn.pixabay.com/audio/2024/11/04/audio_a62e4b3f86.mp3',
  wind: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4a6397da0c.mp3',
  birds: 'https://cdn.pixabay.com/audio/2022/03/09/audio_c89cbe4b62.mp3',
  river: 'https://cdn.pixabay.com/audio/2024/06/05/audio_e3948ec0c4.mp3',
  night: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
  cafe: 'https://cdn.pixabay.com/audio/2024/02/13/audio_99785c3c71.mp3',
  whitenoise: 'https://cdn.pixabay.com/audio/2023/10/26/audio_3a234eae18.mp3',
  piano: 'https://cdn.pixabay.com/audio/2023/09/25/audio_c4bcbbedea.mp3',
};

// Exported primary URLs
export const SOUND_URLS: Record<string, string> = { ...PRIMARY_URLS };

// Get fallback URL for a sound category
export function getFallbackUrl(soundId: string): string | null {
  return FALLBACK_URLS[soundId] || null;
}
