import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router to avoid navigation context issues
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  router: { replace: jest.fn() }
}));

// Mock the logIn function
jest.mock('../../../lib/client', () => ({
  logIn: jest.fn()
}));

import { logIn } from '../../../lib/client';
import { router } from 'expo-router';
import LoginScreen from '../../(auth)/login';

describe('LoginScreen functionality tests', () => {
  it('renders the component correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    expect(getByText('Log In')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('calls logIn and navigates to the main screen on successful login', async () => {
    // Simulate a successful login
    (logIn as jest.Mock).mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    // Simulate input
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    // Press the login button
    fireEvent.press(getByText('Login'));

    // Wait for the async operation to complete and assert
    await waitFor(() => {
      expect(logIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(router.replace).toHaveBeenCalledWith('/(tabs)/habits');
    });
  });

  it('displays an error message on failed login', async () => {
    // Simulate a failed login
    (logIn as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));
    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

    // Simulate wrong input
    fireEvent.changeText(getByPlaceholderText('Email'), 'wrong@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');

    // Press the login button
    fireEvent.press(getByText('Login'));

    // Wait for the error message to appear
    const errorMessage = await findByText('Invalid credentials');
    expect(errorMessage).toBeTruthy();
  });
});
