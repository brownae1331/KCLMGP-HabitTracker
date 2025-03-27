import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BuildHabitGraph from '../BuildHabitGraph';
import {
  fetchBuildHabitProgress,
  fetchStreak,
  fetchLongestStreak,
  fetchCompletionRate,
  fetchAverageProgress,
} from '../../lib/client'; // updated path

// Modified useFocusEffect mock: return a cleanup function to ensure the component stays mounted.
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: any) => cb(),
}));

// Mock victory-native components to simplify rendering.
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
      { progressDate: '2025-03-24T00:00:00Z', progress: 5 },
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
      expect(getByText('currentStreak: 3')).toBeTruthy();
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
      { progressDate: '2025-03-15T00:00:00Z', progress: 8 },
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

    await waitFor(() => expect(getByText(currentYear)).toBeTruthy());
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
      { progressDate: '2025-03-24T00:00:00Z', progress: 3.5 },
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
      { progressDate: '2025-03-24T00:00:00Z', progress: 5 },
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
      { progressDate: '2025-03-24T00:00:00Z', progress: 5 },
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

  test('correctly maps monthly progress using getDate and populates y from dataMap', async () => {
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-09T00:00:00Z', progress: 7 }, // Should map to x = '9'
    ]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 1 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(2);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(40);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(5);
  
    const { getByText, getByTestId } = render(
      <BuildHabitGraph email="x@test.com" habitName="habit" />
    );
  
    fireEvent.press(getByText('M')); // Switch to month view
  
    await waitFor(() => {
      const bar = getByTestId('VictoryBar');
      const data = bar.props.data;
      const day9 = data.find((d: any) => d.x === '9');
      expect(day9).toBeDefined();
      expect(day9.y).toBe(7); // Confirms dataMap.get('9') worked
    });
  });

  test('correctly maps yearly data and sets dataMap using avgProgress', async () => {
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { month: 4, avgProgress: 9.5 }, // April (index 3)
      { month: 11, avgProgress: 12.2 }, // November (index 10)
    ]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 0 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(3);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(55);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(8);
  
    const { getByText, getByTestId } = render(
      <BuildHabitGraph email="x@test.com" habitName="habit" />
    );
  
    fireEvent.press(getByText('Y')); // Switch to year view
  
    await waitFor(() => {
      const bar = getByTestId('VictoryBar');
      const data = bar.props.data;
  
      const april = data.find((d: any) => d.x === 'Apr');
      expect(april).toBeDefined();
      expect(april.y).toBe(9.5); // dataMap.get('Apr')
  
      const nov = data.find((d: any) => d.x === 'Nov');
      expect(nov).toBeDefined();
      expect(nov.y).toBe(12.2); // dataMap.get('Nov')
    });
  });  

  test('maps monthly data by using date.getDate().toString()', async () => {
    // Mock monthly data to hit the line where we convert the date to a string.
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-09T00:00:00Z', progress: 7 }, // 9th of March
    ]);
    // Provide mock data for streak & stats
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 1 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(5);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(60);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(4.5);
  
    const { getByText, getByTestId } = render(
      <BuildHabitGraph email="mytest@example.com" habitName="TestHabit" />
    );
  
    // Switch to monthly view
    fireEvent.press(getByText('M'));
  
    // Wait for data to render
    await waitFor(() => {
      // Grab the VictoryBar data
      const bar = getByTestId('VictoryBar');
      const data = bar.props.data;
  
      // The 9th should have 7 as its value
      const ninthDay = data.find((d: any) => d.x === '9');
      expect(ninthDay).toBeDefined();
      expect(ninthDay.y).toBe(7);
    });
  });

  test('maps yearly data using month-based entries and avgProgress', async () => {
    // Mock yearly data with month and avgProgress
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { month: 4, avgProgress: 8 }, // April (index 3)
      { month: 12, avgProgress: 15 }, // December (index 11)
    ]);
    // Provide mock data for streak & stats
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 2 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(6);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(80);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(7.5);
  
    const { getByText, getByTestId } = render(
      <BuildHabitGraph email="mytest@example.com" habitName="TestHabit" />
    );
  
    // Switch to yearly view
    fireEvent.press(getByText('Y'));
  
    // Wait for data to render
    await waitFor(() => {
      const bar = getByTestId('VictoryBar');
      const data = bar.props.data;
  
      // Check April
      const apr = data.find((d: any) => d.x === 'Apr');
      expect(apr).toBeDefined();
      expect(apr.y).toBe(8);
  
      // Check December
      const dec = data.find((d: any) => d.x === 'Dec');
      expect(dec).toBeDefined();
      expect(dec.y).toBe(15);
    });
  });

  test('renders yearly view with empty data correctly', async () => {
    // First call: weekly returns some data.
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-24T00:00:00Z', progress: 5 },
    ]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 2 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(5);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(60);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(3.5);
    // Second call: yearly returns empty.
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([]);
    const currentYear = new Date().getFullYear().toString();
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
