import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BuildHabitGraph from '../BuildHabitGraph';
import {
  fetchBuildHabitProgress,
  fetchStreak,
  fetchLongestStreak,
  fetchCompletionRate,
  fetchAverageProgress,
} from '../../lib/client';

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (cb: any) => {
      React.useEffect(() => {
        cb();
      }, [cb]);
    },
  };
});

jest.mock('victory-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    VictoryBar: (props: any) => <View testID="VictoryBar" {...props} />,
    VictoryChart: ({ children, ...props }: any) => (
      <View testID="VictoryChart" {...props}>
        {children}
      </View>
    ),
    VictoryAxis: (props: any) => <View testID="VictoryAxis" {...props} />,
    VictoryTheme: { material: {} },
  };
});

// Mock StatsBoxes with in‑scope React Native components.
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

// Mock API client functions with the updated path.
jest.mock('../../lib/client', () => ({
  fetchBuildHabitProgress: jest.fn(),
  fetchStreak: jest.fn(),
  fetchLongestStreak: jest.fn(),
  fetchCompletionRate: jest.fn(),
  fetchAverageProgress: jest.fn(),
}));

describe('BuildHabitGraph', () => {
  const email = 'user@example.com';
  const habitName = 'testHabit';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('renders weekly view by default and fetches weekly data correctly', async () => {
    // For weekly view, simulate a progress entry for Monday.
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-24T00:00:00', progress: 5 },
    ]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 3 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(7);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(80);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(4.2);

    const { getByText, getByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      expect(getByText('Current Week')).toBeTruthy();
      expect(getByText(/currentStreak:/)).toBeTruthy();
    });

    const bar = getByTestId('VictoryBar');
    await waitFor(() => {
      const data = bar.props.data;
      expect(data).toHaveLength(7);
      const monday = data.find((d: any) => d.x === 'Mon');
      expect(monday.y).toBe(5);
    });
  });

  test('switches to monthly view and fetches monthly data correctly', async () => {
    // First call (weekly) returns empty.
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 2 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(5);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(60);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(3.5);
    // Second call (monthly) returns a record for day "15" with progress 8.
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-15', progress: 8 },
    ]);

    const { getByText, getByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => expect(getByText('Current Week')).toBeTruthy());
    fireEvent.press(getByText('M'));
    await waitFor(() => expect(getByText('Current Month')).toBeTruthy());

    const bar = getByTestId('VictoryBar');
    await waitFor(() => {
      const data = bar.props.data;
      expect(data).toHaveLength(31);
      const day15 = data.find((d: any) => d.x === '15');
      expect(day15.y).toBe(8);
    });
  });

  test('switches to yearly view and fetches yearly data correctly', async () => {
    // First call (weekly) returns empty.
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 4 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(10);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(90);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(6);
    // Second call (yearly) returns data for June and December.
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { month: 6, avgProgress: 10 },
      { month: 12, avgProgress: 15 },
    ]);
    const currentYear = new Date().getFullYear().toString();

    const { getByText, getByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    fireEvent.press(getByText('Y'));
    await waitFor(() => expect(getByText(currentYear)).toBeTruthy());

    const bar = getByTestId('VictoryBar');
    await waitFor(() => {
      const data = bar.props.data;
      expect(data).toHaveLength(12);
      const jun = data.find((d: any) => d.x === 'Jun');
      expect(jun.y).toBe(10);
      const dec = data.find((d: any) => d.x === 'Dec');
      expect(dec.y).toBe(15);
    });
  });

  test('handles error in fetchBuildHabitProgress gracefully', async () => {
    (fetchBuildHabitProgress as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 0 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(0);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(0);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(0);

    const { getByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    const bar = getByTestId('VictoryBar');
    await waitFor(() => {
      const data = bar.props.data;
      expect(data).toHaveLength(7);
      data.forEach((point: any) => {
        expect(point.y).toBe(0);
      });
    });
  });

  test('formats tick labels with decimals when necessary', async () => {
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-24T00:00:00', progress: 3.5 },
    ]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 1 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(2);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(50);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(3.5);

    const { getAllByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      const axes = getAllByTestId('VictoryAxis');
      expect(axes.length).toBeGreaterThan(0);
    });
    const axes = getAllByTestId('VictoryAxis');
    const depAxis = axes.find(a => a.props.dependentAxis);
    expect(depAxis).toBeDefined();
    if (!depAxis) {
      throw new Error('Dependent axis not found');
    }
    const formatted = depAxis.props.tickFormat(3.5);
    expect(formatted).toBe('3.5');
  });

  test('formats monthly tick labels correctly', async () => {
    // For monthly view, tickFormat should return '' for tick values not in [1,8,15,22,29].
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 2 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(5);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(60);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(3.5);
    // Second call (monthly) even if chart data is empty.
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([]);

    const { getByText, getAllByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );
    fireEvent.press(getByText('M'));
    await waitFor(() => {
      const axes = getAllByTestId('VictoryAxis');
      expect(axes.length).toBeGreaterThan(0);
      const tickFormat = axes[0].props.tickFormat;
      expect(tickFormat("2")).toBe('');
      expect(tickFormat("15")).toBe("15");
    });
  });

  test('handles error in fetchStreakData gracefully', async () => {
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-24T00:00:00', progress: 5 },
    ]);
    (fetchStreak as jest.Mock).mockRejectedValueOnce(new Error('Streak error'));
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(7);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(80);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(4.2);

    const { getByText } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );
    await waitFor(() => {
      expect(getByText('currentStreak: 0')).toBeTruthy();
    });
  });

  test('handles error in fetchStats gracefully', async () => {
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-24T00:00:00', progress: 5 },
    ]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 3 }]);
    (fetchLongestStreak as jest.Mock).mockRejectedValueOnce(new Error('Longest streak error'));
    (fetchCompletionRate as jest.Mock).mockRejectedValueOnce(new Error('Completion error'));
    (fetchAverageProgress as jest.Mock).mockRejectedValueOnce(new Error('Average progress error'));

    const { getByText } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );
    await waitFor(() => {
      expect(getByText('longestStreak: 0')).toBeTruthy();
      expect(getByText('completionRate: 0')).toBeTruthy();
      expect(getByText('fourthStat: 0')).toBeTruthy();
    });
  });

  test('renders yearly view with empty data correctly', async () => {
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-24T00:00:00', progress: 5 },
    ]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 2 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(5);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(60);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(3.5);
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([]);
    const { getByText, getByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );
    fireEvent.press(getByText('Y'));
    await waitFor(() => {
      const bar = getByTestId('VictoryBar');
      const data = bar.props.data;
      expect(data).toHaveLength(12);
      data.forEach((month: any) => {
        expect(month.y).toBe(0);
      });
    });
  });
});
