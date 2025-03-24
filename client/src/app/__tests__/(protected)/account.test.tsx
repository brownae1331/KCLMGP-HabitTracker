import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AccountScreen from '../../(protected)/account';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserDetails, updatePassword } from '../../../lib/client';
import { useTheme } from '../../../components/ThemeContext';

// -------------------------------------------------------------------
// Mock ThemedText to simply render its children inside a Text component
// -------------------------------------------------------------------
jest.mock('../../../components/ThemedText', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        ThemedText: (props: any) => <Text {...props}>{props.children}</Text>,
    };
});

// -------------------------------------------------------------------
// Mock AsyncStorage methods
// -------------------------------------------------------------------
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

// -------------------------------------------------------------------
// Mock client functions: getUserDetails and updatePassword
// -------------------------------------------------------------------
jest.mock('../../../lib/client', () => ({
    getUserDetails: jest.fn(),
    updatePassword: jest.fn(),
}));

// -------------------------------------------------------------------
// Mock useTheme hook to return a static theme
// -------------------------------------------------------------------
jest.mock('../../../components/ThemeContext', () => ({
    useTheme: jest.fn(),
}));

describe('AccountScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('loads and displays user data from AsyncStorage when email exists', async () => {
        // Simulate stored username and email in AsyncStorage
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
            if (key === 'username') return Promise.resolve('testuser');
            if (key === 'email') return Promise.resolve('test@example.com');
            return Promise.resolve(null);
        });
        // getUserDetails should not be called in this branch
        (getUserDetails as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });

        const { getByText, getByDisplayValue } = render(<AccountScreen />);

        // Wait for user data to load and "Account Information" to be displayed
        await waitFor(() => {
            expect(getByText('Account Information')).toBeTruthy();
        });

        await waitFor(() => {
            // Check that the username and email fields display the correct values
            expect(getByDisplayValue('testuser')).toBeTruthy();
            expect(getByDisplayValue('test@example.com')).toBeTruthy();
            expect(getUserDetails).not.toHaveBeenCalled();
        });
    });

    test('logs error if loadUserData fails in useEffect', async () => {
        // Spy on console.error
        jest.spyOn(console, 'error').mockImplementation(() => { });

        // Force AsyncStorage to throw an error
        (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
            new Error('AsyncStorage failure')
        );

        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });

        render(<AccountScreen />);

        // Wait for useEffect to complete
        await waitFor(() => {
            // Expect console.error to have been called with the error message
            expect(console.error).toHaveBeenCalledWith(
                'Error loading user data:',
                expect.any(Error)
            );
        });
    });

    test('loads and displays email using getUserDetails when email is not in AsyncStorage', async () => {
        // Simulate username exists but email is missing
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
            if (key === 'username') return Promise.resolve('testuser');
            if (key === 'email') return Promise.resolve(null);
            return Promise.resolve(null);
        });
        // getUserDetails will provide the email
        (getUserDetails as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(null);
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });

        const { getByDisplayValue } = render(<AccountScreen />);

        // Wait for the email to be loaded from getUserDetails
        await waitFor(() => {
            expect(getByDisplayValue('test@example.com')).toBeTruthy();
        });
        expect(getUserDetails).toHaveBeenCalledWith('testuser');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('email', 'test@example.com');
    });

    test('displays default error if updatePassword fails with non-Error type', async () => {
        // Mock AsyncStorage so that username/email are available
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
            if (key === 'username') return Promise.resolve('testuser');
            if (key === 'email') return Promise.resolve('test@example.com');
            return Promise.resolve(null);
        });
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });

        // Mock updatePassword to reject with a string (non-Error object)
        (updatePassword as jest.Mock).mockRejectedValue('Something went wrong');

        // Spy on Alert to ensure we don't show success
        jest.spyOn(Alert, 'alert');

        const { getByText, getByPlaceholderText } = render(<AccountScreen />);

        // Wait for initial data load
        await waitFor(() => {
            expect(getByText('Account Information')).toBeTruthy();
        });

        // Open the "Change Password" modal
        fireEvent.press(getByText('Change'));

        // Fill in the required fields
        fireEvent.changeText(getByPlaceholderText('Old Password'), 'oldpass');
        fireEvent.changeText(getByPlaceholderText('New Password'), 'newpass');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'newpass');

        // Attempt to change password
        await act(async () => {
            fireEvent.press(getByText('Confirm'));
        });

        // Verify that the default error message is displayed
        await waitFor(() => {
            expect(getByText('Error updating password')).toBeTruthy();
        });
        // Ensure that the success alert was never called
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    test('opens and closes password change modal', async () => {
        // No user data required for this test
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });

        const { getByText, queryByText } = render(<AccountScreen />);

        // Initially, the modal should not be visible
        expect(queryByText('Change Password')).toBeNull();

        // Press the "Change" button to open the modal
        fireEvent.press(getByText('Change'));

        // Wait for the modal content to appear
        await waitFor(() => {
            expect(getByText('Change Password')).toBeTruthy();
        });

        // Press the "Cancel" button to close the modal
        fireEvent.press(getByText('Cancel'));

        // Wait for the modal to disappear
        await waitFor(() => {
            expect(queryByText('Change Password')).toBeNull();
        });
    });

    test('displays error if password change fields are empty', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });

        const { getByText } = render(<AccountScreen />);

        // Open the password change modal
        fireEvent.press(getByText('Change'));
        // Press the "Confirm" button without entering any data
        fireEvent.press(getByText('Confirm'));

        // Expect error message "All fields are required" to be shown
        await waitFor(() => {
            expect(getByText('All fields are required')).toBeTruthy();
        });
    });

    test('displays error if new password and confirm password do not match', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });

        const { getByText, getByPlaceholderText } = render(<AccountScreen />);

        // Open the password change modal
        fireEvent.press(getByText('Change'));

        // Fill in the password fields with mismatching new and confirm passwords
        fireEvent.changeText(getByPlaceholderText('Old Password'), 'oldpass');
        fireEvent.changeText(getByPlaceholderText('New Password'), 'newpass');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'different');

        fireEvent.press(getByText('Confirm'));

        // Expect error message "Passwords do not match"
        await waitFor(() => {
            expect(getByText('Passwords do not match')).toBeTruthy();
        });
    });

    test('successfully changes password and updates UI', async () => {
        // Simulate stored username and email
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
            if (key === 'username') return Promise.resolve('testuser');
            if (key === 'email') return Promise.resolve('test@example.com');
            return Promise.resolve(null);
        });
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });
        // Simulate successful updatePassword
        (updatePassword as jest.Mock).mockResolvedValue(undefined);

        // Spy on Alert.alert to check for success message
        jest.spyOn(Alert, 'alert');

        const { getByText, getByPlaceholderText, queryByText } = render(<AccountScreen />);

        // Wait for initial user data load
        await waitFor(() => {
            expect(getByText('Account Information')).toBeTruthy();
        });

        // Open the password change modal
        fireEvent.press(getByText('Change'));

        // Fill in all password fields with matching new passwords
        fireEvent.changeText(getByPlaceholderText('Old Password'), 'oldpass');
        fireEvent.changeText(getByPlaceholderText('New Password'), 'newpass');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'newpass');

        // Press "Confirm" and wait for async updates
        await act(async () => {
            fireEvent.press(getByText('Confirm'));
        });

        // Verify that the success alert was triggered
        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Success', 'Password updated successfully');
        });
        // Verify that the success message is displayed on the screen
        expect(getByText('Password change successful')).toBeTruthy();
        // Ensure that the modal is closed
        expect(queryByText('Change Password')).toBeNull();
    });

    test('displays error message on password update failure', async () => {
        // Simulate stored username and email
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
            if (key === 'username') return Promise.resolve('testuser');
            if (key === 'email') return Promise.resolve('test@example.com');
            return Promise.resolve(null);
        });
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });
        // Simulate updatePassword failure with an error message
        (updatePassword as jest.Mock).mockRejectedValue(new Error('Update failed'));

        const { getByText, getByPlaceholderText } = render(<AccountScreen />);

        // Wait for the initial load to complete
        await waitFor(() => {
            expect(getByText('Account Information')).toBeTruthy();
        });

        // Open the password change modal
        fireEvent.press(getByText('Change'));

        // Fill in all required fields
        fireEvent.changeText(getByPlaceholderText('Old Password'), 'oldpass');
        fireEvent.changeText(getByPlaceholderText('New Password'), 'newpass');
        fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'newpass');

        // Press "Confirm" and wait for async error handling
        await act(async () => {
            fireEvent.press(getByText('Confirm'));
        });

        // Expect the error message "Update failed" to be displayed
        await waitFor(() => {
            expect(getByText('Update failed')).toBeTruthy();
        });
    });
});
