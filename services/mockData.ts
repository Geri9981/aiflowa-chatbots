export interface MoodEntry {
  id: string;
  date: string;
  value: number;
  note?: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  aiInsight?: string;
  mood?: number;
  tags: string[];
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  quickReplies?: string[];
}

export interface Recommendation {
  id: string;
  type: 'breathing' | 'reflection' | 'task' | 'exercise';
  title: string;
  description: string;
  duration?: string;
  icon: string;
  color: string;
}

export interface Affirmation {
  id: string;
  text: string;
  category: 'calm' | 'strength' | 'growth' | 'gratitude' | 'self-love';
}

// Generate dates for the past N days
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const daysAgoTimestamp = (n: number): number => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.getTime();
};

// Affirmations pool
export const affirmationsPool: Affirmation[] = [
  { id: 'a1', text: 'I am worthy of peace, love, and happiness.', category: 'self-love' },
  { id: 'a2', text: 'I release what I cannot control and focus on what I can.', category: 'calm' },
  { id: 'a3', text: 'Every day, I am becoming a stronger version of myself.', category: 'strength' },
  { id: 'a4', text: 'I choose to respond with kindness, starting with myself.', category: 'self-love' },
  { id: 'a5', text: 'My feelings are valid, and I give myself permission to feel them.', category: 'calm' },
  { id: 'a6', text: 'I am grateful for the small moments that bring me joy.', category: 'gratitude' },
  { id: 'a7', text: 'Growth is not linear, and I celebrate every step forward.', category: 'growth' },
  { id: 'a8', text: 'I trust the timing of my life and remain patient with myself.', category: 'strength' },
  { id: 'a9', text: 'I am enough exactly as I am in this moment.', category: 'self-love' },
  { id: 'a10', text: 'I breathe in calm and breathe out tension.', category: 'calm' },
  { id: 'a11', text: 'I am resilient and capable of handling whatever comes my way.', category: 'strength' },
  { id: 'a12', text: 'I choose progress over perfection, every single day.', category: 'growth' },
  { id: 'a13', text: 'I am thankful for the lessons hidden in every challenge.', category: 'gratitude' },
  { id: 'a14', text: 'My mind is calm, my body is relaxed, my spirit is at peace.', category: 'calm' },
  { id: 'a15', text: 'I deserve rest without guilt and joy without conditions.', category: 'self-love' },
  { id: 'a16', text: 'Every sunrise is a new invitation to begin again.', category: 'growth' },
  { id: 'a17', text: 'I am surrounded by love, even when I cannot see it.', category: 'gratitude' },
  { id: 'a18', text: 'I have the strength to set boundaries that protect my peace.', category: 'strength' },
  { id: 'a19', text: 'Healing is not a destination but a gentle, ongoing journey.', category: 'growth' },
  { id: 'a20', text: 'I am grateful for the person I am becoming.', category: 'gratitude' },
];

// Affirmation gradient presets per category
export const affirmationGradients: Record<string, string[]> = {
  calm: ['#A7C7E7', '#89B4D1'],
  strength: ['#B8D4C8', '#7DB89E'],
  growth: ['#C3B8D8', '#9B8EC4'],
  gratitude: ['#F5D5B0', '#E6A87C'],
  'self-love': ['#E8B4C8', '#D48FA0'],
};

