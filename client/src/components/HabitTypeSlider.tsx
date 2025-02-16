import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { HabitModalStyles } from './styles/HabitModalStyles';
import { SharedStyles } from './styles/SharedStyles';
import { ThemedText } from './ThemedText';

interface HabitTypeSliderProps {
    habitType: 'build' | 'quit';
    setHabitType: (value: 'build' | 'quit') => void;
}

export const HabitTypeSlider: React.FC<HabitTypeSliderProps> = ({
    habitType,
    setHabitType,
}) => {
    return (
        <View style={HabitModalStyles.sliderContainer}>
            <TouchableOpacity
                style={[
                    HabitModalStyles.sliderOption,
                    habitType === 'build' && HabitModalStyles.selectedOption,
                ]}
                onPress={() => setHabitType('build')}
            >
                <ThemedText
                    style={[
                        HabitModalStyles.sliderOptionText,
                        habitType === 'build' && HabitModalStyles.selectedOptionText,
                        SharedStyles.textDark,
                    ]}
                >
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
                <ThemedText
                    style={[
                        HabitModalStyles.sliderOptionText,
                        habitType === 'quit' && HabitModalStyles.selectedOptionText,
                        SharedStyles.textDark,
                    ]}
                >
                    Quit
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
};
