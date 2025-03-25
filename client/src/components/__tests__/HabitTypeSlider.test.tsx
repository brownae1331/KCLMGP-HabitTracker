import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HabitTypeSlider } from '../HabitTypeSlider';

// Mock ThemeContext to avoid needing actual provider
jest.mock('../ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

describe('HabitTypeSlider', () => {
    it('renders both "Build" and "Quit" options', () => {
        const { getByText } = render(
            <HabitTypeSlider habitType="build" setHabitType={jest.fn()} />
        );
        expect(getByText('Build')).toBeTruthy();
        expect(getByText('Quit')).toBeTruthy();
    });

    it('calls setHabitType("quit") when "Quit" option is pressed while build is selected', () => {
        const setHabitType = jest.fn();
        const { getByText } = render(
            <HabitTypeSlider habitType="build" setHabitType={setHabitType} />
        );
        fireEvent.press(getByText('Quit'));
        expect(setHabitType).toHaveBeenCalledWith('quit');
    });

    it('calls setHabitType("build") when "Build" option is pressed while quit is selected', () => {
        const setHabitType = jest.fn();
        const { getByText } = render(
            <HabitTypeSlider habitType="quit" setHabitType={setHabitType} />
        );
        fireEvent.press(getByText('Build'));
        expect(setHabitType).toHaveBeenCalledWith('build');
    });
});
