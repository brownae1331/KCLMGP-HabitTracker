import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// mock Colors module, add "title" property
jest.mock('../../../components/styles/Colors', () => ({
    Colors: {
        light: { tint: 'blue', background: 'white', text: 'black', background2: 'gray', title: 'black' },
        dark: { tint: 'blue', background: 'black', text: 'white', background2: 'gray', title: 'white' },
    },
}));

// mock ThemedText component, use 'react-native' Text component in factory to avoid external reference
jest.mock('../../../components/ThemedText', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        ThemedText: (props: any) => React.createElement(Text, props, props.children),
    };
});

// use fake timers to mock setTimeout inside the component
jest.useFakeTimers();

// Ensure useColorScheme returns 'light' during tests
jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('light');

// Mock AsyncStorage getItem method to return a test email
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(() => Promise.resolve('test@example.com')),
}));

// mock getHabitProgressByDate to return an empty array
jest.mock('../../../lib/client', () => ({
    getHabitProgressByDate: jest.fn(() => Promise.resolve([])),
}));

// mock useTheme hook in ThemeContext to return fixed theme data
jest.mock('../../../components/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', refreshKey: '1', toggleTheme: jest.fn() }),
}));

// mock CalendarComponent to return an empty component
jest.mock('../../../components/MonthlyCalendar', () => ({
    CalendarComponent: (props: any) => <></>,
}));

// Mock StatsBoxComponent
jest.mock('../../../components/StatsBox', () => ({
    StatsBoxComponent: (props: any) => <></>,
}));

import CalendarScreen from '../../(tabs)/calendar';

describe('CalendarScreen', () => {
    afterEach(() => {
        jest.clearAllTimers();
    });

    it('renders CalendarScreen and displays title "Calendar"', async () => {
        const { getByText } = render(
            <NavigationContainer>
                <CalendarScreen />
            </NavigationContainer>
        );

        await act(async () => {
            jest.advanceTimersByTime(60);
        });

        await waitFor(() => {
            expect(getByText('Calendar')).toBeTruthy();
        });
    });

    it('calls getHabitProgressByDate when visible dates are available', async () => {
        render(
            <NavigationContainer>
                <CalendarScreen />
            </NavigationContainer>
        );

        await act(async () => {
            jest.advanceTimersByTime(60);
        });

        const { getHabitProgressByDate } = require('../../../lib/client');
        await waitFor(() => {
            expect(getHabitProgressByDate).toHaveBeenCalled();
        });
    });
});