// Mock mood history (30 days)
export const mockMoodHistory: MoodEntry[] = [
  { id: 'm30', date: daysAgo(30), value: 5, timestamp: daysAgoTimestamp(30) },
  { id: 'm29', date: daysAgo(29), value: 4, note: 'Felt overwhelmed at work', timestamp: daysAgoTimestamp(29) },
  { id: 'm28', date: daysAgo(28), value: 6, timestamp: daysAgoTimestamp(28) },
  { id: 'm27', date: daysAgo(27), value: 5, timestamp: daysAgoTimestamp(27) },
  { id: 'm26', date: daysAgo(26), value: 7, note: 'Had a great morning walk', timestamp: daysAgoTimestamp(26) },
  { id: 'm25', date: daysAgo(25), value: 6, timestamp: daysAgoTimestamp(25) },
  { id: 'm24', date: daysAgo(24), value: 4, note: 'Trouble sleeping', timestamp: daysAgoTimestamp(24) },
  { id: 'm23', date: daysAgo(23), value: 5, timestamp: daysAgoTimestamp(23) },
  { id: 'm22', date: daysAgo(22), value: 6, timestamp: daysAgoTimestamp(22) },
  { id: 'm21', date: daysAgo(21), value: 7, note: 'Meditation helped', timestamp: daysAgoTimestamp(21) },
  { id: 'm20', date: daysAgo(20), value: 8, timestamp: daysAgoTimestamp(20) },
  { id: 'm19', date: daysAgo(19), value: 7, timestamp: daysAgoTimestamp(19) },
  { id: 'm18', date: daysAgo(18), value: 6, note: 'Rainy day, stayed inside', timestamp: daysAgoTimestamp(18) },
  { id: 'm17', date: daysAgo(17), value: 5, timestamp: daysAgoTimestamp(17) },
  { id: 'm16', date: daysAgo(16), value: 6, timestamp: daysAgoTimestamp(16) },
  { id: 'm15', date: daysAgo(15), value: 7, note: 'Connected with a friend', timestamp: daysAgoTimestamp(15) },
  { id: 'm14', date: daysAgo(14), value: 8, timestamp: daysAgoTimestamp(14) },
  { id: 'm13', date: daysAgo(13), value: 7, timestamp: daysAgoTimestamp(13) },
  { id: 'm12', date: daysAgo(12), value: 6, timestamp: daysAgoTimestamp(12) },
  { id: 'm11', date: daysAgo(11), value: 5, note: 'Stressful deadlines', timestamp: daysAgoTimestamp(11) },
  { id: 'm10', date: daysAgo(10), value: 6, timestamp: daysAgoTimestamp(10) },
  { id: 'm9', date: daysAgo(9), value: 7, timestamp: daysAgoTimestamp(9) },
  { id: 'm8', date: daysAgo(8), value: 8, note: 'Journaling helped clear my mind', timestamp: daysAgoTimestamp(8) },
  { id: 'm7', date: daysAgo(7), value: 7, timestamp: daysAgoTimestamp(7) },
  { id: 'm6', date: daysAgo(6), value: 6, timestamp: daysAgoTimestamp(6) },
  { id: 'm5', date: daysAgo(5), value: 7, timestamp: daysAgoTimestamp(5) },
  { id: 'm4', date: daysAgo(4), value: 8, note: 'Good sleep last night', timestamp: daysAgoTimestamp(4) },
  { id: 'm3', date: daysAgo(3), value: 7, timestamp: daysAgoTimestamp(3) },
  { id: 'm2', date: daysAgo(2), value: 6, timestamp: daysAgoTimestamp(2) },
  { id: 'm1', date: daysAgo(1), value: 7, note: 'Feeling hopeful', timestamp: daysAgoTimestamp(1) },
];

// Mock journal entries
export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'j1',
    date: daysAgo(1),
    title: 'A quiet evening reflection',
    content: 'Today was better than yesterday. I managed to take a break during lunch and went for a short walk. The fresh air really helped clear my head. I noticed I was less anxious in the afternoon meetings.',
    aiInsight: 'It sounds like connecting with nature, even briefly, has a positive effect on your anxiety levels. Consider making that lunch walk a daily habit — small consistent actions often create the biggest shifts.',
    mood: 7,
    tags: ['nature', 'anxiety', 'progress'],
    timestamp: daysAgoTimestamp(1),
  },
  {
    id: 'j2',
    date: daysAgo(3),
    title: 'Overthinking at night',
    content: "I could not sleep again. My mind kept racing about the project deadline. I tried the breathing exercise but it only helped a little. I keep replaying conversations in my head.",
    aiInsight: "Racing thoughts before bed are common, especially during stressful periods. You recognized the pattern and tried a coping strategy — that is a strength. Try writing down your worries before bed to externalize them.",
    mood: 5,
    tags: ['sleep', 'overthinking', 'stress'],
    timestamp: daysAgoTimestamp(3),
  },
  {
    id: 'j3',
    date: daysAgo(5),
    title: 'Grateful for small things',
    content: "Practiced gratitude today. I am thankful for my morning coffee ritual, for my colleague who checked in on me, and for the fact that I am making progress, even if it is slow.",
    aiInsight: "Gratitude practice activates the same neural pathways as positive experiences. You are building emotional resilience by acknowledging the good alongside the challenges. Keep noting these moments.",
    mood: 7,
    tags: ['gratitude', 'growth', 'relationships'],
    timestamp: daysAgoTimestamp(5),
  },
  {
    id: 'j4',
    date: daysAgo(7),
    title: 'Difficult conversation',
    content: 'Had to set a boundary with a friend today. It felt uncomfortable but necessary. I keep second-guessing if I said the right thing.',
    aiInsight: "Setting boundaries is an act of self-care, even when it feels difficult. The discomfort you are feeling is normal — it means you care about the relationship. Trust that honesty strengthens connections over time.",
    mood: 6,
    tags: ['boundaries', 'relationships', 'self-care'],
    timestamp: daysAgoTimestamp(7),
  },
  {
    id: 'j5',
    date: daysAgo(10),
    title: 'Work burnout feeling',
    content: "Everything feels like too much. I have so many tasks and I do not know where to start. I just want to rest but feel guilty when I do.",
    aiInsight: "Burnout often comes with a guilt cycle — feeling overwhelmed but unable to rest. Remember: rest is productive. Try picking just one small task to start with. Momentum builds naturally from there.",
    mood: 4,
    tags: ['burnout', 'guilt', 'overwhelm'],
    timestamp: daysAgoTimestamp(10),
  },
];

