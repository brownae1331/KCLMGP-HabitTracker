import React from 'react';
import RootLayout from '../_layout';
import { render, waitFor } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// PARTIALLY MOCK expo-font
jest.mock('expo-font', () => ({
  useFonts: jest.fn(),
}));

// PARTIALLY MOCK expo-splash-screen so we keep real code coverage
jest.mock('expo-splash-screen', () => {
  const actual = jest.requireActual('expo-splash-screen');
  return {
    ...actual,
    // We overwrite just the methods so we can spy on them
    hideAsync: jest.fn(),
    preventAutoHideAsync: jest.fn(),
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  const Stack = (props: { children: any; }) => <>{props.children}</>;
  Stack.Screen = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  return { Stack };
});

describe('RootLayout Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when fonts are NOT loaded', () => {
    // Simulate fonts not loaded yet
    (useFonts as jest.Mock).mockReturnValue([false]);
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeNull();
  });

  it('calls SplashScreen.hideAsync when fonts are loaded', async () => {
    // Simulate fonts are loaded
    (useFonts as jest.Mock).mockReturnValue([true]);

    render(<RootLayout />);
    await waitFor(() => {
      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });
  });
});

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(),
  preventAutoHideAsync: jest.fn(),
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(),
}));

// Mock ThemeContext so that our component can render
jest.mock('../../components/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: 'light', refreshKey: '1' }),
}));

// Mock AuthContext
jest.mock('../../components/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when fonts are not loaded', () => {
    (useFonts as jest.Mock).mockReturnValue([false]);
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeNull();
  });

  it('calls SplashScreen.hideAsync when fonts are loaded', async () => {
    (useFonts as jest.Mock).mockReturnValue([true]);
    render(<RootLayout />);
    await waitFor(() => {
      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });
  });
});