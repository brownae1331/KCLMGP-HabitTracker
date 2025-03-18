import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import StatsScreen from '../../(tabs)/stats';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
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

// Mock GoodHabitGraph similarly by dynamically requiring Text
jest.mock('../../../components/GoodHabitGraph', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return (props: any) => (
        <Text testID="goodHabitGraph">GoodHabitGraph - {props.habit}</Text>
    );
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

// Simple mock for Picker component to simulate user selection
jest.mock('@react-native-picker/picker', () => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    const Picker = (props: any) => {
        return (
            <View testID="habit-picker" style={props.style}>
                {React.Children.map(props.children, (child: any) => (
                    <TouchableOpacity onPress={() => props.onValueChange(child.props.value)}>
                        <Text>{child.props.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };
    Picker.Item = (props: any) => null;
    return { Picker };
});

describe('StatsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Displays ActivityIndicator while loading; shows no habits message when data is empty', async () => {
        // Mock AsyncStorage to return a username
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('testUser');
        // Mock fetch to return an empty array (no habits)
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([]),
            } as any)
        );

        const { getByText } = render(<StatsScreen />);

        // Wait for asynchronous operations to complete and verify that the no habits message is displayed
        await waitFor(() => {
            expect(
                getByText(
                    "You don't have any habits yet! Create a habit before seeing statistics about it."
                )
            ).toBeTruthy();
        });
    });

    test('When habits data is successfully fetched, displays Picker with prompt and shows GoodHabitGraph after selection', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('testUser');
        const habits = [{ habitName: 'Running' }, { habitName: 'Reading' }];
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(habits),
            } as any)
        );

        const { getByText, getByTestId } = render(<StatsScreen />);

        // Wait until loading finishes (the "Stats" title appears)
        await waitFor(() => {
            expect(getByText('Stats')).toBeTruthy();
        });

        // The Picker should be rendered
        const picker = getByTestId('habit-picker');
        expect(picker).toBeTruthy();

        // When no habit is selected initially, a prompt text should be displayed
        expect(
            getByText('Please select a habit to see statistics about your progress!')
        ).toBeTruthy();

        // Simulate user clicking to select "Running"
        const runningOption = getByText('Running');
        fireEvent.press(runningOption);

        // After selection, GoodHabitGraph should be rendered
        await waitFor(() => {
            expect(getByTestId('goodHabitGraph')).toBeTruthy();
            expect(getByText('GoodHabitGraph - Running')).toBeTruthy();
        });
    });

    test('When fetch request fails, handles error and displays no habits message', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('testUser');
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        // Mock fetch to return a non-ok response
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                statusText: 'Not Found',
            } as any)
        );

        const { getByText } = render(<StatsScreen />);

        await waitFor(() => {
            expect(
                getByText(
                    "You don't have any habits yet! Create a habit before seeing statistics about it."
                )
            ).toBeTruthy();
        });

        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    test('When AsyncStorage fails, remains in loading state and does not call fetch', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        // Mock AsyncStorage.getItem to throw an error
        (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('AsyncStorage error'));
        global.fetch = jest.fn(); // fetch should not be called

        const { queryByText } = render(<StatsScreen />);

        // Since AsyncStorage fails and username is not set, fetch is not called and loading state remains
        await waitFor(() => {
            expect(queryByText('Stats')).toBeNull();
        });
        expect(global.fetch).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    test('In dark theme, the Picker should apply the correct styles', async () => {
        // Override useTheme to return dark theme
        const useTheme = require('../../../components/ThemeContext').useTheme;
        useTheme.mockReturnValue({ theme: 'dark' });

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('testUser');
        const habits = [{ habitName: 'TestHabit' }];
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(habits),
            } as any)
        );

        const { getByTestId, getByText } = render(<StatsScreen />);

        await waitFor(() => {
            expect(getByText('Stats')).toBeTruthy();
        });

        const picker = getByTestId('habit-picker');
        // The computed style for styles.picker is { height: 50, width: '100%' }; in dark theme, color should be '#ffffff' and backgroundColor should be '#333333'
        expect(picker.props.style).toMatchObject({
            height: 50,
            width: '100%',
            color: '#ffffff',
            backgroundColor: '#333333',
        });
    });
});
