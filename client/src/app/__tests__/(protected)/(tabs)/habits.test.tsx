import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeScreen from '../../../(protected)/(tabs)/habits';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addHabit, getHabitsForDate, updateHabit, getHabitInterval, getHabitDays } from '../../../../lib/client';

// ----------------------
// Globally mock window.alert
// ----------------------
if (typeof window === 'undefined') {
    global.window = {} as any;
}
window.alert = jest.fn() as jest.Mock;

// ----------------------
// Extend the client module mock
// ----------------------
jest.mock('../../../../lib/client', () => ({
    addHabit: jest.fn(),
    getHabitsForDate: jest.fn(),
    updateHabit: jest.fn(),
    getHabitInterval: jest.fn(),
    getHabitDays: jest.fn(),
}));

// ----------------------
// Mock AsyncStorage
// ----------------------
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

// ----------------------
// Mock WeeklyCalendar using testID for testing purposes
// ----------------------
jest.mock('../../../../components/WeeklyCalendar', () => {
    return {
        WeeklyCalendar: (props: any) =>
            <div testID="weekly-calendar" {...props} />,
    };
});

// ----------------------
// Mock NewHabitModal and pass all props to a div for testing purposes
// ----------------------
jest.mock('../../../../components/NewHabitModal', () => {
    return {
        NewHabitModal: (props: any) =>
            <div testID="new-habit-modal" {...props} />,
    };
});

// ----------------------
// Mock IconSymbol
// ----------------------
jest.mock('../../../../components/ui/IconSymbol', () => {
    return {
        IconSymbol: (props: any) => <div testID="icon-symbol" {...props} />,
    };
});

// ----------------------
// Mock ThemedText
// ----------------------
jest.mock('../../../../components/ThemedText', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        ThemedText: (props: { children: any }) => <Text>{props.children}</Text>,
    };
});

// ----------------------
// Mock SharedStyles and Colors
// ----------------------
jest.mock('../../../../components/styles/SharedStyles', () => ({
    SharedStyles: { titleContainer: {}, addButtonContainer: {} },
}));
jest.mock('../../../../components/styles/Colors', () => ({
    Colors: {
        light: {
            background: '#fff',
            text: '#000',
        },
        dark: {
            background: '#000',
            text: '#fff',
        },
    },
}));

