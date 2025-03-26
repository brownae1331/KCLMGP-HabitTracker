import React from 'react';
import { Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HabitPanel, { Habit } from '../HabitPanel';
import * as client from '../../lib/client';
import renderer from 'react-test-renderer';

// Mock client functions
jest.mock('../../lib/client', () => ({
    updateHabitProgress: jest.fn(),
    getHabitStreak: jest.fn(),
    deleteHabit: jest.fn(),
    findLastScheduledDate: jest.fn(),
    getHabitInterval: jest.fn().mockResolvedValue({ increment: 1 }),
    getHabitDays: jest.fn().mockResolvedValue([]),
}));

// Provide a sample habit object for testing
const sampleHabit: Habit = {
    user_email: 'user@example.com',
    habitName: 'Test Habit',
    habitDescription: 'Habit description',
    habitType: 'build',
    habitColor: '#123456',
    scheduleOption: 'interval',
    intervalDays: 3,
    selectedDays: [],
    isGoalEnabled: false,
    goalValue: null,
    goalUnit: '',
};

describe('HabitPanel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (client.getHabitStreak as jest.Mock).mockResolvedValue({ streak: 1 });
        jest.spyOn(Alert, 'alert').mockImplementation(() => { }); // silence alerts
    });

    it('calls onEdit with habit when edit button is pressed', () => {
        const onEdit = jest.fn();
        const component = render(<HabitPanel habit={sampleHabit} onEdit={onEdit} />);
        const touchables = component.UNSAFE_getAllByType(TouchableOpacity);
        const editButton = touchables.find(t => {
            const children = t.props.children;
            if (!children) return false;
            if (Array.isArray(children)) {
                return children.some((child: any) => child.props && child.props.name === 'pencil');
            }
            return children.props && children.props.name === 'pencil';
        });
        expect(editButton).toBeDefined();
        if (editButton) {
            fireEvent.press(editButton);
        }
        expect(onEdit).toHaveBeenCalledWith(sampleHabit);
    });


    it('updates build habit progress and displays confirmation message', async () => {
        (client.updateHabitProgress as jest.Mock).mockResolvedValueOnce(undefined);
        (client.getHabitStreak as jest.Mock).mockResolvedValueOnce({ streak: 1 });
        const { getByPlaceholderText, getByText } = render(
            <HabitPanel habit={sampleHabit} />
        );

        // Enter a progress value and press "Update"
        const progressInput = getByPlaceholderText('e.g. 10');
        fireEvent.changeText(progressInput, '5');
        fireEvent.press(getByText('Update'));

        // Assert updateHabitProgress called with numeric 5 and check confirmation text
        await waitFor(() => {
            expect(client.updateHabitProgress).toHaveBeenCalledWith(
                sampleHabit.user_email,
                sampleHabit.habitName,
                5
            );
            expect(getByText('Progress updated to 5')).toBeTruthy();
        });
        // Streak should be updated via getHabitStreak
        expect(client.getHabitStreak).toHaveBeenCalled();
    });

    it('updates quit habit status to "yes" and shows confirmation', async () => {
        const quitHabit = { ...sampleHabit, habitType: 'quit' as const };
        (client.updateHabitProgress as jest.Mock).mockResolvedValueOnce(undefined);
        (client.getHabitStreak as jest.Mock).mockResolvedValueOnce({ streak: 0 });
        const { getByText } = render(<HabitPanel habit={quitHabit} />);

        // Press "Yes" button and then "Update"
        fireEvent.press(getByText('Yes'));
        fireEvent.press(getByText('Update'));

        await waitFor(() => {
            expect(client.updateHabitProgress).toHaveBeenCalledWith(
                quitHabit.user_email,
                quitHabit.habitName,
                1
            );
            expect(getByText('Quit status updated to yes')).toBeTruthy();
        });
    });

    it('updates quit habit status to "no" and shows confirmation', async () => {
        const quitHabit = { ...sampleHabit, habitType: 'quit' as const };
        (client.updateHabitProgress as jest.Mock).mockResolvedValueOnce(undefined);
        (client.getHabitStreak as jest.Mock).mockResolvedValueOnce({ streak: 0 });
        const { getByText } = render(<HabitPanel habit={quitHabit} />);

        // Press "No" and then "Update"
        fireEvent.press(getByText('No'));
        fireEvent.press(getByText('Update'));

        await waitFor(() => {
            expect(client.updateHabitProgress).toHaveBeenCalledWith(
                quitHabit.user_email,
                quitHabit.habitName,
                0
            );
            expect(getByText('Quit status updated to no')).toBeTruthy();
        });
    });

    it('calls onDelete after successful deletion', async () => {
        (client.deleteHabit as jest.Mock).mockResolvedValueOnce(undefined);
        const onDelete = jest.fn();
        const { getByText } = render(<HabitPanel habit={sampleHabit} onDelete={onDelete} />);

        fireEvent.press(getByText('Delete Habit'));

        await waitFor(() => {
            expect(client.deleteHabit).toHaveBeenCalledWith(
                sampleHabit.user_email,
                sampleHabit.habitName
            );
            expect(onDelete).toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Success', 'Habit deleted successfully');
        });
    });

    it('shows error alert if deletion fails', async () => {
        (client.deleteHabit as jest.Mock).mockRejectedValueOnce(new Error('Delete error'));
        const onDelete = jest.fn();
        const { getByText } = render(<HabitPanel habit={sampleHabit} onDelete={onDelete} />);

        fireEvent.press(getByText('Delete Habit'));

        await waitFor(() => {
            expect(client.deleteHabit).toHaveBeenCalled();
            expect(onDelete).not.toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Error deleting habit');
        });
    });
});