// Mock chat messages
export const mockChatMessages: ChatMessage[] = [
  {
    id: 'c1',
    text: "Hi there! Welcome to MindSpace. I am here to listen, support, and help you navigate your thoughts and feelings. How are you doing today?",
    sender: 'ai',
    timestamp: daysAgoTimestamp(0) - 3600000,
    quickReplies: ["I am feeling stressed", "Pretty good today", "I need someone to talk to"],
  },
];

// Daily recommendations
export const mockRecommendations: Recommendation[] = [
  {
    id: 'r1',
    type: 'breathing',
    title: 'Box Breathing',
    description: 'A calming 4-4-4-4 breathing pattern to reduce stress and center your mind.',
    duration: '4 min',
    icon: 'air',
    color: '#5B8FB9',
  },
  {
    id: 'r2',
    type: 'reflection',
    title: 'Gratitude Moment',
    description: "Name three things you are grateful for today, no matter how small.",
    duration: '2 min',
    icon: 'favorite',
    color: '#9B8EC4',
  },
  {
    id: 'r3',
    type: 'task',
    title: 'Mindful Walk',
    description: 'Take a 10-minute walk and notice 5 things you can see, 4 you can hear, 3 you can touch.',
    duration: '10 min',
    icon: 'directions-walk',
    color: '#7DB89E',
  },
  {
    id: 'r4',
    type: 'exercise',
    title: 'Body Scan',
    description: 'Slowly bring awareness to each part of your body, releasing tension as you go.',
    duration: '5 min',
    icon: 'self-improvement',
    color: '#E6A87C',
  },
  {
    id: 'r5',
    type: 'reflection',
    title: 'Thought Reframe',
    description: 'Take a negative thought and try to find a more balanced perspective.',
    duration: '3 min',
    icon: 'lightbulb',
    color: '#D4A574',
  },
  {
    id: 'r6',
    type: 'breathing',
    title: '4-7-8 Technique',
    description: 'Inhale for 4, hold for 7, exhale for 8. A natural tranquilizer for the nervous system.',
    duration: '5 min',
    icon: 'spa',
    color: '#5B8FB9',
  },
];

// Enhanced AI response patterns with follow-up questions and quick replies
export interface AIResponsePattern {
  text: string;
  quickReplies: string[];
}

