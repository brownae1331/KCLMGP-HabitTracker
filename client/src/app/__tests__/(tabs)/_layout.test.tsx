import React from 'react';
import { render } from '@testing-library/react-native';
import TabLayout from '../../(tabs)/_layout';

interface TabsProps {
    children: React.ReactNode;
    screenOptions?: object;
    key?: any;
}
interface TabsScreenProps {
    name: string;
    options?: any;
}
interface TabsComponent extends React.FC<TabsProps> {
    Screen: React.FC<TabsScreenProps>;
}

jest.mock('expo-router', () => {
    const React = require('react');
    const { Text } = require('react-native');
    const Tabs: TabsComponent = (({ children }: TabsProps) => <>{children}</>) as TabsComponent;
    Tabs.Screen = ({ name }: TabsScreenProps) => <Text>{name}</Text>;
    return { Tabs };
});

jest.mock('../../../components/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', refreshKey: '1', toggleTheme: jest.fn() }),
}));

jest.mock('../../../components/HapticTab', () => ({
    HapticTab: (props: any) => <>{props.children}</>,
}));

jest.mock('../../../components/ui/IconSymbol', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        IconSymbol: (props: any) => <Text testID={`icon-${props.name}`}>{props.name}</Text>,
    };
});

jest.mock('../../../components/ui/TabBarBackground', () => ({
    default: () => null,
}));

jest.mock('../../../components/styles/Colors', () => ({
    Colors: {
        light: { tint: 'blue', background: 'white', tabIconDefault: 'gray' },
        dark: { tint: 'blue', background: 'black', tabIconDefault: 'gray' },
    },
}));

describe('TabLayout', () => {
    it('renders tabs with correct names', () => {
        const { getByText } = render(<TabLayout />);
        expect(getByText('habits')).toBeTruthy();
        expect(getByText('calendar')).toBeTruthy();
        expect(getByText('stats')).toBeTruthy();
        expect(getByText('settings')).toBeTruthy();
    });
});
