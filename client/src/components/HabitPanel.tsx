import { updateHabitProgress, getHabitStreak } from '../lib/client';
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

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        // Only fetch streak if date is not in the future
        if (!isDateInFuture) {
          const streakData = await getHabitStreak(habit.user_email, habit.habitName, date);
          setStreak(streakData.streak || 0);
        }
      } catch (error) {
        console.error('Error fetching habit streak:', error);
      }
    };

    fetchStreak();
  }, [habit, updated, date, isDateInFuture]);

  const handleUpdate = async () => {
    try {
      const progressValue = habit.habitType === 'build' ? parseFloat(buildProgress) : quitStatus === 'yes' ? 1 : 0;
      await updateHabitProgress(habit.user_email, habit.habitName, progressValue);
      setUpdated(true);

      if (!isDateInFuture) {
        const streakData = await getHabitStreak(habit.user_email, habit.habitName, date);
        setStreak(streakData.streak || 0);
      }
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

// HabitPanel.tsx
const handleDelete = async () => {
  try {
    await deleteHabit(habit.user_email, habit.habitName); 
    Alert.alert("Habit deleted successfully");
    // onDelete callback if needed
  } catch (error) {
    Alert.alert("Error deleting habit");
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
