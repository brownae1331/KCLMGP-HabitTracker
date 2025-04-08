import React from 'react';
import { Platform } from 'react-native';
import * as ReactNative from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TouchableOpacity, Image } from 'react-native';

jest.mock('../ThemeContext', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', toggleTheme: jest.fn(), refreshKey: 0 })),
}));

jest.mock('../../utils/dateUtils', () => {
  const weekMinus1 = [
    { day: 'Mon', date: 17, fullDate: new Date(2025, 2, 17) },
    { day: 'Tue', date: 18, fullDate: new Date(2025, 2, 18) },
    { day: 'Wed', date: 19, fullDate: new Date(2025, 2, 19) },
    { day: 'Thu', date: 20, fullDate: new Date(2025, 2, 20) },
    { day: 'Fri', date: 21, fullDate: new Date(2025, 2, 21) },
    { day: 'Sat', date: 22, fullDate: new Date(2025, 2, 22) },
    { day: 'Sun', date: 23, fullDate: new Date(2025, 2, 23) },
  ];

  const week0 = [
    { day: 'Mon', date: 24, fullDate: new Date(2025, 2, 24) },
    { day: 'Tue', date: 25, fullDate: new Date(2025, 2, 25) },
    { day: 'Wed', date: 26, fullDate: new Date(2025, 2, 26) },
    { day: 'Thu', date: 27, fullDate: new Date(2025, 2, 27) },
    { day: 'Fri', date: 28, fullDate: new Date(2025, 2, 28) },
    { day: 'Sat', date: 29, fullDate: new Date(2025, 2, 29) },
    { day: 'Sun', date: 30, fullDate: new Date(2025, 2, 30) },
  ];

  const week1 = [
    { day: 'Mon', date: 31, fullDate: new Date(2025, 2, 31) },
    { day: 'Tue', date: 1, fullDate: new Date(2025, 3, 1) },
    { day: 'Wed', date: 2, fullDate: new Date(2025, 3, 2) },
    { day: 'Thu', date: 3, fullDate: new Date(2025, 3, 3) },
    { day: 'Fri', date: 4, fullDate: new Date(2025, 3, 4) },
    { day: 'Sat', date: 5, fullDate: new Date(2025, 3, 5) },
    { day: 'Sun', date: 6, fullDate: new Date(2025, 3, 6) },
  ];

  return {
    getWeekDates: jest.fn((weekOffset: number) => {
      if (weekOffset === -1) return weekMinus1;
      if (weekOffset === 0) return week0;
      if (weekOffset === 1) return week1;
      return week0;
    }),
  };
});

import { getWeekDates } from '../../utils/dateUtils';
import { WeeklyCalendar } from '../WeeklyCalendar';

describe('WeeklyCalendar component', () => {
  const initialSelectedDate = { date: 0, fullDate: new Date(0) };
  let setSelectedDateMock: jest.Mock;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 2, 25));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    setSelectedDateMock = jest.fn();
    jest.clearAllMocks();
  });

  it('should call setSelectedDate with the correct day when a date is tapped (web)', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    const { getByText } = render(
      <WeeklyCalendar selectedDate={initialSelectedDate} setSelectedDate={setSelectedDateMock} />
    );

    await waitFor(() => expect(setSelectedDateMock).toHaveBeenCalledWith(
      expect.objectContaining({ date: new Date().getDate() })
    ));
    expect(setSelectedDateMock).toHaveBeenCalledTimes(1);
    setSelectedDateMock.mockClear();

    const dayButton = getByText('26');
    fireEvent.press(dayButton);

    expect(setSelectedDateMock).toHaveBeenCalledTimes(1);
    expect(setSelectedDateMock).toHaveBeenCalledWith(
      expect.objectContaining({ date: 26 })
    );
  });

  it('should switch to the next week and update selectedDate when right arrow is pressed (web)', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    const { UNSAFE_getAllByType, getByText, queryByText } = render(
      <WeeklyCalendar selectedDate={initialSelectedDate} setSelectedDate={setSelectedDateMock} />
    );

    await waitFor(() => expect(setSelectedDateMock).toHaveBeenCalled());
    setSelectedDateMock.mockClear();

    const allTouchables = UNSAFE_getAllByType(TouchableOpacity);
    const arrowButtons = allTouchables.filter(btn => {
      const children = btn.props.children;
      if (Array.isArray(children)) {
        return children.some(child => child && child.type === Image);
      }
      return children && children.type === Image;
    });
    expect(arrowButtons.length).toBeGreaterThanOrEqual(2);
    const rightArrow = arrowButtons[1];
    fireEvent.press(rightArrow);

    await waitFor(() => expect(getByText('31')).toBeTruthy());
    expect(queryByText('24')).toBeNull();

    expect(getWeekDates).toHaveBeenCalledWith(1);
    expect(setSelectedDateMock).toHaveBeenCalledWith(
      expect.objectContaining({ date: 31 })
    );
  });

  it('should switch to the previous week and update selectedDate when left arrow is pressed (web)', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    const { UNSAFE_getAllByType, getByText, queryByText } = render(
      <WeeklyCalendar selectedDate={initialSelectedDate} setSelectedDate={setSelectedDateMock} />
    );

    await waitFor(() => expect(setSelectedDateMock).toHaveBeenCalled());
    setSelectedDateMock.mockClear();

    const allTouchables = UNSAFE_getAllByType(TouchableOpacity);
    const arrowButtons = allTouchables.filter(btn => {
      const children = btn.props.children;
      if (Array.isArray(children)) {
        return children.some(child => child && child.type === Image);
      }
      return children && children.type === Image;
    });
    expect(arrowButtons.length).toBeGreaterThanOrEqual(2);
    const leftArrow = arrowButtons[0];
    fireEvent.press(leftArrow);

    await waitFor(() => expect(getByText('17')).toBeTruthy());
    expect(queryByText('24')).toBeNull();

    expect(getWeekDates).toHaveBeenCalledWith(-1);
    expect(setSelectedDateMock).toHaveBeenCalledWith(
      expect.objectContaining({ date: 17 })
    );
  });
  
  it('should not update selectedDate when swiping between weeks (mobile), but update when a date is tapped', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });

    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
      width: 300, height: 600,
      scale: 0,
      fontScale: 0
    });

    const { getByTestId, getByText } = render(
      <WeeklyCalendar selectedDate={initialSelectedDate} setSelectedDate={setSelectedDateMock} />
    );

    await waitFor(() => expect(setSelectedDateMock).toHaveBeenCalled());
    expect(setSelectedDateMock).toHaveBeenCalledTimes(1);

    setSelectedDateMock.mockClear();

    const flatList = getByTestId('weekly-calendar-list');

    fireEvent(flatList, 'onTouchStart', { nativeEvent: {} });
    fireEvent(flatList, 'onMomentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 300 * 501 } },
    });

    expect(setSelectedDateMock).toHaveBeenCalledWith(
      expect.objectContaining({ date: 24 }) // week0[0] is 24 due to getWeekDates mock
    );
    setSelectedDateMock.mockClear();

    const dayButton = await waitFor(() => getByText('1'));
    fireEvent.press(dayButton);

    expect(setSelectedDateMock).toHaveBeenCalledWith(
      expect.objectContaining({ date: 1 })
    );
  });
});