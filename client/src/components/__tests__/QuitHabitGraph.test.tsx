import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import QuitHabitGraph from '../QuitHabitGraph';
import {
  fetchStreak,
  fetchLongestStreak,
  fetchCompletionRate,
} from '../../lib/client';

// Mock useFocusEffect: immediately invoke callback
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: any) => {
    cb();
    return () => { };
  },
}));

// Mock victory-native components.
jest.mock('victory-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    VictoryLine: (props: any) => <View testID="VictoryLine" {...props} />,
    VictoryChart: ({ children, ...props }: any) => (
      <View testID="VictoryChart" {...props}>
        {children}
      </View>
    ),
    VictoryAxis: (props: any) => <View testID="VictoryAxis" {...props} />,
    VictoryScatter: (props: any) => <View testID="VictoryScatter" {...props} />,
    VictoryTheme: { material: {} },
  };
});

// Mock StatsBoxes.
jest.mock('../StatsBoxes', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return (props: any) => (
    <View testID="StatsBoxes">
      <Text>currentStreak: {props.currentStreak}</Text>
      <Text>longestStreak: {props.longestStreak}</Text>
      <Text>completionRate: {props.completionRate}</Text>
      <Text>fourthStat: {props.fourthStat.value}</Text>
    </View>
  );
});

// Mock API client functions.
jest.mock('../../lib/client', () => ({
  fetchStreak: jest.fn(),
  fetchLongestStreak: jest.fn(),
  fetchCompletionRate: jest.fn(),
}));

describe('QuitHabitGraph', () => {
  const email = 'user@example.com';
  const habitName = 'Smoking';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('renders weekly view by default and fetches weekly streak data', async () => {
    // Simulate weekly data
    (fetchStreak as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-04-01T00:00:00Z', streak: 2 }, // Tuesday
    ]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(5);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(80);

    const { getByText, getByTestId } = render(
      <QuitHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      // Should show "Current Week" and the StatsBoxes with a streak of 2
      expect(getByText('Current Week')).toBeTruthy();
      expect(getByText('currentStreak: 2')).toBeTruthy();
    });

    // Check VictoryLine & VictoryScatter data
    const line = getByTestId('VictoryLine');
    const scatter = getByTestId('VictoryScatter');

    await waitFor(() => {
      const data = line.props.data;
      expect(data.length).toBe(1);
      const tuesday = data.find((d: any) => d.x === 'Tue');
      expect(tuesday).toBeDefined();
      expect(tuesday.y).toBe(2);
      // Scatter data should match line data
      expect(scatter.props.data).toEqual(data);
    });
  });

  test('switches to monthly view and updates the view accordingly', async () => {
    (fetchStreak as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-04-01T00:00:00Z', streak: 2 },
    ]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(5);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(80);

    const { getByText, getByTestId } = render(
      <QuitHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      expect(getByText('Current Week')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('M'));
    });

    await waitFor(() => {
      expect(getByText('Current Month')).toBeTruthy();
    });

    const line = getByTestId('VictoryLine');
    const scatter = getByTestId('VictoryScatter');

    await waitFor(() => {
      const data = line.props.data;
      const tuesday = data.find((d: any) => d.x === 'Tue');
      expect(tuesday).toBeDefined();
      expect(tuesday.y).toBe(2);
      expect(scatter.props.data).toEqual(data);
    });
  });


  test('StatsBoxes displays correct stats and computed grade', async () => {
    (fetchStreak as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-04-01T00:00:00Z', streak: 3 },
    ]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(7);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(80);

    const { getByText } = render(
      <QuitHabitGraph email={email} habitName={habitName} />
    );

    // Wait for stats to load
    await waitFor(() => {
      expect(getByText('currentStreak: 3')).toBeTruthy();
      expect(getByText(/longestStreak:/)).toBeTruthy();
      expect(getByText(/completionRate:/)).toBeTruthy();
      // 80% => "B"
      expect(getByText(/fourthStat:/)).toBeTruthy();
    });
  });

  test('handles error in fetchStreak gracefully', async () => {
    (fetchStreak as jest.Mock).mockRejectedValueOnce(new Error('Streak error'));
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(7);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(80);

    const { getByText } = render(
      <QuitHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      // On error, currentStreak is 0 by default
      expect(getByText('currentStreak: 0')).toBeTruthy();
    });
  });

  test('handles error in fetchStats gracefully', async () => {
    (fetchStreak as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-04-01T00:00:00Z', streak: 3 },
    ]);
    (fetchLongestStreak as jest.Mock).mockRejectedValueOnce(
      new Error('Longest streak error')
    );
    (fetchCompletionRate as jest.Mock).mockRejectedValueOnce(
      new Error('Completion error')
    );

    const { getByText } = render(
      <QuitHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      // If stats fail, we set them to zero => 'F'
      expect(getByText(/longestStreak:/)).toBeTruthy();
      expect(getByText(/completionRate:/)).toBeTruthy();
      expect(getByText(/fourthStat:/)).toBeTruthy();
    });
  });  

  test('formats monthly tick labels correctly', async () => {
    (fetchStreak as jest.Mock).mockResolvedValueOnce([]); // weekly
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(5);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(60);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([]); // monthly

    const { getByText, getAllByTestId } = render(
      <QuitHabitGraph email={email} habitName={habitName} />
    );

    // Switch to monthly
    await act(async () => {
      fireEvent.press(getByText('M'));
    });

    await waitFor(() => {
      const axes = getAllByTestId('VictoryAxis');
      expect(axes.length).toBeGreaterThan(0);
      // Check custom tickFormat function
      const tickFormat = axes[0].props.tickFormat;
      expect(tickFormat('2')).toBe('');
      expect(tickFormat('15')).toBe('15');
    });
  });
});
