import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

// ─── Mood Entries ───

export async function fetchMoodEntries(userId: string) {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchMoodEntries:', error.message); return []; }
  return data || [];
}

export async function upsertMoodEntry(userId: string, value: number, note?: string) {
  const today = new Date().toISOString().split('T')[0];
  // Check if entry exists for today
  const { data: existing } = await supabase
    .from('mood_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('mood_entries')
      .update({ value, note })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) console.error('updateMoodEntry:', error.message);
    return data;
  } else {
    const { data, error } = await supabase
      .from('mood_entries')
      .insert({ user_id: userId, value, note, date: today })
      .select()
      .single();
    if (error) console.error('insertMoodEntry:', error.message);
    return data;
  }
}

// ─── Journal Entries ───

export async function fetchJournalEntries(userId: string) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchJournalEntries:', error.message); return []; }
  return data || [];
}

export async function insertJournalEntry(
  userId: string,
  title: string,
  content: string,
  mood?: number,
  tags?: string[],
  aiInsight?: string,
) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userId,
      title,
      content,
      mood,
      tags: tags || [],
      ai_insight: aiInsight || null,
      date: today,
    })
    .select()
    .single();
  if (error) console.error('insertJournalEntry:', error.message);
  return data;
}

// ─── Meditation Sessions ───

export async function fetchMeditationSessions(userId: string) {
  const { data, error } = await supabase
    .from('meditation_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchMeditationSessions:', error.message); return []; }
  return data || [];
}

export async function insertMeditationSession(userId: string, duration: number, sound?: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('meditation_sessions')
    .insert({ user_id: userId, duration, sound, date: today })
    .select()
    .single();
  if (error) console.error('insertMeditationSession:', error.message);
  return data;
}

// ─── Breathing Sessions ───

export async function fetchBreathingSessions(userId: string) {
  const { data, error } = await supabase
    .from('breathing_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchBreathingSessions:', error.message); return []; }
  return data || [];
}

export async function insertBreathingSession(userId: string, rounds: number = 4) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('breathing_sessions')
    .insert({ user_id: userId, rounds, date: today })
    .select()
    .single();
  if (error) console.error('insertBreathingSession:', error.message);
  return data;
}

// ─── User Profile ───

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) console.error('fetchUserProfile:', error.message);
  return data;
}

export async function updateUserProfile(userId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) console.error('updateUserProfile:', error.message);
  return data;
}

// ─── AI Chat ───

// ─── Avatar Upload ───

export async function uploadAvatarToCloud(userId: string, localUri: string): Promise<string | null> {
  try {
    // Read file as base64 then convert to arraybuffer
    const response = await fetch(localUri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    
    const fileName = `${userId}/avatar_${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    if (error) {
      console.error('Avatar upload error:', error.message);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (e) {
    console.error('Avatar upload exception:', e);
    return null;
  }
}

export async function sendAIChatMessage(
  messages: Array<{ sender: string; text: string }>,
  diagnosis: string[],
  goals: string[],
  language: string,
) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { messages, diagnosis, goals, language },
    });

    if (error) {
      // Try to get detailed error
      let errorMessage = error.message;
      try {
        if ((error as any).context?.text) {
          const textContent = await (error as any).context.text();
          errorMessage = textContent || error.message;
        }
      } catch {}
      console.error('AI chat error:', errorMessage);
      return {
        text: "I am having trouble connecting right now. Please try again in a moment.",
        quickReplies: ["Try again", "How are you?", "Tell me about breathing exercises"],
      };
    }

    return data as { text: string; quickReplies: string[] };
  } catch (e) {
    console.error('AI chat exception:', e);
    return {
      text: "Something went wrong. I am still here for you though. Please try sending your message again.",
      quickReplies: ["Try again", "I need help", "What can you do?"],
    };
  }
}
