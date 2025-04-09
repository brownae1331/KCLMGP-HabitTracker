import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router to avoid navigation context issues
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  router: { replace: jest.fn() }
}));

// Mock createUser
jest.mock('../../../lib/client', () => ({
  createUser: jest.fn()
}));

import { createUser } from '../../../lib/client';
import { router } from 'expo-router';
import SignupScreen from '../../(auth)/signup';

describe('SignupScreen functionality tests', () => {
  test('renders the component correctly', () => {
    const { getByPlaceholderText, getAllByText } = render(<SignupScreen />);
    
    expect(getByPlaceholderText('Username')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();

    const buttons = getAllByText('Sign Up');
    expect(buttons.length).toBeGreaterThan(1);
});


  test('calls createUser and navigates to the main screen on successful signup', async () => {
    (createUser as jest.Mock).mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getAllByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    const buttons = getAllByText('Sign Up');
    fireEvent.press(buttons[1]); // choose the second button

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith('test@example.com', 'password123', 'testuser');
      expect(router.replace).toHaveBeenCalledWith('/(protected)/(tabs)/habits');
    });
  });

  test('displays an error message on failed signup', async () => {
    (createUser as jest.Mock).mockRejectedValueOnce(new Error('User already exists'));
    const { getByPlaceholderText, getAllByText, findByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Email'), 'existing@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    const buttons = getAllByText('Sign Up');
    fireEvent.press(buttons[1]);

    const errorMessage = await findByText('User already exists');
    expect(errorMessage).toBeTruthy();
  });

  test('shows "An unknown error occurred" when error is not an instance of Error', async () => {
    (createUser as jest.Mock).mockRejectedValueOnce('Some unknown error');

    const { getByPlaceholderText, getAllByText, findByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    const buttons = getAllByText('Sign Up');
    fireEvent.press(buttons[1]);

    const errorMessage = await findByText('An unknown error occurred');
    expect(errorMessage).toBeTruthy();
  });
});
