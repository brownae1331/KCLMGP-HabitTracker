import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../(protected)/(tabs)/settings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Image } from 'react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
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
jest.mock('../../../components/ThemeContext', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' })),
}));

// Mock ThemedText by dynamically requiring 'react-native' to get Text
jest.mock('../../../components/ThemedText', () => {
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
jest.mock('../../../components/styles/Colors', () => ({
    Colors: {
        light: { background: '#fff', text: '#000' },
        dark: { background: '#000', text: '#fff' },
    },
}));

jest.mock('../../../components/styles/SharedStyles', () => ({
    SharedStyles: { titleContainer: { padding: 10 } },
}));

describe('SettingsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders settings screen correctly with title, options, and sign out button', () => {
        const { getByText } = render(<SettingsScreen />);
        // Verify title is rendered
        expect(getByText('Settings')).toBeTruthy();
        // Verify each settings option is rendered
        expect(getByText('Account')).toBeTruthy();
        expect(getByText('Notifications')).toBeTruthy();
        expect(getByText('Appearance')).toBeTruthy();
        // Verify sign out button is rendered
        expect(getByText('Sign Out')).toBeTruthy();
    });

    test('navigates to the correct route when a settings option is pressed', () => {
        const { getByText } = render(<SettingsScreen />);
        const { router } = require('expo-router');
        // Simulate press on "Account" option
        fireEvent.press(getByText('Account'));
        expect(router.push).toHaveBeenCalledWith('/account');
        // Simulate press on "Notifications" option
        fireEvent.press(getByText('Notifications'));
        expect(router.push).toHaveBeenCalledWith('/notifications');
        // Simulate press on "Appearance" option
        fireEvent.press(getByText('Appearance'));
        expect(router.push).toHaveBeenCalledWith('/appearance');
    });

    test('signs out successfully by removing token and navigating to login', async () => {
        const { getByText } = render(<SettingsScreen />);
        const { router } = require('expo-router');
        (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(null);
        // Simulate sign out button press
        fireEvent.press(getByText('Sign Out'));
        await waitFor(() => {
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
            expect(router.replace).toHaveBeenCalledWith('/login');
        });
    });

    test('displays alert when sign out fails', async () => {
        const { getByText } = render(<SettingsScreen />);
        (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Error'));
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => { });
        // Simulate sign out button press
        fireEvent.press(getByText('Sign Out'));
        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to sign out.');
        });
        alertSpy.mockRestore();
    });

    test('applies dark theme styles correctly', async () => {
        // Override useTheme to return dark theme
        const useTheme = require('../../../components/ThemeContext').useTheme;
        useTheme.mockReturnValue({ theme: 'dark' });
        const renderResult = render(<SettingsScreen />);
        const { getByText } = renderResult;
        const { Colors } = require('../../../components/styles/Colors');
        // Check that the title text has the dark theme text color
        const titleText = getByText('Settings');
        expect(titleText.props.style).toMatchObject({ color: Colors.dark.text });

        // Use the JSON tree to find all Image nodes
        const tree = renderResult.toJSON();

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

        // In case the style is an array, flatten it using StyleSheet.flatten
        const { StyleSheet } = require('react-native');
        const flattenedStyle = StyleSheet.flatten(images[0].props.style);
        expect(flattenedStyle).toMatchObject({ tintColor: Colors.dark.text });
    });


});
