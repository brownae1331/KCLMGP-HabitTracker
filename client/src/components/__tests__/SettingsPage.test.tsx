import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SettingsScreen from "../../app/(protected)/(tabs)/settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve("test@example.com")),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock router
jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
  loadedNativeFonts: [],
}));


// Create a dummy response that satisfies the Response interface
const dummyResponse = {
  ok: true,
  status: 200,
  statusText: "OK",
  headers: { get: () => "application/json" },
  url: "",
  redirected: false,
  type: "default",
  clone: () => dummyResponse,
  body: null,
  bodyUsed: false,
  json: () => Promise.resolve({ data: "exported data" }),
  text: () => Promise.resolve(JSON.stringify({ data: "exported data" })),
} as unknown as Response;

// Mock global.fetch
global.fetch = jest.fn(() => Promise.resolve(dummyResponse));

describe("SettingsScreen", () => {
  test("renders without crashing", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("Settings")).toBeTruthy();
  });

  test("tapping Export Data triggers export", async () => {
    const { getByText } = render(<SettingsScreen />);
    const exportButton = getByText("Export My Data");
    fireEvent.press(exportButton);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  test("tapping Sign Out triggers sign out", async () => {
    const { getByText } = render(<SettingsScreen />);
    const signOutButton = getByText("Sign Out");
    fireEvent.press(signOutButton);
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/login");
    });
  });

  test("tapping Delete User triggers delete", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ ...dummyResponse })
    );
    const { getByText } = render(<SettingsScreen />);
    const deleteButton = getByText("Delete My Data/Account");
    fireEvent.press(deleteButton);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/export/")
      );
    });
  });
});
