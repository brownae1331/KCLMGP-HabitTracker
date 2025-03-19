import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../../(protected)/(tabs)/settings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Image } from 'react-native';
import { AuthProvider } from '../../../../components/AuthContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

// Mock expo-router for navigation functions
jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
        replace: jest.fn(),
    },
    usePathname: jest.fn(),
}));

// Mock ThemeContext and allow overriding theme in tests
jest.mock('../../../../components/ThemeContext', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' })),
}));

// Mock ThemedText by dynamically requiring 'react-native' to get Text
jest.mock('../../../../components/ThemedText', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        ThemedText: (props: any) => <Text {...props}>{props.children}</Text>,
    };
});

// Mock Feather icons from @expo/vector-icons by rendering the icon name as text
jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        Feather: (props: any) => <Text {...props}>{props.name}</Text>,
    };
});

// Mock Colors and SharedStyles
jest.mock('../../../../components/styles/Colors', () => ({
    Colors: {
        light: { background: '#fff', text: '#000' },
        dark: { background: '#000', text: '#fff' },
    },
}));

jest.mock('../../../../components/styles/SharedStyles', () => ({
    SharedStyles: { titleContainer: { padding: 10 } },
}));

describe('SettingsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders settings screen correctly with title, options, and sign out button', async () => {
        const rendered = render(
            <AuthProvider>
                <SettingsScreen />
            </AuthProvider>
        );
        await waitFor(() => expect(rendered.getByText('Settings')).toBeTruthy());
        expect(rendered.getByText('Account')).toBeTruthy();
        expect(rendered.getByText('Notifications')).toBeTruthy();
        expect(rendered.getByText('Appearance')).toBeTruthy();
        expect(rendered.getByText('Sign Out')).toBeTruthy();
    });

    test('navigates to the correct route when a settings option is pressed', async () => {
        const rendered = render(
            <AuthProvider>
                <SettingsScreen />
            </AuthProvider>
        );
        await waitFor(() => expect(rendered.getByText('Settings')).toBeTruthy());
        const { router } = require('expo-router');
        fireEvent.press(rendered.getByText('Account'));
        expect(router.push).toHaveBeenCalledWith('/account');
        fireEvent.press(rendered.getByText('Notifications'));
        expect(router.push).toHaveBeenCalledWith('/notifications');
        fireEvent.press(rendered.getByText('Appearance'));
        expect(router.push).toHaveBeenCalledWith('/appearance');
    });

    test('signs out successfully by removing token and navigating to login', async () => {
        const rendered = render(
            <AuthProvider>
                <SettingsScreen />
            </AuthProvider>
        );
        await waitFor(() => expect(rendered.getByText('Sign Out')).toBeTruthy());
        const { router } = require('expo-router');
        (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(null);
        fireEvent.press(rendered.getByText('Sign Out'));
        await waitFor(() => {
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('username');
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('email');
            expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
        });
    });

    test('displays alert when sign out fails', async () => {
        const rendered = render(
            <AuthProvider>
                <SettingsScreen />
            </AuthProvider>
        );
        await waitFor(() => expect(rendered.getByText('Sign Out')).toBeTruthy());
        (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Error'));
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => { });
        fireEvent.press(rendered.getByText('Sign Out'));
        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to sign out.');
        });
        alertSpy.mockRestore();
    });

    test('applies dark theme styles correctly', async () => {
        // Override useTheme to return dark theme
        const useTheme = require('../../../../components/ThemeContext').useTheme;
        useTheme.mockReturnValue({ theme: 'dark' });
        const rendered = render(
            <AuthProvider>
                <SettingsScreen />
            </AuthProvider>
        );
        await waitFor(() => expect(rendered.getByText('Settings')).toBeTruthy());
        const { getByText } = rendered;
        const { Colors } = require('../../../../components/styles/Colors');
        // Check that the title text has the dark theme text color
        const titleText = getByText('Settings');
        expect(titleText.props.style).toMatchObject({ color: Colors.dark.text });

        const tree = rendered.toJSON();

        // Helper function to recursively find nodes by type in the JSON tree
        function findAllByType(node: any, type: string): any[] {
            let results: any[] = [];
            if (!node) return results;
            if (Array.isArray(node)) {
                node.forEach(child => {
                    results = results.concat(findAllByType(child, type));
                });
            } else if (typeof node === 'object') {
                if (node.type === type) {
                    results.push(node);
                }
                if (node.children) {
                    results = results.concat(findAllByType(node.children, type));
                }
            }
            return results;
        }

        const images = findAllByType(tree, 'Image');
        expect(images.length).toBeGreaterThan(0);

        const { StyleSheet } = require('react-native');
        const flattenedStyle = StyleSheet.flatten(images[0].props.style);
        expect(flattenedStyle).toMatchObject({ tintColor: Colors.dark.text });
    });
});
