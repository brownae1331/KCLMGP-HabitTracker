import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Svg, Circle } from "react-native-svg";
import { CalendarPageStyles } from "./styles/CalendarPageStyles";
import { Colors } from "./styles/Colors";
import { useTheme } from "./ThemeContext";

interface CalendarComponentProps {
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    markedDates: { [key: string]: any };
}

export const CalendarComponent: React.FC<CalendarComponentProps> = ({
    selectedDate,
    setSelectedDate,
    markedDates,
}) => {
    const { theme } = useTheme();
    const today = new Date().toISOString().split("T")[0]; // Get today's date

    return (
        <View style={[CalendarPageStyles.calendarContainer, { backgroundColor: Colors[theme].background2 }]}>
            <Calendar
                onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                dayComponent={({ date, state }: { date: DateData; state: any }) => {
                    const progress = markedDates[date.dateString]?.progress || 0;
                    const radius = 18;
                    const strokeWidth = 3;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset =
                        circumference - (progress / 100) * circumference;
                    const isSelected = date.dateString === selectedDate;

                    return (
                        <TouchableOpacity
                            onPress={() => setSelectedDate(date.dateString)}
                            activeOpacity={0.7}
                        >
                            <View style={{ alignItems: "center", justifyContent: "center" }}>
                                <Svg width={45} height={45} viewBox="0 0 45 45">
                                    {/* Background Circle */}
                                    <Circle
                                        cx="22.5"
                                        cy="22.5"
                                        r={radius}
                                        stroke={Colors[theme].border}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                    {/* Golden Progress Circle */}
                                    <Circle
                                        cx="22.5"
                                        cy="22.5"
                                        r={radius}
                                        stroke="#FFD700"
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                    />
                                    {/* Selection Circle */}
                                    {isSelected && (
                                        <Circle
                                            cx="22.5"
                                            cy="22.5"
                                            r={radius - 5}
                                            fill={
                                                theme === "dark"
                                                    ? "rgba(255, 255, 255, 0.3)"
                                                    : "rgba(0, 0, 0, 0.1)"
                                            }
                                        />
                                    )}
                                </Svg>
                                <Text
                                    style={{
                                        color:
                                            date.dateString === today
                                                ? "#FFD700"
                                                : Colors[theme].text,
                                        fontSize: 14,
                                        position: "absolute",
                                        fontWeight: isSelected ? "bold" : "normal",
                                    }}
                                >
                                    {date.day}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                theme={{
                    // backgroundColor: Colors[theme].background,
                    // calendarBackground: Colors[theme].background,
                    // textSectionTitleColor: Colors[theme].text,
                    // dayTextColor: Colors[theme].text,
                    // todayTextColor: "#FFD700",
                    // arrowColor: Colors[theme].text,
                    // monthTextColor: Colors[theme].text,
                    // textDisabledColor: theme === "dark" ? "#444444" : "#CCCCCC",
                    calendarBackground: Colors[theme].background2,
                    backgroundColor: Colors[theme].background2,
                }}
            />
        </View>
    );
}; 