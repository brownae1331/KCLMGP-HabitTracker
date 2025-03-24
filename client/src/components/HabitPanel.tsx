import { updateHabitProgress, getHabitStreak, getHabitInterval, getHabitDays } from '../lib/client';
import { IconSymbol } from './ui/IconSymbol';
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, TextInput, Text, StyleSheet, Alert } from 'react-native';
import { ThemedText } from './ThemedText'; // Adjust path if needed
import { deleteHabit } from '../lib/client';


// Define the Habit interface (adjust if your structure is different)
export interface Habit {
  user_email: string; // this corresponds to user_email in your DB
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

interface HabitPanelProps {
  habit: Habit;
  onEdit?: (habit: Habit) => void;
  selectedDate?: Date;

  onDelete?: () => void;
}

const HabitPanel: React.FC<HabitPanelProps> = ({ habit, onDelete, onEdit, selectedDate }) => {
  // For build habits: allow the user to enter progress
  const [buildProgress, setBuildProgress] = useState<string>('');
  // For quit habits: allow the user to select yes/no
  const [quitStatus, setQuitStatus] = useState<'yes' | 'no' | ''>('');
  // Local flag to indicate an update was made
  const [updated, setUpdated] = useState(false);
  // Track the habit streak
  const [streak, setStreak] = useState<number>(0);

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
          setStreak(streakData.streak || 0);

          // If it's today and streak is 0, get the last occurrence's streak
          if (isToday && streakData.streak === 0) {
            // Find the last scheduled date for this habit
            const lastScheduledDate = await findLastScheduledDate(habit);
            if (lastScheduledDate) {
              const lastDateStr = lastScheduledDate.toISOString().split("T")[0];

              // Fetch last occurrence's streak
              const lastStreakData = await getHabitStreak(habit.user_email, habit.habitName, lastDateStr);
              if (lastStreakData.streak > 0) {
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

  // Add this helper function to find the last scheduled date for the habit
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
      else if (habit.scheduleOption === 'weekly') {
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

      // If we couldn't determine the specific last date, default to yesterday
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return yesterday;
    } catch (error) {
      console.error('Error finding last scheduled date:', error);
      return null;
    }
  };

  const handleUpdate = async () => {
    try {
      const progressValue = habit.habitType === 'build' ? parseFloat(buildProgress) : quitStatus === 'yes' ? 1 : 0;
      await updateHabitProgress(habit.user_email, habit.habitName, progressValue);
      setUpdated(true);

      if (!isDateInFuture) {
        const streakData = await getHabitStreak(habit.user_email, habit.habitName, date);

        // Determine if the goal was reached
        const isGoalReached = habit.habitType === 'build'
          ? (habit.goalValue !== undefined && habit.goalValue !== null && progressValue >= habit.goalValue)
          : (progressValue === 1); // For 'quit' habits, 1 means success

        // For today's update
        if (isToday) {
          if (isGoalReached) {
            // Goal achieved - set streak to streakData (should be incremented by server)
            setStreak(streakData.streak || 0);
          } else {
            // Goal not achieved - maintain previous streak
            const lastScheduledDate = await findLastScheduledDate(habit);
            if (lastScheduledDate) {
              const lastDateStr = lastScheduledDate.toISOString().split("T")[0];
              const lastStreakData = await getHabitStreak(habit.user_email, habit.habitName, lastDateStr);
              // Always maintain the previous streak regardless of progress value
              setStreak(lastStreakData.streak || 0);
            } else {
              // No previous date found, maintain current streak
              setStreak(streakData.streak || 0);
            }
          }
        } else {
          // For past dates, just use the streak from the database
          setStreak(streakData.streak || 0);
        }
      }
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteHabit(habit.user_email, habit.habitName);
      Alert.alert("Success", "Habit deleted successfully");
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      Alert.alert("Error", "Error deleting habit");
      console.error('Error deleting habit:', error);
    }
  };


  return (
    <View style={[styles.habitPanel, { backgroundColor: habit.habitColor }]}>
      <View style={styles.headerContainer}>
        <ThemedText style={styles.habitName}>{habit.habitName}</ThemedText>
        {onEdit && (
          <View style={styles.actionsContainer}>
            {/* Only show streak if date is not in the future */}
            {!isDateInFuture && (
              <>
                <Text style={styles.fireEmoji}>🔥</Text>
                <Text style={styles.streakCount}>{streak}</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(habit)}
            >
              <IconSymbol name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <ThemedText style={styles.habitDescription}>{habit.habitDescription}</ThemedText>
      {habit.goalValue != null && (
        <ThemedText style={styles.habitGoal}>
          Goal: {habit.goalValue} {habit.goalUnit}
        </ThemedText>
      )}
      {habit.habitType === 'build' ? (
        <View style={styles.updateContainer}>
          <Text style={styles.updateLabel}>Enter your progress:</Text>
          <TextInput
            style={styles.updateInput}
            placeholder="e.g. 10"
            keyboardType="numeric"
            value={buildProgress}
            onChangeText={setBuildProgress}
          />
        </View>
      ) : (
        <View style={styles.updateContainer}>
          <Text style={styles.updateLabel}>Did you quit? (yes/no)</Text>
          <View style={styles.yesNoContainer}>
            <TouchableOpacity
              style={[styles.yesNoButton, quitStatus === 'yes' && styles.selectedYesNo]}
              onPress={() => setQuitStatus('yes')}
            >
              <Text style={styles.yesNoText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yesNoButton, quitStatus === 'no' && styles.selectedYesNo]}
              onPress={() => setQuitStatus('no')}
            >
              <Text style={styles.yesNoText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
        <ThemedText style={styles.updateButtonText}>Update</ThemedText>
      </TouchableOpacity>
      {updated && (
        <ThemedText style={styles.updateStatus}>
          {habit.habitType === 'build'
            ? `Progress updated to ${buildProgress}`
            : `Quit status updated to ${quitStatus}`}
        </ThemedText>
      )}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <ThemedText style={styles.deleteButtonText}>Delete Habit</ThemedText>
      </TouchableOpacity>
    </View>
  );
};

export default HabitPanel;

const styles = StyleSheet.create({
  habitPanel: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  habitDescription: {
    fontSize: 14,
    color: '#fff',
    marginVertical: 5,
  },
  habitGoal: {
    fontSize: 14,
    color: '#fff',
  },
  updateContainer: {
    marginVertical: 10,
  },
  updateLabel: {
    color: '#fff',
    marginBottom: 5,
  },
  updateInput: {
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: 4,
    padding: 8,
  },
  yesNoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 5,
  },
  yesNoButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 4,
    width: '40%',
    alignItems: 'center',
  },
  selectedYesNo: {
    backgroundColor: '#fff',
  },
  yesNoText: {
    color: '#000',
    fontWeight: 'bold',
  },
  updateButton: {
    padding: 10,
    backgroundColor: '#00000080',
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  updateStatus: {
    marginTop: 10,
    color: '#fff',
    fontStyle: 'italic',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireEmoji: {
    marginRight: 5,
  },
  streakCount: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginRight: 8,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: '#ff4d4d',
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
