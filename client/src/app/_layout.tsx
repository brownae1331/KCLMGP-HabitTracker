import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import * as splashMocks from './partialMockSplashScreen'; 
// ^ your partial mock file
import * as SplashScreen from 'expo-splash-screen'; 
// ^ real code, instrumented for coverage
import RootLayout from '../_layout';

// PARTIALLY MOCK expo-font
jest.mock('expo-font', () => ({
  useFonts: jest.fn(),
}));

// We do NOT mock expo-splash-screen in the usual way
// because we want coverage on real code. 
// Instead, we rely on our partialMockSplashScreen.

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

  it('calls (and covers) SplashScreen.hideAsync when fonts are loaded', async () => {
    // Let the real code run for coverage
    (useFonts as jest.Mock).mockReturnValue([true]);

    // Render the component
    render(<RootLayout />);

    // Wait for the effect to run.
    await waitFor(() => {
      // Check that the real hideAsync was called
      expect(splashMocks.hideAsyncSpy).toHaveBeenCalled();
    });
  });
});
