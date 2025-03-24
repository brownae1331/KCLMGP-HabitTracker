import React from 'react';
import { render, waitFor, act, cleanup } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// Inline mock for Colors module with required properties
jest.mock('../../../../components/styles/Colors', () => ({
    Colors: {
        light: {
            tint: 'blue',
            background: 'white',
            text: 'black',
            background2: 'gray',
            title: 'black',
            border: 'lightgray',
            placeholder: 'gray',
        },
        dark: {
            tint: 'blue',
            background: 'black',
            text: 'white',
            background2: 'gray',
            title: 'white',
            border: 'darkgray',
            placeholder: 'lightgray',
        },
    },
}));

// Inline mock for ThemedText component using react-native's Text component
jest.mock('../../../../components/ThemedText', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        ThemedText: (props: any) => React.createElement(Text, props, props.children),
    };
});

// Use fake timers for setTimeout in the component
jest.useFakeTimers();

// Ensure useColorScheme returns 'light'
jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('light');

// Inline mock for AsyncStorage that returns a Promise<string>
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn((): Promise<string> => Promise.resolve('test@example.com')),
}));

// Define HabitProgress type and inline mock for getHabitProgressByDate returning Promise<HabitProgress[]>
type HabitProgress = { habitType: string; progress: number; goalValue: number };
jest.mock('../../../../lib/client', () => ({
    getHabitProgressByDate: jest.fn((): Promise<HabitProgress[]> => Promise.resolve([])),
}));

// Inline mock for useTheme hook to return fixed theme data
jest.mock('../../../../components/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', refreshKey: '1', toggleTheme: jest.fn() }),
}));

// Inline mock for CalendarComponent that calls onVisibleDatesChange with sample dates
jest.mock('../../../../components/MonthlyCalendar', () => {
    const React = require('react');
    return {
        CalendarComponent: (props: any) => {
            React.useEffect(() => {
                if (props.onVisibleDatesChange) {
                    props.onVisibleDatesChange(['2023-08-01', '2023-08-02']);
                }
            }, []);
            return null;
        },
    };
});

// Inline mock for StatsBoxComponent to output its props using react-native's Text component.
// This component is given a testID ("statsBox") for easy querying.
jest.mock('../../../../components/StatsBox', () => {
    const { Text } = require('react-native');
    return {
        StatsBoxComponent: (props: any) => (
            <Text testID="statsBox">
                {JSON.stringify({
                    completionPercentage: props.completionPercentage,
                    currentStreak: props.currentStreak,
                    longestStreak: props.longestStreak,
                })}
            </Text>
        ),
    };
});

// Import the component under test
import CalendarScreen from '../../../(protected)/(tabs)/calendar';

// Cleanup after each test
afterEach(() => {
    jest.clearAllTimers();
    cleanup();
});

describe('CalendarScreen', () => {
    // Test that the loading indicator is shown when the theme is not loaded.
    // Note: The component should include testID="activity-indicator" on its ActivityIndicator.
    it('renders loading indicator when theme is not loaded', async () => {
        // Render the component without advancing timers so that isThemeLoaded remains false
        const rendered = render(
            <NavigationContainer>
                <CalendarScreen />
            </NavigationContainer>
        );
        // Try to get the ActivityIndicator by testID; if not found, fallback to getByType
        let indicator;
        try {
            indicator = rendered.getByTestId('activity-indicator');
        } catch (e) {
            const { ActivityIndicator } = require('react-native');
            indicator = rendered.UNSAFE_getByType(ActivityIndicator);
        }
        expect(indicator).toBeTruthy();
    });

    // Test that the CalendarScreen renders and displays the title "Calendar"
    it('renders CalendarScreen and displays title "Calendar"', async () => {
        // Render the component
        const rendered = render(
            <NavigationContainer>
                <CalendarScreen />
            </NavigationContainer>
        );
        // Advance timers to trigger the theme loading (setTimeout of 50ms)
        act(() => {
            jest.advanceTimersByTime(60);
        });
        // Wait for the component to update and assert that the title is present
        await waitFor(() => {
            expect(rendered.getByText('Calendar')).toBeTruthy();
        });
    });

    // Test that getHabitProgressByDate is called when visible dates are available
    it('calls getHabitProgressByDate when visible dates are available', async () => {
        render(
            <NavigationContainer>
                <CalendarScreen />
            </NavigationContainer>
        );
        act(() => {
            jest.advanceTimersByTime(60);
        });
        // Import getHabitProgressByDate from the client module and cast it as jest.Mock
        const { getHabitProgressByDate } = require('../../../../lib/client');
        await waitFor(() => {
            expect(getHabitProgressByDate as jest.Mock).toHaveBeenCalled();
        });
    });

    // Test that a warning is logged when AsyncStorage returns null
    it('logs warning when AsyncStorage returns null', async () => {
        // Spy on console.warn
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        // Override getItem to return null
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() => Promise.resolve(null));
        render(
            <NavigationContainer>
                <CalendarScreen />
            </NavigationContainer>
        );
        act(() => {
            jest.advanceTimersByTime(60);
        });
        await waitFor(() => {
            expect(consoleWarnSpy).toHaveBeenCalledWith('No email found in AsyncStorage');
        });
        consoleWarnSpy.mockRestore();
    });

    // Test error handling when getHabitProgressByDate throws an error
    it('handles error in fetching habit progress', async () => {
        // Spy on console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const { getHabitProgressByDate } = require('../../../../lib/client');
        (getHabitProgressByDate as jest.Mock).mockImplementationOnce(() =>
            Promise.reject(new Error('Test fetch error'))
        );
        render(
            <NavigationContainer>
                <CalendarScreen />
            </NavigationContainer>
        );
        act(() => {
            jest.advanceTimersByTime(60);
        });
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching habit progress:', expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });

    // Test the calculation of completion percentage and streak when valid progress data is returned
    it('calculates completion percentage and streak correctly', async () => {
        const { getHabitProgressByDate } = require('../../../../lib/client');
        // Override the mock to return progress data with 100% completion for each date
        (getHabitProgressByDate as jest.Mock).mockImplementation(() =>
            Promise.resolve([{ habitType: 'build', progress: 10, goalValue: 10 }])
        );
        // Set fixed system time to control "today"
        const fixedDate = new Date('2023-08-15T00:00:00Z');
        jest.setSystemTime(fixedDate);
        const rendered = render(
            <NavigationContainer>
                <CalendarScreen />
            </NavigationContainer>
        );
        act(() => {
            jest.advanceTimersByTime(60);
        });
        await waitFor(() => {
            const statsBox = rendered.getByTestId('statsBox');
            const stats = JSON.parse(statsBox.props.children);
            expect(stats.completionPercentage).toBe(100);
            expect(stats.currentStreak).toBeGreaterThan(0);
            expect(stats.longestStreak).toBeGreaterThan(0);
        });
        jest.useRealTimers();
    });
});
