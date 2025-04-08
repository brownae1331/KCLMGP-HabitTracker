import React, { useState, useEffect } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../../components/ThemedText";
import { CalendarComponent } from "../../../components/MonthlyCalendar";
import { StatsBoxComponent } from "../../../components/StatsBox";
import { SharedStyles } from "../../../components/styles/SharedStyles";
import { CalendarPageStyles } from "../../../components/styles/CalendarPageStyles";
import { useTheme } from "../../../components/ThemeContext";
import { Colors } from "../../../components/styles/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHabitProgressByDate } from "../../../lib/client";
import { useFocusEffect } from "@react-navigation/native";

export const formatDate = (date: string): string => {
  const dateObj = new Date(date);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};

export default function CalendarScreen() {
  const { theme } = useTheme();
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const today = new Date().toISOString().split("T")[0]; // Get today's date
  const [selectedDate, setSelectedDate] = useState(today);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCalendarDates, setVisibleCalendarDates] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Ensure theme is fully loaded before rendering calendar
  useEffect(() => {
    // Short timeout to ensure theme context is fully initialized
    const timer = setTimeout(() => {
      setIsThemeLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [theme]);

  // Load user email from AsyncStorage
  useEffect(() => {
    const loadEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("email");
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          console.warn("No email found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error loading email from AsyncStorage:", error);
      }
    };
    loadEmail();
  }, []);

  // Generate dates for current month if visibleCalendarDates is empty
  useEffect(() => {
    if (isThemeLoaded && visibleCalendarDates.length === 0) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const firstDayOfMonth = new Date(year, month, 1);
      const firstDayOfWeek = firstDayOfMonth.getDay();
      const firstVisibleDate = new Date(year, month, 1 - firstDayOfWeek);

      const lastDayOfMonth = new Date(year, month + 1, 0);
      const lastDayOfWeek = lastDayOfMonth.getDay();
      const lastVisibleDate = new Date(year, month, lastDayOfMonth.getDate() + (6 - lastDayOfWeek));

      const dates: string[] = [];
      const currentDatePointer = new Date(firstVisibleDate);
      while (currentDatePointer <= lastVisibleDate) {
        dates.push(currentDatePointer.toISOString().split("T")[0]);
        currentDatePointer.setDate(currentDatePointer.getDate() + 1);
      }
      setVisibleCalendarDates(dates);
    }
  }, [isThemeLoaded, visibleCalendarDates.length]);

  const handleVisibleDatesChange = (dates: string[]) => {
    setVisibleCalendarDates(dates);
  };

  // Refresh data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setRefreshKey((prevKey) => prevKey + 1);
      return () => {};
    }, [])
  );

  // Fetch habit progress data for all visible dates
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!email || visibleCalendarDates.length === 0) return;
      try {
        setIsLoading(true);
        let newMarkedDates: { [key: string]: any } = {};
        let totalProgressPercentage = 0;
        let validDatesCount = 0;

        for (const date of visibleCalendarDates) {
          const progressData = await getHabitProgressByDate(email, date);
          let totalHabitPercentages = 0;
          for (const habit of progressData) {
            if (habit.habitType === "build" && habit.goalValue) {
              const habitPercentage = Math.min(100, Math.round((habit.progress / habit.goalValue) * 100));
              totalHabitPercentages += habitPercentage;
            } else {
              totalHabitPercentages += habit.progress * 100;
            }
          }
          const progressPercentage = progressData.length > 0 ? Math.round(totalHabitPercentages / progressData.length) : 0;
          if (progressData.length > 0) {
            totalProgressPercentage += progressPercentage;
            validDatesCount++;
          }
          newMarkedDates[date] = {
            progress: progressPercentage,
            selected: date === selectedDate,
            selectedColor: theme === "dark" ? "#333333" : "#f0f0f0",
            marked: true,
            dotColor: theme === "dark" ? "#FFFFFF" : "#000000",
          };
        }
        setMarkedDates(newMarkedDates);
        const averagePercentage = validDatesCount > 0 ? Math.round(totalProgressPercentage / validDatesCount) : 0;
        setCompletionPercentage(averagePercentage);
        calculateStreaks(newMarkedDates);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching habit progress:", error);
        setIsLoading(false);
      }
    };
    fetchProgressData();
  }, [email, visibleCalendarDates, selectedDate, theme, refreshKey]);

  const calculateStreaks = (dates: { [key: string]: any }) => {
    let currentStreakCount = 0;
    let maxStreakCount = 0;
    let streakActive = true;
    let tempStreakCount = 0;
    const sortedDates = Object.keys(dates)
      .filter((date) => date <= today)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const todayData = dates[today];
      const isTodayComplete = todayData && todayData.progress === 100;
      const excludeToday = todayData && !isTodayComplete;
      for (const date of sortedDates) {
        if (excludeToday && date === today) continue;
        const dateData = dates[date];
        if (dateData.progress === 100) {
          if (streakActive) {
            currentStreakCount++;
          }
          tempStreakCount++;
        } else {
          streakActive = false;
          maxStreakCount = Math.max(maxStreakCount, tempStreakCount);
          tempStreakCount = 0;
        }
      }
      maxStreakCount = Math.max(maxStreakCount, tempStreakCount);
    setCurrentStreak(currentStreakCount);
    setLongestStreak(maxStreakCount);
  };

  if (!isThemeLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors[theme].background }}>
        <ActivityIndicator size="large" color={Colors[theme].tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ScrollView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
        <View style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text }}>
            Calendar
          </ThemedText>
        </View>
        <View style={[CalendarPageStyles.calendarContainer, { backgroundColor: Colors[theme].background2 }]}>
          <CalendarComponent
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            markedDates={markedDates}
            onVisibleDatesChange={handleVisibleDatesChange}
          />
        </View>
        {/* Wrap StatsBoxComponent in a View with testID to expose it for testing */}
        <View testID="statsBoxWrapper">
          <StatsBoxComponent
            selectedDate={selectedDate}
            completionPercentage={completionPercentage}
            formatDate={formatDate}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
