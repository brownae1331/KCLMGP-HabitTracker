// @ts-nocheck
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
}));
jest.mock('expo-device', () => ({
    isDevice: true,
}));

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchHabits, fetchStreak, scheduleWebNotification, scheduleNotification } from '../NotificationsHandler';

jest.mock('react-native', () => ({
    Platform: { OS: 'web' as const },
    Alert: { alert: jest.fn() },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));
jest.mock('../../lib/client', () => ({
    fetchHabits: jest.fn(),
    fetchStreak: jest.fn(),
}));

describe('ScheduleWeeklyNotification - Web Branch Isolation', () => {
    let originalNotification: typeof global.Notification;

    beforeEach(() => {
        jest.clearAllMocks();
        originalNotification = global.Notification;
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
        (require('../../lib/client').fetchHabits as jest.Mock).mockResolvedValue(['Habit1', 'Habit2']);
        (require('../../lib/client').fetchStreak as jest.Mock).mockResolvedValue([{ streak: 5 }]);
        global.Notification = jest.fn((title: string, options?: NotificationOptions) => ({
            title,
            ...options,
        })) as unknown as jest.MockedClass<typeof Notification>;
        Object.defineProperty(global.Notification, 'permission', {
            value: 'granted' as NotificationPermission,
            writable: true,
        });
    });

    afterEach(() => {
        global.Notification = originalNotification;
    });

    test('schedules notification when permission is granted', async () => {
        const notificationMock = global.Notification;
        await scheduleWebNotification();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith('email');
        expect(require('../../lib/client').fetchHabits).toHaveBeenCalledWith('test@example.com');
        expect(require('../../lib/client').fetchStreak).toHaveBeenCalledWith('test@example.com', 'Habit1', 'week');
        expect(notificationMock).toHaveBeenCalledWith('Weekly Summary For Previous Week', {
            body: 'Your weekly summary: Habit1: 5, Habit2: 5',
        });
    });

    test('requests permission and schedules notification if granted', async () => {
        const notificationMock = global.Notification;
        global.Notification.requestPermission = jest.fn(async () => {
            Object.defineProperty(global.Notification, 'permission', { value: 'granted' as const });
            return 'granted' as const;
        });
        await global.Notification.requestPermission();
        await scheduleWebNotification();

        expect(global.Notification.requestPermission).toHaveBeenCalled();
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('email');
        expect(require('../../lib/client').fetchHabits).toHaveBeenCalledWith('test@example.com');
        expect(require('../../lib/client').fetchStreak).toHaveBeenCalledWith('test@example.com', 'Habit2', 'week');
        expect(notificationMock).toHaveBeenCalledWith('Weekly Summary For Previous Week', {
            body: 'Your weekly summary: Habit1: 5, Habit2: 5',
        });
    });

    test('triggers setTimeout for web notification', async () => {
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
            callback();
            return 1 as any;
        });
        await scheduleNotification();
        expect(setTimeoutSpy).toHaveBeenCalled();
        expect(require('../../lib/client').fetchHabits).toHaveBeenCalled();
        setTimeoutSpy.mockRestore();
    });

    test('handles empty streak data in scheduleWebNotification', async () => {
        (require('../../lib/client').fetchHabits as jest.Mock).mockResolvedValue(['Habit1']);
        (require('../../lib/client').fetchStreak as jest.Mock).mockResolvedValue([]);
        const notificationMock = global.Notification;
        await scheduleWebNotification();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith('email');
        expect(require('../../lib/client').fetchHabits).toHaveBeenCalledWith('test@example.com');
        expect(require('../../lib/client').fetchStreak).toHaveBeenCalledWith('test@example.com', 'Habit1', 'week');
        expect(notificationMock).toHaveBeenCalledWith('Weekly Summary For Previous Week', {
            body: 'Your weekly summary: Habit1: 0',
        });
    });
});