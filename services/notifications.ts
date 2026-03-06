import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { affirmationsPool } from './mockData';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleMoodReminder(time: string): Promise<void> {
  // Cancel existing mood reminders
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'mood_reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  const [hours, minutes] = time.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'MindSpace',
      body: 'How are you feeling right now? Take a moment to check in with yourself.',
      sound: true,
      data: { type: 'mood_reminder', route: '/mood-checkin' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
}

/**
 * Get a deterministic "quote of the day" based on the date offset.
 * Uses the affirmations pool so each day gets a unique, real affirmation.
 */
function getAffirmationForDay(dayOffset: number): string {
  const today = new Date();
  today.setDate(today.getDate() + dayOffset);
  // Use day-of-year as seed so each calendar day maps to a unique affirmation
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % affirmationsPool.length;
  return affirmationsPool[index].text;
}

/**
 * Schedule daily affirmation ("quote of the day") notifications.
 * Schedules the next 7 days of unique affirmations, each at 08:00 (or custom time).
 * Uses the real affirmations pool from the app.
 */
export async function scheduleQuoteNotifications(interval: string, quoteTime: string = '08:00'): Promise<void> {
  // Cancel existing quote notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'quote') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  if (interval === 'off') return;

  const [quoteHour, quoteMinute] = quoteTime.split(':').map(Number);

  // Determine schedule based on interval
  if (interval === 'daily') {
    // Schedule 7 unique daily affirmations at user-chosen time
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + dayOffset);
      triggerDate.setHours(quoteHour, quoteMinute, 0, 0);

      if (triggerDate.getTime() <= Date.now()) continue;

      const quote = getAffirmationForDay(dayOffset);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ Today\'s Affirmation',
          body: quote,
          sound: true,
          data: { type: 'quote', route: '/(tabs)', dayOffset },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }
  } else if (interval === 'twice') {
    // Twice a day: user time and 12 hours later
    const eveningHour = (quoteHour + 12) % 24;
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const quote = getAffirmationForDay(dayOffset);
      const hours = [{ h: quoteHour, m: quoteMinute, label: 'morning' }, { h: eveningHour, m: quoteMinute, label: 'evening' }];

      for (const slot of hours) {
        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + dayOffset);
        triggerDate.setHours(slot.h, slot.m, 0, 0);

        if (triggerDate.getTime() <= Date.now()) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: slot.label === 'morning' ? '🌅 Morning Affirmation' : '🌙 Evening Affirmation',
            body: quote,
            sound: true,
            data: { type: 'quote', route: '/(tabs)', dayOffset, hour: slot.h },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
      }
    }
  } else if (interval === 'every3') {
    // Every 3 days at user-chosen time, schedule for 21 days ahead
    for (let dayOffset = 0; dayOffset < 21; dayOffset += 3) {
      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + dayOffset);
      triggerDate.setHours(quoteHour, quoteMinute, 0, 0);

      if (triggerDate.getTime() <= Date.now()) continue;

      const quote = getAffirmationForDay(dayOffset);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ Your Affirmation',
          body: quote,
          sound: true,
          data: { type: 'quote', route: '/(tabs)', dayOffset },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleAllNotifications(
  enabled: boolean,
  reminderTime: string,
  quoteInterval: string,
  quoteTime: string = '08:00',
): Promise<void> {
  if (!enabled) {
    await cancelAllNotifications();
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await scheduleMoodReminder(reminderTime);
  await scheduleQuoteNotifications(quoteInterval, quoteTime);
}
