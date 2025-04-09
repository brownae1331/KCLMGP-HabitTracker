import React from 'react';
import { Text } from 'react-native';
import { render, act, waitFor } from '@testing-library/react-native';
import { useColorScheme } from '../useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

// Ensure AsyncStorage.getItem is a Jest mock.
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

// We'll capture the callback passed to Appearance.addChangeListener.
let capturedCallback: ((info: { colorScheme: ColorSchemeName }) => void) | undefined;

// Spy on Appearance.addChangeListener to capture the callback.
jest.spyOn(Appearance, 'addChangeListener').mockImplementation((callback) => {
  capturedCallback = callback;
  return { remove: jest.fn() };
});

// A simple test component that uses the useColorScheme hook.
const TestComponent: React.FC = () => {
  const theme = useColorScheme();
  return <Text testID="theme">{theme}</Text>;
};

describe('useColorScheme (via test component)', () => {
  beforeEach(() => {
    capturedCallback = undefined;
    (AsyncStorage.getItem as jest.Mock).mockReset();
  });

  it('returns the saved theme from AsyncStorage if available', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    // Even if system returns "light", saved theme should override.
    Appearance.getColorScheme = () => 'light';
    const { getByTestId } = render(<TestComponent />);
    await waitFor(() => {
      expect(getByTestId('theme').props.children).toBe('dark');
    });
  });

  it('returns the system theme if no saved theme is found', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    Appearance.getColorScheme = () => 'dark';
    const { getByTestId } = render(<TestComponent />);
    await waitFor(() => {
      expect(getByTestId('theme').props.children).toBe('dark');
    });
  });

  it('updates theme when Appearance sends a valid value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    Appearance.getColorScheme = () => 'light';
    const { getByTestId } = render(<TestComponent />);
    await waitFor(() => {
      expect(getByTestId('theme').props.children).toBe('light');
    });
    // Simulate an Appearance change event with a valid value ('dark')
    act(() => {
      capturedCallback && capturedCallback({ colorScheme: 'dark' });
    });
    await waitFor(() => {
      expect(getByTestId('theme').props.children).toBe('dark');
    });
  });

  it('falls back to light when Appearance sends a null value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    // System initially returns 'light'
    Appearance.getColorScheme = () => 'light';
    const { getByTestId } = render(<TestComponent />);
    await waitFor(() => {
      expect(getByTestId('theme').props.children).toBe('light');
    });
    // Now simulate an Appearance change with null.
    act(() => {
      capturedCallback && capturedCallback({ colorScheme: null });
    });
    await waitFor(() => {
      // Because our hook falls back to 'light', we expect 'light'
      expect(getByTestId('theme').props.children).toBe('light');
    });
  });
});