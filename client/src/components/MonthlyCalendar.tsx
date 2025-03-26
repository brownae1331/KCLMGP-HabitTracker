import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Svg, Circle } from "react-native-svg";
import { Colors } from "./styles/Colors";
import { useTheme } from "./ThemeContext";

interface CalendarComponentProps {
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    markedDates: { [key: string]: any };
    onVisibleDatesChange?: (dates: string[]) => void;
}

export const CalendarComponent: React.FC<CalendarComponentProps> = ({
    selectedDate,
    setSelectedDate,
    markedDates,
    onVisibleDatesChange,
}) => {
    const { theme } = useTheme();
    const today = new Date().toISOString().split("T")[0]; // Get today's date
    const [visibleDates, setVisibleDates] = React.useState<string[]>([]);

    // Function to calculate all visible dates when month changes
    const calculateVisibleDates = (monthDate: DateData) => {
        const year = monthDate.year;
        const month = monthDate.month - 1; // JS months are 0-indexed

        const firstDayOfMonth = new Date(year, month, 1);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const firstVisibleDate = new Date(year, month, 1 - firstDayOfWeek);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const lastDayOfWeek = lastDayOfMonth.getDay();
        const lastVisibleDate = new Date(year, month, lastDayOfMonth.getDate() + (6 - lastDayOfWeek));
        const dates: string[] = [];
        const currentDate = new Date(firstVisibleDate);

        while (currentDate <= lastVisibleDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        setVisibleDates(dates);

        if (onVisibleDatesChange) {
            onVisibleDatesChange(dates);
        }
    };

    return (
        <Calendar
            testID="calendar"
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            onMonthChange={(month: DateData) => {
                calculateVisibleDates(month);
            }}
            onLayout={() => {
                const today = new Date();
                calculateVisibleDates({
                    year: today.getFullYear(),
                    month: today.getMonth() + 1,
                    day: 1,
                    timestamp: today.getTime(),
                    dateString: today.toISOString().split('T')[0]
                });
            }}
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
                                        fill={Colors[theme].border}
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
                backgroundColor: Colors[theme].background2,
                calendarBackground: Colors[theme].background2,
                textSectionTitleColor: Colors[theme].text,
                dayTextColor: Colors[theme].text,
                todayTextColor: "#FFD700",
                arrowColor: Colors[theme].text,
                monthTextColor: Colors[theme].text,
                textDisabledColor: Colors[theme].text,
            }}
        />
    );
}; 