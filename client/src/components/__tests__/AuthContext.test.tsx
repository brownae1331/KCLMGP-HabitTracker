import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { getStoredUser } from '../../lib/client';

jest.mock('../../lib/client', () => ({
    getStoredUser: jest.fn(),
}));

// A helper component to consume AuthContext for testing
const AuthStatusDisplay: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    return (
        <>
            <>{isLoading ? <></> : <></>}</>
            <>{isAuthenticated ? <></> : <></>}</>
        </>
    );
};

describe('AuthContext', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('sets isAuthenticated true when a stored user exists', async () => {
        // Arrange: mock getStoredUser to return a user and render provider
        (getStoredUser as jest.Mock).mockResolvedValue({ id: 123 });
        const { getByText } = render(
            <AuthProvider>
                <AuthStatusDisplay />
            </AuthProvider>
        );

        // Act & Assert: wait for isLoading to become false and check isAuthenticated
        await waitFor(() => {
            expect(getStoredUser).toHaveBeenCalled(); // ensure checkAuthStatus ran
            expect(getByText(/Logged in/i)).toBeTruthy();
            expect(getByText(/Done/i)).toBeTruthy();
        });
    });

    it('sets isAuthenticated false when no stored user', async () => {
        (getStoredUser as jest.Mock).mockResolvedValue(null);
        const { getByText } = render(
            <AuthProvider>
                <AuthStatusDisplay />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(getStoredUser).toHaveBeenCalled();
            expect(getByText(/Logged out/i)).toBeTruthy();
            expect(getByText(/Done/i)).toBeTruthy();
        });
    });

    it('handles errors from getStoredUser by setting isAuthenticated false', async () => {
        // Arrange: mock getStoredUser to throw
        (getStoredUser as jest.Mock).mockRejectedValue(new Error('Storage error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const { getByText } = render(
            <AuthProvider>
                <AuthStatusDisplay />
            </AuthProvider>
        );

        // Assert: isAuthenticated becomes false and isLoading false after error
        await waitFor(() => {
            expect(getStoredUser).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error checking auth status:',
                expect.any(Error)
            );
            expect(getByText(/Logged out/i)).toBeTruthy();
            expect(getByText(/Done/i)).toBeTruthy();
        });
        consoleSpy.mockRestore();
    });
});