// ----------------------
// Mock ThemeContext
// ----------------------
jest.mock('../../../../components/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

// ----------------------
// Mock HabitPanel to trigger onEdit callback when pressed
// ----------------------
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
        (window.alert as jest.Mock).mockClear();
    });

    test('renders correctly and displays "Today" for the current date', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        const { getByText } = render(<HomeScreen />);

        // Flush pending state updates
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

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

        // Open the modal
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });

        const modal = getByTestId('new-habit-modal');
        // Simulate valid input: set habitName and intervalDays
        act(() => {
            modal.props.setHabitName('New Habit');
            modal.props.setIntervalDays('5');
        });

        // Call onAddHabit and wait for asynchronous updates
        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(addHabit).toHaveBeenCalledWith({
            email: 'user@example.com',
            habitName: 'New Habit',
            habitDescription: '',
            habitType: 'build',
            habitColor: '#FFFF00',
            scheduleOption: 'interval',
            intervalDays: 5,
            selectedDays: [],
            goalValue: null,
            goalUnit: null,
        });

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(false);
        });
    });

    test('handles error in fetchHabits', async () => {
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

    test('handles error in AsyncStorage loadEmail', async () => {
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

        await act(async () => {
            const habitPanel = await findByTestId('habit-panel');
            fireEvent.press(habitPanel);
        });

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
        });

        const modal = getByTestId('new-habit-modal');
        // Change habit name to avoid uniqueness validation (simulate update)
        act(() => {
            modal.props.setHabitName('Updated Habit');
        });

        // Call onAddHabit to update the habit
        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(updateHabit).toHaveBeenCalled();
        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(false);
        });
    });

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

    test('handles error in handleEditHabit for interval schedule', async () => {
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

    test('handles error in handleEditHabit for weekly schedule', async () => {
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

    test('displays formatted date when selected date is not today', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        const { getByTestId, getByText } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            const weeklyCalendar = getByTestId('weekly-calendar');
            const newDate = new Date('2020-01-01');
            // Simulate date selection by calling setSelectedDate from the WeeklyCalendar mock
            weeklyCalendar.props.setSelectedDate({ date: newDate.getDate(), fullDate: newDate });
        });

        expect(getByText('January 1')).toBeTruthy();
    });

    test('handles add habit error', async () => {
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

        // Simulate valid input to avoid validation errors
        act(() => {
            modal.props.setHabitName('New Habit');
            modal.props.setIntervalDays('5');
        });

        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding habit:', expect.any(Error));

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(false);
        });
        consoleErrorSpy.mockRestore();
    });

    test('handles update habit error', async () => {
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
        // Change habit name to bypass uniqueness validation
        act(() => {
            modal.props.setHabitName('Updated Habit');
        });

        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating habit:', expect.any(Error));

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(false);
        });
        consoleErrorSpy.mockRestore();
    });

    // Test that an empty habit name triggers the appropriate alert and early return.
    test('shows alert when habit name is empty', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]); // no existing habits

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        // Open the modal.
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        // Do not set habitName, so it remains empty.
        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(window.alert).toHaveBeenCalledWith('Habit name cannot be empty.');
        // Modal should remain open as the habit wasn't added.
        expect(modal.props.modalVisible).toBe(true);
    });

    // Test that a duplicate habit name triggers the appropriate alert.
    test('shows alert if a habit with the same name already exists', async () => {
        const existingHabit = {
            user_email: 'user@example.com',
            habitName: 'Existing Habit',
            scheduleOption: 'interval',
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        // Return an array with the existing habit
        (getHabitsForDate as jest.Mock).mockResolvedValue([existingHabit]);

        const { getByTestId, findByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        // Open the modal.
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Existing Habit');
            // Set schedule option and valid intervalDays to pass validations.
            modal.props.setScheduleOption('interval');
            modal.props.setIntervalDays('5');
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(window.alert).toHaveBeenCalledWith(
            'A habit with this name already exists for this user.'
        );
        expect(modal.props.modalVisible).toBe(true);
    });

    // Test fallback color: if habitColor is empty, it should default to '#FFFF00'
    test('defaults to #FFFF00 if no color is chosen', async () => {
        // Simulate that email is already stored and no habits exist.
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        (addHabit as jest.Mock).mockResolvedValue({});

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() =>
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('email')
        );

        // Open the New Habit Modal by pressing the add button (icon-symbol).
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });

        const modal = getByTestId('new-habit-modal');
        // Set up the fields so that validation passes except for color.
        act(() => {
            // Removed setEmail since it's not provided to the modal.
            modal.props.setHabitName('Colorless Habit');
            modal.props.setHabitColor(''); // Empty color triggers fallback to '#FFFF00'
            modal.props.setHabitDescription('');
            modal.props.setHabitType('build');
            modal.props.setScheduleOption('interval');
            modal.props.setIntervalDays('5'); // Valid numeric input for intervalDays
            // Other fields (selectedDays, goal fields) can remain at their default values.
        });

        // Call onAddHabit and wait for asynchronous state updates.
        await act(async () => {
            await modal.props.onAddHabit();
        });

        // Verify that addHabit was called with the fallback color.
        expect(addHabit).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'user@example.com',
                goalUnit: null,
                goalValue: null,
                habitDescription: '',
                habitName: 'Colorless Habit',
                habitColor: '#FFFF00',
                habitType: 'build',
                scheduleOption: 'interval',
                intervalDays: 5,
                selectedDays: [],
            })
        );
    });

    // Test that an invalid intervalDays (non-numeric) triggers the correct alert.
    test('shows alert if intervalDays is not a valid number', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        // Open modal.
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Interval Habit');
            modal.props.setScheduleOption('interval');
            modal.props.setIntervalDays('abc'); // invalid number
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(window.alert).toHaveBeenCalledWith(
            'Please enter a valid number of days for the interval schedule.'
        );
        expect(modal.props.modalVisible).toBe(true);
    });

    // Test that an empty selectedDays array for weekly schedule triggers the alert.
    test('shows alert if no days selected for weekly schedule', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        // Open modal.
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Weekly Habit');
            modal.props.setScheduleOption('weekly');
            modal.props.setSelectedDays([]); // no days selected
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(window.alert).toHaveBeenCalledWith(
            'Please select at least one day for the weekly schedule.'
        );
        expect(modal.props.modalVisible).toBe(true);
    });

    // Test that when isGoalEnabled is true, goal fields are handled correctly.
    test('handles goal fields when isGoalEnabled is true', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        (addHabit as jest.Mock).mockResolvedValue({});

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        // Open modal.
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Goal Habit');
            modal.props.setIsGoalEnabled(true);
            modal.props.setGoalValue('10');
            modal.props.setGoalUnit('pages');
            modal.props.setScheduleOption('interval');
            modal.props.setIntervalDays('5');
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(addHabit).toHaveBeenCalledWith(
            expect.objectContaining({
                habitName: 'Goal Habit',
                goalValue: 10,
                goalUnit: 'pages',
            })
        );
    });

    // Test the error branch in fetchHabits (when getHabitsForDate rejects)
    test('handles error in fetchHabits gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockRejectedValue(new Error('Fetch failed'));
        render(<HomeScreen />);
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error fetching habits for selected date:',
                expect.any(Error)
            );
        });
        consoleErrorSpy.mockRestore();
    });

    // Test the error branch in loadEmail (when AsyncStorage.getItem rejects)
    test('handles error in loadEmail gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Load email failed'));
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


    test('sets isGoalEnabled to true if habit has goalValue and goalUnit', async () => {
        const habit = {
            user_email: 'user@example.com',
            habitName: 'Habit with Goal',
            habitDescription: '',
            habitType: 'build',
            habitColor: '#007AFF',
            scheduleOption: 'interval',
            goalValue: 5,
            goalUnit: 'minutes',
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([habit]);
        (getHabitInterval as jest.Mock).mockResolvedValue({ increment: 3 });

        const { findByTestId, getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        // Press on the existing habit to edit
        await act(async () => {
            const habitPanel = await findByTestId('habit-panel');
            fireEvent.press(habitPanel);
        });

        await waitFor(() => {
            // The modal should open
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
        });

        const modal = getByTestId('new-habit-modal');
        // Because habit.goalValue = 5 and goalUnit = 'minutes', isGoalEnabled should be true
        expect(modal.props.isGoalEnabled).toBe(true);
        // The fields should be pre-filled
        expect(modal.props.goalValue).toBe('5');     // from habit.goalValue.toString()
        expect(modal.props.goalUnit).toBe('minutes');
    });
});
