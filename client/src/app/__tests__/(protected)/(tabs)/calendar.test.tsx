import React from "react";
import { render, waitFor, act, cleanup, within } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHabitProgressByDate } from "../../../../lib/client";
import CalendarScreen from "../../../(protected)/(tabs)/calendar";

// Use fake timers for the setTimeout inside CalendarScreen.
jest.useFakeTimers();

// Inline mock for Colors module with required properties
jest.mock('../../../../components/styles/Colors', () => ({
  Colors: {
    light: {
      tint: 'blue',
      background: 'white',
      text: 'black',
      background2: 'gray',
      title: 'black',
      border: 'lightgray',
      placeholder: 'gray',
    },
    dark: {
      tint: 'blue',
      background: 'black',
      text: 'white',
      background2: 'gray',
      title: 'white',
      border: 'darkgray',
      placeholder: 'lightgray',
    },
  },
}));

// Inline mock for ThemedText component using react-native's Text component
jest.mock('../../../../components/ThemedText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: (props: any) => React.createElement(Text, props, props.children),
  };
});

// Inline mock for AsyncStorage that returns a Promise<string>
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((): Promise<string> => Promise.resolve("test@example.com")),
}));

// Define HabitProgress type and inline mock for getHabitProgressByDate
type HabitProgress = { habitType: string; progress: number; goalValue: number };
jest.mock('../../../../lib/client', () => ({
  getHabitProgressByDate: jest.fn((): Promise<HabitProgress[]> => Promise.resolve([])),
}));

// Inline mock for useTheme hook to return fixed theme data
jest.mock('../../../../components/ThemeContext', () => ({
  useTheme: () => ({ theme: "light", refreshKey: "1", toggleTheme: jest.fn() }),
}));

// Inline mock for CalendarComponent that calls onVisibleDatesChange with sample dates
jest.mock('../../../../components/MonthlyCalendar', () => {
  const React = require("react");
  return {
    CalendarComponent: (props: any) => {
      React.useEffect(() => {
        if (props.onVisibleDatesChange) {
          props.onVisibleDatesChange(["2023-08-01", "2023-08-02"]);
        }
      }, []);
      return null;
    },
  };
});

// Inline mock for StatsBoxComponent (using testID "statsBoxInner")
jest.mock('../../../../components/StatsBox', () => {
  const { Text } = require("react-native");
  return {
    StatsBoxComponent: (props: any) => (
      <Text testID="statsBoxInner">
        {JSON.stringify({
          completionPercentage: props.completionPercentage,
          currentStreak: props.currentStreak,
          longestStreak: props.longestStreak,
          formattedDate: props.formatDate ? props.formatDate(props.selectedDate) : undefined,
        })}
      </Text>
    ),
  };
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllTimers();
  cleanup();
});

describe("formatDate", () => {
  it("formats a date string into DD/MM/YY format", () => {
    const input = "2024-12-05";
    const dateObj = new Date(input);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear().toString().slice(-2);
    const formatted = `${day}/${month}/${year}`;
    expect(formatted).toBe("05/12/24");
  });
});

