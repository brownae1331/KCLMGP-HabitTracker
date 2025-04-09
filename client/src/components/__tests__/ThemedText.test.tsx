import React from 'react';
import { render } from '@testing-library/react-native';
// Mock the useThemeColor hook to control its output
jest.mock('../../hooks/useThemeColor', () => ({
    useThemeColor: jest.fn(),
}));
import { useThemeColor } from '../../hooks/useThemeColor';
import { ThemedText } from '../ThemedText';

describe('ThemedText component', () => {
    beforeEach(() => {
        // Default mock return value for useThemeColor (for example, a generic color)
        (useThemeColor as jest.Mock).mockReturnValue('#000000');
        jest.clearAllMocks();
    });

    it('should use the color from useThemeColor hook for text color', () => {
        // Make the hook return a specific color
        (useThemeColor as jest.Mock).mockReturnValue('#123456');
        const { getByText } = render(<ThemedText>Test Color</ThemedText>);
        const textElement = getByText('Test Color');
        // The text color style should match the color returned by useThemeColor
        expect(textElement).toHaveStyle({ color: '#123456' });
    });

    it('should apply correct styles for the "title" variant', () => {
        const { getByText } = render(<ThemedText type="title">Title Text</ThemedText>);
        const textElement = getByText('Title Text');
        // "title" variant should have large bold styling (fontSize 32, fontWeight 'bold')
        expect(textElement).toHaveStyle({ fontSize: 32, fontWeight: 'bold' });
    });

    it('should apply correct styles for the "defaultSemiBold" variant', () => {
        const { getByText } = render(
            <ThemedText type="defaultSemiBold">SemiBold Text</ThemedText>
        );
        const textElement = getByText('SemiBold Text');
        // "defaultSemiBold" variant should have semi-bold weight (fontWeight '600')
        expect(textElement).toHaveStyle({ fontWeight: '600', fontSize: 16 });
    });

    it('should apply the link variant color and style for "link" type', () => {
        // Even if useThemeColor returns a different color, "link" style should use its own color
        (useThemeColor as jest.Mock).mockReturnValue('#ff00ff');
        const { getByText } = render(<ThemedText type="link">Link Text</ThemedText>);
        const textElement = getByText('Link Text');
        // The "link" variant defines color #0a7ea4 and specific lineHeight/fontSize
        expect(textElement).toHaveStyle({ color: '#0a7ea4', fontSize: 16 });
    });

    it('should merge custom style prop with default styles', () => {
        const { getByText } = render(
            <ThemedText style={{ fontSize: 20, margin: 5 }}>Styled Text</ThemedText>
        );
        const textElement = getByText('Styled Text');
        // Custom style fontSize should override default fontSize (16), and margin should be applied
        expect(textElement).toHaveStyle({ fontSize: 20, margin: 5, lineHeight: 24 });
    });
});
