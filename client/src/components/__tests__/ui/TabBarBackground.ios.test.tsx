import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

// Mock expo-blur's BlurView to a simple View so we can inspect props without needing native implementation.
jest.mock('expo-blur', () => ({
    BlurView: (props: any) => {
        const { View } = require('react-native');
        // Render a View with the same props and a testID for querying.
        return <View {...props} testID="BlurView" />;
    }
}));

// Mock ThemeContext to control the value of useTheme() (simulate light or dark theme).
jest.mock('../../ThemeContext', () => ({
    useTheme: jest.fn()
}));

// Mock navigation and safe-area hooks used in useBottomTabOverflow.
jest.mock('@react-navigation/bottom-tabs', () => ({
    useBottomTabBarHeight: jest.fn()
}));
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: jest.fn()
}));

import BlurTabBarBackground, { useBottomTabOverflow } from '../../ui/TabBarBackground.ios';
import { useTheme } from '../../ThemeContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

describe('BlurTabBarBackground (iOS component)', () => {
    it('renders a BlurView with dark tint when theme is dark', () => {
        // Simulate a dark theme context value.
        (useTheme as jest.Mock).mockReturnValue({ theme: 'dark' });
        const { getByTestId } = render(<BlurTabBarBackground />);
        const blurView = getByTestId('BlurView');
        // For dark theme, the BlurView tint prop should be "dark".
        expect(blurView.props.tint).toBe('dark');
        // The intensity should always be 100 as specified.
        expect(blurView.props.intensity).toBe(100);
        // Style should be absolute fill (StyleSheet.absoluteFill constant).
        expect(blurView.props.style).toBe(StyleSheet.absoluteFill);
    });

    it('renders a BlurView with light tint when theme is light', () => {
        // Simulate a light theme context value.
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });
        const { getByTestId } = render(<BlurTabBarBackground />);
        const blurView = getByTestId('BlurView');
        // For light theme, the BlurView tint prop should be "light".
        expect(blurView.props.tint).toBe('light');
        expect(blurView.props.intensity).toBe(100);
        expect(blurView.props.style).toBe(StyleSheet.absoluteFill);
    });
});

describe('useBottomTabOverflow (iOS hook)', () => {
    it('calculates overflow as tab bar height minus safe area inset', () => {
        // Set up the mocked hook return values.
        (useBottomTabBarHeight as jest.Mock).mockReturnValue(50);
        (useSafeAreaInsets as jest.Mock).mockReturnValue({ bottom: 10 });
        // Call the hook function.
        const overflow = useBottomTabOverflow();
        // Expect 50 (tab bar height) - 10 (bottom inset) = 40.
        expect(overflow).toBe(40);
    });
});
