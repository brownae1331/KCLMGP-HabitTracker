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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHabitProgressByDate } from "../../lib/client";
import { useFocusEffect } from "@react-navigation/native";

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
        const storedEmail = await AsyncStorage.getItem('email');
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          console.warn('No email found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading email from AsyncStorage:', error);
      }
    };

    loadEmail();
  }, []);

  useEffect(() => {
    if (isThemeLoaded) {
      // Generate dates for current month if visibleCalendarDates is empty
      if (visibleCalendarDates.length === 0) {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // JS months are 0-indexed

        // Calculate first day of month's week
        const firstDayOfMonth = new Date(year, month, 1);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const firstVisibleDate = new Date(year, month, 1 - firstDayOfWeek);

        // Calculate last day of month's week
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const lastDayOfWeek = lastDayOfMonth.getDay();
        const lastVisibleDate = new Date(year, month, lastDayOfMonth.getDate() + (6 - lastDayOfWeek));

        // Generate all dates between first and last visible date
        const dates: string[] = [];
        const currentDatePointer = new Date(firstVisibleDate);

        while (currentDatePointer <= lastVisibleDate) {
          dates.push(currentDatePointer.toISOString().split('T')[0]);
          currentDatePointer.setDate(currentDatePointer.getDate() + 1);
        }

        setVisibleCalendarDates(dates);
      }
    }
  }, [isThemeLoaded, visibleCalendarDates.length]);

  const handleVisibleDatesChange = (dates: string[]) => {
    setVisibleCalendarDates(dates);
  };

  // Add useFocusEffect to refresh data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Increment the refresh key to trigger a re-fetch
      setRefreshKey(prevKey => prevKey + 1);
      return () => { }; // cleanup function
    }, [])
  );

  useEffect(() => {
    const fetchProgressData = async () => {
      if (email && visibleCalendarDates.length > 0) {
        try {
          setIsLoading(true);
          let newMarkedDates: { [key: string]: any } = {};
          let totalProgressPercentage = 0;
          let validDatesCount = 0;

          for (const date of visibleCalendarDates) {
            const progressData = await getHabitProgressByDate(email, date);

            let totalHabitPercentages = 0;

            for (const habit of progressData) {
              if (habit.habitType === "build") {
                const habitPercentage = Math.min(100, Math.round((habit.progress / habit.goalValue) * 100));
                totalHabitPercentages += habitPercentage;
              }
              else if (habit.habitType === "quit") {
                totalHabitPercentages += habit.progress * 100;
              }
            }

            // Calculate average of habit percentages for this date
            const progressPercentage = progressData.length > 0
              ? Math.round(totalHabitPercentages / progressData.length)
              : 0;

            // Only count dates that have goals
            if (progressData.length > 0) {
              totalProgressPercentage += progressPercentage;
              validDatesCount++;
            }

            // Store the data for this date
            newMarkedDates[date] = {
              progress: progressPercentage,
              selected: date === selectedDate,
              selectedColor: theme === 'dark' ? '#333333' : '#f0f0f0',
              marked: true,
              dotColor: theme === 'dark' ? '#FFFFFF' : '#000000'
            };
          };

          // Update the markedDates state with real data
          setMarkedDates(newMarkedDates);

          // Calculate average completion percentage across all valid dates
          const averagePercentage = validDatesCount > 0
            ? Math.round(totalProgressPercentage / validDatesCount)
            : 0;

          // Update the completion percentage state
          setCompletionPercentage(averagePercentage);

          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching habit progress:', error);
          setIsLoading(false);
        }
      }
    };

    fetchProgressData();
  }, [email, visibleCalendarDates, selectedDate, theme, refreshKey]);

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

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
        <View style={[CalendarPageStyles.calendarContainer, { backgroundColor: Colors[theme].background2 }]}>
          <CalendarComponent
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            markedDates={markedDates}
            onVisibleDatesChange={handleVisibleDatesChange}
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
