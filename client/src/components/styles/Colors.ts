const tintColorLight = '#A39D41';
const tintColorDark = '#fff';

/**
 * Centralised color palette used for light and dark themes throughout the app.
 * Provides text, background, tint, and component-specific colors for consistent styling.
 */
export const Colors = {
    light: {
        text: '#11181C',
        background: '#fff',
        background2: '#f0f0f0',
        backgroundText: '#AFAFAFFF',
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
        border: '#ddd',
        placeholder: '#888',
        graphBackground : '#fff',
        pickerBackground : '#f0f0f0',
    },
    dark: {
        text: '#ECEDEE',
        background: '#151718',
        background2: '#202224',
        backgroundText: '#5B5B5BFF',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
        border: '#444',
        placeholder: '#aaa',
        graphBackground : '#202224',
        pickerBackground : '#151718',
    },
};
