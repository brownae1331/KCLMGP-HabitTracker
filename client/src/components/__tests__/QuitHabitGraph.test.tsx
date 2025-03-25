import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QuitHabitGraph from '../QuitHabitGraph';

// Mock Victory components similar to BuildHabitGraph test
jest.mock('victory-native', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        VictoryLine: ({ data, ...props }: any) => <View testID="VictoryLine" {...props} data={data} />,
        VictoryChart: ({ children, ...props }: any) => <View testID="VictoryChart" {...props}>{children}</View>,
        VictoryAxis: (props: any) => <View testID="VictoryAxis" {...props} />,
        VictoryScatter: ({ data, ...props }: any) => <View testID="VictoryScatter" {...props} data={data} />,
        VictoryTheme: { material: {} },
    };
});

describe('QuitHabitGraph', () => {
    const email = 'user@example.com';
    const habitName = 'Smoking';
    beforeEach(() => {
        global.fetch = jest.fn();
    });
    afterEach(() => {
        (global.fetch as jest.Mock).mockReset();
    });

    it('fetches weekly streak data on mount and displays "Current Week"', async () => {
        const fakeWeekData = [
            { progressDate: '2025-04-01T00:00:00Z', streak: 2 }, // assume Tuesday
        ];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue(fakeWeekData),
        });
        const { getByText, getByTestId } = render(<QuitHabitGraph email={email} habitName={habitName} />);
        expect(getByText('Current Week')).toBeTruthy();
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/streak?range=week'));
        });
        // Verify chart data (VictoryLine) reflects fetched data
        const line = getByTestId('VictoryLine');
        const scatter = getByTestId('VictoryScatter');
        await waitFor(() => {
            const data = line.props.data;
            expect(data.length).toBe(7);
            const tueData = data.find((d: any) => d.x === 'Tue');
            expect(tueData?.y).toBe(2);
            // VictoryScatter data should match VictoryLine data
            expect(scatter.props.data).toEqual(data);
        });
    });

    it('switches to monthly view and back to weekly view with correct fetch calls', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue([]) }) // initial week
            .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue([{ progressDate: '2025-04-10T00:00:00Z', streak: 5 }]) }) // month
            .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue([]) }); // back to week

        const { getByText, getByTestId } = render(<QuitHabitGraph email={email} habitName={habitName} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

        // Switch to monthly
        fireEvent.press(getByText('M'));
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/streak?range=month'));
            expect(getByText('Current Month')).toBeTruthy();
        });
        const line = getByTestId('VictoryLine');
        await waitFor(() => {
            const data = line.props.data;
            // Should have up to 31 data points, check one from fake data (10th of month)
            expect(data.some((d: any) => d.x === '10' && d.y === 5)).toBe(true);
        });

        // Switch back to weekly
        fireEvent.press(getByText('W'));
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/streak?range=week'));
            expect(getByText('Current Week')).toBeTruthy();
        });
    });
});
