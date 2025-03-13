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

describe('ScheduleWeeklyNotification', () => {

    let alertSpy: jest.SpyInstance;

    beforeEach(() => {
        alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
      });
    
      afterEach(() => {
        jest.clearAllMocks();
      });
    

    test('requests permissions when not granted and schedules notification', async () => {
        (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
        (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

        render(<ScheduleWeeklyNotification />);

        await waitFor(() => {
            expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
        });
    });

    test('shows an alert if permission is denied', async () => {
        (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
        (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
        // const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

        render(<ScheduleWeeklyNotification />);

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Failed to get push token for notifications!');
        });

        // alertSpy.mockRestore();
    });

});