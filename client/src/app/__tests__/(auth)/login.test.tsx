import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../../../components/AuthContext';

// Mock expo-router to avoid navigation context issues
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  router: { replace: jest.fn() }
}));

// Mock the logIn function
jest.mock('../../../lib/client', () => ({
  logIn: jest.fn(),
  getStoredUser: jest.fn(() => Promise.resolve({ id: 'dummyUser', name: 'Test User' })),
}));

import { logIn } from '../../../lib/client';
import { router } from 'expo-router';
import LoginScreen from '../../(auth)/login';

describe('LoginScreen functionality tests', () => {
  test('renders the component correctly', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(getByText('Log In')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
    })
  });

  test('calls logIn and navigates to the main screen on successful login', async () => {
    // Simulate a successful login
    (logIn as jest.Mock).mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    // Press the login button
    fireEvent.press(getByText('Login'));

    // Wait for the async operation to complete and assert
    await waitFor(() => {
      expect(logIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(router.replace).toHaveBeenCalledWith('/(protected)/(tabs)/habits');
    });
  });

  test('displays an error message on failed login', async () => {
    // Simulate a failed login
    (logIn as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));
    const { getByPlaceholderText, getByText, findByText } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    // Simulate wrong input
    fireEvent.changeText(getByPlaceholderText('Email'), 'wrong@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');

    // Press the login button
    fireEvent.press(getByText('Login'));

    // Wait for the error message to appear
    const errorMessage = await findByText('Invalid credentials');
    expect(errorMessage).toBeTruthy();
  });

  test('shows "An unknown error occurred" when error is not an instance of Error', async () => {
    // Simulate an unknown error
    (logIn as jest.Mock).mockRejectedValueOnce('Some unknown error');

    const { getByPlaceholderText, getByText, findByText } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    // check for the error message
    const errorMessage = await findByText('An unknown error occurred');
    expect(errorMessage).toBeTruthy();
  });

});
