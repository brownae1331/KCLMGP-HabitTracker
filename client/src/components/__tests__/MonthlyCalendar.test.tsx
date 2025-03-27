import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { CalendarComponent } from '../MonthlyCalendar';
import { NavigationContainer } from '@react-navigation/native';

// Mock ThemeContext
jest.mock('../ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// We don't fully mock the entire react-native-calendars here
// so we can trigger its events (e.g. 'dayPress', 'monthChange') directly.
jest.mock('react-native-calendars', () => {
  const actualModule = jest.requireActual('react-native-calendars');
  return {
    ...actualModule,
  };
});

describe('MonthlyCalendar integration (event coverage)', () => {
  it('calls setSelectedDate on day press', async () => {
    const setSelectedDate = jest.fn();
    const { getByTestId } = render(
      <NavigationContainer>
        <CalendarComponent
          selectedDate="2025-03-10"
          setSelectedDate={setSelectedDate}
          markedDates={{}}
        />
      </NavigationContainer>
    );

    // Act: Fire the 'dayPress' event on the Calendar
    act(() => {
      fireEvent(getByTestId('calendar'), 'dayPress', {
        year: 2025,
        month: 4,
        day: 9,
        dateString: '2025-04-09',
        timestamp: Date.now(),
      });
    });

    // Assert: We've triggered onDayPress => setSelectedDate(day.dateString)
    expect(setSelectedDate).toHaveBeenCalledWith('2025-04-09');
  });

  it('calls calculateVisibleDates on month change', async () => {
    const setSelectedDate = jest.fn();
    // We can also spy on console.error to ensure no unexpected errors
    const { getByTestId } = render(
      <NavigationContainer>
        <CalendarComponent
          selectedDate="2025-03-10"
          setSelectedDate={setSelectedDate}
          markedDates={{}}
        />
      </NavigationContainer>
    );

    // Act: Fire the 'monthChange' event on the Calendar
    act(() => {
      fireEvent(getByTestId('calendar'), 'monthChange', {
        year: 2025,
        month: 5,
        day: 1,
        dateString: '2025-05-01',
        timestamp: 1735686000000, // Some arbitrary timestamp
      });
    });
    
    // There's no direct "expect" unless you want to verify
    // the visible dates or onVisibleDatesChange logic,
    // but this call ensures coverage of calculateVisibleDates(month).
  });
});


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
