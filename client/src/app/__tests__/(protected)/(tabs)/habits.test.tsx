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
// Updated Mock for HabitPanel to include both edit and delete buttons
// ----------------------
jest.mock('../../../../components/HabitPanel', () => {
    const React = require('react');
    const { Text, TouchableOpacity, View } = require('react-native');
    return (props: any) => (
        <View>
            <TouchableOpacity testID="habit-panel-edit" onPress={() => props.onEdit(props.habit)}>
                <Text>{props.habit.habitName}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID={`delete-button-${props.habit.habitName}`} onPress={props.onDelete}>
                <Text>Delete</Text>
            </TouchableOpacity>
        </View>
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

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await waitFor(() => {
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('email');
        });
        expect(getByText('Today')).toBeTruthy();
    });

    test('renders habits when they exist', async () => {
        const habit = { user_email: 'user@example.com', habitName: 'Test Habit', scheduleOption: 'interval' };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([habit]);

        const { findByText } = render(<HomeScreen />);
        expect(await findByText('Test Habit')).toBeTruthy();
    });

    test('shows "Press the plus button to add new habits!" when there are no habits', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        const { getByText } = render(<HomeScreen />);
        await waitFor(() => {
            expect(getHabitsForDate).toHaveBeenCalled();
        });
        expect(getByText('Press the plus button to add new habits!')).toBeTruthy();
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

        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(addHabit).toHaveBeenCalledWith({
            email: 'user@example.com',
            habitName: 'New Habit',
            habitDescription: '',
            habitType: 'build',
            habitColor: '#FFCC00',
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
            const habitPanel = await findByTestId('habit-panel-edit');
            fireEvent.press(habitPanel);
        });

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
        });

        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Updated Habit');
        });

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
            const habitPanel = await findByTestId('habit-panel-edit');
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
            const habitPanel = await findByTestId('habit-panel-edit');
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
            const habitPanel = await findByTestId('habit-panel-edit');
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

        act(() => {
            modal.props.setHabitName('New Habit');
            modal.props.setIntervalDays('5');
        });

        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding/updating habit:', expect.any(Error));

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
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
            const habitPanel = await findByTestId('habit-panel-edit');
            fireEvent.press(habitPanel);
        });

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
        });

        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Updated Habit');
        });

        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding/updating habit:', expect.any(Error));

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
        });
        consoleErrorSpy.mockRestore();
    });

    test('defaults to #FFCC00 if no color is chosen', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        (addHabit as jest.Mock).mockResolvedValue({});

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() =>
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('email')
        );

        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });

        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Colorless Habit');
            modal.props.setHabitColor(''); // empty color triggers fallback
            modal.props.setHabitDescription('');
            modal.props.setHabitType('build');
            modal.props.setScheduleOption('interval');
            modal.props.setIntervalDays('5');
        });

        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(addHabit).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'user@example.com',
                goalUnit: null,
                goalValue: null,
                habitDescription: '',
                habitName: 'Colorless Habit',
                habitColor: '#FFCC00',
                habitType: 'build',
                scheduleOption: 'interval',
                intervalDays: 5,
                selectedDays: [],
            })
        );
    });

    test('handles goal fields when isGoalEnabled is true', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
        (addHabit as jest.Mock).mockResolvedValue({});

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

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

        await act(async () => {
            const habitPanel = await findByTestId('habit-panel-edit');
            fireEvent.press(habitPanel);
        });

        await waitFor(() => {
            expect(getByTestId('new-habit-modal').props.modalVisible).toBe(true);
        });

        const modal = getByTestId('new-habit-modal');
        expect(modal.props.isGoalEnabled).toBe(true);
        expect(modal.props.goalValue).toBe('5');
        expect(modal.props.goalUnit).toBe('minutes');
    });
});

describe('Validation error tests', () => {
    beforeEach(() => {
        Object.defineProperty(require('react-native').Platform, 'OS', { get: () => 'web' });
    });

    test('shows alert when habit name is empty', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(window.alert).toHaveBeenCalledWith('Habit name cannot be empty.');
        expect(modal.props.modalVisible).toBe(true);
    });

    test('shows alert if a habit with the same name already exists', async () => {
        const existingHabit = {
            user_email: 'user@example.com',
            habitName: 'Existing Habit',
            scheduleOption: 'interval',
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([existingHabit]);

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Existing Habit');
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

    test('shows alert if intervalDays is not a valid number', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Interval Habit');
            modal.props.setScheduleOption('interval');
            modal.props.setIntervalDays('abc');
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(window.alert).toHaveBeenCalledWith(
            'Please enter a valid number of days for the interval schedule.'
        );
        expect(modal.props.modalVisible).toBe(true);
    });

    test('shows alert if no days selected for weekly schedule', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);

        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('email'));

        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Weekly Habit');
            modal.props.setScheduleOption('weekly');
            modal.props.setSelectedDays([]);
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(window.alert).toHaveBeenCalledWith(
            'Please select at least one day for the weekly schedule.'
        );
        expect(modal.props.modalVisible).toBe(true);
    });
});

