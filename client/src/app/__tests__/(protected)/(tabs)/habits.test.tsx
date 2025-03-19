import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeScreen from '../../../(protected)/(tabs)/habits';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addHabit, getHabitsForDate } from '../../../../lib/client';

// mock lib/client methods
jest.mock('../../../../lib/client', () => ({
    addHabit: jest.fn(),
    getHabitsForDate: jest.fn(),
}));

// mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

// mock components that are not in the scope of this test
jest.mock('../../../../components/WeeklyCalendar', () => {
    return {
        WeeklyCalendar: (props: any) => {
            return <div testID="weekly-calendar" {...props} />;
        },
    };
});

jest.mock('../../../../components/NewHabitModal', () => {
    return {
        NewHabitModal: (props: any) => {
            // for checking modalVisible and onAddHabit callback, pass all props to a div
            return <div testID="new-habit-modal" {...props} />;
        },
    };
});

jest.mock('../../../../components/WeeklyCalendar', () => {
    return {
        WeeklyCalendar: (props: any) => {
            return <div data-testid="weekly-calendar" {...props} />;
        },
    };
});

jest.mock('../../../../components/ui/IconSymbol', () => {
    return {
        IconSymbol: (props: any) => <div testID="icon-symbol" {...props} />,
    };
});

jest.mock('../../../../components/ThemedText', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        ThemedText: (props: { children: any; }) => <Text>{props.children}</Text>,
    };
});

jest.mock('../../../../components/styles/SharedStyles', () => ({
    SharedStyles: { titleContainer: {}, addButtonContainer: {} },
}));

jest.mock('../../../../components/styles/Colors', () => ({
    Colors: {
        light: {
            background: '#fff',
            text: '#000'
        },
        dark: {
            background: '#000',
            text: '#fff'
        },
    },
}));

jest.mock('../../../../components/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

jest.mock('../../../../components/HabitPanel', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return (props: any) => (
        <Text testID="habit-panel">{props.habit.habitName}</Text>
    );
});

describe('HomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly and displays "Today" for the current date', async () => {
        // mock AsyncStorage to return email and empty habits data
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        const { getByText } = render(<HomeScreen />);
        // wait for AsyncStorage to be called
        await waitFor(() => {
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('email');
        });
        // check that the title displays "Today"
        expect(getByText('Today')).toBeTruthy();
    });

    test('renders habits when they exist', async () => {
        const habit = { email: 'user@example.com', habitName: 'Test Habit' };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([habit]);

        const { findByText } = render(<HomeScreen />);
        expect(await findByText('Test Habit')).toBeTruthy();
    });

    test('shows "No habits found for this date." when there are no habits', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        const { getByText } = render(<HomeScreen />);
        await waitFor(() => {
            expect(getHabitsForDate).toHaveBeenCalled();
        });
        expect(getByText('No habits found for this date.')).toBeTruthy();
    });

    test('opens NewHabitModal when add habit button is pressed', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        const { getByTestId } = render(<HomeScreen />);
        // mock pressing the add button (IconSymbol component)
        const addButton = getByTestId('icon-symbol');
        fireEvent.press(addButton);
        // check that the modal is visible
        const modal = getByTestId('new-habit-modal');
        expect(modal.props.modalVisible).toBe(true);
    });

    test('handles add habit correctly', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        (addHabit as jest.Mock).mockResolvedValue({});

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        const addButton = getByTestId('icon-symbol');
        fireEvent.press(addButton);
        const modal = getByTestId('new-habit-modal');
        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(addHabit).toHaveBeenCalledWith({
            email: 'user@example.com',
            habitName: '',
            habitDescription: '',
            habitType: 'build',
            habitColor: '#007AFF',
            scheduleOption: 'interval',
            intervalDays: null,
            selectedDays: [],
            goalValue: null,
            goalUnit: null,
        });

        const updatedModal = getByTestId('new-habit-modal');
        expect(updatedModal.props.modalVisible).toBe(false);
    });

    test('handles error in fetchHabits gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));
        render(<HomeScreen />);
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error fetching habits for selected date:',
                expect.any(Error)
            );
        });
        consoleErrorSpy.mockRestore();
    });

    test('handles error in AsyncStorage loadEmail gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Failed to get email'));
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        render(<HomeScreen />);
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error loading email from AsyncStorage:',
                expect.any(Error)
            );
        });
        consoleErrorSpy.mockRestore();
    });
});
