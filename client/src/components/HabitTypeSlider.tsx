import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { SharedStyles as styles } from '../constants/Styles';
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
        <View style={styles.sliderContainer}>
            <TouchableOpacity
                style={[
                    styles.sliderOption,
                    habitType === 'build' && styles.selectedOption,
                ]}
                onPress={() => setHabitType('build')}
            >
                <ThemedText
                    style={[
                        styles.sliderOptionText,
                        habitType === 'build' && styles.selectedOptionText,
                        styles.textDark,
                    ]}
                >
                    Build
                </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.sliderOption,
                    habitType === 'quit' && styles.selectedOption,
                ]}
                onPress={() => setHabitType('quit')}
            >
                <ThemedText
                    style={[
                        styles.sliderOptionText,
                        habitType === 'quit' && styles.selectedOptionText,
                        styles.textDark,
                    ]}
                >
                    Quit
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
};
