import React, { useState } from "react";
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { Svg, Circle } from "react-native-svg";

export default function CalendarScreen() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Title Section */}
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={{ color: "#FFF" }}>
            Calendar
          </ThemedText>
        </ThemedView>

        {/* Calendar Component */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            dayComponent={({ date, state }) => {
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
                      <Circle cx="22.5" cy="22.5" r={radius} stroke="#444444" strokeWidth={strokeWidth} fill="none" />
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
                        <Circle cx="22.5" cy="22.5" r={radius - 5} fill="rgba(255, 255, 255, 0.3)" />
                      )}
                    </Svg>
                    <Text
                      style={{
                        color: date.dateString === today ? "#FFD700" : "#FFF",
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
              backgroundColor: "#121212",
              calendarBackground: "#121212",
              textSectionTitleColor: "#BBBBBB",
              dayTextColor: "#FFFFFF",
              todayTextColor: "#FF3B30",
              arrowColor: "#FFFFFF",
              monthTextColor: "#FFFFFF",
              textDisabledColor: "#444444",
            }}
          />
        </View>

        {/* Stats Box */}
        <ThemedView style={styles.statsContainer}>
          <ThemedText type="subtitle" style={{ color: "#FFF" }}>
            🔥 Current Streak: <Text style={{ color: "#FFD700" }}>{17} days</Text>
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: "#FFF" }}>
            🏆 Longest Streak: <Text style={{ color: "#FFD700" }}>{38} days</Text>
          </ThemedText>

          {/* Separating Line */}
          <View style={styles.separator} />

          {/* Habits Completed Header */}
          <View style={styles.habitsContainer}>
            <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "bold" }}>
              Habits completed{" "}
              <Text style={{ color: "#FFD700" }}>
                {selectedDate === today ? "Today" : formatDate(selectedDate)}
              </Text>
            </Text>
          </View>

          {/* Large Progress Circle */}
          <View style={styles.progressContainer}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Circle cx="60" cy="60" r="50" stroke="#444444" strokeWidth="10" fill="none" />
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
            <View style={styles.progressTextContainer}>
              <Text style={styles.percentageText}>{completionPercentage}%</Text>
              <Text style={styles.fractionText}>{completionPercentage}/100</Text>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
  },
  calendarContainer: {
    padding: 16,
  },
  statsContainer: {
    marginTop: 20,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 5,
  },
  habitsContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: "#444444",
    marginVertical: 10,
  },
  progressContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  progressTextContainer: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between", // Aligns left and right
    paddingHorizontal: 20, // Adds spacing on both sides
    top: "45%", // Positions text correctly
  },
  percentageText: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
  },
  fractionText: {
    color: "#FFF",
    fontSize: 18,
  },
});
