import React from "react";
import { render, fireEvent } from "@testing-library/react-native"
import { WeeklyCalendar } from "@/client/src/app/(tabs)/habits";

describe("WeeklyCalendar", () => {
  test("loads without crashing", () => {
    const mockSetSelectedDate = jest.fn();
    const selectedDate = { date: 15, fullDate: new Date() };

    const { getAllByText } = render(
      <WeeklyCalendar selectedDate={selectedDate} setSelectedDate={mockSetSelectedDate} />
    );

    // Check that the days load correctly by finding a match
    expect(getAllByText("Su")[0]).toBeTruthy();
    expect(getAllByText("Mo")[0]).toBeTruthy();
    expect(getAllByText("Tu")[0]).toBeTruthy();
  });

  test("selecting a date", () => {
    const mockSetSelectedDate = jest.fn();
    const selectedDate = { date: 15, fullDate: new Date() };

    const { getAllByText } = render(
      <WeeklyCalendar selectedDate={selectedDate} setSelectedDate={mockSetSelectedDate} />
    );

    const targetDate = getAllByText("15")[0];
    fireEvent.press(targetDate);

    expect(mockSetSelectedDate).toHaveBeenCalledWith(expect.objectContaining({ date: 15 }));
  });

  test("swiping through weeks", () => {
    const mockSetSelectedDate = jest.fn();
    const selectedDate = { date: 15, fullDate: new Date() };

    const { getByTestId } = render(
      <WeeklyCalendar selectedDate={selectedDate} setSelectedDate={mockSetSelectedDate} />
    );

    const flatList = getByTestId("weekly-calendar-list");

    fireEvent.scroll(flatList, {
      nativeEvent: {
        contentOffset: { x: 400, y: 0 },
        layoutMeasurement: { width: 400, height: 200 },
        contentSize: { width: 1000, height: 200 },
      },
    });

    expect(mockSetSelectedDate).toHaveBeenCalled();
  });
});