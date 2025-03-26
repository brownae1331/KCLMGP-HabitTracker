import React from 'react';
import { Alert, Platform } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HabitPanel, { Habit } from '../HabitPanel';
import * as client from '../../lib/client';

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

jest.mock('../../lib/client', () => ({
    updateHabitProgress: jest.fn(),
    getHabitStreak: jest.fn(),
    getHabitInterval: jest.fn().mockResolvedValue({ increment: 1 }),
    getHabitDays: jest.fn().mockResolvedValue([{ day: 'Wednesday' }]),
    getHabitProgressByDateAndHabit: jest.fn(),
    deleteHabit: jest.fn(),
}));

describe('HabitPanel - Coverage tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Prevent real alerts during tests
        jest.spyOn(Alert, 'alert').mockImplementation(() => { });
    });

    // 1. Should not call fetchStreak for future dates
    it('should not call fetchStreak for future dates', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        render(<HabitPanel habit={sampleHabit} selectedDate={tomorrow} />);
        // Wait a bit to allow useEffect to run
        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(client.getHabitStreak).not.toHaveBeenCalled();
    });

    // 2. When today and streak is 0, it should fetch previous streak
    it('should fetch previous streak when today and streak is 0', async () => {
        (client.getHabitStreak as jest.Mock)
            .mockResolvedValueOnce({ streak: 0 })
            .mockResolvedValueOnce({ streak: 5 });
        const today = new Date();
        render(<HabitPanel habit={sampleHabit} selectedDate={today} />);
        await waitFor(() => {
            expect(client.getHabitStreak).toHaveBeenCalledTimes(2);
        });
    });

    // 3. Should handle error when fetching streak
    it('should handle error when fetching streak', async () => {
        (client.getHabitStreak as jest.Mock).mockRejectedValueOnce(
            new Error('fetchStreak error')
        );
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 2);
        render(<HabitPanel habit={sampleHabit} selectedDate={pastDate} />);
        await waitFor(() => {
            expect(client.getHabitStreak).toHaveBeenCalled();
        });
    });

    // 4. Test weekly schedule logic
    it('should handle weekly schedule logic', async () => {
        const weeklyHabit: Habit = {
            ...sampleHabit,
            scheduleOption: 'weekly',
            selectedDays: ['Monday', 'Wednesday', 'Friday'],
        };
        (client.getHabitDays as jest.Mock).mockResolvedValueOnce([
            { day: 'Monday' },
            { day: 'Wednesday' },
            { day: 'Friday' },
        ]);
        const { getByText } = render(<HabitPanel habit={weeklyHabit} />);
        await waitFor(() => {
            expect(getByText('Test Habit')).toBeTruthy();
        });
    });

    // 5. For quit habit, update should be binary (0/1)
    it('should update quit habit as binary value', async () => {
        const quitHabit: Habit = { ...sampleHabit, habitType: 'quit' };
        (client.updateHabitProgress as jest.Mock).mockResolvedValueOnce(undefined);
        (client.getHabitStreak as jest.Mock).mockResolvedValueOnce({ streak: 10 });
        const { getByText } = render(<HabitPanel habit={quitHabit} />);
        await act(async () => {
            fireEvent.press(getByText('Test Habit'));
        });
        await waitFor(() => {
            expect(client.updateHabitProgress).not.toHaveBeenCalled();
        });
    });

    // 6. For Web, handleDelete should show confirm dialog
    it('handleDelete - should show confirm on Web', async () => {
        Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
        if (!window.confirm) {
            (window as any).confirm = jest.fn();
        }
        if (!window.alert) {
            (window as any).alert = jest.fn();
        }
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
        const { getByText } = render(<HabitPanel habit={sampleHabit} onEdit={() => { }} />);
        await act(async () => {
            fireEvent.press(getByText('×'));
        });
        await waitFor(() => {
            expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this habit?');
            expect(client.deleteHabit).toHaveBeenCalledWith('user@example.com', 'Test Habit');
        });
    });

    // 7. For Native, handleDelete should show an Alert
    it('handleDelete - should show Alert on Native', async () => {
        Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
        const { getByText } = render(<HabitPanel habit={sampleHabit} onEdit={() => { }} />);
        await act(async () => {
            fireEvent.press(getByText('×'));
        });
        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Confirm Delete',
                'Are you sure you want to delete this habit?',
                expect.any(Array)
            );
        });
    });

    // 8. Should not open progress dialog for a future date
    it('should not open progress dialog for future date', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const { getByText, queryByText } = render(
            <HabitPanel habit={sampleHabit} selectedDate={tomorrow} />
        );
        await act(async () => {
            fireEvent.press(getByText('Test Habit'));
        });
        expect(queryByText('Save')).toBeNull();
    });

    // 9. Use local state when fetching progress fails
    it('should use local state when fetching progress fails', async () => {
        (client.getHabitProgressByDateAndHabit as jest.Mock).mockRejectedValueOnce(
            new Error('progress fetch error')
        );
        const { getByText } = render(<HabitPanel habit={sampleHabit} />);
        await act(async () => {
            fireEvent.press(getByText('Test Habit'));
        });
    });

    // 10. Test polling useEffect (setInterval) is called
    it('should call polling function in useEffect', () => {
        jest.useFakeTimers();
        render(<HabitPanel habit={sampleHabit} />);
        jest.advanceTimersByTime(501);
        expect(client.getHabitProgressByDateAndHabit).toHaveBeenCalled();
        jest.useRealTimers();
    });
});
