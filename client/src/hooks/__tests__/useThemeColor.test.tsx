import { useThemeColor } from '../useThemeColor';
import { useColorScheme } from '../useColorScheme';
import { Colors } from '../../components/styles/Colors';

jest.mock('../useColorScheme');

describe('useThemeColor (Node.js Environment)', () => {
    test('returns correct light mode color when no override is provided', () => {
        (useColorScheme as jest.Mock).mockReturnValue('light');

        const result = useThemeColor({}, 'text');
        expect(result).toBe(Colors.light.text);
    });

    test('returns correct dark mode color when no override is provided', () => {
        (useColorScheme as jest.Mock).mockReturnValue('dark');

        const result = useThemeColor({}, 'background');
        expect(result).toBe(Colors.dark.background);
    });

    test('returns provided light prop when set', () => {
        (useColorScheme as jest.Mock).mockReturnValue('light');

        const customColor = '#ff0000';
        const result = useThemeColor({ light: customColor }, 'icon');
        expect(result).toBe(customColor);
    });

    test('returns provided dark prop when set', () => {
        (useColorScheme as jest.Mock).mockReturnValue('dark');

        const customColor = '#00ff00';
        const result = useThemeColor({ dark: customColor }, 'border');
        expect(result).toBe(customColor);
    });

    test('prefers provided prop over theme color', () => {
        (useColorScheme as jest.Mock).mockReturnValue('light');

        const customColor = '#abcdef';
        const result = useThemeColor({ light: customColor }, 'background2');
        expect(result).toBe(customColor);
    });

    test('returns correct theme color if prop is not provided', () => {
        (useColorScheme as jest.Mock).mockReturnValue('dark');

        const result = useThemeColor({}, 'tabIconSelected');
        expect(result).toBe(Colors.dark.tabIconSelected);
    });
});
