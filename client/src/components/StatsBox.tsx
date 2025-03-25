import React from "react";
import { View, Text } from "react-native";
import { ThemedText } from "./ThemedText";
import { CalendarPageStyles } from "./styles/CalendarPageStyles";
import { Colors } from "./styles/Colors";
import { useTheme } from "./ThemeContext";
import { CircleProgress } from "./CircleProgress";

interface StatsBoxComponentProps {
    selectedDate: string;
    completionPercentage: number;
    formatDate: (date: string) => string;
    currentStreak: number;
    longestStreak: number;
}

export const StatsBoxComponent: React.FC<StatsBoxComponentProps> = ({
    selectedDate,
    completionPercentage,
    formatDate,
    currentStreak,
    longestStreak,
}) => {
    const { theme } = useTheme();
    const today = new Date().toISOString().split("T")[0];

    return (
        <View style={[CalendarPageStyles.statsContainer, { backgroundColor: Colors[theme].background2 }]}>
            <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
                🔥 Current Streak: <Text style={{ color: "#a39d41" }}>{currentStreak} days</Text>
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
                🏆 Longest Streak: <Text style={{ color: "#a39d41" }}>{longestStreak} days</Text>
            </ThemedText>

            {/* Separating Line */}
            <View style={[CalendarPageStyles.separator, { backgroundColor: Colors[theme].border }]} />

            {/* Habits Completed Header */}
            <View style={CalendarPageStyles.habitsContainer}>
                <ThemedText style={{ color: Colors[theme].text, fontSize: 24, fontWeight: "bold" }}>
                    Average Completion Percentage
                </ThemedText>
            </View>

            {/* Large Progress Circle using CircleProgress component */}
            <View style={CalendarPageStyles.progressContainer}>
                <CircleProgress
                    percentage={completionPercentage}
                    color="#a39d41"
                    size={120}
                    strokeWidth={10}
                />
                <View style={CalendarPageStyles.percentageTextContainer}>
                    <ThemedText style={CalendarPageStyles.percentageText}>
                        {completionPercentage}%
                    </ThemedText>
                </View>
            </View>
        </View>
    );
}; 