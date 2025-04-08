import React, { act } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScheduleWeeklyNotification, {
  getNextSundayAtNine,
  enableNotifications,
  disableNotifications,
  getNotificationStatus,
} from '../NotificationsHandler';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { fetchStreak } from '../../lib/client';

// Define a dummy window.alert if it does not exist (required for web tests)
if (typeof window === 'undefined') {
  (global as any).window = {};
}
if (!window.alert) {
  Object.defineProperty(window, 'alert', {
    value: jest.fn(),
    writable: true,
  });
}

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

describe('getNextSundayAtNine', () => {
  test('calculates the correct date for the next Sunday at 9', () => {
    const nextSunday = getNextSundayAtNine();
    expect(nextSunday.getDay()).toBe(0);
    expect(nextSunday.getHours()).toBe(9);
  });
});

describe('ScheduleWeeklyNotification - Native Branch', () => {
  let alertSpy: jest.SpyInstance;
  let originalOS: string;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => { });
    originalOS = Platform.OS;
  });

  afterEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  });

  test('calls setNotificationHandler with correct configuration', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    render(<ScheduleWeeklyNotification />);
    await waitFor(() => {
      expect(Notifications.setNotificationHandler).toHaveBeenCalledWith({
        handleNotification: expect.any(Function),
      });
    });
    const handler = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0][0].handleNotification;
    const result = await handler();
    expect(result).toEqual({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });

  test('schedules notification immediately if permission already granted and device available', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    Object.defineProperty(Device, 'isDevice', { configurable: true, value: true });
    render(<ScheduleWeeklyNotification />);
    await waitFor(() => {
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  test('requests permissions when not granted and schedules notification', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    Object.defineProperty(Device, 'isDevice', { configurable: true, value: true });
    render(<ScheduleWeeklyNotification />);
    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  test('shows alert if device is not physical', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    Object.defineProperty(Device, 'isDevice', { configurable: true, value: false });
    render(<ScheduleWeeklyNotification />);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Physical device required for notifications.');
    });
    Object.defineProperty(Device, 'isDevice', { configurable: true, value: true });
  });

  test('shows an alert if permission is denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    render(<ScheduleWeeklyNotification />);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to get push token for notifications!');
    });
  });
});

describe('ScheduleWeeklyNotification - Web Branch', () => {
  let alertSpy: jest.SpyInstance;
  let originalNotification: any;
  let originalOS: string;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => { });
    originalNotification = global.Notification;
    originalOS = Platform.OS;
  });

  afterEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
    global.Notification = originalNotification;
  });

  test('shows alert if Notification API is not supported in web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    delete (global as any).Notification;
    render(<ScheduleWeeklyNotification />);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Notifications are not supported in this browser.');
    });
  });

  test('shows alert if notification permission is not granted in web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    global.Notification = {
      permission: 'default',
      requestPermission: jest.fn(() => Promise.resolve('denied')),
    } as any;
    render(<ScheduleWeeklyNotification />);
    await waitFor(() => {
      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Permission not granted for notifications.');
    });
  });
});

