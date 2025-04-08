import React, { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchStreak, fetchHabits } from '../lib/client';

// Set notification handler (applies to both native and web)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Helper function: calculate next Sunday at 9:00 AM
export const getNextSundayAtNine = () => {
  const now = new Date();
  const day = now.getDay(); // Sunday = 0, Monday = 1, etc.
  const diff = day === 0 ? 7 : 7 - day; // If today is Sunday, schedule for next week
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + diff);
  nextSunday.setHours(9, 0, 0, 0);
  return nextSunday;
};

export default function ScheduleWeeklyNotification() {
  useEffect(() => {
    async function scheduleNotification() {
      if (Platform.OS === 'web') {
        // Web: Use the browser Notification API
        if (typeof window !== 'undefined' && !('Notification' in window)) {
          Alert.alert('Notifications are not supported in this browser.');
          return;
        }
        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            Alert.alert('Permission not granted for notifications.');
            return;
          }
        }
        const nextSunday = getNextSundayAtNine();
        const delay = nextSunday.getTime() - new Date().getTime();

        setTimeout(() => {
          (async () => {
            const email = await AsyncStorage.getItem('email');
            const habits = fetchHabits(email);
            // For each habit, fetch streak data for the week.
            const streakResults = await Promise.all(
              habits.map(async (habit) => {
                const rawData = await fetchStreak(email, habit, "week");
                const mostRecentEntry = rawData && rawData.length > 0 ? rawData[rawData.length - 1] : null;
                return { habit, streak: mostRecentEntry ? mostRecentEntry.streak : 0 };
              })
            );
            // Build the notification message using the obtained streaks.
            const message = streakResults
              .map(result => `${result.habit}: ${result.streak}`)
              .join(", ");
            new Notification('Weekly Summary For Previous Week', {
              body: `Your weekly summary: ${message}`,
            });
            
          })();
        }, delay);
      } else {
        // Native: Use expo-notifications
        if (!Device.isDevice) {
          Alert.alert('Physical device required for notifications.');
          return;
        }
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Alert.alert('Failed to get push token for notifications!');
          return;
        }
        const nextSunday = getNextSundayAtNine();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Weekly Summary',
            body: 'Open the app to see your which habits you have completed.',
            data: { info: 'weekly summary' },
          },
          trigger: nextSunday,
        });
      }
    }
    
    scheduleNotification();
  }, []);
  return null;
}

// Enable notifications
export async function enableNotifications() {
  try {
    if (Platform.OS === 'web') {
      window.alert(
        'Notifications Enabled.'
      );
    }
    await AsyncStorage.setItem('notificationsEnabled', 'true');
  } catch (error) {
    console.error('Error disabling notifications:', error);
    if (typeof window !== 'undefined') {
      window.alert('Error: Failed to enable notifications.');
    }
  }
}

// Disable notifications
export async function disableNotifications() {
  try {
    if (Platform.OS === 'web') {
      window.alert(
        'Notifications Disabled.'
      );
    }
    await AsyncStorage.setItem('notificationsEnabled', 'false');
  } catch (error) {
    console.error('Error disabling notifications:', error);
    if (typeof window !== 'undefined') {
      window.alert('Error: Failed to disable notifications.');
    }
  }
}

// Check Notification Status
export async function getNotificationStatus() {
  const storedStatus = await AsyncStorage.getItem('notificationsEnabled');
  return storedStatus === 'true';
}