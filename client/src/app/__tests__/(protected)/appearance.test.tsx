import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AppearanceScreen from '../../(protected)/appearance';
import { useTheme } from '../../../components/ThemeContext';
import { Colors } from '../../../components/styles/Colors';

// Mock Theme Context
jest.mock('../../../components/ThemeContext', () => ({
    useTheme: jest.fn(),
}));

describe('AppearanceScreen Component', () => {
    it('should render correctly and toggle theme', () => {
        const mockToggleTheme = jest.fn();

        // Mock theme values
        (useTheme as jest.Mock).mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
        });

        const { getByText, getByRole } = render(<AppearanceScreen />);

        // Check if the title appears correctly
        expect(getByText('Appearance')).toBeTruthy();
        expect(getByText('Dark Mode')).toBeTruthy();

        // Check if the switch is in the correct state
        const switchElement = getByRole('switch');
        expect(switchElement.props.value).toBe(false); // Light mode means switch should be off

        // Simulate toggle
        fireEvent(switchElement, 'valueChange');

        // Ensure toggleTheme was called
        expect(mockToggleTheme).toHaveBeenCalled();
    });
});
