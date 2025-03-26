import React from 'react';
import { render } from '@testing-library/react-native';

// Mock SymbolView from expo-symbols using in-scope requires to avoid referencing out-of-scope variables.
jest.mock('expo-symbols', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        SymbolView: (props: any) =>
            React.createElement(Text, { ...props, testID: 'SymbolView' })
    };
});

// Import the IconSymbol component from the iOS file.
import { IconSymbol } from '../../ui/IconSymbol.ios';

describe('IconSymbol (iOS version)', () => {
    it('renders SymbolView with provided custom props correctly', () => {
        // Define a custom style to be merged with the default style.
        const customStyle = { margin: 10 };
        // Render the component with custom props.
        const { getByTestId } = render(
            <IconSymbol name="star.fill" size={32} color="#00FF00" weight="bold" style={customStyle} />
        );
        // Retrieve the mocked SymbolView component.
        const symbolView = getByTestId('SymbolView');

        // Check that the weight prop is passed correctly.
        expect(symbolView.props.weight).toBe('bold');
        // Check that the tintColor (mapped from the color prop) is set correctly.
        expect(symbolView.props.tintColor).toBe('#00FF00');
        // Check that resizeMode is set as expected.
        expect(symbolView.props.resizeMode).toBe('scaleAspectFit');
        // Check that the name prop is passed correctly.
        expect(symbolView.props.name).toBe('star.fill');
        // Verify that the style array includes both the computed size and the custom style.
        expect(symbolView.props.style[0]).toEqual({ width: 32, height: 32 });
        expect(symbolView.props.style[1]).toEqual(customStyle);
    });

    it('defaults to size 24 and weight "regular" when optional props are not provided', () => {
        // Render the component with only the required props.
        const { getByTestId } = render(
            <IconSymbol name="heart.fill" color="#0000FF" />
        );
        const symbolView = getByTestId('SymbolView');

        // Verify that the default weight is "regular".
        expect(symbolView.props.weight).toBe('regular');
        // Verify that tintColor is passed correctly.
        expect(symbolView.props.tintColor).toBe('#0000FF');
        // Verify that resizeMode is correctly set.
        expect(symbolView.props.resizeMode).toBe('scaleAspectFit');
        // Verify the name prop.
        expect(symbolView.props.name).toBe('heart.fill');
        // Verify that the default size is 24 (by checking the computed style).
        expect(symbolView.props.style[0]).toEqual({ width: 24, height: 24 });
    });
});