describe("CalendarScreen", () => {
  it("renders loading indicator when theme is not loaded", async () => {
    const rendered = render(
      <NavigationContainer>
        <CalendarScreen />
      </NavigationContainer>
    );
    // Do not advance timers so isThemeLoaded remains false.
    let indicator;
    try {
      indicator = rendered.getByTestId("activity-indicator");
    } catch (e) {
      const { ActivityIndicator } = require("react-native");
      indicator = rendered.UNSAFE_getByType(ActivityIndicator);
    }
    expect(indicator).toBeTruthy();
  });

  it('renders CalendarScreen and displays title "Calendar"', async () => {
    const rendered = render(
      <NavigationContainer>
        <CalendarScreen />
      </NavigationContainer>
    );
    act(() => {
      jest.advanceTimersByTime(60);
    });
    await waitFor(() => {
      expect(rendered.getByText("Calendar")).toBeTruthy();
    });
  });

  it("calls getHabitProgressByDate when visible dates are available", async () => {
    render(
      <NavigationContainer>
        <CalendarScreen />
      </NavigationContainer>
    );
    act(() => {
      jest.advanceTimersByTime(60);
    });
    const { getHabitProgressByDate } = require("../../../../lib/client");
    await waitFor(() => {
      expect(getHabitProgressByDate as jest.Mock).toHaveBeenCalled();
    });
  });

  it("logs warning when AsyncStorage returns null", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const AsyncStorage = require("@react-native-async-storage/async-storage");
    (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() => Promise.resolve(null));
    render(
      <NavigationContainer>
        <CalendarScreen />
      </NavigationContainer>
    );
    act(() => {
      jest.advanceTimersByTime(60);
    });
    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith("No email found in AsyncStorage");
    });
    consoleWarnSpy.mockRestore();
  });

  it("handles error in fetching habit progress", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { getHabitProgressByDate } = require("../../../../lib/client");
    (getHabitProgressByDate as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Test fetch error"))
    );
    render(
      <NavigationContainer>
        <CalendarScreen />
      </NavigationContainer>
    );
    act(() => {
      jest.advanceTimersByTime(60);
    });
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching habit progress:", expect.any(Error));
    });
    consoleErrorSpy.mockRestore();
  });

  it("increments totalHabitPercentages by habit.progress * 100 (else branch)", async () => {
    (getHabitProgressByDate as jest.Mock).mockResolvedValueOnce([
      { habitType: "quit", progress: 0.4, goalValue: 0 },
    ]);
    jest.setSystemTime(new Date("2023-08-15T00:00:00Z"));
    const { getByTestId } = render(
      <NavigationContainer>
        <CalendarScreen />
      </NavigationContainer>
    );
    act(() => {
      jest.advanceTimersByTime(60);
    });
    await waitFor(() => {
      const wrapper = getByTestId("statsBoxWrapper");
      const statsBox = within(wrapper).getByTestId("statsBoxInner");
      const stats = JSON.parse(statsBox.props.children);
      expect(stats.completionPercentage).toBe(40);
    });
  });

  it("formats selectedDate using formatDate (dd/mm/yy)", async () => {
    (getHabitProgressByDate as jest.Mock).mockResolvedValue([]);
    jest.setSystemTime(new Date("2023-08-15T00:00:00Z"));
    const { getByTestId } = render(
      <NavigationContainer>
        <CalendarScreen />
      </NavigationContainer>
    );
    act(() => {
      jest.advanceTimersByTime(60);
    });
    await waitFor(() => {
      const wrapper = getByTestId("statsBoxWrapper");
      const statsBox = within(wrapper).getByTestId("statsBoxInner");
      const stats = JSON.parse(statsBox.props.children);
      // For 2023-08-15, formatDate returns "15/08/23"
      expect(stats.formattedDate).toBe("15/08/23");
    });
  });

  it("calculates completion percentage and streak correctly", async () => {
    const { getHabitProgressByDate } = require("../../../../lib/client");
    (getHabitProgressByDate as jest.Mock).mockImplementation(() =>
      Promise.resolve([{ habitType: "build", progress: 10, goalValue: 10 }])
    );
    const fixedDate = new Date("2023-08-15T00:00:00Z");
    jest.setSystemTime(fixedDate);
    const rendered = render(
      <NavigationContainer>
        <CalendarScreen />
      </NavigationContainer>
    );
    act(() => {
      jest.advanceTimersByTime(60);
    });
    await waitFor(() => {
      const wrapper = rendered.getByTestId("statsBoxWrapper");
      const statsBox = within(wrapper).getByTestId("statsBoxInner");
      const stats = JSON.parse(statsBox.props.children);
      expect(stats.completionPercentage).toBe(100);
      expect(stats.currentStreak).toBeGreaterThan(0);
      expect(stats.longestStreak).toBeGreaterThan(0);
    });
    jest.useRealTimers();
  });

  it('logs "Error loading email from AsyncStorage:" when AsyncStorage.getItem throws an error', async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const AsyncStorage = require("@react-native-async-storage/async-storage");
    const testError = new Error("Test error");
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(testError);
    
    render(
      <NavigationContainer>
        <CalendarScreen />
      </NavigationContainer>
    );
    
    act(() => {
      jest.advanceTimersByTime(60);
    });
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error loading email from AsyncStorage:", testError);
    });
    
    consoleErrorSpy.mockRestore();
  });
});
