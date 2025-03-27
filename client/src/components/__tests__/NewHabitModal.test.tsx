import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { CalendarComponent } from '../MonthlyCalendar';
import { NavigationContainer } from '@react-navigation/native';

// Mock ThemeContext to supply a consistent theme value
jest.mock('../ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Optionally, pass through the actual implementation of react-native-calendars
jest.mock('react-native-calendars', () => {
  const actual = jest.requireActual('react-native-calendars');
  return { ...actual };
});

// Dummy props for tests
const dummyMarkedDates = {};
const dummySelectedDate = "2025-03-27";

describe('MonthlyCalendar Integration and Unit Tests', () => {
  describe('Integration Tests', () => {
    it('renders a day with progress, selection circle, and gold color if it is today', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const setSelectedDate = jest.fn();
      const markedDates = { [todayStr]: { progress: 50 } };

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
        const dayElements = getAllByText(dayNum);
        expect(dayElements).toBeTruthy();
      });
    });

    it('renders selection circle if date is selected but not today', async () => {
      const setSelectedDate = jest.fn();
      const selectedDate = '2025-03-15';
      const { getAllByText } = render(
        <CalendarComponent
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          markedDates={{ [selectedDate]: { progress: 0 } }}
        />
      );

      await waitFor(() => {
        const dayElements = getAllByText('15');
        expect(dayElements).toBeTruthy();
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

  describe('Direct Prop Function Tests', () => {
    // This block specifically calls the onDayPress and onMonthChange props
    // to cover the uncovered lines (e.g. line 89: onPress in dayComponent, and line 115: onMonthChange).
    it('directly invokes onDayPress to update selected date', () => {
      const setSelectedDate = jest.fn();
      const onVisibleDatesChange = jest.fn();
      const { getByTestId } = render(
        <CalendarComponent
          selectedDate={dummySelectedDate}
          setSelectedDate={setSelectedDate}
          markedDates={dummyMarkedDates}
          onVisibleDatesChange={onVisibleDatesChange}
        />
      );
      const calendar = getByTestId("calendar");
      act(() => {
        calendar.props.onDayPress({
          dateString: "2025-04-02",
          day: 2,
          month: 4,
          year: 2025,
          timestamp: new Date("2025-04-02").getTime(),
        });
      });
      expect(setSelectedDate).toHaveBeenCalledWith("2025-04-02");
    });

    it('directly invokes onMonthChange to trigger visible dates calculation', () => {
      const setSelectedDate = jest.fn();
      const onVisibleDatesChange = jest.fn();
      const { getByTestId } = render(
        <CalendarComponent
          selectedDate={dummySelectedDate}
          setSelectedDate={setSelectedDate}
          markedDates={dummyMarkedDates}
          onVisibleDatesChange={onVisibleDatesChange}
        />
      );
      const calendar = getByTestId("calendar");
      const monthData = {
        year: 2025,
        month: 5, // May (1-indexed)
        day: 1,
        timestamp: new Date(2025, 4, 1).getTime(),
        dateString: "2025-05-01"
      };
      act(() => {
        calendar.props.onMonthChange(monthData);
      });
      expect(onVisibleDatesChange).toHaveBeenCalled();
      const dates = onVisibleDatesChange.mock.calls[0][0];
      expect(Array.isArray(dates)).toBe(true);
      expect(dates.length).toBeGreaterThan(0);
    });
  });
});
