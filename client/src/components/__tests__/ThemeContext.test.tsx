import React from 'react';
import { render, act } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// A test component that uses the context
const TestComponent = () => {
  const { theme, toggleTheme, refreshKey } = useTheme();
  return (
    <>
      <Text testID="theme">{theme}</Text>
      <Text testID="refreshKey">{refreshKey}</Text>
      <Text onPress={toggleTheme} testID="toggle">
        Toggle
      </Text>
    </>
  );
};

import { Text } from 'react-native';

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to light theme', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { findByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeText = await findByTestId('theme');
    expect(themeText.props.children).toBe('light');
  });

  it('toggles theme from light to dark and updates AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('light');

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeText = getByTestId('theme');
    const toggleButton = getByTestId('toggle');
    const refreshKeyText = getByTestId('refreshKey');

    expect(themeText.props.children).toBe('light');
    const initialRefresh = parseInt(refreshKeyText.props.children);

    await act(async () => {
      toggleButton.props.onPress();
    });

    expect(themeText.props.children).toBe('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

    const newRefresh = parseInt(refreshKeyText.props.children);
    expect(newRefresh).toBeGreaterThan(initialRefresh);
  });
});