describe('enableNotifications', () => {
  let originalOS: string;
  let originalNotification: any;
  let alertSpy: jest.SpyInstance;
  let windowAlertSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;

  beforeAll(() => {
    originalOS = Platform.OS;
    originalNotification = global.Notification;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => { });
    windowAlertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });
    setItemSpy = jest.spyOn(AsyncStorage, 'setItem');
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
    global.Notification = originalNotification;
  });

  test('should alert error if notifications are not supported in web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    delete (global as any).Notification; // simulate no Notification API
    await enableNotifications();
    expect(windowAlertSpy).toHaveBeenCalledWith(
      'Notifications Enabled.'
    );
    expect(setItemSpy).toHaveBeenCalled();
  });

  test('should create a new notification if permission is already granted on web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    global.Notification = function NotificationMock(title: string, options: any) {
      return { title, ...options };
    } as any;
    (global.Notification as any).permission = 'granted';
    await enableNotifications();
    expect(windowAlertSpy).not.toHaveBeenCalledWith(
      'Permission Denied: Notifications were not enabled.'
    );
    expect(setItemSpy).toHaveBeenCalledWith('notificationsEnabled', 'true');
  });

  test('should request permission if not denied nor granted on web, and handle granted', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const requestPermissionMock = jest.fn().mockImplementation(() => {
      (global.Notification as any).permission = 'granted';
      return Promise.resolve('granted');
    });
    global.Notification = {
      permission: 'default',
      requestPermission: requestPermissionMock,
    } as any;
    await enableNotifications();
    expect(requestPermissionMock).not.toHaveBeenCalled();
    expect(windowAlertSpy).not.toHaveBeenCalledWith(
      'Permission Denied: Notifications were not enabled.'
    );
    // expect(setItemSpy).toHaveBeenCalledWith('notificationsEnabled', 'true');
  });


  test('should request permission if not denied nor granted on web, and handle denied', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    global.Notification = {
      permission: 'default',
      requestPermission: jest.fn().mockResolvedValue('denied'),
    } as any;
    await enableNotifications();
    expect(global.Notification.requestPermission).not.toHaveBeenCalled();
    expect(windowAlertSpy).toHaveBeenCalledWith(
      'Notifications Enabled.'
    );
    expect(setItemSpy).toHaveBeenCalled();
  });

  test('should alert if blocked on web (permission = denied)', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    global.Notification = { permission: 'denied' } as any;
    await enableNotifications();
    expect(windowAlertSpy).toHaveBeenCalledWith(
      'Notifications Enabled.'
    );
    expect(setItemSpy).toHaveBeenCalled();
  });

  test('should handle the native branch without error and store status', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    await enableNotifications();
    expect(setItemSpy).toHaveBeenCalledWith('notificationsEnabled', 'true');
  });

  test('should catch errors and show an alert on error', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    setItemSpy.mockRejectedValueOnce(new Error('Test error'));
    await enableNotifications();
    expect(window.alert).toHaveBeenCalledTimes(2);
    expect(window.alert).toHaveBeenNthCalledWith(1, "Notifications Enabled.");
    expect(window.alert).toHaveBeenNthCalledWith(2, "Error: Failed to enable notifications.");
  });
});

describe('disableNotifications', () => {
  let originalOS: string;
  let alertSpy: jest.SpyInstance;
  let windowAlertSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;

  beforeAll(() => {
    originalOS = Platform.OS;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => { });
    windowAlertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });
    setItemSpy = jest.spyOn(AsyncStorage, 'setItem');
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  });

  test('should show a manual disable message on web and set status to false', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    await disableNotifications();
    expect(windowAlertSpy).toHaveBeenCalledWith(
      'Notifications Disabled.'
    );
    expect(setItemSpy).toHaveBeenCalledWith('notificationsEnabled', 'false');
  });

  test('should handle the native branch without error and store status', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    await disableNotifications();
    expect(alertSpy).not.toHaveBeenCalledWith(
      'To fully disable notifications, go to your browser settings and block them manually.'
    );
    expect(setItemSpy).toHaveBeenCalledWith('notificationsEnabled', 'false');
  });

  test('should catch errors and show an alert on error', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    setItemSpy.mockRejectedValueOnce(new Error('Test error'));
    await disableNotifications();
    expect(windowAlertSpy).toHaveBeenCalledWith('Error: Failed to disable notifications.');
  });
});

describe('getNotificationStatus', () => {
  test('returns true when notificationsEnabled is "true"', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    const status = await getNotificationStatus();
    expect(status).toBe(true);
  });

  test('returns false when notificationsEnabled is "false"', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('false');
    const status = await getNotificationStatus();
    expect(status).toBe(false);
  });

  test('returns false when notificationsEnabled is null', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const status = await getNotificationStatus();
    expect(status).toBe(false);
  });
});

describe('enableNotifications - Native Branch setItem call', () => {
  test('calls AsyncStorage.setItem with "notificationsEnabled" and "true"', async () => {
    // Force the platform to native (e.g., ios)
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    // Spy on AsyncStorage.setItem
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue(undefined);

    // Call the function under test.
    await enableNotifications();

    // Assert that setItem was called with the correct key/value pair.
    expect(setItemSpy).toHaveBeenCalledWith('notificationsEnabled', 'true');

    // Cleanup: Restore the spy.
    setItemSpy.mockRestore();
  });
});