import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { HapticTab } from '../HapticTab';
import * as Haptics from 'expo-haptics';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'Light' },
}));

describe('HapticTab', () => {
    const onPressInMock = jest.fn();
    const onPressMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('triggers haptic feedback on iOS press-in and calls onPressIn prop', () => {
        process.env.EXPO_OS = 'ios';
        const { getByTestId } = render(
            <NavigationContainer>
                <HapticTab onPress={onPressMock} onPressIn={onPressInMock} testID="hapticTab" children={undefined} />
            </NavigationContainer>
        );

        act(() => { fireEvent(getByTestId('hapticTab'), 'pressIn') });
        expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
        expect(onPressInMock).toHaveBeenCalled();
    });

    it('does not trigger haptic feedback on non-iOS press-in but still calls onPressIn', () => {
        process.env.EXPO_OS = 'android';
        const { getByTestId } = render(
            <NavigationContainer>
                <HapticTab onPress={onPressMock} onPressIn={onPressInMock} testID="hapticTab" children={undefined} />
            </NavigationContainer>
        );

        act(() => { fireEvent(getByTestId('hapticTab'), 'pressIn') });
        expect(Haptics.impactAsync).not.toHaveBeenCalled();
        expect(onPressInMock).toHaveBeenCalled();
    });
});
