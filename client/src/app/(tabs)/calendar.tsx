import React, { useState, useEffect } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../components/ThemedText";
import { CalendarComponent } from "../../components/MonthlyCalendar";
import { StatsBoxComponent } from "../../components/StatsBox";
import { SharedStyles } from "../../components/styles/SharedStyles";
import { CalendarPageStyles } from "../../components/styles/CalendarPageStyles";
import { useTheme } from "../../components/ThemeContext";
import { Colors } from "../../components/styles/Colors";

export default function CalendarScreen() {
  const { theme } = useTheme();
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const today = new Date().toISOString().split("T")[0]; // Get today's date
  const [selectedDate, setSelectedDate] = useState(today);
  const completionPercentage = 69; // Example percentage for progress circle
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});

  // Ensure theme is fully loaded before rendering calendar
  useEffect(() => {
    // Short timeout to ensure theme context is fully initialized
    const timer = setTimeout(() => {
      setIsThemeLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [theme]);

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Generate random progress for each day (10% to 100%)
  const generateRandomProgress = () => Math.floor(Math.random() * 91) + 10;

  // Generate marked dates when theme changes
  useEffect(() => {
    const getMarkedDates = () => {
      let dates: { [key: string]: any } = {};
      for (let i = 1; i <= 31; i++) {
        let day = i < 10 ? `0${i}` : i.toString();
        let date = `2025-02-${day}`;

        // 30% chance for 100% progress, 70% for random progress
        const progress = Math.random() < 0.3 ? 100 : generateRandomProgress();

        dates[date] = {
          progress,
          // Add theme-specific properties to ensure calendar respects theme
          selected: date === selectedDate,
          selectedColor: theme === 'dark' ? '#333333' : '#f0f0f0',
          marked: true,
          dotColor: theme === 'dark' ? '#FFFFFF' : '#000000'
        };
      }
      return dates;
    };

    setMarkedDates(getMarkedDates());
  }, [theme, selectedDate]);

  if (!isThemeLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[theme].background }}>
        <ActivityIndicator size="large" color={Colors[theme].tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ScrollView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
        {/* Title Section */}
        <View style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text }}>
            Calendar
          </ThemedText>
        </View>

        {/* Calendar Component */}
        <View style={[CalendarPageStyles.calendarContainer, { backgroundColor: Colors[theme].background }]}>
          <CalendarComponent
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            markedDates={markedDates}
          />
        </View>

        {/* Stats Box */}
        <StatsBoxComponent
          selectedDate={selectedDate}
          completionPercentage={completionPercentage}
          formatDate={formatDate}
        />
      </ScrollView>
    </SafeAreaView>
  );
}


