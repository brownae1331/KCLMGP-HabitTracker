import React from "react";
import { View, Text } from "react-native";
import { Svg, Circle } from "react-native-svg";
import { ThemedText } from "./ThemedText";
import { CalendarPageStyles } from "./styles/CalendarPageStyles";
import { Colors } from "./styles/Colors";
import { useTheme } from "./ThemeContext";

interface StatsBoxComponentProps {
    selectedDate: string;
    completionPercentage: number;
    formatDate: (date: string) => string;
}

export const StatsBoxComponent: React.FC<StatsBoxComponentProps> = ({
    selectedDate,
    completionPercentage,
    formatDate,
}) => {
    const { theme } = useTheme();
    const today = new Date().toISOString().split("T")[0];

    return (
        <View style={[CalendarPageStyles.statsContainer, { backgroundColor: Colors[theme].background2 }]}>
            <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
                🔥 Current Streak: <Text style={{ color: "#FFD700" }}>{17} days</Text>
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
                🏆 Longest Streak: <Text style={{ color: "#FFD700" }}>{38} days</Text>
            </ThemedText>

            {/* Separating Line */}
            <View style={[CalendarPageStyles.separator, { backgroundColor: Colors[theme].border }]} />

            {/* Habits Completed Header */}
            <View style={CalendarPageStyles.habitsContainer}>
                <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
                    Average Completion Percentage
                </ThemedText>
            </View>

            {/* Large Progress Circle */}
            <View style={CalendarPageStyles.progressContainer}>
                <Svg width={120} height={120} viewBox="0 0 120 120">
                    <Circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke={Colors[theme].border}
                        strokeWidth="10"
                        fill="none"
                    />
                    <Circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="#FFD700"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={(1 - completionPercentage / 100) * 2 * Math.PI * 50}
                        strokeLinecap="round"
                    />
                </Svg>
                <View style={CalendarPageStyles.percentageTextContainer}>
                    <ThemedText style={CalendarPageStyles.percentageText}>
                        {completionPercentage}%
                    </ThemedText>
                </View>
            </View>
        </View>
    );
}; 