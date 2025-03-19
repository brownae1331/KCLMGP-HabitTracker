import React from 'react';
import NotificationScreen from '../../(protected)/notifications';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../../components/ThemeContext';

jest.mock('../../../components/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

describe('NotificationScreen functionality tests', () => {
  test('renders the component correctly', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
      refreshKey: 0,
    });

    const { getByText } = render(<NotificationScreen />);
    expect(getByText('Notifications')).toBeTruthy();
  });

  test('renders the component correctly in dark mode', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      toggleTheme: jest.fn(),
      refreshKey: 0,
    });

    const { getByText } = render(<NotificationScreen />);
    const textElement = getByText('Notifications');
    const flattenedStyle = StyleSheet.flatten(textElement.props.style);
    expect(flattenedStyle.color).toBe('#ECEDEE');
  });
});
