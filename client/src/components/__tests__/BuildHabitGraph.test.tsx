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

// Mock victory-native components to avoid complex SVG rendering
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

// Mock StatsBoxes with in-scope imports to avoid the out-of-scope error.
jest.mock('../StatsBoxes', () => {
  const React = require('react');
  const RN = require('react-native');
  return (props: any) => (
    <RN.View testID="StatsBoxes">
      <RN.Text>currentStreak: {props.currentStreak}</RN.Text>
      <RN.Text>longestStreak: {props.longestStreak}</RN.Text>
      <RN.Text>completionRate: {props.completionRate}</RN.Text>
      <RN.Text>fourthStat: {props.fourthStat.value}</RN.Text>
    </RN.View>
  );
});

// Mock the client API functions
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

  it('renders weekly view by default and fetches weekly data correctly', async () => {
    // Setup weekly progress data (assume Monday gets a value)
    const weeklyData = [
      { progressDate: '2025-03-24T00:00:00Z', progress: 5 },
    ];
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce(weeklyData);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 3 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(7);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(80);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(4.2);

    const { getByText, getByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    // Verify default text for weekly view
    expect(getByText('Current Week')).toBeTruthy();

    // Check that fetchBuildHabitProgress was called with 'week'
    await waitFor(() => {
      expect(fetchBuildHabitProgress).toHaveBeenCalledWith(email, habitName, 'week');
    });

    // VictoryBar should render 7 data points with Monday set to 5
    const victoryBar = getByTestId('VictoryBar');
    await waitFor(() => {
      const data = victoryBar.props.data;
      expect(data).toHaveLength(7);
      const monday = data.find((d: any) => d.x === 'Mon');
      expect(monday.y).toBe(5);
    });

    // Verify that StatsBoxes receives the correct stats
    await waitFor(() => {
      expect(getByText('currentStreak: 3')).toBeTruthy();
      expect(getByText('longestStreak: 7')).toBeTruthy();
      expect(getByText('completionRate: 80')).toBeTruthy();
      expect(getByText('fourthStat: 4.2')).toBeTruthy();
    });
  });

  it('switches to monthly view and fetches monthly data correctly', async () => {
    // First fetch call for weekly data (empty)
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 2 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(5);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(60);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(3.5);

    // Second fetch call for monthly data returns a progress entry on the 15th
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-15T00:00:00Z', progress: 8 },
    ]);

    const { getByText, getByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      expect(fetchBuildHabitProgress).toHaveBeenCalledWith(email, habitName, 'week');
    });

    // Press the "M" button to switch to monthly view
    fireEvent.press(getByText('M'));

    await waitFor(() => {
      expect(fetchBuildHabitProgress).toHaveBeenCalledWith(email, habitName, 'month');
      expect(getByText('Current Month')).toBeTruthy();
    });

    // Check that VictoryBar now renders 31 data points with day "15" having progress 8
    const victoryBar = getByTestId('VictoryBar');
    await waitFor(() => {
      const data = victoryBar.props.data;
      expect(data).toHaveLength(31);
      const day15 = data.find((d: any) => d.x === '15');
      expect(day15.y).toBe(8);
    });
  });

  it('switches to yearly view and fetches yearly data correctly', async () => {
    // First fetch call for weekly data (empty)
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 4 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(10);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(90);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(6);

    // Second fetch call for yearly data returns two months with progress
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { month: 6, avgProgress: 10 },
      { month: 12, avgProgress: 15 },
    ]);

    const currentYear = new Date().getFullYear().toString();
    const { getByText, getByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      expect(fetchBuildHabitProgress).toHaveBeenCalledWith(email, habitName, 'week');
    });

    // Press the "Y" button to switch to yearly view
    fireEvent.press(getByText('Y'));

    await waitFor(() => {
      expect(fetchBuildHabitProgress).toHaveBeenCalledWith(email, habitName, 'year');
      expect(getByText(currentYear)).toBeTruthy();
    });

    const victoryBar = getByTestId('VictoryBar');
    await waitFor(() => {
      const data = victoryBar.props.data;
      expect(data).toHaveLength(12);
      const jun = data.find((d: any) => d.x === 'Jun');
      const dec = data.find((d: any) => d.x === 'Dec');
      expect(jun.y).toBe(10);
      expect(dec.y).toBe(15);
    });
  });

  it('allows switching back to weekly view from monthly', async () => {
    // First, return some weekly data
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-24T00:00:00Z', progress: 5 },
    ]);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 2 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(4);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(50);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(3);

    // Then, for monthly view
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-15T00:00:00Z', progress: 8 },
    ]);

    const { getByText, getByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      expect(fetchBuildHabitProgress).toHaveBeenCalledWith(email, habitName, 'week');
    });

    // Switch to monthly view
    fireEvent.press(getByText('M'));
    await waitFor(() => {
      expect(fetchBuildHabitProgress).toHaveBeenCalledWith(email, habitName, 'month');
      expect(getByText('Current Month')).toBeTruthy();
    });

    // Now, simulate a new weekly fetch when switching back to "W"
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce([
      { progressDate: '2025-03-25T00:00:00Z', progress: 7 },
    ]);
    fireEvent.press(getByText('W'));

    await waitFor(() => {
      expect(fetchBuildHabitProgress).toHaveBeenCalledWith(email, habitName, 'week');
      expect(getByText('Current Week')).toBeTruthy();
    });

    const victoryBar = getByTestId('VictoryBar');
    await waitFor(() => {
      const data = victoryBar.props.data;
      expect(data).toHaveLength(7);
      const found = data.find((d: any) => d.y === 7);
      expect(found).toBeDefined();
    });
  });

  it('handles error in fetchBuildHabitProgress gracefully', async () => {
    // Simulate an error thrown by fetchBuildHabitProgress
    (fetchBuildHabitProgress as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 0 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(0);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(0);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(0);

    const { getByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      expect(fetchBuildHabitProgress).toHaveBeenCalledWith(email, habitName, 'week');
    });

    // When an error occurs, the chartData remains empty so the labels mapping should yield 7 points with 0 values
    const victoryBar = getByTestId('VictoryBar');
    await waitFor(() => {
      const data = victoryBar.props.data;
      expect(data).toHaveLength(7);
      data.forEach((point: any) => {
        expect(point.y).toBe(0);
      });
    });
  });

  it('formats tick labels with decimals when necessary', async () => {
    // Use weekly data with a decimal progress value to trigger hasDecimals = true
    const weeklyData = [
      { progressDate: '2025-03-24T00:00:00Z', progress: 3.5 },
    ];
    (fetchBuildHabitProgress as jest.Mock).mockResolvedValueOnce(weeklyData);
    (fetchStreak as jest.Mock).mockResolvedValueOnce([{ streak: 1 }]);
    (fetchLongestStreak as jest.Mock).mockResolvedValueOnce(2);
    (fetchCompletionRate as jest.Mock).mockResolvedValueOnce(50);
    (fetchAverageProgress as jest.Mock).mockResolvedValueOnce(3.5);

    const { getAllByTestId } = render(
      <BuildHabitGraph email={email} habitName={habitName} />
    );

    await waitFor(() => {
      expect(fetchBuildHabitProgress).toHaveBeenCalledWith(email, habitName, 'week');
    });

    // Get both VictoryAxis elements and find the one for the dependent axis
    const axes = getAllByTestId('VictoryAxis');
    const dependentAxis = axes.find((axis) => axis.props.dependentAxis);
    expect(dependentAxis).toBeDefined();

    // Verify that the tickFormat function formats a decimal value (e.g., 3.5) as a fixed decimal string
    const formattedTick = dependentAxis.props.tickFormat(3.5);
    expect(formattedTick).toBe('3.5');
  });
});
