import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { HabitModalStyles } from './styles/HabitModalStyles';
import { ThemedText } from './ThemedText';
import { Colors } from './styles/Colors';
import { useTheme } from './ThemeContext';

interface HabitTypeSliderProps {
    habitType: 'build' | 'quit';
    setHabitType: (value: 'build' | 'quit') => void;
    activeColor?: string;
}

// Toggle switch component for selecting between 'build' and 'quit' habit types
export const HabitTypeSlider: React.FC<HabitTypeSliderProps> = ({
    habitType,
    setHabitType,
    activeColor = '#a39d41',
}) => {
    const { theme } = useTheme();
    return (
        <View style={[HabitModalStyles.sliderContainer, { borderColor: activeColor }]}>
            <TouchableOpacity
                style={[
                    HabitModalStyles.sliderOption,
                    habitType === 'build' && [HabitModalStyles.selectedOption, { backgroundColor: activeColor }],
                ]}
                onPress={() => setHabitType('build')}
            >
                <ThemedText type="defaultSemiBold" style={{ color: Colors[theme].text }}>
                    Build
                </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    HabitModalStyles.sliderOption,
                    habitType === 'quit' && [HabitModalStyles.selectedOption, { backgroundColor: activeColor }],
                ]}
                onPress={() => setHabitType('quit')}
            >
                <ThemedText type="defaultSemiBold" style={{ color: Colors[theme].text }}>
                    Quit
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
};
