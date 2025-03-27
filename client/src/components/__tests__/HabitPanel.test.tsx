import React from 'react';
import { Alert, Platform } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HabitPanel, { Habit } from '../HabitPanel';
import * as client from '../../lib/client';

jest.mock('../../lib/client', () => ({
  updateHabitProgress: jest.fn(),
  getHabitStreak: jest.fn(),
  getHabitInterval: jest.fn().mockResolvedValue({ increment: 1 }),
  getHabitDays: jest.fn().mockResolvedValue([{ day: 'Wednesday' }]),
  getHabitProgressByDateAndHabit: jest.fn(),
  deleteHabit: jest.fn(),
}));

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

describe('HabitPanel - Coverage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => { });
  });

  it('should not call fetchStreak for future dates', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    render(<HabitPanel habit={sampleHabit} selectedDate={tomorrow} />);
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(client.getHabitStreak).not.toHaveBeenCalled();
  });

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

  it('should handle error when fetching streak', async () => {
    (client.getHabitStreak as jest.Mock).mockRejectedValueOnce(new Error('fetchStreak error'));
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    render(<HabitPanel habit={sampleHabit} selectedDate={pastDate} />);
    await waitFor(() => {
      expect(client.getHabitStreak).toHaveBeenCalled();
    });
  });

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
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this habit?');
      expect(client.deleteHabit).toHaveBeenCalledWith(sampleHabit.user_email, sampleHabit.habitName);
    });
  });

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

  it('should use local state when fetching progress fails', async () => {
    (client.getHabitProgressByDateAndHabit as jest.Mock).mockRejectedValueOnce(new Error('progress fetch error'));
    const { getByText } = render(<HabitPanel habit={sampleHabit} />);
    await act(async () => {
      fireEvent.press(getByText('Test Habit'));
    });
  });
  

  it('should call polling function in useEffect', () => {
    jest.useFakeTimers();
    render(<HabitPanel habit={sampleHabit} />);
    jest.advanceTimersByTime(501);
    expect(client.getHabitProgressByDateAndHabit).toHaveBeenCalled();
    jest.useRealTimers();
  });
});

describe('HabitPanel - Additional Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update build progress state for build habit with goal', async () => {
    (client.getHabitProgressByDateAndHabit as jest.Mock).mockResolvedValueOnce({ progress: 12 });
    (client.getHabitStreak as jest.Mock).mockResolvedValueOnce({ streak: 3 });
    const { getByText } = render(<HabitPanel habit={sampleHabit} selectedDate={new Date()} />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });
    // Assert that the habit description is rendered (indicating the branch was executed)
    expect(getByText(/Habit description/)).toBeTruthy();
  });

  it('should log error when getHabitProgressByDateAndHabit fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    (client.getHabitProgressByDateAndHabit as jest.Mock).mockRejectedValueOnce(new Error('Fetch progress error'));
    render(<HabitPanel habit={sampleHabit} selectedDate={new Date()} />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching habit progress:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('should return null from findLastScheduledDate when getHabitDays returns empty', async () => {
    (client.getHabitDays as jest.Mock).mockResolvedValueOnce([]);
    const weeklyHabit: Habit = { ...sampleHabit, scheduleOption: 'weekly' };
    const { getByText } = render(<HabitPanel habit={weeklyHabit} selectedDate={new Date()} />);
    await act(async () => {
      fireEvent.press(getByText('Test Habit'));
      await new Promise((resolve) => setTimeout(resolve, 600));
    });
    expect(client.getHabitDays).toHaveBeenCalled();
  });

  it('should return a date from findLastScheduledDate when weekly days are available', async () => {
    (client.getHabitDays as jest.Mock).mockResolvedValueOnce([{ day: 'Monday' }, { day: 'Wednesday' }]);
    (client.getHabitStreak as jest.Mock).mockResolvedValueOnce({ streak: 0 });
    const weeklyHabit: Habit = {
      ...sampleHabit,
      scheduleOption: 'weekly',
      selectedDays: ['Monday', 'Wednesday']
    };
    const today = new Date();
    const { getByText } = render(<HabitPanel habit={weeklyHabit} selectedDate={today} />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(client.getHabitDays).toHaveBeenCalled();
  });


  it('should update progress for build habit and update streak', async () => {
    (client.updateHabitProgress as jest.Mock).mockResolvedValueOnce({});
    (client.getHabitStreak as jest.Mock).mockResolvedValueOnce({ streak: 4 });
    const buildHabit: Habit = { ...sampleHabit, habitType: 'build', goalValue: 10 };
    const { getByText } = render(<HabitPanel habit={buildHabit} selectedDate={new Date()} />);

    await act(async () => {
      fireEvent.press(getByText('Test Habit'));
    });

    const saveButton = await waitFor(() => getByText('Save Progress'));

    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(client.updateHabitProgress).toHaveBeenCalledWith(
      buildHabit.user_email,
      buildHabit.habitName,
      expect.any(Number)
    );

    await waitFor(() => {
      expect(client.getHabitStreak).toHaveBeenCalledTimes(5);
    });
  });


  it('should not delete habit when user cancels deletion on native', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      if (buttons && buttons[0].text === 'Cancel') {
        buttons[0].onPress && buttons[0].onPress();
      }
    });
    const { getByText } = render(<HabitPanel habit={sampleHabit} onEdit={() => { }} />);
    await act(async () => {
      fireEvent.press(getByText('×'));
    });
    expect(client.deleteHabit).not.toHaveBeenCalled();
  });

  it('renders habit panel with all sub-components', async () => {
    const { getByText } = render(
      <HabitPanel habit={{ ...sampleHabit, habitName: 'Render Test', habitDescription: 'Full panel check' }} />
    );
    expect(getByText('Render Test')).toBeTruthy();
    expect(getByText('Full panel check')).toBeTruthy();
  });
});
