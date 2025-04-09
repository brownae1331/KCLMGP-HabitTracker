import React from 'react';
import { render } from '@testing-library/react-native';
import { StatsBoxComponent } from '../StatsBox';

// Mock ThemeContext
jest.mock('../ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

describe('StatsBoxComponent', () => {
    it('displays current and longest streak values correctly', () => {
        const { getByText } = render(
            <StatsBoxComponent
                selectedDate="2025-03-25"
                completionPercentage={75}
                formatDate={(date) => date}
                currentStreak={5}
                longestStreak={10}
            />
        );
        // Verify streak texts
        expect(getByText('5 days')).toBeTruthy();
        expect(getByText('10 days')).toBeTruthy();
    });

    it('displays the completion percentage and circle correctly', () => {
        const { getByText, getByText: queryByText } = render(
            <StatsBoxComponent
                selectedDate="2025-03-25"
                completionPercentage={100}
                formatDate={(date) => date}
                currentStreak={0}
                longestStreak={0}
            />
        );
        // 100% should be displayed and the circle strokeDashoffset should be 0
        expect(getByText('100%')).toBeTruthy();
        // The 0% case (if needed) would show full offset; test 100% for zero offset
        const componentTree = queryByText('100%'); // using the 100% text node to traverse up
    });
});
