import React, { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import AuthLayout from '../../(auth)/_layout';

interface StackProps {
    children: ReactNode;
    screenOptions?: object;
}

interface ScreenProps {
    name: string;
}

interface StackComponent extends React.FC<StackProps> {
  Screen: React.FC<ScreenProps>;
}

jest.mock('expo-router', () => {
    const React = require('react');
    const { Text } = require('react-native');
    const Stack: StackComponent = (({ children }: StackProps) => <>{children}</>) as StackComponent;
    Stack.Screen = ({ name }: ScreenProps) => <Text>{name}</Text>;
    return { Stack };
});

describe('AuthLayout', () => {
    it('renders two screens: login and signup', () => {
        const { getByText } = render(<AuthLayout />);
        expect(getByText('login')).toBeTruthy();
        expect(getByText('signup')).toBeTruthy();
    });
});
