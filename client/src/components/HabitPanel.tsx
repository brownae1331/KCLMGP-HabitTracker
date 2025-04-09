import { updateHabitProgress, getHabitStreak, getHabitInterval, getHabitDays, getHabitProgressByDateAndHabit } from '../lib/client';
import { IconSymbol } from './ui/IconSymbol';
import React, { useState, useEffect } from 'react';
import { Platform, View, TouchableOpacity, Text, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { HabitPanelStyles } from './styles/HabitPanelStyles';
import { deleteHabit } from '../lib/client';
import { ProgressEntry } from './ProgressEntry';

// Interface for user-defined habits, including schedule, color, type, and optional goal data
export interface Habit {
  user_email: string;
  habitName: string;
  habitDescription: string;
  habitType: 'build' | 'quit';
  habitColor: string;
  scheduleOption: 'interval' | 'weekly';
  intervalDays?: number;
  selectedDays?: string[];
  isGoalEnabled: boolean;
  goalValue?: number | null;
  goalUnit?: string;
}

// Props for the HabitPanel component including habit data, selected date, and edit/delete handlers
interface HabitPanelProps {
  habit: Habit;
  onEdit?: (habit: Habit) => void;
  selectedDate?: Date;
  onDelete?: () => void;
}

/**
 * HabitPanel displays a habit's name, description, progress, and streak.
 * It allows users to edit, delete, or update progress (based on habit type and date).
 */
const HabitPanel: React.FC<HabitPanelProps> = ({ habit, onDelete, onEdit, selectedDate }) => {
  // For build habits: track numeric progress
  const [buildProgress, setBuildProgress] = useState<string>('');
  // For quit habits: track yes/no status
  const [quitStatus, setQuitStatus] = useState<'COMPLETE' | 'INCOMPLETE' | ''>('');
  // Local flag to indicate an update was made
  const [updated, setUpdated] = useState(false);
  // Track the habit streak
  const [streak, setStreak] = useState<number>(0);
  // State to control the progress entry modal
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  // Track numeric progress
  const [currentProgress, setCurrentProgress] = useState<number>(0);

  const date = selectedDate
    ? selectedDate.toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // Check if selected date is in the future by comparing just the dates (ignoring time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create a copy of selectedDate with time set to midnight for proper comparison
  const selectedDateCopy = selectedDate ? new Date(selectedDate) : null;
  if (selectedDateCopy) {
    selectedDateCopy.setHours(0, 0, 0, 0);
  }

  // Only consider a date future if it's strictly after today
  const isDateInFuture = selectedDateCopy && selectedDateCopy > today;

  // Function to check if a date is today
  const isToday = selectedDateCopy &&
    selectedDateCopy.getDate() === today.getDate() &&
    selectedDateCopy.getMonth() === today.getMonth() &&
    selectedDateCopy.getFullYear() === today.getFullYear();

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        // Only fetch streak if date is not in the future
        if (!isDateInFuture) {
          const streakData = await getHabitStreak(habit.user_email, habit.habitName, date);
          setStreak(streakData?.streak || 0);

          // If it's today and streak is 0, get the last occurrence's streak
          if (isToday && (streakData?.streak || 0) === 0) {
            // Find the last scheduled date for this habit
            const lastScheduledDate = await findLastScheduledDate(habit);
            if (lastScheduledDate) {
              const lastDateStr = lastScheduledDate.toISOString().split("T")[0];

              // Fetch last occurrence's streak
              const lastStreakData = await getHabitStreak(habit.user_email, habit.habitName, lastDateStr);
              if ((lastStreakData?.streak || 0) > 0) {
                setStreak(lastStreakData.streak);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching habit streak:', error);
      }
    };

    fetchStreak();
  }, [habit, updated, date, isDateInFuture, isToday]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const progressData = await getHabitProgressByDateAndHabit(
          habit.user_email,
          habit.habitName,
          date
        );
        const progressValue =
          progressData && typeof progressData.progress !== 'undefined'
            ? progressData.progress
            : 0;
        setCurrentProgress(progressValue);
        const isBuildWithoutGoal =
          habit.habitType === 'build' &&
          (habit.goalValue === undefined || habit.goalValue === null);
        if (habit.habitType === 'build' && !isBuildWithoutGoal) {
          setBuildProgress(progressValue.toString());
        } else {
          setQuitStatus(progressValue > 0 ? 'COMPLETE' : 'INCOMPLETE');
        }
      } catch (error) {
        console.error('Error fetching habit progress:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [habit, date]);


  // Determines the most recent scheduled date for a habit based on its interval or selected weekdays
  const findLastScheduledDate = async (habit: Habit) => {
    try {
      const today = new Date();

      if (habit.scheduleOption === 'interval') {
        // For interval habits, calculate the last date based on the interval
        const intervalData = await getHabitInterval(habit.user_email, habit.habitName);
        const intervalDays = intervalData?.increment || 1;

        // Create a date for the last scheduled occurrence
        const lastDate = new Date(today);
        lastDate.setDate(today.getDate() - intervalDays);
        return lastDate;
      }
      else {
        // For weekly habits, find the previous occurrence based on selected days
        const daysResponse = await getHabitDays(habit.user_email, habit.habitName);
        if (!daysResponse || daysResponse.length === 0) return null;

        const selectedDays = daysResponse.map((day: { day: string }) => day.day);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Start from yesterday and go backwards up to 7 days
        for (let i = 1; i <= 7; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dayName = dayNames[checkDate.getDay()];

          if (selectedDays.includes(dayName)) {
            return checkDate;
          }
        }
      }
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return yesterday;
    } catch (error) {
      console.error('Error finding last scheduled date:', error);
      return null;
    }
  };

  // Updates the progress value for the current habit and adjusts the streak accordingly
  const handleUpdate = async (progress: number) => {
    try {
      // Determine if this is a build habit without a goal
      const isBuildWithoutGoal = habit.habitType === 'build' &&
        (habit.goalValue === undefined || habit.goalValue === null);

      // Set progress based on habit type and goal presence
      const progressValue = habit.habitType === 'quit' || isBuildWithoutGoal
        ? progress > 0 ? 1 : 0  // For quit habits and build habits without goals: binary 0/1
        : progress;  // For build habits with goals: numeric value

      await updateHabitProgress(habit.user_email, habit.habitName, progressValue);
      setUpdated(true);

      // For build habits with goals, update the progress state numerically
      if (!isBuildWithoutGoal) {
        setBuildProgress(progress.toString());
        setCurrentProgress(progress);
      } else {
        // For quit habits and build habits without goals, set the yes/no state
        setQuitStatus(progress > 0 ? 'COMPLETE' : 'INCOMPLETE');
        setCurrentProgress(progressValue);
      }

      if (!isDateInFuture) {
        const streakData = await getHabitStreak(habit.user_email, habit.habitName, date);

        // Determine if the goal was reached
        const isGoalReached = habit.habitType === 'build' && habit.goalValue
          ? progressValue >= habit.goalValue  
          : progressValue === 1;  

        // For today's update
        if (isToday) {
          if (isGoalReached) {
            // Goal achieved - set streak to streakData (should be incremented by server)
            setStreak(streakData?.streak || 0);
          } else {
            // Goal not achieved - maintain previous streak
            const lastScheduledDate = await findLastScheduledDate(habit);
            if (lastScheduledDate) {
              const lastDateStr = lastScheduledDate.toISOString().split("T")[0];
              const lastStreakData = await getHabitStreak(habit.user_email, habit.habitName, lastDateStr);
              // Always maintain the previous streak regardless of progress value
              setStreak(lastStreakData?.streak || 0);
            } else {
              // No previous date found, maintain current streak
              setStreak(streakData?.streak || 0);
            }
          }
        } else {
          // For past dates, just use the streak from the database
          setStreak(streakData?.streak || 0);
        }
      }
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  // Deletes the current habit after user confirmation (platform-specific dialogs)
  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Are you sure you want to delete this habit?");
      if (!confirmed) return;
      try {
        await deleteHabit(habit.user_email, habit.habitName);
        window.alert("Habit deleted successfully");
        if (onDelete) onDelete();
      } catch (error) {
        window.alert("Error deleting habit");
        console.error('Error deleting habit:', error);
      }
    } else {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this habit?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              try {
                await deleteHabit(habit.user_email, habit.habitName);
                Alert.alert("Success", "Habit deleted successfully");
                if (onDelete) onDelete();
              } catch (error) {
                Alert.alert("Error", "Error deleting habit");
                console.error('Error deleting habit:', error);
              }
            },
            style: "destructive",
          },
        ]
      );
    }
  };

  // Opens the progress entry modal, fetching current progress (or falling back to local state)
  const openProgressEntry = async () => {
    // Don't allow editing future dates
    if (isDateInFuture) return;

    try {
      const progressData = await getHabitProgressByDateAndHabit(habit.user_email, habit.habitName, date);

      const progressValue = progressData && typeof progressData.progress !== 'undefined'
        ? progressData.progress
        : 0;

      setCurrentProgress(progressValue);
      setProgressModalVisible(true);
    } catch (error) {
      console.error('Error fetching habit progress:', error);
      
      const isBuildWithoutGoal = habit.habitType === 'build' &&
        (habit.goalValue === undefined || habit.goalValue === null);

      const progressValue = habit.habitType === 'build' && !isBuildWithoutGoal
        ? (buildProgress ? parseFloat(buildProgress) : 0)
        : (quitStatus === 'COMPLETE' ? 1 : 0);

      setCurrentProgress(progressValue);
      setProgressModalVisible(true);
    }
  };

  // Handles saving updated progress from the modal
  const handleSaveProgress = (progress: number) => {
    handleUpdate(progress);
  };

  return (
    <>
      <TouchableOpacity
        style={[HabitPanelStyles.habitPanel, { backgroundColor: habit.habitColor }]}
        onPress={openProgressEntry}
        disabled={isDateInFuture ?? false}
      >
        <View style={HabitPanelStyles.headerContainer}>
          <ThemedText style={HabitPanelStyles.habitName}>{habit.habitName}</ThemedText>
          {onEdit && (
            <View style={HabitPanelStyles.actionsContainer}>
              {/* Only show streak if date is not in the future */}
              {!isDateInFuture && (
                <>
                  <Text style={HabitPanelStyles.fireEmoji}>🔥</Text>
                  <Text style={HabitPanelStyles.streakCount}>{streak}</Text>
                </>
              )}
              <TouchableOpacity
                style={HabitPanelStyles.editButton}
                onPress={() => onEdit(habit)}
              >
                <IconSymbol name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={HabitPanelStyles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={HabitPanelStyles.deleteIcon}>×</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <ThemedText style={HabitPanelStyles.habitDescription}>{habit.habitDescription}</ThemedText>
        {habit.goalValue != null ? (
          <Text style={HabitPanelStyles.progressText}>
            {buildProgress !== '' ? parseFloat(buildProgress) : currentProgress}{" "}
            {habit.goalUnit} / {habit.goalValue} {habit.goalUnit}{" "}
            {parseFloat(buildProgress !== '' ? buildProgress : currentProgress.toString()) >= habit.goalValue ? "🏆" : "🚧"}
          </Text>
        ) : (
          <Text style={HabitPanelStyles.progressText}>
            {quitStatus === 'COMPLETE' ? "🏆" : "🚧"} {quitStatus}
          </Text>
        )}

      </TouchableOpacity>

      <ProgressEntry
        visible={progressModalVisible}
        onClose={() => setProgressModalVisible(false)}
        habit={habit}
        initialProgress={currentProgress}
        onSave={handleSaveProgress}
        isEditable={isToday ?? false}
      />
    </>
  );
};

export default HabitPanel;
