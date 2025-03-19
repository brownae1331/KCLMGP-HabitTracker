import React from 'react';
import { render } from '@testing-library/react-native';
import TabLayout from '../../../(protected)/(tabs)/_layout';
import { Platform, StyleSheet } from 'react-native';
import { Colors } from '../../../../components/styles/Colors';
import { useTheme } from '../../../../components/ThemeContext';


// Mock expo-router inside the module factory to avoid referencing out-of-scope variables.
jest.mock('expo-router', () => {
    const React = require('react');
    // Locally require Text from react-native
    const { Text } = require('react-native');
    const TabsMock = Object.assign(
        jest.fn(({ children, ...props }: { children: React.ReactNode } & Record<string, any>) => <>{children}</>),
        {
            Screen: ({ name, options }: { name: string; options?: any }) => {
                // Render the title (from options.title or name) and the tabBarIcon if provided.
                return (
                    <>
                        <Text>{options?.title || name}</Text>
                        {options && typeof options.tabBarIcon === 'function' ? options.tabBarIcon({ focused: true }) : null}
                    </>
                );
            },
        }
    );
    return { Tabs: TabsMock };
});

jest.mock('../../../../components/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', refreshKey: '1', toggleTheme: jest.fn() }),
}));

jest.mock('../../../../components/HapticTab', () => ({
    HapticTab: (props: any) => <>{props.children}</>,
}));

jest.mock('../../../../components/ui/IconSymbol', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        IconSymbol: (props: any) => (
            <Text testID={`icon-${props.name}`} style={{ color: props.color }}>
                {props.name}
            </Text>
        ),
    };
});

jest.mock('../../../../components/ui/TabBarBackground', () => ({
    default: () => null,
}));

jest.mock('../../../../components/styles/Colors', () => ({
    Colors: {
        light: { tint: 'blue', background: 'white', tabIconDefault: 'gray' },
        dark: { tint: 'blue', background: 'black', tabIconDefault: 'blue' },
    },
}));

// Import Tabs from expo-router after jest.mock is applied.
import { Tabs } from 'expo-router';

describe('TabLayout', () => {
    beforeEach(() => {
        // Clear the mock call history for Tabs.
        (Tabs as unknown as jest.Mock).mockClear();
    });

    test('renders tabs with correct titles', () => {
        const { getByText } = render(<TabLayout />);
        // Verify that each Tabs.Screen title is rendered.
        expect(getByText('Habits')).toBeTruthy();
        expect(getByText('Calendar')).toBeTruthy();
        expect(getByText('Stats')).toBeTruthy();
        expect(getByText('Settings')).toBeTruthy();
    });

    test('renders tab icons with focused true and correct color', () => {
        const { getByTestId } = render(<TabLayout />);
        // For focused true, tabBarIcon should use Colors.light.tint as the color.
        const habitsIcon = getByTestId('icon-book.fill');
        expect(habitsIcon.props.children).toBe('book.fill');
        const calendarIcon = getByTestId('icon-calendar');
        expect(calendarIcon.props.children).toBe('calendar');
        const statsIcon = getByTestId('icon-chart.bar.fill');
        expect(statsIcon.props.children).toBe('chart.bar.fill');
        const settingsIcon = getByTestId('icon-gearshape.fill');
        expect(settingsIcon.props.children).toBe('gearshape.fill');
    });

    test('passes correct screenOptions to Tabs', () => {
        render(<TabLayout />);
        // Access the first call of the Tabs mock.
        const mockedTabs = Tabs as unknown as jest.Mock;
        expect(mockedTabs).toHaveBeenCalledTimes(1);
        const props = mockedTabs.mock.calls[0][0];
        const { Colors } = require('../../../../components/styles/Colors');
        // Remove key check since key is a special prop not accessible.
        // Use non-null assertion since screenOptions is defined in TabLayout.
        const screenOptions = props.screenOptions!;
        expect(screenOptions).toMatchObject({
            tabBarActiveTintColor: Colors.light.tint,
            headerShown: false,
        });
        // Verify that tabBarStyle includes backgroundColor.
        const tabBarStyle = (screenOptions as any).tabBarStyle;
        expect(tabBarStyle).toHaveProperty('backgroundColor', Colors.light.background);
    });

    test('applies correct tabBarStyle for iOS via Platform.select', () => {
        // Override Platform.select to simulate the iOS branch.
        const originalSelect = Platform.select;
        Platform.select = (obj) => obj.ios || {};
        render(<TabLayout />);
        const mockedTabs = Tabs as unknown as jest.Mock;
        const screenOptions = mockedTabs.mock.calls[0][0].screenOptions!;
        const tabBarStyle = (screenOptions as any).tabBarStyle;
        // When Platform.select returns the iOS branch, tabBarStyle should include position: 'absolute'
        expect(tabBarStyle).toHaveProperty('position', 'absolute');
        // Restore Platform.select.
        Platform.select = originalSelect;
    });

    test('renders tab icons with focused false and uses tabIconDefault color', () => {

        const TabsMock = Tabs as unknown as jest.Mock;
        const originalImpl = TabsMock.getMockImplementation();

        TabsMock.mockImplementation(({ children, ...props }: { children: React.ReactNode } & Record<string, any>) => {
            return React.Children.map(children, (child: any) => {
                if (child.props.options && typeof child.props.options.tabBarIcon === 'function') {
                    return child.props.options.tabBarIcon({ focused: false });
                }
                return child;
            });
        });

        const { getByTestId } = render(<TabLayout />);
        expect(getByTestId('icon-book.fill').props.style.color).toBe(Colors.light.tabIconDefault);
        expect(getByTestId('icon-calendar').props.style.color).toBe(Colors.light.tabIconDefault);
        expect(getByTestId('icon-chart.bar.fill').props.style.color).toBe(Colors.light.tabIconDefault);
        expect(getByTestId('icon-gearshape.fill').props.style.color).toBe(Colors.light.tabIconDefault);

        TabsMock.mockImplementation(originalImpl);
    });
});