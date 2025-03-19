import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import IndexRoute from '../index';
import { Redirect } from 'expo-router';
import { AuthProvider } from '../../components/AuthContext';
import { useAuth } from '../../components/AuthContext';
import { ActivityIndicator } from 'react-native';

jest.mock('../../components/AuthContext', () => ({
    useAuth: jest.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    Redirect: jest.fn(() => null),
}));

describe('IndexRoute Component', () => {
    test('should render Redirect component with correct href', async () => {
        (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, isLoading: false });
        render(
            <AuthProvider>
                <IndexRoute />
            </AuthProvider>
        );
        await waitFor(() => { expect(Redirect).toHaveBeenCalledWith({ href: '/(auth)/login' }, {}) });
    });

    test('should render Redirect component with correct href when isAuthenticated is true', async () => {
        (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, isLoading: false });
        render(
            <AuthProvider>
                <IndexRoute />
            </AuthProvider>
        );
        await waitFor(() => { expect(Redirect).toHaveBeenCalledWith({ href: '/(protected)/(tabs)/habits' }, {}) });
    });

    test('should render Redirect component with correct href when isLoading is true', async () => {
        (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, isLoading: true });
        const { getByTestId } = render(<IndexRoute />);
        expect(getByTestId('loading-indicator')).toBeTruthy();
    })
});
