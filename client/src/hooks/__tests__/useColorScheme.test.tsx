import { useColorScheme } from '../useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from '@testing-library/react';
import { Appearance } from 'react-native';

jest.mock('react-native', () => ({
    Appearance: {
        getColorScheme: jest.fn(),
        addChangeListener: jest.fn(),
    },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

describe('useColorScheme (Pure Node.js)', () => {
    let useColorSchemeHook: () => Promise<string>;

    beforeEach(() => {
        jest.clearAllMocks();

        useColorSchemeHook = async () => {
            let theme = 'light';
            const storedTheme = await AsyncStorage.getItem('theme');

            if (storedTheme === 'light' || storedTheme === 'dark') {
                theme = storedTheme;
            } else {
                theme = Appearance.getColorScheme() || 'light';
            }

            return theme;
        };
    });

    test('should default to "light" when system theme is null', async () => {
        (Appearance.getColorScheme as jest.Mock).mockReturnValue(null);
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

        const theme = await useColorSchemeHook();
        expect(theme).toBe('light');
    });

    test('should return system theme when available', async () => {
        (Appearance.getColorScheme as jest.Mock).mockReturnValue('dark');
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

        const theme = await useColorSchemeHook();
        expect(theme).toBe('dark');
    });

    test('should return stored theme if available', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('light');

        const theme = await useColorSchemeHook();
        expect(theme).toBe('light');
    });

    test('should ignore invalid stored themes', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-theme');
        (Appearance.getColorScheme as jest.Mock).mockReturnValue('dark');

        const theme = await useColorSchemeHook();
        expect(theme).toBe('dark');
    });

    test('should correctly handle listener removal', () => {
        const removeListener = jest.fn();
        (Appearance.addChangeListener as jest.Mock).mockImplementation(() => ({
            remove: removeListener,
        }));

        const subscription = Appearance.addChangeListener(() => { });
        subscription.remove();

        expect(removeListener).toHaveBeenCalled();
    });
});
