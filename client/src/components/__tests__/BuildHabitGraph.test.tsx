import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BuildHabitGraph from '../BuildHabitGraph';

// Mock Victory components to avoid rendering complex SVG elements
jest.mock('victory-native', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        VictoryBar: ({ data, ...props }: any) => <View testID="VictoryBar" {...props} data={data} />,
        VictoryChart: ({ children, ...props }: any) => <View testID="VictoryChart" {...props}>{children}</View>,
        VictoryAxis: (props: any) => <View testID="VictoryAxis" {...props} />,
        VictoryTheme: { material: {} },
    };
});

describe('BuildHabitGraph', () => {
    const email = 'user';
    const habitName = 'testHabit';
    beforeEach(() => {
        // Mock fetch globally
        global.fetch = jest.fn();
    });
    afterEach(() => {
        (global.fetch as jest.Mock).mockReset();
    });

    it('fetches weekly data on mount and displays current week data', async () => {
        const fakeWeeklyData = [
            { progressDate: '2025-03-24T00:00:00Z', progress: 5 }, // Monday of that week
        ];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue(fakeWeeklyData),
        });
        const { getByText, getByTestId } = render(<BuildHabitGraph email={email} habitName={habitName} />);

        // Assert initial range and that fetch was called with week range
        expect(getByText('Current Week')).toBeTruthy();
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/progress?range=week')
            );
        });

        // After data is loaded, VictoryBar should have 7 data points (Mon-Sun) with Monday = 5
        const bar = getByTestId('VictoryBar');
        await waitFor(() => {
            const data = bar.props.data;
            expect(data).toHaveLength(7);
            const mondayData = data.find((d: any) => d.x === 'Mon');
            expect(mondayData?.y).toBe(5);
        });
    });

    it('switches to monthly view when "M" button is pressed and fetches monthly data', async () => {
        // Set up initial weekly fetch and then monthly fetch
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue([]) })  // initial week (can be empty)
            .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue([{ progressDate: '2025-03-15T00:00:00Z', progress: 8 }]) });  // month data

        const { getByText, getByTestId } = render(<BuildHabitGraph email={email} habitName={habitName} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1)); // initial fetch done

        // Act: press "M" to switch to monthly
        fireEvent.press(getByText('M'));

        // Assert: fetch called with range=month and UI updated
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/progress?range=month')
            );
            expect(getByText('Current Month')).toBeTruthy();
        });

        // After data load, VictoryBar data should have entries for all days of month (31 days in mapping)
        const bar = getByTestId('VictoryBar');
        await waitFor(() => {
            const data = bar.props.data;
            expect(data.length).toBeGreaterThan(0);
            // The specific date from fake data (15th) should be reflected
            const day15 = data.find((d: any) => d.x === '15');
            expect(day15?.y).toBe(8);
        });
    });

    it('switches to yearly view when "Y" button is pressed and fetches yearly data', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue([]) })   // initial week
            .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue([{ month: 6, avgProgress: 10 }]) }); // year data (June avgProgress 10)

        const { getByText, getByTestId } = render(<BuildHabitGraph email={email} habitName={habitName} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

        fireEvent.press(getByText('Y'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/progress?range=year')
            );
            const currentYear = new Date().getFullYear().toString();
            expect(getByText(currentYear)).toBeTruthy();
        });

        const bar = getByTestId('VictoryBar');
        await waitFor(() => {
            const data = bar.props.data;
            expect(data).toHaveLength(12);
            const june = data.find((d: any) => d.x === 'Jun');
            expect(june?.y).toBe(10);
        });
    });
});