export const aiResponses: Record<string, AIResponsePattern[]> = {
  greeting: [
    { text: "I am glad you are here. How are you feeling right now?", quickReplies: ["Feeling anxious", "Doing okay", "Not great today"] },
    { text: "Welcome back. What is on your mind today?", quickReplies: ["Work stress", "Just checking in", "Need to vent"] },
    { text: "It is good to see you. Take your time — I am here to listen.", quickReplies: ["Thanks, I need that", "I have a lot on my mind", "Can we do a check-in?"] },
  ],
  anxious: [
    { text: "Anxiety can feel overwhelming, but you are not alone in this. Can you tell me more about what is triggering these feelings? Sometimes naming it helps reduce its power.", quickReplies: ["Work pressure", "Relationship issues", "I am not sure why"] },
    { text: "I hear you. Anxiety often comes in waves. What does it feel like in your body right now? Noticing the physical sensations can help ground you.", quickReplies: ["My chest feels tight", "Racing thoughts", "Try a breathing exercise"] },
    { text: "That sounds really difficult. Remember that anxiety is your body trying to protect you, even when the threat is not real. What would feel most helpful right now?", quickReplies: ["Just talking helps", "I want coping tips", "Help me calm down"] },
  ],
  stressed: [
    { text: "Stress has a way of making everything feel urgent. Let us take a step back — what feels like the most pressing thing right now?", quickReplies: ["Deadlines at work", "Too many responsibilities", "I feel overwhelmed"] },
    { text: "It sounds like you are carrying a lot. Have you been able to take any breaks today? Even small ones count.", quickReplies: ["No, not really", "I took a short walk", "I feel too guilty to rest"] },
    { text: "When we are stressed, our thinking narrows. Let me ask: what is one small thing that went okay today, even if it seems minor?", quickReplies: ["I woke up on time", "Had a good meal", "Hard to think of one"] },
  ],
  sad: [
    { text: "I am sorry you are feeling this way. Sadness is a natural emotion, and it is okay to sit with it. What do you think is weighing on you the most?", quickReplies: ["Loneliness", "A loss or change", "I do not know exactly"] },
    { text: "Thank you for sharing that with me. It takes real courage to acknowledge sadness. Has anything been different lately that might be contributing?", quickReplies: ["Changes in routine", "Feeling disconnected", "Everything feels heavy"] },
    { text: "It is okay to not be okay. You do not have to push through it — sometimes just being present with the feeling helps. Would you like to talk more about it?", quickReplies: ["Yes, please", "I just needed to say it", "What can I do?"] },
  ],
  positive: [
    { text: "That is wonderful to hear! What do you think contributed to this positive feeling? Identifying those things helps you recreate them.", quickReplies: ["Good sleep", "Time with loved ones", "Accomplished something"] },
    { text: "I am glad you are feeling good. These moments matter — what would make today even better?", quickReplies: ["Keeping this momentum", "Sharing it with someone", "Just enjoying the moment"] },
    { text: "That is great! Celebrating small wins is important for your well-being. How can you carry this energy into the rest of your day?", quickReplies: ["Stay mindful", "Do something I enjoy", "Help someone else"] },
  ],
  lonely: [
    { text: "Loneliness can feel really heavy, even when you are surrounded by people. When did you last feel truly connected to someone?", quickReplies: ["It has been a while", "I talked to a friend recently", "I feel isolated even around others"] },
    { text: "Feeling lonely is more common than people realize — you are not alone in feeling alone. What kind of connection are you craving most?", quickReplies: ["Deep conversation", "Just being around people", "Someone who understands me"] },
    { text: "I hear you, and I want you to know that reaching out here is a form of connection too. What is one small step you could take toward the connection you need?", quickReplies: ["Message a friend", "Go somewhere social", "I am not sure where to start"] },
  ],
  angry: [
    { text: "Anger is a powerful emotion, and it often signals that a boundary has been crossed. What happened that brought this up?", quickReplies: ["Someone was unfair to me", "I am frustrated with myself", "Things are not going as planned"] },
    { text: "It is completely valid to feel angry. Sometimes anger protects us from deeper feelings underneath. What do you think is beneath the anger?", quickReplies: ["Hurt", "Disappointment", "Feeling unheard"] },
    { text: "I appreciate you sharing this. Anger needs a healthy outlet — what usually helps you when you feel this way?", quickReplies: ["Physical activity", "Talking it out", "I usually bottle it up"] },
  ],
  excited: [
    { text: "I can feel your energy! That is amazing. What has you feeling so excited?", quickReplies: ["Something good happened", "A new opportunity", "Just feeling alive today"] },
    { text: "Excitement is such a great energy to have. How can you channel this feeling into something meaningful today?", quickReplies: ["Start a project", "Share it with someone", "Just savoring the moment"] },
    { text: "That positive energy is contagious! Moments like these are worth remembering. Want to write about it in your journal to capture this feeling?", quickReplies: ["Great idea!", "Maybe later", "Tell me more about journaling"] },
  ],
  general: [
    { text: "Tell me more about that. I am here to listen without judgment.", quickReplies: ["It is hard to explain", "I feel conflicted", "I just need to talk"] },
    { text: "That is a really valid feeling. What do you think might help right now?", quickReplies: ["Just talking", "A breathing exercise", "I want advice"] },
    { text: "Thank you for opening up. Understanding our feelings is the first step to working through them. What feels most present for you right now?", quickReplies: ["My thoughts", "My body sensations", "A specific situation"] },
    { text: "I appreciate you sharing that. Let us explore this together — there is no rush. What aspect would you like to focus on?", quickReplies: ["How I feel", "What I should do", "Understanding why"] },
    { text: "It sounds like there is a lot going on. Would you like to focus on what feels most pressing?", quickReplies: ["Yes, let me think", "Everything feels urgent", "Help me prioritize"] },
  ],
  overthinking: [
    { text: "Overthinking often creates problems that do not yet exist. What thought keeps coming back the most? Let us examine it together.", quickReplies: ["A decision I need to make", "Something someone said", "Future worries"] },
    { text: "Your mind is working hard to protect you. But sometimes it helps to ask: \"Is this thought helpful, or just familiar?\" What thought is looping right now?", quickReplies: ["It is mostly fear-based", "I keep replaying a situation", "I cannot stop analyzing"] },
    { text: "Spiral thoughts can feel endless. Here is a technique: write down the worry, then ask yourself what you can actually control about it. Want to try that together?", quickReplies: ["Yes, let us try", "I already know what it is", "I need to distract myself"] },
  ],
};

