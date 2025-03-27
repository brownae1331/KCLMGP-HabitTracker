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
  // import the *real* module so Jest can instrument it
  const actual = jest.requireActual('expo-splash-screen');
  return {
    ...actual,
    // We overwrite just the methods so we can spy on them
    hideAsync: jest.fn(),
    preventAutoHideAsync: jest.fn(),
  };
});

// You can mock other dependencies (like ThemeContext) similarly, but
// ensure you do a partial mock or at least let `_layout.tsx` actually run.

describe('RootLayout Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when fonts are NOT loaded', () => {
    // Simulate fonts not loaded yet
    (useFonts as jest.Mock).mockReturnValue([false]);
    const { toJSON } = render(<RootLayout />);
    // Because loaded = false, we expect it to return null
    expect(toJSON()).toBeNull();
  });

  it('calls SplashScreen.hideAsync when fonts are loaded', async () => {
    // Simulate fonts are loaded
    (useFonts as jest.Mock).mockReturnValue([true]);

    render(<RootLayout />);

    // The code in `_layout.tsx`:
    //   useEffect(() => { if (loaded) { SplashScreen.hideAsync(); } }, [loaded]);
    // We expect hideAsync to be called once fonts load
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
jest.mock('../components/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: 'light', refreshKey: '1' }),
}));

// Mock AuthContext
jest.mock('../components/AuthContext', () => ({
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