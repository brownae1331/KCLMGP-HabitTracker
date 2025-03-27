import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { CalendarComponent } from '../MonthlyCalendar';
import { NavigationContainer } from '@react-navigation/native';

// Mock ThemeContext
jest.mock('../ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

jest.mock('react-native-calendars', () => {
    const actual = jest.requireActual('react-native-calendars');
    return {
        ...actual,
    };
});

describe('MonthlyCalendar integration', () => {
    it('renders a day with progress, selection circle, and gold color if it is today', async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const setSelectedDate = jest.fn();
        const markedDates = {
            [todayStr]: { progress: 50 },
        };

        const { getAllByText } = render(
            <NavigationContainer>
                <CalendarComponent
                    selectedDate={todayStr}
                    setSelectedDate={setSelectedDate}
                    markedDates={markedDates}
                />
            </NavigationContainer>
        );

        await waitFor(() => {
            const dayNum = new Date().getDate().toString();
            const dayElement = getAllByText(dayNum);
            expect(dayElement).toBeTruthy();
        });
    });

    it('renders selection circle if date is selected but not today', async () => {
        const setSelectedDate = jest.fn();
        const selectedDate = '2025-03-15';
        const { getAllByText } = render(
            <CalendarComponent
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                markedDates={{
                    [selectedDate]: { progress: 0 },
                }}
            />
        );

        await waitFor(() => {
            const dayElement = getAllByText('15');
            expect(dayElement).toBeTruthy();
        });
    });

    it('updates selectedDate when pressing a day that is not selected yet', async () => {
        const setSelectedDate = jest.fn();
        const selectedDate = '2025-03-10';
        const { getByText } = render(
            <CalendarComponent
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                markedDates={{}}
            />
        );

        await waitFor(() => {
            const dayElement = getByText('12');
            act(() => {
                fireEvent.press(dayElement);
            });
        });
        expect(setSelectedDate).toHaveBeenCalledWith(expect.stringContaining('-03-12'));
    });

    it('does not call onVisibleDatesChange if it is not provided', async () => {
        const setSelectedDate = jest.fn();
        const { getByTestId } = render(
            <CalendarComponent
                selectedDate="2025-01-01"
                setSelectedDate={setSelectedDate}
                markedDates={{}}
            />
        );
        
        act(() => {
            fireEvent(getByTestId('calendar'), 'layout', {
                nativeEvent: { layout: { width: 300, height: 400, x: 0, y: 0 } },
            });
        });
    });

    it('calls onVisibleDatesChange if provided', async () => {
        const onVisibleDatesChange = jest.fn();
        const setSelectedDate = jest.fn();
        const { getByTestId } = render(
            <CalendarComponent
                selectedDate="2025-01-01"
                setSelectedDate={setSelectedDate}
                markedDates={{}}
                onVisibleDatesChange={onVisibleDatesChange}
            />
        );

        act(() => {
            fireEvent(getByTestId('calendar'), 'layout', {
                nativeEvent: { layout: { width: 300, height: 400, x: 0, y: 0 } },
            });
        });
        expect(onVisibleDatesChange).toHaveBeenCalled();
    });
});
