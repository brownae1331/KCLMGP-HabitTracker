import React from "react";
import RootLayout from "../_layout";
import { render, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "../../components/ThemeContext";
import { AuthProvider } from "../../components/AuthContext";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

// Mock expo-font to prevent errors with useFonts
jest.mock("expo-font", () => ({
    useFonts: jest.fn(() => [true]),
}));

// Mock expo-splash-screen to prevent errors with SplashScreen
jest.mock("expo-splash-screen", () => ({
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
}));

jest.mock("../../components/ThemeContext", () => ({
    ThemeProvider: jest.fn(({ children }: { children: React.ReactNode }) => { children }),
    useTheme: jest.fn(() => ({ theme: "light", refreshKey: 'test-key' })),
}));

jest.mock("../../components/AuthContext", () => ({
    AuthProvider: jest.fn(({ children }: { children: React.ReactNode }) => { children }),
}));

jest.mock("expo-router", () => ({
    Stack: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@react-navigation/native", () => ({
    DarkTheme: { dark: true },
    DefaultTheme: { dark: false },
    NavigationThemeProvider: jest.fn(({ children }: { children: React.ReactNode }) => { children }),
}));

jest.mock("expo-status-bar", () => ({
    StatusBar: ({ style }: { style: string }) => <></>,
}));

describe("RootLayout Component", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders null when fonts are not loaded', () => {
        (useFonts as jest.Mock).mockReturnValue([false]);
        const { toJSON } = render(<RootLayout />);
        expect(toJSON()).toBeNull();
    });

    test('renders content when fonts are loaded and calls SplashScreen.hideAsync', async () => {
        (useFonts as jest.Mock).mockReturnValue([true]);
        render(<RootLayout />);
        await waitFor(() => {
            expect(SplashScreen.hideAsync).toHaveBeenCalled();
        });
    });
});