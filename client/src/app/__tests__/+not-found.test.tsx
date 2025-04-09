import React from 'react';
import { render } from '@testing-library/react-native';
import NotFoundScreen from '../+not-found';

// Mock expo-router to prevent errors with Stack.Screen
jest.mock('expo-router', () => ({
    Link: jest.fn(({ children }) => <>{children}</>),
    Stack: {
        Screen: jest.fn(() => null),
    },
}));

describe('NotFoundScreen', () => {
    it('renders correctly', () => {
        const { getByText } = render(<NotFoundScreen />);

        expect(getByText("This screen doesn't exist.")).toBeTruthy();
        expect(getByText("Go to home screen!"));
    });

    it('contains a Link to home screen', () => {
        const { getByText } = render(<NotFoundScreen />);
        const linkElement = getByText("Go to home screen!");

        expect(linkElement).toBeTruthy();
    });

    it('renders ThemedText components correctly', () => {
        const { getByText } = render(<NotFoundScreen />);
        const titleText = getByText("This screen doesn't exist.");
        const linkText = getByText("Go to home screen!");

        expect(titleText).toBeTruthy();
        expect(linkText).toBeTruthy();
    });
});