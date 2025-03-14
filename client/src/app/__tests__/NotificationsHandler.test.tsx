import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ScheduleWeeklyNotification, { getNextSundayAtNine } from '../NotificationsHandler';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn()
}));

jest.mock('expo-device', () => ({
  isDevice: true
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
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    originalOS = Platform.OS;
  });

  afterEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  });


  test('requests permissions when not granted and schedules notification', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    
    render(<ScheduleWeeklyNotification />);
    
    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
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

  test('shows alert if physical device is not available', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const originalIsDevice = Device.isDevice;
    Object.defineProperty(Device, 'isDevice', { configurable: true, value: false });
    
    render(<ScheduleWeeklyNotification />);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to get push token for notifications!');
    });
    
    Object.defineProperty(Device, 'isDevice', { configurable: true, value: originalIsDevice });
  });
});

describe('ScheduleWeeklyNotification - Web Branch', () => {
  let alertSpy: jest.SpyInstance;
  let originalNotification: any;
  let originalOS: string;


  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
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
      requestPermission: jest.fn(() => Promise.resolve('denied'))
    } as any;
    
    render(<ScheduleWeeklyNotification />);
    
    await waitFor(() => {
      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Permission not granted for notifications.');
    });
  });

  test('schedules web notification if permission granted', async () => {
    jest.useFakeTimers();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    
    const notificationMock = jest.fn();
    (notificationMock as any).permission = 'granted';
    global.Notification = notificationMock as any;
    
    const getNextSundayAtNineMock = jest
      .spyOn(require('../NotificationsHandler'), 'getNextSundayAtNine')
      .mockReturnValue(new Date(Date.now() + 1));
    
    render(<ScheduleWeeklyNotification />);
    
    jest.runAllTimers();
    
    await waitFor(() => {
      expect(notificationMock).toHaveBeenCalledWith('Weekly Summary', {
        body: 'Your weekly summary: X habits completed, Y habits missed.',
      });
    });
    
    getNextSundayAtNineMock.mockRestore();
    jest.useRealTimers();
  });
});
