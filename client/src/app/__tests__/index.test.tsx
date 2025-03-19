import React from 'react';
import { render } from '@testing-library/react-native';
import IndexRoute from '../index';
import { Redirect } from 'expo-router';
import { AuthProvider } from '../../components/AuthContext';

// Mock expo-router
jest.mock('expo-router', () => ({
    Redirect: jest.fn(() => null),
}));

describe('IndexRoute Component', () => {
    it('should render Redirect component with correct href', () => {
        render(
            <AuthProvider>
                <IndexRoute />
            </AuthProvider>
        );
        expect(Redirect).toHaveBeenCalledWith({ href: '/(auth)/login' }, {});
    });
});