describe('Additional coverage tests for uncovered lines', () => {
    beforeEach(() => {
        (window.alert as jest.Mock).mockClear();
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
        (getHabitsForDate as jest.Mock).mockResolvedValue([]);
    });

    // Already covered: edit mode changed name duplicate check in edit mode.
    test('edit mode changed name duplicates existing habit', async () => {
        const existingHabit = {
            user_email: 'test@example.com',
            habitName: 'Duplicate Habit',
            scheduleOption: 'interval',
        };
        (getHabitsForDate as jest.Mock).mockResolvedValue([existingHabit]);

        const { getByTestId, findByTestId } = render(<HomeScreen />);
        await waitFor(() =>
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('email')
        );

        await act(async () => {
            const habitPanel = await findByTestId('habit-panel-edit');
            fireEvent.press(habitPanel);
        });

        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Duplicate Habit');
            modal.props.setScheduleOption('interval');
            modal.props.setIntervalDays('5');
            modal.props.setIsGoalEnabled(false);
        });

        await act(async () => {
            await modal.props.onAddHabit();
        });

        expect(window.alert).toHaveBeenCalledWith(
            'Error saving habit'
        );
        expect(modal.props.modalVisible).toBe(true);
    });

    // Negative intervalDays check.
    test('shows alert if intervalDays is negative', async () => {
        const { getByTestId } = render(<HomeScreen />);

        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Neg Interval');
            modal.props.setScheduleOption('interval');
            modal.props.setIntervalDays('-3');
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(window.alert).toHaveBeenCalledWith('Interval days cannot be negative.');
        expect(modal.props.modalVisible).toBe(true);
    });

    // Goal validations.
    test('shows alert if goal is enabled but no goalValue provided', async () => {
        const { getByTestId } = render(<HomeScreen />);
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Some Habit');
            modal.props.setIsGoalEnabled(true);
            modal.props.setScheduleOption('weekly');
            modal.props.setSelectedDays(['Monday']);
            modal.props.setGoalValue('');
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(window.alert).toHaveBeenCalledWith('Please enter a valid goal value.');
        expect(modal.props.modalVisible).toBe(true);
    });

    test('shows alert if goal value is not a number', async () => {
        const { getByTestId } = render(<HomeScreen />);
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Some Goal Habit');
            modal.props.setIsGoalEnabled(true);
            modal.props.setScheduleOption('weekly');
            modal.props.setSelectedDays(['Monday']);
            modal.props.setGoalValue('abc');
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(window.alert).toHaveBeenCalledWith('Goal value must be a number.');
        expect(modal.props.modalVisible).toBe(true);
    });

    test('shows alert if goal value is negative', async () => {
        const { getByTestId } = render(<HomeScreen />);
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Some Goal Habit');
            modal.props.setIsGoalEnabled(true);
            modal.props.setScheduleOption('weekly');
            modal.props.setSelectedDays(['Monday']);
            modal.props.setGoalValue('-10');
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(window.alert).toHaveBeenCalledWith('Goal value cannot be negative.');
        expect(modal.props.modalVisible).toBe(true);
    });

    test('shows alert if goal unit is not provided', async () => {
        const { getByTestId } = render(<HomeScreen />);
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Goal Unit Habit');
            modal.props.setIsGoalEnabled(true);
            modal.props.setScheduleOption('weekly');
            modal.props.setSelectedDays(['Monday']);
            modal.props.setGoalValue('5');
            modal.props.setGoalUnit('');
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(window.alert).toHaveBeenCalledWith('Please enter a unit for your goal.');
        expect(modal.props.modalVisible).toBe(true);
    });

    // Final catch block in handleAddHabit.
    test('final catch block triggers error alert and retains modal open', async () => {
        (addHabit as jest.Mock).mockRejectedValueOnce(new Error('Server error in addHabit'));

        const { getByTestId } = render(<HomeScreen />);
        await act(async () => {
            fireEvent.press(getByTestId('icon-symbol'));
        });
        const modal = getByTestId('new-habit-modal');
        act(() => {
            modal.props.setHabitName('Catch Error');
            modal.props.setIntervalDays('5');
        });
        await act(async () => {
            await modal.props.onAddHabit();
        });
        expect(window.alert).toHaveBeenCalledWith('Error saving habit');
        expect(modal.props.modalVisible).toBe(true);
    });

    // New Test 1: if no email is present, fetchHabits returns early.
    test('does not call getHabitsForDate when email is empty', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        render(<HomeScreen />);
        await waitFor(() => {
            expect(getHabitsForDate).not.toHaveBeenCalled();
        });
    });

    // New Test 2: deletion calls fetchHabits (via getHabitsForDate) a second time.
    test('calls fetchHabits on habit deletion', async () => {
        const habit = { user_email: 'test@example.com', habitName: 'Habit To Delete', scheduleOption: 'interval' };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
        // First call returns one habit.
        (getHabitsForDate as jest.Mock).mockResolvedValueOnce([habit]);
        const { getByTestId } = render(<HomeScreen />);
        await waitFor(() => expect(getHabitsForDate).toHaveBeenCalled());
        // Simulate deletion via the delete button in the HabitPanel.
        fireEvent.press(getByTestId(`delete-button-${habit.habitName}`));
        await waitFor(() => expect(getHabitsForDate).toHaveBeenCalledTimes(2));
    });
});
