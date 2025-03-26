import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from './styles/Colors';
import { CircleProgressStyles } from './styles/CircleProgressStyles';
import { useTheme } from './ThemeContext';

interface CircleProgressProps {
    percentage: number;
    color: string;
    size: number;
    strokeWidth?: number;
}

export const CircleProgress: React.FC<CircleProgressProps> = ({
    percentage,
    color,
    size,
    strokeWidth = 10,
}) => {
    const { theme } = useTheme();
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <View style={CircleProgressStyles.container}>
            <Svg width={size} height={size}>
                {/* Background Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={Colors[theme].border}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90, ${size / 2}, ${size / 2})`}
                />
            </Svg>
        </View>
    );
};
