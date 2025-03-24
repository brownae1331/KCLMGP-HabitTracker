import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../../(protected)/(tabs)/settings';
import { Alert } from 'react-native';
import { AuthProvider } from '../../../../components/AuthContext';
import * as NotificationsHandler from '../../../NotificationsHandler';

// Create spies for the NotificationsHandler functions
const getStatusSpy = jest.spyOn(NotificationsHandler, 'getNotificationStatus');
const enableSpy = jest.spyOn(NotificationsHandler, 'enableNotifications');
const disableSpy = jest.spyOn(NotificationsHandler, 'disableNotifications');

jest.mock('expo-font', () => ({
    loadAsync: jest.fn().mockResolvedValue(null),
    isLoaded: jest.fn().mockReturnValue(true),
}));

// Mock expo-notifications to prevent warnings (the warning does not affect test results)
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    addPushTokenListener: jest.fn(),
    getExpoPushTokenAsync: jest.fn(() => Promise.resolve('mock-token')),
}));

// Mock vector icons (for example, Feather icons)
jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        Feather: (props: any) => <Text>{props.name}</Text>,
    };
});

describe('SettingsScreen - Notifications toggle', () => {
    beforeEach(() => {
        // Clear all mocks before each test to avoid interference
        jest.clearAllMocks();
    });

    test('enables notifications when toggled on', async () => {
        // Simulate initial state: notifications are disabled (false)
        getStatusSpy.mockResolvedValueOnce(false);
        enableSpy.mockResolvedValueOnce();

        // Render the SettingsScreen wrapped with AuthProvider
        const rendered = render(
            <AuthProvider>
                <SettingsScreen />
            </AuthProvider>
        );

        // Wait until the "Notifications" text appears to ensure the component is rendered
        await waitFor(() => rendered.getByText('Notifications'));

        // Get all Switch components; assume the notifications Switch is the second one (index 1)
        const switches = rendered.getAllByRole('switch');
        const notificationsSwitch = switches[1];

        // Confirm the initial state of the notifications switch is false
        expect(notificationsSwitch.props.value).toBe(false);

        // Simulate toggling the notifications switch from false to true
        fireEvent(notificationsSwitch, 'valueChange', true);

        // Wait for the enableNotifications function to be called
        await waitFor(() => {
            expect(enableSpy).toHaveBeenCalled();
        });
    });

    test('disables notifications when toggled off', async () => {
        // Simulate initial state: notifications are enabled (true)
        getStatusSpy.mockResolvedValueOnce(true);
        disableSpy.mockResolvedValueOnce();

        const rendered = render(
            <AuthProvider>
                <SettingsScreen />
            </AuthProvider>
        );

        // Wait until the "Notifications" text appears
        await waitFor(() => rendered.getByText('Notifications'));

        // Retrieve all Switch components and assume the notifications switch is at index 1
        const switches = rendered.getAllByRole('switch');
        const notificationsSwitch = switches[1];

        // Wait until the switch's value is updated to true by the async useEffect
        await waitFor(() => {
            expect(notificationsSwitch.props.value).toBe(true);
        });

        // Simulate toggling the notifications switch from true to false
        fireEvent(notificationsSwitch, 'valueChange', false);

        // Wait for the disableNotifications function to be called
        await waitFor(() => {
            expect(disableSpy).toHaveBeenCalled();
        });
    });

    test('displays alert when toggling notifications fails', async () => {
        // Simulate initial state: notifications are disabled (false)
        getStatusSpy.mockResolvedValueOnce(false);
        // Simulate an error when enabling notifications
        enableSpy.mockRejectedValueOnce(new Error('Test Error'));

        // Spy on Alert.alert to catch the error message
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => { });

        const rendered = render(
            <AuthProvider>
                <SettingsScreen />
            </AuthProvider>
        );

        // Wait until "Notifications" text is rendered
        await waitFor(() => rendered.getByText('Notifications'));

        // Get the notifications switch (assumed to be the second switch)
        const switches = rendered.getAllByRole('switch');
        const notificationsSwitch = switches[1];

        // Ensure the initial value is false
        expect(notificationsSwitch.props.value).toBe(false);

        // Toggle the switch from false to true to trigger the error in enableNotifications
        fireEvent(notificationsSwitch, 'valueChange', true);

        // Wait for the Alert.alert call with the expected error message
        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to update notification settings.');
        });

        // Restore the original Alert.alert implementation
        alertSpy.mockRestore();
    });
});
