// ScheduleWeeklyNotification.js
import React, { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Set notification handler (applies to both native and web)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Helper function: calculate next Sunday at 9:00 AM
const getNextSundayAtNine = () => {
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
        if (!('Notification' in window)) {
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
          new Notification('Weekly Summary', {
            body: 'Your weekly summary: X habits completed, Y habits missed.',
          });
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
            body: 'Your weekly summary: X habits completed, Y habits missed.',
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
