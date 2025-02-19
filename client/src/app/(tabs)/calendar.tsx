import React, { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { Svg, Circle } from "react-native-svg";
import { CalendarPageStyles } from "../../components/styles/CalendarPageStyles";
import { useTheme } from "../../components/ThemeContext";
import { Colors } from "../../components/styles/Colors";

export default function CalendarScreen() {
  const { theme } = useTheme();
  const today = new Date().toISOString().split("T")[0]; // Get today's date
  const [selectedDate, setSelectedDate] = useState(today);
  const completionPercentage = 69; // Example percentage for progress circle

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Generate random progress for each day (10% to 100%)
  const generateRandomProgress = () => Math.floor(Math.random() * 91) + 10;

  const getMarkedDates = () => {
    let markedDates: { [key: string]: any } = {};
    for (let i = 1; i <= 31; i++) {
      let day = i < 10 ? `0${i}` : i.toString();
      let date = `2025-02-${day}`;

      // 30% chance for 100% progress, 70% for random progress
      const progress = Math.random() < 0.3 ? 100 : generateRandomProgress();

      markedDates[date] = { progress };
    }
    return markedDates;
  };

  const markedDates = getMarkedDates();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ScrollView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
        {/* Title Section */}
        <ThemedView style={[CalendarPageStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text }}>
            Calendar
          </ThemedText>
        </ThemedView>

        {/* Calendar Component */}
        <View style={[
          CalendarPageStyles.calendarContainer,
          { backgroundColor: Colors[theme].background }
        ]}>
          <Calendar
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            dayComponent={({ date, state }: { date: DateData, state: any }) => {
              const progress = markedDates[date.dateString]?.progress || 0;
              const radius = 18;
              const strokeWidth = 3;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (progress / 100) * circumference;
              const isSelected = date.dateString === selectedDate;

              return (
                <TouchableOpacity onPress={() => setSelectedDate(date.dateString)} activeOpacity={0.7}>
                  <View style={{ alignItems: "center", justifyContent: "center" }}>
                    <Svg width={45} height={45} viewBox="0 0 45 45">
                      {/* Background Circle */}
                      <Circle
                        cx="22.5"
                        cy="22.5"
                        r={radius}
                        stroke={theme === 'dark' ? "#444444" : "#CCCCCC"}
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
                          fill={theme === 'dark' ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.1)"}
                        />
                      )}
                    </Svg>
                    <Text
                      style={{
                        color: date.dateString === today
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
              backgroundColor: Colors[theme].background,
              calendarBackground: Colors[theme].background,
              textSectionTitleColor: Colors[theme].text,
              dayTextColor: Colors[theme].text,
              todayTextColor: "#FFD700",
              arrowColor: Colors[theme].text,
              monthTextColor: Colors[theme].text,
              textDisabledColor: theme === 'dark' ? "#444444" : "#CCCCCC",
            }}
          />
        </View>

        {/* Stats Box */}
        <ThemedView style={[
          CalendarPageStyles.statsContainer,
          { backgroundColor: theme === 'dark' ? "#1E1E1E" : "#FFFFFF" }
        ]}>
          <ThemedText type="subtitle">
            🔥 Current Streak: <Text style={{ color: "#FFD700" }}>{17} days</Text>
          </ThemedText>
          <ThemedText type="subtitle">
            🏆 Longest Streak: <Text style={{ color: "#FFD700" }}>{38} days</Text>
          </ThemedText>

          {/* Separating Line */}
          <View style={[
            CalendarPageStyles.separator,
            { backgroundColor: theme === 'dark' ? "#444444" : "#CCCCCC" }
          ]} />

          {/* Habits Completed Header */}
          <View style={CalendarPageStyles.habitsContainer}>
            <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
              Habits completed{" "}
              <Text style={{ color: "#FFD700" }}>
                {selectedDate === today ? "Today" : formatDate(selectedDate)}
              </Text>
            </ThemedText>
          </View>

          {/* Large Progress Circle */}
          <View style={CalendarPageStyles.progressContainer}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Circle
                cx="60"
                cy="60"
                r="50"
                stroke={theme === 'dark' ? "#444444" : "#CCCCCC"}
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
            <View style={CalendarPageStyles.progressTextContainer}>
              <ThemedText style={[CalendarPageStyles.percentageText, { color: "#FFD700" }]}>
                {completionPercentage}%
              </ThemedText>
              <ThemedText style={CalendarPageStyles.fractionText}>
                {completionPercentage}/100
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}


