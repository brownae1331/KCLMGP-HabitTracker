import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeScreen from '../../../(protected)/(tabs)/habits';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addHabit, getHabitsForDate, updateHabit, getHabitInterval, getHabitDays } from '../../../../lib/client';

// Extend the client mock to include update and schedule functions
jest.mock('../../../../lib/client', () => ({
    addHabit: jest.fn(),
    getHabitsForDate: jest.fn(),
    updateHabit: jest.fn(),
    getHabitInterval: jest.fn(),
    getHabitDays: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

// Update WeeklyCalendar mock to use testID (as used in react-native)
jest.mock('../../../../components/WeeklyCalendar', () => {
    return {
        WeeklyCalendar: (props: any) => {
            return <div testID="weekly-calendar" {...props} />;
        },
    };
});

// NewHabitModal mock passes all props to a div for testing purposes
jest.mock('../../../../components/NewHabitModal', () => {
    return {
        NewHabitModal: (props: any) => {
            return <div testID="new-habit-modal" {...props} />;
        },
    };
});

// IconSymbol mock
jest.mock('../../../../components/ui/IconSymbol', () => {
    return {
        IconSymbol: (props: any) => <div testID="icon-symbol" {...props} />,
    };
});

// ThemedText mock
jest.mock('../../../../components/ThemedText', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        ThemedText: (props: { children: any; }) => <Text>{props.children}</Text>,
    };
});

// SharedStyles and Colors mocks
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

// ThemeContext mock
jest.mock('../../../../components/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

// HabitPanel mock that triggers onEdit via a press event
jest.mock('../../../../components/HabitPanel', () => {
    const React = require('react');
    const { Text, TouchableOpacity } = require('react-native');
    return (props: any) => (
        <TouchableOpacity testID="habit-panel" onPress={() => props.onEdit(props.habit)}>
            <Text>{props.habit.habitName}</Text>
        </TouchableOpacity>
    );
});

describe('HomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly and displays "Today" for the current date', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        const { getByText } = render(<HomeScreen />);
        await waitFor(() => {
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('email');
        });
        expect(getByText('Today')).toBeTruthy();
    });

    test('renders habits when they exist', async () => {
        const habit = { user_email: 'user@example.com', habitName: 'Test Habit' };
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
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
        });
    });

    test('handles add habit correctly', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        (addHabit as jest.Mock).mockResolvedValue({});
        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });

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

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(false);
        });
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

    // Test update habit branch (interval schedule)
    test('handles update habit correctly', async () => {
        const habit = {
            user_email: 'user@example.com',
            habitName: 'Existing Habit',
            habitDescription: 'Existing description',
            habitType: 'build',
            habitColor: '#007AFF',
            scheduleOption: 'interval',
            goalValue: null,
            goalUnit: null,
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([habit]);
        (getHabitInterval as jest.Mock).mockResolvedValue({ increment: 5 });
        (updateHabit as jest.Mock).mockResolvedValue({});

        const { getByTestId, findByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        // Wrap the press event in act to trigger state updates for editing
        await act(async () => {
            const habitPanel = await findByTestId('habit-panel');
            fireEvent.press(habitPanel);
        });

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
        });

        const modal = getByTestId('new-habit-modal');
        // The modal should be pre-filled with habit data and intervalDays from getHabitInterval
        expect(modal.props.habitName).toBe(habit.habitName);
        expect(modal.props.intervalDays).toBe('5');

        // Simulate updating the habit (update branch)
        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(updateHabit).toHaveBeenCalled();
        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(false);
        });
    });

    // Test edit habit with weekly schedule branch
    test('handles edit habit with weekly schedule correctly', async () => {
        const habit = {
            user_email: 'user@example.com',
            habitName: 'Weekly Habit',
            habitDescription: 'Weekly description',
            habitType: 'build',
            habitColor: '#007AFF',
            scheduleOption: 'weekly',
            goalValue: null,
            goalUnit: null,
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([habit]);
        (getHabitDays as jest.Mock).mockResolvedValue([{ day: 'Monday' }, { day: 'Wednesday' }]);

        const { getByTestId, findByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            const habitPanel = await findByTestId('habit-panel');
            fireEvent.press(habitPanel);
        });

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
        });

        const modal = getByTestId('new-habit-modal');
        expect(modal.props.habitName).toBe(habit.habitName);
        expect(modal.props.selectedDays).toEqual(['Monday', 'Wednesday']);
    });

    // Test error handling in edit habit for interval schedule
    test('handles error in handleEditHabit for interval schedule gracefully', async () => {
        const habit = {
            user_email: 'user@example.com',
            habitName: 'Error Habit',
            habitDescription: 'Error description',
            habitType: 'build',
            habitColor: '#007AFF',
            scheduleOption: 'interval',
            goalValue: null,
            goalUnit: null,
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([habit]);
        (getHabitInterval as jest.Mock).mockRejectedValue(new Error('Interval fetch failed'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const { getByTestId, findByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            const habitPanel = await findByTestId('habit-panel');
            fireEvent.press(habitPanel);
        });

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching habit interval or days:', expect.any(Error));
        });

        consoleErrorSpy.mockRestore();
    });

    // Test error handling in edit habit for weekly schedule
    test('handles error in handleEditHabit for weekly schedule gracefully', async () => {
        const habit = {
            user_email: 'user@example.com',
            habitName: 'Error Weekly Habit',
            habitDescription: 'Error weekly description',
            habitType: 'build',
            habitColor: '#007AFF',
            scheduleOption: 'weekly',
            goalValue: null,
            goalUnit: null,
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([habit]);
        (getHabitDays as jest.Mock).mockRejectedValue(new Error('Days fetch failed'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const { getByTestId, findByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            const habitPanel = await findByTestId('habit-panel');
            fireEvent.press(habitPanel);
        });

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching habit interval or days:', expect.any(Error));
        });

        consoleErrorSpy.mockRestore();
    });

    // Test that a non-today selected date is displayed in formatted form
    test('displays formatted date when selected date is not today', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        const { getByTestId, getByText } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            const weeklyCalendar = getByTestId('weekly-calendar');
            const newDate = new Date('2020-01-01');
            // Invoke setSelectedDate from the WeeklyCalendar mock
            weeklyCalendar.props.setSelectedDate({ date: newDate.getDate(), fullDate: newDate });
        });

        expect(getByText('January 1')).toBeTruthy();
    });

    // Test error handling when adding a habit fails
    test('handles add habit error gracefully', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        (addHabit as jest.Mock).mockRejectedValue(new Error('Add habit failed'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');

        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding habit:', expect.any(Error));

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(false);
        });
        consoleErrorSpy.mockRestore();
    });

    // Test error handling when update habit fails (update branch)
    test('handles update habit error gracefully', async () => {
        const habit = {
            user_email: 'user@example.com',
            habitName: 'Existing Habit',
            habitDescription: 'Existing description',
            habitType: 'build',
            habitColor: '#007AFF',
            scheduleOption: 'interval',
            goalValue: null,
            goalUnit: null,
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([habit]);
        (getHabitInterval as jest.Mock).mockResolvedValue({ increment: 5 });
        (updateHabit as jest.Mock).mockRejectedValue(new Error('Update failed'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const { getByTestId, findByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            const habitPanel = await findByTestId('habit-panel');
            fireEvent.press(habitPanel);
        });

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
        });

        const modal = getByTestId('new-habit-modal');
        await act(async () => {
            await modal.props.onAddHabit();
        });

        // Expect error logged with "Error updating habit:" because the update branch should be taken
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating habit:', expect.any(Error));

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(false);
        });
        consoleErrorSpy.mockRestore();
    });
});
