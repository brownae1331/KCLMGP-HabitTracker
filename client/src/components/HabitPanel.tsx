import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, Text, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText'; // Adjust path if needed
import { updateHabitProgress } from '../lib/client';

// Define the Habit interface (adjust if your structure is different)
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


interface HabitPanelProps {
  habit: Habit;
}

const HabitPanel: React.FC<HabitPanelProps> = ({ habit }) => {
  // For build habits: allow the user to enter progress
  const [buildProgress, setBuildProgress] = useState<string>('');
  // For quit habits: allow the user to select yes/no
  const [quitStatus, setQuitStatus] = useState<'yes' | 'no' | ''>('');
  // Local flag to indicate an update was made
  const [updated, setUpdated] = useState(false);

  const handleUpdate = async () => {
    try {
      const progressValue = habit.habitType === 'build' ? parseFloat(buildProgress) : quitStatus === 'yes' ? 1 : 0;
      await updateHabitProgress(habit.user_email, habit.habitName, progressValue);
      setUpdated(true);
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  return (
    <View style={[styles.habitPanel, { backgroundColor: habit.habitColor }]}>
      <ThemedText style={styles.habitName}>{habit.habitName}</ThemedText>
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
    </View>
  );
};

export default HabitPanel;

// Sample styles for HabitPanel. Adjust as needed.
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
});