// Context-aware AI response generation
export function getContextualAIResponse(
  sentiment: string,
  conversationHistory: ChatMessage[],
): AIResponsePattern {
  const responses = aiResponses[sentiment] || aiResponses.general;
  const baseResponse = responses[Math.floor(Math.random() * responses.length)];

  // Check conversation context for richer responses
  const recentUserMessages = conversationHistory
    .filter(m => m.sender === 'user')
    .slice(-5);
  
  const messageCount = recentUserMessages.length;
  
  // Add contextual follow-up if not the first message
  if (messageCount > 1) {
    const previousTopics = recentUserMessages.map(m => detectSentiment(m.text));
    const recurringTopic = previousTopics.filter(t => t === sentiment).length > 1;
    
    if (recurringTopic && sentiment !== 'positive' && sentiment !== 'greeting') {
      return {
        text: baseResponse.text + "\n\nI notice this has been coming up in our conversation. Would you like to explore it more deeply?",
        quickReplies: ["Yes, let us go deeper", "I think I have said enough", "Can you suggest something?"],
      };
    }
  }

  return baseResponse;
}

// Get a random AI response (legacy compat)
export function getAIResponse(category: string = 'general'): string {
  const responses = aiResponses[category] || aiResponses.general;
  return responses[Math.floor(Math.random() * responses.length)].text;
}

// Enhanced sentiment detection with more nuances
export function detectSentiment(text: string): string {
  const lower = text.toLowerCase();
  if (/anxious|anxiety|panic|worried|nervous|scared|fearful|dread/.test(lower)) return 'anxious';
  if (/stress|overwhelm|too much|pressure|deadline|burnout|exhausted/.test(lower)) return 'stressed';
  if (/sad|depressed|down|hopeless|empty|crying|tearful|grief|loss/.test(lower)) return 'sad';
  if (/lonely|alone|isolated|no one|nobody|disconnected|left out/.test(lower)) return 'lonely';
  if (/angry|furious|rage|frustrated|irritated|mad|annoyed|pissed/.test(lower)) return 'angry';
  if (/excited|amazing|fantastic|pumped|thrilled|can't wait|stoked|awesome/.test(lower)) return 'excited';
  if (/happy|great|good|wonderful|grateful|thank|blessed|joyful/.test(lower)) return 'positive';
  if (/overthink|can't stop thinking|racing thoughts|spiral|ruminating|obsessing/.test(lower)) return 'overthinking';
  if (/hi|hello|hey|morning|evening/.test(lower)) return 'greeting';
  return 'general';
}

// Check for crisis keywords
export function checkForCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = ['suicide', 'kill myself', 'end it all', 'self harm', 'want to die', 'hurt myself', 'no reason to live'];
  return keywords.some(keyword => lower.includes(keyword));
}

// Weekly summary data
export interface WeeklySummary {
  avgMood: number;
  totalEntries: number;
  topTags: string[];
  trend: 'improving' | 'stable' | 'declining';
  insight: string;
}

export const mockWeeklySummary: WeeklySummary = {
  avgMood: 6.7,
  totalEntries: 5,
  topTags: ['anxiety', 'gratitude', 'nature'],
  trend: 'improving',
  insight: 'Your mood has been steadily improving this week. Nature walks and gratitude practices seem to correlate with your higher mood days. Keep building on what works.',
};
