import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { HabitModalStyles } from './styles/HabitModalStyles';
import { SharedStyles } from './styles/SharedStyles';
import { ThemedText } from './ThemedText';
import { Colors } from './styles/Colors';
import { useTheme } from './ThemeContext';

interface HabitTypeSliderProps {
    habitType: 'build' | 'quit';
    setHabitType: (value: 'build' | 'quit') => void;
}

export const HabitTypeSlider: React.FC<HabitTypeSliderProps> = ({
    habitType,
    setHabitType,
}) => {
    const { theme } = useTheme();
    return (
        <View style={HabitModalStyles.sliderContainer}>
            <TouchableOpacity
                style={[
                    HabitModalStyles.sliderOption,
                    habitType === 'build' && HabitModalStyles.selectedOption,
                ]}
                onPress={() => setHabitType('build')}
            >
                <ThemedText type="defaultSemiBold" style={[HabitModalStyles.sliderOptionText, habitType === 'build' && HabitModalStyles.selectedOptionText, { color: Colors[theme].text }]}>
                    Build
                </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    HabitModalStyles.sliderOption,
                    habitType === 'quit' && HabitModalStyles.selectedOption,
                ]}
                onPress={() => setHabitType('quit')}
            >
                <ThemedText type="defaultSemiBold" style={[HabitModalStyles.sliderOptionText, habitType === 'quit' && HabitModalStyles.selectedOptionText, { color: Colors[theme].text }]}>
                    Quit
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
};
