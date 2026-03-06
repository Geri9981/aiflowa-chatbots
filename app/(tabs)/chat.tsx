import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeIn, FadeInDown } from 'react-native-reanimated';
import { themeShared } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { getTranslation } from '../../constants/translations';
import PremiumGate from '../../components/PremiumGate';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { chatMessages, sendMessage, isChatLoading, language, colors, isPremium } = useApp();
  const { user } = useAuth();
  const t = getTranslation(language);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, 100);
    return () => clearTimeout(timer);
  }, [chatMessages, isChatLoading]);

  const handleSend = useCallback((text?: string) => {
    const msgText = (text || inputText).trim();
    if (!msgText || isChatLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    Keyboard.dismiss();
    sendMessage(msgText);
  }, [inputText, sendMessage, isChatLoading]);

  const handleQuickReply = useCallback((reply: string) => {
    if (isChatLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(reply);
  }, [sendMessage, isChatLoading]);

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const lastAIMessage = [...chatMessages].reverse().find(m => m.sender === 'ai');
  const quickReplies = lastAIMessage?.quickReplies || [];

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium gate for AI chat */}
      {!isPremium ? (
        <PremiumGate feature={t.advancedAIChat || 'AI Chat'}>
          <View />
        </PremiumGate>
      ) : (
      <>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={[colors.primary, colors.accent]} style={styles.avatarGradient}>
            <MaterialIcons name="psychology" size={22} color="#FFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.mindspaceAI}</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: isChatLoading ? '#F59E0B' : colors.success }]} />
              <Text style={[styles.onlineText, { color: colors.textSecondary }]}>
                {isChatLoading ? 'Thinking...' : (t.alwaysHereForYou || 'Always here for you')}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.aiBadge}>
            <MaterialIcons name="auto-awesome" size={12} color="#FFF" />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView ref={scrollRef} style={styles.messagesContainer} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {chatMessages.length <= 1 && (
            <View style={styles.welcomeContainer}>
              <Image source={require('../../assets/images/chat-welcome.png')} style={styles.welcomeImage} contentFit="contain" />
              <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>{t.yourSafeSpaceTitle}</Text>
              <Text style={[styles.welcomeDesc, { color: colors.textSecondary }]}>{t.chatWelcomeDesc}</Text>
              <View style={[styles.poweredBy, { backgroundColor: colors.primary + '10' }]}>
                <MaterialIcons name="auto-awesome" size={14} color={colors.primary} />
                <Text style={[styles.poweredByText, { color: colors.primary }]}>Powered by OnSpace AI</Text>
              </View>
            </View>
          )}
          {chatMessages.map((msg, index) => {
            const isAI = msg.sender === 'ai';
            return (
              <Animated.View key={msg.id} entering={FadeInUp.duration(300).delay(Math.min(index * 50, 200))} style={[styles.messageRow, isAI ? styles.messageRowAI : styles.messageRowUser]}>
                {isAI && <View style={[styles.aiAvatarSmall, { backgroundColor: colors.primary + '15' }]}><MaterialIcons name="psychology" size={14} color={colors.primary} /></View>}
                <View style={[styles.messageBubble, isAI ? [styles.aiBubble, { backgroundColor: colors.surface }] : [styles.userBubble, { backgroundColor: colors.primary }]]}>
                  <Text style={[styles.messageText, isAI ? { color: colors.textPrimary } : { color: '#FFF' }]}>{msg.text}</Text>
                  <Text style={[styles.messageTime, isAI ? { color: colors.textTertiary } : { color: 'rgba(255,255,255,0.7)' }]}>{formatTime(msg.timestamp)}</Text>
                </View>
              </Animated.View>
            );
          })}
          {isChatLoading ? (
            <Animated.View entering={FadeIn.duration(300)} style={[styles.messageRow, styles.messageRowAI]}>
              <View style={[styles.aiAvatarSmall, { backgroundColor: colors.primary + '15' }]}><MaterialIcons name="psychology" size={14} color={colors.primary} /></View>
              <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.surface }, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.4 }]} />
                  <View style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.6 }]} />
                  <View style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.8 }]} />
                </View>
              </View>
            </Animated.View>
          ) : null}
          {!isChatLoading && quickReplies.length > 0 ? (
            <Animated.View entering={FadeInDown.duration(300).delay(300)} style={styles.quickRepliesContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesScroll}>
                {quickReplies.map((reply, i) => (
                  <Pressable key={i} onPress={() => handleQuickReply(reply)} style={({ pressed }) => [styles.quickReplyChip, { backgroundColor: colors.surface, borderColor: colors.primary + '40' }, pressed && { transform: [{ scale: 0.96 }], opacity: 0.8 }]}>
                    <Text style={[styles.quickReplyText, { color: colors.primary }]}>{reply}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          ) : null}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput style={[styles.textInput, { color: colors.textPrimary }]} placeholder={t.shareOnMind} placeholderTextColor={colors.textTertiary} value={inputText} onChangeText={setInputText} multiline maxLength={1000} editable={!isChatLoading} />
            <Pressable onPress={() => handleSend()} style={[styles.sendButton, { backgroundColor: inputText.trim() && !isChatLoading ? colors.primary : colors.backgroundSecondary }]} disabled={!inputText.trim() || isChatLoading}>
              <MaterialIcons name="arrow-upward" size={20} color={inputText.trim() && !isChatLoading ? '#FFF' : colors.textTertiary} />
            </Pressable>
          </View>
          <Text style={[styles.inputDisclaimer, { color: colors.textTertiary }]}>{t.aiCompanionDisclaimer}</Text>
        </View>
      </KeyboardAvoidingView>
      </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: {},
  avatarGradient: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontSize: 12 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#8B5CF6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  welcomeContainer: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  welcomeImage: { width: 160, height: 160, borderRadius: 80, marginBottom: 20 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  welcomeDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  poweredBy: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  poweredByText: { fontSize: 12, fontWeight: '600' },
  messagesContainer: { flex: 1 },
  messageRow: { flexDirection: 'row', marginBottom: 12, maxWidth: '85%' },
  messageRowAI: { alignSelf: 'flex-start', alignItems: 'flex-end' },
  messageRowUser: { alignSelf: 'flex-end' },
  aiAvatarSmall: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 4 },
  messageBubble: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, maxWidth: '100%' },
  aiBubble: { borderBottomLeftRadius: 4, ...themeShared.shadows.card },
  userBubble: { borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  typingBubble: { paddingHorizontal: 20, paddingVertical: 14 },
  typingDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  quickRepliesContainer: { marginTop: 4, marginBottom: 8, marginLeft: 32 },
  quickRepliesScroll: { gap: 8, paddingRight: 16 },
  quickReplyChip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, ...themeShared.shadows.card },
  quickReplyText: { fontSize: 13, fontWeight: '600' },
  inputContainer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderWidth: 1 },
  textInput: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 6, lineHeight: 20 },
  sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  inputDisclaimer: { fontSize: 10, textAlign: 'center', marginTop: 6, marginBottom: 2 },
});
